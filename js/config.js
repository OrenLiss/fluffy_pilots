// Единые константы игры
export const SIZES = {
  ship: { width: 128, height: 48 }, // исходник 128×128, на canvas 1:1
};

export const GAME = {
  // Щит и прочность
  MAX_SHIELD: 6,
  MAX_HULL: 6,
  SHIELD_BREAK_COOLDOWN: 30,   // сек, после слома щита
  REGEN_DELAY: 10,             // сек без урона перед регенерацией
  REGEN_INTERVAL: 3,           // сек на +1 щит

  // Скорость
  START_SPEED: 1.0,            // км/с
  ACCEL_PER_SEC: 0.06,        // +км/с за секунду (плавно до бесконечности)
  DISTANCE_MULTIPLIER:1 ,      // 1 ед. скорости/сек = 1 км

  // Стрельба
  FIRE_INTERVAL: 0.18,         // сек
  PLAYER_BULLET_SPEED: 700,    // px/сек

  // Враги
  ASTEROID_SPAWN_INTERVAL: 0.9, // сек
  ENEMY_SPAWN_INTERVAL: 3.0,    // сек
  ENEMY_FIRE_INTERVAL: 1.6,     // сек
  ENEMY_BULLET_SPEED: 220,      // px/сек
  SPEED_TO_ENEMY_BULLET: 60,

  // Экономика
  CREDIT_PER_KILL: 5,
  CREDIT_PER_10KM: 1,
};