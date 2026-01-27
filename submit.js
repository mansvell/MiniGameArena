"use strict";

function svgData(label, icon) {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="520" height="520">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>
        <stop offset="1" stop-color="#ffcc00" stop-opacity="0.35"/>
      </linearGradient>
    </defs>
    <rect x="18" y="18" width="484" height="484" rx="46" fill="url(#g)" stroke="#ff9900" stroke-width="10"/>
    <text x="260" y="250" font-size="140" text-anchor="middle" dominant-baseline="middle">${icon}</text>
    <text x="260" y="385" font-size="54" font-family="Trebuchet MS, Arial" font-weight="700"
          text-anchor="middle" fill="#333">${label}</text>
  </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.trim());
}

// 0=Rock, 1=Paper, 2=Scissors
const images = [
  svgData("Pierre", "🪨"),
  svgData("Papier", "📄"),
  svgData("Ciseaux", "✂️")
];

const names = ["Pierre", "Papier", "Ciseaux"];

let scoreC = 0;
let scorePl = 0;

let existenz = false;
let select = -1;

//Stats persistantes (LocalStorage)
const STATS_KEY = "miniArena.stats.v1";
const THEME_KEY = "miniArena.theme.v1"; // "dark" | "light"

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return { games: 0, wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0 };
    const s = JSON.parse(raw);
    return {
      games: Number(s.games ?? 0),
      wins: Number(s.wins ?? 0),
      losses: Number(s.losses ?? 0),
      draws: Number(s.draws ?? 0),
      streak: Number(s.streak ?? 0),
      bestStreak: Number(s.bestStreak ?? 0),
    };
  } catch {
    return { games: 0, wins: 0, losses: 0, draws: 0, streak: 0, bestStreak: 0 };
  }
}

function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

function winRate(stats) {
  if (stats.games === 0) return 0;
  return Math.round((stats.wins / stats.games) * 100);
}

function renderStatsTab() {
  const stats = loadStats();
  const panel = document.querySelector("#tab-stats .scorePanel");
  if (!panel) return;

  panel.innerHTML = `
    <h2>Statistiques</h2>
    <div class="mt-3" style="text-align:left;">
      <div><strong>Parties jouées :</strong> ${stats.games}</div>
      <div><strong>Victoires :</strong> ${stats.wins}</div>
      <div><strong>Défaites :</strong> ${stats.losses}</div>
      <div><strong>Nuls :</strong> ${stats.draws}</div>
      <hr/>
      <div><strong>Winrate :</strong> ${winRate(stats)}%</div>
      <div><strong>Streak actuel :</strong> ${stats.streak}</div>
      <div><strong>Meilleure streak :</strong> ${stats.bestStreak}</div>
    </div>
  `;
}

function recordResult(result) {
  const stats = loadStats();
  stats.games += 1;

  if (result === "WIN") {
    stats.wins += 1;
    stats.streak += 1;
    if (stats.streak > stats.bestStreak) stats.bestStreak = stats.streak;
  } else if (result === "LOSE") {
    stats.losses += 1;
    stats.streak = 0;
  } else {
    stats.draws += 1;
    stats.streak = 0;
  }

  saveStats(stats);
  renderStatsTab();
}

function getResult(player, computer) {
  if (player === computer) return "DRAW";

  // Rock beats Scissors, Scissors beats Paper, Paper beats Rock
  // 0 beats 2, 2 beats 1, 1 beats 0
  const beats = new Map([
    [0, 2],
    [2, 1],
    [1, 0],
  ]);

  return beats.get(player) === computer ? "WIN" : "LOSE";
}

function updateScore() {
  const pScore = document.getElementById("scoreP");
  if (pScore) pScore.innerText = String(scorePl);

  const cScore = document.getElementById("scoreC");
  if (cScore) cScore.innerText = String(scoreC);
}

//Fonctions appelées par le HTML (onclick)
function start() {
  const dec = document.getElementById("decision");

  if (!existenz) {
    if (dec) dec.innerText = "Please select your choice";
    return;
  }

  const i = Math.floor(3 * Math.random());
  const imgComp = document.getElementById("computer");
  if (imgComp) imgComp.src = images[i];

  const result = getResult(select, i);

  if (result === "DRAW") {
    if (dec) dec.innerText = `ÉGALITÉ ! (${names[select]} vs ${names[i]})`;
  } else if (result === "WIN") {
    if (dec) dec.innerText = `GAGNÉ ! (${names[select]} bat ${names[i]})`;
    scorePl++;
  } else {
    if (dec) dec.innerText = `PERDU ! (${names[i]} bat ${names[select]})`;
    scoreC++;
  }

  updateScore();
  recordResult(result);

  const resetStart = document.getElementById("startButton");
  if (resetStart) resetStart.disabled = true;

  const resetNew = document.getElementById("newRoundButton");
  if (resetNew) resetNew.disabled = false;
}

function play(choice) {
  const imgPl = document.getElementById("spieler");
  if (imgPl) {
    imgPl.src = images[choice];
    select = choice;
    existenz = true;
  }

  const dec = document.getElementById("decision");
  if (dec) dec.innerText = `Choisi: ${names[choice]}`;
}

function resetGame() {
  const imgComp = document.getElementById("computer");
  if (imgComp) imgComp.src = "";

  const imgPl = document.getElementById("spieler");
  if (imgPl) imgPl.src = "";

  existenz = false;

  const resetStart = document.getElementById("startButton");
  if (resetStart) resetStart.disabled = false;

  const resetNew = document.getElementById("newRoundButton");
  if (resetNew) resetNew.disabled = true;

  const schrift = document.getElementById("decision");
  if (schrift) schrift.textContent = "Nouvelle manche prête.";
}

//Settings
function applySavedTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark") document.body.classList.add("dark");
  else document.body.classList.remove("dark");
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, document.body.classList.contains("dark") ? "dark" : "light");
}

function resetStats() {
  localStorage.removeItem(STATS_KEY);
  renderStatsTab();
}

//Init
function setup() {
  const resetNew = document.getElementById("newRoundButton");
  if (resetNew) resetNew.disabled = true;

  renderStatsTab();
  applySavedTheme();

  const themeBtn = document.getElementById("toggleThemeBtn");
  if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

  const resetStatsBtn = document.getElementById("resetStatsBtn");
  if (resetStatsBtn) resetStatsBtn.addEventListener("click", resetStats);
}

document.addEventListener("DOMContentLoaded", setup);

// rendre visibles pour onclick=""
window.start = start;
window.play = play;
window.resetGame = resetGame;


