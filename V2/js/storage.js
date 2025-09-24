function loadFromStorage() {
    const saved = localStorage.getItem('taroCoinGame');
    if (saved) {
        const data = JSON.parse(saved);
        points = data.points || 0;
        level = data.level || 1;
        pointsPerClick = GAME_CONFIG.getPointsPerClick(level); 
        taroTokens = data.taroTokens || 0;
        withdrawnTaro = data.withdrawnTaro || 0;
        totalClicks = data.totalClicks || 0;
        totalPointsEarned = data.totalPointsEarned || 0;
        withdrawalHistory = data.withdrawalHistory || [];
        tonAddress = data.tonAddress || '';
    }
}

function saveToStorage() {
    const data = {
        points,
        level,
        pointsPerClick,
        taroTokens,
        withdrawnTaro,
        totalClicks,
        totalPointsEarned,
        withdrawalHistory,
        tonAddress
    };
    localStorage.setItem('taroCoinGame', JSON.stringify(data));
}
