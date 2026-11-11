// Точка входа: следит за auth и переключает экраны
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { auth } from "./firebase.js";
import { initAuth } from "./auth.js";
import { initHangar, setUserEmail } from "./hangar.js";
import { initGame } from "./game.js";

const authScreen   = document.getElementById("screen-auth");
const hangarScreen = document.getElementById("screen-hangar");

initAuth();
initHangar();
initGame();

onAuthStateChanged(auth, (user) => {
  if (user) {
    authScreen.classList.add("hidden");
    hangarScreen.classList.remove("hidden");
    document.getElementById("screen-game").classList.add("hidden");
    setUserEmail(user.email);
  } else {
    hangarScreen.classList.add("hidden");
    document.getElementById("screen-game").classList.add("hidden");
    authScreen.classList.remove("hidden");
    setUserEmail("");
  }
});