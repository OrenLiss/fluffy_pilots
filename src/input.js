import { S } from './state.js';
import { CFG } from './config.js';
import { resize } from './render/canvas.js';

let canvasEl, restartFn, onGameOver;

export function initInput(canvas, restart, gameOverCb) {
  canvasEl = canvas;
  restartFn = restart;
  onGameOver = gameOverCb;

  window.addEventListener('pointermove', e => {
    S.mouse.x = e.clientX; S.mouse.y = e.clientY;
  }, { passive: true });

  window.addEventListener('keydown', e => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (S.mode === 'playing') {
        S.firing = true;
        const now = performance.now();
        // Двойной пробел = Ульта
        if (now - S.lastSpaceTap < CFG.ULT_DOUBLE_TAP_MS && S.ult >= CFG.ULT_MAX && S.profile.unlocks.ult_unlocked) {
          activateUlt();
        }
        S.lastSpaceTap = now;
      }
    }
    if (e.code === 'Enter') {
      if (S.mode === 'over') restartFn();
      else if (S.mode === 'playing') S.mode = 'paused';
      else if (S.mode === 'paused') S.mode = 'playing';
    }
    if (e.code === 'Escape' && S.mode === 'paused') S.mode = 'playing';
  });

  window.addEventListener('keyup', e => {
    if (e.code === 'Space') S.firing = false;
  });

  window.addEventListener('blur', () => S.firing = false);
  window.addEventListener('resize', () => resize(canvasEl));
}

function activateUlt() {
  S.ult = 0;
  S.ultActiveT = 0.6;
  S.ultWave = { x: S.ship.x, y: S.ship.y };
  
  // Убиваем всё в радиусе
  const r2 = CFG.ULT_RADIUS ** 2;
  for (let i = S.enemies.length - 1; i >= 0; i--) {
    const e = S.enemies[i];
    const dx = e.x - S.ship.x, dy = e.y - S.ship.y;
    if (dx * dx + dy * dy < r2) {
      S.enemies.splice(i, 1);
      // boom(e.x, e.y, ...);
    }
  }
  for (let i = S.ebullets.length - 1; i >= 0; i--) {
    const b = S.ebullets[i];
    const dx = b.x - S.ship.x, dy = b.y - S.ship.y;
    if (dx * dx + dy * dy < r2) S.ebullets.splice(i, 1);
  }
}