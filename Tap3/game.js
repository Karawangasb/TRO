// ================================= //
// --- TARO TAP MINER - GAME.JS --- //
// ================================= //

// --- Firebase Imports (v10.7.1 modular) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc, updateDoc,
  collection, getDocs, query, orderBy, where, limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- Konfigurasi Firebase ---
const firebaseConfig = {
  apiKey: "AIzaSyDOFgwhenY_asKM32mgG_n8_d1rAnMKny0",
  authDomain: "taro-9b8c5.firebaseapp.com",
  projectId: "taro-9b8c5",
  storageBucket: "taro-9b8c5.appspot.com",
  messagingSenderId: "856610794983",
  appId: "1:856610794983:web:49c9eab3d62af46f5da142"
};

// --- Inisialisasi Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  // --- Telegram Init ---
  const tg = window.Telegram.WebApp;
  tg.expand();
  const userId = tg.initDataUnsafe?.user?.id?.toString() || "guest_" + Math.floor(Math.random() * 1000000);
  const userName = tg.initDataUnsafe?.user?.first_name || "Player" + userId.slice(-4);

  console.log("👤 UserID:", userId, "| Name:", userName);

  // --- GAME STATE DEFAULT ---
  let gameState = {
    troBalance: 0,
    energy: 100,
    energyMax: 100,
    growPower: 0.1,
    energyCost: 1,
    rechargeRate: 1,
    upgrades: {
      capacity: { level: 1, cost: 5 },
      power: { level: 1, cost: 5 },
      speed: { level: 1, cost: 7 }
    },
    stakedAmount: 0,
    lastUpdate: Date.now(),
    totalTaps: 0,
    totalUpgrades: 0,
    name: userName // <-- tambahkan nama
  };

  // --- QUEST SYSTEM DEFAULT ---
  let quests = {
    tap100: { target: 100, reward: 10, completed: false },
    upgrade3: { target: 3, reward: 25, completed: false },
    stake50: { target: 50, reward: 5, completed: false }
  };

  // --- DOM ELEMENTS ---
  const balanceValue = document.getElementById("balance-value");
  const energyValue = document.getElementById("energy-value");
  const growPowerValue = document.getElementById("grow-power-value");
  const energyBar = document.getElementById("energy-bar");
  const tapArea = document.getElementById("tap-area");
  const taroPlant = document.getElementById("taro-plant");
  const notification = document.getElementById("notification");
  const userRank = document.getElementById("user-rank");

  const capacityLevel = document.getElementById("capacity-level");
  const powerLevel = document.getElementById("power-level");
  const speedLevel = document.getElementById("speed-level");

  const capacityCost = document.getElementById("capacity-cost");
  const powerCost = document.getElementById("power-cost");
  const speedCost = document.getElementById("speed-cost");

  const stakeBtn = document.getElementById("stake-btn");
  const stakeInput = document.getElementById("stake-input");
  const stakedAmountDisplay = document.getElementById("staked-amount");

  // ========================
  // --- CORE GAME LOGIC ---
  // ========================

  function handleTap(event) {
    if (gameState.energy >= gameState.energyCost) {
      let stakeBonus = 1 + gameState.stakedAmount / 1000;
      let effectiveGrowPower = gameState.growPower * stakeBonus;

      gameState.energy -= gameState.energyCost;
      gameState.troBalance += effectiveGrowPower;
      gameState.totalTaps++;

      if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred("light");
      }

      showFloatingNumber(event.clientX, event.clientY, effectiveGrowPower);

      taroPlant.style.transform = "scale(0.9)";
      setTimeout(() => {
        taroPlant.style.transform = "scale(1)";
      }, 100);

      checkQuests();
      updateUI();
    } else {
      showNotification("Not enough energy! ⚡️");
    }
  }

  function showFloatingNumber(x, y, value) {
    const floatingNumber = document.createElement("div");
    floatingNumber.textContent = `+${value.toFixed(2)}`;
    floatingNumber.className = "floating-number";
    floatingNumber.style.left = `${x}px`;
    floatingNumber.style.top = `${y}px`;
    document.body.appendChild(floatingNumber);
    setTimeout(() => floatingNumber.remove(), 1000);
  }

  const style = document.createElement("style");
  style.innerHTML = `
    .floating-number {
      position: fixed;
      font-size: 24px;
      font-weight: bold;
      color: #fff;
      text-shadow: 0 0 5px #ffd700;
      animation: floatUp 1s ease-out forwards;
      pointer-events: none;
      z-index: 9999;
    }
    @keyframes floatUp {
      to { transform: translateY(-80px); opacity: 0; }
    }`;
  document.head.appendChild(style);

  function rechargeEnergy() {
    if (gameState.energy < gameState.energyMax) {
      gameState.energy += gameState.rechargeRate;
      if (gameState.energy > gameState.energyMax) gameState.energy = gameState.energyMax;
      updateUI();
    }
  }

  function buyUpgrade(type) {
    const upgrade = gameState.upgrades[type];
    if (gameState.troBalance >= upgrade.cost) {
      gameState.troBalance -= upgrade.cost;
      upgrade.level++;
      gameState.totalUpgrades++;

      switch (type) {
        case "capacity":
          gameState.energyMax = Math.floor(100 * 1.2 ** (upgrade.level - 1));
          break;
        case "power":
          gameState.growPower = +(0.1 * 1.5 ** (upgrade.level - 1)).toFixed(2);
          break;
        case "speed":
          gameState.rechargeRate = +(1 * 1.3 ** (upgrade.level - 1)).toFixed(2);
          break;
      }

      upgrade.cost = Math.floor(upgrade.cost * 2.5);

      showNotification(`${type} upgraded!`);
      checkQuests();
      updateUI();
    } else {
      showNotification("Not enough TRO Coin!");
    }
  }

  function stakeTokens() {
    const amount = parseInt(stakeInput.value);
    if (isNaN(amount) || amount <= 0) {
      showNotification("Invalid amount");
      return;
    }
    if (gameState.troBalance >= amount) {
      gameState.troBalance -= amount;
      gameState.stakedAmount += amount;
      stakeInput.value = "";
      showNotification(`${amount} TRO Staked!`);
      checkQuests();
      updateUI();
    } else {
      showNotification("Not enough TRO to stake!");
    }
  }

  // ========================
  // --- UI FUNCTIONS ---
  // ========================

  function updateUI() {
    balanceValue.textContent = Math.floor(gameState.troBalance).toLocaleString();
    energyValue.textContent = `${Math.floor(gameState.energy)}/${gameState.energyMax}`;
    growPowerValue.textContent = gameState.growPower;
    userRank.textContent = `${Math.floor(gameState.troBalance).toLocaleString()} TRO`;

    const energyPercentage = (gameState.energy / gameState.energyMax) * 100;
    energyBar.style.width = `${energyPercentage}%`;

    capacityLevel.textContent = gameState.upgrades.capacity.level;
    powerLevel.textContent = gameState.upgrades.power.level;
    speedLevel.textContent = gameState.upgrades.speed.level;

    capacityCost.textContent = gameState.upgrades.capacity.cost;
    powerCost.textContent = gameState.upgrades.power.cost;
    speedCost.textContent = gameState.upgrades.speed.cost;

    stakedAmountDisplay.textContent = `${gameState.stakedAmount.toLocaleString()} TRO`;
  }

  function showNotification(message) {
    notification.textContent = message;
    notification.classList.add("show");
    setTimeout(() => notification.classList.remove("show"), 2000);
  }

  function setupTabs() {
    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tabContents.forEach((c) => c.classList.remove("active"));
        tab.classList.add("active");
        const tabId = tab.getAttribute("data-tab");
        document.getElementById(`${tabId}-tab`).classList.add("active");
      });
    });
  }

  // ========================
  // --- QUEST SYSTEM ---
  // ========================

  function checkQuests() {
    if (!quests.tap100.completed) {
      const progress = (gameState.totalTaps / quests.tap100.target) * 100;
      document.getElementById("quest-tap100-progress").style.width = `${Math.min(progress, 100)}%`;
      if (gameState.totalTaps >= quests.tap100.target) {
        gameState.troBalance += quests.tap100.reward;
        quests.tap100.completed = true;
        showNotification(`Quest Complete! +${quests.tap100.reward} TRO`);
        document.getElementById("quest-tap100").style.opacity = "0.5";
      }
    }
    if (!quests.upgrade3.completed) {
      const progress = (gameState.totalUpgrades / quests.upgrade3.target) * 100;
      document.getElementById("quest-upgrade3-progress").style.width = `${Math.min(progress, 100)}%`;
      if (gameState.totalUpgrades >= quests.upgrade3.target) {
        gameState.troBalance += quests.upgrade3.reward;
        quests.upgrade3.completed = true;
        showNotification(`Quest Complete! +${quests.upgrade3.reward} TRO`);
        document.getElementById("quest-upgrade3").style.opacity = "0.5";
      }
    }
    if (!quests.stake50.completed) {
      const progress = (gameState.stakedAmount / quests.stake50.target) * 100;
      document.getElementById("quest-stake50-progress").style.width = `${Math.min(progress, 100)}%`;
      if (gameState.stakedAmount >= quests.stake50.target) {
        gameState.troBalance += quests.stake50.reward;
        quests.stake50.completed = true;
        showNotification(`Quest Complete! +${quests.stake50.reward} TRO`);
        document.getElementById("quest-stake50").style.opacity = "0.5";
      }
    }
  }

  // ========================
  // --- LEADERBOARD FUNCTIONS ---
  // ========================

  async function fetchLeaderboard() {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("troBalance", "desc"), limit(10));
      const querySnapshot = await getDocs(q);

      const topPlayers = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        topPlayers.push({
          id: doc.id,
          troBalance: data.troBalance || 0,
          name: data.name || "Anonymous"
        });
      });
      return topPlayers;
    } catch (err) {
      console.error("❌ Leaderboard fetch error:", err);
      return [];
    }
  }

  async function updateUserRank() {
    try {
      const userBalance = gameState.troBalance;
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("troBalance", ">=", userBalance), orderBy("troBalance", "desc"));
      const querySnapshot = await getDocs(q);

      let rank = 1;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.troBalance > userBalance) rank++;
      });

      const rankDisplay = document.getElementById("user-rank");
      if (rankDisplay) {
        rankDisplay.textContent = `#${rank} • ${Math.floor(gameState.troBalance).toLocaleString()} TRO`;
      }
    } catch (err) {
      console.error("❌ Rank fetch error:", err);
    }
  }

  function renderLeaderboard(topPlayers) {
    const leaderboardList = document.querySelector("#leaderboard-tab .leaderboard-list");
    if (!leaderboardList) return;

    leaderboardList.innerHTML = "";

    topPlayers.forEach((player, index) => {
      const isCurrentUser = player.id === userId;
      const item = document.createElement("div");
      item.className = `leaderboard-item ${isCurrentUser ? "current-user" : ""}`;
      item.innerHTML = `
        <div>
          <span class="leaderboard-rank">${index + 1}.</span>
          ${isCurrentUser ? "You" : (player.name || "Player")}
        </div>
        <div>${Math.floor(player.troBalance).toLocaleString()} TRO</div>
      `;
      leaderboardList.appendChild(item);
    });

    updateUserRank();
  }

  async function loadAndRenderLeaderboard() {
    const topPlayers = await fetchLeaderboard();
    renderLeaderboard(topPlayers);
  }

  // ========================
  // --- FIRESTORE SAVE/LOAD ---
  // ========================

  async function saveGame() {
    try {
      const gameStateRef = doc(db, "users", userId);
      await setDoc(gameStateRef, { ...gameState, quests }, { merge: true });
      console.log("💾 Game saved");
    } catch (err) {
      console.error("❌ Save error:", err);
    }
  }

  async function loadGame() {
    try {
      const gameStateRef = doc(db, "users", userId);
      const snap = await getDoc(gameStateRef);
      if (snap.exists()) {
        const data = snap.data();
        gameState = { ...gameState, ...data };
        quests = { ...quests, ...data.quests };
        console.log("📥 Game loaded:", data);
      } else {
        // Simpan nama saat pertama kali
        await setDoc(gameStateRef, { ...gameState, quests });
        console.log("🆕 New game created");
      }
    } catch (err) {
      console.error("❌ Load error:", err);
    }
  }

  // ========================
  // --- INIT GAME ---
  // ========================

  async function initGame() {
    console.log("🌱 TARO Tap Miner Initializing...");
    await loadGame();

    tapArea.addEventListener("click", handleTap);
    document.querySelectorAll(".upgrade-card").forEach((card) => {
      card.addEventListener("click", () => buyUpgrade(card.getAttribute("data-upgrade")));
    });
    stakeBtn.addEventListener("click", stakeTokens);

    setupTabs();
    updateUI();
    checkQuests();

    // Leaderboard
    loadAndRenderLeaderboard();
    setInterval(loadAndRenderLeaderboard, 30000); // refresh tiap 30 detik

    setInterval(rechargeEnergy, 1000);
    setInterval(saveGame, 10000);
  }

  initGame();
});
