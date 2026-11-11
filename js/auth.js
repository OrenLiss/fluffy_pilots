// Логика экрана регистрации/входа
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";

export function initAuth() {
  const tabLogin    = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const form        = document.getElementById("authForm");
  const emailInput  = document.getElementById("email");
  const passInput   = document.getElementById("password");
  const submitBtn   = document.getElementById("submitBtn");
  const message     = document.getElementById("message");

  let mode = "login";

  function setMode(newMode) {
    mode = newMode;
    tabLogin.classList.toggle("active", mode === "login");
    tabRegister.classList.toggle("active", mode === "register");
    submitBtn.textContent = mode === "login" ? "Войти" : "Зарегистрироваться";
    passInput.autocomplete = mode === "login" ? "current-password" : "new-password";
    message.textContent = "";
  }

  tabLogin.addEventListener("click", () => setMode("login"));
  tabRegister.addEventListener("click", () => setMode("register"));

  function showMessage(text, type = "error") {
    message.textContent = text;
    message.className = `message ${type}`;
  }

  function translateError(code) {
    const map = {
      "auth/invalid-email": "Некорректный email.",
      "auth/user-not-found": "Пользователь не найден.",
      "auth/wrong-password": "Неверный пароль.",
      "auth/invalid-credential": "Неверный email или пароль.",
      "auth/email-already-in-use": "Этот email уже зарегистрирован.",
      "auth/weak-password": "Пароль слишком слабый (мин. 6 символов).",
      "auth/too-many-requests": "Слишком много попыток. Попробуйте позже.",
      "auth/network-request-failed": "Ошибка сети. Проверьте интернет."
    };
    return map[code] || "Что-то пошло не так. Попробуйте снова.";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passInput.value;

    submitBtn.disabled = true;
    showMessage("Подождите...", "success");

    try {
      if (mode === "register") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      form.reset();
      showMessage("");
    } catch (err) {
      showMessage(translateError(err.code));
    } finally {
      submitBtn.disabled = false;
    }
  });

  setMode("login");
}