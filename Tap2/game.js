// ================================= //
// --- TARO TAP MINER - GAME.JS --- //
// ================================= //

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDOFgwhenY_asKM32mgG_n8_d1rAnMKny0",
  authDomain: "taro-9b8c5.firebaseapp.com",
  projectId: "taro-9b8c5",
  storageBucket: "taro-9b8c5.firebasestorage.app",
  messagingSenderId: "856610794983",
  appId: "1:856610794983:web:49c9eab3d62af46f5da142"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener('DOMContentLoaded', function() {
    // --- INISIALISASI GAME ---
    document.body.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });

    const tg = window.Telegram.WebApp;
    tg.expand();

    // --- Dapatkan USER ID ---
    let userId = null;
    let isTelegram = false;
    try {
        if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
            userId = String(tg.initDataUnsafe.user.id);
            isTelegram = true;
            // Tampilkan ID di UI (opsional)
            document.getElementById('wallet-address').textContent = `ID: ${userId}`;
        }
    } catch (e) {
        console.warn("Not running in Telegram WebApp");
    }

    if (!userId) {
        // Fallback: gunakan localStorage dengan ID dummy (untuk testing di browser)
        userId = 'local_user';
        document.getElementById('wallet-address').textContent = "Local Mode";
    }

    // --- DEFAULT GAME STATE ---
    const defaultGameState = {
        troBalance: 0,
        energy: 100,
        energyMax: 100,
        growPower: 0.1,
        energyCost: 1,
        rechargeRate: 1,
        upgrades: {
            capacity: { level: 1, cost: 5 },
            power:    { level: 1, cost: 5 },
            speed:    { level: 1, cost: 7 }
        },
        stakedAmount: 0,
        lastUpdate: Date.now(),
        totalTaps: 0,
        totalUpgrades: 0
    };

    const defaultQuests = {
        tap100:    { target: 100, reward: 10, completed: false },
        upgrade3:  { target: 3, reward: 25, completed: false },
        stake50:   { target: 50, reward: 5, completed: false }
    };

    // --- GAME STATE ---
    let gameState = JSON.parse(JSON.stringify(defaultGameState));
    let quests = JSON.parse(JSON.stringify(defaultQuests));

    // --- DOM ELEMENTS ---
    const balanceValue = document.getElementById('balance-value');
    const energyValue = document.getElementById('energy-value');
    const growPowerValue = document.getElementById('grow-power-value');
    const energyBar = document.getElementById('energy-bar');
    const tapArea = document.getElementById('tap-area');
    const taroPlant = document.getElementById('taro-plant');
    const notification = document.getElementById('notification');
    const userRank = document.getElementById('user-rank');

    const capacityLevel = document.getElementById('capacity-level');
    const powerLevel = document.getElementById('power-level');
    const speedLevel = document.getElementById('speed-level');

    const capacityCost = document.getElementById('capacity-cost');
    const powerCost = document.getElementById('power-cost');
    const speedCost = document.getElementById('speed-cost');

    const stakeBtn = document.getElementById('stake-btn');
    const stakeInput = document.getElementById('stake-input');
    const stakedAmountDisplay = document.getElementById('staked-amount');

    // --- FLOATING NUMBER CSS (Hanya sekali) ---
    if (!document.querySelector('#floating-style')) {
        const style = document.createElement('style');
        style.id = 'floating-style';
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
            to {
                transform: translateY(-80px);
                opacity: 0;
            }
        }`;
        document.head.appendChild(style);
    }

    // --- CORE GAME LOGIC ---
    function handleTap(event) {
        if (gameState.energy >= gameState.energyCost) {
            let stakeBonus = 1 + (gameState.stakedAmount / 1000);
            let effectiveGrowPower = gameState.growPower * stakeBonus;

            gameState.energy -= gameState.energyCost;
            gameState.troBalance += effectiveGrowPower;
            gameState.totalTaps++;

            if (tg && tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('light');
            }

            showFloatingNumber(event.clientX, event.clientY, effectiveGrowPower);

            taroPlant.style.transform = 'scale(0.9)';
            setTimeout(() => { taroPlant.style.transform = 'scale(1)'; }, 100);

            checkQuests();
            updateUI();
            saveGameToFirebase(); // Simpan langsung
        } else {
            showNotification("Not enough energy! ⚡️");
        }
    }

    function showFloatingNumber(x, y, value) {
        const floatingNumber = document.createElement('div');
        floatingNumber.textContent = `+${value.toFixed(2)}`;
        floatingNumber.className = 'floating-number';
        floatingNumber.style.left = `${x}px`;
        floatingNumber.style.top = `${y}px`;
        document.body.appendChild(floatingNumber);
        setTimeout(() => { floatingNumber.remove(); }, 1000);
    }

    function rechargeEnergy() {
        if (gameState.energy < gameState.energyMax) {
            gameState.energy += gameState.rechargeRate;
            if (gameState.energy > gameState.energyMax) {
                gameState.energy = gameState.energyMax;
            }
            updateUI();
        }
    }

    function buyUpgrade(type) {
        const upgrade = gameState.upgrades[type];
        if (gameState.troBalance >= upgrade.cost) {
            gameState.troBalance -= upgrade.cost;
            upgrade.level++;
            gameState.totalUpgrades++;

            switch(type) {
                case 'capacity':
                    gameState.energyMax = Math.floor(100 * (1.2 ** (upgrade.level - 1)));
                    break;
                case 'power':
                    gameState.growPower = +(0.1 * (1.5 ** (upgrade.level - 1))).toFixed(2);
                    break;
                case 'speed':
                    gameState.rechargeRate = +(1 * (1.3 ** (upgrade.level - 1))).toFixed(2);
                    break;
            }

            upgrade.cost = Math.floor(upgrade.cost * 2.5);

            showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} Upgraded!`);
            checkQuests();
            updateUI();
            saveGameToFirebase();
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
            stakeInput.value = '';
            showNotification(`${amount} TRO Staked!`);
            checkQuests();
            updateUI();
            saveGameToFirebase();
        } else {
            showNotification("Not enough TRO to stake!");
        }
    }

    // --- UI FUNCTIONS ---
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
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }

    function setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    }

    // --- QUEST & DATA MANAGEMENT ---
    function checkQuests() {
        if (!quests.tap100.completed && gameState.totalTaps >= quests.tap100.target) {
            gameState.troBalance += quests.tap100.reward;
            quests.tap100.completed = true;
            showNotification(`Quest Complete! +${quests.tap100.reward} TRO`);
            document.getElementById('quest-tap100').style.opacity = '0.5';
        }
        
        if (!quests.upgrade3.completed && gameState.totalUpgrades >= quests.upgrade3.target) {
            gameState.troBalance += quests.upgrade3.reward;
            quests.upgrade3.completed = true;
            showNotification(`Quest Complete! +${quests.upgrade3.reward} TRO`);
            document.getElementById('quest-upgrade3').style.opacity = '0.5';
        }

        if (!quests.stake50.completed && gameState.stakedAmount >= quests.stake50.target) {
            gameState.troBalance += quests.stake50.reward;
            quests.stake50.completed = true;
            showNotification(`Quest Complete! +${quests.stake50.reward} TRO`);
            document.getElementById('quest-stake50').style.opacity = '0.5';
        }
    }

    // --- FIREBASE FUNCTIONS ---
    function saveGameToFirebase() {
        if (!isTelegram && userId === 'local_user') {
            // Fallback ke localStorage jika bukan di Telegram
            localStorage.setItem('taroGameState', JSON.stringify(gameState));
            localStorage.setItem('taroQuests', JSON.stringify(quests));
            return;
        }

        const userRef = database.ref('users/' + userId);
        userRef.update({
            gameState: gameState,
            quests: quests,
            lastActive: firebase.database.ServerValue.TIMESTAMP
        }).catch(err => {
            console.error("Firebase save error:", err);
            showNotification("⚠️ Save failed. Retrying...");
        });
    }

    function loadGameFromFirebase() {
        return new Promise((resolve) => {
            if (!isTelegram && userId === 'local_user') {
                // Fallback
                const savedState = localStorage.getItem('taroGameState');
                const savedQuests = localStorage.getItem('taroQuests');
                if (savedState) gameState = JSON.parse(savedState);
                if (savedQuests) quests = JSON.parse(savedQuests);
                resolve();
                return;
            }

            const userRef = database.ref('users/' + userId);
            userRef.once('value')
                .then(snapshot => {
                    const data = snapshot.val();
                    if (data && data.gameState) {
                        gameState = data.gameState;
                        quests = data.quests || defaultQuests;
                    } else {
                        // Data baru — simpan default
                        userRef.set({
                            gameState: defaultGameState,
                            quests: defaultQuests,
                            lastActive: firebase.database.ServerValue.TIMESTAMP
                        });
                    }
                    resolve();
                })
                .catch(err => {
                    console.error("Firebase load error:", err);
                    showNotification("⚠️ Load failed. Using local data.");
                    resolve();
                });
        });
    }

    function loadLeaderboard() {
        const leaderboardRef = database.ref('users').orderByChild('gameState/troBalance').limitToLast(5);
        leaderboardRef.once('value')
            .then(snapshot => {
                const leaderboardContainer = document.querySelector('#leaderboard-tab');
                // Kosongkan kecuali judul
                leaderboardContainer.innerHTML = `
                    <div class="section-title">
                        <i class="fas fa-trophy"></i>
                        <h2>Leaderboard</h2>
                    </div>
                `;

                const users = [];
                snapshot.forEach(child => {
                    const userData = child.val();
                    if (userData && userData.gameState) {
                        users.push({
                            id: child.key,
                            balance: userData.gameState.troBalance || 0
                        });
                    }
                });

                // Urutkan descending
                users.sort((a, b) => b.balance - a.balance);

                users.forEach((user, index) => {
                    const isMe = (user.id === userId);
                    const displayName = isMe ? "You" : `Player ${user.id.slice(0, 5)}`;
                    const rank = index + 1;

                    const item = document.createElement('div');
                    item.className = 'leaderboard-item';
                    item.innerHTML = `
                        <div><span class="leaderboard-rank">${rank}.</span> ${displayName}</div>
                        <div>${Math.floor(user.balance).toLocaleString()} TRO</div>
                    `;
                    leaderboardContainer.appendChild(item);
                });

                // Update "You" di bagian bawah (opsional)
                userRank.textContent = `${Math.floor(gameState.troBalance).toLocaleString()} TRO`;
            })
            .catch(err => {
                console.error("Leaderboard load error:", err);
            });
    }

    // --- INITIALIZATION ---
    async function initGame() {
        console.log("🌱 TARO Tap Miner Initializing...");
        await loadGameFromFirebase();
        
        tapArea.addEventListener('click', handleTap);
        document.querySelectorAll('.upgrade-card').forEach(card => {
            card.addEventListener('click', () => {
                buyUpgrade(card.getAttribute('data-upgrade'));
            });
        });
        stakeBtn.addEventListener('click', stakeTokens);
        
        setupTabs();
        updateUI();
        checkQuests();
        loadLeaderboard(); // Muat leaderboard saat mulai

        setInterval(rechargeEnergy, 1000);
        setInterval(() => {
            saveGameToFirebase();
            loadLeaderboard(); // Refresh leaderboard tiap 10 detik
        }, 10000);
    }
    
    initGame();
});
