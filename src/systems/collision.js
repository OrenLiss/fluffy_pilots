import { S } from '../state.js';
import { dist2 } from '../utils.js';
import { boom } from '../entities/particle.js';
import { damagePlayer } from '../entities/ship.js';
import { CFG } from '../config.js';

export function resolveCollisions() {
  const loc = CFG.LOCATIONS[S.location];
  const hitR = CFG.HIT_R;

  // Пули по врагам
  for (let i = S.bullets.length - 1; i >= 0; i--) {
    const b = S.bullets[i];
    let hit = false;

    for (let j = S.enemies.length - 1; j >= 0; j--) {
      const e = S.enemies[j];
      if (dist2(b.x, b.y, e.x, e.y) < 400) {
        e.hp--;
        boom(b.x, b.y, CFG.COLORS.enemy, 5, 90);
        if (e.hp <= 0) {
          boom(e.x, e.y, CFG.COLORS.enemy, 20, 240);
          S.enemies.splice(j, 1);
          const reward = CFG.CREDITS_ENEMY[e.type] || 3;
          S.creditsEarned += reward;
          if (S.profile) S.profile.credits = (S.profile.credits || 0) + reward;
        }
        hit = true; break;
      }
    }
    if (hit) S.bullets.splice(i, 1);
  }

  // Столкновения игрока с препятствиями
  for (let i = S.asteroids.length - 1; i >= 0; i--) {
    const a = S.asteroids[i];
    if (dist2(S.ship.x, S.ship.y, a.x, a.y) < (a.r + hitR) ** 2) {
      
      if (a.type === 'spike') {
        // Скалы бьют больно (2 урона подряд)
        damagePlayer();
        damagePlayer(); 
      } else if (a.type === 'liana') {
        // Лианы станят на 3 секунды
        S.stunTimer = 3.0;
        boom(a.x, a.y, loc.hazardColor, 10, 100);
      } else if (a.type === 'dust') {
        // Песок перегревает щит (20 сек без регена)
        S.overheatTimer = 20.0;
        S.shieldRegenTimer = 6.0;
        S.shieldSegTimer = 0;
        boom(a.x, a.y, loc.hazardColor, 10, 100);
      } else {
        damagePlayer();
      }

      // Если это не статика, удаляем
      if (!a.isStatic) S.asteroids.splice(i, 1);
    }
  }

  // Вражеские пули
  for (let i = S.ebullets.length - 1; i >= 0; i--) {
    const b = S.ebullets[i];
    if (dist2(S.ship.x, S.ship.y, b.x, b.y) < (5 + hitR) ** 2) {
      S.ebullets.splice(i, 1);
      boom(b.x, b.y, CFG.COLORS.ebullet, 8, 120);
      damagePlayer();
    }
  }
  
  // Столкновение с врагами
  for (let i = S.enemies.length - 1; i >= 0; i--) {
    const e = S.enemies[i];
    if (dist2(S.ship.x, S.ship.y, e.x, e.y) < (e.r + hitR) ** 2) {
      S.enemies.splice(i, 1);
      boom(e.x, e.y, CFG.COLORS.enemy, 20, 220);
      damagePlayer();
    }
  }
}