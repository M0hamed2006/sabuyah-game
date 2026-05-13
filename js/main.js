// ====================== main.js ======================
window.addEventListener('load', () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    loadSave();
    calcLanes();
    
    document.getElementById('stat-best').textContent = (leaderboard[0]?.score || 0).toLocaleString('ar');
    document.getElementById('stat-total').textContent = Math.floor(totalCoins).toLocaleString('ar');

    bindUI();
    showScreen('start');
    
    console.log("%c✅ Sabuyah Game Loaded Successfully!", "color:#ffcc00; font-size:16px");
});
