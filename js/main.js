import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { initAuth } from "./auth.js";
import { initHangar, setUserEmail } from "./hangar.js";
import { initGame, startGame } from "./game.js";
import { initWorkshop } from "./workshop.js";
import { initChat } from "./chat.js";
import { initProfileScreen } from "./profile-screen.js";

// --- Получаем все экраны ---
const screens = {
  auth:     document.getElementById("screen-auth"),
  hangar:   document.getElementById("screen-hangar"),
  workshop: document.getElementById("screen-workshop"),
  profile:  document.getElementById("screen-profile"),
  menu:     document.getElementById("screen-menu"),
  game:     document.getElementById("screen-game"),
};

// --- Получаем элементы навигации ---
const mainNav = document.getElementById("mainNav");
const navMenu   = document.getElementById("navToMenu");
const navHangar = document.getElementById("navToHangar");
const navWorkshop = document.getElementById("navToWorkshop");
const navDockyard = document.getElementById("navToDockyard");
const navMap    = document.getElementById("navToMap");
const navPlay   = document.getElementById("navToPlay");

// --- Инициализация модулей ---
initAuth();
initHangar();
initGame();
initChat();
initProfileScreen();

// --- Функция переключения экранов ---
function showScreen(screenName) {
  // Скрываем все экраны
  Object.values(screens).forEach(el => {
    if (el) el.classList.add("hidden");
  });
  
  // Показываем нужный
  if (screens[screenName]) {
    screens[screenName].classList.remove("hidden");
  }

  // Управляем нижней панелью (скрываем только в игре и авторизации)
  if (screenName === "auth" || screenName === "game") {
    mainNav.classList.add("hidden");
  } else {
    mainNav.classList.remove("hidden");
  }

  // Подсвечиваем активную кнопку
  [navMenu, navHangar, navWorkshop, navDockyard, navMap, navPlay].forEach(btn => btn?.classList.remove("active"));
  if (screenName === "menu" || screenName === "profile") navMenu?.classList.add("active");
  if (screenName === "hangar") navHangar?.classList.add("active");
  if (screenName === "workshop") navWorkshop?.classList.add("active");

  // Спец. логика при входе на экран
  if (screenName === "workshop") initWorkshop();
  if (screenName === "profile" && window.refreshProfileScreen) window.refreshProfileScreen();
  if (screenName === "menu") {
    const menuEmail = document.getElementById("menuUserEmail");
    if (menuEmail && auth.currentUser) menuEmail.textContent = auth.currentUser.email;
  }
}

// Делаем функцию доступной для game.js (чтобы после полета возвращаться в ангар)
window.showScreen = showScreen;

// --- Обработчики навигации ---
navMenu?.addEventListener("click", () => showScreen("menu"));
navHangar?.addEventListener("click", () => showScreen("hangar"));
navWorkshop?.addEventListener("click", () => showScreen("workshop"));
navMap?.addEventListener("click", () => alert("Карта в разработке!"));
navDockyard?.addEventListener("click", () => alert("Верфь в разработке, капитан!"));

navPlay?.addEventListener("click", () => {
  showScreen("game");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      startGame().catch(err => console.error("Ошибка старта игры:", err));
    });
  });
});

// --- Обработчики экрана Меню ---
document.getElementById("menuProfileBtn")?.addEventListener("click", () => showScreen("profile"));
document.getElementById("menuSettingsBtn")?.addEventListener("click", () => alert("Настройки в разработке!"));
// --- Логика выхода из аккаунта (2 шага) ---
const logoutOverlay = document.getElementById("logoutConfirmOverlay");
const logoutTitle = document.getElementById("logoutConfirmTitle");
const logoutText = document.getElementById("logoutConfirmText");
const logoutYes = document.getElementById("logoutConfirmYes");
const logoutNo = document.getElementById("logoutConfirmNo");

let logoutStep = 1;

document.getElementById("menuLogoutBtn")?.addEventListener("click", () => {
  logoutStep = 1;
  logoutTitle.textContent = "Вы уверены?";
  logoutText.textContent = "Вы точно уверены, капитан?";
  logoutOverlay.classList.remove("hidden");
});

logoutNo?.addEventListener("click", () => {
  logoutOverlay.classList.add("hidden");
});

logoutYes?.addEventListener("click", async () => {
  if (logoutStep === 1) {
    // Переходим ко второму шагу
    logoutStep = 2;
    logoutTitle.textContent = "ПОСЛЕДНИЙ ШАНС";
    logoutText.textContent = "Вы точно уверены, капитан?";
    logoutYes.textContent = "ДА, ВЫЙТИ";
  } else {
    // Подтверждено — выходим
    logoutOverlay.classList.add("hidden");
    await signOut(auth);
  }
});
// ==========================================
// --- СЛУШАТЕЛЬ АВТОРИЗАЦИИ (СТАВИМ В КОНЕЦ) ---
// ==========================================
onAuthStateChanged(auth, (user) => {
  if (user) {
    setUserEmail(user.email);
    
    // Подписываемся на чат
    if (typeof window.subscribeToChat === "function") window.subscribeToChat();
    
    // Отправляем в ангар
    showScreen("hangar");
  } else {
    // Отписываемся от чата
    if (typeof window.unsubscribeFromChat === "function") window.unsubscribeFromChat();
    
    // Отправляем на авторизацию
    showScreen("auth");
  }
});