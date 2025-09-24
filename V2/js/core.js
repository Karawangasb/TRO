// State Game (global, tapi terpusat)
let points = 0;
let level = 1;
let pointsPerClick = GAME_CONFIG.POINTS_PER_CLICK_BASE;
let taroTokens = 0;
let withdrawnTaro = 0;
let totalClicks = 0;
let totalPointsEarned = 0;
let withdrawalHistory = [];
let tonAddress = '';

// Reset grid
function resetMineGrid() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.dataset.mined = 'false';
        cell.classList.remove('mined');
        cell.innerHTML = '<img src="img/axe.png" alt="Pickaxe">'
    });
}

// Inisialisasi grid
function initMineGrid() {
    const mineAreaEl = document.getElementById('mineArea');
    mineAreaEl.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.mined = 'false';
        cell.innerHTML = '<img src="img/axe.png" alt="Pickaxe">';
        cell.addEventListener('click', () => mineCell(cell));
        mineAreaEl.appendChild(cell);
    }
}
