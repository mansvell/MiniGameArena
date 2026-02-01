(() => {
  const MIN_LEVEL = 5;
  const MAX_LEVEL = 10;

  const SHOW_MS = 650;        // durée d’affichage d’une couleur
  const GAP_MS = 160;         // pause entre couleurs
  const MEMO_SECONDS = 5;     // temps de mémorisation
  const TIME_REFRESH_MS = 50; // rafraîchissement du timer UI

  // 6 couleurs possibles
  const COLORS = [
    { key: "red",    label: "Rouge",  css: "#ef4444" },
    { key: "blue",   label: "Bleu",   css: "#3b82f6" },
    { key: "green",  label: "Vert",   css: "#22c55e" },
    { key: "yellow", label: "Jaune",  css: "#f59e0b" },
    { key: "purple", label: "Violet", css: "#a855f7" },
    { key: "cyan",   label: "Cyan",   css: "#06b6d4" },
  ];

  // LocalStorage keys
  const KEY_BEST_LEVEL = "miniArena.memcolors.bestLevel.v1";
  const KEY_BEST_WIN_TIME = "miniArena.memcolors.bestWinTime.v1"; // temps pour finir niveau 10

  // ===== Elements =====
  let startBtn, restartBtn, display, msg, phaseEl, levelEl, cdEl, timeEl, bestLevelEl, bestWinEl;
  let colorButtons = [];

  // ===== State =====
  let level = MIN_LEVEL;
  let sequence = [];
  let inputIndex = 0;

  let phase = "IDLE"; // IDLE | SHOW | MEMO | INPUT | WIN | LOSE
  let runningTimer = false;
  let timeStart = 0;
  let timeInterval = null;

  function $(id){ return document.getElementById(id); }

  function setPhase(p){
    phase = p;
    phaseEl.textContent = p;
  }

  function setMsg(t){ msg.textContent = t || ""; }

  function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

  function randColorKey(){
    const i = Math.floor(Math.random() * COLORS.length);
    return COLORS[i].key;
  }

  function colorByKey(key){
    return COLORS.find(c => c.key === key);
  }

  function setDisplayColor(key){
    if (!key) {
      display.style.background = "rgba(255,255,255,0.35)";
      return;
    }
    const c = colorByKey(key);
    display.style.background = c ? c.css : "rgba(255,255,255,0.35)";
  }

  function enableColorButtons(enabled){
    colorButtons.forEach(b => b.disabled = !enabled);
  }

  function readBestLevel(){
    const v = Number(localStorage.getItem(KEY_BEST_LEVEL) || "0");
    return Number.isFinite(v) ? v : 0;
  }

  function writeBestLevel(v){
    localStorage.setItem(KEY_BEST_LEVEL, String(v));
  }

  function readBestWinTime(){
    const raw = localStorage.getItem(KEY_BEST_WIN_TIME);
    const v = raw ? Number(raw) : 0;
    return Number.isFinite(v) ? v : 0;
  }

  function writeBestWinTime(v){
    localStorage.setItem(KEY_BEST_WIN_TIME, String(v));
  }

  function updateBestUI(){
    const bestLevel = readBestLevel();
    bestLevelEl.textContent = bestLevel ? String(bestLevel) : "—";

    const bestWin = readBestWinTime();
    bestWinEl.textContent = bestWin ? `${bestWin.toFixed(2)}s` : "—";
  }

  function updateLevelUI(){
    levelEl.textContent = String(level);
  }

  function stopTimer(){
    runningTimer = false;
    if (timeInterval) clearInterval(timeInterval);
    timeInterval = null;
  }

  function startTimer(){
    runningTimer = true;
    timeStart = performance.now();
    stopTimer(); // safety (clears interval)
    runningTimer = true;
    timeInterval = setInterval(() => {
      if (!runningTimer) return;
      const t = (performance.now() - timeStart) / 1000;
      timeEl.textContent = t.toFixed(2);
    }, TIME_REFRESH_MS);
  }

  function currentTimeSeconds(){
    return (performance.now() - timeStart) / 1000;
  }

  function resetRunUI(){
    cdEl.textContent = "—";
    timeEl.textContent = "0.00";
    setDisplayColor(null);
  }

  function newSequenceForLevel(n){
    const s = [];
    for (let i=0;i<n;i++) s.push(randColorKey());
    return s;
  }

  async function showSequence(){
    setPhase("SHOW");
    setMsg("Observe la séquence…");
    enableColorButtons(false);
    resetRunUI();

    for (const key of sequence){
      setDisplayColor(key);
      await sleep(SHOW_MS);
      setDisplayColor(null);
      await sleep(GAP_MS);
    }
  }

  async function memoCountdown(){
    setPhase("MEMO");
    setMsg("Mémorise…");
    enableColorButtons(false);

    for (let s = MEMO_SECONDS; s >= 1; s--){
      cdEl.textContent = `${s}s`;
      await sleep(1000);
    }
    cdEl.textContent = "GO!";
    await sleep(250);
    cdEl.textContent = "—";
  }

  function beginInput(){
    setPhase("INPUT");
    setMsg("À toi ! Clique dans l’ordre.");
    inputIndex = 0;

    enableColorButtons(true);
    startTimer();
  }

  async function startRound(){
    restartBtn.disabled = true;
    startBtn.disabled = true;

    updateLevelUI();
    sequence = newSequenceForLevel(level);
    inputIndex = 0;

    await showSequence();
    await memoCountdown();
    beginInput();
  }

  function fail(){
    stopTimer();
    enableColorButtons(false);
    setPhase("LOSE");
    setMsg("❌ Faux ! Clique Rejouer.");
    restartBtn.disabled = false;
    startBtn.disabled = false;

    // best level update (niveau atteint = level-1 si tu rates ce niveau)
    const reached = Math.max(MIN_LEVEL, level - 1);
    const best = readBestLevel();
    if (reached > best) writeBestLevel(reached);
    updateBestUI();
  }

  function win(){
    stopTimer();
    enableColorButtons(false);
    setPhase("WIN");

    const t = currentTimeSeconds();
    setMsg(`🏆 Bravo ! Tu as réussi le niveau 10 en ${t.toFixed(2)}s`);

    // best level = 10
    writeBestLevel(MAX_LEVEL);

    // best win time
    const bestWin = readBestWinTime();
    if (!bestWin || t < bestWin) writeBestWinTime(t);
    updateBestUI();

    restartBtn.disabled = false;
    startBtn.disabled = false;
  }

  async function nextLevel(){
    stopTimer();
    enableColorButtons(false);

    // best level update: tu as réussi ce niveau
    const best = readBestLevel();
    if (level > best) writeBestLevel(level);
    updateBestUI();

    if (level >= MAX_LEVEL){
      // victoire finale (timer correspond au niveau 10)
      win();
      return;
    }

    // petit “cooldown” visuel
    setMsg(`✅ Bien ! Niveau ${level} réussi. Niveau ${level+1}…`);
    await sleep(900);

    // niveau suivant
    level += 1;
    resetRunUI();
    await startRound();
  }

  function onColorClick(key){
    if (phase !== "INPUT") return;

    const expected = sequence[inputIndex];
    if (key !== expected){
      fail();
      return;
    }

    // feedback minimal : flash rapide de la bonne couleur
    setDisplayColor(key);
    setTimeout(() => setDisplayColor(null), 120);

    inputIndex += 1;

    // fini la séquence du niveau
    if (inputIndex >= sequence.length){
      nextLevel();
    }
  }

  function resetGame(){
    stopTimer();
    level = MIN_LEVEL;
    updateLevelUI();
    resetRunUI();
    setPhase("IDLE");
    setMsg("Prêt. Clique Démarrer.");
    enableColorButtons(false);
    restartBtn.disabled = true;
    startBtn.disabled = false;
  }

  function bind(){
    startBtn = $("mcStartBtn");
    restartBtn = $("mcRestartBtn");
    display = $("mcDisplay");
    msg = $("mcMsg");
    phaseEl = $("mcPhase");
    levelEl = $("mcLevel");
    cdEl = $("mcCountdown");
    timeEl = $("mcTime");
    bestLevelEl = $("mcBestLevel");
    bestWinEl = $("mcBestWin");

    colorButtons = Array.from(document.querySelectorAll('button[data-color]'));

    updateBestUI();
    resetGame();

    startBtn.addEventListener("click", async () => {
      resetGame();
      startBtn.disabled = true;
      await startRound();
    });

    restartBtn.addEventListener("click", async () => {
      resetGame();
      startBtn.disabled = true;
      await startRound();
    });

    colorButtons.forEach(btn => {
      btn.addEventListener("click", () => onColorClick(btn.dataset.color));
    });
  }

  document.addEventListener("DOMContentLoaded", bind);
})();
