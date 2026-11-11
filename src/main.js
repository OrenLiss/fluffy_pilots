import { loadProfile, saveProfile, derivedStats, addCredits } from './storage.js';
import { createMenu } from './ui/menu.js';
import { createHangar } from './ui/hangar.js';
import { initCanvas, getCtx, getSize } from './render/canvas.js';
import { initInput } from './input.js';
import { update, drawGame, gameOver, restart } from './game.js';
import { S } from './state.js';
import { CFG } from './config.js';
import { showAuthScreen } from './auth.js'; // НОВЫЙ ИМПОРТ

function startGame() {
  let returnTimeout = null; // Храним ID таймера возврата в ангар
  let lastT = 0;            // Время последнего кадра

  const canvas = document.getElementById('cosmo-canvas');
  const overlay = document.getElementById('cosmo-overlay');
  const gameEl = document.getElementById('cosmo-game');

  // --- Функция для безопасного возврата в ангар ---
  function goToHangar(hangar, profile) {
    if (returnTimeout) clearTimeout(returnTimeout);
    returnTimeout = null;
    
    gameEl.style.display = 'none';
    overlay.classList.remove('cosmo-show');
    hangar.show(profile);
  }

  // --- Инициализация Ангара ---
  const hangar = createHangar({
    onPlay(profile, loc) {
      if (returnTimeout) clearTimeout(returnTimeout); // Отменяем таймер, если игрок быстро перезапустил

      S.profile = profile;
      S.location = loc;
      S.stats = derivedStats(profile);
      
      // Спавним корабль по центру
      S.ship.x = window.innerWidth / 2;
      S.ship.y = window.innerHeight * 0.78;
      S.mouse.x = S.ship.x;
      S.mouse.y = S.ship.y;
      
      restart(window.innerWidth, window.innerHeight);
      
      gameEl.style.display = 'block';
      overlay.classList.remove('cosmo-show');
      lastT = 0; // Сбрасываем время, чтобы не было огромного dt
    }
  });

  // --- Инициализация Меню ---
  const menu = createMenu({
    onStart(profile) { 
      hangar.show(profile); 
    }
  });

  // --- Инициализация Canvas ---
  initCanvas(canvas);
  
  // --- Инициализация Ввода (мышь, клавиатура) ---
  // Передаём колбэк для рестарта (нажатие Enter на экране смерти)
  initInput(canvas, () => {
    if (returnTimeout) clearTimeout(returnTimeout);
    restart(window.innerWidth, window.innerHeight);
    gameEl.style.display = 'block';
    overlay.classList.remove('cosmo-show');
    lastT = 0;
  }, gameOver);

  // Обработчик кнопки "В АНГАР" на экране смерти
  const restartBtn = document.getElementById('cosmo-restart');
  if (restartBtn) {
    restartBtn.onclick = () => goToHangar(hangar, S.profile);
  }

  // --- Главный игровой цикл ---
  function loop(now) {
    if (!lastT) lastT = now;
    let dt = (now - lastT) / 1000;
    lastT = now;
    
    // Защита от слишком больших скачков времени (например, если вкладка была в фоне)
    if (dt > 0.05) dt = 0.05;

    if (S.mode !== 'over') {
      update(dt);
      drawGame();
    } else {
      // Режим Game Over
      drawGame();
      
      if (!overlay.classList.contains('cosmo-show')) {
        document.getElementById('cosmo-final-score').textContent = S.score.toFixed(1);
        overlay.classList.add('cosmo-show');
        
        // Автоматический возврат в ангар через 3 секунды
        returnTimeout = setTimeout(() => {
          goToHangar(hangar, S.profile);
        }, 3000);
      }
    }
    requestAnimationFrame(loop);
  }

  // Запускаем цикл
  requestAnimationFrame(loop);

  // Прячем игру и показываем стартовое меню
  gameEl.style.display = 'none';
  menu.show(loadProfile());
}

// --- НОВЫЙ БЛОК ЗАПУСКА ---
async function boot() {
  try {
    // Ждем, пока игрок введет ник и пароль в форме
    await showAuthScreen();
    // Как только форма закрылась (успешный вход) — запускаем игру
    startGame();
  } catch (e) {
    console.error("Ошибка авторизации:", e);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}