import { rand } from '../utils.js';
import { S } from '../state.js';

export function boom(x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = rand(speed * 0.2, speed);
    const l = rand(0.25, 0.7);
    S.parts.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: l, maxLife: l, size: rand(1.5, 3.5), color
    });
  }
  if (S.parts.length > 500) S.parts.splice(0, S.parts.length - 500);
}

export function updateParticles(dt) {
  const damp = Math.pow(0.08, dt);
  for (let i = S.parts.length - 1; i >= 0; i--) {
    const p = S.parts[i];
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= damp; p.vy *= damp;
    p.life -= dt;
    if (p.life <= 0) S.parts.splice(i, 1);
  }
}