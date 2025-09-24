// Data yang sering berubah: voucher, konversi, biaya upgrade, dll.
const GAME_CONFIG = {
    getPointsPerClick(level) {
        if (level <= 0) return 1;
        // Formula C: log + linear → naik lambat
        return Math.floor(Math.log(level + 1) * 5 + level * 0.5);
    },

    getUpgradeCost(level) {
        if (level <= 0) return 15;
        // Formula C: eksponensial 1.6x → biaya naik cepat
        return Math.max(15, Math.floor(15 * Math.pow(1.6, level - 1)));
    },

    REDEEM_RATE: 100, // 100 POIN = 1 TRO

    VALID_VOUCHERS: {
        'WELCOME10': { type: 'points', amount: 10 },
        'TRO5': { type: 'taro', amount: 5 },
        'MINER25': { type: 'points', amount: 25 },
        'BONUS50': { type: 'points', amount: 50 },
        'TRO10': { type: 'taro', amount: 10 }
    },

    TON_ADDRESS_REGEX: /^UQ[A-Za-z0-9_-]{46}$/,

    ALERT_MESSAGES: {
        INVALID_TON: '❌ Alamat TON tidak valid!\nFormat: UQ diikuti 46 karakter (contoh: UQCWjqpAbavs7tOE1JjO9_w_IHEl_OrVeI7P9zKVvLbtwD2l)',
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
        VOUCHER_EMPTY: '❌ Masukkan kode voucher!'
    }
};
