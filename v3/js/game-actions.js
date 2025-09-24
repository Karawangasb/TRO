function mineCell(cell) {
    if (cell.dataset.mined === 'true') return;
    const earned = pointsPerClick;
    points += earned;
    totalPointsEarned += earned;
    totalClicks++;
    cell.dataset.mined = 'true';
    cell.classList.add('mined');
    cell.innerHTML = '<img src="img/coin.png" alt="TARO COIN">';
    updateUI();
}

function upgradePickaxe() {
    const cost = GAME_CONFIG.getUpgradeCost(level);
    if (points >= cost) {
        points -= cost;
        level++;
        pointsPerClick = GAME_CONFIG.getPointsPerClick(level); 
        resetMineGrid();
        updateUI();
    }
}

function redeemTokens() {
    if (points >= GAME_CONFIG.REDEEM_RATE) {
        const tokensToRedeem = Math.floor(points / GAME_CONFIG.REDEEM_RATE);
        points -= tokensToRedeem * GAME_CONFIG.REDEEM_RATE;
        taroTokens += tokensToRedeem;
        showMessage('redeemMessage', GAME_CONFIG.ALERT_MESSAGES.REDEEM_SUCCESS(tokensToRedeem), 3000);
        updateUI();
    } else {
        showMessage('redeemMessage', GAME_CONFIG.ALERT_MESSAGES.REDEEM_FAIL, 3000);
    }
}

function redeemVoucher() {
    const codeInput = document.getElementById('voucherCode');
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
    } else {
        showMessageEl(msgEl, GAME_CONFIG.ALERT_MESSAGES.VOUCHER_INVALID, 3000);
    }
}
