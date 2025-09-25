// TRO Moon Mission Game
// Game State for TRO Moon Mission
const gameState = {
    energy: 100,
    energyMax: 100,
    troBalance: 0,
    thrustPower: 0.1, // TRO per tap
    rechargeRate: 1, // energy per minute
    distance: 0, // km to moon
    totalDistance: 384400, // Earth to Moon distance in km
    troPrice: 0.001,
    marketCap: 0,
    upgrades: {
        capacity: 1,
        power: 1,
        speed: 1,
        luck: 1
    },
    stakedAmount: 0,
    lastUpdate: Date.now(),
    taps: 0,
    rocketLevel: 1
};

// Quest System for Moon Mission
const quests = {
    tap100: { target: 100, progress: 0, reward: 10, completed: false },
    upgrade3: { target: 3, progress: 0, reward: 25, completed: false },
    distance50: { target: 50, progress: 0, reward: 15, completed: false }
};

// Rocket evolution levels
const rocketLevels = ['🚀', '🚀✨', '🚀🌟', '🚀💫'];

// DOM Elements
const connectBtn = document.getElementById('connect-btn');
const gameSection = document.getElementById('game-section');
const tapArea = document.getElementById('tap-area');
const rocket = document.getElementById('rocket');
const energyValue = document.getElementById('energy-value');
const balanceValue = document.getElementById('balance-value');
const distanceValue = document.getElementById('distance-value');
const priceValue = document.getElementById('price-value');
const distanceBar = document.getElementById('distance-bar');
const rocketPosition = document.getElementById('rocket-position');
const notification = document.getElementById('notification');
const walletAddress = document.getElementById('wallet-address');

// Initialize Moon Mission Game
function initGame() {
    console.log("🚀 Initializing TRO Moon Mission...");
    
    // Load saved game state
    const saved = localStorage.getItem('troMoonMission');
    if (saved) {
        try {
            const savedState = JSON.parse(saved);
            Object.assign(gameState, savedState);
            console.log("💾 Game state loaded for TRO Moon Mission");
        } catch (e) {
            console.error("❌ Error loading saved game:", e);
        }
    }
    
    // Calculate offline progress
    calculateOfflineProgress();
    
    // Initialize game systems
    updateRocketAppearance();
    updateEnergy();
    updateMarketData();
    renderGame();
    startGameLoop();
    startAutoSave();
    setupTabs();
    
    // Simulate TON wallet connection
    simulateWalletConnection();
    
    console.log("✅ TRO Moon Mission initialized successfully!");
}

// Simulate TON wallet connection
function simulateWalletConnection() {
    walletAddress.textContent = "EQD...moon_wallet";
    connectBtn.textContent = "Connected";
    connectBtn.style.background = "linear-gradient(45deg, #00aaff, #0077cc)";
    connectBtn.disabled = true;
}

// Tap Handler for Rocket Launch
function handleTap() {
    if (gameState.energy <= 0) {
        showNotification("No fuel! Wait for refill ⛽", "#ff5555");
        return;
    }
    
    gameState.energy--;
    gameState.taps++;
    
    // Calculate TRO earnings (with boost chance)
    let earned = gameState.thrustPower;
    const boostChance = 0.05 * gameState.upgrades.luck;
    let isBoost = false;
    
    if (Math.random() < boostChance) {
        earned *= 2;
        isBoost = true;
    }
    
    gameState.troBalance += earned;
    
    // Increase distance
    const distanceGain = earned * 10; // 1 TRO = 10km
    gameState.distance = Math.min(gameState.totalDistance, gameState.distance + distanceGain);
    
    // Update rocket evolution
    updateRocketEvolution();
    
    // Update market data based on progress
    updateMarketData();
    
    // Visual and audio feedback
    animateRocket();
    createFloatingText("+" + earned.toFixed(2) + " TRO", isBoost);
    playLaunchSound();
    
    // Update game state
    updateUI();
    checkQuests();
    saveGame();
}

// Update rocket evolution based on distance
function updateRocketEvolution() {
    const oldLevel = gameState.rocketLevel;
    
    if (gameState.distance >= gameState.totalDistance * 0.8) gameState.rocketLevel = 4;
    else if (gameState.distance >= gameState.totalDistance * 0.5) gameState.rocketLevel = 3;
    else if (gameState.distance >= gameState.totalDistance * 0.2) gameState.rocketLevel = 2;
    else gameState.rocketLevel = 1;
    
    if (oldLevel !== gameState.rocketLevel) {
        showNotification(`Rocket upgraded! ${rocketLevels[gameState.rocketLevel-1]}`, "#4a4aff");
        updateRocketAppearance();
    }
}

// Update rocket appearance
function updateRocketAppearance() {
    rocket.textContent = rocketLevels[gameState.rocketLevel - 1];
    
    // Add special effects for advanced rocket
    if (gameState.rocketLevel === 4) {
        rocket.style.fontSize = "90px";
        rocket.style.filter = "drop-shadow(0 0 20px gold)";
    } else {
        rocket.style.fontSize = "80px";
        rocket.style.filter = "drop-shadow(0 0 10px rgba(74, 74, 255, 0.5))";
    }
}

// Update market data based on game progress
function updateMarketData() {
    // Price increases with distance progress
    const progress = gameState.distance / gameState.totalDistance;
    gameState.troPrice = 0.001 * (1 + progress * 99); // $0.001 to $0.10
    
    // Market cap based on TRO balance and price
    gameState.marketCap = gameState.troBalance * gameState.troPrice;
    
    // Update UI
    document.getElementById('price-value').textContent = '$' + gameState.troPrice.toFixed(3);
    document.getElementById('market-cap').textContent = '$' + Math.floor(gameState.marketCap).toLocaleString();
    document.getElementById('volume').textContent = '$' + Math.floor(gameState.taps * gameState.troPrice).toLocaleString();
    
    const priceChange = (progress * 100).toFixed(1);
    document.getElementById('price-change').textContent = '+' + priceChange + '%';
    document.getElementById('price-change').style.color = '#00ff88';
    
    // Update price target
    const nextTarget = 0.001 * Math.pow(2, Math.floor(progress * 5));
    document.getElementById('price-target').textContent = '$' + nextTarget.toFixed(3);
}

// Upgrade System for Moon Mission
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
                gameState.thrustPower = 0.1 + (0.05 * (gameState.upgrades.power - 1));
                break;
            case 'speed':
                gameState.rechargeRate = 1 + (0.2 * (gameState.upgrades.speed - 1));
                break;
        }
        
        updateUI();
        checkQuests();
        saveGame();
        showNotification("Upgrade successful! 🚀", "#4a4aff");
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
    const savedTime = localStorage.getItem('troMoonMissionLastSave');
    if (savedTime) {
        const offlineTime = Date.now() - parseInt(savedTime);
        const offlineMinutes = offlineTime / (1000 * 60);
        
        if (offlineMinutes > 1) {
            const offlineEnergy = offlineMinutes * gameState.rechargeRate;
            const maxEnergyGain = gameState.energyMax * 2;
            const energyGain = Math.min(offlineEnergy, maxEnergyGain);
            gameState.energy = Math.min(gameState.energyMax, gameState.energy + energyGain);
            
            if (offlineMinutes > 5) {
                showNotification(`Welcome back! Refueled ${Math.floor(energyGain)} units while you were away ⛽`, "#4a4aff");
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
    showNotification(`Launched ${amount} TRO to orbit! 🛰️`, "#4a4aff");
}

// Quest System
function checkQuests() {
    // Update quest progress
    quests.tap100.progress = gameState.taps;
    quests.upgrade3.progress = Object.values(gameState.upgrades).reduce((a, b) => a + b) - 4;
    quests.distance50.progress = gameState.distance;
    
    // Check completion and award TRO
    Object.keys(quests).forEach(questKey => {
        const quest = quests[questKey];
        if (!quest.completed && quest.progress >= quest.target) {
            quest.completed = true;
            gameState.troBalance += quest.reward;
            showNotification(`Mission completed! +${quest.reward} TRO 🎯`, "#00ffff");
            updateQuestUI();
        }
    });
}

function updateQuestUI() {
    // Update quest progress bars
    const questBars = {
        tap100: document.getElementById('quest-tap-bar'),
        upgrade3: document.getElementById('quest-upgrade-bar'),
        distance50: document.getElementById('quest-distance-bar')
    };
    
    Object.keys(questBars).forEach(questKey => {
        const quest = quests[questKey];
        const progressPercent = Math.min(100, (quest.progress / quest.target) * 100);
        if (questBars[questKey]) {
            questBars[questKey].style.width = `${progressPercent}%`;
        }
    });
}

// UI Updates for Moon Mission
function updateUI() {
    // Update energy and TRO balance
    energyValue.textContent = `${Math.floor(gameState.energy)}/${gameState.energyMax}`;
    balanceValue.textContent = gameState.troBalance.toFixed(2);
    
    // Update distance and progress
    const distanceToMoon = Math.max(0, gameState.totalDistance - gameState.distance);
    distanceValue.textContent = `${Math.floor(distanceToMoon).toLocaleString()}km`;
    
    // Update progress bar and rocket position
    const progressPercent = (gameState.distance / gameState.totalDistance) * 100;
    distanceBar.style.width = `${progressPercent}%`;
    rocketPosition.style.left = `${progressPercent}%`;
    
    // Update energy bar
    const energyPercent = (gameState.energy / gameState.energyMax) * 100;
    document.getElementById('energy-bar').style.width = `${energyPercent}%`;
    
    // Update upgrade costs and levels
    document.getElementById('capacity-cost').textContent = 
        Math.floor(50 * Math.pow(1.5, gameState.upgrades.capacity - 1));
    document.getElementById('power-cost').textContent = 
        Math.floor(100 * Math.pow(1.8, gameState.upgrades.power - 1));
    document.getElementById('speed-cost').textContent = 
        Math.floor(150 * Math.pow(2.0, gameState.upgrades.speed - 1));
    document.getElementById('luck-cost').textContent = 
        Math.floor(200 * Math.pow(2.2, gameState.upgrades.luck - 1));
    
    document.getElementById('capacity-level').textContent = gameState.upgrades.capacity;
    document.getElementById('power-level').textContent = gameState.upgrades.power;
    document.getElementById('speed-level').textContent = gameState.upgrades.speed;
    document.getElementById('luck-level').textContent = gameState.upgrades.luck;
    
    // Update staked amount
    document.getElementById('staked-amount').textContent = gameState.stakedAmount.toFixed(2);
    
    // Check if reached the moon!
    if (gameState.distance >= gameState.totalDistance && !gameState.moonReached) {
        gameState.moonReached = true;
        showNotification("🎉 CONGRATULATIONS! YOU REACHED THE MOON! 🎉", "#ffd700");
        // Special moon reward
        gameState.troBalance += 1000;
        setTimeout(() => {
            showNotification("+1000 TRO Moon Landing Bonus! 🌕", "#ffd700");
        }, 2000);
    }
}

function renderGame() {
    updateUI();
}

// Save/Load Game for Moon Mission
function saveGame() {
    localStorage.setItem('troMoonMission', JSON.stringify(gameState));
    localStorage.setItem('troMoonMissionLastSave', Date.now().toString());
}

function resetGame() {
    if (confirm("Reset all moon mission progress? All data will be lost!")) {
        localStorage.removeItem('troMoonMission');
        localStorage.removeItem('troMoonMissionLastSave');
        location.reload();
    }
}

// Visual Effects for Moon Mission
function animateRocket() {
    rocket.classList.add('launching');
    setTimeout(() => {
        rocket.classList.remove('launching');
    }, 300);
}

function createFloatingText(text, isBoost) {
    const floatingText = document.createElement('div');
    floatingText.textContent = (isBoost ? "⚡ " : "") + text;
    floatingText.className = 'floating-text';
    floatingText.style.color = isBoost ? '#00ffff' : '#4a4aff';
    floatingText.style.left = `calc(50% + ${Math.random() * 60 - 30}px)`;
    floatingText.style.textShadow = '0 0 10px currentColor';
    
    tapArea.appendChild(floatingText);
    setTimeout(() => floatingText.remove(), 1000);
}

function showNotification(message, color) {
    notification.textContent = message;
    notification.style.display = 'block';
    notification.style.background = color ? 
        `linear-gradient(45deg, ${color}, ${color}dd)` : 
        'rgba(0, 0, 0, 0.8)';
    notification.style.border = `1px solid ${color}`;
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Sound Effects
function playLaunchSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Rocket launch sound
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.3);
        
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
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

// Price prediction chart animation
function animatePriceChart() {
    const chartBars = document.querySelectorAll('.chart-bar');
    chartBars.forEach((bar, index) => {
        setTimeout(() => {
            bar.style.height = bar.style.height; // Trigger reflow
        }, index * 200);
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 TRO Moon Mission loading...");
    
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
    
    // Animate price chart
    setTimeout(animatePriceChart, 1000);
});

// Fallback initialization
window.addEventListener('load', () => {
    if (typeof gameState === 'undefined') {
        console.log("🔄 Re-initializing Moon Mission...");
        initGame();
    }
});

// Add some space-themed console messages
console.log(`%c
🚀 TRO MOON MISSION 🚀
─────────────────────
Total Distance: 384,400 km
Target Price: $0.10
Mission: Take TRO to the Moon!

Good luck, astronaut! 🌕
`, "background: #0a0a2a; color: #00ffff; font-size: 14px; padding: 10px; border: 1px solid #4a4aff;");
