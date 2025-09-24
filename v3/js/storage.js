// API ke Google Sheets
const API_URL = "https://script.google.com/macros/s/AKfycbyIJwGDy005Me3FnWHHsQOcpfpbNU_MfK93h2tbnLGStYxWif5YPvVUT0-7tWK4uR4i/exec";

// State Global
let telegramUserId = null;
let points = 0;
let level = 1;
let pointsPerClick = GAME_CONFIG.POINTS_PER_CLICK_BASE;
let taroTokens = 0;
let withdrawnTaro = 0;
let totalClicks = 0;
let totalPointsEarned = 0;
let withdrawalHistory = [];
let tonAddress = "";

// Simpan ke Sheets
function saveToStorage() {
    if (!telegramUserId) return;

    const data = {
        action: "saveUser",
        userId: telegramUserId,
        level,
        wallet: tonAddress,
        points,
        tokens: taroTokens,
        withdrawnTaro,
        totalClicks,
        totalPointsEarned,
        withdrawalHistory: JSON.stringify(withdrawalHistory)
    };

    fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).catch(err => console.error("Error saveToStorage:", err));
}

// Ambil dari Sheets (sementara dummy)
function loadFromStorage() {
    console.log("⚠️ loadFromStorage dummy. Perlu proxy agar bisa ambil data balik dari Sheets.");
}
