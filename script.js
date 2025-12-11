// === ПОДЕСУВАЊА НА ШИФРИ ===

// Админ шифра (за внесување точки)
const ADMIN_PASSWORD = "admin123";

// Листа на 15 советници со имиња и шифри
// Можеш да ги смениш имињата и шифрите по желба.
const councilors = [
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

// === СОСТОЈБА НА АПЛИКАЦИЈАТА ===

let agendaItems = [];      // листа на точки
let currentItemIndex = -1; // индекс на тековна точка
let allVotes = [];         // allVotes[i] = објект со гласови за точка i
let currentLoggedCouncilorIndex = null; // кој советник е најавен во моментов

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

// финални резултати
const resultsTableBody = document.querySelector("#resultsTable tbody");

// === ИНИЦИЈАЛИЗАЦИЈА ===

// Пополни dropdown со советници
function populateCouncilorSelect() {
  councilors.forEach((c, index) => {
    const opt = document.createElement("option");
    opt.value = index.toString();       // ќе го користиме индексот
    opt.textContent = c.name;
    councilorSelect.appendChild(opt);
  });
}
populateCouncilorSelect();

// === АДМИН ЛОГИН ===

adminLoginBtn.addEventListener("click", () => {
  const entered = adminPasswordInput.value;

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

  // иницијализирај гласови
  allVotes = agendaItems.map(() => ({}));
  currentItemIndex = 0;

  setupSection.classList.add("hidden");
  votingSection.classList.remove("hidden");

  showCurrentAgendaItem();
});

// === ПРИКАЗ НА ТЕКОВНА ТОЧКА ===

function showCurrentAgendaItem() {
  const title = agendaItems[currentItemIndex];
  currentAgendaTitle.textContent = `${currentItemIndex + 1}. ${title}`;

  // ресетирај логирање
  currentLoggedCouncilorIndex = null;
  councilorSelect.value = "";
  councilorPasswordInput.value = "";
  loggedCouncilorInfo.textContent = "";
  voteArea.classList.add("hidden");

  // ресетирај бројачи
  updateCurrentSummary();

  // не дозволувај следна точка додека нема барем еден глас
  nextBtn.disabled = true;
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

  const votesForItem = allVotes[currentItemIndex];
  if (votesForItem[index] !== undefined) {
    alert("Овој советник веќе гласал за оваа точка.");
    return;
  }

  // успешно логирање
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
  const votesForItem = allVotes[currentItemIndex];

  if (votesForItem[index] !== undefined) {
    alert("Овој советник веќе гласал за оваа точка.");
    return;
  }

  // снимање глас
  votesForItem[index] = choice;

  // инфо и „одјавување“
  loggedCouncilorInfo.textContent =
    `Гласот е запишан за ${councilors[index].name}. (Одјавен)`;
  currentLoggedCouncilorIndex = null;
  voteArea.classList.add("hidden");

  updateCurrentSummary();
}

// === АЖУРИРАЊЕ НА БРОЈАЧИ ЗА ТЕКОВНА ТОЧКА ===

function updateCurrentSummary() {
  const votesForItem = allVotes[currentItemIndex];
  let za = 0, protiv = 0, vozdrzani = 0;

  Object.values(votesForItem).forEach(vote => {
    if (vote === "za") za++;
    else if (vote === "protiv") protiv++;
    else if (vote === "vozdrzan") vozdrzani++;
  });

  const totalVotes = za + protiv + vozdrzani;

  currentZaSpan.textContent = za;
  currentProtivSpan.textContent = protiv;
  currentVozdrzaniSpan.textContent = vozdrzani;
  currentTotalVotesSpan.textContent = totalVotes;

  // дозволи следна точка ако има барем еден глас
  nextBtn.disabled = totalVotes === 0;
}

// === СЛЕДНА ТОЧКА ===

nextBtn.addEventListener("click", () => {
  if (currentItemIndex < agendaItems.length - 1) {
    currentItemIndex++;
    showCurrentAgendaItem();
  } else {
    // нема следна точка -> прикажи резултати
    votingSection.classList.add("hidden");
    resultsSection.classList.remove("hidden");
    fillResultsTable();
  }
});

// === ПОПОЛНУВАЊЕ ТАБЕЛА СО КОНЕЧНИ РЕЗУЛТАТИ ===

function fillResultsTable() {
  resultsTableBody.innerHTML = "";

  agendaItems.forEach((itemTitle, index) => {
    const votesForItem = allVotes[index];
    let za = 0, protiv = 0, vozdrzani = 0;

    Object.values(votesForItem).forEach(vote => {
      if (vote === "za") za++;
      else if (vote === "protiv") protiv++;
      else if (vote === "vozdrzan") vozdrzani++;
    });

    const totalVotes = za + protiv + vozdrzani;

    const row = document.createElement("tr");

    const tdTitle = document.createElement("td");
    tdTitle.textContent = `${index + 1}. ${itemTitle}`;

    const tdTotal = document.createElement("td");
    tdTotal.textContent = `${totalVotes} / ${councilors.length}`;

    const tdZa = document.createElement("td");
    tdZa.textContent = za;

    const tdProtiv = document.createElement("td");
    tdProtiv.textContent = protiv;

    const tdVozdrzani = document.createElement("td");
    tdVozdrzani.textContent = vozdrzani;

    row.appendChild(tdTitle);
    row.appendChild(tdTotal);
    row.appendChild(tdZa);
    row.appendChild(tdProtiv);
    row.appendChild(tdVozdrzani);

    resultsTableBody.appendChild(row);
  });
}
