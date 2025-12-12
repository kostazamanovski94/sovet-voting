// === ПОДЕСУВАЊА НА ШИФРИ ===

// Админ шифра (за внесување точки)
const ADMIN_PASSWORD = "admin123";

// Листа на 15 советници со имиња и шифри
// Можеш да ги смениш имињата и шифрите по желба.
const councilors = [
  { name: "КОСТА ЗАМАНОВСКИ", password: "kosta1" },
  { name: "НИКОЛА ИСТОЧКИ", password: "nikola1" },
  { name: "МАЈА ПАВЛОВСКА", password: "maja1" },
  { name: "ЗОРАН ИЛИЕВСКИ", password: "zoran1" },
  { name: "ВЛАДО БОРЕВСКИ", password: "vlado1" },
  { name: "ЖАНЕТА САВЕВСКА", password: "zaneta1" },
  { name: "ЈОВАНЧО ЛАЗАРОВСКИ", password: "jovanco1" },
  { name: "ЕЛПИНИКИ НИКОЛОВСКА", password: "elpiniki1" },
  { name: "ЛЕНЧЕ НЕЧОВСКИ", password: "lence1" },
  { name: "БОРЧЕ РИСТЕВСКИ", password: "borce1" },
  { name: "ЈУЛИЈАНА ШУМИНОВСКА", password: "julijana1" },
  { name: "БЕЛКАС МУСТАФА", password: "belkas1" },
  { name: "АЈЃИН АБИШЕВСКИ", password: "ajgin1" },
  { name: "АРИЈАН МУЈЕДИНИ", password: "arijan1" },
  { name: "БЛЕРИМ БЕСИМИ", password: "blerim1" }
];

// Мнозинство: колку "За" се потребни за УСВОЕНА точка
const MAJORITY_ZA = 8;

// LocalStorage keys (ист компјутер + ист browser)
const LS_KEY_AGENDA = "sovetVoting_agendaItems";
const LS_KEY_VOTES = "sovetVoting_allVotes";
const LS_KEY_INDEX = "sovetVoting_currentIndex";

// Детекција на режим од URL (?mode=admin или ?mode=voting)
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get("mode") || "admin";

// === СОСТОЈБА НА АПЛИКАЦИЈАТА ===

let agendaItems = [];      // листа на точки
let currentItemIndex = -1; // моментална точка
let allVotes = [];         // allVotes[i] = објект со гласови за точка i
let currentLoggedCouncilorIndex = null;

// === DOM ЕЛЕМЕНТИ ===

// секции
const adminLoginSection = document.getElementById("admin-login-section");
const setupSection = document.getElementById("setup-section");
const votingSection = document.getElementById("voting-section");
const resultsSection = document.getElementById("results-section");

// админ логин
const adminPasswordInput = document.getElementById("adminPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");

// внес на точки
const agendaInput = document.getElementById("agendaInput");
const startBtn = document.getElementById("startBtn");

// voting view
const currentAgendaTitle = document.getElementById("currentAgendaTitle");
const councilorSelect = document.getElementById("councilorSelect");
const councilorPasswordInput = document.getElementById("councilorPassword");
const councilorLoginBtn = document.getElementById("councilorLoginBtn");
const loggedCouncilorInfo = document.getElementById("loggedCouncilorInfo");

const voteArea = document.getElementById("voteArea");
const btnZa = document.getElementById("btnZa");
const btnProtiv = document.getElementById("btnProtiv");
const btnVozdrzan = document.getElementById("btnVozdrzan");

const currentTotalVotesSpan = document.getElementById("currentTotalVotes");
const currentZaSpan = document.getElementById("currentZa");
const currentProtivSpan = document.getElementById("currentProtiv");
const currentVozdrzaniSpan = document.getElementById("currentVozdrzani");
const nextBtn = document.getElementById("nextBtn");

// живи резултати
const liveResultsTableBody = document.querySelector("#liveResultsTable tbody");

// финални резултати
const resultsTableBody = document.querySelector("#resultsTable tbody");

// === ХЕЛПЕР ФУНКЦИИ ЗА LOCALSTORAGE ===

function saveStateToLocalStorage() {
  localStorage.setItem(LS_KEY_AGENDA, JSON.stringify(agendaItems));
  localStorage.setItem(LS_KEY_VOTES, JSON.stringify(allVotes));
  localStorage.setItem(LS_KEY_INDEX, String(currentItemIndex));
}

function loadStateFromLocalStorage() {
  const a = localStorage.getItem(LS_KEY_AGENDA);
  const v = localStorage.getItem(LS_KEY_VOTES);
  const i = localStorage.getItem(LS_KEY_INDEX);

  if (a && v) {
    try {
      agendaItems = JSON.parse(a);
      allVotes = JSON.parse(v);
      currentItemIndex = i !== null ? parseInt(i, 10) : 0;
      if (Number.isNaN(currentItemIndex) || currentItemIndex < 0) {
        currentItemIndex = 0;
      }
      return true;
    } catch (e) {
      console.error("Грешка при читање од localStorage:", e);
    }
  }
  return false;
}

// === ИНИЦИЈАЛИЗАЦИЈА ===

// Пополни dropdown со советници
(function populateCouncilorSelect() {
  councilors.forEach((c, index) => {
    const opt = document.createElement("option");
    opt.value = index.toString();
    opt.textContent = c.name;
    councilorSelect.appendChild(opt);
  });
})();

// Постави почетен режим
if (mode === "voting") {
  // Обид да вчита дневен ред од localStorage
  const ok = loadStateFromLocalStorage();
  adminLoginSection.classList.add("hidden");
  setupSection.classList.add("hidden");

  if (ok && agendaItems.length > 0) {
    votingSection.classList.remove("hidden");
    resultsSection.classList.add("hidden");
    showCurrentAgendaItem();
    updateLiveResultsTable();
  } else {
    alert("Нема внесен дневен ред во овој браузер. Админот прво мора да се најави и да ги внесе точките.");
    adminLoginSection.classList.remove("hidden");
  }
} else {
  // admin mode
  adminLoginSection.classList.remove("hidden");
  setupSection.classList.add("hidden");
  votingSection.classList.add("hidden");
  resultsSection.classList.add("hidden");
}

// === АДМИН ЛОГИН ===

adminLoginBtn.addEventListener("click", () => {
  const entered = adminPasswordInput.value.trim();

  if (entered === ADMIN_PASSWORD) {
    adminPasswordInput.value = "";
    adminLoginSection.classList.add("hidden");
    setupSection.classList.remove("hidden");
  } else {
    alert("Неточна админ шифра.");
  }
});

// === ЗАПОЧНУВАЊЕ НА ГЛАСАЊЕ ===

startBtn.addEventListener("click", () => {
  const rawText = agendaInput.value.trim();
  if (!rawText) {
    alert("Внеси барем една точка.");
    return;
  }

  agendaItems = rawText
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (agendaItems.length === 0) {
    alert("Нема валидни точки.");
    return;
  }

  // Инициализирај гласови (празно)
  allVotes = agendaItems.map(() => ({}));
  currentItemIndex = 0;

  saveStateToLocalStorage();

  setupSection.classList.add("hidden");
  votingSection.classList.remove("hidden");
  resultsSection.classList.add("hidden");

  showCurrentAgendaItem();
  updateLiveResultsTable();
});

// === ПРИКАЗ НА ТЕКОВНА ТОЧКА ===

function showCurrentAgendaItem() {
  if (currentItemIndex < 0 || currentItemIndex >= agendaItems.length) {
    currentItemIndex = 0;
  }

  const title = agendaItems[currentItemIndex];
  currentAgendaTitle.textContent = `${currentItemIndex + 1}. ${title}`;

  // ресетирај логирање
  currentLoggedCouncilorIndex = null;
  councilorSelect.value = "";
  councilorPasswordInput.value = "";
  loggedCouncilorInfo.textContent = "";
  voteArea.classList.add("hidden");

  updateCurrentSummary();
  updateLiveResultsTable();
  nextBtn.disabled = (currentTotalVotesSpan.textContent === "0");
}

// === ЛОГИРАЊЕ НА СОВЕТНИК ===

councilorLoginBtn.addEventListener("click", () => {
  const indexStr = councilorSelect.value;
  const password = councilorPasswordInput.value;

  if (indexStr === "") {
    alert("Одбери советник.");
    return;
  }
  const index = parseInt(indexStr, 10);
  const councilor = councilors[index];

  if (password !== councilor.password) {
    alert("Неточна шифра.");
    return;
  }

  const votesForItem = allVotes[currentItemIndex] || {};
  if (votesForItem[index] !== undefined) {
    alert("Овој советник веќе гласал за оваа точка.");
    return;
  }

  currentLoggedCouncilorIndex = index;
  loggedCouncilorInfo.textContent = `Најавен советник: ${councilor.name}`;
  councilorPasswordInput.value = "";
  voteArea.classList.remove("hidden");
});

// === ГЛАСАЊЕ ===

btnZa.addEventListener("click", () => handleVote("za"));
btnProtiv.addEventListener("click", () => handleVote("protiv"));
btnVozdrzan.addEventListener("click", () => handleVote("vozdrzan"));

function handleVote(choice) {
  if (currentLoggedCouncilorIndex === null) {
    alert("Прво најави советник.");
    return;
  }

  const index = currentLoggedCouncilorIndex;
  const votesForItem = allVotes[currentItemIndex] || {};

  if (votesForItem[index] !== undefined) {
    alert("Овој советник веќе гласал за оваа точка.");
    return;
  }

  // снимање глас
  votesForItem[index] = choice;
  allVotes[currentItemIndex] = votesForItem;

  loggedCouncilorInfo.textContent =
    `Гласот е запишан за ${councilors[index].name}. (Одјавен)`;
  currentLoggedCouncilorIndex = null;
  voteArea.classList.add("hidden");

  updateCurrentSummary();
  updateLiveResultsTable();
  saveStateToLocalStorage();
}

// === АЖУРИРАЊЕ НА БРОЈАЧИ ЗА ТЕКОВНА ТОЧКА ===

function updateCurrentSummary() {
  const votesForItem = allVotes[currentItemIndex] || {};
  let za = 0, protiv = 0, vozdrzani = 0;

  Object.values(votesForItem).forEach(vote => {
    if (vote === "za") za++;
    else if (vote === "protiv") против++;
    else if (vote === "vozdrzan") vozdrzani++;
  });

  const totalVotes = za + против + vozdrzani;

  currentZaSpan.textContent = za;
  currentProtivSpan.textContent = против;
  currentVozdrzaniSpan.textContent = vozdrzani;
  currentTotalVotesSpan.textContent = totalVotes.toString();

  nextBtn.disabled = totalVotes === 0;
}

// === ЖИВА ТАБЕЛА СО РЕЗУЛТАТИ ПО ТОЧКИ ===

function updateLiveResultsTable() {
  if (!liveResultsTableBody) return;

  liveResultsTableBody.innerHTML = "";

  agendaItems.forEach((item, index) => {
    const votes = allVotes[index] || {};
    let za = 0, protiv = 0, vozdrzani = 0;

    Object.values(votes).forEach(vote => {
      if (vote === "za") za++;
      else if (vote === "protiv") protiv++;
      else if (vote === "vozdrzan") vozdrzani++;
    });

    let statusHtml;
    if (za >= MAJORITY_ZA) {
      statusHtml = `<span class="status-passed">УСВОЕНА</span>`;
    } else {
      statusHtml = `<span class="status-failed">НЕУСВОЕНА</span>`;
    }

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}. ${item}</td>
      <td>${za}</td>
      <td>${protiv}</td>
      <td>${vozdrzani}</td>
      <td>${statusHtml}</td>
    `;
    liveResultsTableBody.appendChild(row);
  });
}

// === СЛЕДНА ТОЧКА ===

nextBtn.addEventListener("click", () => {
  if (currentItemIndex < agendaItems.length - 1) {
    currentItemIndex++;
    saveStateToLocalStorage();
    showCurrentAgendaItem();
  } else {
    // крај -> прикажи резултати
    saveStateToLocalStorage();
    votingSection.classList.add("hidden");
    resultsSection.classList.remove("hidden");
    fillResultsTable();
  }
});

// === ПОПОЛНУВАЊЕ КРАЈНА ТАБЕЛА ===

function fillResultsTable() {
  resultsTableBody.innerHTML = "";

  agendaItems.forEach((itemTitle, index) => {
    const votesForItem = allVotes[index] || {};
    let za = 0, protiv = 0, vozdrzani = 0;

    Object.values(votesForItem).forEach(vote => {
      if (vote === "za") za++;
      else if (vote === "protiv") protiv++;
      else if (vote === "vozdrzan") vozdrzani++;
    });

    const totalVotes = za + protiv + vozdrzani;

    let statusText;
    if (za >= MAJORITY_ZA) {
      statusText = "УСВОЕНА";
    } else {
      statusText = "НЕУСВОЕНА";
    }

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${index + 1}. ${itemTitle}</td>
      <td>${totalVotes} / ${councilors.length}</td>
      <td>${za}</td>
      <td>${protiv}</td>
      <td>${vozdrzani}</td>
      <td>${statusText}</td>
    `;

    resultsTableBody.appendChild(row);
  });
}
