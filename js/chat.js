import { db, auth } from "./firebase.js";
import { loadProfile } from "./profile.js";
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
const CHAT_LIMIT = 50;
let isBanned = false; // Флаг для локальной блокировки

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

  // Функция проверки на опасный ввод (XSS)
  function isMalicious(text) {
    const badWords = ["<", ">", "script", "iframe", "onerror", "onload", "onclick", "javascript:", "alert("];
    const lowerText = text.toLowerCase();
    return badWords.some(word => lowerText.includes(word));
  }

  async function sendMessage() {
    if (isBanned) {
      alert("Вы забанены за нарушение правил чата.");
      return;
    }

    const text = input.value.trim();
    if (!text || !auth.currentUser) return;

    // Проверка на опасный контент
    if (isMalicious(text)) {
      isBanned = true; // Локальный бан
      input.value = "";
      input.disabled = true;
      sendBtn.disabled = true;
      alert("⛔ БАН! Попытка внедрения кода (XSS) запрещена. Вы отключены от чата.");
      
      // Здесь можно отправить лог в Firestore (например, в отдельную коллекцию bans)
      console.warn("XSS attempt detected from user:", auth.currentUser.email, "Text:", text);
      return;
    }

    input.value = ""; // Очищаем сразу

    try {
      const profile = await loadProfile();
      const displayName = profile.nickname || auth.currentUser.email.split("@")[0];

      await addDoc(collection(db, "global_chat"), {
        uid: auth.currentUser.uid,
        name: displayName,
        text: text,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Ошибка отправки:", err);
    }
  }

  // Отправка по кнопке и Enter
  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // Подписка на сообщения
  window.subscribeToChat = () => {
    if (unsubscribeChat) unsubscribeChat();
    
    const q = query(
      collection(db, "global_chat"),
      orderBy("timestamp", "asc"),
      limit(CHAT_LIMIT)
    );

    unsubscribeChat = onSnapshot(q, (snapshot) => {
      messagesEl.innerHTML = "";
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const div = document.createElement("div");
        div.className = "chat-message";
        if (auth.currentUser && data.uid === auth.currentUser.uid) {
          div.classList.add("mine");
        }
        
        let timeStr = "";
        if (data.timestamp) {
          const date = data.timestamp.toDate();
          timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // БЕЗОПАСНЫЙ РЕНДЕР (БЕЗ innerHTML)
        const senderSpan = document.createElement("span");
        senderSpan.className = "sender";
        senderSpan.textContent = data.name;

        const messageText = document.createTextNode(data.text);

        const timeSpan = document.createElement("span");
        timeSpan.style.fontSize = "10px";
        timeSpan.style.color = "#556";
        timeSpan.textContent = timeStr;

        div.appendChild(senderSpan);
        div.appendChild(messageText);
        div.appendChild(timeSpan);
        messagesEl.appendChild(div);
      });

      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  };

  window.unsubscribeFromChat = () => {
    if (unsubscribeChat) {
      unsubscribeChat();
      unsubscribeChat = null;
      messagesEl.innerHTML = "";
    }
  };
}