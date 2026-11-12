// Работа с профилем игрока в Firestore
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp, increment, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db, auth } from "./firebase.js";

const COLLECTION = "players";

export function getUpgradeCost(currentLevel) {
  if (currentLevel >= 10) return null;
  const n = currentLevel + 1;
  return 500 * n * n * n;
}

function playerRef(uid) {
  return doc(db, COLLECTION, uid);
}

function defaultProfile() {
  return {
    credits: 0,
    totalKills: 0,
    bestDistance: 0,
    speedLevel: 0,
    hullLevel: 0,
    shieldLevel: 0,
    damageLevel: 0,
    upgrades: [], // массив купленных улучшений
  };
}

export async function loadProfile() {
  const user = auth.currentUser;
  if (!user) throw new Error("Не авторизован");
  const ref = playerRef(user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const initial = {
      ...defaultProfile(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, initial);
    return { ...initial, createdAt: new Date(), updatedAt: new Date() };
  }

  const data = snap.data();
  return {
    ...defaultProfile(),
    ...data,
    upgrades: data.upgrades || [], // защита на случай старых профилей
  };
}

export async function rewardFlight({ credits, kills, distance }) {
  const user = auth.currentUser;
  if (!user) return;
  const ref = playerRef(user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      ...defaultProfile(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  const data = (await getDoc(ref)).data();
  const bestBefore = data.bestDistance ?? 0;

  await updateDoc(ref, {
    credits: increment(Math.max(0, credits | 0)),
    totalKills: increment(Math.max(0, kills | 0)),
    bestDistance: Math.max(bestBefore, distance | 0),
    updatedAt: serverTimestamp(),
  });
}

export async function upgradeStat(stat) {
  const user = auth.currentUser;
  if (!user) return { ok: false, reason: "no-auth" };

  const FIELD_BY_STAT = {
    speed: "speedLevel",
    hull: "hullLevel",
    shield: "shieldLevel",
    damage: "damageLevel",
  };
  const field = FIELD_BY_STAT[stat];
  if (!field) return { ok: false, reason: "bad-stat" };

  const ref = playerRef(user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ok: false, reason: "no-profile" };

  const data = snap.data();
  const currentLevel = data[field] ?? 0;

  if (currentLevel >= 10) return { ok: false, reason: "max-level" };

  const cost = getUpgradeCost(currentLevel);
  const currentCredits = data.credits ?? 0;
  if (currentCredits < cost) {
    return { ok: false, reason: "no-credits", cost, credits: currentCredits };
  }

  try {
    await updateDoc(ref, {
      credits: increment(-cost),
      [field]: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    return { ok: false, reason: "firestore-error", error: err };
  }

  return { ok: true, newLevel: currentLevel + 1, newCredits: currentCredits - cost, cost };
}

// ====== НОВАЯ ФУНКЦИЯ: ПОКУПКА УЛУЧШЕНИЯ ======
export async function buyUpgrade(upgradeId, cost) {
  const user = auth.currentUser;
  if (!user) return { ok: false, reason: "no-auth" };

  const ref = playerRef(user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { ok: false, reason: "no-profile" };

  const data = snap.data();
  const currentCredits = data.credits ?? 0;
  const ownedUpgrades = data.upgrades || [];

  if (ownedUpgrades.includes(upgradeId)) {
    return { ok: false, reason: "already-owned" };
  }

  if (currentCredits < cost) {
    return { ok: false, reason: "no-credits", cost, credits: currentCredits };
  }

  try {
    await updateDoc(ref, {
      credits: increment(-cost),
      upgrades: arrayUnion(upgradeId),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    return { ok: false, reason: "firestore-error", error: err };
  }

  return { ok: true, newCredits: currentCredits - cost };
}