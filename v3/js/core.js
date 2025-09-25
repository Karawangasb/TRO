// core.js
// grid & logika inti

function resetMineGrid() {
  const mineAreaEl = document.getElementById('mineArea');
  if (!mineAreaEl) return;
  mineAreaEl.innerHTML = '';
  for (let i = 0; i < 24; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.mined = 'false';
    cell.innerHTML = '<img src="img/axe.png" alt="Pickaxe">';
    cell.addEventListener('click', () => mineCell(cell));
    mineAreaEl.appendChild(cell);
  }
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

  // update withdraw amount max
  const maxWithdrawEl = document.getElementById('maxWithdraw');
  const withdrawAmountInput = document.getElementById('withdrawAmount');
  if (maxWithdrawEl) maxWithdrawEl.textContent = taroTokens;
  if (withdrawAmountInput) {
    withdrawAmountInput.max = taroTokens;
    let cur = parseInt(withdrawAmountInput.value) || 1;
    if (cur > taroTokens) cur = taroTokens || 1;
    withdrawAmountInput.value = cur;
  }
}
