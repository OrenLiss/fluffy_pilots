import { loadProfile, buyUpgrade } from "./profile.js";
import { auth } from "./firebase.js";

const UPGRADES_DATA = [
  { id: "double_gun", name: "Двойной ствол", desc: "2 линии снарядов вместо 1", cost: 5000, icon: "🔫" },
  { id: "homing_rockets", name: "Самонаводящиеся ракеты", desc: "Каждые 5 сек автоматически убивают ближайшего врага", cost: 8000, icon: "🚀" },
  { id: "repair_drones", name: "Дроны-ремонтники", desc: "5% шанс при уничтожении астероида получить дрона (макс 4)", cost: 10000, icon: "🤖" },
  { id: "plasma_shield", name: "Плазменный щит", desc: "При сломе щита взрывается, уничтожая всё в радиусе 300px", cost: 12000, icon: "💥" },
  { id: "turbo_engines", name: "Турбо-движки", desc: "Гипер-прыжок после 30 убийств (5 сек неуязвимости)", cost: 15000, icon: "⚡" },
  { id: "photon_cannon", name: "Фотонная пушка", desc: "Лазер на 3 сек после 10 убийств (отключает щит)", cost: 20000, icon: "🔆" },
];

let currentProfile = null;
let isInitialized = false;

export async function initWorkshop() {
  await refreshWorkshop();
  
  // Вешаем слушатель только один раз, чтобы не дублировать события
  if (!isInitialized) {
    document.addEventListener("profile-updated", refreshWorkshop);
    isInitialized = true;
  }
}

async function refreshWorkshop() {
  // Защита от вызова до логина
  if (!auth.currentUser) return;

  try {
    currentProfile = await loadProfile();
    renderUpgrades();
  } catch (err) {
    console.error("Ошибка загрузки профиля в мастерской:", err);
  }
}

function renderUpgrades() {
  const container = document.getElementById("upgradesList");
  if (!container) {
    console.warn("Не найден #upgradesList в HTML");
    return;
  }

  container.innerHTML = "";

  const owned = currentProfile.upgrades || [];
  const credits = currentProfile.credits || 0;

  UPGRADES_DATA.forEach((up) => {
    const isOwned = owned.includes(up.id);
    const canAfford = credits >= up.cost;

    const slot = document.createElement("div");
    slot.className = `upgrade-slot ${isOwned ? "owned" : ""}`;
    
    if (!isOwned && !canAfford) slot.style.opacity = "0.5";

    slot.innerHTML = `
      <div class="slot-icon">${up.icon}</div>
      <div class="slot-info">
        <div class="slot-title">${up.name}</div>
        <div class="slot-desc">${up.desc}</div>
        <div class="slot-cost">
          ${isOwned ? '<span style="color:#33ffaa;">УСТАНОВЛЕНО</span>' : `${up.cost} 💳`}
        </div>
      </div>
    `;

    if (!isOwned) {
      slot.style.cursor = "pointer";
      slot.addEventListener("click", () => handleBuy(up, slot));
    }

    container.appendChild(slot);
  });
}

async function handleBuy(upgrade, element) {
  if (element.classList.contains("loading")) return;
  element.classList.add("loading");
  
  try {
    const res = await buyUpgrade(upgrade.id, upgrade.cost);
    if (res.ok) {
      await refreshWorkshop();
    } else if (res.reason === "no-credits") {
      alert("Не достаточно кредитов, капитан.");
    } else {
      alert("Ошибка покупки: " + res.reason);
    }
  } catch (err) {
    console.error(err);
    alert("Ошибка сети.");
  } finally {
    element.classList.remove("loading");
  }
}