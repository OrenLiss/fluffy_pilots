// Логика и рендер ангара
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { startGame } from "./game.js";
import { loadProfile } from "./profile.js";

let creditsEl = null;

export function initHangar() {
  const logoutBtn = document.getElementById("logoutBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const profileBtn = document.getElementById("profileBtn");
  const playBtn = document.getElementById("playBtn");
  const zones = document.querySelectorAll(".zone");
  creditsEl = document.getElementById("hangarCredits");

  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
  });
  settingsBtn.addEventListener("click", () => console.log("Открыть настройки (заглушка)"));
  profileBtn.addEventListener("click", () => console.log("Открыть профиль (заглушка)"));

  playBtn.addEventListener("click", () => {
    const active = document.querySelector(".zone.active");
    if (!active) return;
    if (active.dataset.zone !== "space") return;
    document.getElementById("screen-hangar").classList.add("hidden");
    document.getElementById("screen-game").classList.remove("hidden");
    requestAnimationFrame(() => startGame());
  });

  zones.forEach((zone) => {
    zone.addEventListener("click", () => {
      if (zone.classList.contains("locked")) return;
      zones.forEach((z) => z.classList.remove("active"));
      zone.classList.add("active");
    });
  });

  // Обновляем баланс, когда возвращаемся из полёта
  document.addEventListener("profile-updated", refreshCredits);
}

export async function setUserEmail(email) {
  const el = document.getElementById("userEmail");
  if (el) el.textContent = email || "";
  if (email) await refreshCredits();
  else if (creditsEl) creditsEl.textContent = "0";
}

async function refreshCredits() {
  try {
    const data = await loadProfile();
    if (creditsEl) creditsEl.textContent = data.credits ?? 0;
  } catch (err) {
    console.warn("Не удалось загрузить профиль:", err);
  }
}