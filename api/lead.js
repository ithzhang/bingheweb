const crypto = require("crypto");

const phonePattern = /^(?:1[3-9]\d{9}|0\d{2,3}-?\d{7,8})$/;

function json(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";

    req.on("data", (chunk) => {
      raw += chunk;

      if (raw.length > 1024 * 1024) {
        reject(new Error("请求内容过大。"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(new Error("请求格式不正确。"));
      }
    });

    req.on("error", reject);
  });
}

function clean(value, maxLength) {
  return String(value || "")
    .trim()
    .replace(/\r\n/g, "\n")
    .slice(0, maxLength);
}

function normalizePhone(phone) {
  return phone.replace(/\s+/g, "").replace(/[()（）]/g, "");
}

function escapeMarkdown(value) {
  return value.replace(/[\\`*_{}[\]()#+\-.!|>]/g, "\\$&");
}

function getSignedWebhookUrl(webhookUrl, secret) {
  const timestamp = Date.now();
  const stringToSign = `${timestamp}\n${secret}`;
  const sign = crypto.createHmac("sha256", secret).update(stringToSign).digest("base64");
  const url = new URL(webhookUrl);

  url.searchParams.set("timestamp", String(timestamp));
  url.searchParams.set("sign", sign);

  return url.toString();
}

function buildMarkdownMessage(lead) {
  const submittedAt = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date());

  return {
    msgtype: "markdown",
    markdown: {
      title: "新客户登记",
      text: [
        "### 新客户登记",
        "",
        `- **客户名称**：${escapeMarkdown(lead.customerName)}`,
        `- **联系电话**：${escapeMarkdown(lead.phone)}`,
        `- **提交时间**：${escapeMarkdown(submittedAt)}`,
        "",
        "**客户诉求**",
        "",
        escapeMarkdown(lead.request)
      ].join("\n")
    },
    at: {
      isAtAll: false
    }
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    json(res, 405, { ok: false, message: "仅支持 POST 提交。" });
    return;
  }

  const webhookUrl = process.env.DINGTALK_WEBHOOK_URL;
  const secret = process.env.DINGTALK_SECRET;

  if (!webhookUrl || !secret) {
    json(res, 500, { ok: false, message: "服务端未配置钉钉机器人参数。" });
    return;
  }

  try {
    const body = await readBody(req);
    const lead = {
      customerName: clean(body.customerName, 60),
      phone: normalizePhone(clean(body.phone, 18)),
      request: clean(body.request, 600)
    };

    if (!lead.customerName || !lead.phone || !lead.request) {
      json(res, 400, { ok: false, message: "请完整填写客户名称、联系电话和诉求。" });
      return;
    }

    if (!phonePattern.test(lead.phone)) {
      json(res, 400, { ok: false, message: "联系电话格式不正确。" });
      return;
    }

    const dingTalkResponse = await fetch(getSignedWebhookUrl(webhookUrl, secret), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildMarkdownMessage(lead))
    });
    const result = await dingTalkResponse.json().catch(() => ({}));

    if (!dingTalkResponse.ok || result.errcode !== 0) {
      json(res, 502, { ok: false, message: result.errmsg || "钉钉机器人推送失败。" });
      return;
    }

    json(res, 200, { ok: true });
  } catch (error) {
    json(res, 500, { ok: false, message: error.message || "提交失败，请稍后再试。" });
  }
};
