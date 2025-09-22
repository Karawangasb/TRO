const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Simulasi database user (nanti bisa ganti ke PostgreSQL)
let users = {};

// Endpoint: Klaim reward otomatis
app.post('/claim-reward', (req, res) => {
  const { telegramId } = req.body;
  if (!telegramId) return res.status(400).json({ error: "telegramId required" });

  if (!users[telegramId]) {
    users[telegramId] = { hashrate: 1, mined: 0, pending: 0 };
  }

  // Simulasi total hashrate jaringan = 1000 MH/s
  const TOTAL_HASHRATE = 1000;
  const REWARD_PER_BLOCK = 190.26;
  const userReward = (users[telegramId].hashrate / TOTAL_HASHRATE) * REWARD_PER_BLOCK;

  users[telegramId].pending += userReward;

  res.json({ success: true, reward: userReward });
});

// Endpoint: Withdraw
app.post('/withdraw', (req, res) => {
  const { telegramId, amount } = req.body;
  if (!telegramId || !amount) return res.status(400).json({ error: "telegramId & amount required" });

  if (!users[telegramId] || users[telegramId].pending < amount) {
    return res.json({ success: false, error: "Tidak cukup pending balance" });
  }

  // 🔜 Nanti di sini integrasi kirim TRO via blockchain
  console.log(`📤 [WITHDRAW] Kirim ${amount} TRO ke user ${telegramId}`);

  users[telegramId].mined += amount;
  users[telegramId].pending -= amount;

  res.json({ success: true, amount });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend berjalan di http://localhost:${PORT}`);
});
