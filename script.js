// МИНИМАЛНА ВЕРЗИЈА САМО ЗА ТЕСТ

// Админ шифра
const ADMIN_PASSWORD = "admin123";

// Земаме елементи од HTML
const adminLoginSection = document.getElementById("admin-login-section");
const setupSection      = document.getElementById("setup-section");
const votingSection     = document.getElementById("voting-section");
const resultsSection    = document.getElementById("results-section");

const adminPasswordInput = document.getElementById("adminPassword");
const adminLoginBtn      = document.getElementById("adminLoginBtn");

// Почетно: само админ делот да се гледа
adminLoginSection.classList.remove("hidden");
if (setupSection)   setupSection.classList.add("hidden");
if (votingSection)  votingSection.classList.add("hidden");
if (resultsSection) resultsSection.classList.add("hidden");

// Кога ќе кликнеме на „Најави се како админ“
adminLoginBtn.addEventListener("click", () => {
  const entered = adminPasswordInput.value.trim();
  if (entered === ADMIN_PASSWORD) {
    alert("Успешна најава како админ ✅");
    adminPasswordInput.value = "";
    adminLoginSection.classList.add("hidden");
    if (setupSection) setupSection.classList.remove("hidden");
  } else {
    alert("Неточна админ шифра ❌");
  }
});
