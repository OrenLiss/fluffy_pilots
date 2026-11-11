import { S } from '../state.js';
import { CFG } from '../config.js';

export function drawHUD(ctx, W, H) {
  const loc = CFG.LOCATIONS[S.location];
  ctx.save();
  ctx.textBaseline = 'top';

  // Счёт
  ctx.textAlign = 'left';
  ctx.font = '600 11px "Courier New", monospace';
  ctx.fillStyle = 'rgba(120,190,230,0.6)';
  ctx.fillText('ПРОЛЕТЕНО', 24, 22);
  ctx.font = '700 22px "Courier New", monospace';
  ctx.fillStyle = loc.accent;
  ctx.shadowColor = loc.accent;
  ctx.shadowBlur = 12;
  ctx.fillText(S.score.toFixed(1) + ' св. лет', 24, 38);

  // Кредиты за забег
  ctx.shadowBlur = 0;
  ctx.font = '600 11px "Courier New", monospace';
  ctx.fillStyle = '#ffd166';
  ctx.fillText(`+${S.creditsEarned} ₡`, 24, 68);

  // Скорость
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(120,190,230,0.6)';
  ctx.fillText('СКОРОСТЬ', W - 24, 22);
  ctx.font = '700 16px "Courier New", monospace';
  ctx.fillStyle = loc.accent;
  ctx.shadowColor = loc.accent;
  ctx.shadowBlur = 10;
  ctx.fillText((S.lyRate * 10).toFixed(1) + ' св. лет/сут', W - 24, 40);

  // Полоски: Щит и Корпус
  drawBar(ctx, W, H, S.shield, S.stats.shieldMax, '#5ef2ff', 'ЩИТ', 16, true);
  drawBar(ctx, W, H, S.hull, S.stats.hullMax, '#ff4d7a', 'КОРПУС', 12, false);

  // Шкала ульты (если разблокирована)
  if (S.profile && S.profile.unlocks.ult_unlocked) {
    ctx.shadowBlur = 0;
    ctx.textAlign = 'center';
    ctx.fillStyle = S.ult >= CFG.ULT_MAX ? '#ffd166' : 'rgba(255,255,255,0.4)';
    ctx.font = '600 10px "Courier New", monospace';
    ctx.fillText(S.ult >= CFG.ULT_MAX ? 'УЛЬТА ГОТОВА [ПРОБЕЛ x2]' : 'УЛЬТА', W / 2, H - 65);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(W / 2 - 50, H - 50, 100, 4);
    ctx.fillStyle = S.ult >= CFG.ULT_MAX ? '#ffd166' : '#5ef2ff';
    ctx.fillRect(W / 2 - 50, H - 50, 100 * (S.ult / CFG.ULT_MAX), 4);
  }

  ctx.restore();
}

function drawBar(ctx, W, H, current, max, color, label, yOff, isTop) {
  const bw = 40, bh = 7, gap = 9;
  const total = max * bw + (max - 1) * gap;
  const x0 = (W - total) / 2;
  const y0 = H - yOff - (isTop ? 30 : 0);

  ctx.shadowBlur = 0;
  ctx.font = '600 10px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(120,190,230,0.45)';
  ctx.fillText(label, W / 2, y0 - 14);

  for (let i = 0; i < max; i++) {
    const x = x0 + i * (bw + gap);
    if (i < current) {
      ctx.shadowColor = color; ctx.shadowBlur = 14;
      ctx.fillStyle = color;
      ctx.fillRect(x, y0, bw, bh);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = 'rgba(94,242,255,0.06)';
      ctx.fillRect(x, y0, bw, bh);
      ctx.strokeStyle = 'rgba(94,242,255,0.22)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y0 + 0.5, bw - 1, bh - 1);
    }
  }
}