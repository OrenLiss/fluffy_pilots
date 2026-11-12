import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { initAuth } from "./auth.js";
import { initHangar, setUserEmail } from "./hangar.js";
import { initGame, startGame } from "./game.js";
import { initWorkshop } from "./workshop.js";
import { initChat } from "./chat.js"; // <-- Импорт есть

const authScreen     = document.getElementById("screen-auth");
const hangarScreen   = document.getElementById("screen-hangar");
const workshopScreen = document.getElementById("screen-workshop");
const gameScreen     = document.getElementById("screen-game");
const mainNav        = document.getElementById("mainNav");

const navHangar   = document.getElementById("navToHangar");
const navWorkshop = document.getElementById("navToWorkshop");
const navDockyard = document.getElementById("navToDockyard");
const navPlay     = document.getElementById("navToPlay");
const workshopBack = document.getElementById("workshopBackBtn");

// Инициализация модулей
initAuth();
initHangar();
initGame();
initChat(); // <-- ДОБАВЛЕН ВЫЗОВ ФУНКЦИИ ЧАТА

function showScreen(screenName) {
  authScreen.classList.add("hidden");
  hangarScreen.classList.add("hidden");
  workshopScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");

  if (screenName === "auth") {
    authScreen.classList.remove("hidden");
    mainNav.classList.add("hidden");
  } else if (screenName === "hangar") {
    hangarScreen.classList.remove("hidden");
    mainNav.classList.remove("hidden");
    updateNavActive(navHangar);
  } else if (screenName === "workshop") {
    workshopScreen.classList.remove("hidden");
    mainNav.classList.remove("hidden");
    updateNavActive(navWorkshop);
  } else if (screenName === "game") {
    gameScreen.classList.remove("hidden");
    mainNav.classList.add("hidden");
  }
}

function updateNavActive(activeBtn) {
  [navHangar, navWorkshop, navDockyard, navPlay].forEach(btn => btn.classList.remove("active"));
  if (activeBtn) activeBtn.classList.add("active");
}

navHangar.addEventListener("click", () => showScreen("hangar"));

navWorkshop.addEventListener("click", () => {
  showScreen("workshop");
  initWorkshop();
});

navDockyard.addEventListener("click", () => alert("Верфь в разработке, капитан!"));

navPlay.addEventListener("click", () => {
  showScreen("game");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      startGame().catch(err => console.error("Ошибка старта игры:", err));
    });
  });
});

workshopBack.addEventListener("click", () => showScreen("hangar"));

onAuthStateChanged(auth, (user) => {
  if (user) {
    setUserEmail(user.email);
    initWorkshop();
    // Подписываемся на чат, если функция определена
    if (typeof window.subscribeToChat === "function") {
      window.subscribeToChat();
    }
    showScreen("hangar");
  } else {
    // Отписываемся от чата
    if (typeof window.unsubscribeFromChat === "function") {
      window.unsubscribeFromChat();
    }
    showScreen("auth");
  }
});