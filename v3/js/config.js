// config.js
const GAME_CONFIG = {
  POINTS_PER_CLICK_BASE: 1,
  getPointsPerClick(level) {
    level = parseInt(level) || 1;
    return Math.max(1, Math.floor(Math.log(level + 1) * 5 + level * 0.5));
  },
  getUpgradeCost(level) {
    level = parseInt(level) || 1;
    return Math.max(15, Math.floor(15 * Math.pow(1.6, level - 1)));
  },
  REFRESH_GRID_COST: 10,
  REDEEM_RATE: 100,
  VALID_VOUCHERS: {
    'WELCOME10': { type: 'points', amount: 10 },
    'TRO5': { type: 'taro', amount: 5 },
    'MINER25': { type: 'points', amount: 25 }
  },
  TON_ADDRESS_REGEX: /^UQ[A-Za-z0-9_-]{46}$/,
  ALERT_MESSAGES: {
    INVALID_TON: '❌ Alamat TON tidak valid!',
    NO_TRO_TO_WITHDRAW: '❌ Anda tidak memiliki TRO untuk ditarik!',
    NO_ADDRESS: '❌ Masukkan alamat dompet TON Anda terlebih dahulu!',
    INVALID_WITHDRAW_AMOUNT: '❌ Jumlah TRO harus minimal 1!',
    INSUFFICIENT_TRO: (balance) => `❌ Anda hanya memiliki ${balance} TRO!`,
    WITHDRAW_SUCCESS: (amount, address) => `✅ Berhasil ditarik ${amount} TRO ke:\n${address}`,
    REDEEM_SUCCESS: (amount) => `✅ Berhasil tukar ${amount} TRO!`,
    REDEEM_FAIL: '❌ POIN tidak cukup! Butuh 100 POIN per TRO.',
    VOUCHER_SUCCESS_POINTS: (amt) => `✅ Berhasil klaim! +${amt} POIN`,
    VOUCHER_SUCCESS_TRO: (amt) => `✅ Berhasil klaim! +${amt} TRO`,
    VOUCHER_INVALID: '❌ Kode voucher tidak valid!',
    VOUCHER_EMPTY: '❌ Masukkan kode voucher!',
    INSUFFICIENT_POINTS_REFRESH: (cost) => `❌ Butuh ${cost} POIN untuk refresh grid!`
  }
};
