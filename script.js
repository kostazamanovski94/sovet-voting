"use strict";

// МИНИМАЛЕН СКРИПТ ЗА ТЕСТ

const ADMIN_PASSWORD = "admin123";

document.addEventListener("DOMContentLoaded", function () {
  const adminLoginSection = document.getElementById("admin-login-section");
  const setupSection      = document.getElementById("setup-section");

  const adminPasswordInput = document.getElementById("adminPassword");
  const adminLoginBtn      = document.getElementById("adminLoginBtn");

  // почетно: само админ да се гледа
  adminLoginSection.classList.remove("hidden");
  if (setupSection) setupSection.classList.add("hidden");

  adminLoginBtn.addEventListener("click", function () {
    const entered = adminPasswordInput.value.trim();
    if (entered === ADMIN_PASSWORD) {
      alert("Успешна најава како админ.");
      adminPasswordInput.value = "";
      adminLoginSection.classList.add("hidden");
      if (setupSection) setupSection.classList.remove("hidden");
    } else {
      alert("Неточна админ шифра.");
    }
  });
});
