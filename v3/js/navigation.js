const navButtons = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

function switchPage(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(pageId + 'Page').classList.add('active');
    const navBtn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
    if (navBtn) navBtn.classList.add('active');
    
    if (pageId === 'history') {
        renderHistory();
    }
}

// Setup navigasi submenu
document.getElementById('convertBtn').addEventListener('click', () => switchPage('convert'));
document.getElementById('withdrawBtn').addEventListener('click', () => switchPage('withdraw'));
document.getElementById('historyBtn').addEventListener('click', () => switchPage('history'));
document.getElementById('voucherBtn').addEventListener('click', () => switchPage('voucher'));
document.getElementById('statsLink').addEventListener('click', () => switchPage('stats'));
document.getElementById('aboutLink').addEventListener('click', () => switchPage('about'));

navButtons.forEach(btn => {
    btn.addEventListener('click', () => switchPage(btn.dataset.page));
});
