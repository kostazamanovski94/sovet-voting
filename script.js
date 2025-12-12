"use strict";

// Admin password
const ADMIN_PASSWORD = "admin123";

document.addEventListener("DOMContentLoaded", function () {
  // HTML elements
  const adminLoginSection = document.getElementById("admin-login-section");
  const setupSection      = document.getElementById("setup-section");
  const votingSection     = document.getElementById("voting-section");
  const resultsSection    = document.getElementById("results-section");

  const adminPasswordInput = document.getElementById("adminPassword");
  const adminLoginBtn      = document.getElementById("adminLoginBtn");

  // Show only admin login at start
  if (adminLoginSection) adminLoginSection.classList.remove("hidden");
  if (setupSection)      setupSection.classList.add("hidden");
  if (votingSection)     votingSection.classList.add("hidden");
  if (resultsSection)    resultsSection.classList.add("hidden");

  // Click on "Najavi se kako admin"
  adminLoginBtn.addEventListener("click", function () {
    const entered = adminPasswordInput.value.trim();

    if (entered === ADMIN_PASSWORD) {
      alert("Uspesno najavuvanje kako admin.");
      adminPasswordInput.value = "";
      if (adminLoginSection) adminLoginSection.classList.add("hidden");
      if (setupSection)      setupSection.classList.remove("hidden");
    } else {
      alert("Netocna admin sifra.");
    }
  });
});
