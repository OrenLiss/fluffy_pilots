import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { loadProfile, upgradeStat, getUpgradeCost } from "./profile.js";

const STATS = ["speed", "hull", "shield", "damage"];
let creditsEl = null;
let currentProfile = null;

export function initHangar() {
  const logoutBtn = document.getElementById("logoutBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const profileBtn = document.getElementById("profileBtn");
  creditsEl = document.getElementById("hangarCredits");

  logoutBtn.addEventListener("click", async () => await signOut(auth));
  settingsBtn.addEventListener("click", () => showToast("Настройки — скоро", false));
  profileBtn.addEventListener("click", () => showToast("Профиль — скоро", false));

  STATS.forEach((stat) => {
    const btn = document.getElementById("plus-" + stat);
    btn.addEventListener("click", () => onUpgrade(stat));
  });

  document.addEventListener("profile-updated", refreshProfile);
}

async function onUpgrade(stat) {
  const btn = document.getElementById("plus-" + stat);
  btn.disabled = true;
  try {
    const res = await upgradeStat(stat);
    if (!res.ok) {
      if (res.reason === "no-credits") showToast("Не достаточно кредитов, капитан.", true);
      else if (res.reason === "max-level") showToast("Максимальный уровень.", false);
      else if (res.reason === "firestore-error") showToast("Ошибка сети. Улучшение не применено.", true);
      else showToast("Не удалось улучшить.", true);
      return;
    }
    await refreshProfile();
  } finally {
    btn.disabled = false;
  }
}

async function refreshProfile() {
  try {
    currentProfile = await loadProfile();
    renderStats();
  } catch (err) {
    console.warn("Не удалось загрузить профиль:", err);
    showToast("Не удалось загрузить профиль.", true);
  }
}

function renderStats() {
  if (!currentProfile) return;
  if (creditsEl) creditsEl.textContent = currentProfile.credits ?? 0;

  STATS.forEach((stat) => {
    const levelField = stat + "Level";
    const level = currentProfile[levelField] ?? 0;
    const cost = getUpgradeCost(level);

    const segContainer = document.getElementById("seg-" + stat);
    if (segContainer.childElementCount === 0) {
      for (let i = 0; i < 10; i++) {
        const seg = document.createElement("div");
        seg.className = "seg";
        segContainer.appendChild(seg);
      }
    }
    Array.from(segContainer.children).forEach((seg, i) => {
      seg.classList.toggle("filled", i < level);
    });

    document.getElementById("lvl-" + stat).textContent = level + "/10";
    const costEl = document.getElementById("cost-" + stat);
    const btn = document.getElementById("plus-" + stat);

    if (cost === null) {
      costEl.textContent = "MAX";
      costEl.classList.add("max");
      btn.disabled = true;
    } else {
      costEl.textContent = cost;
      costEl.classList.remove("max");
      btn.disabled = (currentProfile.credits ?? 0) < cost;
    }
  });
}

export async function setUserEmail(email) {
  const el = document.getElementById("userEmail");
  if (el) el.textContent = email || "";
  if (email) await refreshProfile();
  else if (creditsEl) creditsEl.textContent = "0";
}

let toastTimer = null;
function showToast(text, isError = false) {
  let el = document.getElementById("appToast");
  if (!el) {
    el = document.createElement("div");
    el.id = "appToast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.classList.toggle("error", isError);
  el.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2400);
}