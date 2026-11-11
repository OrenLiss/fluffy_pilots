// Инициализация Firebase + экспорт auth и db
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCuRoWVmUkhNNXdR1l_y9ouzz9jEoSi6c0",
  authDomain: "fluffypilots-9b9d6.firebaseapp.com",
  projectId: "fluffypilots-9b9d6",
  storageBucket: "fluffypilots-9b9d6.firebasestorage.app",
  messagingSenderId: "386734053785",
  appId: "1:386734053785:web:1e9654f84f0b1e72029b08",
  measurementId: "G-G6JD44R88K"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);