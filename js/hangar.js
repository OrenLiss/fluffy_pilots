// Логика и рендер ангара
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";

export function initHangar() {
  const logoutBtn = document.getElementById("logoutBtn");
  const settingsBtn = document.getElementById("settingsBtn");
  const profileBtn = document.getElementById("profileBtn");
  const playBtn = document.getElementById("playBtn");
  const zones = document.querySelectorAll(".zone");

  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
  });

  settingsBtn.addEventListener("click", () => {
    console.log("Открыть настройки (заглушка)");
  });

  profileBtn.addEventListener("click", () => {
    console.log("Открыть профиль (заглушка)");
  });

  playBtn.addEventListener("click", () => {
    const active = document.querySelector(".zone.active");
    console.log("Игрок летит в зону:", active?.dataset.zone);
    // TODO: переход в игру
  });

  zones.forEach((zone) => {
    zone.addEventListener("click", () => {
      if (zone.classList.contains("locked")) return;
      zones.forEach((z) => z.classList.remove("active"));
      zone.classList.add("active");
    });
  });
}

export function setUserEmail(email) {
  const el = document.getElementById("userEmail");
  if (el) el.textContent = email || "";
}