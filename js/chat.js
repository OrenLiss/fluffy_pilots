import { db, auth } from "./firebase.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let unsubscribeChat = null;
const CHAT_LIMIT = 50; // Показываем последние 50 сообщений

export function initChat() {
  const toggleBtn = document.getElementById("chatToggleBtn");
  const closeBtn = document.getElementById("chatCloseBtn");
  const panel = document.getElementById("chatPanel");
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("chatSendBtn");
  const messagesEl = document.getElementById("chatMessages");

  // Открытие/закрытие
  toggleBtn.addEventListener("click", () => panel.classList.toggle("hidden"));
  closeBtn.addEventListener("click", () => panel.classList.add("hidden"));

  // Отправка по кнопке
  sendBtn.addEventListener("click", sendMessage);
  // Отправка по Enter
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || !auth.currentUser) return;

    input.value = ""; // Очищаем сразу

    try {
      await addDoc(collection(db, "global_chat"), {
        uid: auth.currentUser.uid,
        name: auth.currentUser.email.split("@")[0], // Берем часть email до @ как ник
        text: text,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Ошибка отправки:", err);
    }
  }

  // Функция подписки (вызывается из main.js при входе)
  window.subscribeToChat = () => {
    if (unsubscribeChat) unsubscribeChat(); // Отписываемся от старой, если была

    const q = query(
      collection(db, "global_chat"),
      orderBy("timestamp", "asc"),
      limit(CHAT_LIMIT)
    );

    unsubscribeChat = onSnapshot(q, (snapshot) => {
      // Перерисовываем весь список (для 50 сообщений это быстро)
      messagesEl.innerHTML = "";
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const div = document.createElement("div");
        div.className = "chat-message";
        if (auth.currentUser && data.uid === auth.currentUser.uid) {
          div.classList.add("mine");
        }
        
        // Форматируем время (если есть)
        let timeStr = "";
        if (data.timestamp) {
          const date = data.timestamp.toDate();
          timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        div.innerHTML = `<span class="sender">${data.name}</span>${data.text} <span style="font-size:10px; color:#556;">${timeStr}</span>`;
        messagesEl.appendChild(div);
      });

      // Авто-скролл вниз (простой вариант)
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  };

  // Функция отписки (вызывается при выходе)
  window.unsubscribeFromChat = () => {
    if (unsubscribeChat) {
      unsubscribeChat();
      unsubscribeChat = null;
      messagesEl.innerHTML = "";
    }
  };
}