// main.js
document.addEventListener("DOMContentLoaded", () => {
  if (typeof loadFromStorage === "function") loadFromStorage();
  if (typeof initMineGrid === "function") initMineGrid();
  if (typeof updateUI === "function") updateUI();

  // Event delegation untuk SEMUA klik
  document.addEventListener('click', (e) => {
    const el = e.target;

    // --- Tombol Aksi ---
    if (el.id === 'upgradeBtn') upgradePickaxe();
    else if (el.id === 'redeemBtn') redeemTokens();
    else if (el.id === 'redeemVoucherBtn') redeemVoucher();
    else if (el.id === 'requestWithdrawBtn') showWithdrawConfirm();
    else if (el.id === 'confirmYes') processWithdrawal();
    else if (el.id === 'confirmNo') {
      const modal = document.getElementById('confirmModal');
      if (modal) modal.style.display = 'none';
    }
    else if (el.id === 'refreshGridBtn') {
      resetMineGrid();
      updateUI();
      saveToStorage();
    }

    // --- Submenu (Tukar > ...) ---
    else if (el.id === 'convertBtn') showPage('convert');
    else if (el.id === 'withdrawBtn') showPage('withdraw');
    else if (el.id === 'historyBtn') {
      showPage('history');
      if (typeof renderHistory === 'function') renderHistory();
    }
    else if (el.id === 'voucherBtn') showPage('voucher');
    else if (el.id === 'statsLink') showPage('stats');
    else if (el.id === 'aboutLink') showPage('about');

    // --- Navigasi Bawah ---
    else if (el.classList.contains('nav-btn')) {
      const pid = el.dataset.page;
      showPage(pid);
      if (pid === 'history' && typeof renderHistory === 'function') renderHistory();
    }
  });

  // Helper: tampilkan halaman
  function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId + 'Page');
    if (target) target.classList.add('active');
    
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
      if (btn.dataset.page === pageId) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  // --- Input Events ---
  const voucherCode = document.getElementById('voucherCode');
  if (voucherCode) {
    voucherCode.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') redeemVoucher();
    });
  }

  const withdrawAmount = document.getElementById('withdrawAmount');
  if (withdrawAmount) {
    withdrawAmount.addEventListener('input', () => {
      let v = parseInt(withdrawAmount.value);
      if (isNaN(v) || v < 1) v = 1;
      if (v > taroTokens) v = taroTokens;
      withdrawAmount.value = v || 1;
    });
  }
});
