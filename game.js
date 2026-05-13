'use strict';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let W, H, scale;

// 1. الإعدادات الأساسية
const LANE_COUNT = 5;
const COLORS = {
    player: '#ffcc00',
    enemy: '#ff2200',
    train: '#333',
    coin: '#ffcc00',
    road: '#1a1a1a'
};

let DB = {
    highScore: localStorage.getItem('hs') || 0,
    coins: parseInt(localStorage.getItem('coins')) || 0
};

let G = {
    running: false,
    score: 0,
    coins: 0,
    speed: 5,
    lane: 2,
    playerX: 0,
    playerY: 0,
    jumping: false,
    jumpV: 0,
    sliding: false,
    slideTime: 0,
    enemyDist: 500, // المسافة بينك وبين الغيطي (كل ما تقل يقرب)
    obstacles: [],
    particles: [],
    level: 1,
    levelName: "القاهرة"
};

// 2. تهيئة الكانفاس
function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    scale = W / 500;
    G.playerX = getLaneX(G.lane);
    G.playerY = H * 0.8;
}
window.addEventListener('resize', resize);
resize();

function getLaneX(lane) {
    const laneWidth = W / LANE_COUNT;
    return (lane * laneWidth) + (laneWidth / 2);
}

// 3. التحكم (لمس ولوحة مفاتيح)
window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' && G.lane > 0) G.lane--;
    if (e.key === 'ArrowRight' && G.lane < 4) G.lane++;
    if (e.key === 'ArrowUp' && !G.jumping) { G.jumping = true; G.jumpV = -20; }
    if (e.key === 'ArrowDown') { G.sliding = true; G.slideTime = 40; }
});

// 4. المحرك الرئيسي
function update() {
    if (!G.running) return;

    // زيادة السرعة والصعوبة
    G.speed += 0.001;
    G.score += G.speed / 10;
    
    // الغيطي يقرب لو غلطت
    G.enemyDist = Math.min(1000, G.enemyDist + 0.1); 

    // حركة اللاعب (تنعيم الحركة)
    const targetX = getLaneX(G.lane);
    G.playerX += (targetX - G.playerX) * 0.2;

    // فيزياء القفز
    if (G.jumping) {
        G.playerY += G.jumpV;
        G.jumpV += 1; // جاذبية
        if (G.playerY >= H * 0.8) {
            G.playerY = H * 0.8;
            G.jumping = false;
        }
    }

    // الزحلقة
    if (G.sliding) {
        G.slideTime--;
        if (G.slideTime <= 0) G.sliding = false;
    }

    // توليد العقبات
    if (Math.random() < 0.02) {
        G.obstacles.push({
            x: getLaneX(Math.floor(Math.random() * 5)),
            y: -100,
            type: Math.random() > 0.3 ? 'train' : 'coin',
            id: Date.now()
        });
    }

    // تحريك وتصادم العقبات
    G.obstacles.forEach((ob, index) => {
        ob.y += G.speed;

        // تصادم
        const dist = Math.hypot(ob.x - G.playerX, ob.y - G.playerY);
        if (dist < 40) {
            if (ob.type === 'coin') {
                G.coins++;
                G.obstacles.splice(index, 1);
                if (G.coins % 10 === 0) triggerBigMoney();
            } else if (!G.jumping || ob.y < G.playerY - 20) {
                // خبطت في قطر!
                G.enemyDist -= 200;
                G.obstacles.splice(index, 1);
                if (G.enemyDist <= 0) endGame();
            }
        }

        if (ob.y > H) G.obstacles.splice(index, 1);
    });

    updateUI();
}

function draw() {
    ctx.clearRect(0, 0, W, H);

    // رسم الطريق
    ctx.fillStyle = COLORS.road;
    ctx.fillRect(0, 0, W, H);

    // رسم اللاعب
    ctx.fillStyle = G.sliding ? '#ff8800' : COLORS.player;
    const pSize = G.sliding ? 30 : 50;
    ctx.fillRect(G.playerX - pSize/2, G.playerY - pSize, pSize, pSize);

    // رسم العقبات
    G.obstacles.forEach(ob => {
        ctx.fillStyle = ob.type === 'coin' ? COLORS.coin : COLORS.train;
        if (ob.type === 'coin') {
            ctx.beginPath(); ctx.arc(ob.x, ob.y, 15, 0, Math.PI*2); ctx.fill();
        } else {
            ctx.fillRect(ob.x - 25, ob.y - 80, 50, 80);
        }
    });

    // رسم الغيطي لو قرب
    if (G.enemyDist < 300) {
        ctx.fillStyle = COLORS.enemy;
        ctx.fillRect(G.playerX - 25, G.playerY + G.enemyDist, 50, 50);
    }

    requestAnimationFrame(() => {
        update();
        draw();
    });
}

// 5. وظائف إضافية
function updateUI() {
    document.getElementById('hudScore').innerText = Math.floor(G.score);
    document.getElementById('hudCoins').innerText = G.coins;
    
    const dangerFill = document.getElementById('dangerFill');
    const dangerPct = Math.max(0, 100 - (G.enemyDist / 5));
    dangerFill.style.width = dangerPct + '%';
    document.getElementById('dangerStatus').innerText = dangerPct > 70 ? "بيجري وراك!" : "آمن";
}

function triggerBigMoney() {
    const el = document.getElementById('bigMoneyMsg');
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 2000);
}

function startGame() {
    G.running = true;
    G.score = 0; G.coins = 0; G.speed = 5; G.enemyDist = 500; G.obstacles = [];
    document.getElementById('screenStart').classList.add('hidden');
    document.getElementById('screenHUD').classList.remove('hidden');
    document.getElementById('screenOver').classList.add('hidden');
}

function endGame() {
    G.running = false;
    document.getElementById('screenHUD').classList.add('hidden');
    document.getElementById('screenOver').classList.remove('hidden');
    document.getElementById('ovScore').innerText = Math.floor(G.score);
    document.getElementById('ovCoins').innerText = G.coins;
    
    if (G.score > DB.highScore) {
        DB.highScore = Math.floor(G.score);
        localStorage.setItem('hs', DB.highScore);
    }
    DB.coins += G.coins;
    localStorage.setItem('coins', DB.coins);
}

// أزرار الشاشات
document.getElementById('btnPlay').onclick = startGame;
document.getElementById('btnRestart').onclick = startGame;
document.getElementById('btnHome').onclick = () => location.reload();

draw(); // ابدأ الحلقة
