"use strict";

/*
  СИСТЕМ ЗА ГЛАСАЊЕ НА СОВЕТ
  - Админ логин (mode=admin)
  - Внес на точки
  - Гласање со 15 советници (име + шифра)
  - Втор линк за советници: ?mode=voting (чита од localStorage)
*/

// ---------------------- КОНФИГУРАЦИЈА ----------------------

const ADMIN_PASSWORD = "admin123";

// 15 советници, секој со своја шифра
const COUNCILORS = [
  { name: "Советник 1", password: "1111" },
  { name: "Советник 2", password: "2222" },
  { name: "Советник 3", password: "3333" },
  { name: "Советник 4", password: "4444" },
  { name: "Советник 5", password: "5555" },
  { name: "Советник 6", password: "6666" },
  { name: "Советник 7", password: "7777" },
  { name: "Советник 8", password: "8888" },
  { name: "Советник 9", password: "9999" },
  { name: "Советник 10", password: "1010" },
  { name: "Советник 11", password: "1110" },
  { name: "Советник 12", password: "1212" },
  { name: "Советник 13", password: "1313" },
  { name: "Советник 14", password: "1414" },
  { name: "Советник 15", password: "1515" }
];

// минимум 8 „ЗА“ за да биде усвоена точка
const MAJORITY_ZA = 8;

// localStorage клуч
const STORAGE_KEY = "sovet_voting_state_v1";

// структура што ја чуваме во storage:
// {
//   agendaItems: [ "т1", "т2", ... ],
//   votes: [ { "0":"za", "3":"protiv" }, ... ],
//   currentIndex: 0
// }

// ---------------------- ГЛОБАЛНА СОСТОЈБА ----------------------

let agendaItems = [];
let votesPerItem = [];      // масив: за секоја точка -> објект { индексНаСоветник: "za/protiv/vozdrzan" }
let currentIndex = 0;
let loggedCouncilorIndex = null;

// ---------------------- ПОМОШНИ ФУНКЦИИ ----------------------

function saveStateToStorage() {
  const state = {
    agendaItems,
    votes: votesPerItem,
    currentIndex
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Не може да се сними состојбата:", e);
  }
}

function loadStateFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const state = JSON.parse(raw);
    if (!state || !Array.isArray(state.agendaItems) || !Array.isArray(state.votes)) {
      return false;
    }
    agendaItems = state.agendaItems;
    votesPerItem = state.votes;
    currentIndex = typeof state.currentIndex === "number" ? state.currentIndex : 0;

    // безбедност
    if (currentIndex < 0 || currentIndex >= agendaItems.length) {
      currentIndex = 0;
    }
    return agendaItems.length > 0;
  } catch (e) {
    console.error("Не може да се прочита состојбата:", e);
    return false;
  }
}

function clearStateFromStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Не може да се избрише storage:", e);
  }
}

// броење гласови за одредена точка
function summarizeVotesForItem(index) {
  const votesObj = votesPerItem[index] || {};
  let za = 0;
  let protiv = 0;
  let vozdrzani = 0;

  Object.values(votesObj).forEach((v) => {
    if (v === "za") za++;
    else if (v === "protiv") protiv++;
    else if (v === "vozdrzan") vozdrzani++;
  });

  const total = za + protiv + vozdrzani;
  const passed = za >= MAJORITY_ZA;

  return { za, protiv, vozdrzani, total, passed };
}

// ---------------------- MAIN ----------------------

document.addEventListener("DOMContentLoaded", () => {
  // ---- HTML елементи ----

  const adminLoginSection = document.getElementById("admin-login-section");
  const setupSection      = document.getElementById("setup-section");
  const votingSection     = document.getElementById("voting-section");
  const resultsSection    = document.getElementById("results-section");

  const adminPasswordInput = document.getElementById("adminPassword");
  const adminLoginBtn      = document.getElementById("adminLoginBtn");

  const agendaInput = document.getElementById("agendaInput");
  const startBtn    = document.getElementById("startBtn");

  const currentAgendaTitle = document.getElementById("currentAgendaTitle");

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

  // ---- функции за прикажување секции ----

  function hideAllSections() {
    [adminLoginSection, setupSection, votingSection, resultsSection].forEach((sec) => {
      if (sec) sec.classList.add("hidden");
    });
  }

  function showAdminLogin() {
    hideAllSections();
    if (adminLoginSection) adminLoginSection.classList.remove("hidden");
  }

  function showSetup() {
    hideAllSections();
    if (setupSection) setupSection.classList.remove("hidden");
  }

  function showVoting() {
    hideAllSections();
    if (votingSection) votingSection.classList.remove("hidden");
  }

  function showResults() {
    hideAllSections();
    if (resultsSection) resultsSection.classList.remove("hidden");
  }

  // ---- пополнување на листата на советници ----

  function populateCouncilorsSelect() {
    if (!councilorSelect) return;
    // прво избриши евентуални стари опции (освен првата празна)
    while (councilorSelect.options.length > 1) {
      councilorSelect.remove(1);
    }
    COUNCILORS.forEach((c, index) => {
      const opt = document.createElement("option");
      opt.value = String(index);
      opt.textContent = c.name;
      councilorSelect.appendChild(opt);
    });
  }

  // ---- ажурирање на UI за тековна точка ----

  function updateCurrentPointUI() {
    if (!agendaItems.length) return;
    const title = agendaItems[currentIndex];
    if (currentAgendaTitle) {
      currentAgendaTitle.textContent = (currentIndex + 1) + ". " + title;
    }

    // ресет на login на советник
    loggedCouncilorIndex = null;
    if (councilorSelect) councilorSelect.value = "";
    if (councilorPasswordInput) councilorPasswordInput.value = "";
    if (loggedCouncilorInfo) loggedCouncilorInfo.textContent = "";
    if (voteArea) voteArea.classList.add("hidden");

    // статистика за тековната точка
    const sum = summarizeVotesForItem(currentIndex);
    if (currentZaSpan) currentZaSpan.textContent = String(sum.za);
    if (currentProtivSpan) currentProtivSpan.textContent = String(sum.protiv);
    if (currentVozdrzaniSpan) currentVozdrzaniSpan.textContent = String(sum.vozdrzani);
    if (currentTotalVotesSpan) currentTotalVotesSpan.textContent = String(sum.total);

    if (nextBtn) nextBtn.disabled = sum.total === 0;

    // live табела
    if (liveResultsTableBody) {
      liveResultsTableBody.innerHTML = "";
      agendaItems.forEach((item, i) => {
        const s = summarizeVotesForItem(i);
        const tr = document.createElement("tr");
        const statusText = s.passed ? "УСВОЕНА" : "НЕУСВОЕНА";
        tr.innerHTML =
          `<td>${i + 1}. ${item}</td>` +
          `<td>${s.za}</td>` +
          `<td>${s.protiv}</td>` +
          `<td>${s.vozdrzani}</td>` +
          `<td>${statusText}</td>`;
        liveResultsTableBody.appendChild(tr);
      });
    }

    saveStateToStorage();
  }

  // пополнување на финална табела
  function fillFinalResultsTable() {
    if (!resultsTableBody) return;
    resultsTableBody.innerHTML = "";

    agendaItems.forEach((item, i) => {
      const s = summarizeVotesForItem(i);
      const statusText = s.passed ? "УСВОЕНА" : "НЕУСВОЕНА";
      const tr = document.createElement("tr");
      tr.innerHTML =
        `<td>${i + 1}. ${item}</td>` +
        `<td>${s.total} / ${COUNCILORS.length}</td>` +
        `<td>${s.za}</td>` +
        `<td>${s.protiv}</td>` +
        `<td>${s.vozdrzani}</td>` +
        `<td>${statusText}</td>`;
      resultsTableBody.appendChild(tr);
    });
  }

  // ---------------------- MODE ОД URL ----------------------

  const params = new URLSearchParams(window.location.search || "");
  const mode = params.get("mode");

  // секогаш пополни ја листата на советници (ако сме во voting)
  populateCouncilorsSelect();

  if (mode === "voting") {
    // режим за советници – само гласање, чита од storage
    const ok = loadStateFromStorage();
    if (!ok) {
      alert("Во моментот нема активна седница за гласање на овој компјутер.");
      showAdminLogin();
    } else {
      showVoting();
      updateCurrentPointUI();
    }
  } else {
    // default: admin режим
    clearStateFromStorage(); // секогаш чисти стара седница кога админот почнува нова
    showAdminLogin();
  }

  // ---------------------- АДМИН ЛОГИН ----------------------

  if (adminLoginBtn) {
    adminLoginBtn.addEventListener("click", () => {
      const val = (adminPasswordInput && adminPasswordInput.value.trim()) || "";
      if (val === ADMIN_PASSWORD) {
        if (adminPasswordInput) adminPasswordInput.value = "";
        showSetup();
      } else {
        alert("Неточна админ шифра.");
      }
    });
  }

  // ---------------------- ВНЕС НА ТОЧКИ ----------------------

  if (startBtn) {
    startBtn.addEventListener("click", () => {
      const raw = (agendaInput && agendaInput.value.trim()) || "";
      if (!raw) {
        alert("Внеси барем една точка.");
        return;
      }

      const lines = raw
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (!lines.length) {
        alert("Нема валидни точки.");
        return;
      }

      agendaItems = lines;
      votesPerItem = agendaItems.map(() => ({}));
      currentIndex = 0;
      loggedCouncilorIndex = null;

      saveStateToStorage();
      showVoting();
      updateCurrentPointUI();
    });
  }

  // ---------------------- НАЈАВА НА СОВЕТНИК ----------------------

  if (councilorLoginBtn) {
    councilorLoginBtn.addEventListener("click", () => {
      const idxStr = councilorSelect ? councilorSelect.value : "";
      const pass   = councilorPasswordInput ? councilorPasswordInput.value : "";

      if (!idxStr) {
        alert("Одбери советник.");
        return;
      }

      const idx = parseInt(idxStr, 10);
      const c = COUNCILORS[idx];
      if (!c) {
        alert("Грешка при избор на советник.");
        return;
      }

      if (pass !== c.password) {
        alert("Неточна шифра за " + c.name + ".");
        return;
      }

      const votesObj = votesPerItem[currentIndex] || {};
      if (votesObj[idx] !== undefined) {
        alert("Овој советник веќе гласал за оваа точка.");
        return;
      }

      loggedCouncilorIndex = idx;
      if (loggedCouncilorInfo) {
        loggedCouncilorInfo.textContent = "Најавен советник: " + c.name;
      }
      if (councilorPasswordInput) councilorPasswordInput.value = "";
      if (voteArea) voteArea.classList.remove("hidden");
    });
  }

  // ---------------------- ГЛАСАЊЕ ----------------------

  function handleVote(choice) {
    if (loggedCouncilorIndex === null) {
      alert("Прво најави советник.");
      return;
    }

    const votesObj = votesPerItem[currentIndex] || {};
    if (votesObj[loggedCouncilorIndex] !== undefined) {
      alert("Овој советник веќе гласал за оваа точка.");
      return;
    }

    votesObj[loggedCouncilorIndex] = choice;
    votesPerItem[currentIndex] = votesObj;

    if (loggedCouncilorInfo) {
      loggedCouncilorInfo.textContent = "Гласот е запишан. Советникот е одјавен.";
    }
    loggedCouncilorIndex = null;
    if (voteArea) voteArea.classList.add("hidden");

    updateCurrentPointUI();
  }

  if (btnZa)       btnZa.addEventListener("click",       () => handleVote("za"));
  if (btnProtiv)   btnProtiv.addEventListener("click",   () => handleVote("protiv"));
  if (btnVozdrzan) btnVozdrzan.addEventListener("click", () => handleVote("vozdrzan"));

  // ---------------------- СЛЕДНА ТОЧКА / РЕЗУЛТАТИ ----------------------

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      const sum = summarizeVotesForItem(currentIndex);
      if (sum.total === 0) {
        alert("Мора барем еден глас за да преминеш на следна точка.");
        return;
      }

      if (currentIndex < agendaItems.length - 1) {
        currentIndex++;
        updateCurrentPointUI();
      } else {
        showResults();
        fillFinalResultsTable();
        // по желба не чистиме storage сега – за да може
        // повторно да се отвори резултатот од voting link
      }
      saveStateToStorage();
    });
  }
});
