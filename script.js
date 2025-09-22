// Inisialisasi Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();

// Ambil data user
const user = tg.initDataUnsafe?.user;
if (user) {
  document.getElementById('user-info').innerText = `Halo, ${user.first_name}! ID: ${user.id}`;
} else {
  document.getElementById('user-info').innerText = "User tidak terdeteksi";
}

// Simpan data user di localStorage (untuk simulasi — nanti pakai backend)
let userData = JSON.parse(localStorage.getItem(`user_${user?.id}`)) || {
  hashrate: 1, // MH/s
  mined: 0,
  pending: 0,
  refCode: `REF${user?.id || Math.random().toString(36).substr(2, 9)}`,
  referredBy: null
};

// Tampilkan data
function updateUI() {
  document.getElementById('hashrate').innerText = userData.hashrate;
  document.getElementById('mined').innerText = userData.mined.toFixed(2);
  document.getElementById('pending').innerText = userData.pending.toFixed(2);
  document.getElementById('ref-link').innerText = `https://t.me/TaroMinerBot?start=${userData.refCode}`;
}

updateUI();

// Upgrade Pickaxe
document.getElementById('upgrade-btn').addEventListener('click', async () => {
  if (userData.mined >= 1000) {
    userData.mined -= 1000;
    userData.hashrate += 5;
    localStorage.setItem(`user_${user?.id}`, JSON.stringify(userData));
    updateUI();
    tg.showPopup({ title: "✅ Sukses!", message: "Pickaxe di-upgrade!" });
  } else {
    tg.showPopup({ title: "❌ Gagal", message: "TRO tidak cukup!" });
  }
});

// Connect Wallet (simulasi — nanti integrasi TON Connect)
document.getElementById('connect-wallet').addEventListener('click', () => {
  // Untuk versi HTML/JS, kita bisa arahkan ke URL TON Connect
  const tonConnectUrl = "tonconnect://...";
  window.open(tonConnectUrl, "_blank");
  // Atau pakai iframe: https://github.com/ton-connect/sdk
});

// Withdraw (simulasi — nanti kirim ke backend)
document.getElementById('withdraw-btn').addEventListener('click', async () => {
  if (userData.pending > 0) {
    // Kirim request ke backend untuk kirim TRO
    const response = await fetch('https://your-backend-url.com/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: user?.id,
        amount: userData.pending
      })
    });

    const result = await response.json();
    if (result.success) {
      userData.mined += userData.pending;
      userData.pending = 0;
      localStorage.setItem(`user_${user?.id}`, JSON.stringify(userData));
      updateUI();
      tg.showPopup({ title: "✅ Withdraw Berhasil", message: `Kamu dapat ${result.amount} TRO!` });
    } else {
      tg.showPopup({ title: "❌ Gagal", message: result.error });
    }
  } else {
    tg.showPopup({ title: "❌ Gagal", message: "Tidak ada reward untuk ditarik!" });
  }
});

// Hitung mundur blok 10 menit (simulasi — nanti sinkron dengan backend)
let nextBlockTime = new Date(Date.now() + 10 * 60 * 1000); // 10 menit dari sekarang
function updateCountdown() {
  const now = new Date();
  const diff = nextBlockTime - now;
  if (diff <= 0) {
    nextBlockTime = new Date(Date.now() + 10 * 60 * 1000);
    // Kirim request ke backend untuk klaim reward otomatis
    fetch('https://your-backend-url.com/claim-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: user?.id })
    })
    .then(r => r.json())
    .then(data => {
      if (data.reward) {
        userData.pending += data.reward;
        localStorage.setItem(`user_${user?.id}`, JSON.stringify(userData));
        updateUI();
        tg.showPopup({ title: "⛏️ Blok Baru!", message: `Kamu dapat ${data.reward.toFixed(2)} TRO!` });
      }
    });
  }
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  document.getElementById('next-block').innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
setInterval(updateCountdown, 1000);
