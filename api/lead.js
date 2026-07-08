const crypto = require("crypto");

const phonePattern = /^(?:1[3-9]\d{9}|0\d{2,3}-?\d{7,8})$/;
const ipBuckets = new Map();
const recentPhones = new Map();
const usedNonces = new Map();
const minuteLimit = Number(process.env.LEAD_IP_MINUTE_LIMIT || 2);
const hourLimit = Number(process.env.LEAD_IP_HOUR_LIMIT || 30);
const phoneCooldownMs = Number(process.env.LEAD_PHONE_COOLDOWN_MS || 5 * 60 * 1000);
const apiSignWindowMs = Number(process.env.LEAD_API_SIGN_WINDOW_MS || 2 * 60 * 1000);
const sessionTtlMs = Number(process.env.LEAD_SESSION_TTL_MS || 2 * 60 * 60 * 1000);

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

function signPayload(secret, timestamp, nonce) {
  return crypto.createHmac("sha256", secret).update(`${timestamp}\n${nonce}`).digest("base64");
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

function pruneUsedNonces(now) {
  for (const [nonce, expiresAt] of usedNonces.entries()) {
    if (expiresAt <= now) {
      usedNonces.delete(nonce);
    }
  }
}

function getApiSignSecret() {
  return process.env.LEAD_API_SIGN_SECRET || process.env.LEAD_DELIVERY_SECRET;
}

function getSessionSecret() {
  return process.env.LEAD_SESSION_SECRET || getApiSignSecret();
}

function parseCookies(req) {
  return String(req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((cookies, part) => {
      const index = part.indexOf("=");

      if (index !== -1) {
        cookies[part.slice(0, index)] = decodeURIComponent(part.slice(index + 1));
      }

      return cookies;
    }, {});
}

function signSession(secret, timestamp, nonce) {
  return crypto.createHmac("sha256", secret).update(`${timestamp}\n${nonce}`).digest("base64url");
}

function verifySession(req) {
  const secret = getSessionSecret();

  if (!secret) {
    console.error("Lead session configuration is missing.");
    return false;
  }

  const session = parseCookies(req).bh_session;

  if (!session) {
    return false;
  }

  const [timestampRaw, nonce, signature] = session.split(".");
  const timestamp = Number(timestampRaw);

  if (!timestamp || !nonce || !signature) {
    return false;
  }

  if (Date.now() - timestamp > sessionTtlMs) {
    return false;
  }

  return timingSafeEqual(signature, signSession(secret, timestamp, nonce));
}

function issueSignatureToken(req, res) {
  const secret = getApiSignSecret();

  if (!secret) {
    console.error("Lead API signing configuration is missing.");
    json(res, 500, { ok: false, message: "服务异常，请重试" });
    return;
  }

  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString("hex");

  json(res, 200, {
    ok: true,
    timestamp,
    nonce,
    signature: signPayload(secret, timestamp, nonce)
  });
}

function verifyRequestSignature(req) {
  const secret = getApiSignSecret();

  if (!secret) {
    console.error("Lead API signing configuration is missing.");
    return false;
  }

  const timestamp = Number(req.headers["x-lead-timestamp"]);
  const nonce = String(req.headers["x-lead-nonce"] || "");
  const signature = String(req.headers["x-lead-signature"] || "");
  const now = Date.now();

  pruneUsedNonces(now);

  if (!timestamp || !nonce || !signature) {
    return false;
  }

  if (Math.abs(now - timestamp) > apiSignWindowMs) {
    return false;
  }

  if (usedNonces.has(nonce)) {
    return false;
  }

  const expectedSignature = signPayload(secret, timestamp, nonce);

  if (!timingSafeEqual(signature, expectedSignature)) {
    return false;
  }

  usedNonces.set(nonce, now + apiSignWindowMs);
  return true;
}

function getClientIp(req) {
  const forwardedFor = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();

  return forwardedFor || req.socket?.remoteAddress || "unknown";
}

function pruneTimestamps(timestamps, now, windowMs) {
  return timestamps.filter((timestamp) => now - timestamp < windowMs);
}

function isRateLimited(ip) {
  const now = Date.now();
  const bucket = ipBuckets.get(ip) || [];
  const recentHour = pruneTimestamps(bucket, now, 60 * 60 * 1000);
  const recentMinute = pruneTimestamps(recentHour, now, 60 * 1000);

  if (recentMinute.length >= minuteLimit || recentHour.length >= hourLimit) {
    ipBuckets.set(ip, recentHour);
    return true;
  }

  recentHour.push(now);
  ipBuckets.set(ip, recentHour);
  return false;
}

function isDuplicatePhone(phone) {
  const now = Date.now();
  const lastSubmittedAt = recentPhones.get(phone);

  for (const [storedPhone, submittedAt] of recentPhones.entries()) {
    if (now - submittedAt >= phoneCooldownMs) {
      recentPhones.delete(storedPhone);
    }
  }

  if (lastSubmittedAt && now - lastSubmittedAt < phoneCooldownMs) {
    return true;
  }

  recentPhones.set(phone, now);
  return false;
}

function parseAllowedOrigins() {
  return String(process.env.LEAD_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function getRequestOrigin(req) {
  const origin = String(req.headers.origin || "").trim();

  if (origin) {
    return origin;
  }

  const referer = String(req.headers.referer || "").trim();

  if (!referer) {
    return "";
  }

  try {
    return new URL(referer).origin;
  } catch (error) {
    return "";
  }
}

function isAllowedOrigin(req) {
  const requestOrigin = getRequestOrigin(req);

  if (!requestOrigin) {
    return process.env.LEAD_ALLOW_EMPTY_ORIGIN === "true";
  }

  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").trim();
  const allowedOrigins = new Set(parseAllowedOrigins());

  if (host) {
    allowedOrigins.add(`http://${host}`);
    allowedOrigins.add(`https://${host}`);
  }

  return allowedOrigins.has(requestOrigin);
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
  const pathname = new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname;

  if (pathname === "/api/lead-token") {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      json(res, 405, { ok: false, message: "服务异常，请重试" });
      return;
    }

    if (!isAllowedOrigin(req)) {
      console.warn("Lead token rejected by origin check.", {
        origin: getRequestOrigin(req),
        host: req.headers.host
      });
      json(res, 403, { ok: false, message: "服务异常，请重试" });
      return;
    }

    if (!verifySession(req)) {
      console.warn("Lead token rejected by session check.", { ip: getClientIp(req) });
      json(res, 403, { ok: false, message: "服务异常，请重试" });
      return;
    }

    issueSignatureToken(req, res);
    return;
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    json(res, 405, { ok: false, message: "服务异常，请重试" });
    return;
  }

  if (!isAllowedOrigin(req)) {
    console.warn("Lead submit rejected by origin check.", {
      origin: getRequestOrigin(req),
      host: req.headers.host
    });
    json(res, 403, { ok: false, message: "服务异常，请重试" });
    return;
  }

  if (!verifySession(req)) {
    console.warn("Lead submit rejected by session check.", { ip: getClientIp(req) });
    json(res, 403, { ok: false, message: "服务异常，请重试" });
    return;
  }

  if (!verifyRequestSignature(req)) {
    console.warn("Lead submit rejected by signature check.", { ip: getClientIp(req) });
    json(res, 403, { ok: false, message: "服务异常，请重试" });
    return;
  }

  const clientIp = getClientIp(req);

  if (isRateLimited(clientIp)) {
    console.warn("Lead submit rate limited.", { ip: clientIp });
    json(res, 429, { ok: false, message: "提交过于频繁，请稍后再试。" });
    return;
  }

  const deliveryUrl = process.env.LEAD_DELIVERY_URL;
  const deliverySecret = process.env.LEAD_DELIVERY_SECRET;

  if (!deliveryUrl || !deliverySecret) {
    console.error("Lead delivery configuration is missing.");
    json(res, 500, { ok: false, message: "服务异常，请重试" });
    return;
  }

  try {
    const body = await readBody(req);

    if (clean(body.website, 200)) {
      console.warn("Lead submit ignored by honeypot.", { ip: clientIp });
      json(res, 200, { ok: true });
      return;
    }

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

    if (isDuplicatePhone(lead.phone)) {
      json(res, 429, { ok: false, message: "提交过于频繁，请稍后再试。" });
      return;
    }

    const deliveryResponse = await fetch(getSignedWebhookUrl(deliveryUrl, deliverySecret), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildMarkdownMessage(lead))
    });
    const result = await deliveryResponse.json().catch(() => ({}));

    if (!deliveryResponse.ok || result.errcode !== 0) {
      console.error("Lead delivery failed.", {
        status: deliveryResponse.status,
        errcode: result.errcode,
        errmsg: result.errmsg
      });
      json(res, 502, { ok: false, message: "服务异常，请重试" });
      return;
    }

    json(res, 200, { ok: true });
  } catch (error) {
    console.error("Lead submit failed.", error);
    json(res, 500, { ok: false, message: "服务异常，请重试" });
  }
};
