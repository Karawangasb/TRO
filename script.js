// Inisialisasi Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// URL Backend Supabase
const BACKEND_URL = "https://gcylipzusxceszpvpcsb.supabase.co/functions/v1";

// Ambil data user Telegram
const user = tg.initDataUnsafe?.user;
if (!user) {
  document.getElementById('user-info').innerText = "⚠️ Buka game ini melalui bot Telegram!";
} else {
  document.getElementById('user-info').innerText = `Halo, ${user.first_name}!`;
}

// Simpan data user di localStorage (untuk sementara — nanti bisa pakai database)
let userData = JSON.parse(localStorage.getItem(`user_${user?.id}`)) || {
  hashrate: 1, // MH/s
  mined: 0,
  pending: 0,
  refCode: `REF${user?.id || Math.random().toString(36).substr(2, 9)}`,
  referredBy: null
};

// Tampilkan data di UI
function updateUI() {
  if (!user) return;
  document.getElementById('hashrate').innerText = userData.hashrate;
  document.getElementById('mined').innerText = userData.mined.toFixed(2);
  document.getElementById('pending').innerText = userData.pending.toFixed(2);
  document.getElementById('ref-link').innerText = `https://t.me/TaroMinerBot?start=${userData.refCode}`;
}
updateUI();

// =============================
// 🔁 AUTO REWARD TIAP 10 MENIT
// =============================
let nextBlockTime = new Date(Date.now() + 10 * 60 * 1000); // 10 menit dari sekarang

async function claimReward() {
  if (!user) return;

  try {
    const response = await fetch(`${BACKEND_URL}/claim-reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: user.id })
    });

    const result = await response.json();

    if (result.success && result.reward) {
      userData.pending += result.reward;
      localStorage.setItem(`user_${user.id}`, JSON.stringify(userData));
      updateUI();

      // Tampilkan notifikasi di Telegram
      tg.showPopup({
        title: "⛏️ Blok Baru Ditambang!",
        message: `Kamu mendapatkan ${result.reward.toFixed(2)} TRO!`
      });
    }
  } catch (err) {
    console.error("Error claiming reward:", err);
    tg.showPopup({
      title: "❌ Error",
      message: "Gagal klaim reward. Coba lagi nanti."
    });
  }
}

// Hitung mundur & klaim otomatis
function updateCountdown() {
  const now = new Date();
  const diff = nextBlockTime - now;

  if (diff <= 0) {
    nextBlockTime = new Date(Date.now() + 10 * 60 * 1000); // Reset 10 menit
    claimReward();
  }

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  document.getElementById('next-block').innerText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

setInterval(updateCountdown, 1000);

// =============================
// 🔼 UPGRADE ALAT MINING
// =============================
document.getElementById('upgrade-btn').addEventListener('click', () => {
  if (!user) {
    tg.showPopup({ title: "❌ Error", message: "Buka dari bot Telegram!" });
    return;
  }

  if (userData.mined >= 1000) {
    userData.mined -= 1000;
    userData.hashrate += 5;
    localStorage.setItem(`user_${user.id}`, JSON.stringify(userData));
    updateUI();
    tg.showPopup({ title: "✅ Sukses!", message: "Pickaxe di-upgrade!" });
  } else {
    tg.showPopup({ title: "❌ Gagal", message: "TRO tidak cukup!" });
  }
});

// =============================
// 💼 WITHDRAW KE DOMPET
// =============================
document.getElementById('withdraw-btn').addEventListener('click', async () => {
  if (!user) {
    tg.showPopup({ title: "❌ Error", message: "Buka dari bot Telegram!" });
    return;
  }

  if (userData.pending <= 0) {
    tg.showPopup({ title: "❌ Gagal", message: "Tidak ada reward untuk ditarik!" });
    return;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: user.id,
        amount: userData.pending
      })
    });

    const result = await response.json();

    if (result.success) {
      userData.mined += userData.pending;
      userData.pending = 0;
      localStorage.setItem(`user_${user.id}`, JSON.stringify(userData));
      updateUI();
      tg.showPopup({
        title: "✅ Withdraw Berhasil",
        message: `Kamu menerima ${result.amount} TRO!`
      });
    } else {
      tg.showPopup({
        title: "❌ Gagal",
        message: result.error || "Gagal proses withdraw."
      });
    }
  } catch (err) {
    console.error("Withdraw error:", err);
    tg.showPopup({
      title: "❌ Error",
      message: "Server tidak merespon. Coba lagi nanti."
    });
  }
});

// =============================
// 🔗 CONNECT WALLET (Placeholder)
// =============================
document.getElementById('connect-wallet').addEventListener('click', () => {
  tg.showPopup({
    title: "Fitur Dompet",
    message: "Integrasi Tonkeeper akan hadir di update berikutnya!"
  });
});
