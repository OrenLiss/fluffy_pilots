import { CFG } from './config.js';

export const S = {
  mode: 'playing',
  profile: null,
  location: 'space',
  palette: CFG.LOCATIONS.space,
  stats: { hullMax:6, shieldMax:6, agility:0, speedMul:1 },

  score: 0, creditsEarned: 0, t: 0, invuln: 0, shake: 0,
  lyRate: 1.5, scrollSpeed: 120, bossTimer: 180,

  // Статусы игрока
  hull: 6, shield: 6,
  shieldRegenTimer: 0, shieldSegTimer: 0,
  shieldBrokenTimer: 0,   // Новое: таймер поломки щита
  stunTimer: 0,           // Новое: стан от лиан
  slowTimer: 0,           // Новое: замедление от ветра
  overheatTimer: 0,       // Новое: запрет регена щита

  // Ульта
  ult: 0, ultUnlocked: false, ultActiveT: 0, ultWave: null,

  ship: { x:0, y:0, flipT:0, flipDir:1 },
  mouse: { x:0, y:0 },

  timers: { shootCd:0, spawnA:1.2, spawnE:3.5 },
  firing: false, lastSpaceTap: 0,

  bullets: [], asteroids: [], enemies: [], ebullets: [], parts: [], stars: [],
};

export function resetRunState() {
  S.mode = 'playing';
  S.score = 0; S.creditsEarned = 0; S.t = 0;
  S.invuln = 1.0; S.shake = 0;
  S.lyRate = 1.5; S.scrollSpeed = 120;
  S.bossTimer = 180;

  S.hull = S.stats.hullMax;
  S.shield = S.stats.shieldMax;
  S.shieldRegenTimer = 0; S.shieldSegTimer = 0;
  S.shieldBrokenTimer = 0;
  S.stunTimer = 0; S.slowTimer = 0; S.overheatTimer = 0;

  S.ult = 0; S.ultActiveT = 0; S.ultWave = null;

  S.ship.x = S.mouse.x; S.ship.y = S.mouse.y;
  S.ship.flipT = 0; S.ship.flipDir = 1;

  S.timers.shootCd = 0; S.timers.spawnA = 1.2; S.timers.spawnE = 3.5;
  S.firing = false; S.lastSpaceTap = 0;

  S.bullets = []; S.asteroids = []; S.enemies = [];
  S.ebullets = []; S.parts = [];
}