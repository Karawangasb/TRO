// core.js
// grid & logika inti

// Reset grid
function resetMineGrid() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.dataset.mined = 'false';
        cell.classList.remove('mined');
        cell.innerHTML = '<img src="img/axe.png" alt="Pickaxe">'
    });
}

function initMineGrid() {
  const mineAreaEl = document.getElementById('mineArea');
  if (!mineAreaEl) return;
  mineAreaEl.innerHTML = '';
  // 24 sel
  for (let i = 0; i < 24; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.mined = 'false';
    cell.innerHTML = '<img src="img/axe.png" alt="Pickaxe">';
    cell.addEventListener('click', () => mineCell(cell));
    mineAreaEl.appendChild(cell);
  }
}

function mineCell(cell) {
  if (!cell || cell.dataset.mined === 'true') return;
  const earned = GAME_CONFIG.getPointsPerClick(level);
  points += earned;
  totalPointsEarned += earned;
  totalClicks++;
  cell.dataset.mined = 'true';
  cell.classList.add('mined');
  cell.innerHTML = '<img src="img/coin.png" alt="TARO COIN">';
  updateUI();
  saveToStorage();
}

function upgradePickaxe() {
  const cost = GAME_CONFIG.getUpgradeCost(level);
  if (points >= cost) {
    points -= cost;
    level++;
    pointsPerClick = GAME_CONFIG.getPointsPerClick(level);
    resetMineGrid();
    updateUI();
    saveToStorage();
  } else {
    alert(`Butuh ${cost} POIN untuk upgrade.`);
  }
}

function redeemTokens() {
  if (points >= GAME_CONFIG.REDEEM_RATE) {
    const tokensToRedeem = Math.floor(points / GAME_CONFIG.REDEEM_RATE);
    points -= tokensToRedeem * GAME_CONFIG.REDEEM_RATE;
    taroTokens += tokensToRedeem;
    showMessage('redeemMessage', GAME_CONFIG.ALERT_MESSAGES.REDEEM_SUCCESS(tokensToRedeem), 3000);
    updateUI();
    saveToStorage();
  } else {
    showMessage('redeemMessage', GAME_CONFIG.ALERT_MESSAGES.REDEEM_FAIL, 3000);
  }
}

function redeemVoucher() {
  const codeInput = document.getElementById('voucherCode');
  if (!codeInput) return;
  const code = codeInput.value.trim().toUpperCase();
  const msgEl = document.getElementById('voucherMessage');
  if (!code) {
    showMessageEl(msgEl, GAME_CONFIG.ALERT_MESSAGES.VOUCHER_EMPTY, 3000);
    return;
  }
  const voucher = GAME_CONFIG.VALID_VOUCHERS[code];
  if (voucher) {
    if (voucher.type === 'points') {
      points += voucher.amount;
      showMessageEl(msgEl, GAME_CONFIG.ALERT_MESSAGES.VOUCHER_SUCCESS_POINTS(voucher.amount), 3000);
    } else {
      taroTokens += voucher.amount;
      showMessageEl(msgEl, GAME_CONFIG.ALERT_MESSAGES.VOUCHER_SUCCESS_TRO(voucher.amount), 3000);
    }
    codeInput.value = '';
    updateUI();
    saveToStorage();
  } else {
    showMessageEl(msgEl, GAME_CONFIG.ALERT_MESSAGES.VOUCHER_INVALID, 3000);
  }
}

// UI helper functions used across files
function showMessage(elementId, text, duration = 3000) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = text;
    setTimeout(() => { el.textContent = ''; }, duration);
  }
}

function showMessageEl(el, text, duration = 3000) {
  if (!el) return;
  el.textContent = text;
  setTimeout(() => { el.textContent = ''; }, duration);
}

function renderHistory() {
  const historyList = document.getElementById('historyList');
  const noHistory = document.getElementById('noHistory');
  if (!historyList || !noHistory) return;
  if (!withdrawalHistory || withdrawalHistory.length === 0) {
    noHistory.style.display = 'block';
    historyList.innerHTML = '';
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

function updateUI() {
  // safety: ensure level int
  level = parseInt(level) || 1;
  pointsPerClick = GAME_CONFIG.getPointsPerClick(level);
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

  setText('points', points);
  setText('level', level);
  setText('redeemPoints', points);
  setText('taroTokens', taroTokens);
  setText('withdrawTaro', taroTokens);
  setText('totalWithdrawn', withdrawnTaro);
  const tonEl = document.getElementById('tonAddress'); if (tonEl) tonEl.value = tonAddress || '';
  setText('currentPoints', points);
  setText('totalPointsEarned', totalPointsEarned);
  setText('totalClicks', totalClicks);
  setText('statsLevel', level);
  setText('statsPointsPerClick', pointsPerClick);
  setText('statsTaroTokens', taroTokens);
  setText('statsWithdrawn', withdrawnTaro);

  const upgradeBtn = document.getElementById('upgradeBtn');
  if (upgradeBtn) {
    const cost = GAME_CONFIG.getUpgradeCost(level);
    upgradeBtn.textContent = `Upgrade Pickaxe (${cost} POIN)`;
    upgradeBtn.disabled = points < cost;
  }
  const redeemBtn = document.getElementById('redeemBtn');
  if (redeemBtn) redeemBtn.disabled = points < GAME_CONFIG.REDEEM_RATE;
  const requestWithdrawBtn = document.getElementById('requestWithdrawBtn');
  if (requestWithdrawBtn) requestWithdrawBtn.disabled = taroTokens < 1;

// Tampilkan modal konfirmasi penarikan (minimal 1000 TRO)
function showWithdrawConfirm() {
  const address = document.getElementById('tonAddress')?.value?.trim();
  const amount = parseInt(document.getElementById('withdrawAmount')?.value) || 0;

  if (!address) {
    showMessage('withdrawMessage', GAME_CONFIG.ALERT_MESSAGES.NO_ADDRESS, 2500);
    return;
  }
  if (!GAME_CONFIG.TON_ADDRESS_REGEX.test(address)) {
    showMessage('withdrawMessage', GAME_CONFIG.ALERT_MESSAGES.INVALID_TON, 2500);
    return;
  }
  if (amount < 1000) {
    showMessage('withdrawMessage', '❌ Minimal penarikan: 1000 TRO!', 2500);
    return;
  }
  if (amount > taroTokens) {
    showMessage('withdrawMessage', GAME_CONFIG.ALERT_MESSAGES.INSUFFICIENT_TRO(taroTokens), 2500);
    return;
  }

  document.getElementById('confirmAddress').textContent = address;
  document.getElementById('confirmModal').style.display = 'block';
}

// Proses penarikan: kurangi TRO & simpan riwayat
function processWithdrawal() {
  const address = document.getElementById('tonAddress')?.value?.trim();
  const amount = parseInt(document.getElementById('withdrawAmount')?.value) || 0;

  // Validasi ulang
  if (!address || !GAME_CONFIG.TON_ADDRESS_REGEX.test(address) || amount < 1000 || amount > taroTokens) {
    document.getElementById('confirmModal').style.display = 'none';
    return;
  }

  // ✅ Kurangi TRO dari saldo game
  taroTokens -= amount;
  withdrawnTaro += amount;

  // Simpan ke riwayat
  withdrawalHistory.push({
    amount: amount,
    address: address,
    date: new Date().toLocaleString('id-ID')
  });

  // Kirim ke server (Google Apps Script)
  const payload = {
    action: "requestWithdrawal",
    userId: telegramUserId,
    amount: amount,
    wallet: address
  };

  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(err => console.warn("Withdrawal request failed:", err));

  saveToStorage();
  updateUI();
  document.getElementById('confirmModal').style.display = 'none';
  showMessage('withdrawMessage', `✅ Permintaan penarikan ${amount} TRO dikirim!\nSaldo TRO Anda berkurang.`, 4000);
}
