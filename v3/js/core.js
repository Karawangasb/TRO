// =======================
// CORE GAME LOGIC
// =======================

// State game global
let gameState = {
    points: 0,
    level: 1,
    pointsPerClick: 1,
    taroTokens: 0,
    withdrawnTaro: 0,
    totalClicks: 0,
    totalPointsEarned: 0,
    withdrawalHistory: [],
    tonAddress: ""
};

// =======================
// Fungsi Grid Tambang
// =======================

// Generate kotak tambang
function generateMineGrid() {
    const mineArea = document.getElementById("mineArea");
    if (!mineArea) return;

    mineArea.innerHTML = ""; // kosongkan dulu

    for (let i = 0; i < 24; i++) {
        const cell = document.createElement("div");
        cell.classList.add("mine-cell");
        cell.textContent = "🪙";

        cell.addEventListener("click", () => {
            gameState.points += gameState.pointsPerClick;
            gameState.totalPointsEarned += gameState.pointsPerClick;
            gameState.totalClicks += 1;

            saveGame();
            updateUI();
        });

        mineArea.appendChild(cell);
    }
}

// Reset grid (misalnya untuk Next Block)
function resetMineGrid() {
    generateMineGrid();
}

// =======================
// Fungsi Upgrade Pickaxe
// =======================
function upgradePickaxe() {
    const cost = GAME_CONFIG.UPGRADE_COST * gameState.level;
    if (gameState.points >= cost) {
        gameState.points -= cost;
        gameState.level++;
        gameState.pointsPerClick++;
        alert(`⛏️ Pickaxe berhasil di-upgrade! Sekarang ${gameState.pointsPerClick} poin per klik.`);
        saveGame();
        updateUI();
    } else {
        alert(GAME_CONFIG.ALERT_MESSAGES.INSUFFICIENT_POINTS_UPGRADE(cost));
    }
}

// =======================
// Tukar POIN ke TRO
// =======================
function redeemTokens() {
    if (gameState.points >= GAME_CONFIG.REDEEM_COST) {
        gameState.points -= GAME_CONFIG.REDEEM_COST;
        gameState.taroTokens += 1;
        alert("✅ Berhasil menukar 100 POIN menjadi 1 TRO!");
        saveGame();
        updateUI();
    } else {
        alert("❌ POIN tidak cukup untuk ditukar.");
    }
}

// =======================
// Redeem Voucher
// =======================
function redeemVoucher() {
    const code = document.getElementById("voucherCode").value.trim().toUpperCase();
    const msg = document.getElementById("voucherMessage");

    if (!code) {
        msg.textContent = "❌ Masukkan kode voucher!";
        return;
    }

    if (code === "WELCOME10") {
        gameState.points += 10;
        msg.textContent = "🎉 Berhasil klaim 10 POIN!";
    } else if (code === "TRO5") {
        gameState.taroTokens += 5;
        msg.textContent = "🎉 Berhasil klaim 5 TRO!";
    } else if (code === "MINER25") {
        gameState.points += 25;
        msg.textContent = "🎉 Berhasil klaim 25 POIN!";
    } else {
        msg.textContent = "❌ Kode voucher tidak valid.";
        return;
    }

    saveGame();
    updateUI();
    document.getElementById("voucherCode").value = "";
}

// =======================
// Update UI
// =======================
function updateUI() {
    // Halaman utama
    if (document.getElementById("points")) document.getElementById("points").textContent = gameState.points;
    if (document.getElementById("level")) document.getElementById("level").textContent = gameState.level;

    // Tukar
    if (document.getElementById("redeemPoints")) document.getElementById("redeemPoints").textContent = gameState.points;
    if (document.getElementById("taroTokens")) document.getElementById("taroTokens").textContent = gameState.taroTokens;

    // Withdraw
    if (document.getElementById("withdrawTaro")) document.getElementById("withdrawTaro").textContent = gameState.taroTokens;
    if (document.getElementById("totalWithdrawn")) document.getElementById("totalWithdrawn").textContent = gameState.withdrawnTaro;
    if (document.getElementById("maxWithdraw")) document.getElementById("maxWithdraw").textContent = gameState.taroTokens;

    // Statistik
    if (document.getElementById("currentPoints")) document.getElementById("currentPoints").textContent = gameState.points;
    if (document.getElementById("totalPointsEarned")) document.getElementById("totalPointsEarned").textContent = gameState.totalPointsEarned;
    if (document.getElementById("totalClicks")) document.getElementById("totalClicks").textContent = gameState.totalClicks;
    if (document.getElementById("statsLevel")) document.getElementById("statsLevel").textContent = gameState.level;
    if (document.getElementById("statsPointsPerClick")) document.getElementById("statsPointsPerClick").textContent = gameState.pointsPerClick;
    if (document.getElementById("statsTaroTokens")) document.getElementById("statsTaroTokens").textContent = gameState.taroTokens;
    if (document.getElementById("statsWithdrawn")) document.getElementById("statsWithdrawn").textContent = gameState.withdrawnTaro;
}
