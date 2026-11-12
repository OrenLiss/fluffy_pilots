// Единые константы игры
export const SIZES = {
  ship: { width: 96, height: 96 },
};

export const GAME = {
  // Улучшения
  DOUBLE_GUN_OFFSET: 15,         // отступ пуль от центра при двойном стволе
  PLASMA_SHIELD_RADIUS: 300,     // радиус взрыва плазменного щита
  PLASMA_SHIELD_DAMAGE: 999,     // урон взрыва (убивает всё)
  
  HOMING_ROCKET_INTERVAL: 5,     // интервал спавна самонаводящихся ракет (сек)
  HOMING_ROCKET_SPEED: 400,      // скорость ракеты
  
  PHOTON_CANNON_KILLS: 10,       // убийств для активации фотонной пушки
  PHOTON_CANNON_DURATION: 3,     // длительность лазера (сек)
  PHOTON_CANNON_WIDTH: 70,       // ширина лазера (px)
  
  TURBO_ENGINE_KILLS: 30,        // убийств для гипер-прыжка
  TURBO_JUMP_DURATION: 5,        // длительность гипер-прыжка (сек)
	
  // Щит и прочность
  MAX_SHIELD: 6,
  MAX_HULL: 6,
  SHIELD_BREAK_COOLDOWN: 30,
  REGEN_DELAY: 10,
  REGEN_INTERVAL: 3,

  // Скорость
  START_SPEED: 6.0,
  ACCEL_PER_SEC: 0.1,
  DISTANCE_MULTIPLIER: 4,

  // Стрельба
  FIRE_INTERVAL: 0.18,
  PLAYER_BULLET_SPEED: 700,
  SPEED_TO_BULLET: 120,       

  // Хитбокс корабля
  HITBOX_RADIUS: 26,

  // Враги
  ASTEROID_SPAWN_INTERVAL: 0.9,
  ENEMY_SPAWN_INTERVAL: 3.0,
  ENEMY_FIRE_INTERVAL: 1.6,
  ENEMY_BULLET_SPEED: 220,
  SPEED_TO_ENEMY_BULLET: 60,  

  // Экономика
  CREDIT_PER_KILL: 5,
  CREDIT_PER_10KM: 0.02,
  
    // Враги
  ASTEROID_SPAWN_INTERVAL: 0.9,
  ENEMY_SPAWN_INTERVAL: 3.0,
  ENEMY_FIRE_INTERVAL: 1.6,
  ENEMY_BULLET_SPEED: 220,
  SPEED_TO_ENEMY_BULLET: 60,

  // Лимит врагов на экране (зависают у верха)
  ENEMY_MAX_MOBILE: 4,           // до 4 на мобилке
  ENEMY_MAX_DESKTOP: 10,         // до 10 на ПК
  ENEMY_MOBILE_BREAKPOINT: 700,  // ширина экрана, ниже которой считаем «мобилкой»
  ENEMY_HOVER_Y_MIN: 60,         // мин. Y зависания (от верха)
  ENEMY_HOVER_Y_MAX: 160,        // макс. Y зависания
  ENEMY_HOVER_DRIFT: 40,         // насколько плавно дрейфуют по X
};

// ====== ФОРМУЛЫ ПРОКАЧКИ ======
// level = 0 — базовые значения, level = 10 — максимум.
export function statFormulas(profile) {
  const speedLvl   = profile?.speedLevel  ?? 0;
  const hullLvl    = profile?.hullLevel   ?? 0;
  const shieldLvl  = profile?.shieldLevel ?? 0;
  const damageLvl  = profile?.damageLevel ?? 0;

  return {
    // как быстро корабль следует за мышью (множитель lerp)
    followSpeed: 1.4 + speedLvl * 0.12,
    // макс. прочность
    maxHull: 6 + hullLvl * 2,
    // сколько ударов держит ОДИН сегмент щита
    shieldHitsPerSegment: 1 + shieldLvl,
    // кулдаун после слома (сек)
    shieldBreakCooldown: Math.max(5, 30 - shieldLvl * 0.2),
    // урон одной пули
    bulletDamage: 1 + damageLvl * 0.5,
  };
}