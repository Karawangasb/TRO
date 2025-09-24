// Fungsi untuk menampilkan halaman
function showPage(pageId) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const target = document.getElementById(pageId + "Page");
    if (target) target.classList.add("active");

    // Update menu aktif
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.dataset.page === pageId) btn.classList.add("active");
    });

    // Sinkronkan tampilan data setiap kali masuk halaman
    updateUI();
}

// =======================
// Event Listener Navigasi
// =======================
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const target = btn.dataset.page;
        showPage(target);
    });
});

// =======================
// Event di Halaman Mine
// =======================
document.getElementById("refreshGridBtn").addEventListener("click", () => {
    generateMineGrid(); // regenerasi blok baru
});

document.getElementById("upgradeBtn").addEventListener("click", () => {
    upgradePickaxe();
});

// =======================
// Event di Menu Tukar
// =======================
document.getElementById("convertBtn").addEventListener("click", () => {
    showPage("convert");
});

document.getElementById("withdrawBtn").addEventListener("click", () => {
    showPage("withdraw");
});

document.getElementById("historyBtn").addEventListener("click", () => {
    showPage("history");
});

document.getElementById("voucherBtn").addEventListener("click", () => {
    showPage("voucher");
});

// =======================
// Event di Menu Info
// =======================
document.getElementById("statsLink").addEventListener("click", () => {
    showPage("stats");
});

document.getElementById("aboutLink").addEventListener("click", () => {
    showPage("about");
});

// =======================
// Tukar POIN ke TRO
// =======================
document.getElementById("redeemBtn").addEventListener("click", () => {
    if (gameState.points >= 100) {
        gameState.points -= 100;
        gameState.taroTokens += 1;
        saveGame();
        updateUI();
        document.getElementById("redeemMessage").textContent = "✅ Berhasil tukar 100 POIN → 1 TRO!";
    } else {
        document.getElementById("redeemMessage").textContent = "❌ POIN tidak cukup!";
    }
});

// =======================
// Voucher
// =======================
document.getElementById("redeemVoucherBtn").addEventListener("click", () => {
    const code = document.getElementById("voucherCode").value.trim().toUpperCase();
    let message = "❌ Kode tidak valid!";
    if (code === "WELCOME10") {
        gameState.points += 10;
        message = "✅ Klaim 10 POIN!";
    } else if (code === "TRO5") {
        gameState.taroTokens += 5;
        message = "✅ Klaim 5 TRO!";
    } else if (code === "MINER25") {
        gameState.points += 25;
        message = "✅ Klaim 25 POIN!";
    }
    saveGame();
    updateUI();
    document.getElementById("voucherMessage").textContent = message;
});

// =======================
// Withdraw
// =======================
document.getElementById("requestWithdrawBtn").addEventListener("click", () => {
    const amount = parseInt(document.getElementById("withdrawAmount").value);
    const address = document.getElementById("tonAddress").value.trim();

    if (!address || !address.startsWith("UQ")) {
        alert("❌ Alamat TON tidak valid!");
        return;
    }
    if (isNaN(amount) || amount < 1 || amount > gameState.taroTokens) {
        alert("❌ Jumlah tidak valid!");
        return;
    }

    // tampilkan modal konfirmasi
    document.getElementById("confirmModal").style.display = "flex";
    document.getElementById("confirmAddress").textContent =
        `Alamat: ${address}\nJumlah: ${amount} TRO`;

    // Simpan data sementara
    gameState.pendingWithdraw = { address, amount };
});

document.getElementById("confirmYes").addEventListener("click", () => {
    const { address, amount } = gameState.pendingWithdraw;

    // Kurangi saldo
    gameState.taroTokens -= amount;
    gameState.totalWithdrawn += amount;

    // Tambahkan ke riwayat
    if (!gameState.withdrawHistory) gameState.withdrawHistory = [];
    gameState.withdrawHistory.push({
        address,
        amount,
        date: new Date().toLocaleString()
    });

    saveGame();
    updateUI();

    document.getElementById("confirmModal").style.display = "none";
    alert("✅ Penarikan berhasil tercatat! Admin akan memproses.");
});

document.getElementById("confirmNo").addEventListener("click", () => {
    document.getElementById("confirmModal").style.display = "none";
});

// =======================
// Update UI
// =======================
function updateUI() {
    // Halaman utama
    document.getElementById("points").textContent = gameState.points;
    document.getElementById("level").textContent = gameState.level;

    // Halaman convert
    document.getElementById("redeemPoints").textContent = gameState.points;
    document.getElementById("taroTokens").textContent = gameState.taroTokens;

    // Halaman withdraw
    document.getElementById("withdrawTaro").textContent = gameState.taroTokens;
    document.getElementById("totalWithdrawn").textContent = gameState.totalWithdrawn;
    document.getElementById("maxWithdraw").textContent = gameState.taroTokens;

    // Halaman stats
    document.getElementById("currentPoints").textContent = gameState.points;
    document.getElementById("totalPointsEarned").textContent = gameState.totalPointsEarned;
    document.getElementById("totalClicks").textContent = gameState.totalClicks;
    document.getElementById("statsLevel").textContent = gameState.level;
    document.getElementById("statsPointsPerClick").textContent = gameState.pointsPerClick;
    document.getElementById("statsTaroTokens").textContent = gameState.taroTokens;
    document.getElementById("statsWithdrawn").textContent = gameState.totalWithdrawn;

    // Riwayat withdraw
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";
    if (gameState.withdrawHistory && gameState.withdrawHistory.length > 0) {
        gameState.withdrawHistory.forEach(h => {
            const p = document.createElement("p");
            p.textContent = `${h.date} - ${h.amount} TRO → ${h.address}`;
            historyList.appendChild(p);
        });
    } else {
        historyList.innerHTML = "<p id='noHistory'>Belum ada penarikan.</p>";
    }
}

// =======================
// Init Game
// =======================
document.addEventListener("DOMContentLoaded", () => {
    generateMineGrid();
    updateUI();
    showPage("mine");
});
