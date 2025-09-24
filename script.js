// Cek apakah dijalankan di Telegram WebApp
if (window.Telegram?.WebApp) {
  const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
  if (initDataUnsafe?.user) {
    tgUser.id = initDataUnsafe.user.id;
    tgUser.username = initDataUnsafe.user.username || '';
    checkUser();
  } else {
    showNonTelegram();
  }
} else {
  showNonTelegram();
}

function showNonTelegram() {
  document.getElementById('nonTelegram').style.display = 'block';
}

<script>
// 🔗 Ganti dengan URL Apps Script Anda (tanpa spasi!)
const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbx9ycxcyrGVjexGxin_pH7HyEZF5dGb8r42nsnfoyfOpCEl1m0t_LcRTVBJbBno3ruB/exec';

let tgUser = { id: null, username: null };
let dashboardInterval = null;

// Cek apakah dijalankan di Telegram WebApp
if (window.Telegram?.WebApp) {
  const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
  if (initDataUnsafe?.user) {
    tgUser.id = initDataUnsafe.user.id;
    tgUser.username = initDataUnsafe.user.username || '';
    checkUser();
  } else {
    showNonTelegram();
  }
} else {
  showNonTelegram();
}

function showNonTelegram() {
  document.getElementById('nonTelegram').style.display = 'block';
}

// Cek apakah user sudah terdaftar
async function checkUser() {
  const res = await fetchData('getUser', { telegram_id: tgUser.id });
  if (res.error) {
    document.getElementById('welcomeForm').style.display = 'block';
  } else {
    showDashboard();
    updateDashboard();
  }
}

// Tampilkan dashboard dan mulai auto-refresh
function showDashboard() {
  document.getElementById('welcomeForm').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  if (!dashboardInterval) {
    dashboardInterval = setInterval(updateDashboard, 10000);
  }
}

// Submit referral & daftar user
async function submitReferral() {
  const input = document.getElementById('referralCode');
  let referred_by = (input.value || '').trim();

  // Validasi format referral (opsional)
  if (referred_by && !/^[a-zA-Z0-9_]{3,32}$/.test(referred_by)) {
    showMessage("Kode referral hanya boleh berisi huruf, angka, atau underscore (3-32 karakter).", "error");
    return;
  }

  const username = encodeURIComponent(tgUser.username || 'user' + tgUser.id);
  const referral = encodeURIComponent(referred_by);

  showMessage("Mendaftarkan akun...", "info");

  try {
    const res = await fetch(`${WEBAPP_URL}?action=registerUser&telegram_id=${tgUser.id}&username=${username}&base_hashrate=1&referred_by=${referral}`);
    const data = await res.json();

    if (data.error) {
      throw new Error(data.message || "Gagal mendaftar. Coba lagi.");
    }

    showDashboard();
    updateDashboard();
    showMessage("✅ Pendaftaran berhasil!", "success");
  } catch (err) {
    console.error(err);
    showMessage("❌ " + err.message, "error");
  }
}

// Fungsi umum fetch data dengan error handling
async function fetchData(action, params = {}) {
  try {
    const url = new URL(WEBAPP_URL);
    url.searchParams.append('action', action);
    for (const key in params) {
      url.searchParams.append(key, encodeURIComponent(params[key]));
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Fetch error:', err);
    return { error: true, message: err.message };
  }
}

// Format angka dengan pemisah ribuan
function formatNumber(num) {
  if (num == null || num === '--') return '--';
  const n = parseFloat(num);
  return isNaN(n) ? '--' : n.toLocaleString('id-ID', { maximumFractionDigits: 6 });
}

// Format hashrate dengan satuan (H/s, KH/s, dll)
function formatHashrate(h) {
  if (h == null || h === '--') return '-- H/s';
  const n = parseFloat(h);
  if (isNaN(n)) return '-- H/s';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' GH/s';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' MH/s';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + ' KH/s';
  return n.toFixed(2) + ' H/s';
}

// Perbarui tampilan dashboard
async function updateDashboard() {
  try {
    const [user, network, blockData] = await Promise.all([
      fetchData('getUser', { telegram_id: tgUser.id }),
      fetchData('getNetworkHashrate'),
      fetchData('getCurrentBlock')
    ]);

    if (user.error || network.error || blockData.error) {
      console.warn("Gagal memperbarui dashboard");
      return;
    }

    document.getElementById('myHashrate').textContent = formatHashrate(user.effective_hashrate);
    document.getElementById('networkHashrate').textContent = formatHashrate(network.total_hashrate);
    document.getElementById('currentBlock').textContent = formatNumber((blockData.block_number || 0) + 1);
    document.getElementById('minedTRO').textContent = formatNumber(user.total_claimed);
    document.getElementById('pendingReward').textContent = formatNumber(user.unclaimed_balance);
  } catch (err) {
    console.error("Error di updateDashboard:", err);
  }
}

// Fungsi bantu tampilkan pesan
function showMessage(text, type = "info") {
  const output = document.getElementById('output');
  output.textContent = text;
  output.style.color = type === "error" ? "red" : type === "success" ? "green" : "blue";
}

// === Tombol Interaktif ===

async function showShop() {
  showMessage("Memuat shop...", "info");
  const items = await fetchData('listShop');
  if (items.error) {
    showMessage("❌ Gagal memuat shop", "error");
    return;
  }
  let output = '=== SHOP ===\n';
  if (items.length === 0) {
    output += 'Tidak ada item tersedia.\n';
  } else {
    items.forEach(i => {
      output += `${i.item_name} (+${formatNumber(i.bonus_hashrate)} H/s) - ${formatNumber(i.price)} TRO\n`;
    });
  }
  document.getElementById('output').textContent = output;
  document.getElementById('output').style.color = "#333";
}

async function showInventory() {
  showMessage("Memuat inventory...", "info");
  const inv = await fetchData('listInventory', { telegram_id: tgUser.id });
  if (inv.error) {
    showMessage("❌ Gagal memuat inventory", "error");
    return;
  }
  let output = '=== INVENTORY ===\n';
  if (inv.length === 0) {
    output += 'Inventory kosong.\n';
  } else {
    inv.forEach(i => {
      output += `${i.item_name} x${i.qty} (+${formatNumber(i.bonus_hashrate)} H/s)\n`;
    });
  }
  document.getElementById('output').textContent = output;
  document.getElementById('output').style.color = "#333";
}

async function claimRewards() {
  showMessage("Mengklaim reward...", "info");
  const res = await fetchData('claimReward', { telegram_id: tgUser.id });
  if (res.error) {
    showMessage("❌ Gagal klaim: " + (res.message || "Coba lagi nanti."), "error");
    return;
  }
  updateDashboard();
  showMessage("✅ Reward berhasil diklaim!", "success");
  setTimeout(() => document.getElementById('output').textContent = "", 2000);
}

async function showRewardHistory() {
  showMessage("Memuat riwayat reward...", "info");
  const history = await fetchData('getRewardHistory', { telegram_id: tgUser.id });
  if (history.error) {
    showMessage("❌ Gagal memuat riwayat", "error");
    return;
  }
  let output = '=== REWARD HISTORY ===\n';
  if (history.length === 0) {
    output += 'Belum ada reward.\n';
  } else {
    history.forEach(h => {
      output += `Blok ${h.block_number}: +${formatNumber(h.reward)} TRO\n`;
    });
  }
  document.getElementById('output').textContent = output;
  document.getElementById('output').style.color = "#333";
}

function showWithdrawForm() {
  const html = `
    Jumlah TRO: 
    <input type="number" id="withdrawAmount" value="1000000" min="1000000" step="1000000">
    <button onclick="requestWithdraw()">Kirim Permintaan</button>
    <br><small>Minimal withdraw: 1.000.000 TRO</small>
  `;
  document.getElementById('output').innerHTML = html;
}

async function requestWithdraw() {
  const amountInput = document.getElementById('withdrawAmount');
  const amount = parseFloat(amountInput.value);

  if (!amount || amount < 1000000) {
    showMessage("❌ Minimal withdraw 1.000.000 TRO", "error");
    return;
  }

  showMessage("Mengirim permintaan withdraw...", "info");
  const res = await fetchData('withdraw', { telegram_id: tgUser.id, amount: amount });
  if (res.error) {
    showMessage("❌ Gagal withdraw: " + (res.message || "Coba lagi."), "error");
    return;
  }
  updateDashboard();
  showWithdrawHistory();
  showMessage("✅ Permintaan withdraw dikirim!", "success");
}

async function showWithdrawHistory() {
  showMessage("Memuat riwayat withdraw...", "info");
  const history = await fetchData('getWithdrawHistory', { telegram_id: tgUser.id });
  if (history.error) {
    showMessage("❌ Gagal memuat riwayat withdraw", "error");
    return;
  }
  let output = '=== WITHDRAW HISTORY ===\n';
  if (history.length === 0) {
    output += 'Belum ada riwayat withdraw.\n';
  } else {
    history.forEach(w => {
      output += `${w.timestamp} - ${formatNumber(w.amount)} TRO - ${w.status}\n`;
    });
  }
  document.getElementById('output').textContent = output;
  document.getElementById('output').style.color = "#333";
}
</script>

// Contoh potongan awal:
async function checkUser() {
  const res = await fetchData('getUser', { telegram_id: tgUser.id });
  if (res.error) {
    document.getElementById('welcomeForm').style.display = 'block';
  } else {
    showDashboard();
    updateDashboard();
  }
}

// ... (lanjutkan salin semua fungsi hingga akhir) ...
