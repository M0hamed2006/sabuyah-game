// ================================================================
// SABUYAH GAME - game.js - المحرك الكامل
// ================================================================
'use strict';

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ----------------------------------------------------------------
// حجم الكانفاس
// ----------------------------------------------------------------
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ================================================================
// بيانات اللعبة المحفوظة (LocalStorage)
// ================================================================
const SAVE_KEY = 'sabuyah_v3';
function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch { return {}; }
}
function writeSave(data) {
  const existing = loadSave();
  localStorage.setItem(SAVE_KEY, JSON.stringify({ ...existing, ...data }));
}

let saveData = loadSave();
let totalCoins   = saveData.totalCoins   || 0;
let totalTries   = saveData.totalTries   || 0;
let leaderboard  = saveData.leaderboard  || [];
let ownedItems   = saveData.ownedItems   || ['char_sabuyah'];
let selectedChar = saveData.selectedChar || 'char_sabuyah';
let selectedSkin = saveData.selectedSkin || 'skin_default';
let settings = saveData.settings || {
  music: true, sfx: true, voice: true, vibrate: true, particles: 'med', shake: true
};

// ================================================================
// إعدادات اللعبة
// ================================================================
const NUM_LANES = 5;
const LANE_W    = 80;    // عرض كل مسار بالبكسل (يُحسب ديناميكياً)
const PLAYER_H  = 90;
const PLAYER_W  = 42;
const FPS_TARGET = 60;

// ================================================================
// حالة اللعبة
// ================================================================
let G = {}; // الحالة الكاملة - تُصفَّر عند كل بدء

function resetGame() {
  G = {
    running:    false,
    paused:     false,
    score:      0,
    coins:      0,
    speed:      3.5,
    baseSpeed:  3.5,
    frame:      0,
    dt:         0,
    lastTime:   0,
    shakeX:     0,
    shakeY:     0,
    shakeAmt:   0,

    // مسارات
    laneCount:   NUM_LANES,
    laneXs:      [],   // X مركز كل مسار
    currentLane: 2,
    targetLaneX: 0,
    playerX:     0,

    // لاعب
    playerY:      0,    // 0 = على الأرض
    playerVY:     0,
    isJumping:    false,
    isSliding:    false,
    slideTimer:   0,
    slideMax:     1.4,
    doubleJumpOk: false,
    doubleJumpUsed: false,
    animFrame:    0,
    animTimer:    0,
    blinkTimer:   0,
    lives:        1,
    invincible:   0,    // ثوانٍ من عدم الاصطدام بعد ضرب

    // عداء
    enemyX:       0,
    enemyY:       0,
    enemyDist:    400,  // مسافة العدو خلف اللاعب (بكسل بالمسار)
    enemyLane:    2,
    enemyJump:    false,
    enemyVY:      0,
    enemySlide:   false,
    enemyAnim:    0,
    enemyMood:    'normal', // normal | angry | veryAngry
    enemyWhistleTimer: 0,

    // بوست
    boostMeter:   0,    // 0..100
    isBoosting:   false,
    boostTimer:   0,
    boostActive:  false,

    // مضاعف نقاط
    multiplier:   1,
    multTimer:    0,

    // كومبو
    combo:        0,
    comboTimer:   0,
    maxCombo:     0,

    // بوستات نشطة
    powerups: {}, // { type: timeRemaining }

    // كيانات
    obstacles:   [],
    items:       [],
    particles:   [],
    bgElements:  [],
    bgElements2: [],
    groundTiles: [],
    railTiles:   [],
    smokePuffs:  [],
    speedLines:  [],

    // مستويات
    levelIndex:   0,
    levelScore:   0,
    levelTransition: 0,

    // إحصائيات الجلسة
    maxSpeed:     3.5,
    trainsAvoided: 0,
    sessionScoreLog: [],
    lastLogTime:  0,

    // إنجازات
    achievementsDone: new Set(saveData.achievementsDone || []),

    // فيلم بداية (countdown)
    countdownTimer: 0,
    countdownPhase: 0,
  };
}

// ================================================================
// المستويات
// ================================================================
const LEVELS = [
  { name:'القاهرة',      bgTop:'#0a1628', bgBottom:'#1a2a1a', railColor:'#555', groundColor:'#3a3020', accentColor:'#ffcc00', minSpeed:3.5, maxSpeed:10,  obstacleRate:.022, coinRate:.045 },
  { name:'الإسكندرية',  bgTop:'#001830', bgBottom:'#002a3a', railColor:'#466', groundColor:'#2a3838', accentColor:'#00ccff', minSpeed:5.0, maxSpeed:13,  obstacleRate:.026, coinRate:.050 },
  { name:'الأقصر',      bgTop:'#1a0a00', bgBottom:'#3a1800', railColor:'#664', groundColor:'#4a3010', accentColor:'#ff8800', minSpeed:6.5, maxSpeed:16,  obstacleRate:.030, coinRate:.055 },
  { name:'الغردقة',     bgTop:'#001a2a', bgBottom:'#002a18', railColor:'#448', groundColor:'#203028', accentColor:'#00ff88', minSpeed:8.5, maxSpeed:20,  obstacleRate:.035, coinRate:.060 },
  { name:'أسوان',       bgTop:'#1a0808', bgBottom:'#280808', railColor:'#844', groundColor:'#3a1810', accentColor:'#ff4444', minSpeed:10,  maxSpeed:999, obstacleRate:.040, coinRate:.065 },
];

function getCurrentLevel() { return LEVELS[Math.min(G.levelIndex, LEVELS.length-1)]; }

// ================================================================
// شخصيات اللعبة
// ================================================================
const CHARS = {
  char_sabuyah: { name:'صابويه', skill:'سرعة متوسطة', color:'#e8a060', bodyColor:'#2244cc', capColor:'#cc2200', locked:false, cost:0, ability:'speed' },
  char_hammad:  { name:'حمادة',  skill:'تحمل ضربة كل 30ث', color:'#8b5e3c', bodyColor:'#553300', capColor:'#225500', locked:false, cost:500, ability:'shield' },
  char_awatef:  { name:'عواطف', skill:'عملات ×1.5',   color:'#e07090', bodyColor:'#993366', capColor:'#cc00aa', locked:false, cost:800, ability:'coins' },
};

// ================================================================
// عناصر المتجر (أزياء + شخصيات)
// ================================================================
const SHOP_ITEMS = [
  { id:'char_hammad',   type:'char', name:'حمادة',        cost:500,  icon:'👨' },
  { id:'char_awatef',   type:'char', name:'عواطف',        cost:800,  icon:'👩' },
  { id:'skin_cap',      type:'skin', name:'طربوش ملكي',   cost:300,  icon:'👑' },
  { id:'skin_glasses',  type:'skin', name:'نظارة شمس',    cost:200,  icon:'😎' },
  { id:'skin_suit',     type:'skin', name:'بدلة رياضية',  cost:400,  icon:'🏃' },
  { id:'skin_galabiya', type:'skin', name:'جلابية',       cost:350,  icon:'👘' },
];

// ================================================================
// إنجازات
// ================================================================
const ACHIEVEMENTS = [
  { id:'first1000',   title:'🏅 مبتدئ',         desc:'أول 1000 نقطة',          check: g => g.score>=1000 },
  { id:'trains10',    title:'🚆 سارق القطارات',  desc:'تجاوزت 10 قطارات',      check: g => g.trainsAvoided>=10 },
  { id:'coins50',     title:'💰 غني',            desc:'جمعت 50 عملة في جولة',  check: g => g.coins>=50 },
  { id:'score5k',     title:'🏆 أسطورة',         desc:'5000 نقطة',             check: g => g.score>=5000 },
  { id:'combo15',     title:'🔥 ناري',           desc:'كومبو 15',              check: g => g.combo>=15 },
  { id:'survive5m',   title:'⏳ صابر',           desc:'عشت 5 دقائق',           check: g => G.frame>=FPS_TARGET*300 },
  { id:'score10k',    title:'👑 الملك',          desc:'10000 نقطة',            check: g => g.score>=10000 },
  { id:'lightningRun',title:'⚡ البرق',          desc:'1000 نقطة بلا خطأ',     check: g => g.perfectScoreRun>=1000 },
];

// ================================================================
// عناصر معززة
// ================================================================
const POWERUP_TYPES = {
  magnet:    { icon:'🧲', color:'#ff00ff', label:'مغناطيس',      duration:8  },
  shield:    { icon:'🛡️', color:'#00ffff', label:'درع ثلاثي',    duration:5, charges:3 },
  x10:       { icon:'×10',color:'#ffff00', label:'نقاط ×10',     duration:5  },
  doubleJump:{ icon:'⬆️', color:'#ffaa00', label:'قفز مزدوج',    duration:10 },
  rocket:    { icon:'🚀', color:'#ff6600', label:'صاروخ',        duration:0, charges:2 },
  drone:     { icon:'🛸', color:'#44ffff', label:'طائرة صديقة',  duration:12 },
  tunnel:    { icon:'🕳️', color:'#888888', label:'نفق سري',      duration:0, charges:1 },
};

// ================================================================
// Web Audio API
// ================================================================
let audioCtx = null;
let musicInterval = null;

function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, dur, type='sine', vol=0.25, delay=0, freqEnd=null) {
  if (!settings.sfx || !audioCtx) return;
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = type;
  const t = audioCtx.currentTime + delay;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.start(t); osc.stop(t + dur + 0.01);
}

function playNoise(dur, vol=0.3, delay=0) {
  if (!settings.sfx || !audioCtx) return;
  const buf  = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random()*2-1) * (1 - i/data.length);
  const src  = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  src.buffer = buf;
  src.connect(gain); gain.connect(audioCtx.destination);
  gain.gain.value = vol;
  const t = audioCtx.currentTime + delay;
  src.start(t); src.stop(t + dur + 0.01);
}

function playCoinSound()   { playTone(880,0.1,'sine',0.25,0,1760); }
function playJumpSound()   { playTone(300,0.15,'square',0.15,0,600); }
function playSlideSound()  { playTone(200,0.12,'sawtooth',0.1,0,80); }
function playPowerupSound(){ [500,700,900,1200].forEach((f,i)=>playTone(f,0.1,'sine',0.2,i*0.08)); }
function playCrashSound()  { playNoise(0.4,0.5); playTone(150,0.3,'sawtooth',0.4,0,40); }
function playWhistle()     { playTone(700,0.5,'sawtooth',0.18,0,400); }
function playBoostSound()  { [200,300,500,800].forEach((f,i)=>playTone(f,0.1,'square',0.15,i*0.06)); }
function playRocketSound() { playTone(400,0.3,'sawtooth',0.3,0,800); playNoise(0.3,0.2,0.1); }
function playEnemyWhistle(){ playTone(600,0.25,'sine',0.2,0,500); playTone(400,0.2,'sine',0.15,0.3,350); }
function playLevelUp()     { [523,659,784,1047].forEach((f,i)=>playTone(f,0.15,'sine',0.3,i*0.12)); }
function playComboSound(n) { const f=440+n*30; playTone(f,0.08,'sine',0.2); }

function playVoice(type) {
  if (!settings.voice || !audioCtx) return;
  const seqs = {
    start:    [[400,.1],[500,.1],[600,.15],[500,.1],[700,.12]],
    gameover: [[300,.2],[200,.25],[150,.3]],
    powerup:  [[800,.06],[1000,.06],[1200,.08]],
    coin_big: [[880,.08],[1100,.08],[1320,.1]],
    escape:   [[600,.08],[500,.06],[700,.1],[800,.12]],
  };
  const seq = seqs[type] || seqs.start;
  seq.forEach(([f,d],i) => playTone(f, d, 'sine', 0.22, seq.slice(0,i).reduce((s,[,d])=>s+d+0.02, 0.05)));
}

// موسيقى خلفية
function startMusic() {
  if (!settings.music || !audioCtx) return;
  stopMusic();
  const bpm = 140 + G.speed * 2;
  const beat = 60 / bpm;
  let t = audioCtx.currentTime + 0.1;

  function scheduleBar() {
    if (!G.running) return;
    const spd = G.isBoosting ? 1.6 : 1;
    // Kick
    [[0,150,30],[0.5,120,25],[1,180,35],[1.5,100,20],[2,160,30],[2.5,90,15],[3,150,28],[3.5,80,18]].forEach(([b,f,fe]) => {
      const osc=audioCtx.createOscillator(),g=audioCtx.createGain();
      osc.connect(g);g.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(f*spd,t+b*beat);
      osc.frequency.exponentialRampToValueAtTime(fe,t+b*beat+0.08);
      g.gain.setValueAtTime(0.35,t+b*beat);
      g.gain.exponentialRampToValueAtTime(0.001,t+b*beat+0.09);
      osc.start(t+b*beat);osc.stop(t+b*beat+0.1);
    });
    // باس
    [392,349,392,440,523,440,392,349].forEach((freq,i) => {
      const osc=audioCtx.createOscillator(),g=audioCtx.createGain(),f=audioCtx.createBiquadFilter();
      f.type='bandpass';f.frequency.value=600;
      osc.type='sawtooth';osc.frequency.value=freq*spd;
      osc.connect(f);f.connect(g);g.connect(audioCtx.destination);
      g.gain.setValueAtTime(0.06,t+i*beat*0.5);
      g.gain.exponentialRampToValueAtTime(0.001,t+i*beat*0.5+beat*0.45);
      osc.start(t+i*beat*0.5);osc.stop(t+i*beat*0.5+beat*0.5);
    });
    t += beat * 8;
    const delay = Math.max(0,(t - audioCtx.currentTime - 0.2)*1000);
    musicInterval = setTimeout(scheduleBar, delay);
  }
  scheduleBar();
}

function stopMusic() { if (musicInterval) { clearTimeout(musicInterval); musicInterval = null; } }

// ================================================================
// حساب مواضع المسارات
// ================================================================
function calcLanes() {
  const totalW = Math.min(canvas.width * 0.8, NUM_LANES * 100);
  const laneW  = totalW / NUM_LANES;
  G.laneXs = [];
  for (let i = 0; i < NUM_LANES; i++) {
    G.laneXs.push((canvas.width - totalW) / 2 + laneW * i + laneW / 2);
  }
  G.laneW = laneW;
}

// ================================================================
// رسم الشخصية (Pixel-art style بالكانفاس)
// ================================================================
function drawCharSprite(cx, cy, config, anim, isSliding, isJumping, blinkOpen=true, scale=1, alpha=1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const { color, bodyColor, capColor } = config;
  const W = 42, H = 90;
  const x = -W/2;

  if (isSliding) {
    // وضع الانزلاق
    ctx.save();
    ctx.translate(0, H*0.25);
    // جسم مفلطح
    drawRect(x, -H*0.15, W, H*0.35, bodyColor);
    // رأس
    drawRect(x+W*0.1, -H*0.35, W*0.8, W*0.65, color);
    // طربوش
    drawRect(x+W*0.15, -H*0.48, W*0.7, H*0.15, capColor);
    ctx.restore();
  } else {
    // أرجل (جري)
    const legAnim = isJumping ? 0 : Math.sin(anim) * 12;
    const legAnim2 = isJumping ? -8 : Math.sin(anim + Math.PI) * 12;
    // رجل يسار
    ctx.save();
    ctx.translate(-W*0.18, H*0.4);
    ctx.rotate(legAnim * Math.PI/180);
    drawRect(-W*0.14, 0, W*0.28, H*0.32, '#1a1a2e');
    drawRect(-W*0.14, H*0.32, W*0.28, H*0.12, '#222');
    ctx.restore();
    // رجل يمين
    ctx.save();
    ctx.translate(W*0.18, H*0.4);
    ctx.rotate(legAnim2 * Math.PI/180);
    drawRect(-W*0.14, 0, W*0.28, H*0.32, '#1a1a2e');
    drawRect(-W*0.14, H*0.32, W*0.28, H*0.12, '#222');
    ctx.restore();

    // جسم
    drawRect(x+W*0.08, -H*0.15, W*0.84, H*0.55, bodyColor);
    // خط الزي
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x+W*0.35, -H*0.15, 2, H*0.55);

    // ذراع يسار
    ctx.save();
    ctx.translate(-W*0.5, -H*0.1);
    ctx.rotate((-legAnim2) * Math.PI/180 * 0.7);
    drawRect(-W*0.13, 0, W*0.26, H*0.3, color);
    ctx.restore();
    // ذراع يمين
    ctx.save();
    ctx.translate(W*0.5, -H*0.1);
    ctx.rotate((-legAnim) * Math.PI/180 * 0.7);
    drawRect(-W*0.13, 0, W*0.26, H*0.3, color);
    ctx.restore();

    // رأس
    drawRect(x+W*0.1, -H*0.65, W*0.8, W*0.72, color);

    // طربوش
    drawRect(x+W*0.1, -H*0.85, W*0.8, H*0.22, capColor);
    // بريم الطاقية
    drawRect(x, -H*0.65, W, H*0.06, capColor);

    // عيون
    if (blinkOpen) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(x+W*0.2, -H*0.58, W*0.22, W*0.2);
      ctx.fillRect(x+W*0.58, -H*0.58, W*0.22, W*0.2);
      ctx.fillStyle = '#111';
      ctx.fillRect(x+W*0.27, -H*0.56, W*0.1, W*0.12);
      ctx.fillRect(x+W*0.65, -H*0.56, W*0.1, W*0.12);
      // بريق عين
      ctx.fillStyle = '#fff';
      ctx.fillRect(x+W*0.3, -H*0.575, 3, 3);
    } else {
      // رمش
      ctx.fillStyle = '#333';
      ctx.fillRect(x+W*0.2, -H*0.555, W*0.22, 4);
      ctx.fillRect(x+W*0.58, -H*0.555, W*0.22, 4);
    }

    // فم
    ctx.fillStyle = '#c06040';
    ctx.fillRect(x+W*0.3, -H*0.47, W*0.4, H*0.05);
  }

  ctx.restore();
}

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

// ================================================================
// رسم العدو (الغيطي)
// ================================================================
function drawEnemy(cx, cy, anim, isJumping, mood, alpha=1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);

  const W=40, H=88;
  const x=-W/2;
  const legA = isJumping ? 0 : Math.sin(anim)*14;
  const legB = isJumping ? -8 : Math.sin(anim+Math.PI)*14;

  // رجلان
  ctx.save(); ctx.translate(-W*0.18, H*0.4); ctx.rotate(legA*Math.PI/180);
  drawRect(-W*0.14, 0, W*0.28, H*0.32, '#1a3a1a');
  drawRect(-W*0.14, H*0.32, W*0.28, H*0.12, '#111');
  ctx.restore();
  ctx.save(); ctx.translate(W*0.18, H*0.4); ctx.rotate(legB*Math.PI/180);
  drawRect(-W*0.14, 0, W*0.28, H*0.32, '#1a3a1a');
  drawRect(-W*0.14, H*0.32, W*0.28, H*0.12, '#111');
  ctx.restore();

  // جسم (زي عسكري)
  drawRect(x+W*0.08, -H*0.15, W*0.84, H*0.55, '#2a5a2a');

  // ذراعان
  ctx.save(); ctx.translate(-W*0.5, -H*0.1); ctx.rotate(-legB*Math.PI/180*0.7);
  drawRect(-W*0.13, 0, W*0.26, H*0.3, '#2a5a2a'); ctx.restore();
  ctx.save(); ctx.translate(W*0.5, -H*0.1); ctx.rotate(-legA*Math.PI/180*0.7);
  drawRect(-W*0.13, 0, W*0.26, H*0.3, '#2a5a2a'); ctx.restore();

  // رأس
  const faceColor = mood==='veryAngry' ? '#cc4422' : mood==='angry' ? '#bb6633' : '#c08060';
  drawRect(x+W*0.1, -H*0.65, W*0.8, W*0.72, faceColor);

  // قبعة عسكرية
  drawRect(x+W*0.05, -H*0.85, W*0.9, H*0.22, '#1a4a1a');
  drawRect(x, -H*0.65, W, H*0.06, '#1a4a1a');

  // شارة
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(x+W*0.4, -H*0.8, 6, 6);

  // عيون (غاضبة)
  ctx.fillStyle = '#fff';
  ctx.fillRect(x+W*0.22, -H*0.58, W*0.2, W*0.18);
  ctx.fillRect(x+W*0.58, -H*0.58, W*0.2, W*0.18);
  ctx.fillStyle = mood==='veryAngry' ? '#ff0000' : '#333';
  ctx.fillRect(x+W*0.28, -H*0.565, W*0.1, W*0.11);
  ctx.fillRect(x+W*0.64, -H*0.565, W*0.1, W*0.11);
  // حاجب غاضب
  ctx.fillStyle = '#333';
  ctx.save();
  ctx.translate(x+W*0.22, -H*0.6);
  ctx.rotate(-0.3); ctx.fillRect(0, 0, W*0.2, 3); ctx.restore();
  ctx.save();
  ctx.translate(x+W*0.78, -H*0.6);
  ctx.rotate(0.3); ctx.fillRect(-W*0.2, 0, W*0.2, 3); ctx.restore();

  // شارب
  ctx.fillStyle = '#333';
  ctx.fillRect(x+W*0.28, -H*0.48, W*0.44, H*0.05);

  ctx.restore();
}

// ================================================================
// رسم القطار
// ================================================================
function drawTrain(obs) {
  const { x, y, color, carriages=3, wheelRot } = obs;
  const W=G.laneW*0.9, H=160;
  ctx.save();
  ctx.translate(x, y);

  for (let c = 0; c < carriages; c++) {
    const cx = 0, cy = c * (H + 8);
    // هيكل العربة
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-W/2, cy, W, H, 6);
    ctx.fill();

    // خط علوي زخرفي
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(-W/2+4, cy+4, W-8, 10);

    // نوافذ
    const winColor = `rgba(180,220,255,${0.7 + Math.sin(G.frame*0.05+c)*0.15})`;
    ctx.fillStyle = winColor;
    [-W*0.3, W*0.1].forEach(wx => {
      [H*0.15, H*0.42, H*0.65].forEach(wy => {
        ctx.beginPath();
        ctx.roundRect(wx+cx-12, cy+wy, 24, 22, 3);
        ctx.fill();
      });
    });

    // باب
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(cx-10, cy+H*0.35, 20, H*0.45);
    ctx.fillStyle = 'rgba(200,200,200,0.3)';
    ctx.fillRect(cx-1, cy+H*0.35, 2, H*0.45);

    // عجلات
    [-W*0.35, W*0.35].forEach(wx => {
      [H*0.08, H*0.78].forEach(wy => {
        ctx.save();
        ctx.translate(wx+cx, cy+wy+10);
        ctx.rotate(wheelRot || 0);
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(0,0,10,0,Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#555'; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(8,0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,-8); ctx.lineTo(0,8); ctx.stroke();
        ctx.fillStyle = '#888';
        ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2); ctx.fill();
        ctx.restore();
      });
    });

    // إضاءة أمامية (عربة أولى فقط)
    if (c===0) {
      ctx.fillStyle = '#ffffcc';
      ctx.beginPath(); ctx.ellipse(-W*0.3, cy+10, 10, 8, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(W*0.3, cy+10, 10, 8, 0, 0, Math.PI*2); ctx.fill();
      const grd = ctx.createRadialGradient(0, cy+10, 0, 0, cy+10, 80);
      grd.addColorStop(0,'rgba(255,255,180,0.12)');
      grd.addColorStop(1,'rgba(255,255,180,0)');
      ctx.fillStyle=grd;
      ctx.fillRect(-W, cy-60, W*2, 70);
    }
  }
  // مدخنة (أول عربة)
  ctx.fillStyle = '#333';
  ctx.fillRect(-8, -20, 16, 20);

  ctx.restore();
}

// ================================================================
// رسم العقبات الأخرى
// ================================================================
function drawCar(obs) {
  const { x, y, color, wheelRot } = obs;
  ctx.save();
  ctx.translate(x, y);
  const W = G.laneW*0.85, H=80;
  // جسم
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(-W/2, 0, W, H, 8); ctx.fill();
  // سقف
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.roundRect(-W*0.35, -H*0.45, W*0.7, H*0.48, 8); ctx.fill();
  // زجاج أمامي
  ctx.fillStyle = 'rgba(150,200,255,0.6)';
  ctx.beginPath(); ctx.roundRect(-W*0.3, -H*0.4, W*0.6, H*0.38, 4); ctx.fill();
  // مصابيح
  ctx.fillStyle = '#ffffcc';
  [[-W*0.35,H*0.1],[W*0.35,H*0.1]].forEach(([lx,ly])=>{
    ctx.beginPath(); ctx.ellipse(lx,ly,8,6,0,0,Math.PI*2); ctx.fill();
    const g=ctx.createRadialGradient(lx,ly,0,lx,ly,40);
    g.addColorStop(0,'rgba(255,255,180,0.15)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(lx,ly,40,0,Math.PI*2); ctx.fill();
  });
  // عجلات
  [[-W*0.35,H*0.85],[W*0.35,H*0.85],[-W*0.35,H*0.1],[W*0.35,H*0.1]].forEach(([wx,wy])=>{
    ctx.save(); ctx.translate(wx,wy); ctx.rotate(wheelRot||0);
    ctx.fillStyle='#111'; ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#444'; ctx.lineWidth=2;
    for(let a=0;a<4;a++){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a*Math.PI/2)*9,Math.sin(a*Math.PI/2)*9);ctx.stroke();}
    ctx.fillStyle='#666'; ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2); ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

function drawBarrier(obs) {
  const { x, y } = obs;
  ctx.save(); ctx.translate(x, y);
  const W=G.laneW*0.9;
  // عمودان
  ctx.fillStyle='#ffcc00';
  ctx.fillRect(-W/2, 0, 10, 80);
  ctx.fillRect(W/2-10, 0, 10, 80);
  // حاجزان أفقيان مخططان
  [30,55].forEach(hy=>{
    const seg=W/6;
    for(let i=0;i<6;i++){
      ctx.fillStyle = i%2===0 ? '#cc2200' : '#ffcc00';
      ctx.fillRect(-W/2+i*seg, hy, seg, 14);
    }
  });
  // أسلاك
  ctx.strokeStyle='rgba(150,150,150,0.7)'; ctx.lineWidth=2;
  ctx.setLineDash([5,5]);
  ctx.beginPath(); ctx.moveTo(-W/2,15); ctx.lineTo(W/2,15); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawHole(obs) {
  const { x, y } = obs;
  ctx.save(); ctx.translate(x, y);
  const W=G.laneW*0.85, H=30;
  const g=ctx.createRadialGradient(0,0,5,0,0,W*0.5);
  g.addColorStop(0,'rgba(0,0,0,0.9)');
  g.addColorStop(0.7,'rgba(20,10,0,0.7)');
  g.addColorStop(1,'rgba(50,30,0,0.3)');
  ctx.fillStyle=g;
  ctx.beginPath(); ctx.ellipse(0,H/2,W*0.45,H*0.5,0,0,Math.PI*2); ctx.fill();
  // حافة
  ctx.strokeStyle='rgba(100,80,40,0.8)'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.ellipse(0,H/2,W*0.45,H*0.5,0,0,Math.PI*2); ctx.stroke();
  ctx.restore();
}

function drawWire(obs) {
  const { x, y } = obs;
  ctx.save(); ctx.translate(x, y);
  const W=G.laneW;
  ctx.strokeStyle='rgba(255,220,0,0.9)'; ctx.lineWidth=4;
  ctx.shadowColor='#ffcc00'; ctx.shadowBlur=8;
  ctx.beginPath(); ctx.moveTo(-W/2,0); ctx.lineTo(W/2,0); ctx.stroke();
  // شرر
  if(Math.random()<0.3){
    ctx.fillStyle='#ffff88';
    ctx.beginPath(); ctx.arc((Math.random()-0.5)*W*0.8,0,2,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawCamel(obs) {
  const { x, y, walkAnim } = obs;
  ctx.save(); ctx.translate(x, y);
  const scale=0.9;
  ctx.scale(scale,scale);

  // أرجل
  const legRot = Math.sin(walkAnim)*0.4;
  [[-25,0],[25,0],[-20,50],[20,50]].forEach(([lx,ly],i) => {
    ctx.save(); ctx.translate(lx,ly);
    ctx.rotate(i%2===0 ? legRot : -legRot);
    ctx.fillStyle='#b8936a';
    ctx.fillRect(-6,0,12,50); ctx.restore();
  });

  // جسم
  ctx.fillStyle='#c4a363';
  ctx.beginPath(); ctx.ellipse(0,0,45,30,0,0,Math.PI*2); ctx.fill();

  // سنام
  ctx.beginPath(); ctx.ellipse(0,-40,18,28,0,0,Math.PI*2); ctx.fill();

  // رقبة
  ctx.save(); ctx.rotate(-0.3);
  ctx.fillRect(-8,-60,16,35); ctx.restore();

  // رأس
  ctx.save(); ctx.rotate(-0.3);
  ctx.fillStyle='#c4a363';
  ctx.beginPath(); ctx.roundRect(-18,-90,36,30,8); ctx.fill();

  // عيون كاريكاتورية
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.arc(-8,-80,5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(8,-80,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#333';
  ctx.beginPath(); ctx.arc(-7,-80,2.5,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(9,-80,2.5,0,Math.PI*2); ctx.fill();

  // فم
  ctx.strokeStyle='#885533'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(0,-72,10,0.2,Math.PI-0.2); ctx.stroke();
  ctx.restore();

  ctx.restore();
}

// ================================================================
// رسم العملة والعناصر المعززة
// ================================================================
function drawCoin(item) {
  const { x, y, rot=0 } = item;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  // ظل
  ctx.fillStyle='rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(0,5,14,5,0,0,Math.PI*2); ctx.fill();
  // عملة
  const g=ctx.createLinearGradient(-14,0,14,0);
  g.addColorStop(0,'#cc9900'); g.addColorStop(0.4,'#ffee00'); g.addColorStop(1,'#cc9900');
  ctx.fillStyle=g;
  ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle='#ffff88'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle='#008800'; ctx.font='bold 13px Cairo'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('£',0,1);
  ctx.restore();
}

function drawPowerup(item) {
  const { x, y, powerType, rot=0 } = item;
  const pt = POWERUP_TYPES[powerType];
  if (!pt) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);

  // هالة
  ctx.shadowColor=pt.color; ctx.shadowBlur=16;

  // المضلع الثماني
  ctx.fillStyle=pt.color+'33';
  ctx.strokeStyle=pt.color; ctx.lineWidth=2.5;
  ctx.beginPath();
  for(let i=0;i<6;i++){
    const a=i/6*Math.PI*2 - Math.PI/6;
    i===0 ? ctx.moveTo(Math.cos(a)*20,Math.sin(a)*20) : ctx.lineTo(Math.cos(a)*20,Math.sin(a)*20);
  }
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // أيقونة
  ctx.shadowBlur=0;
  ctx.font='18px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(pt.icon, 0, 1);

  ctx.restore();
}

// ================================================================
// رسم الخلفية (Parallax)
// ================================================================
function drawBackground() {
  const lv = getCurrentLevel();
  const W=canvas.width, H=canvas.height;

  // سماء
  const skyG = ctx.createLinearGradient(0,0,0,H);
  skyG.addColorStop(0, lv.bgTop);
  skyG.addColorStop(0.6, lv.bgBottom);
  skyG.addColorStop(1, lv.groundColor);
  ctx.fillStyle=skyG; ctx.fillRect(0,0,W,H);

  // نجوم (ليل)
  if(G.nightMode) {
    ctx.fillStyle='rgba(255,255,255,0.8)';
    for(const s of G.stars||[]) {
      ctx.globalAlpha=0.4+Math.sin(G.frame*0.05+s[2])*0.4;
      ctx.beginPath(); ctx.arc(s[0],s[1],s[3],0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha=1;
  }

  // طبقة البنايات (بعيدة)
  for(const b of G.bgElements) {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, H*0.15 - b.h, b.w, b.h);
    // نوافذ
    ctx.fillStyle='rgba(255,240,150,0.4)';
    for(let wy=b.h-20; wy>10; wy-=14) {
      for(let wx=4; wx<b.w-4; wx+=10) {
        if(b.winMask[(wx/10|0)%(b.winMask?.length||1)]) continue;
        ctx.fillRect(b.x+wx, H*0.15-b.h+wy, 6, 8);
      }
    }
  }

  // طبقة نخيل / أعمدة (قريبة)
  for(const p of G.bgElements2) {
    if(p.type==='palm') drawPalmBg(p.x, H*0.15, p.scale);
    else if(p.type==='pole') drawPoleBg(p.x, H*0.15, p.scale);
    else if(p.type==='ad') drawAdBoard(p.x, H*0.15-60, p.scale, p.text);
  }

  // أرضية + قضبان
  const groundY = H * 0.15;
  ctx.fillStyle = lv.groundColor;
  ctx.fillRect(0, groundY, W, H-groundY);

  // قضبان كل مسار
  G.laneXs.forEach(lx => {
    const offset = (G.frame * G.speed) % 80;
    [-16, 16].forEach(dx => {
      ctx.fillStyle='#888';
      ctx.fillRect(lx+dx-2, groundY, 4, H-groundY);
    });
    // نعالات خشبية
    ctx.fillStyle='#5c3d1e';
    for(let sy=groundY+offset; sy<H; sy+=80) {
      ctx.fillRect(lx-G.laneW*0.45, sy, G.laneW*0.9, 10);
    }
  });

  // علامة المستوى (عند الانتقال)
  if(G.levelTransition > 0) {
    const alpha = Math.min(1, G.levelTransition) * (G.levelTransition>1 ? 1 : G.levelTransition);
    ctx.fillStyle=`rgba(0,0,0,${alpha*0.6})`;
    ctx.fillRect(0,0,W,H);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle='#ffcc00';
    ctx.font=`bold ${clamp(36,W*0.08,60)}px Cairo`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.shadowColor='#ffcc00'; ctx.shadowBlur=30;
    ctx.fillText(`🏙️ مرحلة: ${lv.name}`, W/2, H/2-20);
    ctx.font=`${clamp(18,W*0.04,26)}px Cairo`;
    ctx.fillStyle='#fff';
    ctx.fillText('استعد!', W/2, H/2+30);
    ctx.restore();
    G.levelTransition -= G.dt;
  }
}

function drawPalmBg(x, groundY, scale=1) {
  ctx.save(); ctx.translate(x, groundY); ctx.scale(scale,scale);
  ctx.fillStyle='#6b4226';
  ctx.fillRect(-5,-80,10,80);
  ctx.fillStyle='#2d7a2d';
  [-1,0,1,-0.5,0.5].forEach((dx,i)=>{
    ctx.save(); ctx.rotate(dx*0.4+(i*0.2));
    ctx.beginPath(); ctx.ellipse(dx*20,-90+i*5,15,40,dx*0.3,0,Math.PI*2); ctx.fill();
    ctx.restore();
  });
  ctx.restore();
}

function drawPoleBg(x, groundY, scale=1) {
  ctx.save(); ctx.translate(x, groundY); ctx.scale(scale,scale);
  ctx.fillStyle='#888'; ctx.fillRect(-3,-100,6,100);
  // مصباح
  ctx.fillStyle='#ffeeaa';
  ctx.beginPath(); ctx.arc(0,-100,8,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,240,150,0.15)';
  ctx.beginPath(); ctx.arc(0,-100,40,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function drawAdBoard(x, y, scale=1, text='إعلان') {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale,scale);
  ctx.fillStyle='#cc2200';
  ctx.beginPath(); ctx.roundRect(-40,-30,80,50,4); ctx.fill();
  ctx.fillStyle='#fff'; ctx.font='bold 14px Cairo'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(text,0,0);
  ctx.fillStyle='#888'; ctx.fillRect(-3,20,6,40);
  ctx.restore();
}

// ================================================================
// جسيمات (Particles)
// ================================================================
function spawnParticles(x, y, type, count=null) {
  const qualMap = { high:1, med:0.6, low:0.3 };
  const qual = qualMap[settings.particles] || 0.6;
  const n = Math.round((count || 10) * qual);

  for(let i=0; i<n; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4;
    let color='#fff', life=0.8, size=3, gravity=0.12;

    if(type==='coin')    { color=`hsl(${40+Math.random()*20},100%,60%)`; life=1; size=3+Math.random()*3; }
    if(type==='crash')   { color=`hsl(${Math.random()*30},100%,50%)`; life=1.2; size=4+Math.random()*5; gravity=0.18; }
    if(type==='slide')   { color='rgba(180,140,80,0.8)'; life=0.5; size=2; speed*=0.5; gravity=0.05; }
    if(type==='boost')   { color=`hsl(${180+Math.random()*60},100%,60%)`; life=0.6; size=3; gravity=-0.05; }
    if(type==='dust')    { color='rgba(200,170,120,0.7)'; life=0.7; size=2+Math.random()*3; speed*=0.4; gravity=0.04; }
    if(type==='star')    { color='#ffff88'; life=1.2; size=2+Math.random()*2; gravity=0.06; }
    if(type==='shield')  { color='#00ffff'; life=0.8; size=3+Math.random()*4; speed*=0.8; gravity=0; }
    if(type==='smoke')   { color=`rgba(${150+Math.random()*50},${150+Math.random()*50},${150+Math.random()*50},0.7)`; life=1.5; size=8+Math.random()*12; speed*=0.3; gravity=-0.04; }

    G.particles.push({ x, y, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed-1, life, maxLife:life, size, color, gravity, type });
  }
}

function spawnSpeedLines() {
  if(!G.isBoosting && G.speed<8) return;
  for(let i=0; i<3; i++) {
    G.speedLines.push({
      x: Math.random()*canvas.width,
      y: G.playerScreenY + (Math.random()-0.5)*200,
      len: 40+Math.random()*80,
      alpha: 0.6,
      vx: G.speed*3,
    });
  }
}

function updateParticles() {
  for(let i=G.particles.length-1; i>=0; i--) {
    const p=G.particles[i];
    p.x+=p.vx; p.y+=p.vy; p.vy+=p.gravity;
    p.vx*=0.96; p.life-=G.dt*1.5;
    if(p.life<=0) { G.particles.splice(i,1); continue; }
    const alpha = Math.min(1, p.life/p.maxLife * 2);
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.fillStyle=p.color;
    if(p.type==='smoke') {
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size*(1-p.life/p.maxLife+0.5),0,Math.PI*2); ctx.fill();
    } else {
      ctx.fillRect(p.x-p.size/2, p.y-p.size/2, p.size, p.size);
    }
    ctx.restore();
  }

  for(let i=G.speedLines.length-1; i>=0; i--) {
    const sl=G.speedLines[i];
    sl.alpha-=G.dt*3;
    if(sl.alpha<=0) { G.speedLines.splice(i,1); continue; }
    ctx.save();
    ctx.globalAlpha=sl.alpha;
    ctx.strokeStyle='rgba(180,220,255,0.7)'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(sl.x,sl.y); ctx.lineTo(sl.x+sl.len,sl.y); ctx.stroke();
    ctx.restore();
    sl.x+=sl.vx*G.dt;
  }
}

// ================================================================
// إنشاء العقبات والعناصر
// ================================================================
function spawnObstacle() {
  const lv = getCurrentLevel();
  const lane = Math.floor(Math.random()*NUM_LANES);
  const x = G.laneXs[lane];
  const groundY = canvas.height * 0.15;
  const type = pickObstacleType();

  let obs = {
    type, lane, x,
    y: groundY,
    wheelRot: 0,
    color: randomTrainColor(),
  };

  if(type==='train') {
    obs.carriages = 2 + Math.floor(Math.random()*2);
    obs.y = groundY;
    obs.hitY = groundY;
    obs.hitH = 160;
    obs.trainSpeed = G.speed * (0.7 + Math.random()*0.5);
    obs.stopped = false;
    obs.stopTimer = 0;
    G.trainsAvoided; // ya3ni se7a5
  } else if(type==='car') {
    obs.hitY = groundY + 10;
    obs.hitH = 80;
  } else if(type==='barrier') {
    obs.hitY = groundY;
    obs.hitH = 70;
  } else if(type==='hole') {
    obs.hitY = groundY + 5;
    obs.hitH = 25;
    obs.hitW = G.laneW*0.7;
  } else if(type==='wire') {
    obs.hitY = groundY - 45;
    obs.hitH = 12;
    obs.mustSlide = true;
  } else if(type==='camel') {
    obs.walkAnim = 0;
    obs.hitY = groundY - 60;
    obs.hitH = 80;
  }

  // نضع الكيان فوق الشاشة
  obs.y = -300;
  G.obstacles.push(obs);
}

function pickObstacleType() {
  const r = Math.random();
  if(r<0.35) return 'train';
  if(r<0.55) return 'car';
  if(r<0.68) return 'barrier';
  if(r<0.76) return 'wire';
  if(r<0.84) return 'hole';
  return 'camel';
}

function randomTrainColor() {
  const colors=['#226622','#2255aa','#882222','#886622','#664488'];
  return colors[Math.floor(Math.random()*colors.length)];
}

function spawnCoin(lane=null) {
  const l = lane ?? Math.floor(Math.random()*NUM_LANES);
  G.items.push({
    type:'coin', lane:l,
    x: G.laneXs[l],
    y: -30,
    rot: 0,
    collected: false,
  });
}

function spawnPowerup() {
  const types = Object.keys(POWERUP_TYPES);
  const t = types[Math.floor(Math.random()*types.length)];
  const lane = Math.floor(Math.random()*NUM_LANES);
  G.items.push({
    type:'powerup', powerType:t, lane,
    x: G.laneXs[lane],
    y: -30,
    rot: 0,
  });
}

function spawnCoinLine(lane) {
  for(let i=0;i<6;i++) {
    setTimeout(()=>spawnCoin(lane), i*220);
  }
}

// ================================================================
// تحديث العقبات
// ================================================================
function updateObstacles() {
  const groundY = canvas.height * 0.15;
  const lv = getCurrentLevel();

  for(let i=G.obstacles.length-1; i>=0; i--) {
    const obs = G.obstacles[i];

    // حركة نزولاً
    let moveSpeed = G.speed * 3;
    if(obs.type==='train') {
      if(obs.stopped) {
        obs.stopTimer -= G.dt;
        if(obs.stopTimer<=0) obs.stopped=false;
        moveSpeed = 0;
      } else {
        moveSpeed = obs.trainSpeed * 3;
        // قطار شبح (يمر خلال مسارات)
        if(obs.ghost) { ctx.save(); ctx.globalAlpha=0.3; }
      }
    }

    obs.y += moveSpeed * G.dt;
    obs.wheelRot = (obs.wheelRot||0) + G.dt * moveSpeed * 0.05;

    if(obs.type==='camel') obs.walkAnim += G.dt * 5;

    // دخان القطار
    if(obs.type==='train' && G.frame%20===0) {
      spawnParticles(obs.x, obs.y+10, 'smoke', 2);
    }

    // توقف مفاجئ عشوائي
    if(obs.type==='train' && !obs.stopped && Math.random()<0.0003) {
      obs.stopped=true; obs.stopTimer=0.6+Math.random()*0.8;
    }

    // إزالة لو خرجت من الشاشة
    if(obs.y > canvas.height + 400) {
      if(obs.type==='train') G.trainsAvoided++;
      G.obstacles.splice(i,1);
      continue;
    }

    // تحديث موضع X (مسار متحرك نادر)
    obs.x = G.laneXs[obs.lane];

    // رسم
    if(obs.type==='train')   drawTrain(obs);
    else if(obs.type==='car')     drawCar(obs);
    else if(obs.type==='barrier') drawBarrier(obs);
    else if(obs.type==='wire')    drawWire(obs);
    else if(obs.type==='hole')    drawHole(obs);
    else if(obs.type==='camel')   drawCamel(obs);
  }
}

// ================================================================
// تحديث العناصر (عملات + بوستات)
// ================================================================
function updateItems() {
  for(let i=G.items.length-1; i>=0; i--) {
    const item=G.items[i];
    item.y += G.speed*3*G.dt;
    item.rot += G.dt*2.5;

    // مغناطيس
    if(G.powerups.magnet && item.type==='coin') {
      const dx=G.playerX-item.x, dy=G.playerScreenY-item.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<200) {
        item.x+=dx/dist*8; item.y+=dy/dist*8;
      }
    }

    if(item.y > canvas.height+60) { G.items.splice(i,1); continue; }

    // رسم
    if(item.type==='coin')    drawCoin(item);
    else if(item.type==='powerup') drawPowerup(item);
  }
}

// ================================================================
// كشف التصادمات
// ================================================================
function checkCollisions() {
  const groundY   = canvas.height * 0.15;
  const px        = G.playerX;
  const py        = G.playerScreenY;
  const pW        = G.isSliding ? PLAYER_W*1.3 : PLAYER_W*0.7;
  const pH        = G.isSliding ? PLAYER_H*0.45 : PLAYER_H*0.85;
  const pTop      = py - pH;
  const pBot      = py;
  const pLeft     = px - pW/2;
  const pRight    = px + pW/2;

  if(G.invincible>0) return;

  // عقبات
  for(const obs of G.obstacles) {
    const oX = obs.x;
    let hitY = obs.y + (obs.hitY - groundY);
    if(obs.type==='wire') hitY = obs.y - 45;
    const oH = obs.hitH || 80;
    const oW = (obs.hitW || G.laneW*0.82);
    const oTop=hitY, oBot=hitY+oH;
    const oL=oX-oW/2, oR=oX+oW/2;

    if(pRight>oL && pLeft<oR && pBot>oTop && pTop<oBot) {
      if(obs.type==='wire' && G.isSliding) continue; // انزلاق تحت الأسلاك
      if(obs.type==='hole' && G.isJumping) continue; // قفز فوق الحفر
      handleHit(obs);
      return;
    }
  }

  // عناصر
  for(let i=G.items.length-1; i>=0; i--) {
    const item=G.items[i];
    if(Math.abs(item.x-px)<22 && Math.abs(item.y-py)<30) {
      collectItem(item, i);
    }
  }

  // العدو
  const eDx = G.playerX - G.enemyScreenX;
  const eDy = G.playerScreenY - G.enemyScreenY;
  if(Math.abs(eDx)<30 && Math.abs(eDy)<60 && G.enemyDist<=0) {
    handleHit(null, true);
  }
}

function handleHit(obs, byEnemy=false) {
  // درع
  if(G.powerups.shield) {
    G.powerups.shield--;
    if(G.powerups.shield<=0) delete G.powerups.shield;
    G.invincible=1.5;
    spawnParticles(G.playerX, G.playerScreenY, 'shield', 12);
    if(settings.sfx) playTone(300,0.3,'sine',0.3,0,800);
    triggerShake(4);
    return;
  }
  // شخصية حمادة (تحمل ضربة)
  if(selectedChar==='char_hammad' && G.hamadShieldCooldown<=0) {
    G.hamadShieldCooldown=30;
    G.invincible=1.5;
    showMotivation('💪 حمادة قاوم!','#00ff88');
    spawnParticles(G.playerX, G.playerScreenY, 'shield', 15);
    triggerShake(3);
    return;
  }

  // نفق سري
  if(G.powerups.tunnel) {
    delete G.powerups.tunnel;
    G.invincible=2;
    showMotivation('🕳️ نفق سري!','#aaaaaa');
    return;
  }

  doGameOver();
}

function collectItem(item, idx) {
  G.items.splice(idx, 1);
  if(item.type==='coin') {
    const mult = G.powerups.x10 ? 10 : G.multiplier;
    const earned = mult * (selectedChar==='char_awatef' ? 1.5 : 1);
    G.coins += earned;
    totalCoins += earned;
    G.boostMeter = Math.min(100, G.boostMeter+4);
    G.combo++;
    G.comboTimer=2.5;
    G.maxCombo=Math.max(G.maxCombo,G.combo);
    spawnParticles(item.x, item.y, 'coin', 6);
    playCoinSound();
    if(G.combo>=5)  playComboSound(G.combo);
    if(G.combo%10===0) { showMotivation('🔥 '+G.combo+' كومبو!','#ffcc00'); playVoice('coin_big'); }
    updateHUDBoost();
  } else if(item.type==='powerup') {
    activatePowerup(item.powerType);
    playPowerupSound();
    playVoice('powerup');
  }
}

// ================================================================
// تفعيل البوستات
// ================================================================
function activatePowerup(type) {
  const pt = POWERUP_TYPES[type];
  if(!pt) return;
  const label = `${pt.icon} ${pt.label}!`;

  if(type==='shield') {
    G.powerups.shield = (G.powerups.shield||0) + 3;
    showPopup(label, pt.color);
  } else if(type==='rocket') {
    G.powerups.rocket = (G.powerups.rocket||0) + 2;
    fireRocket();
    showPopup(label, pt.color);
  } else if(type==='tunnel') {
    G.powerups.tunnel = 1;
    G.invincible=2;
    showMotivation('🕳️ نفق سري!', '#888');
  } else if(type==='drone') {
    G.powerups.drone = pt.duration;
    showPopup(label, pt.color);
  } else if(type==='x10') {
    G.powerups.x10 = pt.duration;
    G.multiplier=10;
    showPopup(label, pt.color);
  } else {
    G.powerups[type] = pt.duration;
    showPopup(label, pt.color);
  }

  spawnParticles(G.playerX, G.playerScreenY, 'star', 15);
  updatePowerupHUD();
}

function fireRocket() {
  // إزالة أقرب عقبة في نفس المسار
  const lane=G.currentLane;
  let closest=null, closestDist=Infinity;
  for(const obs of G.obstacles) {
    if(obs.lane===lane) {
      const d=Math.abs(obs.y-G.playerScreenY);
      if(d<closestDist){closestDist=d;closest=obs;}
    }
  }
  if(closest) {
    spawnParticles(closest.x,closest.y,'crash',20);
    G.obstacles.splice(G.obstacles.indexOf(closest),1);
    playRocketSound();
    showMotivation('🎯 هدف!','#ff6600');
  }
}

// ================================================================
// تحديث العدو (الغيطي)
// ================================================================
function updateEnemy() {
  const targetX = G.laneXs[G.enemyLane];

  // العدو يقترب تدريجياً
  const catchSpeed = G.speed * 0.3 * (1 + G.score/20000);
  G.enemyDist -= (catchSpeed - G.speed*0.25) * G.dt * 60;
  if(G.powerups.magnet || G.isBoosting) G.enemyDist += G.speed*4*G.dt;
  G.enemyDist = clamp(G.enemyDist, -20, 500);

  // العدو يتبع نفس المسار أحياناً
  if(G.frame%120===0) {
    // ذكاء: تخمين مساري
    const bias = Math.random()<0.6 ? G.currentLane : Math.floor(Math.random()*NUM_LANES);
    G.enemyLane = clamp(bias, 0, NUM_LANES-1);
  }

  // قفز العدو تلقائي عند اقتراب عقبة
  if(!G.enemyJump && G.enemyVY===0) {
    for(const obs of G.obstacles) {
      if(obs.lane===G.enemyLane) {
        const ey = G.playerScreenY + G.enemyDist;
        if(Math.abs(obs.y-ey)<120 && obs.y>ey) {
          G.enemyJump=true; G.enemyVY=-8;
          break;
        }
      }
    }
  }

  // جاذبية العدو
  if(G.enemyJump) {
    G.enemyVY += 0.35;
    G.enemyYOff = (G.enemyYOff||0) + G.enemyVY;
    if(G.enemyYOff>=0) { G.enemyJump=false; G.enemyVY=0; G.enemyYOff=0; }
  } else { G.enemyYOff=0; }

  // حالة مزاج العدو
  const dist = G.enemyDist;
  G.enemyMood = dist<80 ? 'veryAngry' : dist<200 ? 'angry' : 'normal';

  // صوت صفير العدو
  G.enemyWhistleTimer -= G.dt;
  if(G.enemyWhistleTimer<=0 && G.enemyDist<150) {
    G.enemyWhistleTimer = 3 + Math.random()*2;
    playEnemyWhistle();
  }

  // موضع العدو على الشاشة
  G.enemyScreenX = G.laneXs[G.enemyLane];
  G.enemyScreenY = G.playerScreenY + Math.min(G.enemyDist, canvas.height*0.6);
  if(G.enemyScreenY > canvas.height-20) return; // مخفي

  G.enemyAnim += G.dt*15;

  // رسم العدو
  const alpha = G.enemyDist>400 ? 0 : 1 - G.enemyDist/500;
  drawEnemy(
    G.enemyScreenX,
    G.enemyScreenY + (G.enemyYOff||0),
    G.enemyAnim,
    G.enemyJump,
    G.enemyMood,
    Math.min(1, alpha + 0.2)
  );

  // شريط الخطر
  const danger = clamp(1 - G.enemyDist/400, 0, 1);
  document.getElementById('dangerFill').style.width = (danger*100)+'%';
  const dangerMe=document.getElementById('dangerMe');
  const dangerEn=document.getElementById('dangerEnemy');
  if(dangerMe&&dangerEn){ dangerMe.style.marginRight=(danger*80)+'%'; }
}

// ================================================================
// تحديث اللاعب
// ================================================================
function updatePlayer() {
  // موضع X ناعم
  const targetX = G.laneXs[G.currentLane];
  G.playerX += (targetX - G.playerX) * 0.18;

  // جاذبية
  if(G.isJumping || G.playerYOff<0) {
    G.playerVY += 0.38;
    G.playerYOff = (G.playerYOff||0) + G.playerVY;
    if(G.playerYOff>=0) {
      G.playerYOff=0; G.isJumping=false; G.playerVY=0;
      G.doubleJumpUsed=false;
      spawnParticles(G.playerX, G.playerScreenY,'dust',4);
    }
  } else { G.playerYOff=0; }

  // انزلاق
  if(G.isSliding) {
    G.slideTimer -= G.dt;
    if(G.slideTimer<=0) { G.isSliding=false; }
  }

  // رمش العيون
  G.blinkTimer -= G.dt;
  if(G.blinkTimer<=0) { G.blinkTimer = 3 + Math.random()*2; G.blinkOpen=false; setTimeout(()=>G.blinkOpen=true, 120); }
  if(G.blinkOpen===undefined) G.blinkOpen=true;

  // تحريك أطراف
  if(!G.isSliding && !G.isJumping) G.animTimer += G.dt*14;
  else if(G.isJumping) G.animTimer += G.dt*5;

  // حمادة cooldown
  if(G.hamadShieldCooldown>0) G.hamadShieldCooldown-=G.dt;

  // موضع Y اللاعب على الشاشة
  const groundY   = canvas.height*0.15;
  const floorY    = groundY + canvas.height*0.52;
  G.playerScreenY = floorY + (G.playerYOff||0);

  // ظل
  if(!G.isJumping) {
    const shadowAlpha = 0.25 - (Math.abs(G.playerYOff||0)/300)*0.2;
    ctx.save();
    ctx.globalAlpha=Math.max(0,shadowAlpha);
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.ellipse(G.playerX, floorY+2, G.isSliding?30:20, 6, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  // رسم الشخصية
  const charConfig = CHARS[selectedChar] || CHARS.char_sabuyah;

  // درع مرئي
  if(G.powerups.shield) {
    const shieldPulse=0.6+Math.sin(G.frame*0.15)*0.4;
    ctx.save();
    ctx.globalAlpha=shieldPulse*0.35;
    ctx.strokeStyle='#00ffff'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.arc(G.playerX, G.playerScreenY-PLAYER_H/2, 44, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
  }

  // طائرة الدرون
  if(G.powerups.drone) drawDrone(G.playerX+50, G.playerScreenY-60);

  drawCharSprite(
    G.playerX,
    G.playerScreenY,
    charConfig,
    G.animTimer,
    G.isSliding,
    G.isJumping,
    G.blinkOpen,
    1,
    G.invincible>0 && G.frame%6<3 ? 0.4 : 1
  );

  // غبار خلف الأقدام
  if(!G.isJumping && !G.isSliding && G.frame%8===0) {
    spawnParticles(G.playerX+(Math.random()-0.5)*10, G.playerScreenY,'dust',1);
  }

  // تحديث invincible
  if(G.invincible>0) G.invincible-=G.dt;
}

function drawDrone(x, y) {
  ctx.save(); ctx.translate(x, y+Math.sin(G.frame*0.1)*5);
  ctx.fillStyle='#44ffff';
  ctx.beginPath(); ctx.roundRect(-18,-8,36,16,4); ctx.fill();
  ctx.fillStyle='#00aaaa';
  ctx.fillRect(-14,-12,8,5); ctx.fillRect(6,-12,8,5);
  ctx.fillRect(-14,8,8,5);  ctx.fillRect(6,8,8,5);
  ctx.font='10px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('🛸',0,0);
  ctx.restore();

  // الدرون يجمع عملات
  if(G.frame%30===0) {
    for(const item of G.items) {
      if(item.type==='coin' && Math.abs(item.x-x)<100) {
        item.x+=((x-item.x))*0.1;
        item.y+=((y-item.y))*0.1;
      }
    }
  }
}

// ================================================================
// تحديث البوستات النشطة
// ================================================================
function updateActivePowerups() {
  const toDelete=[];
  for(const [type,val] of Object.entries(G.powerups)) {
    if(type==='shield'||type==='rocket'||type==='tunnel') continue;
    if(typeof val==='number' && val>0) {
      G.powerups[type]-=G.dt;
      if(G.powerups[type]<=0) {
        toDelete.push(type);
        if(type==='x10') G.multiplier=1;
      }
    }
  }
  toDelete.forEach(t=>delete G.powerups[t]);
  updatePowerupHUD();
}

function updatePowerupHUD() {
  const container=document.getElementById('activePowerups');
  if(!container) return;
  container.innerHTML='';
  for(const [type,val] of Object.entries(G.powerups)) {
    const pt=POWERUP_TYPES[type];
    if(!pt) continue;
    const div=document.createElement('div');
    div.className='powerup-indicator';
    const dur=pt.duration||10;
    const pct=typeof val==='number' ? Math.max(0,(val/dur)*100) : 100;
    div.innerHTML=`<span>${pt.icon}</span><div class="pi-timer-bg"><div class="pi-timer-fill" style="width:${pct}%;background:${pt.color}"></div></div>`;
    container.appendChild(div);
  }
}

// ================================================================
// تحديث الكومبو
// ================================================================
function updateCombo() {
  if(G.comboTimer>0) {
    G.comboTimer-=G.dt;
    if(G.comboTimer<=0) G.combo=0;
  }
  const el=document.getElementById('comboDisplay');
  if(!el) return;
  if(G.combo>=3) {
    el.classList.remove('hidden');
    const fire=G.combo>=10?'🔥🔥':'🔥';
    el.textContent=`${fire} ×${G.combo} كومبو`;
    el.style.color=G.combo>=15?'#ff4400':G.combo>=8?'#ffaa00':'#ffff00';
    el.style.fontSize=`${clamp(1.6,1.6+G.combo*0.05,3.5)}rem`;
  } else {
    el.classList.add('hidden');
  }
}

// ================================================================
// تحديث البوست
// ================================================================
function updateBoost() {
  if(G.isBoosting) {
    G.boostTimer-=G.dt;
    G.speed = G.baseSpeed*2.2;
    spawnParticles(G.playerX, G.playerScreenY,'boost',3);
    spawnSpeedLines();
    if(G.boostTimer<=0) {
      G.isBoosting=false;
      G.boostMeter=0;
      G.speed=G.baseSpeed;
      showMotivation('💨 انتهى البوست','#aaa');
    }
  }
  document.getElementById('boostFill').style.width=G.boostMeter+'%';
}

// ================================================================
// تحديث النقاط والسرعة والمستوى
// ================================================================
function updateScoreSpeed() {
  const lv=getCurrentLevel();
  const mult=G.powerups.x10?10:G.multiplier;
  G.score += G.speed*G.dt*8*mult;

  // سرعة تدريجية
  if(!G.isBoosting) {
    G.baseSpeed = Math.min(lv.maxSpeed, lv.minSpeed + G.score/3000);
    G.speed = G.baseSpeed;
  }
  G.maxSpeed=Math.max(G.maxSpeed, G.speed);

  // تسجيل النقاط مع الزمن
  if(G.frame-G.lastLogTime>FPS_TARGET*2) {
    G.sessionScoreLog.push(Math.floor(G.score));
    G.lastLogTime=G.frame;
  }

  // انتقال المستوى
  const lvThresh=(G.levelIndex+1)*2000;
  if(G.score>=lvThresh && G.levelIndex<LEVELS.length-1) {
    G.levelIndex++;
    G.levelTransition=3;
    playLevelUp();
    showMotivation(`🏙️ ${getCurrentLevel().name}!`, getCurrentLevel().accentColor);
    generateBgElements();
  }

  // نظام النهار/ليل
  G.dayNightTimer=(G.dayNightTimer||0)+G.dt;
  if(G.dayNightTimer>240) { G.dayNightTimer=0; G.nightMode=!G.nightMode; }

  // تحقق إنجازات
  checkAchievements();

  // HUD
  document.getElementById('hud-score').textContent=Math.floor(G.score);
  document.getElementById('hud-coins').textContent=Math.floor(G.coins);
  document.getElementById('hud-speed').textContent='💨'+(G.speed*10|0);
  document.getElementById('hud-mult').textContent='×'+mult;
  document.getElementById('hud-level-name').textContent=lv.name;

  // run perfect
  if(!G.hitOnce) G.perfectScoreRun=(G.perfectScoreRun||0)+G.speed*G.dt*8;
}

// ================================================================
// إنشاء عناصر الخلفية
// ================================================================
function generateBgElements() {
  const lv=getCurrentLevel();
  G.bgElements=[];
  G.bgElements2=[];
  G.stars=[];

  // بنايات خلفية
  const buildColors=['#1a2030','#202830','#1a2820','#282018','#201818'];
  for(let i=0; i<20; i++) {
    const side=Math.random()>0.5?1:-1;
    const h=80+Math.random()*200;
    const x=canvas.width/2 + side*(canvas.width*0.38+Math.random()*canvas.width*0.25);
    G.bgElements.push({
      x,y:0,w:30+Math.random()*50,h,
      color:buildColors[Math.floor(Math.random()*buildColors.length)],
      speed:0.4+Math.random()*0.3,
      winMask:Array.from({length:8},()=>Math.random()<0.4),
    });
  }

  // عناصر مقدمة
  const types=['palm','palm','pole','ad'];
  for(let i=0; i<12; i++) {
    const side=i%2===0?-1:1;
    G.bgElements2.push({
      type:types[Math.floor(Math.random()*types.length)],
      x:canvas.width/2+side*(canvas.width*0.34+Math.random()*100),
      y:0,
      speed:0.7+Math.random()*0.4,
      scale:0.5+Math.random()*0.5,
      text:['مش هتهرب!','صابويه 🏃','يلا بينا!','الغيطي قادم!'][Math.floor(Math.random()*4)],
    });
  }

  // نجوم
  for(let i=0; i<80; i++) {
    G.stars.push([Math.random()*canvas.width, Math.random()*canvas.height*0.5, Math.random()*Math.PI*2, Math.random()*1.5+0.5]);
  }
}

function scrollBgElements() {
  const H=canvas.height*0.15;
  G.bgElements.forEach(b=>{
    b.y+=(G.speed*b.speed)*G.dt*30;
    if(b.y>H*2) b.y=-H*2;
  });
  G.bgElements2.forEach(b=>{
    b.y+=(G.speed*b.speed)*G.dt*40;
    if(b.y>H*3) b.y=-H*3;
  });
}

// ================================================================
// اهتزاز الكاميرا
// ================================================================
function triggerShake(amount=5) {
  if(!settings.shake) return;
  G.shakeAmt=Math.max(G.shakeAmt, amount);
}

function updateShake() {
  if(G.shakeAmt>0) {
    G.shakeX=(Math.random()-0.5)*G.shakeAmt;
    G.shakeY=(Math.random()-0.5)*G.shakeAmt;
    G.shakeAmt*=0.85;
    if(G.shakeAmt<0.3) G.shakeAmt=0;
  } else { G.shakeX=0; G.shakeY=0; }
}

// ================================================================
// إنشاء العناصر عشوائياً
// ================================================================
function spawnRandomly() {
  const lv=getCurrentLevel();
  const r1=Math.random()*FPS_TARGET;
  const r2=Math.random()*FPS_TARGET;
  const r3=Math.random()*FPS_TARGET;

  if(r1<lv.obstacleRate*FPS_TARGET) spawnObstacle();
  if(r2<lv.coinRate*FPS_TARGET) {
    if(Math.random()<0.25) spawnCoinLine(Math.floor(Math.random()*NUM_LANES));
    else spawnCoin();
  }
  if(r3<0.003*FPS_TARGET) spawnPowerup();
}

// ================================================================
// تحقق الإنجازات
// ================================================================
function checkAchievements() {
  for(const ach of ACHIEVEMENTS) {
    if(!G.achievementsDone.has(ach.id) && ach.check(G)) {
      G.achievementsDone.add(ach.id);
      writeSave({ achievementsDone: [...G.achievementsDone] });
      showAchievement(ach.title, ach.desc);
    }
  }
}

function showAchievement(title, desc) {
  const el=document.getElementById('achievementPopup');
  if(!el) return;
  el.innerHTML=`<div style="font-size:1.2rem">${title}</div><div style="font-size:.8rem;opacity:.7;margin-top:4px">${desc}</div>`;
  el.classList.remove('hidden');
  el.style.animation='none'; el.offsetHeight;
  el.style.animation='achieveIn 3.5s forwards';
  setTimeout(()=>el.classList.add('hidden'),3600);
}

// ================================================================
// نص تحفيزي
// ================================================================
function showMotivation(text, color='#ffcc00') {
  const el=document.getElementById('motivationText');
  if(!el) return;
  el.textContent=text;
  el.style.color=color;
  el.style.textShadow=`0 0 30px ${color}`;
  el.classList.remove('hidden');
  el.style.animation='none'; el.offsetHeight;
  el.style.animation='motivationAnim 2s forwards';
  setTimeout(()=>el.classList.add('hidden'),2100);
}

function showPopup(text, color='#00ffff') {
  const el=document.getElementById('powerupPopup');
  if(!el) return;
  el.textContent=text;
  el.style.color=color;
  el.style.borderColor=color;
  el.classList.remove('hidden');
  el.style.animation='none'; el.offsetHeight;
  el.style.animation='powerupIn 2.2s forwards';
  setTimeout(()=>el.classList.add('hidden'),2300);
}

// ================================================================
// HUD البوست
// ================================================================
function updateHUDBoost() {
  document.getElementById('boostFill').style.width=G.boostMeter+'%';
}

// ================================================================
// نهاية اللعبة
// ================================================================
function doGameOver() {
  G.running=false;
  stopMusic();
  playCrashSound();
  playVoice('gameover');
  triggerShake(10);
  spawnParticles(G.playerX, G.playerScreenY,'crash',25);

  if(settings.vibrate && navigator.vibrate) navigator.vibrate([200,100,200]);

  // حفظ النتيجة
  const finalScore=Math.floor(G.score);
  totalTries++;
  writeSave({ totalCoins, totalTries });

  // لوحة المتصدرين
  leaderboard.push({ score:finalScore, coins:Math.floor(G.coins), date:new Date().toLocaleDateString('ar') });
  leaderboard.sort((a,b)=>b.score-a.score);
  leaderboard=leaderboard.slice(0,10);
  writeSave({ leaderboard });

  // إحصائيات
  const best=leaderboard[0]?.score||0;
  document.getElementById('go-score').textContent=finalScore;
  document.getElementById('go-coins').textContent=Math.floor(G.coins);
  document.getElementById('go-best').textContent=best;
  document.getElementById('go-speed').textContent=(G.maxSpeed*10|0);
  document.getElementById('go-trains').textContent=G.trainsAvoided;
  document.getElementById('go-combo').textContent=G.maxCombo;

  // نص نتيجة
  const titles=[
    [10000,'👑 ملك الشارع!'],
    [5000,'🏆 أسطورة!'],
    [2000,'⭐ ممتاز!'],
    [1000,'👍 كويس!'],
    [0,'😅 حاول تاني!'],
  ];
  const msg=titles.find(([t])=>finalScore>=t);
  document.getElementById('gameoverEmoji').textContent=msg[1].split(' ')[0];
  document.getElementById('gameoverTitle').textContent=msg[1].substring(msg[1].indexOf(' ')+1);
  document.getElementById('gameoverMsg').textContent= finalScore>=(leaderboard[0]?.score||0) ? '🎉 رقم قياسي جديد!' : 'يلا حاول تكسر الرقم!';

  // رسم بياني
  drawScoreChart();

  // لوحة أوائل مختصرة
  renderLeaderboard('leaderList', 5);

  showScreen('gameover');
}

function drawScoreChart() {
  const c=document.getElementById('scoreChart');
  if(!c) return;
  const cx=c.getContext('2d');
  const W=c.width, H=c.height;
  cx.clearRect(0,0,W,H);
  cx.fillStyle='rgba(255,255,255,0.04)'; cx.fillRect(0,0,W,H);
  const log=G.sessionScoreLog;
  if(log.length<2) return;
  const max=Math.max(...log,1);
  cx.strokeStyle='#ffcc00'; cx.lineWidth=2;
  cx.beginPath();
  log.forEach((s,i)=>{
    const x=i/(log.length-1)*W;
    const y=H-(s/max)*H*0.85-4;
    i===0?cx.moveTo(x,y):cx.lineTo(x,y);
  });
  cx.stroke();
  // ملء
  cx.lineTo(W,H); cx.lineTo(0,H); cx.closePath();
  cx.fillStyle='rgba(255,200,0,0.12)'; cx.fill();
}

// ================================================================
// الحلقة الرئيسية
// ================================================================
let lastTimestamp=0;

function gameLoop(ts) {
  if(!G.running && !G.loopRunning) return;
  requestAnimationFrame(gameLoop);

  G.dt=Math.min((ts-lastTimestamp)/1000, 0.05);
  lastTimestamp=ts;
  G.frame++;

  ctx.save();

  // اهتزاز كاميرا
  updateShake();
  if(G.shakeAmt>0) ctx.translate(G.shakeX, G.shakeY);

  // خلفية
  drawBackground();
  scrollBgElements();

  if(G.running && !G.paused) {
    // عناصر الخلفية المتحركة
    ctx.save();

    // العقبات
    updateObstacles();
    // العناصر
    updateItems();
    // الجسيمات
    updateParticles();
    // العدو
    updateEnemy();
    // اللاعب
    updatePlayer();
    // كومبو
    updateCombo();
    // بوست
    updateBoost();
    // بوستات
    updateActivePowerups();
    // نقاط + سرعة + مستوى
    updateScoreSpeed();
    // توليد عشوائي
    spawnRandomly();

    ctx.restore();
  }

  ctx.restore();
}

// ================================================================
// التحكم (كيبورد)
// ================================================================
const keys={};
window.addEventListener('keydown', e=>{
  if(keys[e.code]) return;
  keys[e.code]=true;
  if(!G.running || G.paused) return;
  if(e.code==='ArrowLeft'||e.code==='KeyA')  doMoveLeft();
  if(e.code==='ArrowRight'||e.code==='KeyD') doMoveRight();
  if(e.code==='ArrowUp'||e.code==='KeyW'||e.code==='Space') doJump();
  if(e.code==='ArrowDown'||e.code==='KeyS')  doSlide();
  if(e.code==='ShiftLeft'||e.code==='ShiftRight') doBoost();
  e.preventDefault();
});
window.addEventListener('keyup', e=>{ delete keys[e.code]; });

function doMoveLeft()  { if(G.currentLane>0) { G.currentLane--; spawnParticles(G.playerX, G.playerScreenY,'dust',3); } }
function doMoveRight() { if(G.currentLane<NUM_LANES-1) { G.currentLane++; spawnParticles(G.playerX, G.playerScreenY,'dust',3); } }
function doJump() {
  if(!G.isJumping) {
    G.isJumping=true; G.playerVY=-9; G.isSliding=false;
    playJumpSound();
    spawnParticles(G.playerX, G.playerScreenY,'dust',5);
  } else if((G.powerups.doubleJump||G.doubleJumpOk) && !G.doubleJumpUsed) {
    G.doubleJumpUsed=true; G.playerVY=-7;
    playJumpSound();
    spawnParticles(G.playerX, G.playerScreenY,'star',8);
    showMotivation('⬆️ قفز مزدوج!','#ffaa00');
  }
}
function doSlide() {
  if(!G.isJumping && !G.isSliding) {
    G.isSliding=true; G.slideTimer=G.slideMax;
    playSlideSound();
    spawnParticles(G.playerX, G.playerScreenY,'slide',6);
  }
}
function doBoost() {
  if(G.boostMeter>=100 && !G.isBoosting) {
    G.isBoosting=true; G.boostTimer=5;
    playBoostSound();
    playVoice('escape');
    showMotivation('🚀 انطلق يا صابويه!','#ff4400');
    spawnParticles(G.playerX, G.playerScreenY,'boost',15);
  }
}

// ================================================================
// تحكم اللمس
// ================================================================
let touchSX=0, touchSY=0, touchST=0;
window.addEventListener('touchstart', e=>{
  touchSX=e.touches[0].clientX;
  touchSY=e.touches[0].clientY;
  touchST=Date.now();
},{passive:true});
window.addEventListener('touchend', e=>{
  if(!G.running||G.paused) return;
  const dx=e.changedTouches[0].clientX-touchSX;
  const dy=e.changedTouches[0].clientY-touchSY;
  const dt=Date.now()-touchST;
  const ab=Math.abs;
  if(ab(dx)>ab(dy)) {
    if(ab(dx)>20) { dx>0?doMoveRight():doMoveLeft(); }
  } else {
    if(ab(dy)>20) { dy<0?doJump():doSlide(); }
    else if(dt<200) doJump();
  }
},{passive:true});

// ================================================================
// بدء اللعبة
// ================================================================
function startGame() {
  ensureAudio();
  resetGame();
  calcLanes();
  generateBgElements();

  G.playerX   = G.laneXs[2];
  G.enemyDist = 400;
  G.enemyLane = 2;
  G.nightMode = false;
  G.loopRunning = true;
  G.running = true;
  G.hamadShieldCooldown=0;
  G.blinkOpen=true;

  showScreen('hud');
  startMusic();
  playVoice('start');
  showMotivation('🚇 يلا يا صابويه!', '#ffcc00');

  lastTimestamp=performance.now();
  requestAnimationFrame(gameLoop);
}

// ================================================================
// واجهة المستخدم (Screens)
// ================================================================
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s=>{ s.classList.remove('active'); s.classList.add('hidden'); });
  const el=document.getElementById('screen-'+name);
  if(el) { el.classList.remove('hidden'); el.classList.add('active'); }
}

function renderLeaderboard(elId, limit=10) {
  const el=document.getElementById(elId);
  if(!el) return;
  el.innerHTML='';
  leaderboard.slice(0,limit).forEach((entry,i)=>{
    const li=document.createElement('li');
    li.innerHTML=`<span>${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)} ${entry.date}</span><span>${entry.score.toLocaleString('ar')}</span>`;
    el.appendChild(li);
  });
  if(!leaderboard.length) { el.innerHTML='<li style="text-align:center;color:#777">لا يوجد سجلات بعد</li>'; }
}

// ================================================================
// بناء شاشة الشخصيات
// ================================================================
function buildCharCards() {
  const container=document.getElementById('charCards');
  if(!container) return;
  container.innerHTML='';
  Object.entries(CHARS).forEach(([id, ch])=>{
    const owned=ownedItems.includes(id)||!ch.locked;
    const card=document.createElement('div');
    card.className='char-card'+(selectedChar===id?' active':'');
    const c=document.createElement('canvas'); c.width=50; c.height=70;
    const cc=c.getContext('2d');
    // رسم مصغر
    const mini={color:ch.color,bodyColor:ch.bodyColor,capColor:ch.capColor};
    const tempCtx=ctx; // backup
    // نرسم على الكانفاس المصغر
    cc.save(); cc.translate(25,65); cc.scale(0.55,0.55);
    drawCharSpriteOnCtx(cc, 0, 0, mini, 0, false, false, true, 1, 1);
    cc.restore();

    card.appendChild(c);
    card.innerHTML+=`<div class="char-name">${ch.name}</div><div class="char-skill">${ch.skill}</div>`;
    if(!owned) card.innerHTML+=`<div class="char-lock">🔒 ${ch.cost}🪙</div>`;

    if(owned) {
      card.onclick=()=>{
        selectedChar=id;
        writeSave({selectedChar});
        buildCharCards();
      };
    } else {
      card.onclick=()=>{
        if(totalCoins>=ch.cost) {
          totalCoins-=ch.cost;
          ownedItems.push(id);
          writeSave({totalCoins,ownedItems});
          selectedChar=id;
          writeSave({selectedChar});
          buildCharCards();
          updateStartStats();
        } else {
          showAchievement('🪙 عملاتك مش كفاية!','اجمع أكتر');
        }
      };
    }
    container.appendChild(card);
  });
}

// نسخة رسم الشخصية على ctx تاني
function drawCharSpriteOnCtx(c, cx, cy, config, anim, isSliding, isJumping, blinkOpen, scale, alpha) {
  const orig=ctx;
  // تبديل مؤقت
  const W=42, H=90, x=-W/2;
  c.save();
  c.globalAlpha=alpha;
  c.translate(cx,cy);
  c.scale(scale,scale);
  c.fillStyle=config.bodyColor;
  c.fillRect(x+W*0.08,-H*0.15,W*0.84,H*0.55);
  c.fillStyle=config.color;
  c.fillRect(x+W*0.1,-H*0.65,W*0.8,W*0.72);
  c.fillStyle=config.capColor;
  c.fillRect(x+W*0.1,-H*0.85,W*0.8,H*0.22);
  c.fillStyle='#fff';
  c.fillRect(x+W*0.2,-H*0.58,W*0.22,W*0.2);
  c.fillRect(x+W*0.58,-H*0.58,W*0.22,W*0.2);
  c.restore();
}

// ================================================================
// المتجر
// ================================================================
function buildShop() {
  document.getElementById('shopBalance').textContent=Math.floor(totalCoins);
  const container=document.getElementById('shopItems');
  if(!container) return;
  container.innerHTML='';
  SHOP_ITEMS.forEach(item=>{
    const owned=ownedItems.includes(item.id);
    const isActive=(item.type==='skin'&&selectedSkin===item.id)||(item.type==='char'&&selectedChar===item.id);
    const div=document.createElement('div');
    div.className='shop-item'+(owned?' owned':'')+(isActive?' active-skin':'');
    div.innerHTML=`<div style="font-size:2rem">${item.icon}</div><div class="item-name">${item.name}</div>`;
    if(owned) div.innerHTML+=`<div class="item-owned">✅ ${isActive?'مفعّل':'مملوك'}</div>`;
    else div.innerHTML+=`<div class="item-price">🪙 ${item.cost}</div>`;

    div.onclick=()=>{
      if(owned) {
        if(item.type==='skin') { selectedSkin=item.id; writeSave({selectedSkin}); }
        if(item.type==='char') { selectedChar=item.id; writeSave({selectedChar}); }
        buildShop(); buildCharCards();
      } else if(totalCoins>=item.cost) {
        totalCoins-=item.cost;
        ownedItems.push(item.id);
        writeSave({totalCoins,ownedItems});
        buildShop();
        updateStartStats();
      } else {
        showAchievement('🪙 فلوسك مش كفاية!','وفر أكتر');
      }
    };
    container.appendChild(div);
  });
}

// ================================================================
// إحصائيات الشاشة الرئيسية
// ================================================================
function updateStartStats() {
  const best=leaderboard[0]?.score||0;
  document.getElementById('stat-best').textContent=best.toLocaleString('ar');
  document.getElementById('stat-total').textContent=Math.floor(totalCoins).toLocaleString('ar');
  document.getElementById('stat-tries').textContent=totalTries;
}

// ================================================================
// تصدير النتيجة
// ================================================================
function exportScore() {
  const data={ score:Math.floor(G.score), coins:Math.floor(G.coins), maxSpeed:G.maxSpeed.toFixed(1), trainsAvoided:G.trainsAvoided, maxCombo:G.maxCombo, date:new Date().toLocaleDateString('ar'), leaderboard };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='sabuyah_score.json'; a.click();
  URL.revokeObjectURL(url);
}

// ================================================================
// ربط أزرار الواجهة
// ================================================================
function bindUI() {
  // البداية
  document.getElementById('btnPlay').onclick=()=>startGame();
  document.getElementById('btnLeaders').onclick=()=>{ renderLeaderboard('fullLeaderList'); showScreen('leaders'); };
  document.getElementById('btnShop').onclick=()=>{ buildShop(); showScreen('shop'); };
  document.getElementById('btnSettings').onclick=()=>{ loadSettingsUI(); showScreen('settings'); };

  // HUD
  document.getElementById('btnPause').onclick=()=>{
    G.paused=true; stopMusic(); showScreen('pause');
  };
  document.getElementById('ctrlLeft').onclick=()=>doMoveLeft();
  document.getElementById('ctrlRight').onclick=()=>doMoveRight();
  document.getElementById('ctrlJump').onclick=()=>doJump();
  document.getElementById('ctrlSlide').onclick=()=>doSlide();
  document.getElementById('ctrlBoost').onclick=()=>doBoost();

  // إيقاف
  document.getElementById('btnResume').onclick=()=>{
    G.paused=false; showScreen('hud'); ensureAudio(); startMusic();
  };
  document.getElementById('btnRestartPause').onclick=()=>startGame();
  document.getElementById('btnMenuPause').onclick=()=>{ G.running=false; stopMusic(); showScreen('start'); updateStartStats(); };

  // نهاية اللعبة
  document.getElementById('btnRestart').onclick=()=>startGame();
  document.getElementById('btnMenu').onclick=()=>{ showScreen('start'); updateStartStats(); };
  document.getElementById('btnExport').onclick=()=>exportScore();

  // الأوائل
  document.getElementById('btnCloseLeaders').onclick=()=>showScreen('start');

  // المتجر
  document.getElementById('btnCloseShop').onclick=()=>showScreen('start');

  // الإعدادات
  document.getElementById('btnSaveSettings').onclick=()=>saveSettingsUI();
  document.getElementById('btnCloseSettings').onclick=()=>showScreen('start');
}

function loadSettingsUI() {
  document.getElementById('setMusic').checked=settings.music;
  document.getElementById('setSfx').checked=settings.sfx;
  document.getElementById('setVoice').checked=settings.voice;
  document.getElementById('setVibrate').checked=settings.vibrate;
  document.getElementById('setParticles').value=settings.particles;
  document.getElementById('setShake').checked=settings.shake;
}

function saveSettingsUI() {
  settings={
    music:document.getElementById('setMusic').checked,
    sfx:document.getElementById('setSfx').checked,
    voice:document.getElementById('setVoice').checked,
    vibrate:document.getElementById('setVibrate').checked,
    particles:document.getElementById('setParticles').value,
    shake:document.getElementById('setShake').checked,
  };
  writeSave({settings});
  showScreen('start');
}

// ================================================================
// مساعدات
// ================================================================
function clamp(v, min, max) { return Math.min(Math.max(v,min),max); }

// ================================================================
// بدء التشغيل
// ================================================================
window.addEventListener('load', ()=>{
  calcLanes();
  generateBgElements();
  buildCharCards();
  updateStartStats();
  bindUI();

  // حلقة خلفية للشاشة الرئيسية
  G.loopRunning=true;
  G.playerX=canvas.width/2;
  G.playerScreenY=canvas.height*0.65;
  G.playerYOff=0;
  G.blinkOpen=true;
  G.blinkTimer=3;
  G.animTimer=0;
  G.dt=0;
  G.frame=0;
  G.speed=3.5;

  function menuLoop(ts) {
    if(G.running) return;
    requestAnimationFrame(menuLoop);
    G.dt=Math.min((ts-lastTimestamp)/1000,0.05);
    lastTimestamp=ts;
    G.frame++;
    G.animTimer+=G.dt*12;
    G.blinkTimer-=G.dt;
    if(G.blinkTimer<=0){G.blinkTimer=3+Math.random()*2;G.blinkOpen=false;setTimeout(()=>G.blinkOpen=true,120);}

    drawBackground();
    scrollBgElements();

    // رسم الشخصية في المنتصف للعرض
    const charConfig=CHARS[selectedChar]||CHARS.char_sabuyah;
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height*0.62);
    const t=G.frame*0.03;
    ctx.translate(0, Math.sin(t)*4);
    drawCharSprite(0,0,charConfig,G.animTimer,false,false,G.blinkOpen,1.2,1);
    ctx.restore();

    updateParticles();
    if(G.frame%12===0) spawnParticles(canvas.width/2+(Math.random()-0.5)*20,canvas.height*0.62,'dust',1);
  }
  lastTimestamp=performance.now();
  requestAnimationFrame(menuLoop);
});

// منع التمرير على الموبايل
document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
