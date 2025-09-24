// State Game
let points = 0;
let level = 1;
let pointsPerClick = 1;
let taroTokens = 0;
let withdrawnTaro = 0;
let totalClicks = 0;
let totalPointsEarned = 0;
let withdrawalHistory = [];
let tonAddress = ''; // Alamat TON pengguna

// Voucher yang valid
const validVouchers = {
    'WELCOME10': { type: 'points', amount: 10 },
    'TRO5': { type: 'taro', amount: 5 },
    'MINER25': { type: 'points', amount: 25 },
    'BONUS50': { type: 'points', amount: 50 },
    'TRO10': { type: 'taro', amount: 10 }
};

// Elemen DOM
const pointsEl = document.getElementById('points');
const levelEl = document.getElementById('level');
const mineAreaEl = document.getElementById('mineArea');
const upgradeBtn = document.getElementById('upgradeBtn');
const redeemPointsEl = document.getElementById('redeemPoints');
const taroTokensEl = document.getElementById('taroTokens');
const withdrawTaroEl = document.getElementById('withdrawTaro');
const totalWithdrawnEl = document.getElementById('totalWithdrawn');
const redeemBtn = document.getElementById('redeemBtn');
const redeemMessageEl = document.getElementById('redeemMessage');
const requestWithdrawBtn = document.getElementById('requestWithdrawBtn');
const tonAddressInput = document.getElementById('tonAddress');
const withdrawAmountInput = document.getElementById('withdrawAmount');
const maxWithdrawEl = document.getElementById('maxWithdraw');
const confirmModal = document.getElementById('confirmModal');
const confirmYesBtn = document.getElementById('confirmYes');
const confirmNoBtn = document.getElementById('confirmNo');
const confirmAddressEl = document.getElementById('confirmAddress');

// Navigasi
const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

// Inisialisasi dari localStorage
function loadFromStorage() {
    const saved = localStorage.getItem('taroCoinGame');
    if (saved) {
        const data = JSON.parse(saved);
        points = data.points || 0;
        level = data.level || 1;
        pointsPerClick = data.pointsPerClick || 1;
        taroTokens = data.taroTokens || 0;
        withdrawnTaro = data.withdrawnTaro || 0;
        totalClicks = data.totalClicks || 0;
        totalPointsEarned = data.totalPointsEarned || 0;
        withdrawalHistory = data.withdrawalHistory || [];
        tonAddress = data.tonAddress || '';
    }
    tonAddressInput.value = tonAddress;
}

// Simpan ke localStorage
function saveToStorage() {
    const data = {
        points,
        level,
        pointsPerClick,
        taroTokens,
        withdrawnTaro,
        totalClicks,
        totalPointsEarned,
        withdrawalHistory,
        tonAddress
    };
    localStorage.setItem('taroCoinGame', JSON.stringify(data));
}

// Inisialisasi grid 24 sel
function initMineGrid() {
    mineAreaEl.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.mined = 'false';
        cell.textContent = '⛏️';
        cell.addEventListener('click', () => mineCell(cell));
        mineAreaEl.appendChild(cell);
    }
}

// Fungsi menambang
function mineCell(cell) {
    if (cell.dataset.mined === 'true') return;

    const earned = pointsPerClick;
    points += earned;
    totalPointsEarned += earned;
    totalClicks++;

    cell.dataset.mined = 'true';
    cell.classList.add('mined');
    cell.textContent = '🪙'; // TARO COIN

    updateUI();
}

// Upgrade pickaxe
function upgradePickaxe() {
    const cost = level * 10;
    if (points >= cost) {
        points -= cost;
        level++;
        pointsPerClick = level;
        resetMineGrid();
        updateUI();
    }
}

// Reset grid tambang
function resetMineGrid() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.dataset.mined = 'false';
        cell.classList.remove('mined');
        cell.textContent = '⛏️';
    });
}

// Tukar POIN ke TRO
function redeemTokens() {
    if (points >= 100) {
        const tokensToRedeem = Math.floor(points / 100);
        points -= tokensToRedeem * 100;
        taroTokens += tokensToRedeem;
        redeemMessageEl.textContent = `✅ Berhasil tukar ${tokensToRedeem} TRO!`;
        setTimeout(() => {
            redeemMessageEl.textContent = '';
        }, 3000);
        updateUI();
    } else {
        redeemMessageEl.textContent = '❌ POIN tidak cukup! Butuh 100 POIN per TRO.';
        setTimeout(() => {
            redeemMessageEl.textContent = '';
        }, 3000);
    }
}

// Validasi alamat TON (format user-friendly: UQ...)
function isValidTonAddress(address) {
    if (!address) return false;
    address = address.trim();
    // Format: UQ + 46 karakter (alfanumerik, underscore, strip)
    const tonRegex = /^UQ[A-Za-z0-9_-]{46}$/;
    return tonRegex.test(address);
}

// Simpan alamat TON
function saveTonAddress() {
    const address = tonAddressInput.value.trim();
    if (address && !isValidTonAddress(address)) {
        alert('❌ Alamat TON tidak valid!\nFormat: UQ diikuti 46 karakter (contoh: UQCWjqpAbavs7tOE1JjO9_w_IHEl_OrVeI7P9zKVvLbtwD2l)');
        return false;
    }
    tonAddress = address;
    updateUI();
    return true;
}

// Tampilkan modal konfirmasi penarikan
function showWithdrawConfirm() {
    if (taroTokens < 1) {
        alert('❌ Anda tidak memiliki TRO untuk ditarik!');
        return;
    }

    if (!saveTonAddress()) return;
    if (!tonAddress) {
        alert('❌ Masukkan alamat dompet TON Anda terlebih dahulu!');
        return;
    }

    const amount = parseInt(withdrawAmountInput.value);
    if (isNaN(amount) || amount < 1) {
        alert('❌ Jumlah TRO harus minimal 1!');
        return;
    }
    if (amount > taroTokens) {
        alert(`❌ Anda hanya memiliki ${taroTokens} TRO!`);
        return;
    }

    confirmAddressEl.innerHTML = `
        Jumlah: <strong>${amount} TRO</strong><br>
        Alamat: <span class="confirm-address-text">${tonAddress}</span>
    `;
    confirmModal.style.display = 'block';
}

// Proses penarikan
function processWithdrawal() {
    const amount = parseInt(withdrawAmountInput.value);
    if (isNaN(amount) || amount < 1 || amount > taroTokens || !tonAddress) {
        alert('❌ Data penarikan tidak valid!');
        confirmModal.style.display = 'none';
        return;
    }

    taroTokens -= amount;
    withdrawnTaro += amount;
    
    // Simpan ke riwayat
    const withdrawal = {
        id: Date.now(),
        amount: amount,
        address: tonAddress,
        date: new Date().toLocaleString('id-ID')
    };
    withdrawalHistory.unshift(withdrawal);
    
    alert(`✅ Berhasil ditarik ${amount} TRO ke:\n${tonAddress}`);
    confirmModal.style.display = 'none';
    updateUI();
    renderHistory();
}

// Tutup modal
function closeModal() {
    confirmModal.style.display = 'none';
}

// Render riwayat penarikan
function renderHistory() {
    const historyList = document.getElementById('historyList');
    const noHistory = document.getElementById('noHistory');
    
    if (withdrawalHistory.length === 0) {
        noHistory.style.display = 'block';
        return;
    }
    
    noHistory.style.display = 'none';
    historyList.innerHTML = '';
    
    withdrawalHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div>
                <strong>${item.amount} TRO</strong>
                <div class="history-date">${item.date}</div>
            </div>
            <div class="history-address">${item.address}</div>
        `;
        historyList.appendChild(div);
    });
}

// Klaim voucher
function redeemVoucher() {
    const codeInput = document.getElementById('voucherCode');
    const code = codeInput.value.trim().toUpperCase();
    const messageEl = document.getElementById('voucherMessage');
    
    if (!code) {
        messageEl.textContent = '❌ Masukkan kode voucher!';
        return;
    }
    
    if (validVouchers[code]) {
        const voucher = validVouchers[code];
        if (voucher.type === 'points') {
            points += voucher.amount;
            messageEl.textContent = `✅ Berhasil klaim! +${voucher.amount} POIN`;
        } else if (voucher.type === 'taro') {
            taroTokens += voucher.amount;
            messageEl.textContent = `✅ Berhasil klaim! +${voucher.amount} TRO`;
        }
        
        codeInput.value = '';
        updateUI();
        
        setTimeout(() => {
            messageEl.textContent = '';
        }, 3000);
    } else {
        messageEl.textContent = '❌ Kode voucher tidak valid!';
        setTimeout(() => {
            messageEl.textContent = '';
        }, 3000);
    }
}

// Update semua tampilan UI
function updateUI() {
    // Halaman Mine
    pointsEl.textContent = points;
    levelEl.textContent = level;
    
    // Halaman Tukar
    redeemPointsEl.textContent = points;
    taroTokensEl.textContent = taroTokens;
    
    // Halaman Penarikan
    withdrawTaroEl.textContent = taroTokens;
    totalWithdrawnEl.textContent = withdrawnTaro;
    tonAddressInput.value = tonAddress;
    
    // Update maksimal penarikan
    maxWithdrawEl.textContent = taroTokens;
    withdrawAmountInput.max = taroTokens;
    let currentAmount = parseInt(withdrawAmountInput.value);
    if (isNaN(currentAmount) || currentAmount < 1) currentAmount = 1;
    if (currentAmount > taroTokens) currentAmount = taroTokens || 1;
    withdrawAmountInput.value = currentAmount;
    
    // Halaman Stats
    document.getElementById('currentPoints').textContent = points;
    document.getElementById('totalPointsEarned').textContent = totalPointsEarned;
    document.getElementById('totalClicks').textContent = totalClicks;
    document.getElementById('statsLevel').textContent = level;
    document.getElementById('statsPointsPerClick').textContent = pointsPerClick;
    document.getElementById('statsTaroTokens').textContent = taroTokens;
    document.getElementById('statsWithdrawn').textContent = withdrawnTaro;

    // Kontrol tombol
    const upgradeCost = level * 10;
    upgradeBtn.textContent = `Upgrade Pickaxe (${upgradeCost} POIN)`;
    upgradeBtn.disabled = points < upgradeCost;
    redeemBtn.disabled = points < 100;
    requestWithdrawBtn.disabled = taroTokens < 1;

    // Simpan ke localStorage
    saveToStorage();
    
    // Render riwayat jika di halaman riwayat
    if (document.getElementById('historyPage').classList.contains('active')) {
        renderHistory();
    }
}

// Navigasi antar halaman
function switchPage(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(pageId + 'Page').classList.add('active');
    const navBtn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
    if (navBtn) navBtn.classList.add('active');
    
    // Render riwayat saat masuk halaman riwayat
    if (pageId === 'history') {
        renderHistory();
    }
}

// Event Listeners
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        switchPage(btn.dataset.page);
    });
});

// Submenu Tukar
document.getElementById('convertBtn').addEventListener('click', () => switchPage('convert'));
document.getElementById('withdrawBtn').addEventListener('click', () => switchPage('withdraw'));
document.getElementById('historyBtn').addEventListener('click', () => switchPage('history'));
document.getElementById('voucherBtn').addEventListener('click', () => switchPage('voucher'));

// Submenu Info
document.getElementById('statsLink').addEventListener('click', () => switchPage('stats'));
document.getElementById('aboutLink').addEventListener('click', () => switchPage('about'));

// Aksi utama
upgradeBtn.addEventListener('click', upgradePickaxe);
redeemBtn.addEventListener('click', redeemTokens);
requestWithdrawBtn.addEventListener('click', showWithdrawConfirm);
confirmYesBtn.addEventListener('click', processWithdrawal);
confirmNoBtn.addEventListener('click', closeModal);

// Voucher
document.getElementById('redeemVoucherBtn').addEventListener('click', redeemVoucher);
document.getElementById('voucherCode').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') redeemVoucher();
});

// Input jumlah penarikan
withdrawAmountInput.addEventListener('input', () => {
    let value = parseInt(withdrawAmountInput.value);
    if (isNaN(value) || value < 1) value = 1;
    if (value > taroTokens) value = taroTokens;
    withdrawAmountInput.value = value || 1;
});

// Tutup modal saat klik di luar
window.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
        closeModal();
    }
});

// Inisialisasi
loadFromStorage();
initMineGrid();
updateUI();
