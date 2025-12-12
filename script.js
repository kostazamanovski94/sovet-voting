// =======================
// КОНФИГУРАЦИЈА
// =======================

// Админ шифра
const ADMIN_PASSWORD = 'admin123';

// Советници и нивни шифри
const councilors = [
  { name: 'Советник 1',  password: '1111' },
  { name: 'Советник 2',  password: '2222' },
  { name: 'Советник 3',  password: '3333' },
  { name: 'Советник 4',  password: '4444' },
  { name: 'Советник 5',  password: '5555' },
  { name: 'Советник 6',  password: '6666' },
  { name: 'Советник 7',  password: '7777' },
  { name: 'Советник 8',  password: '8888' },
  { name: 'Советник 9',  password: '9999' },
  { name: 'Советник 10', password: '1010' },
  { name: 'Советник 11', password: '1110' },
  { name: 'Советник 12', password: '1212' },
  { name: 'Советник 13', password: '1313' },
  { name: 'Советник 14', password: '1414' },
  { name: 'Советник 15', password: '1515' }
];

// Мнозинство (8 „За“)
const MAJORITY_ZA = 8;

// =======================
// СОСТОЈБА
// =======================

let agendaItems = [];            // листа со точки
let currentItemIndex = 0;        // индекс на тековна точка
let allVotes = [];               // allVotes[i] = { councilorIndex: 'za'/'protiv'/'vozdrzan' }
let currentLoggedCouncilorIndex = null;

// =======================
// DOM ЕЛЕМЕНТИ
// =======================

const adminLoginSection = document.getElementById('admin-login-section');
const setupSection      = document.getElementById('setup-section');
const votingSection     = document.getElementById('voting-section');
const resultsSection    = document.getElementById('results-section');

const adminPasswordInput = document.getElementById('adminPassword');
const adminLoginBtn      = document.getElementById('adminLoginBtn');

const agendaInput = document.getElementById('agendaInput');
const startBtn    = document.getElementById('startBtn');

const currentAgendaTitle     = document.getElementById('currentAgendaTitle');
const councilorSelect        = document.getElementById('councilorSelect');
const councilorPasswordInput = document.getElementById('councilorPassword');
const councilorLoginBtn      = document.getElementById('councilorLoginBtn');
const loggedCouncilorInfo    = document.getElementById('loggedCouncilorInfo');

const voteArea = document.getElementById('voteArea');
const btnZa        = document.getElementById('btnZa');
const btnProtiv    = document.getElementById('btnProtiv');
const btnVozdrzan  = document.getElementById('btnVozdrzan');

const currentTotalVotesSpan = document.getElementById('currentTotalVotes');
const currentZaSpan         = document.getElementById('currentZa');
const currentProtivSpan     = document.getElementById('currentProtiv');
const currentVozdrzaniSpan  = document.getElementById('currentVozdrzani');
const nextBtn               = document.getElementById('nextBtn');

const liveResultsTableBody = document.querySelector('#liveResultsTable tbody');
const resultsTableBody     = document.querySelector('#resultsTable tbody');

// =======================
// ИНИЦИЈАЛИЗАЦИЈА
// =======================

// Пополнување на список на советници
(function populateCouncilors() {
  councilors.forEach((c, index) => {
    const opt = document.createElement('option');
    opt.value = String(index);
    opt.textContent = c.name;
    councilorSelect.appendChild(opt);
  });
})();

// Почетна состојба: админ логин видно, останато скриено
adminLoginSection.classList.remove('hidden');
setupSection.classList.add('hidden');
votingSection.classList.add('hidden');
resultsSection.classList.add('hidden');

// =======================
// АДМИН ЛОГИН
// =======================

adminLoginBtn.addEventListener('click', () => {
  const entered = adminPasswordInput.value.trim();
  if (entered === ADMIN_PASSWORD) {
    adminPasswordInput.value = '';
    adminLoginSection.classList.add('hidden');
    setupSection.classList.remove('hidden');
  } else {
    alert('Неточна админ шифра.');
  }
});

// =======================
// ВНЕС НА ТОЧКИ
// =======================

startBtn.addEventListener('click', () => {
  const rawText = agendaInput.value.trim();
  if (!rawText) {
    alert('Внеси барем една точка.');
    return;
  }

  agendaItems = rawText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (agendaItems.length === 0) {
    alert('Нема валидни точки.');
    return;
  }

  // празни гласови за секоја точка
  allVotes = agendaItems.map(() => ({}));
  currentItemIndex = 0;

  setupSection.classList.add('hidden');
  votingSection.classList.remove('hidden');
  resultsSection.classList.add('hidden');

  showCurrentAgendaItem();
  updateLiveResultsTable();
});

// =======================
// ПРИКАЗ НА ТЕКОВНА ТОЧКА
// =======================

function showCurrentAgendaItem() {
  if (currentItemIndex < 0 || currentItemIndex >= agendaItems.length) {
    currentItemIndex = 0;
  }

  const title = agendaItems[currentItemIndex];
  currentAgendaTitle.textContent = (currentItemIndex + 1) + '. ' + title;

  currentLoggedCouncilorIndex = null;
  councilorSelect.value = '';
  councilorPasswordInput.value = '';
  loggedCouncilorInfo.textContent = '';
  voteArea.classList.add('hidden');

  updateCurrentSummary();
  updateLiveResultsTable();
}

// =======================
// ЛОГИРАЊЕ НА СОВЕТНИК
// =======================

councilorLoginBtn.addEventListener('click', () => {
  const indexStr = councilorSelect.value;
  const password = councilorPasswordInput.value;

  if (!indexStr) {
    alert('Одбери советник.');
    return;
  }

  const index = parseInt(indexStr, 10);
  const councilor = councilors[index];
  if (!councilor) return;

  if (password !== councilor.password) {
    alert('Неточна шифра.');
    return;
  }

  const votesForItem = allVotes[currentItemIndex] || {};
  if (votesForItem[index] !== undefined) {
    alert('Овој советник веќе гласал за оваа точка.');
    return;
  }

  currentLoggedCouncilorIndex = index;
  loggedCouncilorInfo.textContent = 'Најавен советник: ' + councilor.name;
  councilorPasswordInput.value = '';
  voteArea.classList.remove('hidden');
});

// =======================
// ГЛАСАЊЕ
// =======================

btnZa.addEventListener('click',       () => handleVote('za'));
btnProtiv.addEventListener('click',   () => handleVote('protiv'));
btnVozdrzan.addEventListener('click', () => handleVote('vozdrzan'));

function handleVote(choice) {
  if (currentLoggedCouncilorIndex === null) {
    alert('Прво најави советник.');
    return;
  }

  const index = currentLoggedCouncilorIndex;
  const votesForItem = allVotes[currentItemIndex] || {};

  if (votesForItem[index] !== undefined) {
    alert('Овој советник веќе гласал за оваа точка.');
    return;
  }

  votesForItem[index] = choice;
  allVotes[currentItemIndex] = votesForItem;

  loggedCouncilorInfo.textContent =
    'Гласот е запишан за ' + councilors[index].name + '. (Одјавен)';
  currentLoggedCouncilorIndex = null;
  voteArea.classList.add('hidden');

  updateCurrentSummary();
  updateLiveResultsTable();
}

// =======================
// БРОЈАЧИ ЗА ТЕКОВНА ТОЧКА
// =======================

function updateCurrentSummary() {
  const votesForItem = allVotes[currentItemIndex] || {};
  let za = 0, protiv = 0, vozdrzani = 0;

  Object.values(votesForItem).forEach(vote => {
    if (vote === 'za') za++;
    else if (vote === 'protiv') protiv++;
    else if (vote === 'vozdrzan') vozdrzani++;
  });

  const totalVotes = za + protiv + vozdrzani;

  currentZaSpan.textContent        = String(za);
  currentProtivSpan.textContent    = String(protiv);
  currentVozdrzaniSpan.textContent = String(vozdrzani);
  currentTotalVotesSpan.textContent= String(totalVotes);

  nextBtn.disabled = to
