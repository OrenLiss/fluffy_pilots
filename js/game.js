// Игровая логика полёта в космосе
import { SIZES, GAME } from "./config.js";
import { loadProfile, rewardFlight } from "./profile.js";

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
  maxHull: GAME.MAX_HULL,
  hull: GAME.MAX_HULL,
  timeSinceDamage: 0,
  shieldRegenTimer: 0,
  shieldCooldown: 0,
  shieldBreakCooldown: GAME.SHIELD_BREAK_COOLDOWN,
  shieldHitsPerSegment: 1,
  shieldSegmentHp: 1,
  damageFlash: 0,

  followSpeed: 1.4,
  bulletDamage: 1,
  
  upgrades: [],
  killsForTurbo: 0,
  killsForPhoton: 0,
  
  isHyperJump: false,
  hyperJumpTimer: 0,
  isPhotonCannon: false,
  photonCannonTimer: 0,
  homingRocketTimer: 0,

  ship: { x: 0, y: 0, w: 64, h: 24, img: null },
  enemyImg: null,

  playerBullets: [],
  enemyBullets: [],
  asteroids: [],
  enemies: [],
  drones: [],
  rockets: [],
  particles: [],
  
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
  
  const jumpBtn = document.getElementById("hyperJumpBtn");
  if (jumpBtn) {
    jumpBtn.addEventListener("click", activateHyperJump);
  }

  const img = new Image();
  img.src = "assets/ships/starter-ship-top.png";
  img.onload = () => { state.ship.img = img; };
  state.ship.img = img;

  const enemyImg = new Image();
  enemyImg.src = "assets/ships/enemy-ship-top.png";
  enemyImg.onload = () => { state.enemyImg = enemyImg; };
  state.enemyImg = enemyImg;

  state.ship.w = SIZES.ship.width;
  state.ship.h = SIZES.ship.height;

  buildStars();
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

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
  state.ship.x = Math.max(0, Math.min(rect.width, state.ship.x));
  state.ship.y = Math.max(0, Math.min(rect.height, state.ship.y));
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
  if (e.code === "Space") {
    activateHyperJump();
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
export async function startGame() {
  resize();

  let profile = null;
  try {
    profile = await loadProfile();
  } catch (err) {
    console.warn("Не удалось загрузить профиль:", err);
  }
  
  const speedLvl   = profile?.speedLevel  ?? 0;
  const hullLvl    = profile?.hullLevel   ?? 0;
  const shieldLvl  = profile?.shieldLevel ?? 0;
  const damageLvl  = profile?.damageLevel ?? 0;

  state.followSpeed = 1.4 + speedLvl * 0.12;
  state.maxHull = 6 + hullLvl * 2;
  state.bulletDamage = 1 + damageLvl * 0.5;
  state.shieldHitsPerSegment = 1 + shieldLvl;
  state.shieldBreakCooldown = Math.max(5, 30 - shieldLvl * 0.2);

  state.upgrades = profile?.upgrades || [];
  
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
  state.shieldSegmentHp = state.shieldHitsPerSegment;
  state.hull = state.maxHull;
  state.timeSinceDamage = 0;
  state.shieldRegenTimer = 0;
  state.shieldCooldown = 0;
  state.damageFlash = 0;

  state.killsForTurbo = 0;
  state.killsForPhoton = 0;
  state.isHyperJump = false;
  state.isPhotonCannon = false;
  state.homingRocketTimer = 0;

  state.playerBullets.length = 0;
  state.enemyBullets.length = 0;
  state.asteroids.length = 0;
  state.enemies.length = 0;
  state.drones.length = 0;
  state.rockets.length = 0;
  state.particles.length = 0;

  state.spawnAsteroidTimer = 0.6;
  state.spawnEnemyTimer = 2.5;
  state.fireCooldown = 0;

  state.ship.x = state.canvasW / 2;
  state.ship.y = state.canvasH - 80;
  mouse.x = state.ship.x;
  mouse.y = state.ship.y;

  document.getElementById("pauseOverlay").classList.add("hidden");
  document.getElementById("gameOverOverlay").classList.add("hidden");
  const jumpBtn = document.getElementById("hyperJumpBtn");
  if (jumpBtn) jumpBtn.classList.add("hidden");

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

async function finishFlight(viaPause) {
  if (state.saving) return;
  state.saving = true;

  const payload = {
    credits: state.credits,
    kills: state.kills,
    distance: Math.floor(state.distance),
  };

  const btn = viaPause ? document.getElementById("pauseToHangarBtn") : document.getElementById("goToHangarBtn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Сохранение...";

  try {
    await rewardFlight(payload);
  } catch (err) {
    console.error("Ошибка сохранения:", err);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
    state.saving = false;
    state.running = false;
    state.paused = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    document.getElementById("pauseOverlay").classList.add("hidden");
    document.getElementById("gameOverOverlay").classList.add("hidden");
    // Возвращаемся в ангар через главную навигацию
    if (window.showScreen) {
      window.showScreen("hangar");
    } else {
      // Фолбэк, если что-то пошло не так
      document.getElementById("screen-game").classList.add("hidden");
      document.getElementById("screen-hangar").classList.remove("hidden");
      document.getElementById("mainNav").classList.remove("hidden");
    }
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

// ====== УЛУЧШЕНИЯ ======
function activateHyperJump() {
  if (!state.upgrades.includes("turbo_engines")) return;
  if (state.killsForTurbo < 30 || state.isHyperJump) return;
  
  state.speedBeforeJump = state.speed; // <-- ЗАПОМИНАЕМ СКОРОСТЬ
  state.killsForTurbo = 0;
  state.isHyperJump = true;
  state.hyperJumpTimer = 5;
  document.getElementById("hyperJumpBtn").classList.add("hidden");
}

function createPlasmaExplosion(x, y) {
  state.particles.push({
    x, y, r: 0, maxR: 300, alpha: 1, type: "plasma"
  });
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (Math.hypot(e.x - x, e.y - y) < 300) state.enemies.splice(i, 1);
  }
  for (let i = state.asteroids.length - 1; i >= 0; i--) {
    const a = state.asteroids[i];
    if (Math.hypot(a.x - x, a.y - y) < 300) state.asteroids.splice(i, 1);
  }
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
  if (state.isHyperJump) {
    state.speed = 1500;
    state.distance += 1500 * dt * GAME.DISTANCE_MULTIPLIER;
  } else {
    state.speed += GAME.ACCEL_PER_SEC * dt;
    state.distance += state.speed * dt * GAME.DISTANCE_MULTIPLIER;
  }

  const deserved = Math.floor(state.distance / 10) * GAME.CREDIT_PER_10KM;
  if (deserved > state.creditsFromDistance) {
    state.credits += (deserved - state.creditsFromDistance);
    state.creditsFromDistance = deserved;
  }

  if (!state.isHyperJump) {
    state.timeSinceDamage += dt;
    if (state.shieldCooldown > 0) state.shieldCooldown -= dt;
  }

  const canRegen = state.shield < GAME.MAX_SHIELD && state.shieldCooldown <= 0 && state.timeSinceDamage >= GAME.REGEN_DELAY;
  if (canRegen) {
    state.shieldRegenTimer += dt;
    if (state.shieldRegenTimer >= GAME.REGEN_INTERVAL) {
      state.shieldRegenTimer -= GAME.REGEN_INTERVAL;
      state.shield = Math.min(GAME.MAX_SHIELD, state.shield + 1);
      state.shieldSegmentHp = state.shieldHitsPerSegment;
    }
  }

  const kx = (input.keys.has("a") || input.keys.has("arrowleft") ? -1 : 0) + (input.keys.has("d") || input.keys.has("arrowright") ? 1 : 0);
  const ky = (input.keys.has("w") || input.keys.has("arrowup") ? -1 : 0) + (input.keys.has("s") || input.keys.has("arrowdown") ? 1 : 0);

  const targetX = mouse.x + kx * 250 * dt * 10;
  const targetY = mouse.y + ky * 250 * dt * 10;
  const lerp = 1 - Math.pow(0.001, dt);
  
  if (!state.isHyperJump) {
    state.ship.x += (targetX - state.ship.x) * Math.min(1, lerp * state.followSpeed);
    state.ship.y += (targetY - state.ship.y) * Math.min(1, lerp * state.followSpeed);
  } else {
    state.ship.x = state.canvasW / 2;
    state.ship.y = state.canvasH / 2;

    state.hyperJumpTimer -= dt;
    if (state.hyperJumpTimer <= 0) {
      state.isHyperJump = false;
      state.speed = state.speedBeforeJump; // <-- ВОЗВРАЩАЕМ СКОРОСТЬ
      state.timeSinceDamage = 0;
    }
  }

  const halfW = state.ship.w / 2;
  const halfH = state.ship.h / 2;
  state.ship.x = Math.max(0, Math.min(state.canvasW, state.ship.x));
  state.ship.y = Math.max(0, Math.min(state.canvasH, state.ship.y));

  // --- Фотонная пушка ---
  if (state.upgrades.includes("photon_cannon") && state.killsForPhoton >= GAME.PHOTON_CANNON_KILLS && !state.isPhotonCannon) {
    state.killsForPhoton = 0;
    state.isPhotonCannon = true;
    state.photonCannonTimer = 5.0;
  }

  if (state.isPhotonCannon) {
    state.photonCannonTimer -= dt;
    if (state.photonCannonTimer <= 0) {
      state.isPhotonCannon = false;
    }
  }

  // --- Лазер фотонной пушки (Урон) ---
  if (state.isPhotonCannon) {
    const laserX = state.ship.x;
    const laserW = GAME.PHOTON_CANNON_WIDTH;
    
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const e = state.enemies[j];
      if (Math.abs(e.x - laserX) < (laserW / 2 + e.w / 2) && e.y < state.ship.y) {
        e.hp -= 30 * dt;
        if (e.hp <= 0) {
          state.enemies.splice(j, 1);
          state.kills++; state.credits += GAME.CREDIT_PER_KILL;
          state.killsForTurbo++; state.killsForPhoton++;
          checkTurboActivation();
        }
      }
    }
    
    for (let j = state.asteroids.length - 1; j >= 0; j--) {
      const a = state.asteroids[j];
      if (Math.abs(a.x - laserX) < (laserW / 2 + a.r) && a.y < state.ship.y) {
        a.hp -= 30 * dt;
        if (a.hp <= 0) {
          state.asteroids.splice(j, 1);
          if (state.upgrades.includes("repair_drones") && Math.random() < 0.05 && state.drones.length < 4) {
            state.drones.push({ x: state.ship.x, y: state.ship.y, hp: 4 });
          }
        }
      }
    }
  }

  // --- Стрельба ---
  if (!state.isHyperJump && !state.isPhotonCannon) {
    state.fireCooldown -= dt;
    if (state.fireCooldown <= 0) {
      state.fireCooldown = GAME.FIRE_INTERVAL;
      const extraSpeed = state.speed * GAME.SPEED_TO_BULLET;
      const vy = -(GAME.PLAYER_BULLET_SPEED + extraSpeed);
      
      if (state.upgrades.includes("double_gun")) {
        state.playerBullets.push({ x: state.ship.x - 15, y: state.ship.y - halfH, vy, r: 3, dmg: state.bulletDamage });
        state.playerBullets.push({ x: state.ship.x + 15, y: state.ship.y - halfH, vy, r: 3, dmg: state.bulletDamage });
      } else {
        state.playerBullets.push({ x: state.ship.x, y: state.ship.y - halfH, vy, r: 3, dmg: state.bulletDamage });
      }
    }
  }

  // --- Самонаводящиеся ракеты ---
  if (state.upgrades.includes("homing_rockets")) {
    state.homingRocketTimer -= dt;
    if (state.homingRocketTimer <= 0 && state.enemies.length > 0) {
      state.homingRocketTimer = GAME.HOMING_ROCKET_INTERVAL;
      let nearest = state.enemies[0];
      let minDist = Infinity;
      for (const e of state.enemies) {
        const d = Math.hypot(e.x - state.ship.x, e.y - state.ship.y);
        if (d < minDist) { minDist = d; nearest = e; }
      }
      state.rockets.push({ x: state.ship.x, y: state.ship.y, target: nearest, speed: 400 });
    }
  }
  
  for (let i = state.rockets.length - 1; i >= 0; i--) {
    const r = state.rockets[i];
    if (!state.enemies.includes(r.target)) {
      state.rockets.splice(i, 1);
      continue;
    }
    const dx = r.target.x - r.x;
    const dy = r.target.y - r.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 20) {
      r.target.hp -= 10;
      if (r.target.hp <= 0) {
        state.enemies.splice(state.enemies.indexOf(r.target), 1);
        state.kills++; state.credits += GAME.CREDIT_PER_KILL;
        state.killsForTurbo++; state.killsForPhoton++;
        checkTurboActivation();
      }
      state.rockets.splice(i, 1);
      continue;
    }
    r.x += (dx / dist) * r.speed * dt;
    r.y += (dy / dist) * r.speed * dt;
  }

  // --- Дроны ---
  if (state.upgrades.includes("repair_drones")) {
    const time = performance.now() * 0.001;
    state.drones.forEach((d, i) => {
      const angle = time * 2 + (i * Math.PI / 2);
      const targetDroneX = state.ship.x + Math.cos(angle) * 100;
      const targetDroneY = state.ship.y + Math.sin(angle) * 100;
      d.x += (targetDroneX - d.x) * Math.min(1, dt * 5);
      d.y += (targetDroneY - d.y) * Math.min(1, dt * 5);
    });
  }

  // --- Спавн ---
  state.spawnAsteroidTimer -= dt;
  if (state.spawnAsteroidTimer <= 0) {
    state.spawnAsteroidTimer = Math.max(0.25, GAME.ASTEROID_SPAWN_INTERVAL / Math.max(1, state.canvasW / 500));
    spawnAsteroid();
  }
  state.spawnEnemyTimer -= dt;
  if (state.spawnEnemyTimer <= 0 && state.enemies.length < GAME.ENEMY_MAX_DESKTOP) {
    state.spawnEnemyTimer = Math.max(1.0, GAME.ENEMY_SPAWN_INTERVAL / Math.max(1, state.canvasW / 500));
    spawnEnemy();
  }

  // --- Обновление снарядов ---
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

  const baseFall = 60 * (state.isHyperJump ? 1500 : state.speed);

  // --- Астероиды ---
  for (let i = state.asteroids.length - 1; i >= 0; i--) {
    const a = state.asteroids[i];
    a.y += (baseFall * a.factor) * dt;
    if (a.y - a.r > state.canvasH + 20) state.asteroids.splice(i, 1);
  }

  // --- Враги ---
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (e.phase === "entering") {
      e.y += (baseFall * 0.7) * dt;
      if (e.y >= e.targetY) { e.y = e.targetY; e.phase = "hovering"; e.driftPhase = 0; }
    } else {
      e.driftPhase += dt * e.driftSpeed;
      const targetX = e.baseX + Math.sin(e.driftPhase) * GAME.ENEMY_HOVER_DRIFT;
      const targetYDrift = e.targetY + Math.sin(e.driftPhase * 1.6) * 6;
      e.x += (targetX - e.x) * Math.min(1, dt * 8);
      e.y += (targetYDrift - e.y) * Math.min(1, dt * 8);
    }
    e.x = Math.max(e.w / 2, Math.min(state.canvasW - e.w / 2, e.x));

    e.fireTimer -= dt;
    if (e.fireTimer <= 0 && e.y > 0 && !state.isPhotonCannon) {
      e.fireTimer = GAME.ENEMY_FIRE_INTERVAL * (0.8 + Math.random() * 0.6);
      state.enemyBullets.push({ x: e.x, y: e.y + e.h / 2, vy: GAME.ENEMY_BULLET_SPEED + state.speed * GAME.SPEED_TO_ENEMY_BULLET, r: 4 });
    }
    if (e.y - e.h / 2 > state.canvasH + 20) state.enemies.splice(i, 1);
  }

  // --- Коллизии: Пули игрока ---
  for (let i = state.playerBullets.length - 1; i >= 0; i--) {
    const b = state.playerBullets[i];
    let removed = false;

    // Астероиды
    for (let j = state.asteroids.length - 1; j >= 0; j--) {
      const a = state.asteroids[j];
      if (Math.hypot(b.x - a.x, b.y - a.y) < a.r + b.r) {
        a.hp -= (b.dmg || 1);
        if (!state.isPhotonCannon) { state.playerBullets.splice(i, 1); removed = true; }
        if (a.hp <= 0) {
          state.asteroids.splice(j, 1);
          if (state.upgrades.includes("repair_drones") && Math.random() < 0.05 && state.drones.length < 4) {
            state.drones.push({ x: state.ship.x, y: state.ship.y, hp: 4 });
          }
        }
        break;
      }
    }
    if (removed) continue;

    // Враги
    for (let j = state.enemies.length - 1; j >= 0; j--) {
      const e = state.enemies[j];
      if (Math.abs(b.x - e.x) < e.w / 2 && Math.abs(b.y - e.y) < e.h / 2) {
        e.hp -= (b.dmg || 1);
        if (!state.isPhotonCannon) { state.playerBullets.splice(i, 1); removed = true; }
        if (e.hp <= 0) {
          state.enemies.splice(j, 1);
          state.kills++; state.credits += GAME.CREDIT_PER_KILL;
          state.killsForTurbo++; state.killsForPhoton++;
          checkTurboActivation();
        }
        break;
      }
    }
  }

  // --- Коллизии: Корабль ---
  if (!state.isHyperJump) {
    for (let i = state.asteroids.length - 1; i >= 0; i--) {
      const a = state.asteroids[i];
      if (Math.hypot(a.x - state.ship.x, a.y - state.ship.y) < a.r + GAME.HITBOX_RADIUS) {
        state.asteroids.splice(i, 1);
        takeDamage(1);
        if (!state.running) return;
      }
    }
    for (let i = state.enemyBullets.length - 1; i >= 0; i--) {
      const b = state.enemyBullets[i];
      if (Math.hypot(b.x - state.ship.x, b.y - state.ship.y) < b.r + GAME.HITBOX_RADIUS) {
        state.enemyBullets.splice(i, 1);
        takeDamage(1);
        if (!state.running) return;
      }
    }
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const e = state.enemies[i];
      if (Math.abs(e.x - state.ship.x) < (e.w / 2 + GAME.HITBOX_RADIUS) && Math.abs(e.y - state.ship.y) < (e.h / 2 + GAME.HITBOX_RADIUS)) {
        state.enemies.splice(i, 1);
        takeDamage(2);
        if (!state.running) return;
      }
    }
  } else {
    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const e = state.enemies[i];
      if (Math.abs(e.x - state.ship.x) < e.w / 2 + 40 && Math.abs(e.y - state.ship.y) < e.h / 2 + 40) {
        state.enemies.splice(i, 1);
        state.kills++; state.credits += GAME.CREDIT_PER_KILL;
        state.killsForTurbo++; state.killsForPhoton++;
        checkTurboActivation();
      }
    }
  }

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    if (p.type === "plasma") {
      p.r += 600 * dt;
      p.alpha -= 1.5 * dt;
      if (p.alpha <= 0) state.particles.splice(i, 1);
    }
  }

  state.drones.forEach((d) => {
    if (state.hull < state.maxHull) {
      d.healTimer = (d.healTimer || 0) + dt;
      if (d.healTimer >= 2) {
        d.healTimer = 0;
        state.hull = Math.min(state.maxHull, state.hull + 1);
      }
    }
  });

  state.starScroll += (state.isHyperJump ? 1500 : state.speed) * dt;
  updateHud();
}

function checkTurboActivation() {
  if (state.upgrades.includes("turbo_engines") && state.killsForTurbo >= 30) {
    const btn = document.getElementById("hyperJumpBtn");
    if (btn) btn.classList.remove("hidden");
  }
}

function takeDamage(amount) {
  state.timeSinceDamage = 0;
  state.shieldRegenTimer = 0;
  let dmg = amount;

  if (state.shield > 0) {
    while (dmg > 0 && state.shield > 0) {
      if (state.shieldSegmentHp > 0) {
        state.shieldSegmentHp -= 1;
        dmg -= 1;
        if (state.shieldSegmentHp <= 0) {
          state.shield -= 1;
          state.shieldSegmentHp = state.shieldHitsPerSegment;
          if (state.shield === 0) {
            state.shieldCooldown = state.shieldBreakCooldown;
            if (state.upgrades.includes("plasma_shield")) {
              createPlasmaExplosion(state.ship.x, state.ship.y);
            }
          }
        }
      }
    }
  }

  if (dmg > 0) {
    state.hull -= dmg;
    if (state.hull <= 0) { state.hull = 0; endGame(); }
  }
  state.damageFlash = 0.3;
}

function spawnAsteroid() {
  const sizes = [{ r: 12, hp: 1, factor: 1.0 }, { r: 20, hp: 2, factor: 0.9 }, { r: 30, hp: 3, factor: 0.8 }];
  const pick = sizes[Math.floor(Math.random() * sizes.length)];
  state.asteroids.push({
    x: Math.random() * (state.canvasW - pick.r * 2) + pick.r,
    y: -pick.r - 10, r: pick.r, hp: pick.hp, maxHp: pick.hp, factor: pick.factor,
    rot: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 2,
  });
}

function spawnEnemy() {
  const w = 64, h = 64;
  const x = Math.random() * (state.canvasW - w) + w / 2;

  state.enemies.push({
    x,
    baseX: x,
    y: -h,
    targetY: 80 + Math.random() * 100,
    w, h,
    hp: 3,
    maxHp: 3,
    fireTimer: 1.0 + Math.random() * 0.8,
    driftPhase: Math.random() * Math.PI * 2,
    driftSpeed: 0.4 + Math.random() * 0.6,
    phase: "entering",
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
  drawRockets();
  drawDrones();
  drawShip();
  drawShield();
  drawParticles();
  drawLaser();
}

function drawStars(w, h) {
  const speed = state.isHyperJump ? 1500 : state.speed;
  for (const s of state.stars) {
    const offset = (state.starScroll * (0.3 + s.layer * 0.25) * 30) % (h + 40);
    const y = (s.y * (h + 40) + offset) % (h + 40) - 20;
    const size = s.layer === 1 ? 1 : s.layer === 2 ? 1.6 : 2.4;
    ctx.fillStyle = `rgba(180, 230, 255, ${0.3 + s.layer * 0.25})`;
    ctx.fillRect(s.x * w, y, size, size * (2 + speed));
  }
}

function drawAsteroids() {
  for (const a of state.asteroids) {
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(a.rot + performance.now() * 0.0005 * a.rotSpeed);
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      const ang = (i / 9) * Math.PI * 2;
      const rr = a.r * (0.8 + Math.sin(i * 7.3 + a.r) * 0.15);
      if (i === 0) ctx.moveTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
      else ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
    }
    ctx.closePath(); ctx.fillStyle = "#2a2a3e"; ctx.fill();
    ctx.strokeStyle = "#6f6f99"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
}

function drawEnemies() {
  for (const e of state.enemies) {
    if (state.enemyImg && state.enemyImg.complete) {
      ctx.save(); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(state.enemyImg, e.x - e.w / 2, e.y - e.h / 2, e.w, e.h);
      ctx.restore();
    }
    const barW = 44; const bx = e.x - barW / 2; const by = e.y - e.h / 2 - 10;
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(bx, by, barW, 4);
    ctx.fillStyle = e.hp >= 2 ? "#33ffaa" : "#ff5577"; ctx.fillRect(bx, by, barW * (e.hp / e.maxHp), 4);
  }
}

function drawBullets() {
  for (const b of state.playerBullets) {
    ctx.fillStyle = "#00e0ff"; ctx.shadowColor = "#00e0ff"; ctx.shadowBlur = 10;
    ctx.fillRect(b.x - 1.5, b.y - 6, 3, 10);
    ctx.shadowBlur = 0;
  }
  for (const b of state.enemyBullets) {
    ctx.fillStyle = "#ff2bd6"; ctx.shadowColor = "#ff2bd6"; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
}

function drawRockets() {
  for (const r of state.rockets) {
    const angle = Math.atan2(r.target.y - r.y, r.target.x - r.x);
    ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(angle);
    ctx.fillStyle = "#ff2bd6"; ctx.shadowColor = "#ff2bd6"; ctx.shadowBlur = 10;
    ctx.fillRect(-8, -3, 16, 6);
    ctx.fillStyle = "rgba(255, 150, 50, 0.6)";
    ctx.beginPath(); ctx.moveTo(-8, -3); ctx.lineTo(-20, 0); ctx.lineTo(-8, 3); ctx.fill();
    ctx.shadowBlur = 0; ctx.restore();
  }
}

function drawDrones() {
  for (const d of state.drones) {
    ctx.fillStyle = "#33ffaa"; ctx.shadowColor = "#33ffaa"; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(d.x, d.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(d.x - 10, d.y - 14, 20, 3);
    ctx.fillStyle = "#fff"; ctx.fillRect(d.x - 10, d.y - 14, 20 * (d.hp / 4), 3);
    ctx.shadowBlur = 0;
  }
}

function drawShip() {
  const s = state.ship;
  if (s.img && s.img.complete) {
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(s.img, s.x - s.w / 2, s.y - s.h / 2, s.w, s.h);
    ctx.restore();
  }
}

function drawShield() {
  if (state.shield <= 0 || state.isPhotonCannon) return;
  const s = state.ship;
  const baseR = Math.max(s.w, s.h) * (0.6 + state.shield * 0.05);
  const t = performance.now() * 0.002;
  const pulse = 1 + Math.sin(t) * 0.03;
  ctx.save();
  const grad = ctx.createRadialGradient(s.x, s.y, baseR * 0.5, s.x, s.y, baseR * pulse);
  grad.addColorStop(0, "rgba(0, 224, 255, 0)"); grad.addColorStop(0.7, "rgba(0, 224, 255, 0.10)"); grad.addColorStop(1, "rgba(0, 224, 255, 0.35)");
  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(s.x, s.y, baseR * pulse, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `rgba(0, 224, 255, ${0.4 + 0.2 * Math.sin(t * 2)})`; ctx.lineWidth = 1.5; ctx.stroke();
  if (state.damageFlash > 0) {
    ctx.fillStyle = `rgba(255, 100, 150, ${state.damageFlash})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, baseR * pulse, 0, Math.PI * 2); ctx.fill();
    state.damageFlash -= 0.02;
  }
  ctx.restore();
}

function drawParticles() {
  for (const p of state.particles) {
    if (p.type === "plasma") {
      ctx.strokeStyle = `rgba(255, 43, 214, ${p.alpha})`;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(255, 43, 214, ${p.alpha * 0.2})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawLaser() {
  if (!state.isPhotonCannon) return;
  
  const s = state.ship;
  const w = GAME.PHOTON_CANNON_WIDTH;
  const startY = s.y - s.h / 2 + 10;
  
  ctx.save();
  
  // Внешнее свечение
  ctx.fillStyle = "rgba(255, 100, 50, 0.5)";
  ctx.shadowColor = "#ff5522"; 
  ctx.shadowBlur = 25;
  
  ctx.beginPath();
  ctx.moveTo(s.x - w / 2, startY);
  ctx.lineTo(s.x - w / 2, -100); // Уходит за экран
  ctx.lineTo(s.x + w / 2, -100);
  ctx.lineTo(s.x + w / 2, startY);
  ctx.arc(s.x, startY, w / 2, 0, Math.PI, false); // Закругление у носа
  ctx.closePath();
  ctx.fill();
  
  // Ядро лазера
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.shadowBlur = 10;
  
  ctx.beginPath();
  ctx.moveTo(s.x - w / 4, startY);
  ctx.lineTo(s.x - w / 4, -100);
  ctx.lineTo(s.x + w / 4, -100);
  ctx.lineTo(s.x + w / 4, startY);
  ctx.arc(s.x, startY, w / 4, 0, Math.PI, false);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

function updateHud() {
  document.getElementById("hudSpeed").textContent = state.speed.toFixed(2) + " км/с";
  document.getElementById("hudDist").textContent = formatKm(state.distance);
  document.getElementById("hudShield").textContent = `${state.shield}/${GAME.MAX_SHIELD} (${state.shieldSegmentHp}/${state.shieldHitsPerSegment})`;
  document.getElementById("hudHull").textContent = state.hull + "/" + state.maxHull;
  document.getElementById("hudCredits").textContent = state.credits;
}

function formatKm(km) {
  if (km < 1000) return Math.floor(km) + " км";
  return (km / 1000).toFixed(2) + " тыс. км";
}