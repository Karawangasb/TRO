document.addEventListener("DOMContentLoaded", () => {
    // Cek dan pasang event listeners jika elemen ada
    const upgradeBtn = document.getElementById('upgradeBtn');
    if (upgradeBtn) upgradeBtn.addEventListener('click', upgradePickaxe);

    const redeemBtn = document.getElementById('redeemBtn');
    if (redeemBtn) redeemBtn.addEventListener('click', redeemTokens);

    const requestWithdrawBtn = document.getElementById('requestWithdrawBtn');
    if (requestWithdrawBtn) requestWithdrawBtn.addEventListener('click', showWithdrawConfirm);

    const confirmYes = document.getElementById('confirmYes');
    if (confirmYes) confirmYes.addEventListener('click', processWithdrawal);

    const confirmNo = document.getElementById('confirmNo');
    if (confirmNo) confirmNo.addEventListener('click', () => {
        const modal = document.getElementById('confirmModal');
        if (modal) modal.style.display = 'none';
    });

    const redeemVoucherBtn = document.getElementById('redeemVoucherBtn');
    if (redeemVoucherBtn) redeemVoucherBtn.addEventListener('click', redeemVoucher);

    const voucherCode = document.getElementById('voucherCode');
    if (voucherCode) voucherCode.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') redeemVoucher();
    });

    const withdrawAmount = document.getElementById('withdrawAmount');
    if (withdrawAmount) {
        withdrawAmount.addEventListener('input', () => {
            let value = parseInt(withdrawAmount.value);
            if (isNaN(value) || value < 1) value = 1;
            if (value > taroTokens) value = taroTokens;
            withdrawAmount.value = value || 1;
        });
    }

    window.addEventListener('click', (e) => {
        const modal = document.getElementById('confirmModal');
        if (e.target === modal) modal.style.display = 'none';
    });

    const refreshGridBtn = document.getElementById('refreshGridBtn');
    if (refreshGridBtn) {
        refreshGridBtn.addEventListener('click', () => {
            const cost = GAME_CONFIG.REFRESH_GRID_COST;
            if (points >= cost) {
                points -= cost;
                resetMineGrid();
                updateUI();
            } else {
                alert(GAME_CONFIG.ALERT_MESSAGES.INSUFFICIENT_POINTS_REFRESH(cost));
            }
        });
    }

    // ==== Fungsi penarikan ====
    function showWithdrawConfirm() {
        if (typeof taroTokens === "undefined") return;

        if (taroTokens < 1) {
            alert(GAME_CONFIG.ALERT_MESSAGES.NO_TRO_TO_WITHDRAW);
            return;
        }
        if (typeof saveTonAddress === "function") {
            if (!saveTonAddress()) return;
        }
        if (!tonAddress) {
            alert(GAME_CONFIG.ALERT_MESSAGES.NO_ADDRESS);
            return;
        }

        const amount = parseInt(withdrawAmount?.value || "0");
        if (isNaN(amount) || amount < 1) {
            alert(GAME_CONFIG.ALERT_MESSAGES.INVALID_WITHDRAW_AMOUNT);
            return;
        }
        if (amount > taroTokens) {
            alert(GAME_CONFIG.ALERT_MESSAGES.INSUFFICIENT_TRO(taroTokens));
            return;
        }

        const confirmAddress = document.getElementById('confirmAddress');
        if (confirmAddress) {
            confirmAddress.innerHTML = `
                Jumlah: <strong>${amount} TRO</strong><br>
                Alamat: <span class="confirm-address-text">${tonAddress}</span>
            `;
        }
        const modal = document.getElementById('confirmModal');
        if (modal) modal.style.display = 'block';
    }

    function processWithdrawal() {
        const amount = parseInt(withdrawAmount?.value || "0");
        if (isNaN(amount) || amount < 1 || amount > taroTokens || !tonAddress) {
            alert('❌ Data penarikan tidak valid!');
            const modal = document.getElementById('confirmModal');
            if (modal) modal.style.display = 'none';
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

        const modal = document.getElementById('confirmModal');
        if (modal) modal.style.display = 'none';

        if (typeof updateUI === "function") updateUI();
        if (typeof renderHistory === "function") renderHistory();
    }

    // ==== Inisialisasi game ====
    if (typeof loadFromStorage === "function") loadFromStorage();
    if (typeof initMineGrid === "function") initMineGrid();
    if (typeof updateUI === "function") updateUI();
});
