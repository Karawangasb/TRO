// ================================= //
// --- TARO TAP MINER - GAME.JS --- //
// ================================= //

document.addEventListener('DOMContentLoaded', function() {
    // --- INISIALISASI GAME ---
    // Mencegah gerakan scroll atau zoom yang tidak diinginkan di mobile
    document.body.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });
    
    // Inisialisasi Telegram Web App
    const tg = window.Telegram.WebApp;
    tg.expand(); // Memastikan aplikasi terbuka penuh

    // --- GAME STATE ---
    // Objek utama untuk menyimpan semua data game.
    // Akan dimuat dari localStorage jika ada.
    let gameState = {
        troBalance: 0,
        energy: 100,
        energyMax: 100,
        growPower: 1,      // Poin per tap
        rechargeRate: 1,   // Energi per detik
        upgrades: {
            capacity: { level: 1, cost: 50 },
            power:    { level: 1, cost: 50 },
            speed:    { level: 1, cost: 75 }
        },
        stakedAmount: 0,
        lastUpdate: Date.now(),
        totalTaps: 0,
        totalUpgrades: 0
    };

    // --- QUEST SYSTEM ---
    let quests = {
        tap100:    { target: 100, reward: 100, completed: false },
        upgrade3:  { target: 3, reward: 250, completed: false },
        stake50:   { target: 50, reward: 150, completed: false }
    };

    // --- DOM ELEMENTS ---
    // Mengambil semua elemen dari HTML untuk dimanipulasi
    const balanceValue = document.getElementById('balance-value');
    const energyValue = document.getElementById('energy-value');
    const growPowerValue = document.getElementById('grow-power-value');
    const energyBar = document.getElementById('energy-bar');
    const tapArea = document.getElementById('tap-area');
    const taroPlant = document.getElementById('taro-plant');
    const notification = document.getElementById('notification');
    const userRank = document.getElementById('user-rank');

    // Upgrade Levels
    const capacityLevel = document.getElementById('capacity-level');
    const powerLevel = document.getElementById('power-level');
    const speedLevel = document.getElementById('speed-level');

    // Staking
    const stakeBtn = document.getElementById('stake-btn');
    const stakeInput = document.getElementById('stake-input');
    const stakedAmountDisplay = document.getElementById('staked-amount');

    // --- CORE GAME LOGIC ---

    /**
     * Fungsi utama yang dijalankan setiap kali area taro di-tap.
     * @param {MouseEvent} event - Event dari klik mouse atau sentuhan
     */
    function handleTap(event) {
        if (gameState.energy >= gameState.growPower) {
            // Kurangi energi, tambahkan balance
            gameState.energy -= gameState.growPower;
            gameState.troBalance += gameState.growPower;
            gameState.totalTaps++;

            // Beri getaran (haptic feedback) jika didukung
            if (tg && tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('light');
            }
            
            // Tampilkan angka yang melayang di lokasi tap
            showFloatingNumber(event.clientX, event.clientY);

            // Animasi pada tanaman
            taroPlant.style.transform = 'scale(0.9)';
            setTimeout(() => { taroPlant.style.transform = 'scale(1)'; }, 100);

            // Cek quest setelah tap
            checkQuests();
            updateUI();
        } else {
            showNotification("Not enough energy! ⚡️");
        }
    }

    /**
     * Menampilkan angka poin yang didapat di lokasi tap.
     * @param {number} x - Posisi horizontal
     * @param {number} y - Posisi vertikal
     */
    function showFloatingNumber(x, y) {
        const floatingNumber = document.createElement('div');
        floatingNumber.textContent = `+${gameState.growPower}`;
        floatingNumber.className = 'floating-number';
        floatingNumber.style.left = `${x}px`;
        floatingNumber.style.top = `${y}px`;
        document.body.appendChild(floatingNumber);

        // Hapus elemen setelah animasi selesai
        setTimeout(() => {
            floatingNumber.remove();
        }, 1000);
    }
    // Tambahkan CSS untuk floating-number
    const style = document.createElement('style');
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


    /**
     * Mengisi ulang energi setiap detik.
     */
    function rechargeEnergy() {
        if (gameState.energy < gameState.energyMax) {
            gameState.energy += gameState.rechargeRate;
            if (gameState.energy > gameState.energyMax) {
                gameState.energy = gameState.energyMax;
            }
            updateUI();
        }
    }
    
    /**
     * Memproses pembelian upgrade.
     * @param {string} type - Tipe upgrade ('capacity', 'power', 'speed')
     */
    function buyUpgrade(type) {
        const upgrade = gameState.upgrades[type];
        if (gameState.troBalance >= upgrade.cost) {
            gameState.troBalance -= upgrade.cost;
            upgrade.level++;
            gameState.totalUpgrades++;
            
            // Terapkan efek upgrade
            switch(type) {
                case 'capacity':
                    gameState.energyMax = 1000 + (upgrade.level - 1) * 500;
                    break;
                case 'power':
                    gameState.growPower = 1 + (upgrade.level - 1);
                    break;
                case 'speed':
                    gameState.rechargeRate = 2 + (upgrade.level - 1);
                    break;
            }
            
            // Naikkan biaya untuk level selanjutnya
            upgrade.cost = Math.floor(upgrade.cost * 2.5);

            showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} Upgraded!`);
            checkQuests();
            updateUI();
        } else {
            showNotification("Not enough TRO Coin!");
        }
    }

    /**
     * Memproses staking token.
     */
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
        } else {
            showNotification("Not enough TRO to stake!");
        }
    }


    // --- UI FUNCTIONS ---

    /**
     * Memperbarui semua elemen UI dengan data dari gameState.
     */
    function updateUI() {
        balanceValue.textContent = Math.floor(gameState.troBalance).toLocaleString();
        energyValue.textContent = `${Math.floor(gameState.energy)}/${gameState.energyMax}`;
        growPowerValue.textContent = gameState.growPower;
        userRank.textContent = `${Math.floor(gameState.troBalance).toLocaleString()} TRO`;

        // Update energy bar
        const energyPercentage = (gameState.energy / gameState.energyMax) * 100;
        energyBar.style.width = `${energyPercentage}%`;

        // Update upgrade levels
        capacityLevel.textContent = gameState.upgrades.capacity.level;
        powerLevel.textContent = gameState.upgrades.power.level;
        speedLevel.textContent = gameState.upgrades.speed.level;

        // Update Staking UI
        stakedAmountDisplay.textContent = `${gameState.stakedAmount.toLocaleString()} TRO`;
    }

    /**
     * Menampilkan notifikasi singkat di layar.
     * @param {string} message - Pesan yang akan ditampilkan
     */
    function showNotification(message) {
        notification.textContent = message;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    }

    /**
     * Mengatur logika perpindahan antar tab.
     */
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

    /**
     * Memeriksa dan memperbarui progress quest.
     */
    function checkQuests() {
        // Quest 1: Tap 100 times
        if (!quests.tap100.completed) {
            const progress = (gameState.totalTaps / quests.tap100.target) * 100;
            document.getElementById('quest-tap100-progress').style.width = `${Math.min(progress, 100)}%`;
            if (gameState.totalTaps >= quests.tap100.target) {
                gameState.troBalance += quests.tap100.reward;
                quests.tap100.completed = true;
                showNotification(`Quest Complete! +${quests.tap100.reward} TRO`);
                document.getElementById('quest-tap100').style.opacity = '0.5';
            }
        }
        
        // Quest 2: Upgrade 3 times
        if (!quests.upgrade3.completed) {
            const progress = (gameState.totalUpgrades / quests.upgrade3.target) * 100;
             document.getElementById('quest-upgrade3-progress').style.width = `${Math.min(progress, 100)}%`;
            if(gameState.totalUpgrades >= quests.upgrade3.target) {
                gameState.troBalance += quests.upgrade3.reward;
                quests.upgrade3.completed = true;
                showNotification(`Quest Complete! +${quests.upgrade3.reward} TRO`);
                document.getElementById('quest-upgrade3').style.opacity = '0.5';
            }
        }

        // Quest 3: Stake 50 TRO
        if(!quests.stake50.completed) {
            const progress = (gameState.stakedAmount / quests.stake50.target) * 100;
            document.getElementById('quest-stake50-progress').style.width = `${Math.min(progress, 100)}%`;
            if(gameState.stakedAmount >= quests.stake50.target) {
                gameState.troBalance += quests.stake50.reward;
                quests.stake50.completed = true;
                showNotification(`Quest Complete! +${quests.stake50.reward} TRO`);
                document.getElementById('quest-stake50').style.opacity = '0.5';
            }
        }
    }

    /**
     * Menyimpan state game ke localStorage.
     */
    function saveGame() {
        localStorage.setItem('taroGameState', JSON.stringify(gameState));
        localStorage.setItem('taroQuests', JSON.stringify(quests));
    }

    /**
     * Memuat state game dari localStorage.
     */
    function loadGame() {
        const savedState = localStorage.getItem('taroGameState');
        const savedQuests = localStorage.getItem('taroQuests');
        if (savedState) {
            gameState = JSON.parse(savedState);
        }
        if (savedQuests) {
            quests = JSON.parse(savedQuests);
        }
    }

    // --- INITIALIZATION ---
    
    /**
     * Fungsi utama untuk memulai game.
     */
    function initGame() {
        console.log("🌱 TARO Tap Miner Initializing...");
        loadGame();
        
        // Event Listeners
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

        // Mulai interval recharge energi (setiap detik)
        setInterval(rechargeEnergy, 1000);
        
        // Simpan game secara berkala (setiap 10 detik)
        setInterval(saveGame, 10000);
    }
    
    // Jalankan game
    initGame();
});
