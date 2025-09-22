// =============================
// ⚙️ Inisialisasi Telegram Web App
// =============================
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// =============================
// 🌐 Konfigurasi Supabase
// =============================
const SUPABASE_URL = 'https://gcylipzusxceszpvpcsb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // 🔑 GANTI DENGAN ANON KEY ANDA
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// =============================
// 🧑‍💻 Ambil Data User Telegram
// =============================
const user = tg.initDataUnsafe?.user;
if (!user) {
  document.getElementById('user-info').innerText = "⚠️ Buka game ini melalui bot Telegram!";
} else {
  document.getElementById('user-info').innerText = `Halo, ${user.first_name}! ID: ${user.id}`;
}

// =============================
// 🗃️ Load atau Buat User di Supabase
// =============================
let currentUser = null;

async function loadOrCreateUser() {
  if (!user) return null;

  try {
    // Cek parameter referral: ?start=REFERRER_ID
    const urlParams = new URLSearchParams(window.location.search);
    const referrerId = urlParams.get('start');

    // Coba ambil user dari database
    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      // User belum ada → buat baru
      const insertData = {
        id: user.id,
        hashrate: 1000000, // 1 MH/s dalam satuan numerik
        mined_tro: 0,
        pending_tro: 0,
        last_claim: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      // Jika ada referrer, simpan
      if (referrerId && !isNaN(referrerId) && parseInt(referrerId) !== user.id) {
        insertData.referrer_id = parseInt(referrerId);
      }

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([insertData])
        .select()
        .single();

      if (createError) throw createError;
      currentUser = newUser;
    } else {
      currentUser = data;
    }

    updateUI();
    return currentUser;
  } catch (err) {
    console.error('Gagal load/create user:', err);
    tg.showPopup({
      title: "❌ Error",
      message: "Gagal memuat data. Coba lagi nanti."
    });
    return null;
  }
}

// =============================
// 🖥️ Update UI
// =============================
function updateUI() {
  if (!currentUser) return;

  document.getElementById('hashrate').innerText = (currentUser.hashrate / 1000000).toFixed(2);
  document.getElementById('mined').innerText = currentUser.mined_tro.toFixed(2);
  document.getElementById('pending').innerText = currentUser.pending_tro.toFixed(2);
  document.getElementById('ref-link').innerText = `https://t.me/TaroMinerBot?start=${user.id}`;
}

// =============================
// ⏱️ AUTO REWARD TIAP 10 MENIT
// =============================
let nextBlockTime = new Date(Date.now() + 10 * 60 * 1000); // 10 menit dari sekarang

async function claimReward() {
  if (!user || !currentUser) return;

  try {
    const response = await fetch(`${BACKEND_URL}/claim-reward`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId: user.id })
    });

    const result = await response.json();

    if (result.success && result.reward) {
      // Update database
      const { error } = await supabase
        .from('users')
        .update({
          pending_tro: currentUser.pending_tro + result.reward,
          last_claim: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update state lokal & UI
      currentUser.pending_tro += result.reward;
      updateUI();

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

function updateCountdown() {
  const now = new Date();
  const diff = nextBlockTime - now;

  if (diff <= 0) {
    nextBlockTime = new Date(Date.now() + 10 * 60 * 1000);
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
document.getElementById('upgrade-btn').addEventListener('click', async () => {
  if (!user || !currentUser) {
    tg.showPopup({ title: "❌ Error", message: "Buka dari bot Telegram!" });
    return;
  }

  const upgradeCost = 1000; // TRO
  if (currentUser.mined_tro >= upgradeCost) {
    const newHashrate = currentUser.hashrate + 5000000; // +5 MH/s

    const { error } = await supabase
      .from('users')
      .update({
        mined_tro: currentUser.mined_tro - upgradeCost,
        hashrate: newHashrate
      })
      .eq('id', user.id);

    if (error) {
      tg.showPopup({ title: "❌ Error", message: "Gagal upgrade. Coba lagi." });
      return;
    }

    currentUser.mined_tro -= upgradeCost;
    currentUser.hashrate = newHashrate;
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
  if (!user || !currentUser) {
    tg.showPopup({ title: "❌ Error", message: "Buka dari bot Telegram!" });
    return;
  }

  if (currentUser.pending_tro <= 0) {
    tg.showPopup({ title: "❌ Gagal", message: "Tidak ada reward untuk ditarik!" });
    return;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramId: user.id,
        amount: currentUser.pending_tro
      })
    });

    const result = await response.json();

    if (result.success) {
      const { error } = await supabase
        .from('users')
        .update({
          mined_tro: currentUser.mined_tro + currentUser.pending_tro,
          pending_tro: 0
        })
        .eq('id', user.id);

      if (error) throw error;

      currentUser.mined_tro += currentUser.pending_tro;
      currentUser.pending_tro = 0;
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
// 🚀 START GAME — LOAD USER
// =============================
loadOrCreateUser();
