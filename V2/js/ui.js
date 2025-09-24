function showMessage(elementId, text, duration = 3000) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = text;
        setTimeout(() => { el.textContent = ''; }, duration);
    }
}

function showMessageEl(el, text, duration = 3000) {
    el.textContent = text;
    setTimeout(() => { el.textContent = ''; }, duration);
}

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

function updateUI() {
    // Update semua elemen UI
    document.getElementById('points').textContent = points;
    document.getElementById('level').textContent = level;
    document.getElementById('redeemPoints').textContent = points;
    document.getElementById('taroTokens').textContent = taroTokens;
    document.getElementById('withdrawTaro').textContent = taroTokens;
    document.getElementById('totalWithdrawn').textContent = withdrawnTaro;
    document.getElementById('tonAddress').value = tonAddress;
    
    // Stats
    document.getElementById('currentPoints').textContent = points;
    document.getElementById('totalPointsEarned').textContent = totalPointsEarned;
    document.getElementById('totalClicks').textContent = totalClicks;
    document.getElementById('statsLevel').textContent = level;
    document.getElementById('statsPointsPerClick').textContent = pointsPerClick;
    document.getElementById('statsTaroTokens').textContent = taroTokens;
    document.getElementById('statsWithdrawn').textContent = withdrawnTaro;

    // Max withdraw
    const maxWithdrawEl = document.getElementById('maxWithdraw');
    const withdrawAmountInput = document.getElementById('withdrawAmount');
    maxWithdrawEl.textContent = taroTokens;
    withdrawAmountInput.max = taroTokens;
    let current = parseInt(withdrawAmountInput.value);
    if (isNaN(current) || current < 1) current = 1;
    if (current > taroTokens) current = taroTokens || 1;
    withdrawAmountInput.value = current;

    // Tombol
    const upgradeCost = level * GAME_CONFIG.UPGRADE_COST_BASE;
    document.getElementById('upgradeBtn').textContent = `Upgrade Pickaxe (${upgradeCost} POIN)`;
    document.getElementById('upgradeBtn').disabled = points < upgradeCost;
    document.getElementById('redeemBtn').disabled = points < GAME_CONFIG.REDEEM_RATE;
    document.getElementById('requestWithdrawBtn').disabled = taroTokens < 1;

    saveToStorage();
    
    if (document.getElementById('historyPage').classList.contains('active')) {
        renderHistory();
    }
}
