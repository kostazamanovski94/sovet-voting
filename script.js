"use strict";

// ----- GLOBAL DATA -----
let agendaItems = [];
let currentItemIndex = 0;
let allVotes = []; // votes for each point

// ----- CONSTANTS -----
const ADMIN_PASSWORD = "admin123";

document.addEventListener("DOMContentLoaded", function () {

    // ----- SELECT HTML SECTIONS -----
    const adminLoginSection = document.getElementById("admin-login-section");
    const setupSection      = document.getElementById("setup-section");
    const votingSection     = document.getElementById("voting-section");
    const resultsSection    = document.getElementById("results-section");

    const adminPasswordInput = document.getElementById("adminPassword");
    const adminLoginBtn      = document.getElementById("adminLoginBtn");

    const agendaInput = document.getElementById("agendaInput");
    const startBtn    = document.getElementById("startBtn");

    const pointTitle  = document.getElementById("pointTitle");
    const voteYesBtn  = document.getElementById("voteYes");
    const voteNoBtn   = document.getElementById("voteNo");
    const voteAbsBtn  = document.getElementById("voteAbstain");

    const nextPointBtn = document.getElementById("nextPoint");
    const finalResultsBtn = document.getElementById("finalResults");

    const resultsList = document.getElementById("resultsList");


    // ----- MODE LOGIC -----
    const urlParams = new URLSearchParams(window.location.search);
    const MODE = urlParams.get("mode");

    if (MODE === "admin") {
        showOnlyAdmin();
        return;
    }

    if (MODE === "voting") {
        let savedAgenda = localStorage.getItem("agendaItems");
        let savedVotes  = localStorage.getItem("allVotes");

        if (!savedAgenda) {
            alert("❗ Во моментот нема активна седница за гласање.");
            return;
        }

        agendaItems = JSON.parse(savedAgenda);
        allVotes = savedVotes ? JSON.parse(savedVotes) : agendaItems.map(()=> ({}));
        currentItemIndex = 0;

        showVotingPanel();
        showAgendaPoint();
        return;
    }

    // ----- DEFAULT (no mode selected) -----
    showOnlyAdmin();



    // =======================
    //     ADMIN LOGIN
    // =======================
    adminLoginBtn.addEventListener("click", function () {
        if (adminPasswordInput.value.trim() === ADMIN_PASSWORD) {
            adminPasswordInput.value = "";
            hideAll();
            setupSection.classList.remove("hidden");
        } else {
            alert("❌ Неточна админ шифра.");
        }
    })
