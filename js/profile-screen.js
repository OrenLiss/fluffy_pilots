import { loadProfile, updateNickname } from "./profile.js";
import { auth } from "./firebase.js";

export function initProfileScreen() {
  const emailEl = document.getElementById("profileEmail");
  const killsEl = document.getElementById("profileKills");
  const bestEl = document.getElementById("profileBest");
  const nicknameInput = document.getElementById("nicknameInput");
  const saveBtn = document.getElementById("saveNicknameBtn");

  // Загружаем данные при входе
  window.refreshProfileScreen = async () => {
    if (!auth.currentUser) return;
    const p = await loadProfile();
    
    emailEl.textContent = auth.currentUser.email;
    killsEl.textContent = p.totalKills || 0;
    bestEl.textContent = (p.bestDistance || 0) + " км";
    nicknameInput.value = p.nickname || "";
  };

  // Обработка кнопки "Сохранить"
  saveBtn.addEventListener("click", async () => {
    const newNick = nicknameInput.value.trim();
    if (!newNick) return alert("Ник не может быть пустым");
    
    saveBtn.disabled = true;
    saveBtn.textContent = "Сохранение...";
    
    const res = await updateNickname(newNick);
    
    if (res.ok) {
      alert("Ник успешно сохранен!");
      if (window.subscribeToChat) window.subscribeToChat();
    } else if (res.reason === "taken") {
      alert("Этот ник уже занят. Попробуйте другой.");
    } else if (res.reason === "empty") {
      alert("Ник не может быть пустым.");
    } else {
      alert("Ошибка сохранения. Попробуйте позже.");
    }
    
    saveBtn.disabled = false;
    saveBtn.textContent = "Сохранить";
  });
}