// =======================
// КОНФИГУРАЦИЈА
// =======================

// Админ шифра
const ADMIN_PASSWORD = "admin123";

// Советници и нивни шифри
const councilors = [
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

// Мнозинство (8 „За“)
const MAJORITY_ZA = 8;

// LocalStorage keys
const LS_KEY_AGENDA = "sovetVoting_agendaItems";
const LS_KEY_VOTES = "sovetVoting_allVotes";
const LS_KEY_INDEX = "sovetVoting_currentIndex";

// Режим од URL (?mode=admin или ?mode=voting)
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get("mode") || "admin";

// =======================
// СОСТОЈБА
// =======================

let agendaItems = [];
let currentItemIndex = 0;
let allVotes = [];              // allVotes[i] = { councilorIndex: "za/protiv/vozdrzan" }
let currentLoggedCouncilorIndex = null;

// =======================
// DOM ЕЛЕМЕНТИ
// =======================

const adminLoginSection = document.getElementById("admin-login-section");
const setupSection      = document.getElementById("setup-section");
const votingSection     = document.getElementById("voting-section");
const resultsSection    = document.getElementById("results-section");

const adminPasswordInput = document.getElementById("adminPassword");
const adminLoginBtn      = document.getElementById("adminLoginBtn");

const agendaInput = document.getElementById("agendaInput");
const startBtn    = document.getElementById("startBtn");

const currentAgendaTitle      = document.getElementById("currentAgendaTitle");
const councilorSelect         = document.getElementById("councilorSelect");
const councilorPasswordInput  = document.getElementById("councilorPassword");
const councilorLoginBtn       = document.getElementById("councilorLoginBtn");
const loggedCouncilorInfo     = document.getElementById("loggedCouncilorInfo");

const voteArea = document.getElementById("voteArea");
const btnZa        = document.getElementById("btnZa");
const btnProtiv    = document.getElementById("btnProtiv");
const btnVozdrzan  = document.getElementById("btnVozdrzan");

const currentTotalVotesSpan   = document.getElementById("currentTotalVotes");
const currentZaSpan           = document.getElementById("currentZa");
const currentProtivSpan       = document.getElementById("currentProtiv");
const currentVozdrzaniSpan    = document.getElementById("currentVozdrzani");
const nextBtn                 = document.getElementById("nextBtn");

const liveResultsTableBody = document.querySelector("#liveResultsTable tbody");
const resultsTableBody     = document.querySelector("#resultsTable tbody");

// =======================
// LOCALSTORAGE ФУНКЦИИ
// =======================

function saveStateToLocalStorage() {
  localStorage.setItem(LS_KEY_AGENDA, JSON.stringify(agendaItems));
  localStorage.setItem(LS_KEY_VOTES, JSON.stringify(allVotes));
  localStorage.setItem(LS_KEY_INDEX, String(currentItemIndex));
}

function loadStateFromLocalStorage() {
  const a = localStorage.getItem(LS_KEY_AGENDA
