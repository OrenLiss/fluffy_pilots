import { S } from '../state.js';
import { CFG } from '../config.js';

export function updateShield(dt) {
  if (S.mode !== 'playing') return;

  // Если щит не полный — тикаем таймеры
  if (S.shield < S.stats.shieldMax) {
    if (S.shieldRegenTimer > 0) {
      S.shieldRegenTimer -= dt;
    } else {
      S.shieldSegTimer += dt;
      if (S.shieldSegTimer >= CFG.SHIELD_SEGMENT_REGEN) {
        S.shieldSegTimer -= CFG.SHIELD_SEGMENT_REGEN;
        S.shield++;
      }
    }
  } else {
    S.shieldRegenTimer = 0;
    S.shieldSegTimer = 0;
  }
}