// src/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCuRoWVmUkhNNXdR1l_y9ouzz9jEoSi6c0",
  authDomain: "fluffypilots-9b9d6.firebaseapp.com",
  projectId: "fluffypilots-9b9d6",
  storageBucket: "fluffypilots-9b9d6.firebasestorage.app",
  messagingSenderId: "386734053785",
  appId: "1:386734053785:web:1e9654f84f0b1e72029b08",
  measurementId: "G-G6JD44R88K"
};

const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch (e) { console.warn("Analytics blocked"); }

const auth = getAuth(app);
const db = getFirestore(app);

// Функция, которая создает форму и возвращает Promise.
// Promise разрешится (успешно завершится), когда игрок войдет в систему.
export function showAuthScreen() {
  return new Promise((resolve) => {
    // Создаем HTML формы
    const authDiv = document.createElement('div');
    authDiv.id = 'auth-screen';
    authDiv.innerHTML = `
      <h2 style="color: #5ef2ff; text-shadow: 0 0 16px rgba(94,242,255,.85); letter-spacing: 6px; font-size: 20px; margin-bottom: 20px;">СИСТЕМА ВХОДА</h2>
      <input type="text" id="auth-nick" placeholder="НИКНЕЙМ" autocomplete="off">
      <input type="password" id="auth-pass" placeholder="ПАРОЛЬ" autocomplete="off">
      <button id="btn-login">ВОЙТИ</button>
      <button id="btn-register">РЕГИСТРАЦИЯ</button>
      <div id="auth-msg" style="margin-top: 20px; color: #ff4d7a; font-size: 12px; letter-spacing: 2px;"></div>
    `;
    
    // Добавляем стили прямо в JS, чтобы не трогать ваши CSS файлы
    const style = document.createElement('style');
    style.textContent = `
      #auth-screen {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: #04050b; display: flex; justify-content: center;
        align-items: center; flex-direction: column; z-index: 2147483647;
        color: white; font-family: "Courier New", monospace;
      }
      #auth-screen input {
        display: block; width: 300px; padding: 12px; margin: 10px 0;
        background: rgba(255,255,255,0.05); border: 1.5px solid #5ef2ff;
        color: #8ff9ff; font-family: "Courier New", monospace;
        font-size: 14px; letter-spacing: 2px; outline: none;
      }
      #auth-screen input:focus { box-shadow: 0 0 16px rgba(94,242,255,.45); }
      #auth-screen button {
        width: 300px; padding: 13px; margin: 5px 0; background: transparent;
        border: 1.5px solid #5ef2ff; color: #5ef2ff; cursor: pointer;
        font-weight: bold; font-family: "Courier New", monospace;
        font-size: 14px; letter-spacing: 4px; border-radius: 2px;
        box-shadow: 0 0 16px rgba(94,242,255,.45), inset 0 0 16px rgba(94,242,255,.12);
        transition: all .2s ease;
      }
      #auth-screen button:hover {
        background: rgba(94,242,255,.12);
        box-shadow: 0 0 28px rgba(94,242,255,.85), inset 0 0 24px rgba(94,242,255,.28);
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(authDiv);

    const nickInput = document.getElementById('auth-nick');
    const passInput = document.getElementById('auth-pass');
    const msgDiv = document.getElementById('auth-msg');

    function showMessage(text, isError = true) {
      msgDiv.innerText = text;
      msgDiv.style.color = isError ? "#ff4d7a" : "#5ef2ff";
    }

    // Регистрация
    document.getElementById('btn-register').addEventListener('click', async () => {
      const nick = nickInput.value.trim();
      const pass = passInput.value;
      if (!nick || !pass) return showMessage("ВВЕДИТЕ ДАННЫЕ");
      if (pass.length < 6) return showMessage("ПАРОЛЬ МИН. 6 СИМВОЛОВ");

      const fakeEmail = `${nick}@mygame.local`;
      try {
        showMessage("СОЗДАНИЕ...", false);
        const userCredential = await createUserWithEmailAndPassword(auth, fakeEmail, pass);
        await setDoc(doc(db, "players", userCredential.user.uid), {
          nickname: nick, score: 0, createdAt: new Date()
        });
        showMessage("УСПЕХ!", false);
        setTimeout(() => {
          authDiv.remove(); // Удаляем форму
          resolve();        // Сообщаем main.js, что можно запускать игру
        }, 1000);
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') showMessage("НИК ЗАНЯТ");
        else showMessage("ОШИБКА: " + error.message);
      }
    });

    // Вход
    document.getElementById('btn-login').addEventListener('click', async () => {
      const nick = nickInput.value.trim();
      const pass = passInput.value;
      if (!nick || !pass) return showMessage("ВВЕДИТЕ ДАННЫЕ");

      const fakeEmail = `${nick}@mygame.local`;
      try {
        showMessage("ВХОД...", false);
        await signInWithEmailAndPassword(auth, fakeEmail, pass);
        showMessage("УСПЕХ!", false);
        setTimeout(() => {
          authDiv.remove(); // Удаляем форму
          resolve();        // Сообщаем main.js, что можно запускать игру
        }, 500);
      } catch (error) {
        showMessage("НЕВЕРНЫЙ НИК ИЛИ ПАРОЛЬ");
      }
    });
  });
}