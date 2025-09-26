// ================================= //
// --- TARO TAP MINER + TON WALLET --- //
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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// --- TON CONFIGURATION ---
const TRO_TOKEN_ADDRESS = "EQA0VzztOFRQ_VY9t-UDSWZ5Xu0_Y_Cyk1Xf_e6_I_o7Quu8";
const MANIFEST_URL = "https://yourdomain.com/tonconnect-manifest.json"; // GANTI DENGAN DOMAIN ANDA

// --- HELPER: Tambahkan listener tap ---
function addTapListener(element, handler) {
    element.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handler(e);
    }, { passive: false });
    element.addEventListener('mousedown', handler);
}

document.addEventListener('DOMContentLoaded', function() {
    document.body.style.touchAction = 'manipulation';

    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.ready();

    // --- DOM ELEMENTS ---
    const connectBtn = document.getElementById('connect-btn');
    const walletAddressEl = document.getElementById('wallet-address');

    // --- Inisialisasi TonConnect ---
    let tonConnectUI = null;
    let userWalletAddress = null;

    if (window.TonConnectUI) {
        tonConnectUI = new window.TonConnectUI.TonConnectUI({
            manifestUrl: MANIFEST_URL,
            buttonRootId: 'connect-btn' // Akan ganti teks tombol otomatis
        });

        tonConnectUI.onStatusChange(wallet => {
            if (wallet) {
                userWalletAddress = wallet.account.address;
                walletAddressEl.textContent = `Connected: ${userWalletAddress.substring(0, 6)}...${userWalletAddress.substring(userWalletAddress.length - 4)}`;
                // Simpan ke Firebase (opsional)
                if (userId && isTelegram) {
                    database.ref(`users/${userId}/walletAddress`).set(userWalletAddress);
                }
            } else {
                userWalletAddress = null;
                walletAddressEl.textContent = "Not connected";
            }
        });
    } else {
        connectBtn.textContent = "TON Wallet Required";
        connectBtn.disabled = true;
    }

    // --- USER ID (Telegram atau local) ---
    let userId = null;
    let isTelegram = false;
    try {
        if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
            userId = String(tg.initDataUnsafe.user.id);
            isTelegram = true;
        }
    } catch (e) {
        console.warn("Not in Telegram");
    }

    if (!userId) userId = 'local_user';

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

    // --- DOM ELEMENTS GAME ---
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

    // --- FLOATING NUMBER CSS ---
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

    // --- WITHDRAW FUNCTION ---
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
            // Format amount ke nano (1 TRO = 1e9 nano)
            const amountNano = Math.floor(gameState.troBalance * 1e9).toString();

            const tx = {
                validUntil: Math.floor(Date.now() / 1000) + 300, // 5 menit
                messages: [
                    {
                        address: TRO_TOKEN_ADDRESS,
                        amount: "500000000", // 0.5 TON untuk fee
                        payload: window.btoa(
                            JSON.stringify({
                                "transfer": {
                                    "query_id": Date.now(),
                                    "amount": amountNano,
                                    "destination": userWalletAddress,
                                    "response_destination": userWalletAddress,
                                    "custom_payload": "",
                                    "forward_ton_amount": "1000000" // 0.001 TON
                                }
                            })
                        )
                    }
                ]
            };

            const result = await tonConnectUI.sendTransaction(tx);
            console.log("Withdraw success:", result);

            // Kurangi balance di game
            gameState.troBalance = 0;
            updateUI();
            saveGameToFirebase();
            showNotification(`✅ Withdrawn ${amountNano / 1e9} TRO!`);

        } catch (e) {
            console.error("Withdraw error:", e);
            showNotification("❌ Withdraw failed!");
        }
    }

    // --- CORE GAME LOGIC (sama seperti sebelumnya) ---
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

            const x = event.clientX || (event.touches && event.touches[0] ? event.touches[0].clientX : window.innerWidth / 2);
            const y = event.clientY || (event.touches && event.touches[0] ? event.touches[0].clientY : window.innerHeight / 2);

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

    // ... (fungsi lain seperti showFloatingNumber, rechargeEnergy, buyUpgrade, stakeTokens, updateUI, dll. tetap sama)

    // --- FIREBASE FUNCTIONS ---
    function saveGameToFirebase() {
        if (!isTelegram && userId === 'local_user') {
            localStorage.setItem('taroGameState', JSON.stringify(gameState));
            localStorage.setItem('taroQuests', JSON.stringify(quests));
            return;
        }

        const userRef = database.ref('users/' + userId);
        userRef.update({
            gameState: gameState,
            quests: quests,
            lastActive: firebase.database.ServerValue.TIMESTAMP
        }).catch(err => console.error("Save error:", err));
    }

    function loadGameFromFirebase() {
        return new Promise((resolve) => {
            if (!isTelegram && userId === 'local_user') {
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
                        if (data.walletAddress) {
                            userWalletAddress = data.walletAddress;
                            walletAddressEl.textContent = `Connected: ${userWalletAddress.substring(0, 6)}...${userWalletAddress.substring(userWalletAddress.length - 4)}`;
                        }
                    } else {
                        userRef.set({
                            gameState: defaultGameState,
                            quests: defaultQuests,
                            lastActive: firebase.database.ServerValue.TIMESTAMP
                        });
                    }
                    resolve();
                })
                .catch(err => {
                    console.error("Load error:", err);
                    resolve();
                });
        });
    }

    // ... (fungsi lain seperti loadLeaderboard, checkQuests, setupTabs tetap sama)

    // --- INIT GAME ---
    async function initGame() {
        console.log("🌱 TARO Tap Miner + TON Initialized");
        await loadGameFromFirebase();

        // Tambahkan tombol withdraw (opsional)
        const withdrawBtn = document.createElement('button');
        withdrawBtn.textContent = 'Withdraw TRO';
        withdrawBtn.className = 'stake-btn';
        withdrawBtn.style.marginTop = '10px';
        stakeBtn.parentNode.appendChild(withdrawBtn);
        addTapListener(withdrawBtn, withdrawTRO);

        // Event listener game (sama seperti sebelumnya)
        addTapListener(tapArea, handleTap);
        document.querySelectorAll('.upgrade-card').forEach(card => {
            addTapListener(card, () => buyUpgrade(card.getAttribute('data-upgrade')));
        });
        addTapListener(stakeBtn, stakeTokens);

        // Setup tabs
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => {
            addTapListener(tab, () => {
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });

        updateUI();
        checkQuests();
        // loadLeaderboard(); // opsional

        setInterval(rechargeEnergy, 1000);
        setInterval(saveGameToFirebase, 10000);
    }

    initGame();
});
