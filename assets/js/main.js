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
const chatBody = document.querySelector("[data-chat-body]");
const chatTime = document.querySelector("[data-chat-time]");
const chatOptionButtons = document.querySelectorAll("[data-chat-option]");

const chatReplies = {
  cases: {
    label: "咨询产品和同行案例",
    reply: "我们主要提供AI搜索优化、SEO关键词优化、抖音代运营、百度爱采购代运营、软件开发和高端网站建设。同行案例通常会结合行业、产品客单价、获客渠道和投放阶段来拆解，您可以留下行业方向，我们会安排顾问给您匹配相近案例。"
  },
  solution: {
    label: "咨询营销与解决方案",
    reply: "我们会先看企业当前的官网、搜索曝光、短视频账号、B2B平台和线索承接情况，再给出AI搜索优化、SEO内容建设、短视频获客、爱采购运营或官网升级的组合方案，目标是把曝光转成可跟进的商机。"
  },
  agent: {
    label: "咨询如何代理产品",
    reply: "代理合作可以围绕区域资源、行业客户、项目交付能力和销售跟进方式来沟通。我们可以提供产品服务包、售前方案、交付支持和客户运营建议，适合有企业客户资源或本地服务能力的合作伙伴。"
  },
  contact: {
    label: "联系方式",
    reply: "您可以直接电话联系：华东地区陈总 <a href=\"tel:18958065538\">18958065538</a>；其余全域李总 <a href=\"tel:13113577393\">13113577393</a>。也可以先说明您的行业、城市和想咨询的方向，我们会尽快安排对接。"
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
}

function closeChatbot() {
  chatbot.classList.remove("open");
  chatbot.setAttribute("aria-hidden", "true");
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
  bubble.innerHTML = `<p>${content}</p>`;
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

chatOptionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    replyToChatOption(button.dataset.chatOption);
  });
});

document.addEventListener("keydown", (event) => {
  if (chatbot && event.key === "Escape" && chatbot.classList.contains("open")) {
    closeChatbot();
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
});

setHeaderState();
renderService(0);
updateChatTime();
