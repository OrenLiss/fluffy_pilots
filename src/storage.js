import { CFG } from './config.js';

const KEY = 'cosmo_profile_v1';

const DEFAULT_PROFILE = {
  nickname: '',
  shipId: 'fighter',
  credits: 0,
  bestScore: 0,
  upgrades: { agility:0, shield:0, speed:0, hull:0 },
  unlocks: { ult_unlocked:false, boss_defeated:0 },
  createdAt: Date.now(),
};

export function loadProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    // миграция/дополнение полей
    return {
      ...DEFAULT_PROFILE, ...p,
      upgrades: { ...DEFAULT_PROFILE.upgrades, ...(p.upgrades||{}) },
      unlocks:  { ...DEFAULT_PROFILE.unlocks,  ...(p.unlocks||{})  },
    };
  } catch (e) {
    console.warn('loadProfile failed', e);
    return null;
  }
}

export function saveProfile(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); }
  catch (e) { console.warn('saveProfile failed', e); }
}

export function createProfile(nickname, shipId='fighter') {
  const p = { ...DEFAULT_PROFILE, nickname, shipId, createdAt: Date.now() };
  saveProfile(p);
  return p;
}

export function resetProfile() {
  localStorage.removeItem(KEY);
}

// ==== Доменные хелперы ====
export function addCredits(profile, amount) {
  profile.credits = Math.max(0, (profile.credits|0) + (amount|0));
  saveProfile(profile);
  return profile.credits;
}

export function canUpgrade(profile, id) {
  const u = CFG.UPGRADES[id];
  if (!u) return { ok:false, reason:'unknown' };
  const lvl = profile.upgrades[id]|0;
  if (lvl >= u.max) return { ok:false, reason:'max' };
  const cost = u.cost[lvl];
  if (profile.credits < cost) return { ok:false, reason:'no_credits', cost };
  return { ok:true, cost };
}

export function upgrade(profile, id) {
  const chk = canUpgrade(profile, id);
  if (!chk.ok) return chk;
  profile.credits -= chk.cost;
  profile.upgrades[id] = (profile.upgrades[id]|0) + 1;
  saveProfile(profile);
  return { ok:true, cost: chk.cost, level: profile.upgrades[id] };
}

export function validateNickname(nick) {
  if (typeof nick !== 'string') return { ok:false, msg:'Пустой ник' };
  const t = nick.trim();
  if (t.length < 2)  return { ok:false, msg:'Минимум 2 символа' };
  if (t.length > 16) return { ok:false, msg:'Максимум 16 символов' };
  if (!/^[A-Za-zА-Яа-я0-9_]+$/.test(t)) return { ok:false, msg:'Только буквы, цифры, _' };
  return { ok:true, value:t };
}

// Производные характеристики (используются в бою)
export function derivedStats(profile) {
  const u = profile.upgrades;
  return {
    hullMax:   CFG.BASE_HULL   + u.hull,
    shieldMax: CFG.BASE_SHIELD + u.shield,
    agility:   u.agility * CFG.AGILITY_PER_LVL,      // 0..0.20
    speedMul:  1 + u.speed * CFG.SPEED_PER_LVL,       // 1..1.40
  };
}