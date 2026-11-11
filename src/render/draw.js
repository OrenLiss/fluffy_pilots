import { S } from '../state.js';
import { rand } from '../utils.js';
import { CFG } from '../config.js';
import { drawHUD } from './hud.js';

export function draw(ctx, W, H, DPR) {
  const loc = CFG.LOCATIONS[S.location];
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  
  drawBackground(ctx, W, H, loc);

  if (S.shake > 0) {
    const s = S.shake * 9;
    ctx.translate(rand(-s, s), rand(-s, s));
  }

  drawAsteroids(ctx, loc);
  drawEnemies(ctx);
  drawEnemyBullets(ctx);
  drawBullets(ctx);
  if (S.mode === 'playing' || S.mode === 'paused') drawShip(ctx, loc);
  drawParticles(ctx);
  
  if (S.ultWave) drawUltWave(ctx);

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (S.mode !== 'over') drawHUD(ctx, W, H);
}

// ==========================================
// ФОНЫ ПЛАНЕТ
// ==========================================
function drawBackground(ctx, W, H, loc) {
  ctx.fillStyle = loc.bg;
  ctx.fillRect(0, 0, W, H);

  if (S.location === 'space') {
    const streak = 1 + S.scrollSpeed / 140;
    for (let i = 0; i < S.stars.length; i++) {
      const s = S.stars[i];
      const len = s.s * (1 + streak * s.z * 1.8);
      ctx.globalAlpha = 0.15 + s.z * 0.7;
      ctx.fillStyle = s.z > 0.65 ? loc.starHi : loc.star;
      ctx.fillRect(s.x, s.y, s.s, len);
    }
    ctx.globalAlpha = 1;

    // Туманности
    ctx.fillStyle = 'rgba(138, 77, 255, 0.05)';
    for (let i = 0; i < 4; i++) {
      const yOffset = (S.t * 60 + i * 300) % (H + 600) - 300;
      ctx.beginPath();
      ctx.moveTo(0, yOffset);
      ctx.bezierCurveTo(W * 0.3, yOffset - 100, W * 0.7, yOffset + 100, W, yOffset);
      ctx.lineTo(W, yOffset + 500);
      ctx.lineTo(0, yOffset + 500);
      ctx.fill();
    }
  } 
  else if (S.location === 'frozen') {
    // Только плавные ледяные волны (без трещин)
    ctx.fillStyle = 'rgba(127, 227, 255, 0.08)';
    for (let i = 0; i < 6; i++) {
      const yOffset = (S.t * 100 + i * 200) % (H + 400) - 200;
      ctx.beginPath();
      ctx.moveTo(0, yOffset);
      ctx.bezierCurveTo(W * 0.3, yOffset - 60, W * 0.7, yOffset + 60, W, yOffset);
      ctx.lineTo(W, yOffset + 300);
      ctx.lineTo(0, yOffset + 300);
      ctx.fill();
    }
  } 
  else if (S.location === 'desert') {
    // Барханы
    ctx.fillStyle = 'rgba(224, 160, 96, 0.1)';
    for (let i = 0; i < 6; i++) {
      const yOffset = (S.t * 120 + i * 200) % (H + 400) - 200;
      ctx.beginPath();
      ctx.moveTo(0, yOffset);
      ctx.bezierCurveTo(W * 0.3, yOffset - 80, W * 0.7, yOffset + 80, W, yOffset);
      ctx.lineTo(W, yOffset + 300);
      ctx.lineTo(0, yOffset + 300);
      ctx.fill();
    }
    // Песок
    ctx.fillStyle = 'rgba(255, 200, 120, 0.4)';
    for (let i = 0; i < 30; i++) {
      const x = (i * 137 + S.t * 50) % W;
      const y = (i * 73 + S.t * 200) % H;
      ctx.fillRect(x, y, 2, 15);
    }
  } 
  else if (S.location === 'tropical') {
    // Только плавные зелёные волны (без кругов)
    ctx.fillStyle = 'rgba(63, 191, 138, 0.08)';
    for (let i = 0; i < 6; i++) {
      const yOffset = (S.t * 100 + i * 200) % (H + 400) - 200;
      ctx.beginPath();
      ctx.moveTo(0, yOffset);
      ctx.bezierCurveTo(W * 0.3, yOffset - 70, W * 0.7, yOffset + 70, W, yOffset);
      ctx.lineTo(W, yOffset + 300);
      ctx.lineTo(0, yOffset + 300);
      ctx.fill();
    }
  }
}

function drawAsteroids(ctx, loc) {
  ctx.lineWidth = 1.8;
  for (let i = 0; i < S.asteroids.length; i++) {
    const a = S.asteroids[i];
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.beginPath();

    if (a.type === 'spike') {
      ctx.rotate(a.rot);
      ctx.moveTo(0, -a.r);
      ctx.lineTo(a.r * 0.7, a.r * 0.5);
      ctx.lineTo(-a.r * 0.7, a.r * 0.5);
      ctx.closePath();
      ctx.fillStyle = 'rgba(127, 227, 255, 0.2)';
      ctx.fill();
      ctx.strokeStyle = loc.hazardColor;
      ctx.shadowColor = loc.hazardGlow;
      ctx.shadowBlur = 12;
      ctx.stroke();

    } else if (a.type === 'liana') {
      // === НОВЫЕ ДЕРЕВЬЯ (КРОНЫ СВЕРХУ) ===
      // Левая крона (набор кругов)
      ctx.fillStyle = '#1f5a3a'; // Темная основа
      ctx.beginPath();
      ctx.arc(-a.r - 15, -5, 25, 0, Math.PI * 2);
      ctx.arc(-a.r - 30, 10, 20, 0, Math.PI * 2);
      ctx.arc(-a.r + 5, 10, 22, 0, Math.PI * 2);
      ctx.fill();
      // Светлые блики на левой кроне
      ctx.fillStyle = '#3fbf8a';
      ctx.beginPath();
      ctx.arc(-a.r - 15, -10, 15, 0, Math.PI * 2);
      ctx.arc(-a.r - 25, 5, 12, 0, Math.PI * 2);
      ctx.fill();

      // Правая крона
      ctx.fillStyle = '#1f5a3a';
      ctx.beginPath();
      ctx.arc(a.r + 15, -5, 25, 0, Math.PI * 2);
      ctx.arc(a.r + 30, 10, 20, 0, Math.PI * 2);
      ctx.arc(a.r - 5, 10, 22, 0, Math.PI * 2);
      ctx.fill();
      // Светлые блики на правой кроне
      ctx.fillStyle = '#3fbf8a';
      ctx.beginPath();
      ctx.arc(a.r + 15, -10, 15, 0, Math.PI * 2);
      ctx.arc(a.r + 25, 5, 12, 0, Math.PI * 2);
      ctx.fill();

      // Сама лиана (натянутая между кронами)
      ctx.beginPath();
      ctx.moveTo(-a.r, 5);
      ctx.quadraticCurveTo(0, 15, a.r, 5); // Легкое провисание
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#7dffb0'; // Яркий неон
      ctx.shadowColor = '#1f8a5a';
      ctx.shadowBlur = 15;
      ctx.stroke();

    } else if (a.type === 'dust') {
      ctx.arc(0, 0, a.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(224, 160, 96, 0.3)';
      ctx.fill();
      ctx.strokeStyle = loc.hazardColor;
      ctx.shadowColor = loc.hazardGlow;
      ctx.shadowBlur = 12;
      ctx.stroke();

    } else if (a.type === 'snow_wind') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(-a.r, -20, a.r * 2, 40);
      ctx.fillStyle = 'white';
      for(let j=0; j<10; j++) {
        ctx.fillRect(rand(-a.r, a.r), rand(-15, 15), 2, 2);
      }

    } else {
      // Астероиды
      ctx.rotate(a.rot);
      for (let j = 0; j < a.shape.length; j++) {
        const p = a.shape[j];
        const x = Math.cos(p.a) * a.r * p.k;
        const y = Math.sin(p.a) * a.r * p.k;
        if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(176, 124, 255, 0.1)';
      ctx.fill();
      ctx.strokeStyle = loc.hazardColor;
      ctx.shadowColor = loc.hazardGlow;
      ctx.shadowBlur = 12;
      ctx.stroke();
    }

    ctx.restore();
  }
  ctx.shadowBlur = 0;
}

// ... остальные функции (drawShip, drawEnemies и т.д.) оставляем без изменений ...

function drawShip(ctx, loc) {
  const blink = S.invuln > 0 && Math.floor(S.t * 22) % 2 === 0;
  ctx.save();
  ctx.translate(S.ship.x, S.ship.y);
  
  if (S.shield > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    const alpha = S.shieldBrokenTimer > 0 ? 0.1 : 0.3;
    ctx.fillStyle = `rgba(94, 242, 255, ${alpha})`;
    ctx.strokeStyle = `rgba(94, 242, 255, ${alpha + 0.2})`;
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();
  }

  if (S.ship.flipT > 0) {
    const p = S.ship.flipT / 0.4;
    ctx.scale(Math.cos((1 - p) * Math.PI) * S.ship.flipDir, 1);
  }

  ctx.globalAlpha = blink ? 0.25 : 1;
  const f = 0.7 + Math.random() * 0.6;
  ctx.beginPath();
  ctx.moveTo(-5, 10); ctx.lineTo(0, 10 + 16 * f); ctx.lineTo(5, 10);
  ctx.strokeStyle = 'rgba(94,242,255,0.9)';
  ctx.shadowColor = loc.accent;
  ctx.shadowBlur = 16;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -22); ctx.lineTo(13, 12);
  ctx.lineTo(0, 5); ctx.lineTo(-13, 12);
  ctx.closePath();
  ctx.fillStyle = 'rgba(94,242,255,0.10)';
  ctx.fill();
  ctx.strokeStyle = loc.accent;
  ctx.lineWidth = 2;
  ctx.shadowColor = loc.accent;
  ctx.shadowBlur = 18;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -10); ctx.lineTo(4, 5); ctx.lineTo(-4, 5);
  ctx.closePath();
  ctx.fillStyle = '#e9feff';
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.restore();
}

function drawEnemies(ctx) {
  for (let i = 0; i < S.enemies.length; i++) {
    const e = S.enemies[i];
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.beginPath();
    ctx.moveTo(0, 16); ctx.lineTo(15, -10);
    ctx.lineTo(0, -4); ctx.lineTo(-15, -10);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,77,122,0.10)';
    ctx.fill();
    ctx.strokeStyle = '#ff4d7a';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff2d5e';
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd166';
    ctx.shadowColor = '#ffd166';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    for (let k = 0; k < e.maxHp; k++) {
      ctx.fillStyle = k < e.hp ? '#ff4d7a' : 'rgba(255,77,122,0.22)';
      ctx.fillRect(-9 + k * 7, -22, 5, 3);
    }
    ctx.restore();
  }
}

function drawBullets(ctx) {
  if (!S.bullets.length) return;
  ctx.lineCap = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#a8ff60';
  ctx.shadowColor = '#7cff2e';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  for (let i = 0; i < S.bullets.length; i++) {
    const b = S.bullets[i];
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x, b.y + 14);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawEnemyBullets(ctx) {
  if (!S.ebullets.length) return;
  ctx.fillStyle = '#ffd166';
  ctx.shadowColor = '#ff9e2e';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  for (let i = 0; i < S.ebullets.length; i++) {
    const b = S.ebullets[i];
    ctx.moveTo(b.x + 4, b.y);
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawParticles(ctx) {
  for (let i = 0; i < S.parts.length; i++) {
    const p = S.parts[i];
    const a = p.life / p.maxLife;
    const sz = p.size * (0.4 + a * 0.6);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawUltWave(ctx) {
  const p = 1 - (S.ultActiveT / 0.6);
  const r = CFG.ULT_RADIUS * p;
  ctx.beginPath();
  ctx.arc(S.ultWave.x, S.ultWave.y, r, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255, 209, 102, ${1 - p})`;
  ctx.lineWidth = 15 * (1 - p);
  ctx.shadowColor = '#ffd166';
  ctx.shadowBlur = 40;
  ctx.stroke();
  ctx.shadowBlur = 0;
}