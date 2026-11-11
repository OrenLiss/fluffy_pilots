import { S } from '../state.js';
import { clamp } from '../utils.js';
import { CFG } from '../config.js';
import { boom } from './particle.js';

export function updateShip(dt, W, H) {
  // Тикаем статусы
  if (S.stunTimer > 0) S.stunTimer -= dt;
  if (S.slowTimer > 0) S.slowTimer -= dt;
  if (S.overheatTimer > 0) S.overheatTimer -= dt;
  if (S.shieldBrokenTimer > 0) S.shieldBrokenTimer -= dt;

  // Если стан — корабль не двигается
  if (S.stunTimer <= 0) {
    let speedMul = 1;
    if (S.slowTimer > 0) speedMul = 0.4; // Замедление от ветра
    
    const k = Math.min(1, dt * CFG.SHIP_SPEED_K * speedMul);
    S.ship.x += (S.mouse.x - S.ship.x) * k;
    S.ship.y += (S.mouse.y - S.ship.y) * k;
  }

  const top = CFG.SHIP_TOP, bot = Math.max(top, H - CFG.SHIP_BOTTOM_OFFSET);
  S.ship.x = clamp(S.ship.x, 26, W - 26);
  S.ship.y = clamp(S.ship.y, top, bot);

  if (S.ship.flipT > 0) S.ship.flipT -= dt;

  // Стрельба заблокирована при стане
  S.timers.shootCd -= dt;
  if (S.firing && S.timers.shootCd <= 0 && S.stunTimer <= 0) {
    S.bullets.push({
      x: S.ship.x, y: S.ship.y - 18,
      vy: CFG.BULLET_VY * S.stats.speedMul
    });
    S.timers.shootCd = CFG.FIRE_CD;
  }

  // Реген щита
  if (S.shield < S.stats.shieldMax && S.shieldBrokenTimer <= 0 && S.overheatTimer <= 0) {
    if (S.shieldRegenTimer > 0) {
      S.shieldRegenTimer -= dt;
    } else {
      S.shieldSegTimer += dt;
      if (S.shieldSegTimer >= CFG.SHIELD_SEGMENT_REGEN) {
        S.shieldSegTimer -= CFG.SHIELD_SEGMENT_REGEN;
        S.shield++;
      }
    }
  }
}

export function damagePlayer() {
  if (S.mode !== 'playing' || S.invuln > 0) return;

  if (Math.random() < S.stats.agility) {
    S.ship.flipT = 0.4;
    S.ship.flipDir = Math.random() > 0.5 ? 1 : -1;
    return;
  }

  if (S.shield > 0) {
    S.shield--;
    S.shieldRegenTimer = CFG.SHIELD_REGEN_DELAY; // 6 сек
    S.shieldSegTimer = 0;

    // Если щит сломали до 0 — взрыв и блокировка на 30 сек
    if (S.shield <= 0) {
      S.shield = 0;
      S.shieldBrokenTimer = 30.0; // 30 секунд не регенится
      S.shake = 1.5;
      boom(S.ship.x, S.ship.y, '#5ef2ff', 40, 300); // Взрыв щита
      
      // Урон врагам в радиусе 5 кораблей (5 * 40 = 200px)
      for (let i = S.enemies.length - 1; i >= 0; i--) {
        const e = S.enemies[i];
        const dx = e.x - S.ship.x, dy = e.y - S.ship.y;
        if (dx * dx + dy * dy < 200 * 200) {
          e.hp -= 2;
          boom(e.x, e.y, CFG.COLORS.enemy, 10, 150);
          if (e.hp <= 0) S.enemies.splice(i, 1);
        }
      }
    }
  } else if (S.hull > 0) {
    S.hull--;
  }

  S.invuln = 0.8;
  if (S.hull < 0) S.hull = 0;
  boom(S.ship.x, S.ship.y, CFG.LOCATIONS[S.location].accent, 18, 260);
}