// ==================== GAME LOOP & MANAGER ====================
window.GameManager = class GameManager {
    constructor(canvas, player, enemy, spawner) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.player = player;
        this.enemy = enemy;
        this.spawner = spawner;
        this.gameRunning = false;
        this.paused = false;
        this.frame = 0;
        this.score = 0;
        this.speed = 5;
        this.multi = 1;
        this.activePower = null;
        this.powerTimer = 0;
        this.coinTotal = 0;
        this.maxCombo = 0;
        this.combo = 0;
        this.difficulty = utils.storage.getDifficulty();
        this.highScore = utils.storage.getHighScore();
    }

    update() {
        if (!this.gameRunning || this.paused) return;
        this.player.update(this.canvas.height);
        this.enemy.update(this.speed);
        let add = Math.floor(this.score / 600);
        if (this.difficulty === 'hard') add = Math.floor(this.score / 300);
        if (this.difficulty === 'easy') add = Math.floor(this.score / 900);
        this.speed = Math.min(15, 5 + add);
        this.spawner.updateAll(this.speed, this.frame);
        this.frame++;

        // فحص التصادمات
        // 1. العقبات
        for (let obs of this.spawner.obstacles) {
            if (utils.collide(this.player, obs)) {
                if (!this.player.invincible) {
                    this.gameOver();
                    return;
                } else {
                    this.spawner.obstacles = this.spawner.obstacles.filter(o => o !== obs);
                    break;
                }
            }
        }
        // 2. العملات
        for (let i=0; i<this.spawner.coins.length; i++) {
            let c = this.spawner.coins[i];
            if (utils.collide(this.player, c)) {
                this.score += 10 * this.multi;
                this.coinTotal++;
                this.spawner.coins.splice(i,1);
                utils.sound.coin();
                i--;
            }
        }
        // 3. الباور يب
        for (let i=0; i<this.spawner.powerups.length; i++) {
            let p = this.spawner.powerups[i];
            if (utils.collide(this.player, p)) {
                this.activatePowerUp(p.kind);
                this.spawner.powerups.splice(i,1);
                i--;
            }
        }
        // 4. العدو
        if (utils.collide(this.player, this.enemy.getRect())) {
            if (!this.player.invincible) {
                this.gameOver();
                return;
            }
        }
        // تحديث الباور يب النشط
        if (this.activePower) {
            this.powerTimer--;
            if (this.powerTimer <= 0) {
                this.activePower = null;
                this.multi = 1;
                if (!this.player.jetpack) this.player.jetpack = false;
            }
        }
        // تأثير المغناطيس
        if (this.activePower === 'magnet') {
            for (let i=0; i<this.spawner.coins.length; i++) {
                let c = this.spawner.coins[i];
                let dx = c.x - this.player.x;
                let dy = c.y - this.player.y;
                if (Math.hypot(dx,dy) < 150) {
                    this.score += 10 * this.multi;
                    this.coinTotal++;
                    this.spawner.coins.splice(i,1);
                    utils.sound.coin();
                    i--;
                }
            }
        }
        this.score += this.multi;
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
    }

    activatePowerUp(kind) {
        this.activePower = kind;
        this.powerTimer = 300;
        if (kind === 'jetpack') this.player.activateJetpack();
        if (kind === 'shield') this.player.activateInvincible(300);
        if (kind === '2x') this.multi = 2;
        utils.sound.powerUp();
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // خلفية
        this.ctx.fillStyle = '#1f4d2f';
        this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
        // خطوط المسارات
        let laneW = this.canvas.width/3;
        this.ctx.strokeStyle = '#ffd70088';
        this.ctx.lineWidth = 2;
        for(let i=1; i<3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i*laneW,0);
            this.ctx.lineTo(i*laneW,this.canvas.height);
            this.ctx.stroke();
        }
        this.spawner.drawAll(this.ctx);
        this.player.draw(this.ctx, this.frame);
        this.enemy.draw(this.ctx);
        // UI داخل اللعبة
        this.ctx.fillStyle = '#000000aa';
        this.ctx.fillRect(10,10,200,40);
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.fillText(`نقاط: ${Math.floor(this.score)}`, 20, 40);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px monospace';
        this.ctx.fillText(`سرعه: ${Math.floor(this.speed-4)+1}`, 20, 70);
        if (this.activePower) {
            this.ctx.fillStyle = '#000000aa';
            this.ctx.fillRect(this.canvas.width-160,10,150,35);
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 14px monospace';
            this.ctx.fillText(`${this.activePower} : ${Math.ceil(this.powerTimer/60)}ث`, this.canvas.width-150, 32);
        }
    }

    gameOver() {
        this.gameRunning = false;
        if (this.score > this.highScore) {
            this.highScore = Math.floor(this.score);
            utils.storage.setHighScore(this.highScore);
        }
        utils.storage.incAttempts();
        utils.sound.gameOver();
        if (window.ui) window.ui.showGameOver(this.score, this.highScore, this.maxCombo, this.coinTotal);
    }

    start() {
        this.gameRunning = true;
        this.paused = false;
        this.frame = 0;
        this.score = 0;
        this.speed = 5;
        this.multi = 1;
        this.activePower = null;
        this.coinTotal = 0;
        this.maxCombo = 0;
        this.combo = 0;
        this.player = new window.Player(this.canvas.width, this.canvas.height);
        this.enemy = new window.Enemy(this.canvas.width, this.canvas.height, this.player);
        this.spawner = new window.Spawner(this.canvas.width, this.canvas.height, this.player.lanesX, () => this.player.lane);
        utils.sound.startMusic();
    }

    pause() { this.paused = true; }
    resume() { this.paused = false; }
};
