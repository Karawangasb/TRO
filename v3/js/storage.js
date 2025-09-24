const API_URL = "https://script.google.com/macros/s/AKfycbyIJwGDy005Me3FnWHHsQOcpfpbNU_MfK93h2tbnLGStYxWif5YPvVUT0-7tWK4uR4i/exec";

let telegramUserId = null;
let points = 0;
let level = 1;
let pointsPerClick = 1;
let taroTokens = 0;
let withdrawnTaro = 0;
let totalClicks = 0;
let totalPointsEarned = 0;
let withdrawalHistory = [];
let tonAddress = "";

// Simpan data ke Google Sheets
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
        mode: "no-cors", // 🔸 bypass CORS, tapi tidak bisa baca response
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).catch(err => console.error("Error saveToStorage:", err));
}

// Ambil data user dari Sheets (sementara skip, karena no-cors tidak bisa baca)
function loadFromStorage() {
    console.log("⚠️ loadFromStorage belum bisa jalan (butuh proxy / Apps Script tweak)");
    // Untuk tes, sementara pakai default
    points = 0;
    level = 1;
    pointsPerClick = 1;
    taroTokens = 0;
    withdrawnTaro = 0;
    totalClicks = 0;
    totalPointsEarned = 0;
    withdrawalHistory = [];
    tonAddress = "";
}
