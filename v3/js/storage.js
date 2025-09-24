const API_URL = "https://script.google.com/macros/s/AKfycbyIJwGDy005Me3FnWHHsQOcpfpbNU_MfK93h2tbnLGStYxWif5YPvVUT0-7tWK4uR4i/exec";

// ⚠️ Jangan deklarasi ulang points, level, dll di sini!
// Semua variabel sudah ada di core.js

// Simpan data ke Google Sheets
function saveToStorage() {
    if (!telegramUserId) {
        console.warn("⚠️ telegramUserId belum terisi, data tidak disimpan.");
        return;
    }

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
        mode: "no-cors", // 🔸 bypass CORS → tidak bisa baca response
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).catch(err => console.error("Error saveToStorage:", err));
}

// Ambil data user dari Sheets (sementara skip, karena no-cors tidak bisa baca)
function loadFromStorage() {
    console.log("⚠️ loadFromStorage dummy (pakai default, butuh proxy / Apps Script tweak)");
    // Biarkan kosong untuk sekarang → variabel sudah default di core.js
}
