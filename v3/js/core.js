// Reset grid
function resetMineGrid() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.dataset.mined = 'false';
        cell.classList.remove('mined');
        cell.innerHTML = '<img src="img/axe.png" alt="Pickaxe">';
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

// Contoh logika click (disederhanakan)
function mineCell(cell) {
    if (cell.dataset.mined === 'true') return;

    cell.dataset.mined = 'true';
    cell.classList.add('mined');
    cell.innerHTML = "⛏️";

    points += pointsPerClick;
    totalClicks++;
    totalPointsEarned += pointsPerClick;

    updateUI();
    saveToStorage();
}

// Placeholder UI
function updateUI() {
    document.getElementById('points').innerText = points;
    document.getElementById('tokens').innerText = taroTokens;
}

function renderHistory() {
    const list = document.getElementById('withdrawHistory');
    list.innerHTML = withdrawalHistory.map(w => 
        `<li>${w.date} - ${w.amount} TRO → ${w.address}</li>`
    ).join('');
}
