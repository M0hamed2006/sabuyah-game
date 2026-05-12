/**
 * لعبة صابويه المتقدمة - Subway Surfers Style
 * منظمة OOP مع ميكانيكيات متطورة
 */

// ==================== إعدادات اللعبة ====================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// أبعاد العناصر
const LANE_WIDTH = canvas.width / 3;      // كل مسار 266 بكسل
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 40;
const OBSTACLE_WIDTH = 35;
const OBSTACLE_HEIGHT = 45;

// المسارات (0 = يسار, 1 = وسط, 2 = يمين)
const LANES = [LANE_WIDTH / 2 - PLAYER_WIDTH/2, 
               LANE_WIDTH + LANE_WIDTH/2 - PLAYER_WIDTH/2, 
               LANE_WIDTH*2 + LANE_WIDTH/2 - PLAYER_WIDTH/2];

// حالة اللعبة
let gameRunning = true;
let score = 0;
let highScore = localStorage.getItem('sabuyahHighScore') || 0;
let speed = 5;
let baseSpeed = 5;
let frameCounter = 0;
let animationId;

// ==================== كلاس اللاعب ====================
class Player {
    constructor() {
        this.x = LANES[1];      // يبدأ في المسار الأوسط
        this.y = canvas.height - PLAYER_HEIGHT - 20;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.lane = 1;           // 0,1,2
        this.isJumping = false;
        this.isDucking = false;
        this.jumpVelocity = 0;
        this.gravity = 0.8;
        this.originalY = this.y;
    }

    moveLeft() {
        if (this.lane > 0 && !this.isJumping) {
            this.lane--;
            this.x = LANES[this.lane];
        }
    }

    moveRight() {
        if (this.lane < 2 && !this.isJumping) {
            this.lane++;
            this.x = LANES[this.lane];
        }
    }

    jump() {
        if (!this.isJumping && !this.isDucking) {
            this.isJumping = true;
            this.jumpVelocity = -12;
        }
    }

    duck() {
        if (!this.isJumping) {
            this.isDucking = true;
            this.height = PLAYER_HEIGHT / 2;
            this.y = this.originalY + PLAYER_HEIGHT/2;
        }
    }

    stand() {
        this.isDucking = false;
        this.height = PLAYER_HEIGHT;
        this.y = this.originalY;
    }

    updatePhysics() {
        if (this.isJumping) {
            this.y += this.jumpVelocity;
            this.jumpVelocity += this.gravity;
            
            if (this.y >= this.originalY) {
                this.y = this.originalY;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        }
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = "gold";
        
        // جسم صابويه
        ctx.fillStyle = this.isDucking ? '#cc5500' : '#ff6600';
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 12);
        ctx.fill();
        
        // الوش
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 12, 5, 0, Math.PI*2);
        ctx.arc(this.x + this.width - 10, this.y + 12, 5, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + 9, this.y + 11, 2, 0, Math.PI*2);
        ctx.arc(this.x + this.width - 11, this.y + 11, 2, 0, Math.PI*2);
        ctx.fill();
        
        // ابتسامة
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + 22, 8, 0.1, Math.PI - 0.1);
        ctx.strokeStyle = '#ffdd99';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // تاج الفرعون
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(this.x + this.width/2 - 12, this.y - 3);
        ctx.lineTo(this.x + this.width/2, this.y - 15);
        ctx.lineTo(this.x + this.width/2 + 12, this.y - 3);
        ctx.fill();
        
        ctx.restore();
    }
}

// ==================== كلاس العقبات ====================
class Obstacle {
    constructor(lane, type) {
        this.x = LANES[lane] + (PLAYER_WIDTH - OBSTACLE_WIDTH) / 2;
        this.y = canvas.height - OBSTACLE_HEIGHT - 20;
        this.width = OBSTACLE_WIDTH;
        this.height = OBSTACLE_HEIGHT;
        this.type = type;    // 'train', 'barrier', 'car'
    }

    draw() {
        if (this.type === 'train') {
            ctx.fillStyle = '#4a4a5a';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(this.x + 5, this.y - 3, 8, 6);
            ctx.fillRect(this.x + this.width - 13, this.y - 3, 8, 6);
        } else if (this.type === 'car') {
            ctx.fillStyle = '#2299ff';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x + 5, this.y + 5, 6, 8);
            ctx.fillRect(this.x + this.width - 11, this.y + 5, 6, 8);
        } else {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// ==================== كلاس العناصر المعززة (Power-Ups) ====================
class PowerUp {
    constructor(lane, type) {
        this.x = LANES[lane] + (PLAYER_WIDTH - 25) / 2;
        this.y = canvas.height - 35 - 20;
        this.width = 25;
        this.height = 25;
        this.type = type;    // 'magnet', 'jetpack', '2x'
        this.collected = false;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 6;
        ctx.shadowColor = "cyan";
        
        if (this.type === 'magnet') {
            ctx.fillStyle = '#ffaa44';
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = "18px Arial";
            ctx.fillText("🧲", this.x + 3, this.y + 20);
        } else if (this.type === 'jetpack') {
            ctx.fillStyle = '#44aaff';
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = "18px Arial";
            ctx.fillText("✈️", this.x + 3, this.y + 20);
        } else {
            ctx.fillStyle = '#ff44cc';
            ctx.beginPath();
            ctx.rect(this.x, this.y, this.width, this.height);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = "18px Arial";
            ctx.fillText("×2", this.x + 5, this.y + 20);
        }
        
        ctx.restore();
    }
}

// ==================== عناصر اللعبة الرئيسية ====================
let player = new Player();
let obstacles = [];
let powerups = [];
let powerUpActive = null;
let powerUpTimer = 0;
let scoreMultiplier = 1;

// ==================== دوال اللعبة الأساسية ====================
function spawnObstacle() {
    const lane = Math.floor(Math.random() * 3);
    const types = ['train', 'car', 'barrier'];
    const type = types[Math.floor(Math.random() * types.length)];
    obstacles.push(new Obstacle(lane, type));
}

function spawnPowerUp() {
    if (Math.random() < 0.3) {
        const lane = Math.floor(Math.random() * 3);
        const types = ['magnet', 'jetpack', '2x'];
        const type = types[Math.floor(Math.random() * types.length)];
        powerups.push(new PowerUp(lane, type));
    }
}

function checkCollisions() {
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        if (player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y) {
            gameOver();
            return;
        }
    }
}

function checkPowerUpCollisions() {
    for (let i = 0; i < powerups.length; i++) {
        const p = powerups[i];
        if (!p.collected &&
            player.x < p.x + p.width &&
            player.x + player.width > p.x &&
            player.y < p.y + p.height &&
            player.y + player.height > p.y) {
            
            p.collected = true;
            powerUpActive = p.type;
            powerUpTimer = 300;  // 5 ثواني (60fps)
            
            if (p.type === '2x') {
                scoreMultiplier = 2;
            }
            
            powerups.splice(i, 1);
            i--;
        }
    }
    
    if (powerUpActive && powerUpTimer > 0) {
        powerUpTimer--;
        if (powerUpTimer <= 0) {
            powerUpActive = null;
            scoreMultiplier = 1;
        }
    }
}

function updateScore() {
    score++;
    document.getElementById('score').innerText = Math.floor(score);
}

function updateSpeed() {
    // زيادة السرعة كل 500 نقطة
    speed = baseSpeed + Math.floor(score / 500);
    speed = Math.min(speed, 15);  // الحد الأقصى 15
    document.getElementById('speedLevel').innerText = Math.floor(score / 500) + 1;
}

function drawBackground() {
    // رسم الخطوط البيضاء للمسارات
    ctx.strokeStyle = '#ffffffee';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 30]);
    
    for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * LANE_WIDTH, 0);
        ctx.lineTo(i * LANE_WIDTH, canvas.height);
        ctx.stroke();
    }
    
    ctx.setLineDash([]);
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    // حفظ أعلى نتيجة
    if (Math.floor(score) > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('sabuyahHighScore', highScore);
        document.getElementById('highScore').innerText = highScore;
    }
    
    alert(`🔥 انتهت اللعبة 🔥\nنقاطك: ${Math.floor(score)}\nأعلى نتيجة: ${highScore}`);
    restartGame();
}

function restartGame() {
    gameRunning = true;
    score = 0;
    speed = baseSpeed;
    scoreMultiplier = 1;
    powerUpActive = null;
    obstacles = [];
    powerups = [];
    player = new Player();
    
    document.getElementById('score').innerText = "0";
    document.getElementById('speedLevel').innerText = "1";
    
    gameLoop();
}

function updateGame() {
    if (!gameRunning) return;
    
    player.updatePhysics();
    
    // تحريك العقبات (اللعبة تجري واقفة والعقبات هي اللي بتتحرك من فوق)
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].y -= speed;
        if (obstacles[i].y + obstacles[i].height < 0) {
            obstacles.splice(i, 1);
            i--;
        }
    }
    
    for (let i = 0; i < powerups.length; i++) {
        powerups[i].y -= speed;
        if (powerups[i].y + powerups[i].height < 0) {
            powerups.splice(i, 1);
            i--;
        }
    }
    
    // spawn العقبات والعناصر
    if (frameCounter % (Math.max(30, 60 - Math.floor(score/100))) === 0) {
        spawnObstacle();
    }
    
    if (frameCounter % 120 === 0) {
        spawnPowerUp();
    }
    
    frameCounter++;
    
    updateScore();
    updateSpeed();
    checkCollisions();
    checkPowerUpCollisions();
}

function draw() {
    if (!gameRunning) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    
    // رسم جميع العناصر
    for (let obs of obstacles) obs.draw();
    for (let pow of powerups) pow.draw();
    player.draw();
    
    // عرض حالة الـ Power-Up النشط
    if (powerUpActive) {
        ctx.fillStyle = '#000000aa';
        ctx.fillRect(canvas.width - 100, 20, 90, 30);
        ctx.fillStyle = '#ffd700';
        ctx.font = "bold 14px Arial";
        ctx.fillText(`${powerUpActive === 'magnet' ? '🧲 مغناطيس' : powerUpActive === 'jetpack' ? '✈️ طيران' : '×2 مضاعف'} ${Math.ceil(powerUpTimer/60)}ث`, canvas.width - 95, 42);
    }
}

function gameLoop() {
    if (!gameRunning) return;
    updateGame();
    draw();
    animationId = requestAnimationFrame(gameLoop);
}

// ==================== التحكمات ====================
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            player.moveLeft();
            break;
        case 'ArrowRight':
            player.moveRight();
            break;
        case 'ArrowUp':
            player.jump();
            break;
        case 'ArrowDown':
            player.duck();
            break;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowDown') {
        player.stand();
    }
});

document.getElementById('restartBtn').addEventListener('click', () => {
    if (animationId) cancelAnimationFrame(animationId);
    restartGame();
});

// ==================== دالة مساعدة لـ roundRect ====================
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.moveTo(x+r, y);
        this.lineTo(x+w-r, y);
        this.quadraticCurveTo(x+w, y, x+w, y+r);
        this.lineTo(x+w, y+h-r);
        this.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
        this.lineTo(x+r, y+h);
        this.quadraticCurveTo(x, y+h, x, y+h-r);
        this.lineTo(x, y+r);
        this.quadraticCurveTo(x, y, x+r, y);
        return this;
    };
}

// بدء اللعبة
document.getElementById('highScore').innerText = highScore;
gameLoop();
