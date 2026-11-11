// Игровая логика полёта в космосе
import { SIZES, GAME } from "./config.js";
import { rewardFlight } from "./profile.js";

// ====== СОСТОЯНИЕ ======
const state = {
  running: false,
  paused: false,
  gameOver: false,
  saving: false,

  speed: GAME.START_SPEED,
  distance: 0,
  credits: 0,
  creditsFromDistance: 0,
  kills: 0,

  shield: GAME.MAX_SHIELD,
  hull: GAME.MAX_HULL,
  timeSinceDamage: 0,
  shieldRegenTimer: 0,
  shieldCooldown: 0,
  damageFlash: 0,

  ship: { x: 0, y: 0, w: 64, h: 24, img: null },

  playerBullets: [],
  enemyBullets: [],
  asteroids: [],
  enemies: [],
  stars: [],

  spawnAsteroidTimer: 0,
  spawnEnemyTimer: 0,
  fireCooldown: 0,
  starScroll: 0,

  lastTime: 0,
  canvasW: 0,
  canvasH: 0,
};

let canvas, ctx;
let rafId = null;
const mouse = { x: 0, y: 0 };
const input = { keys: new Set() };

// ====== ИНИЦИАЛИЗАЦИЯ ======
export function initGame() {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
  resize();
  window.addEventListener("resize", resize);

  canvas.addEventListener("pointermove", onPointer);
  canvas.addEventListener("pointerdown", onPointer);
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  document.getElementById("pauseBtn").addEventListener("click", () => {
    if (state.running && !state.paused) pauseGame();
  });
  document.getElementById("resumeBtn").addEventListener("click", resumeGame);
  document.getElementById("pauseToHangarBtn").addEventListener("click", () => finishFlight(true));
  document.getElementById("goToHangarBtn").addEventListener("click", () => finishFlight(false));

  const img = new Image();
  img.src = "assets/ships/starter-ship-top.png";
  img.onload = () => { state.ship.img = img; };
  state.ship.img = img;

  state.ship.w = SIZES.ship.width;
  state.ship.h = SIZES.ship.height;

  buildStars();
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  state.canvasW = rect.width;
  state.canvasH = rect.height;

  if (state.ship.x === 0 && state.ship.y === 0) {
    state.ship.x = rect.width / 2;
    state.ship.y = rect.height - 80;
    mouse.x = state.ship.x;
    mouse.y = state.ship.y;
  }
  state.ship.x = Math.max(state.ship.w / 2, Math.min(rect.width - state.ship.w / 2, state.ship.x));
  state.ship.y = Math.max(state.ship.h / 2, Math.min(rect.height - state.ship.h / 2, state.ship.y));
}

function onPointer(e) {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
}
function onKeyDown(e) {
  if (e.key === "Escape") {
    if (state.paused) resumeGame(); else pauseGame();
    return;
  }
  input.keys.add(e.key.toLowerCase());
}
function onKeyUp(e) { input.keys.delete(e.key.toLowerCase()); }

function buildStars() {
  state.stars = [];
  for (let i = 0; i < 140; i++) {
    state.stars.push({
      x: Math.random(),
      y: Math.random(),
      layer: Math.random() < 0.4 ? 1 : (Math.random() < 0.6 ? 2 : 3),
    });
  }
}

// ====== СТАРТ / ПАУЗА / КОНЕЦ ======
export function startGame() {
  state.running = true;
  state.paused = false;
  state.gameOver = false;
  state.saving = false;

  state.speed = GAME.START_SPEED;
  state.distance = 0;
  state.credits = 0;
  state.creditsFromDistance = 0;
  state.kills = 0;
  state.shield = GAME.MAX_SHIELD;
  state.hull = GAME.MAX_HULL;
  state.timeSinceDamage = 0;
  state.shieldRegenTimer = 0;
  state.shieldCooldown = 0;
  state.damageFlash = 0;

  state.playerBullets.length = 0;
  state.enemyBullets.length = 0;
  state.asteroids.length = 0;
  state.enemies.length = 0;
  state.spawnAsteroidTimer = 0.6;
  state.spawnEnemyTimer = 2.5;
  state.fireCooldown = 0;

  state.ship.x = state.canvasW / 2;
  state.ship.y = state.canvasH - 80;
  mouse.x = state.ship.x;
  mouse.y = state.ship.y;

  document.getElementById("pauseOverlay").classList.add("hidden");
  document.getElementById("gameOverOverlay").classList.add("hidden");

  state.lastTime = performance.now();
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(loop);
}

function pauseGame() {
  if (!state.running || state.gameOver || state.paused) return;
  state.paused = true;
  document.getElementById("pauseDist").textContent = formatKm(state.distance);
  document.getElementById("pauseKills").textContent = state.kills;
  document.getElementById("pauseCredits").textContent = state.credits;
  document.getElementById("pauseOverlay").classList.remove("hidden");
}

function resumeGame() {
  if (!state.paused) return;
  state.paused = false;
  document.getElementById("pauseOverlay").classList.add("hidden");
  state.lastTime = performance.now();
}

// Завершение полёта — сохранение и возврат в ангар
async function finishFlight(viaPause) {
  if (state.saving) return;
  state.saving = true;

  const payload = {
    credits: state.credits,
    kills: state.kills,
    distance: Math.floor(state.distance),
  };

  // Показываем индикатор в кнопках, чтобы юзер понял, что идёт сохранение
  const btn = viaPause
    ? document.getElementById("pauseToHangarBtn")
    : document.getElementById("goToHangarBtn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Сохранение...";

  try {
    await rewardFlight(payload);
  } catch (err) {
    console.error("Не удалось сохранить профиль:", err);
    // Можно показать маленький алерт, но мы просто продолжим
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
    state.saving = false;
    state.running = false;
    state.paused = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    document.getElementById("pauseOverlay").classList.add("hidden");
    document.getElementById("gameOverOverlay").classList.add("hidden");
    // Возврат в ангар + подгрузка баланса
    document.getElementById("screen-game").classList.add("hidden");
    document.getElementById("screen-hangar").classList.remove("hidden");
    // Сообщаем ангару, что нужно обновить кредиты
    document.dispatchEvent(new CustomEvent("profile-updated"));
  }
}

function endGame() {
  state.running = false;
  state.gameOver = true;
  document.getElementById("goDist").textContent = formatKm(state.distance);
  document.getElementById("goKills").textContent = state.kills;
  document.getElementById("goCredits").textContent = state.credits;
  document.getElementById("gameOverOverlay").classList.remove("hidden");
}

// ====== ЦИКЛ ======
function loop(now) {
  const dt = Math.min(0.05, (now - state.lastTime) / 1000);
  state.lastTime = now;
  if (state.running && !state.paused) update(dt);
  render();
  if (state.running || state.paused) rafId = requestAnimationFrame(loop);
}

// ====== ОБНОВЛЕНИЕ ======
function update(dt) {
  state.speed += GAME.ACCEL_PER_SEC * dt;
  state.distance += state.speed * dt * GAME.DISTANCE_MULTIPLIER;

  // Кредиты за каждые 10 км
  const deserved = Math.floor(state.distance / 10) * GAME.CREDIT_PER_10KM;
  if (deserved > state.creditsFromDistance) {
    const diff = deserved - state.creditsFromDistance;
    state.creditsFromDistance = deserved;
    state.credits += diff;
  }

  state.timeSinceDamage += dt;
  if (state.shieldCooldown > 0) state.shieldCooldown -= dt;

  const canRegen = state.shield < GAME.MAX_SHIELD
    && state.shieldCooldown <= 0
    && state.timeSinceDamage >= GAME.REGEN_DELAY;
  if (canRegen) {
    state.shieldRegenTimer += dt;
    if (state.shieldRegenTimer >= GAME.REGEN_INTERVAL) {
      state.shieldRegenTimer -= GAME.REGEN_INTERVAL;
      state.shield = Math.min(GAME.MAX_SHIELD, state.shield + 1);
    }
  } else {
    state.shieldRegenTimer = 0;
  }

  // Управление
  const kx = (input.keys.has("a") || input.keys.has("arrowleft") ? -1 : 0)
           + (input.keys.has("d") || input.keys.has("arrowright") ? 1 : 0);
  const ky = (input.keys.has("w") || input.keys.has("arrowup") ? -1 : 0)
           + (input.keys.has("s") || input.keys.has("arrowdown") ? 1 : 0);

  const targetX = mouse.x + kx * 250 * dt * 10;
  const targetY = mouse.y + ky * 250 * dt * 10;
  const lerp = 1 - Math.pow(0.001, dt);
  state.ship.x += (targetX - state.ship.x) * Math.min(1, lerp * 1.4);
  state.ship.y += (targetY - state.ship.y) * Math.min(1, lerp * 1.4);

  const halfW = state.ship.w / 2;
  const halfH = state.ship.h / 2;
  state.ship.x = Math.max(halfW, Math.min(state.canvasW - halfW, state.ship.x));
  state.ship.y = Math.max(halfH, Math.min(state.canvasH - halfH, state.ship.y));

  // Стрельба
  state.fireCooldown -= dt;
  if (state.fireCooldown <= 0) {
    state.fireCooldown = GAME.FIRE_INTERVAL;
    state.playerBullets.push({
      x: state.ship.x, y: state.ship.y - halfH,
      vy: -GAME.PLAYER_BULLET_SPEED, r: 3,
    });
  }

  // Спавн
  state.spawnAsteroidTimer -= dt;
  if (state.spawnAsteroidTimer <= 0) {
    state.spawnAsteroidTimer = GAME.ASTEROID_SPAWN_INTERVAL;
    spawnAsteroid();
  }
  state.spawnEnemyTimer -= dt;
  if (state.spawnEnemyTimer <= 0) {
    state.spawnEnemyTimer = GAME.ENEMY_SPAWN_INTERVAL;
    spawnEnemy();
  }

  for (let i = state.playerBullets.length - 1; i >= 0; i--) {
    const b = state.playerBullets[i];
    b.y += b.vy * dt;
    if (b.y < -10) state.playerBullets.splice(i, 1);
  }
  for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
    const b = state.enemyBullets[i];
    b.y += b.vy * dt;
    if (b.y > state.canvasH + 10) state.enemyBullets.splice(i, 1);
  }

  const baseFall = 60 * state.speed;
  for (let i = state.asteroids.length - 1; i >= 0; i--) {
    const a = state.asteroids[i];
    a.y += (baseFall * a.factor) * dt;
    if (a.y - a.r > state.canvasH + 20) state.asteroids.splice(i, 1);
  }
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    e.y += (baseFall * 0.7) * dt;
    e.fireTimer -= dt;
    if (e.fireTimer <= 0 && e.y > 0) {
      e.fireTimer = GAME.ENEMY_FIRE_INTERVAL;
      state.enemyBullets.push({
        x: e.x, y: e.y + e.h / 2,
        vy: GAME.ENEMY_BULLET_SPEED, r: 4,
      });
    }
    if (e.y - e.h / 2 > state.canvasH + 20) state.enemies.splice(i, 1);
  }

  // Пули игрока
  for (let i = state.playerBullets.length - 1; i >= 0; i--) {
    const b = state.playerBullets[i];
    let removed = false;
    for (let j = state.asteroids.length - 1; j >= 0; j--) {
      const a = state.asteroids[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      if (dx * dx + dy * dy < (a.r + b.r) ** 2) {
        a.hp -= 1;
        state.playerBullets.splice(i, 1);
        removed = true;
        if (a.hp <= 0) state.asteroids.splice(j, 1);
        break;
      }
    }
    if (removed) continue;

    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const e = state.enemies[j];
      if (Math.abs(b.x - e.x) < e.w / 2 && Math.abs(b.y - e.y) < e.h / 2) {
        e.hp -= 1;
        state.playerBullets.splice(i, 1);
        if (e.hp <= 0) {
          state.enemies.splice(j, 1);
          state.kills += 1;
          state.credits += GAME.CREDIT_PER_KILL;
        }
        break;
      }
    }
  }

  // Астероиды vs корабль
  for (let i = state.asteroids.length - 1; i >= 0; i--) {
    const a = state.asteroids[i];
    const dx = a.x - state.ship.x, dy = a.y - state.ship.y;
    if (dx * dx + dy * dy < (a.r + Math.max(halfW, halfH)) ** 2) {
      state.asteroids.splice(i, 1);
      takeDamage(1);
      if (!state.running) return;
    }
  }
  // Вражеские пули vs корабль
  for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
    const b = state.enemyBullets[i];
    const dx = b.x - state.ship.x, dy = b.y - state.ship.y;
    if (dx * dx + dy * dy < (b.r + Math.max(halfW, halfH)) ** 2) {
      state.enemyBullets.splice(i, 1);
      takeDamage(1);
      if (!state.running) return;
    }
  }
  // Враги vs корабль
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (Math.abs(e.x - state.ship.x) < (e.w / 2 + halfW) &&
        Math.abs(e.y - state.ship.y) < (e.h / 2 + halfH)) {
      state.enemies.splice(i, 1);
      takeDamage(2);
      if (!state.running) return;
    }
  }

  state.starScroll += state.speed * dt;
  updateHud();
}

function takeDamage(amount) {
  state.timeSinceDamage = 0;
  state.shieldRegenTimer = 0;
  let dmg = amount;

  if (state.shield > 0) {
    const absorbed = Math.min(state.shield, dmg);
    state.shield -= absorbed;
    dmg -= absorbed;
    if (state.shield === 0) state.shieldCooldown = GAME.SHIELD_BREAK_COOLDOWN;
  }
  if (dmg > 0) {
    state.hull -= dmg;
    if (state.hull <= 0) { state.hull = 0; endGame(); }
  }
  state.damageFlash = 0.3;
}

// ====== СПАВН ======
function spawnAsteroid() {
  const sizes = [
    { r: 12, hp: 1, factor: 1.0 },
    { r: 20, hp: 2, factor: 0.9 },
    { r: 30, hp: 3, factor: 0.8 },
  ];
  const pick = sizes[Math.floor(Math.random() * sizes.length)];
  state.asteroids.push({
    x: Math.random() * (state.canvasW - pick.r * 2) + pick.r,
    y: -pick.r - 10,
    r: pick.r, hp: pick.hp, maxHp: pick.hp,
    factor: pick.factor,
    rot: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 2,
  });
}
function spawnEnemy() {
  const w = 44, h = 32;
  state.enemies.push({
    x: Math.random() * (state.canvasW - w) + w / 2,
    y: -h,
    w, h, hp: 3, maxHp: 3, fireTimer: 1.2,
  });
}

// ====== РЕНДЕР ======
function render() {
  const w = state.canvasW, h = state.canvasH;
  ctx.fillStyle = "#02010a";
  ctx.fillRect(0, 0, w, h);
  drawStars(w, h);
  drawAsteroids();
  drawEnemies();
  drawBullets();
  drawShip();
  drawShield();
}

function drawStars(w, h) {
  for (const s of state.stars) {
    const offset = (state.starScroll * (0.3 + s.layer * 0.25) * 30) % (h + 40);
    const y = (s.y * (h + 40) + offset) % (h + 40) - 20;
    const size = s.layer === 1 ? 1 : s.layer === 2 ? 1.6 : 2.4;
    const alpha = 0.3 + s.layer * 0.25;
    ctx.fillStyle = `rgba(180, 230, 255, ${alpha})`;
    ctx.fillRect(s.x * w, y, size, size * (2 + state.speed));
  }
}
function drawAsteroids() {
  for (const a of state.asteroids) {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot + performance.now() * 0.0005 * a.rotSpeed);
    ctx.beginPath();
    const points = 9;
    for (let i = 0; i < points; i++) {
      const ang = (i / points) * Math.PI * 2;
      const rr = a.r * (0.8 + Math.sin(i * 7.3 + a.r) * 0.15);
      const px = Math.cos(ang) * rr;
      const py = Math.sin(ang) * rr;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = "#2a2a3e";
    ctx.fill();
    ctx.strokeStyle = "#6f6f99";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (a.hp < a.maxHp) {
      ctx.fillStyle = "#ff5577";
      ctx.fillRect(-a.r, -a.r - 6, a.r * 2 * (a.hp / a.maxHp), 3);
    }
    ctx.restore();
  }
}
function drawEnemies() {
  for (const e of state.enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.beginPath();
    ctx.moveTo(0, e.h / 2);
    ctx.lineTo(-e.w / 2, -e.h / 2);
    ctx.lineTo(e.w / 2, -e.h / 2);
    ctx.closePath();
    ctx.fillStyle = "#3a1030";
    ctx.fill();
    ctx.strokeStyle = "#ff2bd6";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -e.h / 4, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#ff2bd6";
    ctx.fill();

    const barW = e.w, barH = 4;
    const bx = -barW / 2, by = -e.h / 2 - 10;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = e.hp >= 2 ? "#33ffaa" : "#ff5577";
    ctx.fillRect(bx, by, barW * (e.hp / e.maxHp), barH);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, barW, barH);
    ctx.restore();
  }
}
function drawBullets() {
  for (const b of state.playerBullets) {
    ctx.fillStyle = "#00e0ff";
    ctx.shadowColor = "#00e0ff";
    ctx.shadowBlur = 10;
    ctx.fillRect(b.x - 1.5, b.y - 6, 3, 10);
    ctx.shadowBlur = 0;
  }
  for (const b of state.enemyBullets) {
    ctx.fillStyle = "#ff2bd6";
    ctx.shadowColor = "#ff2bd6";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
function drawShip() {
  const s = state.ship;
  if (s.img && s.img.complete && s.img.naturalWidth > 0) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(s.img, s.x - s.w / 2, s.y - s.h / 2, s.w, s.h);
    ctx.restore();
  } else {
    ctx.fillStyle = "#00e0ff";
    ctx.beginPath();
    ctx.moveTo(s.x, s.y - s.h / 2);
    ctx.lineTo(s.x - s.w / 2, s.y + s.h / 2);
    ctx.lineTo(s.x + s.w / 2, s.y + s.h / 2);
    ctx.closePath();
    ctx.fill();
  }
}
function drawShield() {
  if (state.shield <= 0) return;
  const s = state.ship;
  const baseR = Math.max(s.w, s.h) * 0.8;
  const t = performance.now() * 0.002;
  const pulse = 1 + Math.sin(t) * 0.03;

  ctx.save();
  const grad = ctx.createRadialGradient(s.x, s.y, baseR * 0.5, s.x, s.y, baseR * pulse);
  grad.addColorStop(0, "rgba(0, 224, 255, 0)");
  grad.addColorStop(0.7, "rgba(0, 224, 255, 0.10)");
  grad.addColorStop(1, "rgba(0, 224, 255, 0.35)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(s.x, s.y, baseR * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(0, 224, 255, ${0.4 + 0.2 * Math.sin(t * 2)})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (state.damageFlash > 0) {
    ctx.fillStyle = `rgba(255, 100, 150, ${state.damageFlash})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, baseR * pulse, 0, Math.PI * 2);
    ctx.fill();
    state.damageFlash -= 0.02;
  }
  ctx.restore();
}

function updateHud() {
  document.getElementById("hudSpeed").textContent = state.speed.toFixed(2) + " км/с";
  document.getElementById("hudDist").textContent = formatKm(state.distance);
  document.getElementById("hudShield").textContent = state.shield + "/" + GAME.MAX_SHIELD;
  document.getElementById("hudHull").textContent = state.hull + "/" + GAME.MAX_HULL;
  document.getElementById("hudCredits").textContent = state.credits;
}
function formatKm(km) {
  if (km < 1000) return Math.floor(km) + " км";
  return (km / 1000).toFixed(2) + " тыс. км";
}