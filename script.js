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
    });



    // =======================
    //     START SESSION
    // =======================
    startBtn.addEventListener("click", function () {
        let rawText = agendaInput.value.trim();
        if (!rawText) {
            alert("Внесете точки.");
            return;
        }

        agendaItems = rawText.split("\n").map(t => t.trim()).filter(t => t.length > 0);
        currentItemIndex = 0;

        allVotes = agendaItems.map(() => ({}));

        localStorage.setItem("agendaItems", JSON.stringify(agendaItems));
        localStorage.setItem("allVotes", JSON.stringify(allVotes));

        showVotingPanel();
        showAgendaPoint();
    });



    // =======================
    //     HANDLE VOTES
    // =======================
    function castVote(type) {
        allVotes[currentItemIndex][type] = (allVotes[currentItemIndex][type] || 0) + 1;
        localStorage.setItem("allVotes", JSON.stringify(allVotes)); 
        alert("Гласот е прифатен.");
    }

    voteYesBtn.addEventListener("click", () => castVote("yes"));
    voteNoBtn.addEventListener("click", () => castVote("no"));
    voteAbsBtn.addEventListener("click", () => castVote("abs"));



    // =======================
    //     NEXT POINT
    // =======================
    nextPointBtn.addEventListener("click", function () {
        currentItemIndex++;

        if (currentItemIndex >= agendaItems.length) {
            hideAll();
            resultsSection.classList.remove("hidden");
            showFinalResults();
            return;
        }

        showAgendaPoint();
    });



    // =======================
    //     FINAL RESULTS
    // =======================
    function showFinalResults() {
        resultsList.innerHTML = "";

        allVotes.forEach((votes, idx) => {
            let yes = votes.yes || 0;
            let no  = votes.no  || 0;
            let abs = votes.abs || 0;

            let status = yes >= 8 ? "УСВОЕНО" : "НЕ Е УСВОЕНО";
            let color = yes >= 8 ? "green" : "red";

            let li = document.createElement("li");
            li.innerHTML = `
                <b>${idx + 1}. ${agendaItems[idx]}</b><br>
                За: ${yes} | Против: ${no} | Воздржани: ${abs}<br>
                <span style="color:${color};font-weight:bold;">${status}</span>
            `;
            resultsList.appendChild(li);
        });
    }



    // =======================
    //     HELPERS
    // =======================
    function showAgendaPoint() {
        pointTitle.innerText = agendaItems[currentItemIndex];
    }

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

    function showVotingPanel() {
        hideAll();
        votingSection.classList.remove("hidden");
    }

});
