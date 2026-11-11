// Работа с профилем игрока в Firestore
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db, auth } from "./firebase.js";

const COLLECTION = "players";

function playerRef(uid) {
  return doc(db, COLLECTION, uid);
}

// Получить профиль, создать если нет. Возвращает объект данных.
export async function loadProfile() {
  const user = auth.currentUser;
  if (!user) throw new Error("Не авторизован");

  const ref = playerRef(user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const initial = {
      credits: 0,
      totalKills: 0,
      bestDistance: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, initial);
    return { ...initial, createdAt: new Date(), updatedAt: new Date() };
  }

  return snap.data();
}

// Начислить награду за полёт: кредиты + kills + рекорд дистанции
export async function rewardFlight({ credits, kills, distance }) {
  const user = auth.currentUser;
  if (!user) return;

  const ref = playerRef(user.uid);

  // Сначала убеждаемся, что документ есть (на случай первого полёта сразу после регистрации)
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      credits: 0, totalKills: 0, bestDistance: 0,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
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