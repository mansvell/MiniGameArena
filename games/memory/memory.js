(() => {
  const BEST_KEY = "miniArena.memory.best.v1"; // { bestTime, bestMoves }

  // --- Choix des "images" : ici des emojis (simple + rapide)
  // Tu peux remplacer par des images URL plus tard.
  const ICONS = ["🦔","⚡","🎮","🍄","🚀","🐉","🧠","🍕","🏎️","🎧","🪙","🧊"]; // 12 icônes => 12 paires

  // UI
  let boardEl, startBtn, newBtn;
  let timeEl, movesEl, pairsEl, bestTimeEl, bestMovesEl, hintEl, statusEl;
  let countdownEl, countNumEl;
  let winEl, winBoxEl, winTextEl;

  // State
  let running = false;
  let startT = 0;
  let rafId = null;
  let moves = 0;
  let pairs = 0;

  // Cartes (25)
  // card: { id, icon, isLogo, matched, open, btn }
  let cards = [];

  // Gestion flip
  let first = null;
  let second = null;
  let lock = false;

  function loadBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      if (!raw) return { bestTime: null, bestMoves: null };
      const o = JSON.parse(raw);
      return {
        bestTime: Number.isFinite(o.bestTime) ? o.bestTime : null,
        bestMoves: Number.isFinite(o.bestMoves) ? o.bestMoves : null,
      };
    } catch {
      return { bestTime: null, bestMoves: null };
    }
  }

  function saveBest(bestTime, bestMoves) {
    localStorage.setItem(BEST_KEY, JSON.stringify({ bestTime, bestMoves }));
  }

  function renderBest() {
    const b = loadBest();
    bestTimeEl.textContent = b.bestTime == null ? "—" : b.bestTime.toFixed(1);
    bestMovesEl.textContent = b.bestMoves == null ? "—" : String(b.bestMoves);
  }

  function setHint(t) { hintEl.textContent = t; }
  function setStatus(t) { statusEl.textContent = t; }

  function elapsedSec() {
    return (performance.now() - startT) / 1000;
  }

  function tick() {
    if (!running) return;
    timeEl.textContent = elapsedSec().toFixed(1);
    rafId = requestAnimationFrame(tick);
  }

  // --- Shuffle (Fisher–Yates)
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Génère 24 cartes (12 paires) + 1 carte logo (bloquée)
   */
  function buildDeck() {
    const deck = [];

    // 12 paires => 24 cartes
    ICONS.forEach((icon, idx) => {
      deck.push({ id: `${idx}-a`, icon, isLogo: false, matched: false, open: false });
      deck.push({ id: `${idx}-b`, icon, isLogo: false, matched: false, open: false });
    });

    shuffle(deck);

    // On ajoute 1 carte "logo" pour faire 25 (5x5)
    deck.push({ id: "logo", icon: "MnK", isLogo: true, matched: true, open: true });

    // Shuffle final pour placer le logo n'importe où
    shuffle(deck);

    return deck;
  }

  /**
   * Applique l'état visuel (open/closed/matched)
   */
  function renderCard(card) {
    const btn = card.btn;

    // reset faces
    const front = btn.querySelector("[data-front]");
    const back = btn.querySelector("[data-back]");

    if (card.open) {
      front.classList.add("hidden");
      back.classList.remove("hidden");
    } else {
      back.classList.add("hidden");
      front.classList.remove("hidden");
    }

    // matched style
    if (card.matched && !card.isLogo) {
      btn.classList.add("opacity-60");
    } else {
      btn.classList.remove("opacity-60");
    }

    // logo special
    if (card.isLogo) {
      btn.classList.add("cursor-default");
    }
  }

  /**
   * Crée le board 5x5
   */
  function renderBoard() {
    boardEl.innerHTML = "";
    cards.forEach((card, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";

      // Taille responsive : 5 colonnes, carrés
      btn.className =
        "relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden " +
        "ring-2 ring-white/35 dark:ring-white/10 shadow " +
        "bg-white/55 dark:bg-white/5 " +
        "hover:brightness-105 active:scale-[0.99] transition " +
        "select-none";

      // Face "fermée"
      const front = document.createElement("div");
      front.dataset.front = "1";
      front.className =
        "absolute inset-0 flex items-center justify-center " +
        "bg-gradient-to-br from-amber-200/80 to-orange-500/60 dark:from-white/10 dark:to-white/5";

      front.innerHTML = `
        <div class="text-2xl sm:text-3xl font-extrabold text-white drop-shadow">
          ?
        </div>
      `;

      // Face "ouverte"
      const back = document.createElement("div");
      back.dataset.back = "1";
      back.className =
        "absolute inset-0 hidden flex items-center justify-center " +
        "bg-white/75 dark:bg-neutral-950/50";

      if (card.isLogo) {
        back.innerHTML = `
          <div class="text-center">
            <div class="text-2xl sm:text-3xl font-extrabold text-orange-600 dark:text-amber-300">MnK</div>
            <div class="text-xs font-bold opacity-75">bonus tile</div>
          </div>
        `;
      } else {
        back.innerHTML = `<div class="text-4xl sm:text-5xl">${card.icon}</div>`;
      }

      btn.appendChild(front);
      btn.appendChild(back);

      card.btn = btn;

      btn.addEventListener("click", () => onCardClick(idx));

      boardEl.appendChild(btn);
      renderCard(card);
    });
  }

  function resetRoundState() {
    first = null;
    second = null;
    lock = false;
  }

  function onCardClick(index) {
    if (!running) return;
    if (lock) return;

    const card = cards[index];
    if (!card) return;

    // Logo = décor, pas cliquable
    if (card.isLogo) return;

    // Déjà matchée => ignore
    if (card.matched) return;

    // Déjà ouverte => ignore
    if (card.open) return;

    // Open it
    card.open = true;
    renderCard(card);

    // 1er / 2e choix
    if (!first) {
      first = card;
      return;
    }

    second = card;
    moves += 1; // un "coup" = 2 cartes retournées
    movesEl.textContent = String(moves);

    // lock pendant la comparaison
    lock = true;

    // Match ?
    if (first.icon === second.icon) {
      // Pair found
      first.matched = true;
      second.matched = true;
      pairs += 1;

      pairsEl.textContent = String(pairs);
      setHint("✅ Paar gefunden !");

      // Laisse ouvertes
      renderCard(first);
      renderCard(second);

      resetRoundState();
      lock = false;

      // Win ?
      if (pairs === 12) finishGame();
      return;
    }

    // Pas match => flip back après delay
    setHint("❌ nicht gleich…");
    setTimeout(() => {
      first.open = false;
      second.open = false;
      renderCard(first);
      renderCard(second);
      resetRoundState();
      lock = false;
    }, 650);
  }

  function hideWin() {
    winEl.classList.add("hidden");
    winEl.classList.remove("flex");
    winBoxEl.classList.remove("anim-pop", "anim-shake");
  }

  function showWin(text) {
    winTextEl.textContent = text;
    winEl.classList.remove("hidden");
    winEl.classList.add("flex");
    winBoxEl.classList.remove("anim-pop", "anim-shake");
    void winBoxEl.offsetWidth;
    winBoxEl.classList.add("anim-pop");
  }

  function finishGame() {
    running = false;
    setStatus("Gagné");
    setHint("🏆 GG ! Nouveau run terminé.");

    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;

    const t = elapsedSec();
    timeEl.textContent = t.toFixed(1);

    // Best logic: meilleur temps, et si égal => moins de coups
    const b = loadBest();
    let bestTime = b.bestTime;
    let bestMoves = b.bestMoves;

    const better =
      bestTime == null ||
      t < bestTime - 0.0001 ||
      (Math.abs(t - bestTime) < 0.0001 && bestMoves != null && moves < bestMoves);

    if (better) {
      bestTime = Number(t.toFixed(1));
      bestMoves = moves;
      saveBest(bestTime, bestMoves);
      renderBest();
      showWin(`Nouveau record 🎉 • ${bestTime}s • ${bestMoves} coups`);
    } else {
      showWin(`Terminé • ${t.toFixed(1)}s • ${moves} coups`);
    }
  }

  function clearTimers() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function startCountdownThenStart() {
    // overlay 3..2..1
    countdownEl.classList.remove("hidden");
    countdownEl.classList.add("flex");

    let n = 3;
    countNumEl.textContent = String(n);

    const step = () => {
      n -= 1;
      if (n <= 0) {
        countdownEl.classList.add("hidden");
        countdownEl.classList.remove("flex");
        startGame();
        return;
      }
      countNumEl.textContent = String(n);
      setTimeout(step, 1000);
    };

    setTimeout(step, 1000);
  }

  function startGame() {
    hideWin();
    clearTimers();
    resetRoundState();

    // reset stats
    running = true;
    moves = 0;
    pairs = 0;
    movesEl.textContent = "0";
    pairsEl.textContent = "0";
    timeEl.textContent = "0.0";

    setStatus("En jeu");
    setHint("Mémorise et trouve les paires !");
    startT = performance.now();

    // reset cards
    cards.forEach(c => {
      if (c.isLogo) {
        c.open = true;
        c.matched = true;
      } else {
        c.open = false;
        c.matched = false;
      }
    });
    renderBoard();

    rafId = requestAnimationFrame(tick);
  }

  function newGame() {
    hideWin();
    clearTimers();
    resetRoundState();

    // new shuffle deck
    cards = buildDeck();
    renderBoard();

    running = false;
    moves = 0;
    pairs = 0;
    movesEl.textContent = "0";
    pairsEl.textContent = "0";
    timeEl.textContent = "0.0";

    setStatus("Prêt");
    setHint("Clique Start. (Compte à rebours 3s)");
  }

  function bind() {
    boardEl = document.getElementById("mcBoard");
    startBtn = document.getElementById("mcStartBtn");
    newBtn = document.getElementById("mcNewBtn");

    timeEl = document.getElementById("mcTime");
    movesEl = document.getElementById("mcMoves");
    pairsEl = document.getElementById("mcPairs");
    bestTimeEl = document.getElementById("mcBestTime");
    bestMovesEl = document.getElementById("mcBestMoves");
    hintEl = document.getElementById("mcHint");
    statusEl = document.getElementById("mcStatus");

    countdownEl = document.getElementById("mcCountdown");
    countNumEl = document.getElementById("mcCountNum");

    winEl = document.getElementById("mcWin");
    winBoxEl = document.getElementById("mcWinBox");
    winTextEl = document.getElementById("mcWinText");

    renderBest();

    cards = buildDeck();
    renderBoard();

    setStatus("Prêt");
    

    startBtn.addEventListener("click", () => {
      if (running) return;
      startBtn.disabled = true;
      startCountdownThenStart();
      // réactive après countdown (sécurité)
      setTimeout(() => { startBtn.disabled = false; }, 3200);
    });

    newBtn.addEventListener("click", newGame);
    winEl.addEventListener("click", hideWin);
  }

  document.addEventListener("DOMContentLoaded", bind);
})();