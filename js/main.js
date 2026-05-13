// ==================== MAIN ====================
window.addEventListener('load', () => {
    utils.initAudio();
    utils.sound.mute(!utils.storage.getSoundEnabled());
    utils.sound.setMusicOn(utils.storage.getMusicEnabled());

    // بناء واجهة المستخدم
    ui.init();

    // إنشاء عناصر اللعبة (لكن canvas موجود بعد بناء UI)
    let canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    let player = new Player(canvas.width, canvas.height);
    let enemy = new Enemy(canvas.width, canvas.height, player);
    let spawner = new Spawner(canvas.width, canvas.height, player.lanesX, () => player.lane);
    let game = new GameManager(canvas, player, enemy, spawner);
    ui.setGameManager(game);

    // ربط الأحداث العامة
    let gameScreen = document.getElementById('gameScreen');
    let pauseBtn = document.getElementById('pauseBtn');
    if (pauseBtn) pauseBtn.onclick = () => { game.pause(); document.getElementById('pauseScreen').classList.remove('hidden'); };
    document.getElementById('resumeBtn') && (document.getElementById('resumeBtn').onclick = () => { game.resume(); document.getElementById('pauseScreen').classList.add('hidden'); });

    // التحكم بالكيبورد
    window.addEventListener('keydown', (e) => {
        if (!game.gameRunning || game.paused) return;
        if (e.key === 'ArrowLeft') player.moveLeft();
        if (e.key === 'ArrowRight') player.moveRight();
        if (e.key === 'ArrowUp') player.jump();
        if (e.key === 'ArrowDown') player.duck();
        e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { if (e.key === 'ArrowDown') player.stand(); });

    // لمس
    canvas.addEventListener('touchstart', (e) => { /* يمكن إضافة لمس متقدم */ });
    // بدء حلقة الرسم
    function animate() {
        if (game.gameRunning && !game.paused) {
            game.update();
            game.draw();
        } else if (game.gameRunning && game.paused) {
            // فقط ارسم بدون تحديث
            game.draw();
        }
        requestAnimationFrame(animate);
    }
    animate();
});
