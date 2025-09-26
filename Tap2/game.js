// ================================= //
// --- TARO TAP MINER - GAME.JS --- //
// ================================= //

// --- FIREBASE & TONKEEPER CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyDOFgwhenY_asKM32mgG_n8_d1rAnMKny0",
    authDomain: "taro-9b8c5.firebaseapp.com",
    databaseURL: "https://taro-9b8c5-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "taro-9b8c5",
    storageBucket: "taro-9b8c5.firebasestorage.app",
    messagingSenderId: "856610794983",
    appId: "1:856610794983:web:49c9eab3d62af46f5da142"
};

// Inisialisasi Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebaseApp.database();
// ------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    // Mencegah pull-to-refresh dan scroll di WebApp
    document.body.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });

    // Inisialisasi Telegram WebApp
    const tg = window.Telegram.WebApp;
    tg.expand();

    // --- GAME STATE ---\
    let gameState = {
        troBalance: 0,
        energy: 100,
        energyMax: 100,
        growPower: 0.1,      // Poin per tap
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

    // --- QUEST SYSTEM ---\
    let quests = {
        tap100:    { target: 100, reward: 10, completed: false },
        upgrade3:  { target: 3, reward: 25, completed: false },
        stake50:   { target: 50, reward: 5, completed: false }
    };

    // --- DOM ELEMENTS ---\
    const balanceValue = document.getElementById('balance-value');
    const energyValue = document.getElementById('energy-value');
    const growPowerValue = document.getElementById('grow-power-value');
    const rechargeRateValue = document.getElementById('recharge-rate-value');
    const energyMaxValue = document.getElementById('energy-max-value');
    const stakedValue = document.getElementById('staked-value');
    const tapArea = document.getElementById('tap-area');
    const stakeBtn = document.getElementById('stake-btn');
    const notificationElement = document.getElementById('notification');
    
    // Tonkeeper/Wallet elements
    const walletAddressDisplay = document.getElementById('wallet-address');
    const connectBtn = document.getElementById('connect-btn');

    // --- HELPER FUNCTIONS ---\
    function showNotification(message) {
        notificationElement.textContent = message;
        notificationElement.classList.add('show');
        setTimeout(() => {
            notificationElement.classList.remove('show');
        }, 3000);
    }

    function formatNumber(num) {
        return Math.floor(num).toLocaleString('en-US');
    }

    // --- GAME LOGIC ---\
    function handleTap(event) {
        if (gameState.energy >= gameState.energyCost) {
            // Tap Logic
            const tapValue = gameState.growPower;
            gameState.troBalance += tapValue;
            gameState.energy -= gameState.energyCost;
            gameState.totalTaps += 1;

            // Visual Feedback
            createFloatingText(event.clientX, event.clientY, `+${tapValue.toFixed(1)}`);

            updateUI();
            checkQuests();
        } else {
            showNotification("Energy habis! Isi ulang atau tunggu.");
        }
    }

    function createFloatingText(x, y, text) {
        const floatText = document.createElement('div');
        floatText.className = 'floating-text';
        floatText.textContent = text;
        floatText.style.left = `${x}px`;
        floatText.style.top = `${y - 20}px`; 
        tapArea.appendChild(floatText);

        // Remove the element after animation
        floatText.addEventListener('animationend', () => {
            floatText.remove();
        });
    }

    function rechargeEnergy() {
        if (gameState.energy < gameState.energyMax) {
            const timeElapsed = (Date.now() - gameState.lastUpdate) / 1000; // dalam detik
            const energyGained = timeElapsed * gameState.rechargeRate;

            gameState.energy = Math.min(gameState.energyMax, gameState.energy + energyGained);
            gameState.lastUpdate = Date.now();
            updateUI();
        }
    }

    function buyUpgrade(type) {
        const upgrade = gameState.upgrades[type];
        const cost = upgrade.cost;
        
        if (gameState.troBalance >= cost) {
            gameState.troBalance -= cost;
            upgrade.level += 1;
            gameState.totalUpgrades += 1;

            // Apply specific effect
            if (type === 'power') {
                gameState.growPower += 0.15; // Peningkatan Grow Power
            } else if (type === 'capacity') {
                gameState.energyMax += 50; // Peningkatan Max Energy
                gameState.energy += 50; // Langsung tambahkan energy
            } else if (type === 'speed') {
                gameState.rechargeRate += 0.5; // Peningkatan Recharge Rate
            }

            // Calculate new cost (contoh: 1.5x dari biaya sebelumnya)
            upgrade.cost = Math.ceil(cost * 1.5);

            showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} Level ${upgrade.level} dibeli!`);
            updateUI();
            checkQuests();
        } else {
            showNotification("TRO tidak cukup!");
        }
    }

    function stakeTokens() {
        // Logika sederhana untuk Stake
        const amount = 50; // Contoh: Stake 50 TRO
        if (gameState.troBalance >= amount) {
            gameState.troBalance -= amount;
            gameState.stakedAmount += amount;
            showNotification(`Berhasil Stake ${amount} TRO!`);
            updateUI();
            checkQuests();
        } else {
            showNotification("TRO tidak cukup untuk Stake 50!");
        }
    }


    // --- UI UPDATES ---\
    function updateUI() {
        balanceValue.textContent = formatNumber(gameState.troBalance);
        
        // Energy dibulatkan ke bawah
        energyValue.textContent = `${formatNumber(Math.floor(gameState.energy))}/${gameState.energyMax}`; 
        
        // Update Stats Card
        growPowerValue.textContent = `+${gameState.growPower.toFixed(2)}`;
        rechargeRateValue.textContent = `+${gameState.rechargeRate.toFixed(1)}/s`;
        energyMaxValue.textContent = gameState.energyMax;
        stakedValue.textContent = formatNumber(gameState.stakedAmount);

        // Update Upgrade Cards
        document.getElementById('power-level').textContent = gameState.upgrades.power.level;
        document.getElementById('power-cost').textContent = formatNumber(gameState.upgrades.power.cost);
        document.getElementById('capacity-level').textContent = gameState.upgrades.capacity.level;
        document.getElementById('capacity-cost').textContent = formatNumber(gameState.upgrades.capacity.cost);
        document.getElementById('speed-level').textContent = gameState.upgrades.speed.level;
        document.getElementById('speed-cost').textContent = formatNumber(gameState.upgrades.speed.cost);
        
        // Update Quests UI (jika diperlukan)
        // Di sini Anda dapat menambahkan logika untuk menampilkan kemajuan quest
    }
    
    function setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        const tabContents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');

                // Hapus active dari semua tab dan konten
                tabs.forEach(t => t.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));

                // Tambahkan active ke tab dan konten yang dipilih
                tab.classList.add('active');
                document.getElementById(`${targetTab}-tab`).classList.add('active');
            });
        });
    }
    
    // --- QUEST & DATA MANAGEMENT ---
    function checkQuests() {
        // Quest 1: Tap 100 kali
        if (!quests.tap100.completed) {
            if (gameState.totalTaps >= quests.tap100.target) {
                gameState.troBalance += quests.tap100.reward;
                quests.tap100.completed = true;
                showNotification(`Quest Complete! +${quests.tap100.reward} TRO`);
                document.getElementById('quest-tap100').style.opacity = '0.5';
            }
        }

        // Quest 2: Beli 3 upgrade
        if (!quests.upgrade3.completed) {
            if (gameState.totalUpgrades >= quests.upgrade3.target) {
                gameState.troBalance += quests.upgrade3.reward;
                quests.upgrade3.completed = true;
                showNotification(`Quest Complete! +${quests.upgrade3.reward} TRO`);
                document.getElementById('quest-upgrade3').style.opacity = '0.5';
            }
        }
        
        // Quest 3: Stake 50 TRO
        if (!quests.stake50.completed) {
            if (gameState.stakedAmount >= quests.stake50.target) {
                gameState.troBalance += quests.stake50.reward;
                quests.stake50.completed = true;
                showNotification(`Quest Complete! +${quests.stake50.reward} TRO`);
                document.getElementById('quest-stake50').style.opacity = '0.5';
            }
        }
    }


    // --- FIREBASE DATA MANAGEMENT ---

    function getUserId() {
        // Menggunakan ID pengguna Telegram sebagai kunci database
        // Hanya berfungsi jika diakses via Telegram WebApp
        return tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : null;
    }

    async function saveGame() {
        const userId = getUserId();
        if (userId) {
            try {
                // Hapus lastUpdate sementara agar tidak terjadi masalah timestamp (opsional)
                const dataToSave = {...gameState, lastUpdate: Date.now()};
                
                await db.ref('users/' + userId).set({
                    gameState: dataToSave,
                    quests: quests
                });
                // console.log("Game saved to Firebase");
            } catch (error) {
                console.error("Failed to save game to Firebase:", error);
            }
        }
    }

    async function loadGame() {
        const userId = getUserId();
        if (userId) {
            try {
                const snapshot = await db.ref('users/' + userId).once('value');
                const data = snapshot.val();
                if (data) {
                    // Update gameState dan quests
                    gameState = data.gameState;
                    quests = data.quests;
                    
                    // Hitung energi yang terisi saat load
                    const now = Date.now();
                    const timeElapsed = (now - gameState.lastUpdate) / 1000;
                    const energyGained = timeElapsed * gameState.rechargeRate;
                    gameState.energy = Math.min(gameState.energyMax, gameState.energy + energyGained);
                    gameState.lastUpdate = now;

                    console.log("Game loaded from Firebase");
                    showNotification("Data game dimuat dari Cloud!");
                }
            } catch (error) {
                console.error("Failed to load game from Firebase:", error);
            }
        } else {
             // Jika tidak ada ID pengguna (misalnya, di luar Telegram)
             console.warn("User ID not found. Using default or local state.");
        }
    }
    
    
    // --- TONKEEPER (TON CONNECT) LOGIC ---
    
    let connector;

    function initTonConnect() {
        // URL manifest Anda yang sebenarnya (diperlukan Tonkeeper untuk terhubung)
        const MANIFEST_URL = 'https://tarominer.com/tonconnect-manifest.json'; 

        // Inisialisasi TonConnect
        connector = new TonConnect.TonConnect({
            manifestUrl: MANIFEST_URL,
            storage: new TonConnect.TonConnect.BrowserStorage()
        });

        // Event listener untuk perubahan status koneksi
        connector.onStatusChange(wallet => {
            if (wallet) {
                // Wallet terhubung
                const address = TonConnect.TonConnect.toUserFriendlyAddress(wallet.account.address);
                walletAddressDisplay.textContent = `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
                connectBtn.textContent = 'Connected';
                connectBtn.disabled = true;
                showNotification(`Wallet Connected! ✅`);
                // Di sini Anda bisa menyimpan alamat wallet jika diperlukan
            } else {
                // Wallet terputus
                walletAddressDisplay.textContent = 'Not connected';
                connectBtn.textContent = 'Connect';
                connectBtn.disabled = false;
            }
        });
        
        // Cek koneksi yang sudah ada saat inisialisasi
        connector.restoreConnection();
    }

    async function connectWallet() {
        if (!connector) {
            showNotification("TonConnect is not initialized.");
            return;
        }

        try {
            // Dapatkan daftar wallet yang tersedia untuk koneksi (Tonkeeper, TonSpace, dll.)
            const wallets = await connector.getWallets();
            
            // Coba koneksi ke wallet pertama (atau bisa tampilkan daftar pilihan)
            if (wallets && wallets.length > 0) {
                const tonkeeperWallet = wallets.find(w => w.appName.toLowerCase().includes('tonkeeper'));

                if (tonkeeperWallet) {
                    // Gunakan metode 'tonkeeper' untuk koneksi langsung via WebApp
                    const connectionRequest = {
                        universalLink: tonkeeperWallet.universalLink,
                        bridgeUrl: tonkeeperWallet.bridgeUrl,
                    };
                    
                    // Memulai koneksi
                    connector.connect(connectionRequest);
                } else {
                     showNotification("Tonkeeper wallet not found in list. Using universal connect.");
                     // Alternatif: Gunakan universal link untuk QR atau deep link
                     const universalLink = connector.connect(wallets[0]).universalLink;
                     showNotification(`Connect using this link: ${universalLink}`);
                }
            } else {
                 showNotification("No Ton wallets found/installed.");
            }

        } catch (error) {
            console.error("TonConnect Error:", error);
            showNotification("Failed to connect wallet.");
        }
    }
    
    // --- INITIALIZATION ---
    async function initGame() { 
        console.log("🌱 TARO Tap Miner Initializing...");
        
        initTonConnect(); // Inisialisasi TonConnect

        // Tunggu loadGame selesai dari Firebase
        await loadGame();
        
        // Setup Event Listeners
        tapArea.addEventListener('click', handleTap);
        document.querySelectorAll('.upgrade-card').forEach(card => {
            card.addEventListener('click', () => {
                buyUpgrade(card.getAttribute('data-upgrade'));
            });
        });
        document.getElementById('stake-btn').addEventListener('click', stakeTokens);
        document.getElementById('connect-btn').addEventListener('click', connectWallet); // Listener Tonkeeper
        
        setupTabs();
        updateUI();
        checkQuests();

        // Game Loop & Auto-save
        setInterval(rechargeEnergy, 1000); // 1 detik
        setInterval(saveGame, 10000); // Auto-save setiap 10 detik
    }
    
    initGame();
});
