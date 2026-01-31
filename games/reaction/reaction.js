"use strict";

(() => {
  const BEST_KEY = "miniArena.greentap.best.v1";

  // Palette des 6 couleurs (classes Tailwind)
  // IMPORTANT: on met le vert séparément pour pouvoir garantir qu'il apparaisse.
  const GREEN = { name: "GREEN", cls: "bg-emerald-500/90 dark:bg-emerald-500/35" };

  const COLORS = [
    { name: "RED", cls: "bg-red-500/90 dark:bg-red-500/35" },
    { name: "BLUE", cls: "bg-sky-500/90 dark:bg-sky-500/35" },
    { name: "PURPLE", cls: "bg-purple-500/90 dark:bg-purple-500/35" },
    { name: "YELLOW", cls: "bg-yellow-400/95 dark:bg-yellow-400/30" },
    { name: "ORANGE", cls: "bg-orange-500/90 dark:bg-orange-500/35" },
    { name: "PINK", cls: "bg-pink-500/90 dark:bg-pink-500/35" },
  ];

  // UI
  let startBtn, resetBtn;
  let gridEl, scoreEl, bestEl, speedEl, statusEl, hintEl;
  let countdownEl, countNumEl;
  let gameOverEl, gameOverBoxEl, gameOverTextEl;

  // State
  let running = false;
  let score = 0;
  let best = 0;

  // Timing (ms)
  let intervalMs = 800;     // vitesse initiale (shuffle toutes les ~1.1s)
  const MIN_INTERVAL = 800;  // vitesse max (limite)
  const SPEEDUP = 1;      // à chaque point: intervalMs *= 0.92 (donc plus rapide)

  // Gestion du "deadline"
  let tickTimer = null;      // timeout du shuffle courant
  let expectingGreen = true; // si true => le joueur doit cliquer le vert avant fin du tick

  // Représentation des 6 cases (boutons)
  const tiles = []; // { btn, isGreen }

  function loadBest() {
    const raw = localStorage.getItem(BEST_KEY);
    const v = raw ? Number(raw) : 0;
    return Number.isFinite(v) ? v : 0;
  }

  function saveBest(v) {
    localStorage.setItem(BEST_KEY, String(v));
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function setHint(text) {
    hintEl.textContent = text;
  }

  function updateHUD() {
    scoreEl.textContent = String(score);
    bestEl.textContent = String(best);
    speedEl.textContent = String(Math.round(intervalMs));
  }

  function clearTick() {
    if (tickTimer) {
      clearTimeout(tickTimer);
      tickTimer = null;
    }
  }

 /**
 * Utilitaire: enlève les classes de couleur d'une tile puis applique la nouvelle.
 * NOTE: nos strings contiennent plusieurs classes (ex: "bg-... dark:bg-..."),
 * donc on split par espace pour classList.
 */
function applyTileColor(btn, colorClass) {
  const allColorClasses = [
    ...GREEN.cls.split(" "),
    ...COLORS.flatMap(c => c.cls.split(" "))
  ];

  // enlever toutes les classes couleurs connues
  btn.classList.remove(...allColorClasses);

  // ajouter la nouvelle couleur (split aussi)
  btn.classList.add(...colorClass.split(" "));
}

  /**
   * Génère un nouvel "état" des 6 cases:
   * - on choisit une case qui sera verte (exactement 1)
   * - les autres reçoivent des couleurs aléatoires depuis COLORS
   */
  function shuffleTiles() {
    // Choisir l'index du vert
    const greenIndex = Math.floor(Math.random() * 6);

    for (let i = 0; i < 6; i++) {
      const t = tiles[i];
      if (!t) continue;

      if (i === greenIndex) {
        t.isGreen = true;
        applyTileColor(t.btn, GREEN.cls);
      } else {
        t.isGreen = false;
        const c = COLORS[Math.floor(Math.random() * COLORS.length)];
        applyTileColor(t.btn, c.cls);
      }
    }

    expectingGreen = true;
  }

  /**
   * Si on arrive à la fin du tick et que le joueur n'a pas cliqué sur le vert:
   * => perdu
   */
  function onMissedGreen() {
    if (!running) return;
    if (expectingGreen) {
      gameOver("Tu as raté le vert😂😂😂");
    }
  }

  /**
   * Planifie la prochaine fenêtre de jeu:
   * - shuffle maintenant
   * - lance un timer: si le joueur n'a pas cliqué vert avant intervalMs => miss => game over
   */
  function scheduleTick() {
    if (!running) return;
    clearTick();

    shuffleTiles();

    tickTimer = setTimeout(() => {
      onMissedGreen();
      // Si pas game over (cas rare), on pourrait continuer, mais ici missed => game over.
    }, intervalMs);
  }

  /**
   * Quand le joueur clique une case
   */
  function onTileClick(index) {
    if (!running) return;

    const t = tiles[index];
    if (!t) return;

    // Si le joueur clique autre chose que le vert => perdu direct
    if (!t.isGreen) {
      gameOver("Mauvaise couleur ❌");
      return;
    }

    // Clique correct (vert)
    if (expectingGreen) {
      expectingGreen = false; // on a réussi ce tick

      score += 1;

      
      //intervalMs = Math.max(MIN_INTERVAL, Math.round(intervalMs * SPEEDUP)); // accélère progressivement

      // update best
      if (score > best) {
        best = score;
        saveBest(best);
        setHint("🔥 Nouveau record !");
      } else {
        setHint("✅ Bien joué, continue !");
      }

      updateHUD();

      // On enchaîne directement sur le tick suivant (plus nerveux et fun)
      scheduleTick();
    }
  }

  /**
   * Affiche un compte à rebours 3..2..1 avant de démarrer.
   */
  function startCountdownThenPlay() {
    // UI
    countdownEl.classList.remove("hidden");
    countdownEl.classList.add("flex");

    let n = 3;
    countNumEl.textContent = String(n);

    const step = () => {
      n -= 1;
      if (n <= 0) {
        // Go
        countdownEl.classList.add("hidden");
        countdownEl.classList.remove("flex");
        startGameLoop();
        return;
      }
      countNumEl.textContent = String(n);
      setTimeout(step, 1000);
    };

    setTimeout(step, 1000);
  }

  /**
   * Démarre la partie
   */
  function startGame() {
    // Reset state
    clearTick();
    hideGameOver();

    running = true;
    score = 0;
    intervalMs = 1100;
    expectingGreen = true;

    startBtn.disabled = true;

    setStatus("En jeu");
    setHint("Prépare-toi… tape le vert !");
    updateHUD();

    startCountdownThenPlay();
  }

  /**
   * Démarre réellement le loop après le countdown
   */
  function startGameLoop() {
    if (!running) return;
    setHint("🟩 Tape le vert !");
    scheduleTick();
  }

  function hideGameOver() {
    gameOverEl.classList.add("hidden");
    gameOverEl.classList.remove("flex");
    gameOverBoxEl.classList.remove("anim-pop", "anim-shake");
  }

  function showGameOver(text) {
    gameOverTextEl.textContent = text + ` • Score: ${score}`;
    gameOverEl.classList.remove("hidden");
    gameOverEl.classList.add("flex");

    // relancer animation
    gameOverBoxEl.classList.remove("anim-pop", "anim-shake");
    void gameOverBoxEl.offsetWidth;
    gameOverBoxEl.classList.add("anim-pop", "anim-shake");
  }

  /**
   * Fin de partie
   */
  function gameOver(reason) {
    running = false;
    clearTick();

    startBtn.disabled = false;

    setStatus("Perdu");
    setHint("Cliquez Start pour rejouer.");
    updateHUD();

    showGameOver(reason);
  }

  /**
   * Reset stats (best)
   */
  function resetAll() {
    localStorage.removeItem(BEST_KEY);
    best = 0;
    score = 0;
    intervalMs = 1100;
    running = false;

    clearTick();
    hideGameOver();

    startBtn.disabled = false;

    setStatus("Prêt");
    updateHUD();

    // remet un shuffle “neutre” (juste pour joli)
    shuffleTiles();
  }

  /**
   * Création des 6 boutons tiles (mobile friendly)
   */
  function buildGrid() {
    gridEl.innerHTML = "";
    tiles.length = 0;

    for (let i = 0; i < 6; i++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", `tile-${i}`);

      // Tailwind only: taille généreuse, tap-friendly
      btn.className =
        "h-[110px] sm:h-[150px] rounded-3xl ring-2 ring-white/35 dark:ring-white/10 " +
        "shadow hover:brightness-110 transition active:scale-[0.99]";

      btn.addEventListener("click", () => onTileClick(i));

      gridEl.appendChild(btn);
      tiles.push({ btn, isGreen: false });
    }

    shuffleTiles();
  }

  function bindUI() {
    startBtn = document.getElementById("gtStartBtn");
    resetBtn = document.getElementById("gtResetBtn");

    gridEl = document.getElementById("gtGrid");

    scoreEl = document.getElementById("gtScore");
    bestEl = document.getElementById("gtBest");
    speedEl = document.getElementById("gtSpeed");
    statusEl = document.getElementById("gtStatus");
    hintEl = document.getElementById("gtHint");

    countdownEl = document.getElementById("gtCountdown");
    countNumEl = document.getElementById("gtCountNum");

    gameOverEl = document.getElementById("gtGameOver");
    gameOverBoxEl = document.getElementById("gtGameOverBox");
    gameOverTextEl = document.getElementById("gtGameOverText");

    best = loadBest();

    buildGrid();

    setStatus("Prêt");
    setHint("Clique Start. Puis tape le vert.");
    updateHUD();

    startBtn.addEventListener("click", startGame);
    resetBtn.addEventListener("click", resetAll);

    // Option: si l'utilisateur clique sur l'overlay game over -> fermer
    gameOverEl.addEventListener("click", hideGameOver);
  }

  document.addEventListener("DOMContentLoaded", bindUI);
})();