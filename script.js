"use strict";

// =======================
// КОНФИГУРАЦИЈА
// =======================

const ADMIN_PASSWORD = "admin123";

// 15 советници и нивни шифри
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

// Праг за мнозинство
const MAJORITY_ZA = 8;

// LocalStorage клучеви
const LS_KEY_AGENDA = "sovetVoting_agendaItems";
const LS_KEY_VOTES  = "sovetVoting_allVotes";
const LS_KEY_INDEX  = "sovetVoting_currentIndex";

// Состојба
let agendaItems = [];
let currentItemIndex = 0;
let allVotes = []; // allVotes[i] = { indexNaSovetnik: "za/protiv/vozdrzan" }
let currentLoggedCouncilorIndex = null;

// =======================
// MAIN
// =======================

document.addEventListener("DOMContentLoaded", function () {

  // ---------- DOM ЕЛЕМЕНТИ ----------

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

  // ---------- ПОМОШНИ ФУНКЦИИ ----------

  function hideAll() {
    adminLoginSection.classList.add("hidden");
    setupSection.classList.add("hidden");
    votingSection.classList.add("hidden");
    resultsSection.classList.add("hidden");
  }

  function showOnlyAdmin() {
    hideAll();
    adminLoginSection.classList.remove("hidden");
  }

  function showVoting() {
    hideAll();
    votingSection.classList.remove("hidden");
  }

  function showResults() {
    hideAll();
    resultsSection.classList.remove("hidden");
  }

  function populateCouncilors() {
    COUNCILORS.forEach(function (c, index) {
      const opt = document.createElement("option");
      opt.value = String(index);
      opt.textContent = c.name;
      councilorSelect.appendChild(opt);
    });
  }

  function saveState() {
    try {
      localStorage.setItem(LS_KEY_AGENDA, JSON.stringify(agendaItems));
      localStorage.setItem(LS_KEY_VOTES,  JSON.stringify(allVotes));
      localStorage.setItem(LS_KEY_INDEX,  String(currentItemIndex));
    } catch (e) {
      console.error("LocalStorage save error", e);
    }
  }

  function loadState() {
    try {
      const a = localStorage.getItem(LS_KEY_AGENDA);
      const v = localStorage.getItem(LS_KEY_VOTES);
      const i = localStorage.getItem(LS_KEY_INDEX);

      if (!a || !v) return false;

      const parsedAgenda = JSON.parse(a);
      const parsedVotes  = JSON.parse(v);

      if (!Array.isArray(parsedAgenda) || !Array.isArray(parsedVotes)) return false;

      agendaItems = parsedAgenda;
      allVotes    = parsedVotes;

      if (i !== null) {
        const idx = parseInt(i, 10);
        currentItemIndex = (!isNaN(idx) && idx >= 0 && idx < agendaItems.length) ? idx : 0;
      } else {
        currentItemIndex = 0;
      }

      return agendaItems.length > 0;
    } catch (e) {
      console.error("LocalStorage load error", e);
      return false;
    }
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

    const total = za + против + vozdrзани;

    currentZaSpan.textContent         = String(za);
    currentProtivSpan.textContent     = String(protiv);
    currentVozdrzaniSpan.textContent  = String(vozdrzани);
    currentTotalVotesSpan.textContent = String(total);

    nextBtn.disabled = (total === 0);
  }

  function updateLiveResultsTable() {
    liveResultsTableBody.innerHTML = "";

    agendaItems.forEach(function (item, index) {
      const votesForItem = allVotes[index] || {};
      let za = 0;
      let protiv = 0;
      let vozdrzani = 0;

      Object.values(votesForItem).forEach(function (vote) {
        if (vote === "za") za++;
        else if (vote === "protiv") против++;
        else if (vote === "vozdrzan") vozдрзани++;
      });

      const statusHtml = (za >= MAJORITY_ZA)
        ? '<span class="status-passed">УСВОЕНА</span>'
        : '<span class="status-failed">НЕУСВОЕНА</span>';

      const row = document.createElement("tr");
      row.innerHTML =
        "<td>" + (index + 1) + ". " + item + "</td>" +
        "<td>" + za + "</td>" +
        "<td>" + против + "</td>" +
        "<td>" + vozдрзани + "</td>" +
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
      let vozdrзани = 0;

      Object.values(votesForItem).forEach(function (vote) {
        if (vote === "za") za++;
        else if (vote === "protiv") против++;
        else if (vote === "vozdrzan") vozдрзани++;
      });

      const total = za + против + vozдрзани;
      const statusText = (za >= MAJORITY_ZA) ? "УСВОЕНА" : "НЕУСВОЕНА";

      const row = document.createElement("tr");
      row.innerHTML =
        "<td>" + (index + 1) + ". " + itemTitle + "</td>" +
        "<td>" + total + " / " + COUNCILORS.length + "</td>" +
        "<td>" + za + "</td>" +
        "<td>" + против + "</td>" +
        "<td>" + vozдрзани + "</td>" +
        "<td>" + statusText + "</td>";
      resultsTableBody.appendChild(row);
    });
  }

  function showCurrentAgendaItem() {
    if (currentItemIndex < 0 || currentItemIndex >= agendaItems.length) {
      currentItemIndex = 0;
    }

    currentAgendaTitle.textContent =
      (currentItemIndex + 1) + ". " + agendaItems[currentItemIndex];

    currentLoggedCouncilorIndex = null;
    councilorSelect.value = "";
    councilorPasswordInput.value = "";
    loggedCouncilorInfo.textContent = "";
    voteArea.classList.add("hidden");

    updateCurrentSummary();
    updateLiveResultsTable();
  }

  // ---------- MODE ОД URL ----------

  populateCouncilors();

  const params = new URLSearchParams(window.location.search);
  const MODE = params.get("mode");

  if (MODE === "voting") {
    const ok = loadState();
    if (!ok) {
      alert("Во моментот нема активна седница за гласање во овој прелистувач.");
      showOnlyAdmin();
    } else {
      showVoting();
      showCurrentAgendaItem();
    }
  } else {
    showOnlyAdmin();
  }

  // ---------- АДМИН ЛОГИН ----------

  adminLoginBtn.addEventListener("click", function () {
    const entered = adminPasswordInput.value.trim();
    if (entered === ADMIN_PASSWORD) {
      adminPasswordInput.value = "";
      hideAll();
      setupSection.classList.remove("hidden");
    } else {
      alert("Неточна админ шифра.");
    }
  });

  // ---------- ВНЕСУВАЊЕ ТОЧКИ ----------

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

    saveState();

    hideAll();
    votingSection.classList.remove("hidden");
    showCurrentAgendaItem();
  });

  // ---------- ЛОГИРАЊЕ СОВЕТНИК ----------

  councilorLoginBtn.addEventListener("click", function () {
    const indexStr = councilorSelect.value;
    const password = councilorPasswordInput.value;

    if (!indexStr) {
      alert("Одбери советник.");
      return;
    }

    const idx = parseInt(indexStr, 10);
    const c = COUNCILORS[idx];
    if (!c) {
      alert("Проблем со изборот на советник.");
      return;
    }

    if (password !== c.password) {
      alert("Неточна шифра.");
      return;
    }

    const votesForItem = allVotes[currentItemIndex] || {};
    if (votesForItem[idx] !== undefined) {
      alert("Овој советник веќе гласал за оваа точка.");
      return;
    }

    currentLoggedCouncilorIndex = idx;
    loggedCouncilorInfo.textContent = "Најавен советник: " + c.name;
    councilorPasswordInput.value = "";
    voteArea.classList.remove("hidden");
  });

  // ---------- ГЛАСАЊЕ ----------

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

    currentLoggedCouncilorIndex = null;
    voteArea.classList.add("hidden");
    loggedCouncilorInfo.textContent = "Гласот е запишан. Советникот е одјавен.";

    updateCurrentSummary();
    updateLiveResultsTable();
    saveState();
  }

  // ---------- СЛЕДНА ТОЧКА / КРАЈ ----------

  nextBtn.addEventListener("click", function () {
    if (currentItemIndex < agendaItems.length - 1) {
      currentItemIndex++;
      saveState();
      showCurrentAgendaItem();
    } else {
      saveState();
      showResults();
      fillResultsTable();
    }
  });

});
