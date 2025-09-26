// ================================= //
// --- TARO TAP MINER + FIREBASE + TON --- //
// ================================= //

// --- TON CONFIGURATION ---
const TRO_TOKEN_ADDRESS = "EQA0VzztOFRQ_VY9t-UDSWZ5Xu0_Y_Cyk1Xf_e6_I_o7Quu8";
const MANIFEST_URL = "https://yourdomain.com/tonconnect-manifest.json"; // 🔴 GANTI DENGAN DOMAIN ANDA!

// --- HELPER: Tambahkan listener tap yang kompatibel mobile & desktop ---
function addTapListener(element, handler) {
    const isTouchDevice = ('ontouchstart' in window);
    if (isTouchDevice) {
        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handler(e);
        }, { passive: false });
    } else {
        element.addEventListener('mousedown', handler);
    }
}

// --- FLOATING NUMBER STYLE (sekali saja) ---
if (!document.querySelector('#taro-floating-style')) {
    const style = document.createElement('style');
    style.id = 'taro-floating-style';
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

document.addEventListener('DOMContentLoaded', function() {
    // --- TELEGRAM INIT ---
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.expand();
        tg.ready();
    }

    // --- USER ID (Telegram atau fallback local) ---
    let userId = null;
    let isTelegram = false;
    try {
        if (tg && tg.initDataUnsafe?.user) {
            userId = String(tg.initDataUnsafe.user.id);
            isTelegram = true;
        }
    } catch (e) {
        console.warn("Not in Telegram context");
    }
    if (!userId) userId = 'local_user_' + Date.now();

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

    let gameState = JSON.parse(JSON.stringify(defaultGameState));
    let quests = JSON.parse(JSON.stringify(defaultQuests));
    let userWalletAddress = null;

    // --- DOM ELEMENTS ---
    const connectBtn = document.getElementById('connect-btn');
    const walletAddressEl = document.getElementById('wallet-address');
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

    // --- TON CONNECT INIT ---
    let tonConnectUI = null;
    if (window.TonConnectUI) {
        tonConnectUI = new window.TonConnectUI.TonConnectUI({
            manifestUrl: MANIFEST_URL,
            buttonRootId: 'connect-btn'
        });

        tonConnectUI.onStatusChange(wallet => {
            if (wallet) {
                userWalletAddress = wallet.account.address;
                walletAddressEl.textContent = `Connected: ${userWalletAddress.substring(0, 6)}...${userWalletAddress.substring(userWalletAddress.length - 4)}`;
                saveGameToFirebase(); // Simpan alamat wallet
            } else {
                userWalletAddress = null;
                walletAddressEl.textContent = "Not connected";
            }
        });
    } else {
        connectBtn.textContent = "TON Wallet Required";
        connectBtn.disabled = true;
    }

    // --- FIREBASE INIT (pastikan sudah di-load di index.html) ---
    let database = null;
    try {
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp({
                apiKey: "AIzaSyDOFgwhenY_asKM32mgG_n8_d1rAnMKny0",
                authDomain: "taro-9b8c5.firebaseapp.com",
                projectId: "taro-9b8c5",
                storageBucket: "taro-9b8c5.firebasestorage.app",
                messagingSenderId: "856610794983",
                appId: "1:856610794983:web:49c9eab3d62af46f5da142"
            });
            database = firebase.database();
        }
    } catch (e) {
        console.warn("Firebase not available, falling back to localStorage");
    }

    // --- WITHDRAW FUNCTION (TON) ---
    async function withdrawTRO() {
        if (!userWalletAddress) {
            showNotification("Connect TON wallet first!");
            return;
        }
        if (gameState.troBalance < 1) {
            showNotification("Not enough TRO to withdraw!");
            return;
        }

        try {
            const amountNano = Math.floor(gameState.troBalance * 1e9).toString();
            const tx = {
                validUntil: Math.floor(Date.now() / 1000) + 300,
                messages: [{
                    address: TRO_TOKEN_ADDRESS,
                    amount: "500000000",
                    payload: window.btoa(JSON.stringify({
                        "transfer": {
                            "query_id": Date.now(),
                            "amount": amountNano,
                            "destination": userWalletAddress,
                            "response_destination": userWalletAddress,
                            "custom_payload": "",
                            "forward_ton_amount": "1000000"
                        }
                    }))
                }]
            };

            const result = await tonConnectUI.sendTransaction(tx);
            console.log("Withdraw success:", result);

            gameState.troBalance = 0;
            updateUI();
            saveGameToFirebase();
            showNotification(`✅ Withdrawn ${amountNano / 1e9} TRO!`);

        } catch (e) {
            console.error("Withdraw error:", e);
            showNotification("❌ Withdraw failed!");
        }
    }

    // --- CORE GAME LOGIC ---
    function handleTap(event) {
        if (gameState.energy >= gameState.energyCost) {
            let stakeBonus = 1 + (gameState.stakedAmount / 1000);
            let effectiveGrowPower = gameState.growPower * stakeBonus;

            gameState.energy -= gameState.energyCost;
            gameState.troBalance += effectiveGrowPower;
            gameState.totalTaps++;

            if (tg?.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('light');
            }

            let x = event.clientX || (event.touches?.[0]?.clientX ?? window.innerWidth / 2);
            let y = event.clientY || (event.touches?.[0]?.clientY ?? window.innerHeight / 2);
            showFloatingNumber(x, y, effectiveGrowPower);

            taroPlant.style.transform = 'scale(0.9)';
            setTimeout(() => { taroPlant.style.transform = 'scale(1)'; }, 100);

            checkQuests();
            updateUI();
            saveGameToFirebase();
        } else {
            showNotification("Not enough energy! ⚡️");
        }
    }

    function showFloatingNumber(x, y, value) {
        const el = document.createElement('div');
        el.textContent = `+${value.toFixed(2)}`;
        el.className = 'floating-number';
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1000);
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
        const upg = gameState.upgrades[type];
        if (gameState.troBalance >= upg.cost) {
            gameState.troBalance -= upg.cost;
            upg.level++;
            gameState.totalUpgrades++;

            switch(type) {
                case 'capacity': gameState.energyMax = Math.floor(100 * (1.2 ** (upg.level - 1))); break;
                case 'power':    gameState.growPower = +(0.1 * (1.5 ** (upg.level - 1))).toFixed(2); break;
                case 'speed':    gameState.rechargeRate = +(1 * (1.3 ** (upg.level - 1))).toFixed(2); break;
            }
            upg.cost = Math.floor(upg.cost * 2.5);

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

    // --- UI & NOTIFICATION ---
    function updateUI() {
        balanceValue.textContent = Math.floor(gameState.troBalance).toLocaleString();
        energyValue.textContent = `${Math.floor(gameState.energy)}/${gameState.energyMax}`;
        growPowerValue.textContent = gameState.growPower;
        userRank.textContent = `${Math.floor(gameState.troBalance).toLocaleString()} TRO`;
        energyBar.style.width = `${(gameState.energy / gameState.energyMax) * 100}%`;

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
        setTimeout(() => notification.classList.remove('show'), 2000);
    }

    // --- TABS ---
    function setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        const contents = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => {
            addTapListener(tab, () => {
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(`${tab.dataset.tab}-tab`)?.classList.add('active');
            });
        });
    }

    // --- QUESTS ---
    function checkQuests() {
        // ... (logika quest sama seperti sebelumnya - dipersingkat untuk efisiensi)
        const questChecks = [
            { key: 'tap100', value: gameState.totalTaps, el: 'quest-tap100' },
            { key: 'upgrade3', value: gameState.totalUpgrades, el: 'quest-upgrade3' },
            { key: 'stake50', value: gameState.stakedAmount, el: 'quest-stake50' }
        ];

        questChecks.forEach(({ key, value, el }) => {
            if (!quests[key].completed) {
                const progress = (value / quests[key].target) * 100;
                document.getElementById(`${el}-progress`).style.width = `${Math.min(progress, 100)}%`;
                if (value >= quests[key].target) {
                    gameState.troBalance += quests[key].reward;
                    quests[key].completed = true;
                    showNotification(`Quest Complete! +${quests[key].reward} TRO`);
                    document.getElementById(el).style.opacity = '0.5';
                }
            }
        });
    }

    // --- FIREBASE & STORAGE ---
    function saveGameToFirebase() {
        if (!database && userId.startsWith('local_user')) {
            localStorage.setItem('taroGameState', JSON.stringify(gameState));
            localStorage.setItem('taroQuests', JSON.stringify(quests));
            return;
        }

        if (database) {
            const userRef = database.ref(`users/${userId}`);
            userRef.update({
                gameState,
                quests,
                walletAddress: userWalletAddress,
                lastActive: firebase.database.ServerValue.TIMESTAMP
            }).catch(err => console.error("Save error:", err));
        }
    }

    function loadGameFromFirebase() {
        return new Promise((resolve) => {
            if (!database && userId.startsWith('local_user')) {
                const savedState = localStorage.getItem('taroGameState');
                const savedQuests = localStorage.getItem('taroQuests');
                if (savedState) try { gameState = JSON.parse(savedState); } catch (e) {}
                if (savedQuests) try { quests = JSON.parse(savedQuests); } catch (e) {}
                resolve();
                return;
            }

            if (database) {
                database.ref(`users/${userId}`).once('value')
                    .then(snapshot => {
                        const data = snapshot.val();
                        if (data?.gameState) {
                            gameState = data.gameState;
                            quests = data.quests || defaultQuests;
                            if (data.walletAddress) {
                                userWalletAddress = data.walletAddress;
                                walletAddressEl.textContent = `Connected: ${userWalletAddress.substring(0, 6)}...${userWalletAddress.substring(userWalletAddress.length - 4)}`;
                            }
                        }
                        resolve();
                    })
                    .catch(err => {
                        console.error("Load error:", err);
                        resolve();
                    });
            } else {
                resolve();
            }
        });
    }

    // --- INIT GAME ---
    async function initGame() {
        console.log("🌱 TARO Tap Miner + Firebase + TON Initialized");
        await loadGameFromFirebase();

        // Tambahkan tombol Withdraw (jika TON tersedia)
        if (tonConnectUI) {
            const withdrawBtn = document.createElement('button');
            withdrawBtn.textContent = 'Withdraw TRO';
            withdrawBtn.className = 'stake-btn';
            withdrawBtn.style.marginTop = '10px';
            stakeBtn.parentNode.appendChild(withdrawBtn);
            addTapListener(withdrawBtn, withdrawTRO);
        }

        // Event listeners
        addTapListener(tapArea, handleTap);
        document.querySelectorAll('.upgrade-card').forEach(card => {
            addTapListener(card, () => buyUpgrade(card.dataset.upgrade));
        });
        addTapListener(stakeBtn, stakeTokens);
        setupTabs();

        updateUI();
        checkQuests();

        setInterval(rechargeEnergy, 1000);
        setInterval(saveGameToFirebase, 10000);
    }

    initGame();
});
