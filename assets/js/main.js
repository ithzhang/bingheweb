const services = [
  {
    kicker: "01 / AI Search",
    title: "AI搜索优化",
    body: "围绕AI问答、搜索引擎和行业内容场景，梳理企业品牌、产品、关键词与内容资产，提升企业在新搜索环境中的曝光和可信呈现。",
    points: [
      "品牌信息、业务关键词和问答内容体系搭建",
      "官网页面语义、标题结构和行业内容优化",
      "面向AI搜索和传统SEO的持续运营建议"
    ]
  },
  {
    kicker: "02 / Software Development",
    title: "软件开发",
    body: "围绕企业内部流程、客户管理、订单协同、数据看板等实际场景，提供从需求建模、原型设计、开发测试到部署上线的完整开发服务。",
    points: [
      "Web管理系统、业务后台和数据工具开发",
      "客户线索、订单流程、权限体系和报表能力",
      "接口集成、上线部署、日常维护和功能迭代"
    ]
  },
  {
    kicker: "03 / SEO · Keywords",
    title: "SEO关键词优化",
    body: "围绕企业核心产品、服务区域和目标客户，规划关键词结构、官网内容和长期排名策略，帮助企业获得更稳定的自然搜索流量。",
    points: [
      "行业词、产品词、区域词和长尾词梳理",
      "官网标题、描述、栏目结构与内容页优化",
      "关键词排名跟踪、内容迭代和线索承接建议"
    ]
  },
  {
    kicker: "04 / Douyin Operation",
    title: "抖音深度代运营",
    body: "面向企业短视频获客和品牌曝光需求，提供账号定位、内容策划、素材制作、投放执行和数据复盘的一体化运营支持。",
    points: [
      "账号定位、内容选题和短视频脚本规划",
      "信息流投放、线索表单和咨询承接链路搭建",
      "曝光、点击、线索和转化数据复盘优化"
    ]
  },
  {
    kicker: "05 / B2B · Marketing",
    title: "爱采购与营销推广",
    body: "面向传统企业线上获客需求，整合百度爱采购、官网、关键词、短视频和销售承接，帮助企业打通从曝光到询盘的运营链路。",
    points: [
      "百度爱采购店铺搭建、产品发布和排名优化",
      "B2B平台内容运营、商机跟进和数据报表",
      "传统企业推广方案、线索承接和转化路径设计"
    ]
  },
  {
    kicker: "06 / Website Design",
    title: "高端网站建设",
    body: "围绕企业品牌展示、获客转化和长期内容运营，提供企业官网设计、品牌网站设计与响应式页面建设服务。",
    points: [
      "企业官网设计、品牌网站设计和落地页设计",
      "首页、服务页、案例页、联系页等官网信息架构",
      "移动端适配、基础SEO结构和线索承接入口"
    ]
  }
];

const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const serviceButtons = document.querySelectorAll("[data-service]");
const servicePanel = document.querySelector("[data-service-panel]");
const sectionLinks = document.querySelectorAll("[data-section-link]");
const sections = document.querySelectorAll("[data-section]");
const chatOpenButton = document.querySelector("[data-chat-open]");
const chatCloseButton = document.querySelector("[data-chat-close]");
const chatbot = document.querySelector("[data-chatbot]");
const chatDragHandle = document.querySelector("[data-chat-drag-handle]");
const chatBody = document.querySelector("[data-chat-body]");
const chatTime = document.querySelector("[data-chat-time]");
const chatOptionButtons = document.querySelectorAll("[data-chat-option]");
const registerOpenButtons = document.querySelectorAll("[data-register-open]");
const registerCloseButtons = document.querySelectorAll("[data-register-close]");
const leadModal = document.querySelector("[data-lead-modal]");
const leadForm = document.querySelector("[data-lead-form]");
const leadSubmitButton = document.querySelector("[data-submit-button]");
const leadFormStatus = document.querySelector("[data-form-status]");
const leadPhonePattern = /^(?:1[3-9]\d{9}|0\d{2,3}-?\d{7,8})$/;
let chatDragState = null;

const chatReplies = {
  cases: {
    label: "咨询产品和同行案例",
    reply: "我们为各行业企业提供一站式全链路数字化增长解决方案，业务版图覆盖搜索引擎营销（SEM/SEO 全域投放优化）、短视频全域内容创作与流量投放、全周期品牌声誉塑造与全域品牌推广，是多家大型企业深度合作提供商。请您提供下您的公司名称和联系电话，给您具体介绍。"
  },
  solution: {
    label: "咨询营销与解决方案",
    reply: "我们提供国内营销与销售解决方案，让企业实现AI时代的快速增长！请您提供下公司名称和联系电话，给您具体介绍。"
  },
  agent: {
    label: "咨询如何代理产品",
    reply: "请您提供下公司名称和联系电话，渠道经理会给您具体沟通。"
  },
  contact: {
    label: "联系方式",
    reply: `
      <div class="chat-reply">
        <p class="chat-reply-title">您可以直接电话联系：</p>
        <div class="chat-contact-line">
          <span>华东地区</span>
          <b>陈总</b>
          <a href="tel:18958065538">18958065538</a>
        </div>
        <div class="chat-contact-line">
          <span>其余全域</span>
          <b>李总</b>
          <a href="tel:13113577393">13113577393</a>
        </div>
        <p class="chat-reply-note">也可以先说明您的行业、城市和想咨询的方向，我们会尽快安排对接。</p>
      </div>
    `
  }
};

function setHeaderState() {
  header.classList.toggle("scrolled", window.scrollY > 24);
}

function closeNav() {
  nav.classList.remove("open");
  navToggle.classList.remove("active");
  navToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("nav-open");
}

function renderService(index) {
  const item = services[index];
  servicePanel.innerHTML = `
    <p class="detail-kicker">${item.kicker}</p>
    <h3>${item.title}</h3>
    <p>${item.body}</p>
    <ul>${item.points.map((point) => `<li>${point}</li>`).join("")}</ul>
  `;

  serviceButtons.forEach((button, buttonIndex) => {
    const active = buttonIndex === index;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
}

function updateChatTime() {
  if (!chatTime) {
    return;
  }

  chatTime.textContent = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(new Date());
}

function openChatbot() {
  chatbot.classList.add("open");
  chatbot.setAttribute("aria-hidden", "false");
  updateChatTime();
  window.requestAnimationFrame(() => {
    keepChatbotInViewport();
    scrollChatToBottom();
  });
}

function closeChatbot() {
  chatbot.classList.remove("open");
  chatbot.setAttribute("aria-hidden", "true");
}

function clampChatbotPosition(left, top) {
  const rect = chatbot.getBoundingClientRect();
  const margin = 10;
  const maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
  const maxTop = Math.max(margin, window.innerHeight - rect.height - margin);

  return {
    left: Math.min(Math.max(left, margin), maxLeft),
    top: Math.min(Math.max(top, margin), maxTop)
  };
}

function setChatbotPosition(left, top) {
  const nextPosition = clampChatbotPosition(left, top);

  chatbot.style.left = `${nextPosition.left}px`;
  chatbot.style.top = `${nextPosition.top}px`;
  chatbot.style.right = "auto";
  chatbot.style.bottom = "auto";
  chatbot.style.transform = "none";
}

function keepChatbotInViewport() {
  if (!chatbot || !chatbot.style.left || !chatbot.style.top) {
    return;
  }

  setChatbotPosition(parseFloat(chatbot.style.left), parseFloat(chatbot.style.top));
}

function startChatbotDrag(event) {
  if (!chatbot || !chatbot.classList.contains("open")) {
    return;
  }

  if (event.pointerType === "mouse" && event.button !== 0) {
    return;
  }

  if (event.target.closest("button, a, input, textarea, select")) {
    return;
  }

  const rect = chatbot.getBoundingClientRect();
  chatDragState = {
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top
  };

  chatbot.classList.add("is-dragging");
  setChatbotPosition(rect.left, rect.top);

  if (chatDragHandle.setPointerCapture) {
    chatDragHandle.setPointerCapture(event.pointerId);
  }

  event.preventDefault();
}

function moveChatbot(event) {
  if (!chatDragState || event.pointerId !== chatDragState.pointerId) {
    return;
  }

  setChatbotPosition(
    event.clientX - chatDragState.offsetX,
    event.clientY - chatDragState.offsetY
  );
  event.preventDefault();
}

function stopChatbotDrag(event) {
  if (!chatDragState || event.pointerId !== chatDragState.pointerId) {
    return;
  }

  chatbot.classList.remove("is-dragging");
  chatDragState = null;
}

function scrollChatToBottom() {
  chatBody.scrollTop = chatBody.scrollHeight;
}

function appendChatMessage(type, content) {
  const row = document.createElement("div");
  row.className = `chat-row ${type}`;

  if (type === "bot") {
    const avatar = document.createElement("div");
    avatar.className = "chat-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = "BH";
    row.appendChild(avatar);
  }

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";
  bubble.innerHTML = content.trim().startsWith("<") ? content : `<p>${content}</p>`;
  row.appendChild(bubble);
  chatBody.insertBefore(row, chatTime);
  scrollChatToBottom();
}

function replyToChatOption(optionKey) {
  const selected = chatReplies[optionKey];

  if (!selected) {
    return;
  }

  openChatbot();
  appendChatMessage("user", selected.label);

  window.setTimeout(() => {
    appendChatMessage("bot", selected.reply);
  }, 260);
}

function openLeadModal() {
  leadModal.classList.add("open");
  leadModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("lead-modal-open");
  window.setTimeout(() => {
    const firstInput = leadModal.querySelector("input");
    if (firstInput) {
      firstInput.focus();
    }
  }, 80);
}

function closeLeadModal() {
  leadModal.classList.remove("open");
  leadModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lead-modal-open");
}

function getLeadErrorNode(fieldName) {
  return leadForm.querySelector(`[data-error-for="${fieldName}"]`);
}

function setLeadError(fieldName, message) {
  const errorNode = getLeadErrorNode(fieldName);

  if (errorNode) {
    errorNode.textContent = message;
  }
}

function clearLeadErrors() {
  leadForm.querySelectorAll("[data-error-for]").forEach((node) => {
    node.textContent = "";
  });
}

function normalizeLeadPhone(phone) {
  return phone.replace(/\s+/g, "").replace(/[()（）]/g, "");
}

function getLeadFormValues() {
  const formData = new FormData(leadForm);

  return {
    customerName: String(formData.get("customerName") || "").trim(),
    phone: normalizeLeadPhone(String(formData.get("phone") || "").trim()),
    request: String(formData.get("request") || "").trim(),
    website: String(formData.get("website") || "").trim()
  };
}

function validateLeadForm(values) {
  let valid = true;
  clearLeadErrors();

  if (!values.customerName) {
    setLeadError("customerName", "请输入客户名称。");
    valid = false;
  }

  if (!values.phone) {
    setLeadError("phone", "请输入联系电话。");
    valid = false;
  } else if (!leadPhonePattern.test(values.phone)) {
    setLeadError("phone", "电话格式不正确，请填写 11 位手机号或区号加固定电话。");
    valid = false;
  }

  if (!values.request) {
    setLeadError("request", "请输入诉求。");
    valid = false;
  }

  return valid;
}

function setLeadStatus(message, type = "") {
  leadFormStatus.textContent = message;
  leadFormStatus.classList.toggle("success", type === "success");
  leadFormStatus.classList.toggle("error", type === "error");
}

async function submitLead(values) {
  const tokenResponse = await fetch("/api/lead-token");
  const token = await tokenResponse.json().catch(() => ({}));

  if (!tokenResponse.ok || !token.ok) {
    throw new Error(token.message || "服务异常，请重试");
  }

  const response = await fetch("/api/lead", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Lead-Timestamp": String(token.timestamp),
      "X-Lead-Nonce": token.nonce,
      "X-Lead-Signature": token.signature
    },
    body: JSON.stringify(values)
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.ok) {
    throw new Error(result.message || "服务异常，请重试");
  }

  return result;
}

navToggle.addEventListener("click", () => {
  const nextState = !nav.classList.contains("open");
  nav.classList.toggle("open", nextState);
  navToggle.classList.toggle("active", nextState);
  navToggle.setAttribute("aria-expanded", String(nextState));
  document.body.classList.toggle("nav-open", nextState);
});

nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    closeNav();
  }
});

serviceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    renderService(Number(button.dataset.service));
  });
});

if (chatOpenButton && chatbot && chatBody) {
  chatOpenButton.addEventListener("click", openChatbot);
}

if (chatCloseButton && chatbot) {
  chatCloseButton.addEventListener("click", closeChatbot);
}

if (chatDragHandle && chatbot) {
  chatDragHandle.addEventListener("pointerdown", startChatbotDrag);
  window.addEventListener("pointermove", moveChatbot);
  window.addEventListener("pointerup", stopChatbotDrag);
  window.addEventListener("pointercancel", stopChatbotDrag);
}

chatOptionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    replyToChatOption(button.dataset.chatOption);
  });
});

registerOpenButtons.forEach((button) => {
  button.addEventListener("click", openLeadModal);
});

registerCloseButtons.forEach((button) => {
  button.addEventListener("click", closeLeadModal);
});

if (leadForm) {
  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const values = getLeadFormValues();

    if (!validateLeadForm(values)) {
      setLeadStatus("请先修正表单中的提示。", "error");
      return;
    }

    leadSubmitButton.disabled = true;
    leadSubmitButton.textContent = "提交中...";
    setLeadStatus("正在提交，请稍候。");

    try {
      await submitLead(values);
      leadForm.reset();
      clearLeadErrors();
      setLeadStatus("");
      alert("登记成功，我们会尽快联系您。");
      closeLeadModal();
    } catch (error) {
      const message = error.message === "Failed to fetch"
        ? "服务异常，请重试"
        : error.message;
      setLeadStatus(message, "error");
    } finally {
      leadSubmitButton.disabled = false;
      leadSubmitButton.textContent = "提交登记";
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (chatbot && event.key === "Escape" && chatbot.classList.contains("open")) {
    closeChatbot();
  }

  if (leadModal && event.key === "Escape" && leadModal.classList.contains("open")) {
    closeLeadModal();
  }
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

const sectionObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) {
      return;
    }

    sectionLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.sectionLink === visible.target.id);
    });
  },
  { rootMargin: "-30% 0px -55% 0px", threshold: [0.1, 0.35, 0.65] }
);

sections.forEach((section) => {
  sectionObserver.observe(section);
});

window.addEventListener("scroll", setHeaderState, { passive: true });
window.addEventListener("resize", () => {
  if (window.innerWidth > 780) {
    closeNav();
  }

  keepChatbotInViewport();
});

setHeaderState();
renderService(0);
updateChatTime();
