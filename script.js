"use strict";

// =======================
// КОНФИГУРАЦИЈА
// =======================

// Админ шифра
const ADMIN_PASSWORD = "admin123";

// Советници и нивни шифри
const COUNCILORS = [
  { name: "Советник 1",  password: "1111" },
  { name: "Советник 2",  password: "2222" },
  { name: "Советник 3",  password: "3333" },
  { name: "Советник 4",  password: "4444" },
  { name: "Советник 5",  password: "5555" },
  { name: "Советник 6",  password: "6666" },
  { name: "Советник 7",  password: "7777" },
  { name: "Советник 8",  password: "8888" },
  { name: "Советник 9",  password: "9999" },
  { name: "Советник 10", password: "1010" },
  { name: "Советник 11", password: "1110" },
  { name: "Советник 12", password: "1212" },
  { name: "Советник 13", password: "1313" },
  { name: "Советник 14", password: "1414" },
  { name: "Советник 15", password: "1515" }
];

// Минимум гласови „ЗА“ за да биде усвоена точката
const MAJORITY_ZA = 8;

// =======================
// СОСТОЈБА
// =======================

let agendaItems = [];              // листа на точки (string)
let currentItemIndex = 0;          // која точка е активна
let allVotes = [];                 // allVotes[i] = { indexNaSovetnik: "za/protiv/vozdrzan" }
let currentLoggedCouncilorIndex = null;

// =======================
// MAIN
// =======================

document.addEventListener("DOMContentLoaded", function () {
  // -------------------------------
  // DETECT MODE FROM URL
  // ?mode=admin  → отвора админ
  // ?mode=voting → директно гласање
  // -------------------------------
  const urlParams = new URLSearchParams(window.location.search);
  const MODE = urlParams.get("mode");

  if (MODE === "voting") {
      // ако нема точки внесено → не можеме да гласаат
      const savedAgenda = localStorage.getItem("agendaItems");
      const savedVotes = localStorage.getItem("allVotes");

      if (!savedAgenda) {
          alert("Во моментот нема активна седница за гласање.");
          return;
      }

      // зачувани точки
      agendaItems = JSON.parse(savedAgenda);
      allVotes = JSON.parse(savedVotes) || agendaItems.map(()=> ({}));
      currentItemIndex = 0;

      // скриј админ
      adminLoginSection.classList.add("hidden");
      setupSection.classList.add("hidden");

      // покажи гласање
      votingSection.classList.remove("hidden");
      resultsSection.classList.add("hidden");

      showCurrentAgendaItem();
      return;  // важно!
  }

  if (MODE === "admin") {
      showOnlyAdmin();
      return;
  }

  // ---------- DOM елементи ----------

  const adminLoginSection = document.getElementById("admin-login-section");
  const setupSection      = document.getElementById("setup-section");
  const votingSection     = document.getElementById("voting-section");
  const resultsSection    = document.getElementById("results-section");

  const adminPasswordInput = document.getElementById("adminPassword");
  const adminLoginBtn      = document.getElementById("adminLoginBtn");

  const agendaInput = document.getElementById("agendaInput");
  const startBtn    = document.getElementById("startBtn");

  const currentAgendaTitle     = document.getElementById("currentAgendaTitle");
  const councilorSelect        = document.getElementById("councilorSelect");
  const councilorPasswordInput = document.getElementById("councilorPassword");
  const councilorLoginBtn      = document.getElementById("councilorLoginBtn");
  const loggedCouncilorInfo    = document.getElementById("loggedCouncilorInfo");

  const voteArea = document.getElementById("voteArea");
  const btnZa        = document.getElementById("btnZa");
  const btnProtiv    = document.getElementById("btnProtiv");
  const btnVozdrzan  = document.getElementById("btnVozdrzan");

  const currentTotalVotesSpan = document.getElementById("currentTotalVotes");
  const currentZaSpan         = document.getElementById("currentZa");
  const currentProtivSpan     = document.getElementById("currentProtiv");
  const currentVozdrzaniSpan  = document.getElementById("currentVozdrzani");
  const nextBtn               = document.getElementById("nextBtn");

  const liveResultsTableBody = document.querySelector("#liveResultsTable tbody");
  const resultsTableBody     = document.querySelector("#resultsTable tbody");

  // ---------- Помошни функции ----------

  function showOnlyAdmin() {
    adminLoginSection.classList.remove("hidden");
    setupSection.classList.add("hidden");
    votingSection.classList.add("hidden");
    resultsSection.classList.add("hidden");
  }

  function populateCouncilors() {
    COUNCILORS.forEach(function (c, index) {
      const opt = document.createElement("option");
      opt.value = String(index);
      opt.textContent = c.name;
      councilorSelect.appendChild(opt);
    });
  }

  function showCurrentAgendaItem() {
    if (currentItemIndex < 0 || currentItemIndex >= agendaItems.length) {
      currentItemIndex = 0;
    }

    const title = agendaItems[currentItemIndex];
    currentAgendaTitle.textContent = (currentItemIndex + 1) + ". " + title;

    // ресет на пријава за советник
    currentLoggedCouncilorIndex = null;
    councilorSelect.value = "";
    councilorPasswordInput.value = "";
    loggedCouncilorInfo.textContent = "";
    voteArea.classList.add("hidden");

    updateCurrentSummary();
    updateLiveResultsTable();
    updateNextButtonState();
  }

  function updateCurrentSummary() {
    const votesForItem = allVotes[currentItemIndex] || {};
    let za = 0;
    let protiv = 0;
    let vozdrzani = 0;

    Object.values(votesForItem).forEach(function (vote) {
      if (vote === "za") za++;
      else if (vote === "protiv") protiv++;
      else if (vote === "vozdrzan") vozdrzani++;
    });

    const total = za + protiv + vozdrzani;

    currentZaSpan.textContent         = String(za);
    currentProtivSpan.textContent     = String(protiv);
    currentVozdrzaniSpan.textContent  = String(vozdrzani);
    currentTotalVotesSpan.textContent = String(total);
  }

  function updateNextButtonState() {
    const total = parseInt(currentTotalVotesSpan.textContent, 10) || 0;
    nextBtn.disabled = (total === 0);
  }

  function updateLiveResultsTable() {
    if (!liveResultsTableBody) return;

    liveResultsTableBody.innerHTML = "";

    agendaItems.forEach(function (item, index) {
      const votesForItem = allVotes[index] || {};
      let za = 0;
      let protiv = 0;
      let vozdrzani = 0;

      Object.values(votesForItem).forEach(function (vote) {
        if (vote === "za") za++;
        else if (vote === "protiv") protiv++;
        else if (vote === "vozdrzan") vozdrzani++;
      });

      const statusHtml = (za >= MAJORITY_ZA)
        ? '<span class="status-passed">УСВОЕНА</span>'
        : '<span class="status-failed">НЕУСВОЕНА</span>';

      const row = document.createElement("tr");
      row.innerHTML =
        "<td>" + (index + 1) + ". " + item + "</td>" +
        "<td>" + za + "</td>" +
        "<td>" + protiv + "</td>" +
        "<td>" + vozdrzani + "</td>" +
        "<td>" + statusHtml + "</td>";
      liveResultsTableBody.appendChild(row);
    });
  }

  function fillResultsTable() {
    resultsTableBody.innerHTML = "";

    agendaItems.forEach(function (itemTitle, index) {
      const votesForItem = allVotes[index] || {};
      let za = 0;
      let protiv = 0;
      let vozdrzani = 0;

      Object.values(votesForItem).forEach(function (vote) {
        if (vote === "за") za++;
        else if (vote === "против") protiv++;  // ОВА Е ГРЕШКА – НЕ
      });
    });
  }

  // Исправена верзија на fillResultsTable:
  function fillResultsTableFixed() {
    resultsTableBody.innerHTML = "";

    agendaItems.forEach(function (itemTitle, index) {
      const votesForItem = allVotes[index] || {};
      let za = 0;
      let protiv = 0;
      let vozdrzani = 0;

      Object.values(votesForItem).forEach(function (vote) {
        if (vote === "za") za++;
        else if (vote === "protiv") protiv++;
        else if (vote === "vozdrzan") vozdrzani++;
      });

      const total = za + protiv + vozdrzani;
      const statusText = (za >= MAJORITY_ZA) ? "УСВОЕНА" : "НЕУСВОЕНА";

      const row = document.createElement("tr");
      row.innerHTML =
        "<td>" + (index + 1) + ". " + itemTitle + "</td>" +
        "<td>" + total + " / " + COUNCILORS.length + "</td>" +
        "<td>" + za + "</td>" +
        "<td>" + protiv + "</td>" +
        "<td>" + vozdrzani + "</td>" +
        "<td>" + statusText + "</td>";
      resultsTableBody.appendChild(row);
    });
  }

  // Наместо старото fillResultsTable ќе ја користиме исправената верзија
  const fillResultsTable = fillResultsTableFixed;

  // ---------- Почетна состојба ----------

  populateCouncilors();
  showOnlyAdmin();

  // ---------- Админ логин ----------

  adminLoginBtn.addEventListener("click", function () {
    const entered = adminPasswordInput.value.trim();
    if (entered === ADMIN_PASSWORD) {
      adminPasswordInput.value = "";
      adminLoginSection.classList.add("hidden");
      setupSection.classList.remove("hidden");
    } else {
      alert("Неточна админ шифра.");
    }
  });

  // ---------- Започни гласање (внесени точки) ----------

  startBtn.addEventListener("click", function () {
    const rawText = agendaInput.value.trim();
    if (!rawText) {
      alert("Внеси барем една точка.");
      return;
    }

    agendaItems = rawText
      .split("\n")
      .map(function (line) { return line.trim(); })
      .filter(function (line) { return line.length > 0; });

    if (agendaItems.length === 0) {
      alert("Нема валидни точки.");
      return;
    }

    allVotes = agendaItems.map(function () { return {}; });
    currentItemIndex = 0;

    setupSection.classList.add("hidden");
    votingSection.classList.remove("hidden");
    resultsSection.classList.add("hidden");

    showCurrentAgendaItem();
  });

  // ---------- Најава на советник ----------

  councilorLoginBtn.addEventListener("click", function () {
    const indexStr = councilorSelect.value;
    const password = councilorPasswordInput.value;

    if (!indexStr) {
      alert("Одбери советник.");
      return;
    }

    const idx = parseInt(indexStr, 10);
    const councilor = COUNCILORS[idx];
    if (!councilor) {
      alert("Проблем со изборот на советник.");
      return;
    }

    if (password !== councilor.password) {
      alert("Неточна шифра.");
      return;
    }

    const votesForItem = allVotes[currentItemIndex] || {};
    if (votesForItem[idx] !== undefined) {
      alert("Овој советник веќе гласал за оваа точка.");
      return;
    }

    currentLoggedCouncilorIndex = idx;
    loggedCouncilorInfo.textContent = "Најавен советник: " + councilor.name;
    councilorPasswordInput.value = "";
    voteArea.classList.remove("hidden");
  });

  // ---------- Гласање ----------

  btnZa.addEventListener("click",       function () { handleVote("za"); });
  btnProtiv.addEventListener("click",   function () { handleVote("protiv"); });
  btnVozdrzan.addEventListener("click", function () { handleVote("vozdrzan"); });

  function handleVote(choice) {
    if (currentLoggedCouncilorIndex === null) {
      alert("Прво најави советник.");
      return;
    }

    const idx = currentLoggedCouncilorIndex;
    const votesForItem = allVotes[currentItemIndex] || {};

    if (votesForItem[idx] !== undefined) {
      alert("Овој советник веќе гласал за оваа точка.");
      return;
    }

    votesForItem[idx] = choice;
    allVotes[currentItemIndex] = votesForItem;

    loggedCouncilorInfo.textContent = "Гласот е запишан. Советникот е одјавен.";
    currentLoggedCouncilorIndex = null;
    voteArea.classList.add("hidden");

    updateCurrentSummary();
    updateLiveResultsTable();
    updateNextButtonState();
  }

  // ---------- Следна точка ----------

  nextBtn.addEventListener("click", function () {
    if (currentItemIndex < agendaItems.length - 1) {
      currentItemIndex++;
      showCurrentAgendaItem();
    } else {
      // Крај на гласањето – покажи финални резултати
      votingSection.classList.add("hidden");
      resultsSection.classList.remove("hidden");
      fillResultsTable();
    }
  });

});

