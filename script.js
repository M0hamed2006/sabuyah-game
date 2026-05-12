/**
 * ═══════════════════════════════════════════════════════════════
 * لعبة صابويه - النسخة الاحترافية 2.0
 * The Small Programmer: محمد رجب عبد المنعم
 * ═══════════════════════════════════════════════════════════════
 */

// ==================== إعدادات العام ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// تحديث حجم الـ Canvas بناءً على الشاشة
function resizeCanvas() {
    const container = document.querySelector('.game-wrapper');
    const maxWidth = Math.min(800, window.innerWidth - 40);
    const maxHeight = Math.min(600, window.innerHeight - 200);
    
    canvas.width = maxWidth;
    canvas.height = maxHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ==================== متغيرات اللعبة ====================
let gameState = 'menu'; // menu, playing, gameOver, settings, developer
let score = 0;
let highScore = localStorage.getItem('sabuyahHighScore') || 0;
let gameRunning = false;
let frameCount = 0;
let baseSpeed = 5;
let gameSpeed = baseSpeed;
let difficulty = localStorage.getItem('sabuyahDifficulty') || 'normal';
let soundEnabled = localStorage.getItem('sabuyahSound') !== 'false';
let vibrationEnabled = localStorage.getItem('sabuyahVibration') !== 'false';

// إحصائيات اللعبة
let gameStats = {
    obstaclesAvoided: 0,
    coinsCollected: 0,
    powerUpsCollected: 0,
    maxCombo: 0,
    currentCombo: 0,
    playTime: 0
};

// ==================== الألوان والثوابت ====================
const COLORS = {
    player: '#ff6600',
    obstacle: '#4a4a5a',
    coin: '#ffd700',
    powerUp: '#00d2fc',
    background: '#1e3a2f',
    lane: '#ffffff',
    text: '#ffffff'
};

const LANE_WIDTH = canvas.width / 3;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 50;
const OBSTACLE_WIDTH = 40;
const OBSTACLE_HEIGHT = 50;
const COIN_SIZE = 20;

const LANES = [
    LANE_WIDTH / 2 - PLAYER_WIDTH / 2,
    LANE_WIDTH + LANE_WIDTH / 2 - PLAYER_WIDTH / 2,
    LANE_WIDTH * 2 + LANE_WIDTH / 2 - PLAYER_WIDTH / 2
];

// ==================== كلاس اللاعب ====================
class Player {
    constructor() {
        this.x = LANES[1];
        this.y = canvas.height - PLAYER_HEIGHT - 30;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.lane = 1;
        this.isJumping = false;
        this.isDucking = false;
        this.jumpVelocity = 0;
        this.gravity = 0.6;
        this.originalY = this.y;
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.jetpackActive = false;
        this.jetpackTime = 0;
    }

    moveLeft() {
        if (this.lane > 0) {
            this.lane--;
            this.x = LANES[this.lane];
            soundManager.playClickSound();
        }
    }

    moveRight() {
        if (this.lane < 2) {
            this.lane++;
            this.x = LANES[this.lane];
            soundManager.playClickSound();
        }
    }

    jump() {
        if (!this.isJumping && !this.isDucking) {
            this.isJumping = true;
            this.jumpVelocity = -15;
            soundManager.playJumpSound();
        }
    }

    duck() {
        if (!this.isJumping) {
            this.isDucking = true;
            soundManager.playSlideSound();
        }
    }

    standUp() {
        this.isDucking = false;
    }

    activateJetpack(duration = 300) {
        this.jetpackActive = true;
        this.jetpackTime = duration;
        this.y = this.originalY - 100; // الطيران لأعلى
    }

    updatePhysics() {
        // تحديث الجيتباك
        if (this.jetpackActive) {
            this.jetpackTime--;
            if (this.jetpackTime <= 0) {
                this.jetpackActive = false;
            } else {
                this.y = this.originalY - 80 + Math.sin(frameCount * 0.1) * 10;
            }
        }

        // الجاذبية العادية
        if (this.isJumping && !this.jetpackActive) {
            this.y += this.jumpVelocity;
            this.jumpVelocity += this.gravity;

            if (this.y >= this.originalY) {
                this.y = this.originalY;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        } else if (!this.jetpackActive && this.y !== this.originalY) {
            this.y = this.originalY;
        }

        // تحديث وقت عدم القابلية للإصابة
        if (this.invulnerable) {
            this.invulnerableTime--;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }
    }

    draw() {
        ctx.save();

        // رسم ظل
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(this.x, this.originalY + 5, this.width, 5);

        // رسم شرارات الجيتباك
        if (this.jetpackActive) {
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = `rgba(255, 150, 0, ${0.8 - i * 0.3})`;
                const offset = Math.sin(frameCount * 0.15 + i) * 5;
                ctx.fillRect(this.x + 8 + offset, this.y + this.height + i * 5, 24, 4);
            }
        }

        // رسم الجسم الرئيسي
        if (this.isDucking) {
            ctx.fillStyle = '#cc5500';
            ctx.beginPath();
            ctx.roundRect(this.x, this.y + 20, this.width, 30, 8);
            ctx.fill();
        } else {
            ctx.fillStyle = COLORS.player;
            ctx.beginPath();
            ctx.roundRect(this.x, this.y, this.width, this.height, 8);
            ctx.fill();
        }

        // رسم الوجه (العيون)
        ctx.fillStyle = 'white';
        const eyeY = this.y + (this.isDucking ? 10 : 12);
        ctx.beginPath();
        ctx.arc(this.x + 12, eyeY, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 28, eyeY, 4, 0, Math.PI * 2);
        ctx.fill();

        // العيون السوداء
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + 12, eyeY, 2, 0, Math.PI * 2);
        ctx.arc(this.x + 28, eyeY, 2, 0, Math.PI * 2);
        ctx.fill();

        // الابتسامة
        ctx.strokeStyle = '#ffdd99';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + (this.isDucking ? 20 : 28), 6, 0.2, Math.PI - 0.2);
        ctx.stroke();

        // التاج الذهبي
        if (!this.isDucking) {
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(this.x + 10, this.y - 5);
            ctx.lineTo(this.x + 20, this.y - 15);
            ctx.lineTo(this.x + 30, this.y - 5);
            ctx.fill();
            ctx.strokeStyle = '#ffb347';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // رسم الحماية (عند التفعيل)
        if (this.invulnerable) {
            ctx.strokeStyle = `rgba(0, 210, 252, ${0.5 + Math.sin(frameCount * 0.1) * 0.3})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(this.x - 5, this.y - 5, this.width + 10, this.height + 10, 10);
            ctx.stroke();
        }

        ctx.restore();
    }
}

// ==================== كلاس العقبات ====================
class Obstacle {
    constructor(lane, type = 'train') {
        this.x = LANES[lane] + (PLAYER_WIDTH - OBSTACLE_WIDTH) / 2;
        this.y = -OBSTACLE_HEIGHT;
        this.width = OBSTACLE_WIDTH;
        this.height = OBSTACLE_HEIGHT;
        this.type = type;
        this.speed = gameSpeed;
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';

        if (this.type === 'train') {
            // قطار
            ctx.fillStyle = '#4a4a5a';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(this.x + 5, this.y - 3, 8, 6);
            ctx.fillRect(this.x + this.width - 13, this.y - 3, 8, 6);
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x + 3, this.y + 15, 10, 12);
            ctx.strokeRect(this.x + this.width - 13, this.y + 15, 10, 12);
        } else if (this.type === 'car') {
            // سيارة
            ctx.fillStyle = '#2299ff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x + 5, this.y + 8, 6, 10);
            ctx.fillRect(this.x + this.width - 11, this.y + 8, 6, 10);
            ctx.fillStyle = '#0099ff';
            ctx.fillRect(this.x + 2, this.y + 2, 12, 8);
            ctx.fillRect(this.x + this.width - 14, this.y + 2, 12, 8);
        } else if (this.type === 'barrier') {
            // حاجز
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#654321';
            for (let i = 0; i < 3; i++) {
                ctx.fillRect(this.x + 5 + i * 10, this.y + 5, 6, this.height - 10);
            }
        }

        ctx.restore();
    }

    isOffScreen() {
        return this.y > canvas.height;
    }
}

// ==================== كلاس العملات ====================
class Coin {
    constructor(lane) {
        this.x = LANES[lane] + (PLAYER_WIDTH - COIN_SIZE) / 2 + 10;
        this.y = -COIN_SIZE;
        this.size = COIN_SIZE;
        this.speed = gameSpeed;
        this.rotation = 0;
        this.collected = false;
    }

    update() {
        this.y += this.speed;
        this.rotation += 0.15;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);

        // دائرة ذهبية
        ctx.fillStyle = COLORS.coin;
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // حدود
        ctx.strokeStyle = '#ffb347';
        ctx.lineWidth = 2;
        ctx.stroke();

        // تفاصيل
        ctx.fillStyle = '#ffb347';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);

        ctx.restore();
    }

    isOffScreen() {
        return this.y > canvas.height;
    }
}

// ==================== كلاس العناصر المعززة ====================
class PowerUp {
    constructor(lane, type = 'magnet') {
        this.x = LANES[lane] + (PLAYER_WIDTH - 30) / 2 + 5;
        this.y = -30;
        this.size = 30;
        this.speed = gameSpeed;
        this.type = type; // magnet, jetpack, shield, 2x
        this.rotation = 0;
        this.collected = false;
    }

    update() {
        this.y += this.speed;
        this.rotation += 0.2;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);

        if (this.type === 'magnet') {
            // مغناطيس
            ctx.fillStyle = '#ff6b6b';
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            ctx.fillStyle = '#4ecdc4';
            ctx.fillRect(-this.size / 4, -this.size / 2, this.size / 4, this.size);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🧲', 0, 0);
        } else if (this.type === 'jetpack') {
            // جيتباك
            ctx.fillStyle = '#667eea';
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✈️', 0, 0);
        } else if (this.type === 'shield') {
            // حماية
            ctx.fillStyle = '#00d2fc';
            ctx.beginPath();
            ctx.moveTo(0, -this.size / 2);
            ctx.lineTo(this.size / 2, -this.size / 4);
            ctx.lineTo(this.size / 2, this.size / 2);
            ctx.lineTo(-this.size / 2, this.size / 2);
            ctx.lineTo(-this.size / 2, -this.size / 4);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🛡️', 0, 0);
        } else if (this.type === '2x') {
            // مضاعف
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('×2', 0, 0);
        }

        ctx.restore();
    }

    isOffScreen() {
        return this.y > canvas.height;
    }
}

// ==================== إدارة اللعبة ====================
class GameManager {
    constructor() {
        this.player = new Player();
        this.obstacles = [];
        this.coins = [];
        this.powerUps = [];
        this.scoreMultiplier = 1;
        this.powerUpActive = null;
        this.powerUpTimer = 0;
        this.spawnRate = 60;
        this.startTime = 0;
    }

    update() {
        // تحديث اللاعب
        this.player.updatePhysics();

        // تحديث السرعة بناءً على الصعوبة
        if (difficulty === 'easy') {
            gameSpeed = baseSpeed + Math.floor(score / 1000);
        } else if (difficulty === 'normal') {
            gameSpeed = baseSpeed + Math.floor(score / 500);
        } else {
            gameSpeed = baseSpeed + Math.floor(score / 300);
        }

        gameSpeed = Math.min(gameSpeed, 15);

        // تحديث العقبات
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].update();
            if (this.obstacles[i].isOffScreen()) {
                this.obstacles.splice(i, 1);
                gameStats.obstaclesAvoided++;
            }
        }

        // تحديث العملات
        for (let i = this.coins.length - 1; i >= 0; i--) {
            this.coins[i].update();
            if (this.coins[i].isOffScreen()) {
                this.coins.splice(i, 1);
            }
        }

        // تحديث العناصر المعززة
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            this.powerUps[i].update();
            if (this.powerUps[i].isOffScreen()) {
                this.powerUps.splice(i, 1);
            }
        }

        // تحديث العنصر المعزز النشط
        if (this.powerUpActive) {
            this.powerUpTimer--;
            if (this.powerUpTimer <= 0) {
                this.deactivatePowerUp();
            }
        }

        // Spawn العناصر
        if (frameCount % Math.max(30, Math.floor(this.spawnRate - score / 500)) === 0) {
            this.spawnObstacle();
        }

        if (frameCount % 80 === 0) {
            this.spawnCoin();
        }

        if (frameCount % 150 === 0 && Math.random() > 0.6) {
            this.spawnPowerUp();
        }

        // فحص التصادمات
        this.checkCollisions();
        this.checkCoinCollisions();
        this.checkPowerUpCollisions();

        // تحديث النقاط
        score += this.scoreMultiplier;
        gameStats.playTime++;

        // تحديث عدد المسيرات المتتالية
        if (frameCount % 10 === 0) {
            gameStats.currentCombo++;
            if (gameStats.currentCombo > gameStats.maxCombo) {
                gameStats.maxCombo = gameStats.currentCombo;
            }
        }

        frameCount++;
    }

    spawnObstacle() {
        const lane = Math.floor(Math.random() * 3);
        const types = ['train', 'car', 'barrier', 'train', 'car']; // نسب مختلفة
        const type = types[Math.floor(Math.random() * types.length)];
        this.obstacles.push(new Obstacle(lane, type));
    }

    spawnCoin() {
        const lane = Math.floor(Math.random() * 3);
        this.coins.push(new Coin(lane));
    }

    spawnPowerUp() {
        const lane = Math.floor(Math.random() * 3);
        const types = ['magnet', 'jetpack', 'shield', '2x'];
        const weights = [0.3, 0.3, 0.2, 0.2];
        let random = Math.random();
        let type = types[0];
        
        let sum = 0;
        for (let i = 0; i < weights.length; i++) {
            sum += weights[i];
            if (random <= sum) {
                type = types[i];
                break;
            }
        }
        
        this.powerUps.push(new PowerUp(lane, type));
    }

    checkCollisions() {
        for (let obstacle of this.obstacles) {
            if (this.isColliding(this.player, obstacle)) {
                if (!this.player.invulnerable) {
                    endGame();
                    return;
                }
            }
        }
    }

    checkCoinCollisions() {
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            const distance = Math.hypot(
                (this.player.x + PLAYER_WIDTH / 2) - (coin.x + COIN_SIZE / 2),
                (this.player.y + PLAYER_HEIGHT / 2) - (coin.y + COIN_SIZE / 2)
            );

            if (distance < PLAYER_WIDTH / 2 + COIN_SIZE / 2) {
                this.coins.splice(i, 1);
                score += 10 * this.scoreMultiplier;
                gameStats.coinsCollected++;
                soundManager.playCoinSound();
            }
        }
    }

    checkPowerUpCollisions() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (this.isColliding(this.player, powerUp)) {
                this.activatePowerUp(powerUp.type);
                this.powerUps.splice(i, 1);
                soundManager.playPowerUpSound();
                gameStats.powerUpsCollected++;
            }
        }
    }

    isColliding(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    activatePowerUp(type) {
        this.powerUpActive = type;
        this.powerUpTimer = 300; // 5 ثواني بـ 60 FPS

        if (type === 'magnet') {
            this.collectNearbyCoins();
        } else if (type === 'jetpack') {
            this.player.activateJetpack();
        } else if (type === 'shield') {
            this.player.invulnerable = true;
            this.player.invulnerableTime = 300;
        } else if (type === '2x') {
            this.scoreMultiplier = 2;
        }
    }

    deactivatePowerUp() {
        this.powerUpActive = null;
        this.scoreMultiplier = 1;
        this.player.invulnerable = false;
    }

    collectNearbyCoins() {
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            const distance = Math.hypot(
                (this.player.x + PLAYER_WIDTH / 2) - (coin.x + COIN_SIZE / 2),
                (this.player.y + PLAYER_HEIGHT / 2) - (coin.y + COIN_SIZE / 2)
            );

            if (distance < 150) {
                score += 10 * this.scoreMultiplier;
                this.coins.splice(i, 1);
                gameStats.coinsCollected++;
                soundManager.playCoinSound();
            }
        }
    }

    reset() {
        this.player = new Player();
        this.obstacles = [];
        this.coins = [];
        this.powerUps = [];
        this.scoreMultiplier = 1;
        this.powerUpActive = null;
        this.powerUpTimer = 0;
        score = 0;
        frameCount = 0;
        gameStats = {
            obstaclesAvoided: 0,
            coinsCollected: 0,
            powerUpsCollected: 0,
            maxCombo: 0,
            currentCombo: 0,
            playTime: 0
        };
    }

    draw() {
        // رسم الخلفية
        this.drawBackground();

        // رسم العقبات
        for (let obstacle of this.obstacles) {
            obstacle.draw();
        }

        // رسم العملات
        for (let coin of this.coins) {
            coin.draw();
        }

        // رسم العناصر المعززة
        for (let powerUp of this.powerUps) {
            powerUp.draw();
        }

        // رسم اللاعب
        this.player.draw();

        // رسم معلومات العنصر المعزز النشط
        this.drawActivePowerUp();
    }

    drawBackground() {
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // خطوط المسارات
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 30]);

        for (let i = 1; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(i * LANE_WIDTH, 0);
            ctx.lineTo(i * LANE_WIDTH, canvas.height);
            ctx.stroke();
        }

        ctx.setLineDash([]);
    }

    drawActivePowerUp() {
        if (!this.powerUpActive) return;

        const x = 10;
        const y = 10;
        const width = 150;
        const height = 40;

        // خلفية
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, width, height);

        // حدود
        ctx.strokeStyle = '#00d2fc';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // النص
        ctx.fillStyle = '#00d2fc';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`${this.powerUpActive} - ${Math.ceil(this.powerUpTimer / 60)}ث`, x + 10, y + 28);
    }
}

// ==================== التحكم واللعبة ====================
let gameManager = new GameManager();

// دالة بدء اللعبة
function startGame() {
    gameState = 'playing';
    gameRunning = true;
    gameManager.reset();
    document.getElementById('gameScreen').classList.add('active');
    document.getElementById('startScreen').classList.remove('active');
    soundManager.playBackgroundMusic();
    gameLoop();
}

// دالة انتهاء اللعبة
function endGame() {
    gameRunning = false;
    gameState = 'gameOver';
    soundManager.playGameOverSound();

    if (navigator.vibrate && vibrationEnabled) {
        navigator.vibrate([200, 100, 200]);
    }

    if (Math.floor(score) > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('sabuyahHighScore', highScore);
    }

    showGameOverScreen();
}

// دالة عرض شاشة النهاية
function showGameOverScreen() {
    document.getElementById('finalScore').textContent = Math.floor(score);
    document.getElementById('finalHighScore').textContent = highScore;
    document.getElementById('finalObstacles').textContent = gameStats.obstaclesAvoided;
    document.getElementById('finalCombo').textContent = gameStats.maxCombo;

    // إنشاء الإنجازات
    const achievements = [];
    if (gameStats.coinsCollected > 100) achievements.push('💰 جامع العملات');
    if (gameStats.obstaclesAvoided > 50) achievements.push('🏃 رياضي محترف');
    if (score > 5000) achievements.push('🔥 محترق');
    if (gameStats.maxCombo > 30) achievements.push('⚡ البرق');

    const achievementsList = document.getElementById('achievementsList');
    achievementsList.innerHTML = '';
    achievements.forEach(ach => {
        const badge = document.createElement('div');
        badge.className = 'achievement-badge';
        badge.textContent = ach;
        achievementsList.appendChild(badge);
    });

    document.getElementById('gameOverScreen').classList.add('active');
    document.getElementById('gameScreen').classList.remove('active');
}

// ==================== حلقة اللعبة الرئيسية ====================
function gameLoop() {
    if (!gameRunning) return;

    // تحديث
    gameManager.update();

    // رسم
    gameManager.draw();

    // تحديث واجهة المستخدم
    document.getElementById('score').textContent = Math.floor(score);
    document.getElementById('highScore').textContent = highScore;
    document.getElementById('speedLevel').textContent = Math.floor(score / 500) + 1;

    requestAnimationFrame(gameLoop);
}

// ==================== التحكمات ====================
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (!gameRunning) return;

    if (e.key === 'ArrowLeft') {
        gameManager.player.moveLeft();
    } else if (e.key === 'ArrowRight') {
        gameManager.player.moveRight();
    } else if (e.key === 'ArrowUp') {
        gameManager.player.jump();
    } else if (e.key === 'ArrowDown') {
        gameManager.player.duck();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;

    if (e.key === 'ArrowDown') {
        gameManager.player.standUp();
    }
});

// التحكم باللمس
let touchStartX = 0;
let lastTouchTime = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    lastTouchTime = Date.now();
});

canvas.addEventListener('touchmove', (e) => {
    if (!gameRunning) return;
    
    const touchX = e.touches[0].clientX;
    const diff = touchX - touchStartX;

    if (Math.abs(diff) > 30) {
        if (diff < 0) {
            gameManager.player.moveRight();
        } else {
            gameManager.player.moveLeft();
        }
        touchStartX = touchX;
    }
}, false);

canvas.addEventListener('touchend', (e) => {
    if (!gameRunning) return;
    
    const touchDuration = Date.now() - lastTouchTime;
    
    if (touchDuration < 200) {
        gameManager.player.jump();
    }
});

// ==================== إدارة الشاشات ====================
document.getElementById('playBtn').addEventListener('click', startGame);

document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('startScreen').classList.remove('active');
    document.getElementById('settingsScreen').classList.add('active');
});

document.getElementById('developerBtn').addEventListener('click', () => {
    document.getElementById('startScreen').classList.remove('active');
    document.getElementById('developerScreen').classList.add('active');
});

document.getElementById('backBtn').addEventListener('click', () => {
    localStorage.setItem('sabuyahDifficulty', document.getElementById('difficultySelect').value);
    localStorage.setItem('sabuyahSound', document.getElementById('soundToggle').checked);
    localStorage.setItem('sabuyahVibration', document.getElementById('vibrationToggle').checked);
    
    difficulty = document.getElementById('difficultySelect').value;
    
    if (document.getElementById('soundToggle').checked && !soundEnabled) {
        soundManager.unmute();
        soundEnabled = true;
    } else if (!document.getElementById('soundToggle').checked && soundEnabled) {
        soundManager.mute();
        soundEnabled = false;
    }
    
    document.getElementById('settingsScreen').classList.remove('active');
    document.getElementById('startScreen').classList.add('active');
});

document.getElementById('backBtn2').addEventListener('click', () => {
    document.getElementById('developerScreen').classList.remove('active');
    document.getElementById('startScreen').classList.add('active');
});

document.getElementById('retryBtn').addEventListener('click', startGame);

document.getElementById('homeBtn').addEventListener('click', () => {
    document.getElementById('gameOverScreen').classList.remove('active');
    document.getElementById('startScreen').classList.add('active');
    document.getElementById('startHighScore').textContent = highScore;
});

// تحديث مستوى الصوت
document.getElementById('volumeSlider').addEventListener('input', (e) => {
    soundManager.setVolume(e.target.value);
    document.getElementById('volumeValue').textContent = e.target.value + '%';
});

// كتم الصوت
document.getElementById('soundToggle').addEventListener('change', (e) => {
    if (e.target.checked) {
        soundManager.unmute();
        soundEnabled = true;
    } else {
        soundManager.mute();
        soundEnabled = false;
    }
});

// تحميل الإعدادات المحفوظة
document.getElementById('difficultySelect').value = difficulty;
document.getElementById('soundToggle').checked = soundEnabled;
document.getElementById('vibrationToggle').checked = vibrationEnabled;
document.getElementById('startHighScore').textContent = highScore;

// إضافة دعم roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        return this;
    };
}
