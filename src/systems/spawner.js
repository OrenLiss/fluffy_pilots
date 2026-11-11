import { S } from '../state.js';
import { rand } from '../utils.js';
import { spawnAsteroid } from '../entities/asteroid.js';
import { spawnEnemy } from '../entities/enemy.js';

export function updateSpawner(dt, W) {
  S.timers.spawnA -= dt;
  if (S.timers.spawnA <= 0) {
    spawnAsteroid(W, Math.min(1 + S.t / 45, 3));
    S.timers.spawnA = Math.max(0.28, 0.95 - S.t * 0.008) * rand(0.75, 1.3);
  }
  S.timers.spawnE -= dt;
  if (S.timers.spawnE <= 0) {
    spawnEnemy(W, Math.min(1 + S.t / 45, 3));
    S.timers.spawnE = Math.max(1.4, 3.6 - S.t * 0.025) * rand(0.8, 1.25);
  }
}