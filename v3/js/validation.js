function isValidTonAddress(address) {
    if (!address) return false;
    return GAME_CONFIG.TON_ADDRESS_REGEX.test(address.trim());
}

function saveTonAddress() {
    const address = document.getElementById('tonAddress').value.trim();
    if (address && !isValidTonAddress(address)) {
        alert(GAME_CONFIG.ALERT_MESSAGES.INVALID_TON);
        return false;
    }
    tonAddress = address;
    updateUI();
    return true;
}
