// main.js

window.addEventListener('DOMContentLoaded', () => {
  // ===================== INIT =====================
  loadFromStorage();
  updateUI();
  initMineGrid();

  // ===================== Mining Grid =====================
  const mineGrid = document.getElementById('mineGrid');
  mineGrid.addEventListener('click', (e) => {
    if (!e.target.classList.contains('cell')) return;
    if (e.target.dataset.mined === 'true') return;

    const gain = Math.floor(Math.random() * 5) + 1; // random 1–5 points
    points += gain;
    e.target.dataset.mined = 'true';
    e.target.textContent = '⛏️';
    e.target.classList.add('mined');

    updateUI();
    saveToStorage();
  });

  // ===================== Refresh Grid =====================
  attach('refreshGridBtn', 'click', () => {
    const cost = GAME_CONFIG.REFRESH_GRID_COST;
    if (points >= cost) {
      points -= cost;
      initMineGrid();   // FIX: pakai initMineGrid()
      updateUI();
      saveToStorage();
    } else {
      alert(GAME_CONFIG.ALERT_MESSAGES.INSUFFICIENT_POINTS_REFRESH(cost));
    }
  });

  // ===================== Upgrades =====================
  attach('upgradeBtn', 'click', () => {
    const cost = GAME_CONFIG.UPGRADE_COSTS[currentUpgradeLevel];
    if (!cost) {
      alert(GAME_CONFIG.ALERT_MESSAGES.MAX_UPGRADE);
      return;
    }
    if (points >= cost) {
      points -= cost;
      currentUpgradeLevel++;
      alert(GAME_CONFIG.ALERT_MESSAGES.UPGRADE_SUCCESS(currentUpgradeLevel));
      updateUI();
      saveToStorage();
    } else {
      alert(GAME_CONFIG.ALERT_MESSAGES.INSUFFICIENT_POINTS(cost));
    }
  });

  // ===================== Navigation =====================
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
      if (navMap[id] === 'history') renderHistory();
    });
  });

  // ===================== Back Buttons =====================
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('minePage').classList.add('active');
    });
  });
});

// ===================== Helpers =====================
function attach(id, evt, cb) {
  const el = document.getElementById(id);
  if (el) el.addEventListener(evt, cb);
}
