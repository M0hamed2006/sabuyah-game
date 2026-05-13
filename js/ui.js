// ==================== USER INTERFACE (شاشات) ====================
window.ui = (function() {
    let root = document.getElementById('screens-root');
    let currentScreen = null;
    let gameManager = null; // سيتم ربطه من main.js

    function showScreen(screenId) {
        if (currentScreen) currentScreen.classList.add('hidden');
        let scr = document.getElementById(screenId);
        if (scr) scr.classList.remove('hidden');
        currentScreen = scr;
    }

    function buildMainMenu() {
        root.innerHTML = `
            <div id="startScreen" class="screen active">
                <div class="title">🚇 صابويه المصري</div>
                <div class="subtitle">النسخة المنظمة</div>
                <button id="playBtn" class="btn btn-primary">🎮 ابدأ</button>
                <button id="settingsBtn" class="btn btn-secondary">⚙️ إعدادات</button>
                <button id="shopBtn" class="btn btn-secondary">🛒 متجر</button>
                <div class="stats">⭐ أعلى نتيجة: ${utils.storage.getHighScore()}</div>
            </div>
            <div id="gameScreen" class="screen hidden">
                <canvas id="gameCanvas" width="800" height="500"></canvas>
                <div><button id="pauseBtn" class="btn">⏸️ إيقاف</button></div>
            </div>
            <div id="pauseScreen" class="screen hidden">
                <div class="popup"><h2>متوقف</h2><button id="resumeBtn" class="btn">استئناف</button></div>
            </div>
            <div id="gameOverScreen" class="screen hidden">
                <div class="popup"><h2>انتهت</h2><div id="gameoverStats"></div><button id="restartBtn" class="btn">🔄 العب</button></div>
            </div>
            <div id="settingsScreen" class="screen hidden">
                <div class="popup"><h2>الإعدادات</h2>
                    <label>🎵 صوت: <input type="checkbox" id="soundToggle" ${utils.storage.getSoundEnabled() ? 'checked' : ''}></label>
                    <label>🎶 موسيقى: <input type="checkbox" id="musicToggle" ${utils.storage.getMusicEnabled() ? 'checked' : ''}></label>
                    <label>⚡ صعوبة: <select id="difficultySelect"><option>easy</option><option>normal</option><option>hard</option></select></label>
                    <button id="closeSettings" class="btn">حفظ</button>
                </div>
            </div>
        `;
        document.getElementById('difficultySelect').value = utils.storage.getDifficulty();
        document.getElementById('playBtn').onclick = () => { if (gameManager) gameManager.start(); showScreen('gameScreen'); };
        document.getElementById('settingsBtn').onclick = () => showScreen('settingsScreen');
        document.getElementById('closeSettings').onclick = () => {
            let soundEn = document.getElementById('soundToggle').checked;
            let musicEn = document.getElementById('musicToggle').checked;
            let diff = document.getElementById('difficultySelect').value;
            utils.storage.setDifficulty(diff);
            utils.storage.setSoundEnabled(soundEn);
            utils.storage.setMusicEnabled(musicEn);
            utils.sound.mute(!soundEn);
            utils.sound.setMusicOn(musicEn);
            if (gameManager) gameManager.difficulty = diff;
            showScreen('startScreen');
        };
        document.getElementById('restartBtn') && (document.getElementById('restartBtn').onclick = () => { gameManager.start(); showScreen('gameScreen'); });
        document.getElementById('resumeBtn') && (document.getElementById('resumeBtn').onclick = () => { if (gameManager) gameManager.resume(); showScreen('gameScreen'); });
    }

    function showGameOver(score, high, combo, coins) {
        let div = document.getElementById('gameoverStats');
        if (div) div.innerHTML = `<p>نقاطك: ${Math.floor(score)}</p><p>أعلى: ${high}</p><p>أفضل مسيرة: ${combo}</p><p>عملات: ${coins}</p>`;
        showScreen('gameOverScreen');
    }

    return {
        init: () => { buildMainMenu(); },
        setGameManager: (gm) => { gameManager = gm; },
        showGameOver: showGameOver,
        updateHighScoreDisplay: () => { let el = document.querySelector('#startScreen .stats'); if(el) el.innerHTML = `⭐ أعلى نتيجة: ${utils.storage.getHighScore()}`; }
    };
})();
