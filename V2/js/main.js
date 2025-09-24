// Event listeners utama
document.getElementById('upgradeBtn').addEventListener('click', upgradePickaxe);
document.getElementById('redeemBtn').addEventListener('click', redeemTokens);
document.getElementById('requestWithdrawBtn').addEventListener('click', showWithdrawConfirm);
document.getElementById('confirmYes').addEventListener('click', processWithdrawal);
document.getElementById('confirmNo').addEventListener('click', () => {
    document.getElementById('confirmModal').style.display = 'none';
});

document.getElementById('redeemVoucherBtn').addEventListener('click', redeemVoucher);
document.getElementById('voucherCode').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') redeemVoucher();
});

document.getElementById('withdrawAmount').addEventListener('input', () => {
    let value = parseInt(document.getElementById('withdrawAmount').value);
    if (isNaN(value) || value < 1) value = 1;
    if (value > taroTokens) value = taroTokens;
    document.getElementById('withdrawAmount').value = value || 1;
});

window.addEventListener('click', (e) => {
    if (e.target === document.getElementById('confirmModal')) {
        document.getElementById('confirmModal').style.display = 'none';
    }
});

// Fungsi penarikan
function showWithdrawConfirm() {
    if (taroTokens < 1) {
        alert(GAME_CONFIG.ALERT_MESSAGES.NO_TRO_TO_WITHDRAW);
        return;
    }
    if (!saveTonAddress()) return;
    if (!tonAddress) {
        alert(GAME_CONFIG.ALERT_MESSAGES.NO_ADDRESS);
        return;
    }

    const amount = parseInt(document.getElementById('withdrawAmount').value);
    if (isNaN(amount) || amount < 1) {
        alert(GAME_CONFIG.ALERT_MESSAGES.INVALID_WITHDRAW_AMOUNT);
        return;
    }
    if (amount > taroTokens) {
        alert(GAME_CONFIG.ALERT_MESSAGES.INSUFFICIENT_TRO(taroTokens));
        return;
    }

    document.getElementById('confirmAddress').innerHTML = `
        Jumlah: <strong>${amount} TRO</strong><br>
        Alamat: <span class="confirm-address-text">${tonAddress}</span>
    `;
    document.getElementById('confirmModal').style.display = 'block';
}

function processWithdrawal() {
    const amount = parseInt(document.getElementById('withdrawAmount').value);
    if (isNaN(amount) || amount < 1 || amount > taroTokens || !tonAddress) {
        alert('❌ Data penarikan tidak valid!');
        document.getElementById('confirmModal').style.display = 'none';
        return;
    }

    taroTokens -= amount;
    withdrawnTaro += amount;
    const withdrawal = {
        id: Date.now(),
        amount: amount,
        address: tonAddress,
        date: new Date().toLocaleString('id-ID')
    };
    withdrawalHistory.unshift(withdrawal);
    
    alert(GAME_CONFIG.ALERT_MESSAGES.WITHDRAW_SUCCESS(amount, tonAddress));
    document.getElementById('confirmModal').style.display = 'none';
    updateUI();
    renderHistory();
}
// Inisialisasi
loadFromStorage();
initMineGrid();
updateUI();

// Di akhir file main.js
document.getElementById('refreshGridBtn').addEventListener('click', () => {
    const cost = GAME_CONFIG.REFRESH_GRID_COST;
    if (points >= cost) {
        points -= cost;
        resetMineGrid();
        updateUI();
    } else {
        alert(GAME_CONFIG.ALERT_MESSAGES.INSUFFICIENT_POINTS_REFRESH(cost));
    }
});
