import { S } from '../state.js';
import { rand, dist2 } from '../utils.js';
import { boom } from './particle.js';
import { CFG } from '../config.js';

export function spawnEnemy(W, diff) {
  S.enemies.push({
    x: rand(60, Math.max(120, W - 60)),
    y: -50,
    vx: rand(-40, 40) || 30,
    vy: rand(55, 85) * (0.85 + diff * 0.40),
    hp: 3, maxHp: 3, r: 16,
    fireCd: rand(0.9, 2.0),
    type: 'scout' // Пока 1 тип, для кредитов
  });
}

export function updateEnemies(dt, W, H, diff) {
  for (let i = S.enemies.length - 1; i >= 0; i--) {
    const e = S.enemies[i];
    e.x += e.vx * dt; e.y += e.vy * dt;
    if (e.x < 45) { e.x = 45; e.vx = Math.abs(e.vx); }
    if (e.x > W - 45) { e.x = W - 45; e.vx = -Math.abs(e.vx); }
    if (e.y > H + 60) { S.enemies.splice(i, 1); continue; }
    
    e.fireCd -= dt;
    if (e.fireCd <= 0 && e.y > 10) {
      e.fireCd = rand(1.5, 2.6) / (0.9 + diff * 0.25);
      shootAtPlayer(e);
    }
  }
}

function shootAtPlayer(e) {
  const dx = S.ship.x - e.x, dy = S.ship.y - e.y;
  const d = Math.hypot(dx, dy) || 1;
  const sp = Math.min(250 + S.t * 0.8, 430);
  S.ebullets.push({ x: e.x, y: e.y + 12, vx: (dx / d) * sp, vy: (dy / d) * sp });
}

export function updateEnemyBullets(dt, W, H) {
  for (let i = S.ebullets.length - 1; i >= 0; i--) {
    const b = S.ebullets[i];
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.y > H + 30 || b.y < -30 || b.x < -30 || b.x > W + 30) S.ebullets.splice(i, 1);
  }
}