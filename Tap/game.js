// TARO COIN (TRO) Tap Miner Game
// Game State for TARO COIN
const gameState = {
    energy: 100,
    energyMax: 100,
    troBalance: 0,
    growPower: 0.1, // TRO per tap
    rechargeRate: 1, // energy per minute
    upgrades: {
        capacity: 1,
        power: 1,
        speed: 1,
        luck: 1
    },
    stakedAmount: 0,
    lastUpdate: Date.now(),
    taps: 0,
    plantStage: 1 // 1: seed, 2: sprout, 3: plant, 4: mature
};

// Quest System for TARO COIN
const quests = {
    tap100: { target: 100, progress: 0, reward: 10, completed: false },
    upgrade3: { target: 3, progress: 0, reward: 25, completed: false },
    stake50: { target: 50, progress: 0, reward: 15, completed: false }
};

// Plant evolution stages
const plantStages = ['🌱', '🌿', '🪴', '🌳'];

// DOM Elements
const connectBtn = document.getElementById('connect-btn');
const gameSection = document.getElementById('game-section');
const tapArea = document.getElementById('tap-area');
const taroPlant = document.getElementById('taro-plant');
const energyValue = document.getElementById('energy-value');
const balanceValue = document.getElementById('balance-value');
const energyBar = document.getElementById('energy-bar');
const notification = document.getElementById('notification');
const walletAddress = document.getElementById('wallet-address');

// Initialize TARO COIN Game
function initGame() {
    console.log("🌱 Initializing TARO Tap Miner...");
    
    // Load saved game state
    const saved = localStorage.getItem('taroTapMiner');
    if (saved) {
        try {
            const savedState = JSON.parse(saved);
            Object.assign(gameState, savedState);
            console.log("💾 Game state loaded for TARO COIN");
        } catch (e) {
            console.error("❌ Error loading saved game:", e);
        }
    }
    
    // Calculate offline progress
    calculateOfflineProgress();
    
    // Initialize game systems
    updatePlantAppearance();
    updateEnergy();
    renderGame();
    startGameLoop();
    startAutoSave();
    setupTabs();
    
    // Simulate TON wallet connection
    simulateWalletConnection();
    
    console.log("✅ TARO Tap Miner initialized successfully!");
}

// Simulate TON wallet connection for TARO COIN
function simulateWalletConnection() {
    walletAddress.textContent = "EQD...taro_wallet";
    connectBtn.textContent = "Connected";
    connectBtn.style.background = "linear-gradient(45deg, #689f38, #558b2f)";
    connectBtn.disabled = true;
}

// Tap Handler for TARO COIN
function handleTap() {
    if (gameState.energy <= 0) {
        showNotification("No energy! Wait for recharge ⚡", "#ff5555");
        return;
    }
    
    gameState.energy--;
    gameState.taps++;
    
    // Calculate TRO earnings (with lucky harvest chance)
    let earned = gameState.growPower;
    const critChance = 0.05 * gameState.upgrades.luck;
    let isCrit = false;
    
    if (Math.random() < critChance) {
        earned *= 2;
        isCrit = true;
    }
    
    gameState.troBalance += earned;
    
    // Update plant evolution
    updatePlantEvolution();
    
    // Visual and audio feedback
    animatePlant();
    createFloatingText(earned.toFixed(2) + " TRO", isCrit);
    playTapSound();
    
    // Update game state
    updateUI();
    checkQuests();
    saveGame();
}

// Update plant evolution based on taps
function updatePlantEvolution() {
    const oldStage = gameState.plantStage;
    
    if (gameState.taps >= 500) gameState.plantStage = 4;
    else if (gameState.taps >= 200) gameState.plantStage = 3;
    else if (gameState.taps >= 50) gameState.plantStage = 2;
    else gameState.plantStage = 1;
    
    if (oldStage !== gameState.plantStage) {
        showNotification(`Your Taro plant evolved! ${plantStages[gameState.plantStage-1]}`, "#8bc34a");
        updatePlantAppearance();
    }
}

// Update plant appearance
function updatePlantAppearance() {
    taroPlant.textContent = plantStages[gameState.plantStage - 1];
    
    // Add special effects for mature plant
    if (gameState.plantStage === 4) {
        taroPlant.style.fontSize = "90px";
        taroPlant.style.filter = "drop-shadow(0 0 15px gold)";
    } else {
        taroPlant.style.fontSize = "80px";
        taroPlant.style.filter = "drop-shadow(0 0 10px rgba(139, 195, 74, 0.5))";
    }
}

// Upgrade System for TARO COIN
function buyUpgrade(type) {
    const costs = {
        capacity: 50 * Math.pow(1.5, gameState.upgrades.capacity - 1),
        power: 100 * Math.pow(1.8, gameState.upgrades.power - 1),
        speed: 150 * Math.pow(2.0, gameState.upgrades.speed - 1),
        luck: 200 * Math.pow(2.2, gameState.upgrades.luck - 1)
    };
    
    const cost = Math.floor(costs[type]);
    
    if (gameState.troBalance >= cost) {
        gameState.troBalance -= cost;
        gameState.upgrades[type]++;
        
        // Apply upgrade effects
        switch(type) {
            case 'capacity':
                gameState.energyMax = 100 + (20 * (gameState.upgrades.capacity - 1));
                break;
            case 'power':
                gameState.growPower = 0.1 + (0.05 * (gameState.upgrades.power - 1));
                break;
            case 'speed':
                gameState.rechargeRate = 1 + (0.2 * (gameState.upgrades.speed - 1));
                break;
        }
        
        updateUI();
        checkQuests();
        saveGame();
        showNotification("Upgrade successful! 🌱", "#8bc34a");
    } else {
        showNotification("Not enough TRO! 💸", "#ff5555");
    }
}

// Energy System
function updateEnergy() {
    const now = Date.now();
    const secondsPassed = (now - gameState.lastUpdate) / 1000;
    const energyToAdd = secondsPassed * (gameState.rechargeRate / 60);
    
    if (energyToAdd > 0) {
        gameState.energy = Math.min(
            gameState.energyMax,
            gameState.energy + energyToAdd
        );
        gameState.lastUpdate = now;
    }
}

// Game Loop
function startGameLoop() {
    setInterval(() => {
        updateEnergy();
        updateUI();
    }, 1000);
}

// Auto-save system
function startAutoSave() {
    setInterval(() => {
        saveGame();
    }, 10000);
}

// Offline progress calculation
function calculateOfflineProgress() {
    const savedTime = localStorage.getItem('taroTapMinerLastSave');
    if (savedTime) {
        const offlineTime = Date.now() - parseInt(savedTime);
        const offlineMinutes = offlineTime / (1000 * 60);
        
        if (offlineMinutes > 1) {
            const offlineEnergy = offlineMinutes * gameState.rechargeRate;
            const maxEnergyGain = gameState.energyMax * 2;
            
            const energyGain = Math.min(offlineEnergy, maxEnergyGain);
            gameState.energy = Math.min(gameState.energyMax, gameState.energy + energyGain);
            
            if (offlineMinutes > 5) {
                showNotification(`Welcome back! Recharged ${Math.floor(energyGain)} energy while you were away ⚡`, "#8bc34a");
            }
        }
    }
}

// TRO Staking Function
function stakeTokens() {
    const amountInput = document.getElementById('stake-amount');
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
        showNotification("Please enter a valid TRO amount!", "#ff5555");
        return;
    }
    
    if (amount > gameState.troBalance) {
        showNotification("Insufficient TRO balance!", "#ff5555");
        return;
    }
    
    gameState.troBalance -= amount;
    gameState.stakedAmount += amount;
    amountInput.value = '';
    
    updateUI();
    checkQuests();
    saveGame();
    showNotification(`Staked ${amount} TRO successfully! 🌾`, "#8bc34a");
}

// Quest System
function checkQuests() {
    // Update quest progress
    quests.tap100.progress = gameState.taps;
    quests.upgrade3.progress = Object.values(gameState.upgrades).reduce((a, b) => a + b) - 4;
    quests.stake50.progress = gameState.stakedAmount;
    
    // Check completion and award TRO
    Object.keys(quests).forEach(questKey => {
        const quest = quests[questKey];
        if (!quest.completed && quest.progress >= quest.target) {
            quest.completed = true;
            gameState.troBalance += quest.reward;
            showNotification(`Quest completed! +${quest.reward} TRO 🌟`, "#ffd54f");
            updateQuestUI();
        }
    });
}

function updateQuestUI() {
    // Update quest progress bars
    const questBars = {
        tap100: document.getElementById('quest-tap-bar'),
        upgrade3: document.getElementById('quest-upgrade-bar'),
        stake50: document.getElementById('quest-stake-bar')
    };
    
    Object.keys(questBars).forEach(questKey => {
        const quest = quests[questKey];
        const progressPercent = Math.min(100, (quest.progress / quest.target) * 100);
        if (questBars[questKey]) {
            questBars[questKey].style.width = `${progressPercent}%`;
        }
    });
}

// UI Updates for TARO COIN
function updateUI() {
    // Update energy and TRO balance
    energyValue.textContent = `${Math.floor(gameState.energy)}/${gameState.energyMax}`;
    balanceValue.textContent = gameState.troBalance.toFixed(2);
    
    // Update energy bar
    const energyPercent = (gameState.energy / gameState.energyMax) * 100;
    energyBar.style.width = `${energyPercent}%`;
    
    // Update upgrade costs and levels
    document.getElementById('capacity-cost').textContent = 
        `${Math.floor(50 * Math.pow(1.5, gameState.upgrades.capacity - 1))} TRO`;
    document.getElementById('power-cost').textContent = 
        `${Math.floor(100 * Math.pow(1.8, gameState.upgrades.power - 1))} TRO`;
    document.getElementById('speed-cost').textContent = 
        `${Math.floor(150 * Math.pow(2.0, gameState.upgrades.speed - 1))} TRO`;
    document.getElementById('luck-cost').textContent = 
        `${Math.floor(200 * Math.pow(2.2, gameState.upgrades.luck - 1))} TRO`;
    
    document.getElementById('capacity-level').textContent = gameState.upgrades.capacity;
    document.getElementById('power-level').textContent = gameState.upgrades.power;
    document.getElementById('speed-level').textContent = gameState.upgrades.speed;
    document.getElementById('luck-level').textContent = gameState.upgrades.luck;
    
    // Update staked amount
    document.getElementById('staked-amount').textContent = gameState.stakedAmount.toFixed(2);
    
    // Update user rank
    document.getElementById('user-rank').textContent = `${Math.floor(gameState.troBalance)} TRO`;
    
    // Update quest UI
    updateQuestUI();
}

function renderGame() {
    updateUI();
}

// Save/Load Game for TARO COIN
function saveGame() {
    localStorage.setItem('taroTapMiner', JSON.stringify(gameState));
    localStorage.setItem('taroTapMinerLastSave', Date.now().toString());
}

function resetGame() {
    if (confirm("Reset semua progress TARO game? Semua data akan hilang!")) {
        localStorage.removeItem('taroTapMiner');
        localStorage.removeItem('taroTapMinerLastSave');
        location.reload();
    }
}

// Visual Effects for TARO COIN
function animatePlant() {
    taroPlant.classList.add('growing');
    setTimeout(() => {
        taroPlant.classList.remove('growing');
    }, 300);
}

function createFloatingText(text, isCrit) {
    const floatingText = document.createElement('div');
    floatingText.textContent = (isCrit ? "🍀 " : "") + text;
    floatingText.className = 'floating-text';
    floatingText.style.color = isCrit ? '#ffd54f' : '#c5e1a5';
    floatingText.style.left = `calc(50% + ${Math.random() * 60 - 30}px)`;
    
    tapArea.appendChild(floatingText);
    setTimeout(() => floatingText.remove(), 1000);
}

function showNotification(message, color) {
    notification.textContent = message;
    notification.style.display = 'block';
    notification.style.background = color ? 
        `linear-gradient(45deg, ${color}, ${color}dd)` : 
        'rgba(0, 0, 0, 0.8)';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Sound Effects
function playTapSound() {
    // Simple tap sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 600 + (Math.random() * 200);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Audio not supported
    }
}

// Tab System
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log("🌱 TARO COIN Game loading...");
    
    tapArea.addEventListener('click', handleTap);

    document.querySelectorAll('.upgrade-card').forEach(card => {
        card.addEventListener('click', () => {
            const upgradeType = card.getAttribute('data-upgrade');
            buyUpgrade(upgradeType);
        });
    });

    document.getElementById('stake-btn').addEventListener('click', stakeTokens);
    connectBtn.addEventListener('click', simulateWalletConnection);

    // Initialize the game
    initGame();
});

// Fallback initialization
window.addEventListener('load', () => {
    if (typeof gameState === 'undefined') {
        console.log("🔄 Re-initializing TARO game...");
        initGame();
    }
});
