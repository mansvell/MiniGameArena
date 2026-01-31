// SURVIVAL DODGE (mode infini)
(function () {
  const BEST_KEY = "miniArena.survival.best.v1";

  let canvas, ctx;
  let startBtn, restartBtn, timeEl, bestEl, msgEl;

  let running = false;
  let rafId = null;
  let lastT = 0;
  let startTime = 0;

  //game over 
    let overlayEl, overlayTimeEl;

  // Zone (canvas)
  const W = 640, H = 640;

  // Player
  const player = { x: W / 2, y: H / 2, r: 10 };

  // Ennemis
  const enemies = [];
  let secondSpawned = false;
  let spawnAnim = 0; // 0..1 pour l’animation d’apparition

  // Settings gameplay
  const enemySpeed1 = 120; // px/s
  const enemySpeed2 = 220; // px/s
  const accelOverTime = 9; // vitesse augmente doucement avec le temps

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function dist2(ax, ay, bx, by) {
    const dx = ax - bx, dy = ay - by;
    return dx * dx + dy * dy;
  }

  function loadBest() {
    const raw = localStorage.getItem(BEST_KEY);
    const val = raw ? Number(raw) : 0;
    return Number.isFinite(val) ? val : 0;
  }

  function saveBest(v) {
    localStorage.setItem(BEST_KEY, String(v));
  }

  function setBestUI() {
    const best = loadBest();
    if (bestEl) bestEl.textContent = best.toFixed(2);
  }

  // L’astuce pour “même si la souris sort du cadre” :
  // On écoute mousemove sur document, mais on clamp dans le canvas.
  function getCanvasRect() {
    return canvas.getBoundingClientRect();
  }

  function onMouseMove(e) {
    if (!canvas) return;
    const rect = getCanvasRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    // clamp dans le périmètre + rayon
    player.x = clamp(mx, player.r, canvas.width - player.r);
    player.y = clamp(my, player.r, canvas.height - player.r);
  }

  function resetGame() {
    enemies.length = 0;
    enemies.push({ x: 80, y: 80, r: 20, baseSpeed: enemySpeed1 });
    secondSpawned = false;
    spawnAnim = 0;

    player.x = W / 2;
    player.y = H / 2;

    if (timeEl) timeEl.textContent = "0.00";
    
  }

  function startGame() {
    if (!canvas || !ctx) return;

    running = true;
    startBtn.disabled = true;
    restartBtn.disabled = true;
    if (msgEl) msgEl.textContent = "Survis !";

    startTime = performance.now();
    lastT = startTime;

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function gameOver(survivedSeconds) {
    running = false;

    startBtn.disabled = false;
    restartBtn.disabled = false;

    const best = loadBest();
    if (survivedSeconds > best) {
      saveBest(survivedSeconds);
      setBestUI();
      if (msgEl) msgEl.textContent = `💥 Touché ! Nouveau record: ${survivedSeconds.toFixed(2)}s`;
    } else {
      if (msgEl) msgEl.textContent = `💥 Touché ! Temps: ${survivedSeconds.toFixed(2)}s`;
    }

    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;

    // Overlay "Game Over" (3s)
    if (overlayEl) {
      overlayEl.classList.remove("hidden");
      overlayEl.classList.add("flex");

    
      const box = overlayEl.querySelector("div");
      if (box) {
        box.classList.remove("go-pop", "go-shake");
        
        void box.offsetWidth;
        box.classList.add("go-pop", "go-shake");
      }

      if (overlayTimeEl) overlayTimeEl.textContent = `Temps: ${survivedSeconds.toFixed(2)}s`;

      setTimeout(() => {
        overlayEl.classList.add("hidden");
        overlayEl.classList.remove("flex");
      }, 3000);
    }

  }

  function update(dt, elapsed) {
    // Spawn 2e ennemi à 10s
    if (!secondSpawned && elapsed >= 10) {
      secondSpawned = true;
      spawnAnim = 0.0001;

      // spawn loin du joueur (coin opposé)
      const spawnX = player.x < W / 2 ? W - 80 : 80;
      const spawnY = player.y < H / 2 ? H - 80 : 80;
      enemies.push({ x: spawnX, y: spawnY, r: 11, baseSpeed: enemySpeed2 });

      // petite “animation” via msg + halo
      if (msgEl) msgEl.textContent = " 2e ennemi apparu !";
      setTimeout(() => { if (running && msgEl) msgEl.textContent = "Survis !"; }, 900);
    }

    if (spawnAnim > 0) {
      spawnAnim = Math.min(1, spawnAnim + dt * 2.2);
      if (spawnAnim === 1) spawnAnim = 0;
    }

    // Déplacement des ennemis : ils “poursuivent” le joueur
    for (const en of enemies) {
      const dx = player.x - en.x;
      const dy = player.y - en.y;
      const len = Math.hypot(dx, dy) || 1;

      // vitesse augmente doucement avec le temps (mode survie)
      const speed = en.baseSpeed + elapsed * accelOverTime;

      const vx = (dx / len) * speed;
      const vy = (dy / len) * speed;

      en.x += vx * dt;
      en.y += vy * dt;

      // clamp dans l’arène
      en.x = clamp(en.x, en.r, W - en.r);
      en.y = clamp(en.y, en.r, H - en.r);

      // collision
      const rr = (player.r + en.r);
      if (dist2(player.x, player.y, en.x, en.y) <= rr * rr) {
        const survived = elapsed;
        gameOver(survived);
        return;
      }
    }

    // UI time
    if (timeEl) timeEl.textContent = elapsed.toFixed(2);
  }

  function draw(elapsed) {
    ctx.clearRect(0, 0, W, H);

    // fond léger
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillRect(0, 0, W, H);

    // petit texte discret
    ctx.font = "14px Trebuchet MS, Arial";
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillText(`Survie: ${elapsed.toFixed(2)}s`, 16, 24);

    // player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(40, 170, 255, 0.95)";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.stroke();

    // ennemis
    enemies.forEach((en, idx) => {
      ctx.beginPath();
      ctx.arc(en.x, en.y, en.r, 0, Math.PI * 2);
      ctx.fillStyle = idx === 0 ? "rgba(255, 70, 70, 0.95)" : "rgba(170, 60, 255, 0.95)";
      ctx.fill();

      // halo animation quand le 2e apparaît
      if (idx === 1 && spawnAnim > 0) {
        const pulse = 1 + Math.sin(spawnAnim * Math.PI) * 0.8;
        ctx.beginPath();
        ctx.arc(en.x, en.y, en.r * (1.8 * pulse), 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(170, 60, 255, 0.35)";
        ctx.lineWidth = 6;
        ctx.stroke();
      }
    });
  }

  function loop(t) {
    if (!running) return;

    const dt = Math.min(0.033, (t - lastT) / 1000); // clamp dt
    lastT = t;

    const elapsed = (t - startTime) / 1000;

    update(dt, elapsed);
    if (!running) return;

    draw(elapsed);
    rafId = requestAnimationFrame(loop);
  }

  function bindUI() {
    canvas = document.getElementById("survivalCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");

    startBtn = document.getElementById("survivalStartBtn");
    restartBtn = document.getElementById("survivalRestartBtn");
    timeEl = document.getElementById("survivalTime");
    bestEl = document.getElementById("survivalBest");
    msgEl = document.getElementById("survivalMsg");
      overlayEl = document.getElementById("gameOverOverlay");
      overlayTimeEl = document.getElementById("gameOverTime");


    canvas.width = W;
    canvas.height = H;

    setBestUI();
    resetGame();

    document.addEventListener("mousemove", onMouseMove);

    startBtn.addEventListener("click", () => {
      resetGame();
      startGame();
    });

    restartBtn.addEventListener("click", () => {
      resetGame();
      startGame();
    });
  }

  document.addEventListener("DOMContentLoaded", bindUI);
})();
