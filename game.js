/**
 * صابويه المصري - النسخة المتقدمة
 */
class SoundFX {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.master.gain.value = 0.7;
        this.muted = false;
        this.musicOn = true;
        this.musicInt = null;
    }
    _tone(freq, dur, endFreq) {
        if(this.muted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain); gain.connect(this.master);
        osc.frequency.setValueAtTime(freq, now);
        if(endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, now+dur);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now+dur);
        osc.start(now);
        osc.stop(now+dur);
    }
    _chord(freqs, dur) { freqs.forEach(f=>this._tone(f,dur,f*1.2)); }
    playJump() { this._tone(500,0.12,800); }
    playCoin() { this._tone(900,0.08,1200); }
    playPower() { this._chord([600,750,900],0.2); }
    playGameOver() { this._tone(300,0.4,150); }
    playSlide() { this._tone(400,0.15,250); }
    playClick() { this._tone(1200,0.03,1200); }
    startMusic() {
        if(!this.musicOn || this.muted) return;
        if(this.musicInt) clearInterval(this.musicInt);
        const play = () => {
            if(this.muted || !this.musicOn) return;
            this._tone(262,0.2,330);
            setTimeout(()=>this._tone(330,0.2,392),250);
            setTimeout(()=>this._tone(392,0.3,440),500);
        };
        play();
        this.musicInt = setInterval(play, 3000);
    }
    stopMusic() { if(this.musicInt) clearInterval(this.musicInt); }
    setVol(v) { this.master.gain.value = v/100; }
    toggleMute() { this.muted = !this.muted; }
}
const sound = new SoundFX();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameRunning = false, paused = false, frame = 0, animId;
let score = 0, high = localStorage.getItem('sabuyahHigh') ? parseInt(localStorage.getItem('sabuyahHigh')) : 0;
let attempts = localStorage.getItem('sabuyahAttempts') ? parseInt(localStorage.getItem('sabuyahAttempts')) : 0;
let difficulty = localStorage.getItem('sabuyahDiff') || 'normal';
let soundEn = localStorage.getItem('sabuyahSound') !== 'false';
let musicEn = localStorage.getItem('sabuyahMusic') !== 'false';

const LANE_W = canvas.width/3;
const PLAY_W = 42, PLAY_H = 50;
const OBS_W = 38, OBS_H = 48;
const COIN_S = 24;
let speed = 5;

let lanesX = [
    LANE_W/2 - PLAY_W/2,
    LANE_W + LANE_W/2 - PLAY_W/2,
    LANE_W*2 + LANE_W/2 - PLAY_W/2
];

class Player {
    constructor() {
        this.lane = 1;
        this.x = lanesX[1];
        this.y = canvas.height - PLAY_H - 20;
        this.baseY = this.y;
        this.w = PLAY_W; this.h = PLAY_H;
        this.jumping = false; this.ducking = false;
        this.jv = 0;
        this.inv = false; this.invTimer = 0;
        this.jet = false; this.jetTimer = 0;
    }
    update() {
        if(this.jet) {
            this.jetTimer--;
            if(this.jetTimer<=0) this.jet=false;
            this.y = this.baseY - 70 + Math.sin(Date.now()*0.01)*8;
        } else {
            if(this.jumping) {
                this.y += this.jv;
                this.jv += 0.6;
                if(this.y >= this.baseY) { this.y = this.baseY; this.jumping = false; this.jv = 0; }
            } else this.y = this.baseY;
        }
        if(this.ducking && !this.jumping) { this.h = PLAY_H/2; this.y = this.baseY + PLAY_H/2; }
        else { this.h = PLAY_H; if(!this.jumping && !this.jet) this.y = this.baseY; }
        if(this.inv) { this.invTimer--; if(this.invTimer<=0) this.inv=false; }
    }
    moveLeft() { if(this.lane>0) { this.lane--; this.x=lanesX[this.lane]; sound.playClick(); } }
    moveRight() { if(this.lane<2) { this.lane++; this.x=lanesX[this.lane]; sound.playClick(); } }
    jump() { if(!this.jumping && !this.jet) { this.jumping=true; this.jv=-12; sound.playJump(); } }
    duck() { if(!this.jumping) { this.ducking=true; sound.playSlide(); } }
    stand() { this.ducking=false; }
    activateJet() { this.jet=true; this.jetTimer=300; this.jumping=false; }
    activateInv(d=180) { this.inv=true; this.invTimer=d; }
    draw() {
        ctx.save();
        ctx.fillStyle = this.inv ? (frame%10<5?'#ffaa44':'#ff6600') : '#ff6600';
        ctx.beginPath(); ctx.roundRect(this.x, this.y, this.w, this.h, 12); ctx.fill();
        ctx.fillStyle='#fff';
        ctx.beginPath(); ctx.arc(this.x+12, this.y+14,5,0,Math.PI*2); ctx.arc(this.x+this.w-12, this.y+14,5,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#000';
        ctx.beginPath(); ctx.arc(this.x+11, this.y+13,2,0,Math.PI*2); ctx.arc(this.x+this.w-13, this.y+13,2,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#ffd700';
        ctx.beginPath(); ctx.moveTo(this.x+this.w/2-12, this.y-5); ctx.lineTo(this.x+this.w/2, this.y-18); ctx.lineTo(this.x+this.w/2+12, this.y-5); ctx.fill();
        ctx.restore();
    }
}

class Obstacle {
    constructor(lane) {
        this.x = lanesX[lane] + (PLAY_W - OBS_W)/2;
        this.y = -OBS_H;
        this.w = OBS_W; this.h = OBS_H;
        this.type = Math.random()<0.5 ? 'train' : (Math.random()<0.6 ? 'car' : 'barrier');
    }
    update() { this.y += speed; }
    draw() {
        ctx.fillStyle = this.type==='train' ? '#4a4a5a' : (this.type==='car' ? '#2299ff' : '#8B4513');
        ctx.fillRect(this.x, this.y, this.w, this.h);
        if(this.type==='train') { ctx.fillStyle='#ff4444'; ctx.fillRect(this.x+5,this.y-3,8,6); ctx.fillRect(this.x+this.w-13,this.y-3,8,6); }
        if(this.type==='car') { ctx.fillStyle='#333'; ctx.fillRect(this.x+5,this.y+8,6,10); ctx.fillRect(this.x+this.w-11,this.y+8,6,10); }
    }
    off() { return this.y > canvas.height; }
}

class Coin {
    constructor(lane) {
        this.x = lanesX[lane] + PLAY_W/2 - COIN_S/2;
        this.y = -COIN_S;
        this.s = COIN_S;
    }
    update() { this.y += speed; }
    draw() {
        ctx.fillStyle='#ffd700';
        ctx.beginPath(); ctx.arc(this.x+this.s/2, this.y+this.s/2, this.s/2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle='#b87c00';
        ctx.font=`bold ${this.s-6}px monospace`;
        ctx.fillText('$', this.x+this.s/2-6, this.y+this.s/2+4);
    }
    off() { return this.y > canvas.height; }
}

class PowerUp {
    constructor(lane, kind) {
        this.x = lanesX[lane] + PLAY_W/2 - 18;
        this.y = -28;
        this.s = 28;
        this.kind = kind;
    }
    update() { this.y += speed; }
    draw() {
        ctx.fillStyle = this.kind==='magnet' ? '#ffaa44' : (this.kind==='jetpack' ? '#44aaff' : (this.kind==='shield' ? '#00ffcc' : '#ff44ff'));
        ctx.fillRect(this.x, this.y, this.s, this.s);
        ctx.fillStyle='white';
        ctx.font='bold 18px monospace';
        let emoji = this.kind==='magnet' ? '🧲' : (this.kind==='jetpack' ? '✈️' : (this.kind==='shield' ? '🛡️' : '×2'));
        ctx.fillText(emoji, this.x+4, this.y+22);
    }
    off() { return this.y > canvas.height; }
}

let player = new Player();
let obstacles = [], coins = [], powerups = [];
let activePower = null, powerTimer = 0, multi = 1;
let coinTotal = 0, maxCombo = 0, combo = 0;

function spawnObstacle() { obstacles.push(new Obstacle(Math.floor(Math.random()*3))); }
function spawnCoin() { coins.push(new Coin(Math.floor(Math.random()*3))); }
function spawnPower() { powerups.push(new PowerUp(Math.floor(Math.random()*3), ['magnet','jetpack','shield','2x'][Math.floor(Math.random()*4)])); }
function activatePower(k) {
    activePower = k; powerTimer = 300;
    if(k==='jetpack') player.activateJet();
    if(k==='shield') player.activateInv(300);
    if(k==='2x') multi = 2;
    sound.playPower();
}
function updateMagnet() {
    if(activePower==='magnet') {
        for(let i=0;i<coins.length;i++) {
            let dx = coins[i].x - player.x, dy = coins[i].y - player.y;
            if(Math.hypot(dx,dy) < 150) {
                score += 10 * multi; coinTotal++;
                coins.splice(i,1); sound.playCoin(); i--;
            }
        }
    }
}
function updateGame() {
    if(!gameRunning || paused) return;
    player.update();
    let add = Math.floor(score/600);
    if(difficulty==='hard') add = Math.floor(score/300);
    if(difficulty==='easy') add = Math.floor(score/900);
    speed = Math.min(15, 5 + add);
    document.getElementById('speedValue').innerText = Math.floor(speed-4)+1;
    for(let i=0;i<obstacles.length;i++) { obstacles[i].update(); if(obstacles[i].off()) obstacles.splice(i,1); }
    for(let i=0;i<coins.length;i++) { coins[i].update(); if(coins[i].off()) coins.splice(i,1); }
    for(let i=0;i<powerups.length;i++) { powerups[i].update(); if(powerups[i].off()) powerups.splice(i,1); }
    frame++;
    if(frame % Math.max(35, 40 - Math.floor(score/200)) === 0) spawnObstacle();
    if(frame % 45 === 0) spawnCoin();
    if(frame % 180 === 0 && Math.random()<0.5) spawnPower();
    for(let o of obstacles) {
        if(player.x < o.x+o.w && player.x+player.w > o.x && player.y < o.y+o.h && player.y+player.h > o.y) {
            if(!player.inv) { gameOver(); return; }
            else { obstacles = obstacles.filter(obs=>obs!==o); break; }
        }
    }
    for(let i=0;i<coins.length;i++) {
        let c = coins[i];
        if(player.x < c.x+c.s && player.x+player.w > c.x && player.y < c.y+c.s && player.y+player.h > c.y) {
            score += 10 * multi; coinTotal++; coins.splice(i,1); sound.playCoin(); i--;
        }
    }
    for(let i=0;i<powerups.length;i++) {
        let p = powerups[i];
        if(player.x < p.x+p.s && player.x+player.w > p.x && player.y < p.y+p.s && player.y+player.h > p.y) {
            activatePower(p.kind); powerups.splice(i,1); i--;
        }
    }
    if(activePower) { powerTimer--; if(powerTimer<=0) { activePower=null; multi=1; if(!player.jet) player.jet=false; } }
    updateMagnet();
    score += Math.floor(multi);
    document.getElementById('score').innerText = Math.floor(score);
    document.getElementById('highScoreGame').innerText = high;
    combo++;
    if(combo>maxCombo) maxCombo=combo;
}
function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#1f4d2f'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle='#ffd70088'; ctx.lineWidth=2;
    for(let i=1;i<3;i++) { ctx.beginPath(); ctx.moveTo(i*LANE_W,0); ctx.lineTo(i*LANE_W,canvas.height); ctx.stroke(); }
    obstacles.forEach(o=>o.draw()); coins.forEach(c=>c.draw()); powerups.forEach(p=>p.draw()); player.draw();
    if(activePower) { ctx.fillStyle='#000000aa'; ctx.fillRect(10,10,150,35); ctx.fillStyle='#ffd700'; ctx.font='bold 14px monospace'; ctx.fillText(`${activePower} : ${Math.ceil(powerTimer/60)}ث`, 20, 32); }
}
function gameLoop() { if(gameRunning && !paused) { updateGame(); draw(); } animId = requestAnimationFrame(gameLoop); }
function gameOver() {
    gameRunning = false; cancelAnimationFrame(animId);
    if(score>high) { high=Math.floor(score); localStorage.setItem('sabuyahHigh', high); }
    attempts++; localStorage.setItem('sabuyahAttempts', attempts);
    document.getElementById('finalScore').innerText = Math.floor(score);
    document.getElementById('finalHigh').innerText = high;
    document.getElementById('finalCombo').innerText = maxCombo;
    document.getElementById('finalCoins').innerText = coinTotal;
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('gameScreen').classList.add('hidden');
    sound.stopMusic(); sound.playGameOver();
}
function restart() {
    gameRunning = true; paused = false; frame = 0; score = 0; speed = 5; multi = 1; activePower = null; coinTotal = 0; maxCombo = 0; combo = 0;
    player = new Player(); obstacles = []; coins = []; powerups = [];
    document.getElementById('score').innerText = "0"; document.getElementById('speedValue').innerText = "1";
    document.getElementById('gameOverScreen').classList.add('hidden'); document.getElementById('gameScreen').classList.remove('hidden'); document.getElementById('startScreen').classList.add('hidden');
    sound.startMusic(); gameLoop();
}
document.addEventListener('keydown', (e) => {
    if(!gameRunning || paused) return;
    if(e.key === 'ArrowLeft') player.moveLeft();
    if(e.key === 'ArrowRight') player.moveRight();
    if(e.key === 'ArrowUp') player.jump();
    if(e.key === 'ArrowDown') player.duck();
    e.preventDefault();
});
document.addEventListener('keyup', (e) => { if(e.key === 'ArrowDown') player.stand(); });
let touchX = null;
canvas.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; e.preventDefault(); });
canvas.addEventListener('touchmove', (e) => {
    if(touchX===null) return;
    let diff = e.touches[0].clientX - touchX;
    if(Math.abs(diff)>30) { if(diff>0) player.moveRight(); else player.moveLeft(); touchX = e.touches[0].clientX; }
    e.preventDefault();
});
canvas.addEventListener('touchend', () => { player.jump(); touchX = null; });
document.getElementById('playBtn').addEventListener('click', () => { document.getElementById('startScreen').classList.add('hidden'); restart(); });
document.getElementById('restartBtn').addEventListener('click', () => { restart(); });
document.getElementById('menuFromOverBtn').addEventListener('click', () => { document.getElementById('gameOverScreen').classList.add('hidden'); document.getElementById('startScreen').classList.remove('hidden'); sound.stopMusic(); });
document.getElementById('exitToMenuBtn').addEventListener('click', () => { gameRunning = false; cancelAnimationFrame(animId); document.getElementById('gameScreen').classList.add('hidden'); document.getElementById('startScreen').classList.remove('hidden'); sound.stopMusic(); });
document.getElementById('pauseGameBtn').addEventListener('click', () => { if(gameRunning) { paused = true; document.getElementById('pauseScreen').classList.remove('hidden'); } });
document.getElementById('resumeBtn').addEventListener('click', () => { paused = false; document.getElementById('pauseScreen').classList.add('hidden'); gameLoop(); });
document.getElementById('exitFromPauseBtn').addEventListener('click', () => { gameRunning = false; paused = false; cancelAnimationFrame(animId); document.getElementById('pauseScreen').classList.add('hidden'); document.getElementById('gameScreen').classList.add('hidden'); document.getElementById('startScreen').classList.remove('hidden'); sound.stopMusic(); });
document.getElementById('settingsBtn').addEventListener('click', () => { document.getElementById('startScreen').classList.add('hidden'); document.getElementById('settingsScreen').classList.remove('hidden'); document.getElementById('soundToggle').checked = soundEn; document.getElementById('musicToggle').checked = musicEn; document.getElementById('volumeSlider').value = sound.master.gain.value*100; document.getElementById('difficultySelect').value = difficulty; });
document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    soundEn = document.getElementById('soundToggle').checked; musicEn = document.getElementById('musicToggle').checked; let vol = parseInt(document.getElementById('volumeSlider').value);
    sound.setVol(vol); sound.muted = !soundEn; sound.musicOn = musicEn;
    if(!musicEn) sound.stopMusic(); else if(gameRunning && !paused) sound.startMusic();
    difficulty = document.getElementById('difficultySelect').value;
    localStorage.setItem('sabuyahSound', soundEn); localStorage.setItem('sabuyahMusic', musicEn); localStorage.setItem('sabuyahDiff', difficulty);
    document.getElementById('settingsScreen').classList.add('hidden'); document.getElementById('startScreen').classList.remove('hidden');
});
document.getElementById('closeSettingsBtn').addEventListener('click', () => { document.getElementById('settingsScreen').classList.add('hidden'); document.getElementById('startScreen').classList.remove('hidden'); });
document.getElementById('creditsBtn').addEventListener('click', () => { document.getElementById('startScreen').classList.add('hidden'); document.getElementById('creditsScreen').classList.remove('hidden'); });
document.getElementById('closeCreditsBtn').addEventListener('click', () => { document.getElementById('creditsScreen').classList.add('hidden'); document.getElementById('startScreen').classList.remove('hidden'); });
document.getElementById('startHighScore').innerText = high;
document.getElementById('totalAttempts').innerText = attempts;
document.getElementById('highScoreGame').innerText = high;
sound.setVol(70); sound.muted = !soundEn; sound.musicOn = musicEn;
