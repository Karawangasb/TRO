// storage.js
// GANTI dengan URL WebApp Apps Script kamu
const API_URL = "https://script.google.com/macros/s/AKfycbyIJwGDy005Me3FnWHHsQOcpfpbNU_MfK93h2tbnLGStYxWif5YPvVUT0-7tWK4uR4i/exec";

// State global (deklarasi SINGGEL di sini)
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

// Detect Telegram WebApp userId (jika game dijalankan lewat Telegram)
function initTelegramId() {
  try {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      telegramUserId = tg.initDataUnsafe?.user?.id || null;
    }
  } catch (e) {
    console.warn("Telegram WebApp not available", e);
  }
  // fallback: simpan/ambil id lokal agar multi-device punya identitas (opsional)
  if (!telegramUserId) {
    let localId = localStorage.getItem('taro_local_userid');
    if (!localId) {
      localId = 'local_' + Date.now();
      localStorage.setItem('taro_local_userid', localId);
    }
    telegramUserId = localId;
  }
}

// Simpan data ke Google Sheets (no-cors mode — kirim data, tidak membaca respons)
function saveToStorage() {
  if (!telegramUserId) {
    console.warn("telegramUserId belum tersedia, skip saveToStorage");
    return;
  }
  const payload = {
    action: "saveUser",
    userId: telegramUserId,
    lv: level,
    wallet: tonAddress,
    points,
    tokens: taroTokens,
    withdrawnTaro,
    totalClicks,
    totalPointsEarned,
    withdrawHistory: JSON.stringify(withdrawalHistory)
  };
  // kirim ke Apps Script (no-cors agar tidak kena CORS); response tidak bisa dibaca
  fetch(API_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(err => console.warn("saveToStorage fetch error (likely CORS/no-cors):", err));

  // juga simpan lokal sebagai fallback
  try {
    const local = { points, level, taroTokens, withdrawnTaro, totalClicks, totalPointsEarned, withdrawalHistory, tonAddress };
    localStorage.setItem('taroCoinGame', JSON.stringify(local));
  } catch (e) { console.warn("localStorage save failed", e); }
}

// Load data awal: utamakan localStorage (karena Apps Script no-cors tak bisa baca)
function loadFromStorage() {
  initTelegramId();
  try {
    const saved = localStorage.getItem('taroCoinGame');
    if (saved) {
      const data = JSON.parse(saved);
      points = Number(data.points) || 0;
      level = Number(data.level) || 1;
      pointsPerClick = GAME_CONFIG.getPointsPerClick(level);
      taroTokens = Number(data.taroTokens) || 0;
      withdrawnTaro = Number(data.withdrawnTaro) || 0;
      totalClicks = Number(data.totalClicks) || 0;
      totalPointsEarned = Number(data.totalPointsEarned) || 0;
      withdrawalHistory = data.withdrawalHistory || [];
      tonAddress = data.tonAddress || '';
      console.log("Loaded from localStorage");
    } else {
      console.log("No local data, starting fresh");
      pointsPerClick = GAME_CONFIG.getPointsPerClick(level);
    }
  } catch (e) {
    console.warn("loadFromStorage error, starting defaults", e);
    pointsPerClick = GAME_CONFIG.getPointsPerClick(level);
  }
}
