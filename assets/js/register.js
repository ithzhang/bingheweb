const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const form = document.querySelector("[data-lead-form]");
const submitButton = document.querySelector("[data-submit-button]");
const formStatus = document.querySelector("[data-form-status]");
const errorNodes = document.querySelectorAll("[data-error-for]");

const phonePattern = /^(?:1[3-9]\d{9}|0\d{2,3}-?\d{7,8})$/;

function closeNav() {
  nav.classList.remove("open");
  navToggle.classList.remove("active");
  navToggle.setAttribute("aria-expanded", "false");
  document.body.classList.remove("nav-open");
}

function setFieldError(fieldName, message) {
  const errorNode = [...errorNodes].find((node) => node.dataset.errorFor === fieldName);

  if (errorNode) {
    errorNode.textContent = message;
  }
}

function clearErrors() {
  errorNodes.forEach((node) => {
    node.textContent = "";
  });
}

function normalizePhone(phone) {
  return phone.replace(/\s+/g, "").replace(/[()（）]/g, "");
}

function getFormValues() {
  const formData = new FormData(form);

  return {
    customerName: String(formData.get("customerName") || "").trim(),
    phone: normalizePhone(String(formData.get("phone") || "").trim()),
    request: String(formData.get("request") || "").trim()
  };
}

function validate(values) {
  let valid = true;
  clearErrors();

  if (!values.customerName) {
    setFieldError("customerName", "请输入客户名称。");
    valid = false;
  }

  if (!values.phone) {
    setFieldError("phone", "请输入联系电话。");
    valid = false;
  } else if (!phonePattern.test(values.phone)) {
    setFieldError("phone", "电话格式不正确，请填写 11 位手机号或区号加固定电话。");
    valid = false;
  }

  if (!values.request) {
    setFieldError("request", "请输入诉求。");
    valid = false;
  }

  return valid;
}

function setStatus(message, type = "") {
  formStatus.textContent = message;
  formStatus.classList.toggle("success", type === "success");
  formStatus.classList.toggle("error", type === "error");
}

async function submitLead(values) {
  const response = await fetch("/api/lead", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(values)
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || !result.ok) {
    throw new Error(result.message || "提交失败，请稍后再试。");
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

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const values = getFormValues();

  if (!validate(values)) {
    setStatus("请先修正表单中的提示。", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "提交中...";
  setStatus("正在提交，请稍候。");

  try {
    await submitLead(values);
    form.reset();
    clearErrors();
    setStatus("登记成功，我们会尽快联系您。", "success");
  } catch (error) {
    const message = error.message === "Failed to fetch"
      ? "提交接口暂不可用，请确认站点已部署服务端 /api/lead 接口。"
      : error.message;
    setStatus(message, "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "提交登记";
  }
});

document.querySelectorAll(".reveal").forEach((element) => {
  element.classList.add("visible");
});
