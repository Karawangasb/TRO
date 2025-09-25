// main.js
document.addEventListener("DOMContentLoaded", () => {
  // init storage + UI + grid
  if (typeof loadFromStorage === "function") loadFromStorage();
  if (typeof initMineGrid === "function") initMineGrid();
  if (typeof updateUI === "function") updateUI();

  // safe attach listeners (only if element exists)
  const attach = (id, ev, fn) => { const el = document.getElementById(id); if (el) el.addEventListener(ev, fn); };

  attach('upgradeBtn', 'click', upgradePickaxe);
  attach('redeemBtn', 'click', redeemTokens);
  attach('redeemVoucherBtn', 'click', redeemVoucher);
  attach('requestWithdrawBtn', 'click', showWithdrawConfirm);
  attach('confirmYes', 'click', processWithdrawal);
  attach('confirmNo', 'click', () => { const modal = document.getElementById('confirmModal'); if (modal) modal.style.display = 'none'; });

  // ✅ Event delegation untuk refreshGridBtn (dalam DOMContentLoaded)
document.addEventListener('click', (e) => {
  if (e.target.id === 'refreshGridBtn') {
    resetMineGrid();
    updateUI();
    saveToStorage();
  }
});
  const voucherCode = document.getElementById('voucherCode');
  if (voucherCode) voucherCode.addEventListener('keypress', (e) => { if (e.key === 'Enter') redeemVoucher(); });

  const withdrawAmount = document.getElementById('withdrawAmount');
  if (withdrawAmount) withdrawAmount.addEventListener('input', () => {
    let v = parseInt(withdrawAmount.value);
    if (isNaN(v) || v < 1) v = 1;
    if (v > taroTokens) v = taroTokens;
    withdrawAmount.value = v || 1;
  });

  // navigation submenu (safe)
  const navMap = {
    convertBtn: 'convert',
    withdrawBtn: 'withdraw',
    historyBtn: 'history',
    voucherBtn: 'voucher',
    statsLink: 'stats',
    aboutLink: 'about'
  };
  Object.keys(navMap).forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      const target = document.getElementById(navMap[id] + 'Page');
      if (target) target.classList.add('active');
      if (navMap[id] === 'history' && typeof renderHistory === 'function') renderHistory();
    });
  });

  // bottom nav
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      const pid = btn.dataset.page;
      const target = document.getElementById(pid + 'Page');
      if (target) target.classList.add('active');
      document.querySelectorAll('.nav-btn').forEach(n => n.classList.remove('active'));
      btn.classList.add('active');
      if (pid === 'history' && typeof renderHistory === 'function') renderHistory();
    });
  });
}); // 👈 INI HARUS DI AKHIR — SETELAH SEMUA KODE
