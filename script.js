"use strict";

// =======================
// КОНФИГУРАЦИЈА
// =======================

// Админ шифра
const ADMIN_PASSWORD = "admin123";

// Советници и нивни шифри
const COUNCILORS = [
   { name: "КОСТА ЗАМАНОВСКИ", password: "1111" },
  { name: "НИКОЛА ИСТОЧКИ", password: "2222" },
  { name: "МАЈА ПАВЛОВСКА", password: "3333" },
  { name: "ЗОРАН ИЛИЕВСКИ", password: "4444" },
  { name: "ВЛАДО БОРЕВСКИ", password: "5555" },
  { name: "ЖАНЕТА САВЕВСКА", password: "6666" },
  { name: "ЈОВАНЧО ЛАЗАРОВСКИ", password: "7777" },
  { name: "ЕЛПИНИКИ НИКОЛОВСКА", password: "8888" },
  { name: "ЛЕНЧЕ НЕЧОВСКИ", password: "9999" },
  { name: "БОРЧЕ РИСТЕВСКИ", password: "1010" },
  { name: "ЈУЛИЈАНА ШУМИНОВСКА", password: "1110" },
  { name: "БЕЛКАС МУСТАФА", password: "1212" },
  { name: "АЈЃИН АБИШЕВСКИ", password: "1313" },
  { name: "АРИЈАН МУЈЕДИНИ", password: "1414" },
  { name: "БЛЕРИМ БЕСИМИ", password: "1515" }
];

// Мнозинство (8 „За“)
const MAJORITY_ZA = 8;

// LocalStorage keys (за дневен ред и гласови)
const LS_KEY_AGENDA = "sovetVoting_agendaItems";
const LS_KEY_VOTES  = "sovetVoting_allVotes";
const LS_KEY_INDEX  = "sovetVoting_currentIndex";

// режим од URL (?mode=admin или ?mode=voting)
const urlParams = new URLSearchParams(window.location.search);
const MODE = urlParams.get("mode") || "admin";

// Состојба на апликацијата
let agendaItems = [];
let currentItemIndex = 0;
let allVotes = []; // allVotes[i] = { councilorIndex: "za" / "protiv" / "vozdrzan" }
let currentLoggedCouncilorIndex = null;

// =======================
// MAIN (по вчитување на DOM)
// =======================

document.addEventListener("DOMContentLoaded", function () {

    // DOM елементи
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

    // -----------------------
    // Помошни функции
    // -----------------------

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

            if (!a || !v) {
                return false;
            }

            const parsedAgenda = JSON.parse(a);
            const parsedVotes  = JSON.parse(v);

            if (!Array.isArray(parsedAgenda) || !Array.isArray(parsedVotes)) {
                return false;
            }

            agendaItems = parsedAgenda;
            allVotes    = parsedVotes;

            if (i !== null) {
                const idx = parseInt(i, 10);
                if (!isNaN(idx) && idx >= 0 && idx < agendaItems.length) {
                    currentItemIndex = idx;
                } else {
                    currentItemIndex = 0;
                }
            } else {
                currentItemIndex = 0;
            }

            return agendaItems.length > 0;
        } catch (e) {
            console.error("LocalStorage load error", e);
            return false;
        }
    }

    function populateCouncilors() {
        COUNCILORS.forEach(function (c, index) {
            const opt = document.createElement("option");
            opt.value = String(index);
            opt.textContent = c.name;
            councilorSelect.appendChild(opt);
        });
    }

    function showOnlyAdmin() {
        adminLoginSection.classList.remove("hidden");
        setupSection.classList.add("hidden");
        votingSection.classList.add("hidden");
        resultsSection.classList.add("hidden");
    }

    function showCurrentAgendaItem() {
        if (currentItemIndex < 0 || currentItemIndex >= agendaItems.length) {
            currentItemIndex = 0;
        }

        const title = agendaItems[currentItemIndex];
        currentAgendaTitle.textContent = (currentItemIndex + 1) + ". " + title;

        currentLoggedCouncilorIndex = null;
        councilorSelect.value = "";
        councilorPasswordInput.value = "";
        loggedCouncilorInfo.textContent = "";
        voteArea.classList.add("hidden");

        updateCurrentSummary();
        updateLiveResultsTable();
        nextBtn.disabled = (parseInt(currentTotalVotesSpan.textContent, 10) === 0);
    }

    function updateCurrentSummary() {
        const votesForItem = allVotes[currentItemIndex] || {};
        let za = 0;
        let protiv = 0;
        let vozdrzani = 0;

        Object.values(votesForItem).forEach(function (vote) {
            if (vote === "za") {
                za++;
            } else if (vote === "protiv") {
                protiv++;
            } else if (vote === "vozdrzan") {
                vozdrzani++;
            }
        });

        const total = za + protiv + vozdrzani;

        currentZaSpan.textContent         = String(za);
        currentProtivSpan.textContent     = String(protiv);
        currentVozdrzaniSpan.textContent  = String(vozdrzani);
        currentTotalVotesSpan.textContent = String(total);
    }

    function updateLiveResultsTable() {
        if (!liveResultsTableBody) {
            return;
        }

        liveResultsTableBody.innerHTML = "";

        agendaItems.forEach(function (item, index) {
            const votesForItem = allVotes[index] || {};
            let za = 0;
            let protiv = 0;
            let vozdrzani = 0;

            Object.values(votesForItem).forEach(function (vote) {
                if (vote === "za") {
                    za++;
                } else if (vote === "protiv") {
                    protiv++;
                } else if (vote === "vozdrzan") {
                    vozdrzani++;
                }
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
                if (vote === "za") {
                    za++;
                } else if (vote === "protiv") {
                    protiv++;
                } else if (vote === "vozdrzan") {
                    vozdrzani++;
                }
            });

            const total = za + protiv + vozdrzani;
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

    // -----------------------
    // Почетна логика (режим)
    // -----------------------

    populateCouncilors();

    if (MODE === "voting") {
        const ok = loadState();
        adminLoginSection.classList.add("hidden");
        setupSection.classList.add("hidden");

        if (ok) {
            votingSection.classList.remove("hidden");
            resultsSection.classList.add("hidden");
            showCurrentAgendaItem();
        } else {
            alert("Нема зачуван дневен ред во овој прелистувач. Прво најавете се како админ и внесете точки.");
            showOnlyAdmin();
        }
    } else {
        showOnlyAdmin();
    }

    // -----------------------
    // Админ логин
    // -----------------------

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

    // -----------------------
    // Внесување на точки
    // -----------------------

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

        setupSection.classList.add("hidden");
        votingSection.classList.remove("hidden");
        resultsSection.classList.add("hidden");

        showCurrentAgendaItem();
    });

    // -----------------------
    // Логирање на советник
    // -----------------------

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

    // -----------------------
    // Гласање
    // -----------------------

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
        saveState();
    }

    // -----------------------
    // Следна точка
    // -----------------------

    nextBtn.addEventListener("click", function () {
        if (currentItemIndex < agendaItems.length - 1) {
            currentItemIndex++;
            saveState();
            showCurrentAgendaItem();
        } else {
            // Крај
            saveState();
            votingSection.classList.add("hidden");
            resultsSection.classList.remove("hidden");
            fillResultsTable();
        }
    });

});
