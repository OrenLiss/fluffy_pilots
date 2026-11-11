import { S } from '../state.js';
import { rand, makeShape } from '../utils.js';
import { CFG } from '../config.js';

export function spawnAsteroid(W, diff) {
  const loc = CFG.LOCATIONS[S.location];
  const type = loc.hazard;
  
  let r = rand(11, 30);
  let isStatic = false;
  let vy = rand(90, 170) * (0.85 + diff * 0.35);
  let vx = rand(-40, 40);

  if (type === 'spike') {
    r = rand(20, 45); isStatic = true; // Скалы
  } else if (type === 'dust') {
    r = rand(25, 50); vy = rand(30, 60); vx = rand(-20, 20); // Песок
  } else if (type === 'tree') {
    r = rand(15, 30); vy = rand(80, 120); // Деревья
  } else if (type === 'liana') {
    r = rand(30, 60); vy = rand(60, 90); // Лианы
  }

  S.asteroids.push({
    x: rand(30, Math.max(60, W - 30)), y: -r - 20,
    r, type, isStatic,
    vx, vy,
    rot: Math.random() * Math.PI * 2,
    vr: isStatic ? 0 : rand(-1.6, 1.6),
    shape: makeShape()
  });
}

export function updateAsteroids(dt, H) {
  for (let i = S.asteroids.length - 1; i >= 0; i--) {
    const a = S.asteroids[i];
    a.x += a.vx * dt; a.y += a.vy * dt; a.rot += a.vr * dt;
    if (a.y - a.r > H + 50) S.asteroids.splice(i, 1);
  }
}