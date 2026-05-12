// إعدادات اللعبة
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// أبعاد اللاعب
const PLAYER_SIZE = 40;
const ITEM_SIZE = 30;

// متغيرات اللعبة
let score = 0;
let lives = 3;
let timeLeft = 30;
let gameRunning = true;
let animationId;

// اللاعب (صابويه)
let player = {
    x: canvas.width / 2 - PLAYER_SIZE/2,
    y: canvas.height / 2 - PLAYER_SIZE/2,
    speed: 6
};

// الأجسام (أهداف وعقبات)
let items = [];

// مفاتيح التحكم
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

// دوال مساعدة
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// إضافة جسم جديد
function spawnItem() {
    const type = Math.random() < 0.6 ? 'good' : 'bad'; // 60% good, 40% bad
    items.push({
        x: random(0, canvas.width - ITEM_SIZE),
        y: random(0, canvas.height - ITEM_SIZE),
        type: type,
        size: ITEM_SIZE
    });
}

// رسم اللاعب
function drawPlayer() {
    // صابويه بشكل دائري مع تاج
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = "gold";
    
    // الجسم الرئيسي
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.arc(player.x + PLAYER_SIZE/2, player.y + PLAYER_SIZE/2, PLAYER_SIZE/2, 0, Math.PI * 2);
    ctx.fill();
    
    // الوش
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x + PLAYER_SIZE/2 - 8, player.y + PLAYER_SIZE/2 - 5, 5, 0, Math.PI * 2);
    ctx.arc(player.x + PLAYER_SIZE/2 + 8, player.y + PLAYER_SIZE/2 - 5, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.x + PLAYER_SIZE/2 - 8, player.y + PLAYER_SIZE/2 - 6, 2, 0, Math.PI * 2);
    ctx.arc(player.x + PLAYER_SIZE/2 + 8, player.y + PLAYER_SIZE/2 - 6, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // ابتسامة
    ctx.beginPath();
    ctx.arc(player.x + PLAYER_SIZE/2, player.y + PLAYER_SIZE/2 + 5, 12, 0.1, Math.PI - 0.1);
    ctx.strokeStyle = '#ffdd99';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // تاج
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(player.x + PLAYER_SIZE/2 - 10, player.y + 5);
    ctx.lineTo(player.x + PLAYER_SIZE/2, player.y - 8);
    ctx.lineTo(player.x + PLAYER_SIZE/2 + 10, player.y + 5);
    ctx.fill();
    
    ctx.restore();
}

// رسم الأجسام
function drawItems() {
    for (let item of items) {
        ctx.save();
        ctx.shadowBlur = 5;
        if (item.type === 'good') {
            // نجمة ذهبية
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.arc(item.x + ITEM_SIZE/2, item.y + ITEM_SIZE/2, ITEM_SIZE/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffaa00';
            ctx.font = `${ITEM_SIZE}px Arial`;
            ctx.fillText("⭐", item.x + 5, item.y + ITEM_SIZE - 5);
        } else {
            // شوكة/صاعق
            ctx.fillStyle = '#990000';
            ctx.beginPath();
            ctx.arc(item.x + ITEM_SIZE/2, item.y + ITEM_SIZE/2, ITEM_SIZE/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.font = `${ITEM_SIZE}px Arial`;
            ctx.fillText("💀", item.x + 5, item.y + ITEM_SIZE - 5);
        }
        ctx.restore();
    }
}

// تحديث موقع اللاعب
function updatePlayer() {
    if (keys.ArrowUp && player.y > 0) player.y -= player.speed;
    if (keys.ArrowDown && player.y < canvas.height - PLAYER_SIZE) player.y += player.speed;
    if (keys.ArrowLeft && player.x > 0) player.x -= player.speed;
    if (keys.ArrowRight && player.x < canvas.width - PLAYER_SIZE) player.x += player.speed;
}

// كشف التصادم
function checkCollisions() {
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (player.x < item.x + ITEM_SIZE &&
            player.x + PLAYER_SIZE > item.x &&
            player.y < item.y + ITEM_SIZE &&
            player.y + PLAYER_SIZE > item.y) {
            
            // تصادم حصل
            if (item.type === 'good') {
                score += 10;
                document.getElementById('score').innerText = score;
            } else {
                lives -= 1;
                document.getElementById('lives').innerText = lives;
                if (lives <= 0) {
                    gameOver();
                }
            }
            
            // إزالة الجسم
            items.splice(i, 1);
            i--;
        }
    }
}

// نهاية اللعبة
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    alert(`انتهت اللعبة!\nنقاطك: ${score}\nنعم انت فاشل 😂`);
    restartGame();
}

// إعادة التشغيل
function restartGame() {
    score = 0;
    lives = 3;
    timeLeft = 30;
    gameRunning = true;
    items = [];
    player.x = canvas.width / 2 - PLAYER_SIZE/2;
    player.y = canvas.height / 2 - PLAYER_SIZE/2;
    
    document.getElementById('score').innerText = score;
    document.getElementById('lives').innerText = lives;
    document.getElementById('time').innerText = timeLeft;
    
    // فاصل إذا كان في مؤقت شغال
    if (window.timerInterval) clearInterval(window.timerInterval);
    startTimer();
}

// المؤقت
function startTimer() {
    window.timerInterval = setInterval(() => {
        if (gameRunning && timeLeft > 0) {
            timeLeft--;
            document.getElementById('time').innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(window.timerInterval);
                gameRunning = false;
                cancelAnimationFrame(animationId);
                alert(`مبروك! خلصت الوقت\nنقاطك: ${score}\nانت بطل! 🎉`);
                restartGame();
            }
        }
    }, 1000);
}

// الرسم الرئيسي
function draw() {
    if (!gameRunning) return;
    
    // مسح الشاشة
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // رسم الشبكة الخلفية
    ctx.strokeStyle = '#5a9e6e';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
    
    drawItems();
    drawPlayer();
}

// حلقة اللعبة الرئيسية
function gameLoop() {
    if (!gameRunning) return;
    
    updatePlayer();
    checkCollisions();
    draw();
    
    // تكرار spawn الأجسام
    if (Math.random() < 0.02 && items.length < 15) {
        spawnItem();
    }
    
    animationId = requestAnimationFrame(gameLoop);
}

// التحكم عبر الكيبورد
document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
        e.preventDefault();
    }
});

// زر إعادة التشغيل
document.getElementById('restartBtn').addEventListener('click', () => {
    if (window.timerInterval) clearInterval(window.timerInterval);
    cancelAnimationFrame(animationId);
    restartGame();
    gameRunning = true;
    gameLoop();
});

// بدء اللعبة
spawnItem();
spawnItem();
spawnItem();
startTimer();
gameLoop();
