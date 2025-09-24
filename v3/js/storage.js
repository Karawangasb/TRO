// === KONFIGURASI ===
const API_URL = "https://script.google.com/macros/s/AKfycbyIJwGDy005Me3FnWHHsQOcpfpbNU_MfK93h2tbnLGStYxWif5YPvVUT0-7tWK4uR4i/exec"; // ganti dengan URL Apps Script WebApp kamu
const tg = window.Telegram.WebApp;
tg.expand(); // biar fullscreen

// Ambil userId Telegram
const telegramUserId = tg.initDataUnsafe?.user?.id || null;
const telegramUsername = tg.initDataUnsafe?.user?.username || "Guest";

// === FUNGSI LOAD DATA ===
async function loadFromStorage() {
    if (!telegramUserId) {
        console.error("Gagal ambil Telegram userId");
        return;
    }

    try {
        const res = await fetch(`${API_URL}?action=getUser&userid=${telegramUserId}`);
        const data = await res.json();

        if (data && data.userid) {
            // Isi variabel game dari database
            points = Number(data.points) || 0;
            level = Number(data.lv) || 1;
            pointsPerClick = GAME_CONFIG.getPointsPerClick(level);
            taroTokens = Number(data.tokens) || 0;
            withdrawnTaro = 0; // bisa diambil dari kolom jika ada
            totalClicks = 0;   // tambahkan ke DB jika mau
            totalPointsEarned = 0;
            withdrawalHistory = data.withdrawHistory ? JSON.parse(data.withdrawHistory) : [];
            tonAddress = data.wallet || '';
        } else {
            console.log("User baru, data kosong");
        }
    } catch (err) {
        console.error("Error loadFromStorage:", err);
    }
}

// === FUNGSI SAVE DATA ===
async function saveToStorage() {
    if (!telegramUserId) return;

    const payload = {
        action: "saveUser",
        userid: telegramUserId,
        lv: level,
        wallet: tonAddress,
        points,
        tokens: taroTokens,
        withdrawHistory: JSON.stringify(withdrawalHistory)
    };

    try {
        await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        console.error("Error saveToStorage:", err);
    }
}
