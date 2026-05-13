const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Settings & Globals
let width, height, pixelRatio;
let gameRunning = false;
let paused = false;
let score = 0;
let coins = 0;
let highscore = localStorage.getItem('sabuyah_high') || 0;
let attempts = localStorage.getItem('sabuyah_attempts') || 0;

// Game Config
const CONFIG = {
    laneCount: 3,
    playerBaseY: 0.8, // 80% down
    speedBase: 8,
    speedMax: 22,
    gravity: 0.6
};

// Colors
const PALETTE = {
    gold: '#ffcc00',
    neon: '#00f2ff',
    player: '#ffffff',
    track: '#1a1a1a',
    trackLines: '#333333'
};

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.alpha = 1;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
        this.alpha -= 0.02;
    }
    draw(ctx) {
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Player {
    constructor() {
        this.lane = 1;
        this.targetX = 0;
        this.currentX = 0;
        this.y = 0;
        this.vy = 0;
        this.isJumping = false;
        this.w = 40;
        this.h = 60;
    }
    update() {
        const laneWidth = width / CONFIG.laneCount;
        this.targetX = (this.lane * laneWidth) + (laneWidth / 2);
        
        // Smooth Lerp movement
        this.currentX += (this.targetX - this.currentX) * 0.15;

        // Physics
        if (this.isJumping) {
            this.y += this.vy;
            this.vy += CONFIG.gravity;
            if (this.y >= 0) {
                this.y = 0;
                this.isJumping = false;
            }
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.currentX, height * CONFIG.playerBaseY + this.y);
        
        // Draw Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 5, 20, 10, 0, 0, Math.PI*2);
        ctx.fill();

        // Draw Stylized Player (Neon Cube)
        ctx.fillStyle = PALETTE.player;
        ctx.shadowBlur = 20;
        ctx.shadowColor = PALETTE.neon;
        ctx.fillRect(-this.w/2, -this.h, this.w, this.h);
        
        // Face
        ctx.fillStyle = '#000';
        ctx.fillRect(-10, -50, 5, 5);
        ctx.fillRect(5, -50, 5, 5);
        
        ctx.restore();
    }
}

class Obstacle {
    constructor(lane, speed) {
        this.lane = lane;
        this.y = -100;
        this.speed = speed;
        this.w = 50;
        this.h = 80;
        this.color = '#ff4444';
        this.active = true;
    }
    update() { this.y += this.speed; }
    draw(ctx) {
        const laneWidth = width / CONFIG.laneCount;
        const x = (this.lane * laneWidth) + (laneWidth / 2);
        
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillRect(x - this.w/2, this.y, this.w, this.h);
        ctx.shadowBlur = 0;
    }
}

class Coin {
    constructor(lane, speed) {
        this.lane = lane;
        this.y = -100;
        this.speed = speed;
        this.size = 15;
    }
    update() { this.y += speed; }
    draw(ctx) {
        const laneWidth = width / CONFIG.laneCount;
        const x = (this.lane * laneWidth) + (laneWidth / 2);
        ctx.fillStyle = PALETTE.gold;
        ctx.shadowBlur = 10;
        ctx.shadowColor = PALETTE.gold;
        ctx.beginPath();
        ctx.arc(x, this.y, this.size, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

let player = new Player();
let obstacles = [];
let coinsArr = [];
let particles = [];
let speed = CONFIG.speedBase;
let frame = 0;

function resize() {
    pixelRatio = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    ctx.scale(pixelRatio, pixelRatio);
}

function spawn() {
    if (frame % 60 === 0) {
        obstacles.push(new Obstacle(Math.floor(Math.random()*3), speed));
    }
    if (frame % 40 === 0) {
        coinsArr.push(new Coin(Math.floor(Math.random()*3), speed));
    }
}

function checkCollision() {
    const py = height * CONFIG.playerBaseY + player.y;
    const px = player.currentX;

    obstacles.forEach((obs, index) => {
        const ox = (obs.lane * (width/3)) + (width/6);
        if (Math.abs(px - ox) < 40 && Math.abs(py - obs.y) < 50) {
            gameOver();
        }
    });

    coinsArr.forEach((c, index) => {
        const cx = (c.lane * (width/3)) + (width/6);
        if (Math.abs(px - cx) < 30 && Math.abs(py - c.y) < 40) {
            coins++;
            score += 50;
            // Add particles
            for(let i=0; i<8; i++) particles.push(new Particle(cx, c.y, PALETTE.gold));
            coinsArr.splice(index, 1);
            document.getElementById('coinCount').innerText = coins;
        }
    });
}

function update() {
    if (!gameRunning || paused) return;
    
    frame++;
    speed = Math.min(CONFIG.speedMax, CONFIG.speedBase + (score/2000));
    score += Math.floor(speed/5);
    document.getElementById('score').innerText = score;

    player.update();
    spawn();

    obstacles.forEach((o, i) => {
        o.update();
        if (o.y > height) obstacles.splice(i, 1);
    });

    coinsArr.forEach((c, i) => {
        c.y += speed;
        if (c.y > height) coinsArr.splice(i, 1);
    });

    particles.forEach((p, i) => {
        p.update();
        if (p.alpha <= 0) particles.splice(i, 1);
    });

    checkCollision();
}

function draw() {
    ctx.clearRect(0,0,width,height);
    
    // Background / Track
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0,0,width,height);
    
    // Lanes
    ctx.strokeStyle = 'rgba(255,204,0,0.1)';
    ctx.lineWidth = 2;
    for(let i=1; i<CONFIG.laneCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * (width/3), 0);
        ctx.lineTo(i * (width/3), height);
        ctx.stroke();
    }

    obstacles.forEach(o => o.draw(ctx));
    coinsArr.forEach(c => c.draw(ctx));
    particles.forEach(p => p.draw(ctx));
    player.draw(ctx);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

function gameOver() {
    gameRunning = false;
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('sabuyah_high', highscore);
    }
    attempts++;
    localStorage.setItem('sabuyah_attempts', attempts);
    
    document.getElementById('finalScore').innerText = score;
    document.getElementById('finalCoins').innerText = coins;
    document.getElementById('finalHigh').innerText = highscore;
    
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

function start() {
    score = 0; coins = 0; speed = CONFIG.speedBase;
    obstacles = []; coinsArr = []; particles = [];
    player = new Player();
    gameRunning = true;
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
}

// Controls
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && player.lane > 0) player.lane--;
    if (e.key === 'ArrowRight' && player.lane < 2) player.lane++;
    if ((e.key === 'ArrowUp' || e.key === ' ') && !player.isJumping) {
        player.isJumping = true;
        player.vy = -15;
    }
});

// Mobile Swipe
let touchStartX = 0;
window.addEventListener('touchstart', e => touchStartX = e.touches[0].clientX);
window.addEventListener('touchend', e => {
    let diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) {
        if (diff > 0 && player.lane < 2) player.lane++;
        if (diff < 0 && player.lane > 0) player.lane--;
    } else {
        if (!player.isJumping) { player.isJumping = true; player.vy = -15; }
    }
});

document.getElementById('playBtn').onclick = start;
document.getElementById('restartBtn').onclick = start;
document.getElementById('menuFromOverBtn').onclick = () => location.reload();

window.addEventListener('resize', resize);
resize();
loop();

// Init UI
document.getElementById('startHighScore').innerText = highscore;
document.getElementById('totalAttempts').innerText = attempts;
