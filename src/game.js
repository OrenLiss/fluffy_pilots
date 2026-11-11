import { S, resetRunState } from './state.js';
import { clamp } from './utils.js';
import { updateShip } from './entities/ship.js';
import { updateAsteroids } from './entities/asteroid.js';
import { updateEnemies, updateEnemyBullets } from './entities/enemy.js';
import { updateParticles } from './entities/particle.js';
import { updateSpawner } from './systems/spawner.js';
import { updateShield } from './systems/shield.js';
import { resolveCollisions } from './systems/collision.js';
import { draw } from './render/draw.js';
import { getCtx, getSize } from './render/canvas.js';
import { CFG } from './config.js';
import { saveProfile } from './storage.js';

export function update(dt) {
  const { W, H } = getSize();
  const diff = Math.min(1 + S.t / 45, 3);
  S.lyRate = 1.5 * diff;
  S.scrollSpeed = S.lyRate * 80;

  updateParticles(dt);
  if (S.mode !== 'playing') return;

  S.t += dt;
  S.score += S.lyRate * dt;
  S.invuln = Math.max(0, S.invuln - dt);
  S.shake = Math.max(0, S.shake - dt * 2.5);
  
  if (S.ultActiveT > 0) {
    S.ultActiveT -= dt;
    if (S.ultActiveT <= 0) S.ultWave = null;
  }

  updateShip(dt, W, H);
  updateShield(dt);
  updateAsteroids(dt, H);
  updateEnemies(dt, W, H, diff);
  
  // Обновление пуль игрока (ГЛАВНЫЙ ФИКС)
  for (let i = S.bullets.length - 1; i >= 0; i--) {
    const b = S.bullets[i];
    b.y += b.vy * dt;
    if (b.y < -25) {
      S.bullets.splice(i, 1); // Удаляем только если улетела за экран
    }
  }

  updateEnemyBullets(dt, W, H);
  updateSpawner(dt, W);
  resolveCollisions();

  // Начисление кредитов за пролёт
  const earnedFromDist = Math.floor(S.score / 100);
  if (earnedFromDist > S.creditsEarned) {
    const add = earnedFromDist - S.creditsEarned;
    S.creditsEarned += add;
  }
   if (S.hull <= 0 && S.mode === 'playing') {
    gameOver();
  }
}

export function drawGame() {
  const { W, H, DPR } = getSize();
  draw(getCtx(), W, H, DPR);
}

export function gameOver() {
  if (S.mode === 'over') return; // Защита от повторного вызова
  
  S.mode = 'over';
  if (S.score > S.profile.bestScore) {
    S.profile.bestScore = S.score;
  }
  
  // Сохраняем кредиты в профиль только при выходе
  S.profile.credits = (S.profile.credits || 0) + S.creditsEarned;
  saveProfile(S.profile);
}

export function restart(W, H) {
  resetRunState();
  S.ship.x = clamp(S.mouse.x, 26, W - 26);
  S.ship.y = clamp(S.mouse.y, 70, H - 95);
}