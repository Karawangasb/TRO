// Konfigurasi Game
const GAME_CONFIG = {
    POINTS_PER_CLICK_BASE: 1,
    REFRESH_GRID_COST: 10,
    ALERT_MESSAGES: {
        NO_TRO_TO_WITHDRAW: "❌ Belum ada TRO untuk ditarik!",
        NO_ADDRESS: "❌ Masukkan alamat TON terlebih dahulu!",
        INVALID_WITHDRAW_AMOUNT: "❌ Jumlah penarikan tidak valid!",
        INSUFFICIENT_TRO: (max) => `❌ Maksimal hanya ${max} TRO.`,
        WITHDRAW_SUCCESS: (amount, address) => `✅ Berhasil tarik ${amount} TRO ke ${address}`,
        INSUFFICIENT_POINTS_REFRESH: (cost) => `❌ Butuh minimal ${cost} poin untuk refresh grid`
    }
};
