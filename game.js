// ═══════════════════════════════════════════════════════════════════
//  SABUYAH ULTIMATE — game.js
//  محرك لعبة صابويه الكامل — Canvas 2D
//  جميع الرسوميات بيكسل آرت مرسومة بالكود
// ═══════════════════════════════════════════════════════════════════

'use strict';

// ─── الكانفاس ───────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
let W, H, scaleX, scaleY;
const BASE_W = 480, BASE_H = 854; // تصميم أصلي

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  W = canvas.width; H = canvas.height;
  scaleX = W / BASE_W;
  scaleY = H / BASE_H;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ─── إعدادات اللعبة ─────────────────────────────────────────────
const SAVE_KEY  = 'sabuyah_ultimate_v3';
const LANE_CNT  = 5;
const LANE_W    = BASE_W / LANE_CNT; // 96px per lane (base)
const LANES_X   = Array.from({length: LANE_CNT}, (_,i) => LANE_W * i + LANE_W / 2); // [48,144,240,336,432]

// ─── مناطق اللعبة ───────────────────────────────────────────────
const TRACK_TOP    = BASE_H * 0.32;
const TRACK_BOTTOM = BASE_H * 0.82;
const GROUND_Y     = BASE_H * 0.78;

// ─── المراحل ────────────────────────────────────────────────────
const LEVELS = [
  { name:'القاهرة',    color:'#c4813a', sky:['#87ceeb','#6ab0d4'], scoreThresh:0,    trainSpeed:1.0, bgTint:'rgba(200,130,60,.06)'  },
  { name:'الإسكندرية', color:'#4488cc', sky:['#6aabcc','#4490bb'], scoreThresh:2000, trainSpeed:1.2, bgTint:'rgba(70,140,200,.06)'   },
  { name:'الأقصر',    color:'#e8a030', sky:['#f0b060','#e87020'], scoreThresh:5000, trainSpeed:1.5, bgTint:'rgba(240,150,40,.08)'   },
  { name:'الغردقة',   color:'#22aacc', sky:['#66ddff','#22aadd'], scoreThresh:10000,trainSpeed:1.8, bgTint:'rgba(30,170,210,.07)'   },
  { name:'الفضاء!',   color:'#aa66ff', sky:['#220044','#440088'], scoreThresh:20000,trainSpeed:2.2, bgTint:'rgba(100,0,200,.08)'    },
];

// ─── الشخصيات ────────────────────────────────────────────────────
const CHARACTERS = [
  { id:'sabuyah', name:'صابويه',  ability:'⚡ سرعة عالية', unlockCost:0,    skinColor:'#f4a460', shirtColor:'#2244cc', pantsColor:'#1a1a3a', capColor:'#cc2200' },
  { id:'hammad',  name:'حمادة',   ability:'🛡️ يتحمل صدمة كل 30ث', unlockCost:500, skinColor:'#8b5e3c', shirtColor:'#336633', pantsColor:'#2a1a0a', capColor:'#225500' },
  { id:'awatef',  name:'عواطف',   ability:'💰 عملات ×1.5', unlockCost:800, skinColor:'#ffb3a0', shirtColor:'#cc4488', pantsColor:'#660044', capColor:'#ff6699' },
];

// ─── المتجر ──────────────────────────────────────────────────────
const SHOP_ITEMS = [
  { id:'cap_red',    name:'طاقية حمرا',  icon:'🧢', price:200, type:'skin' },
  { id:'glasses',    name:'نضارة شمس',   icon:'🕶️', price:350, type:'skin' },
  { id:'scarf',      name:'كوفية',       icon:'🧣', price:300, type:'skin' },
  { id:'x2_boost',   name:'بوست×2',      icon:'⚡', price:0,   type:'unlock', note:'مجاني' },
  { id:'rocket_ammo',name:'صاروخان',    icon:'🚀', price:150, type:'consumable' },
  { id:'shield3',    name:'درع ثلاثي',   icon:'🛡️', price:400, type:'consumable' },
];

// ─── قاعدة البيانات المحلية ───────────────────────────────────────
let DB = {
  highScore: 0, totalCoins: 0, attempts: 0,
  selectedChar: 'sabuyah', ownedChars: ['sabuyah'],
  ownedItems: [], equippedItems: [],
  leaderboard: [],
  settings: { music:true, sfx:true, voice:true, shake:true, quality:'med' },
};

function loadDB() {
  try { const s=localStorage.getItem(SAVE_KEY); if(s) DB=JSON.parse(s); } catch(e) {}
}
function saveDB() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(DB)); } catch(e) {}
}
loadDB();

// ─── حالة اللعبة ─────────────────────────────────────────────────
let G = {}; // game state

function resetGameState() {
  G = {
    running: false, paused: false,
    score: 0, coins: 0, combo: 0, comboTimer: 0,
    speed: 5.5,         // px/frame (base scale)
    maxSpeed: 0,
    level: 0,
    frame: 0,
    startTime: 0,
    scoreHistory: [],   // for chart
    trainsPassed: 0,
    // player
    lane: 2,
    targetLane: 2,
    px: LANES_X[2],     // rendered x (base coords)
    py: GROUND_Y,
    jumping: false,
    jumpVY: 0,
    sliding: false,
    slideTimer: 0,
    doubleJumpReady: false,
    doubleJumpUsed: false,
    invincible: 0,      // frames of invincibility after hit
    // boosts
    boostMeter: 0,
    boosting: false,
    boostTimer: 0,
    activeBoosts: {},   // { type: framesLeft }
    hamadShieldCooldown: 0,
    // enemy (الغيطي)
    enemyDist: 800,     // px behind player (base coords) — comes closer
    enemyLane: 2,
    enemyY: GROUND_Y,
    enemyJumping: false,
    enemyJumpVY: 0,
    enemySliding: false,
    enemyVisible: false,
    enemyWhistleTimer: 0,
    // day/night
    nightMode: false,
    dayNightTimer: 0,
    // weather
    weatherType: 'clear', // 'clear','rain','dust','fog'
    weatherTimer: 0,
    // cameraShake
    shakeAmt: 0,
    // parallax
    bgScrollY: 0,
    bgScrollX: 0,
    buildingsX: Array.from({length:12},(_,i)=>-80+i*120),
    buildingsH: Array.from({length:12},()=>80+Math.random()*120),
    cloudX: Array.from({length:6},(_,i)=>i*90),
    cloudY: Array.from({length:6},()=>30+Math.random()*60),
    // obstacles, coins, particles, powerups
    obstacles: [],
    coinItems: [],
    powerups: [],
    particles: [],
    scoreTexts: [],
    // drone
    droneActive: false, droneX:0, droneY:0,
  };
}

// ─── Particle System ─────────────────────────────────────────────
function addParticle(opts) {
  if (DB.settings.quality === 'low' && G.particles.length > 30) return;
  if (DB.settings.quality === 'med' && G.particles.length > 80) return;
  G.particles.push({
    x:opts.x, y:opts.y,
    vx:opts.vx||0, vy:opts.vy||0,
    life:opts.life||1, maxLife:opts.life||1,
    r:opts.r||3, color:opts.color||'#fff',
    type:opts.type||'dot',
    gravity:opts.gravity||0,
    shape:opts.shape||'circle',
  });
}

function addScoreText(x, y, text, color) {
  G.scoreTexts.push({ x, y, text, color: color||'#ffcc00', life:1.5, vy:-1.2 });
}

// ─── Audio Engine ─────────────────────────────────────────────────
let AC;
let musicScheduleTimer = null;
let musicStartTime = 0;
let musicBarCount = 0;

function initAudio() {
  if (AC) return;
  AC = new (window.AudioContext || window.webkitAudioContext)();
}

function resumeAudio() { if (AC && AC.state === 'suspended') AC.resume(); }

function playTone(freq, dur, vol=0.3, type='sine', detune=0, delay=0) {
  if (!AC || !DB.settings.sfx) return;
  const t = AC.currentTime + delay;
  const o = AC.createOscillator();
  const g = AC.createGain();
  o.type = type; o.frequency.value = freq; o.detune.value = detune;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(AC.destination);
  o.start(t); o.stop(t + dur + 0.01);
}

function playNoise(dur, vol=0.2, delay=0) {
  if (!AC || !DB.settings.sfx) return;
  const t = AC.currentTime + delay;
  const size = Math.floor(AC.sampleRate * dur);
  const buf = AC.createBuffer(1, size, AC.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = (Math.random()*2-1) * (1 - i/size);
  const src = AC.createBufferSource();
  src.buffer = buf;
  const g = AC.createGain(); g.gain.value = vol;
  src.connect(g); g.connect(AC.destination);
  src.start(t); src.stop(t + dur + 0.01);
}

const SFX = {
  jump()    { playTone(320,0.06,0.18,'square'); playTone(500,0.12,0.1,'sine',0,0.04); },
  land()    { playTone(80,0.08,0.15,'triangle'); },
  coin()    { playTone(880,0.08,0.2,'sine'); playTone(1320,0.1,0.15,'sine',0,0.06); },
  bigCoin() { [880,1108,1320,1760].forEach((f,i)=>playTone(f,0.12,0.25,'sine',0,i*0.06)); },
  crash()   { playNoise(0.4,0.4); playTone(80,0.3,0.3,'sawtooth'); },
  boost()   { [300,400,600,900].forEach((f,i)=>playTone(f,0.15,0.2,'sawtooth',0,i*0.07)); },
  powerup() { [500,700,900,1200].forEach((f,i)=>playTone(f,0.12,0.2,'sine',0,i*0.07)); },
  whistle() { playTone(900,0.1,0.2,'sine'); playTone(700,0.3,0.15,'sine',0,0.1); },
  trainClose(){ playTone(200,0.4,0.25,'sawtooth'); playTone(150,0.5,0.2,'sawtooth',0,0.1); },
  slide()   { playNoise(0.12,0.1); playTone(200,0.1,0.08,'sawtooth'); },
  levelUp() { [523,659,784,1046].forEach((f,i)=>playTone(f,0.18,0.3,'sine',0,i*0.1)); },
  rocket()  { playTone(400,0.05,0.3,'sawtooth'); playTone(200,0.3,0.2,'sawtooth',0,0.05); playNoise(0.2,0.15,0.05); },
  enemyClose(){ playTone(600,0.05,0.15,'square'); playTone(400,0.1,0.1,'square',0,0.08); },
};

const VOICES_AR = [
  ['يلا بينا!','#ffff00'], ['خد!','#ffcc00'], ['وحش!','#ff8800'],
  ['جامد فشخ!','#ff4400'], ['هوووب!','#00ffff'], ['آه يا لذاذة!','#ff88ff'],
  ['مش هيمسكني!','#88ff88'], ['طير يا صابويه!','#ffaaff'],
];

function playVoice(type) {
  if (!DB.settings.voice) return;
  const voices = { start:[['يلا يا صابويه!','#ffff00']], gameover:[['آه يا خسارة!','#ff4444']], random:VOICES_AR };
  const pool = voices[type] || VOICES_AR;
  const [text, color] = pool[Math.floor(Math.random() * pool.length)];
  showHypeMsg(text, color);
}

// موسيقى إلكترو شعبي
function scheduleMusic() {
  if (!AC || !DB.settings.music || !G.running) return;
  const bpm = 130 + Math.min(G.speed * 3, 60);
  const beat = 60 / bpm;
  const t = AC.currentTime + 0.05;

  // طبلة (kick)
  const kick = [0, beat*2, beat*3.5];
  kick.forEach(k => {
    const o=AC.createOscillator(),g=AC.createGain();
    o.type='sine'; o.frequency.setValueAtTime(160,t+k); o.frequency.exponentialRampToValueAtTime(30,t+k+0.08);
    g.gain.setValueAtTime(0.4,t+k); g.gain.exponentialRampToValueAtTime(0.001,t+k+0.09);
    o.connect(g);g.connect(AC.destination);o.start(t+k);o.stop(t+k+0.1);
  });
  // hi-hat
  for (let i=0;i<8;i++) {
    const g=AC.createGain(); g.gain.setValueAtTime(0.06,t+i*beat*0.5); g.gain.exponentialRampToValueAtTime(0.001,t+i*beat*0.5+0.04);
    playNoise(0.04,0.06,i*beat*0.5);
  }
  // bass line ميلودي مصرية
  const bassNotes=[130,146,130,116,130,155,130,116];
  bassNotes.forEach((f,i)=>{
    const o=AC.createOscillator(),g=AC.createGain();
    o.type='sawtooth';o.frequency.value=f;
    g.gain.setValueAtTime(0.15,t+i*beat*0.5);g.gain.exponentialRampToValueAtTime(0.001,t+i*beat*0.5+beat*0.45);
    o.connect(g);g.connect(AC.destination);o.start(t+i*beat*0.5);o.stop(t+i*beat*0.5+beat*0.5);
  });

  const barLen = beat * 4;
  musicScheduleTimer = setTimeout(scheduleMusic, (barLen - 0.1) * 1000);
}

function startMusic() { resumeAudio(); scheduleMusic(); }
function stopMusic()  { if (musicScheduleTimer) clearTimeout(musicScheduleTimer); }

// ─── Pixel Art Drawing Helpers ─────────────────────────────────────
function px(x) { return x * scaleX; }
function py2(y){ return y * scaleY; }

function fillRect(x,y,w,h,color) {
  ctx.fillStyle=color;
  ctx.fillRect(px(x), py2(y), Math.max(1,px(w)), Math.max(1,py2(h)));
}
function roundRect(x,y,w,h,r,color) {
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.roundRect(px(x),py2(y),px(w),py2(h),r*Math.min(scaleX,scaleY));
  ctx.fill();
}
function drawText(text,x,y,size,color,align='center',bold=true) {
  ctx.save();
  ctx.fillStyle=color;
  ctx.font=`${bold?'900':'400'} ${py2(size)}px Cairo, sans-serif`;
  ctx.textAlign=align;
  ctx.textBaseline='middle';
  ctx.fillText(text, px(x), py2(y));
  ctx.restore();
}
function circle(x,y,r,color) {
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.arc(px(x),py2(y),Math.max(1,r*Math.min(scaleX,scaleY)),0,Math.PI*2);
  ctx.fill();
}

// ─── رسم الأرضية والبيئة ──────────────────────────────────────────
function drawBackground() {
  const lv = LEVELS[G.level];
  // سماء gradient
  const [sky1,sky2] = G.nightMode ? ['#040818','#0a1530'] : lv.sky;
  const skyGrad = ctx.createLinearGradient(0,0,0,py2(TRACK_TOP));
  skyGrad.addColorStop(0, sky1); skyGrad.addColorStop(1, sky2);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0,0,W,py2(TRACK_TOP+20));

  // سحاب
  G.cloudX.forEach((cx,i) => {
    const cy = G.cloudY[i];
    const alpha = G.nightMode ? 0.3 : 0.7;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = G.nightMode ? '#aabbdd' : '#ffffff';
    [0,-15,15,-8,8].forEach((dx,j) => {
      const r = (8+j*2)*Math.min(scaleX,scaleY);
      ctx.beginPath();
      ctx.arc(px(cx+dx), py2(cy+j*2), r, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  });

  // مباني (silhouette parallax)
  G.buildingsX.forEach((bx,i) => {
    const bh = G.buildingsH[i];
    const by = GROUND_Y - bh;
    const col = G.nightMode ? `hsl(${200+i*15},20%,${8+i%4*3}%)` : `hsl(${20+i*10},30%,${35+i%4*5}%)`;
    fillRect(bx, by, 55, bh, col);
    // نوافذ مضيئة
    if (!G.nightMode) return;
    for (let wy=by+8;wy<GROUND_Y-15;wy+=14) {
      for (let wx=bx+6;wx<bx+49;wx+=10) {
        if ((i+wx+wy)%3!==0) fillRect(wx, wy, 7, 9, 'rgba(255,220,100,.6)');
      }
    }
  });

  // أرضية
  const grdColor = G.nightMode ? '#1a1a1a' : (lv.color || '#c4813a');
  fillRect(0, GROUND_Y, BASE_W, BASE_H-GROUND_Y, grdColor);

  // قضبان 5 مسارات
  LANES_X.forEach(lx => {
    const railColor = G.nightMode ? '#555' : '#888';
    fillRect(lx-1.5, GROUND_Y-2, 3, BASE_H-GROUND_Y+2, railColor);
  });
  // نعالات
  const sleeperSpacing = 18;
  const sleeperOff = (G.frame * G.speed * 0.8) % sleeperSpacing;
  for (let sy=TRACK_TOP+sleeperOff;sy<BASE_H;sy+=sleeperSpacing) {
    fillRect(8, sy, BASE_W-16, 4, G.nightMode?'#2a2010':'#5c3d1e');
  }

  // تأثير البيئة
  ctx.fillStyle = lv.bgTint;
  ctx.fillRect(0,0,W,H);

  // طقس
  drawWeather();
}

function drawWeather() {
  if (G.weatherType === 'rain') {
    ctx.strokeStyle = 'rgba(100,150,255,0.4)';
    ctx.lineWidth = 1;
    for (let i=0;i<40;i++) {
      const rx = ((i*137+G.frame*8)%BASE_W);
      const ry = ((i*73+G.frame*15)%BASE_H);
      ctx.beginPath();
      ctx.moveTo(px(rx),py2(ry));
      ctx.lineTo(px(rx-3),py2(ry+12));
      ctx.stroke();
    }
  } else if (G.weatherType === 'dust') {
    ctx.fillStyle='rgba(200,150,80,0.12)';
    ctx.fillRect(0,0,W,H);
    for (let i=0;i<20;i++) {
      const dx=((i*191+G.frame*3)%BASE_W);
      const dy=((i*113+G.frame*2)%BASE_H);
      circle(dx,dy,4+i%5,'rgba(200,160,100,0.2)');
    }
  } else if (G.weatherType === 'fog') {
    ctx.fillStyle='rgba(200,210,220,0.18)';
    ctx.fillRect(0,0,W,H);
  }
}

// ─── رسم اللاعب (Pixel Art صابويه) ───────────────────────────────
function drawPlayer() {
  const char = CHARACTERS.find(c=>c.id===DB.selectedChar) || CHARACTERS[0];
  const x = G.px, y = G.py;
  const f = G.frame;

  ctx.save();
  if (G.invincible > 0 && Math.floor(G.invincible/4)%2===0) {
    ctx.globalAlpha = 0.4;
  }

  // ظل
  const shadowAlpha = 0.25 * (1 - Math.max(0,(GROUND_Y-y)/80));
  ctx.globalAlpha *= shadowAlpha;
  ctx.fillStyle='#000';
  ctx.beginPath();
  ctx.ellipse(px(x),py2(GROUND_Y+4),px(14),py2(5),0,0,Math.PI*2);
  ctx.fill();
  ctx.globalAlpha = (G.invincible>0&&Math.floor(G.invincible/4)%2===0)?0.4:1;

  if (G.sliding) {
    drawCharSlide(x, y, char, f);
  } else {
    drawCharRun(x, y, char, f);
  }

  // درع ثلاثي
  if (G.activeBoosts.shield3) {
    ctx.strokeStyle='rgba(100,200,255,0.6)'; ctx.lineWidth=2*Math.min(scaleX,scaleY);
    ctx.beginPath();
    ctx.arc(px(x),py2(y-18),px(22),0,Math.PI*2);
    ctx.stroke();
  }
  // مغناطيس
  if (G.activeBoosts.magnet) {
    ctx.strokeStyle='rgba(255,100,255,0.5)'; ctx.lineWidth=1.5*Math.min(scaleX,scaleY);
    ctx.setLineDash([3,4]);
    ctx.beginPath();
    ctx.arc(px(x),py2(y-18),px(60),0,Math.PI*2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // بوست تأثير
  if (G.boosting) {
    ctx.fillStyle='rgba(255,200,0,0.12)';
    ctx.fillRect(0,0,W,H);
    // speed lines
    for (let i=0;i<12;i++) {
      const lx = (i*40+G.frame*20)%BASE_W;
      fillRect(lx, TRACK_TOP+Math.random()*200, 60+Math.random()*80, 2, `rgba(255,220,0,${0.1+Math.random()*0.15})`);
    }
  }

  ctx.restore();
}

// رسم الشخصية في وضع الجري
function drawCharRun(x, y, char, f) {
  const runCycle = Math.sin(f * 0.28) * 4;
  const legL = Math.sin(f * 0.28) * 8;
  const legR = -Math.sin(f * 0.28) * 8;
  const armL = -Math.sin(f * 0.28) * 7;
  const armR = Math.sin(f * 0.28) * 7;

  if (G.jumping) {
    // وضع القفز
    drawCharBody(x, y-2, char);
    // رجلين للأعلى
    ctx.save();
    ctx.translate(px(x-5),py2(y+10));
    ctx.rotate(0.4); fillRect(-3,-10,6,20,char.pantsColor); ctx.restore();
    ctx.save();
    ctx.translate(px(x+5),py2(y+10));
    ctx.rotate(-0.4); fillRect(-3,-10,6,20,char.pantsColor); ctx.restore();
    // ذراعان فرداتين
    drawArms(x,y,char,-0.7,0.7);
  } else {
    // رجل يسار
    ctx.save(); ctx.translate(px(x-5),py2(y+6));
    ctx.rotate(legL*0.03);
    fillRect(-3,0,6,18,char.pantsColor);
    fillRect(-4,16,8,5,G.nightMode?'#444':'#333'); // حذاء
    ctx.restore();
    // رجل يمين
    ctx.save(); ctx.translate(px(x+5),py2(y+6));
    ctx.rotate(legR*0.03);
    fillRect(-3,0,6,18,char.pantsColor);
    fillRect(-4,16,8,5,G.nightMode?'#444':'#333');
    ctx.restore();
    drawCharBody(x, y, char);
    drawArms(x,y,char,armL*0.03,armR*0.03);
  }

  // عيون ترمش
  const blink = Math.floor(f/180)%8===0 && f%6<2;
  drawFace(x, y-34, char, blink);
}

function drawCharSlide(x, y, char, f) {
  // جسم أفقي
  ctx.save();
  ctx.translate(px(x),py2(GROUND_Y-8));
  ctx.rotate(-0.3);
  fillRect(-16,-5,32,12,char.shirtColor);
  // رأس
  fillRect(10,-12,14,14,char.skinColor);
  // طاقية
  fillRect(10,-18,14,8,char.capColor);
  ctx.restore();
}

function drawCharBody(x,y,char) {
  // جسم
  fillRect(x-10,y-30,20,26,char.shirtColor);
  // تفاصيل قميص
  fillRect(x-2,y-25,4,12,'rgba(0,0,0,.15)');
}

function drawArms(x,y,char,angleL,angleR) {
  ctx.save(); ctx.translate(px(x-10),py2(y-22));
  ctx.rotate(angleL); fillRect(-4,0,7,16,char.skinColor); ctx.restore();
  ctx.save(); ctx.translate(px(x+10),py2(y-22));
  ctx.rotate(angleR); fillRect(-3,0,7,16,char.skinColor); ctx.restore();
}

function drawFace(x, y, char, blink) {
  // رأس
  fillRect(x-9,y-12,18,18,char.skinColor);
  // طاقية
  fillRect(x-10,y-22,20,12,char.capColor);
  fillRect(x-11,y-11,22,3,char.capColor);
  // عيون
  if (!blink) {
    fillRect(x-6,y-6,4,4,'#222');
    fillRect(x+2,y-6,4,4,'#222');
    // بياض
    fillRect(x-7,y-7,3,3,'#fff');
    fillRect(x+1,y-7,3,3,'#fff');
  } else {
    fillRect(x-7,y-5,5,2,'#222');
    fillRect(x+1,y-5,5,2,'#222');
  }
  // فم
  ctx.strokeStyle='#882200'; ctx.lineWidth=1.5*Math.min(scaleX,scaleY);
  ctx.beginPath();
  ctx.arc(px(x),py2(y-1),px(3),0.2,Math.PI-0.2);
  ctx.stroke();
}

// ─── رسم العدو (الغيطي) ──────────────────────────────────────────
function drawEnemy() {
  if (!G.enemyVisible) return;
  const ex = LANES_X[G.enemyLane];
  const ey = G.enemyY;
  const f  = G.frame;

  // لون أحمر/بني للمطارد
  const eChar = { skinColor:'#6b3515', shirtColor:'#8B0000', pantsColor:'#2a0000', capColor:'#550000' };
  ctx.save();
  ctx.globalAlpha = Math.min(1, 1 - G.enemyDist/400); // يصبح مرئياً كلما اقترب
  if (ctx.globalAlpha < 0.05) { ctx.restore(); return; }

  if (G.enemySliding) {
    ctx.translate(px(ex),py2(GROUND_Y-8)); ctx.rotate(-0.3);
    fillRect(-16,-5,32,12,eChar.shirtColor);
    fillRect(10,-12,14,14,eChar.skinColor);
    fillRect(10,-18,14,8,eChar.capColor);
  } else {
    const legL=Math.sin(f*0.3)*9, legR=-Math.sin(f*0.3)*9;
    // أرجل عدو
    ctx.save(); ctx.translate(px(ex-5),py2(ey+6)); ctx.rotate(legL*0.03);
    fillRect(-3,0,6,18,eChar.pantsColor); fillRect(-4,16,8,5,'#111'); ctx.restore();
    ctx.save(); ctx.translate(px(ex+5),py2(ey+6)); ctx.rotate(legR*0.03);
    fillRect(-3,0,6,18,eChar.pantsColor); fillRect(-4,16,8,5,'#111'); ctx.restore();
    fillRect(ex-10,ey-30,20,26,eChar.shirtColor);
    // رأس
    fillRect(ex-9,ey-46,18,18,eChar.skinColor);
    fillRect(ex-10,ey-56,20,12,eChar.capColor);
    fillRect(ex-11,ey-45,22,3,eChar.capColor);
    // ستارة الوجه - كمامة
    fillRect(ex-8,ey-40,16,6,'#333');
    // عيون غاضبة
    fillRect(ex-7,ey-48,5,3,'#ff3300');
    fillRect(ex+1,ey-48,5,3,'#ff3300');
  }
  ctx.restore();

  // علامة تحذير لو قريب جداً
  if (G.enemyDist < 150) {
    const pulse = Math.sin(G.frame*0.2)*0.3+0.7;
    ctx.save(); ctx.globalAlpha=pulse;
    drawText('⚠️', ex, ey-65, 16, '#ff0000');
    ctx.restore();
  }
}

// ─── رسم العقبات ─────────────────────────────────────────────────
function drawObstacles() {
  G.obstacles.forEach(ob => {
    if (ob.y < TRACK_TOP - 50 || ob.y > BASE_H + 50) return;
    switch(ob.type) {
      case 'train': drawTrain(ob); break;
      case 'car':   drawCar(ob);   break;
      case 'camel': drawCamel(ob); break;
      case 'barrier': drawBarrier(ob); break;
      case 'wire':  drawWire(ob);  break;
      case 'pit':   drawPit(ob);   break;
      case 'helicopter': drawHelicopter(ob); break;
      case 'ghost_train': drawGhostTrain(ob); break;
    }
  });
}

function drawTrain(ob) {
  const {x,y,w,h,lane,carCount,color,sparks,stopped,ghost} = ob;
  ctx.save();
  if (ghost) { ctx.globalAlpha=0.35; ctx.shadowColor='#aaaaff'; ctx.shadowBlur=py2(15); }

  for (let c=0;c<carCount;c++) {
    const cy = y - c*62;
    const col = c===0 ? (color||'#228822') : `hsl(${130+c*20},40%,30%)`;

    // جسم العربة
    roundRect(x-14, cy-28, 28, 55, 3, col);
    roundRect(x-11, cy-24, 22, 47, 2, 'rgba(255,255,255,0.07)');

    // نوافذ مضيئة
    const winColor = G.nightMode ? 'rgba(255,220,120,0.85)' : 'rgba(180,220,255,0.7)';
    [cy-18, cy-5, cy+8].forEach(wy => {
      fillRect(x-9, wy, 7, 9, winColor);
      fillRect(x+2, wy, 7, 9, winColor);
    });

    // عجلات دوارة
    const rot = G.frame * 0.15;
    [-16,16].forEach(dx => {
      circle(x+dx, cy+24, 7, '#222');
      circle(x+dx, cy+24, 4.5, '#555');
      // شعاع عجلة
      ctx.save(); ctx.translate(px(x+dx),py2(cy+24)); ctx.rotate(rot);
      ctx.strokeStyle='#888'; ctx.lineWidth=1.5*Math.min(scaleX,scaleY);
      ctx.beginPath(); ctx.moveTo(0,-py2(4)); ctx.lineTo(0,py2(4)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-px(4),0); ctx.lineTo(px(4),0); ctx.stroke();
      ctx.restore();
    });

    // شرر عند الاحتكاك (العجلات)
    if (sparks && c===0) {
      for (let s=0;s<5;s++) {
        const sx=x+(Math.random()-0.5)*28, sy=cy+20+Math.random()*8;
        const alpha=Math.random()*0.8;
        circle(sx,sy,1.5+Math.random()*1.5,`rgba(255,${150+Math.random()*100},0,${alpha})`);
      }
    }
  }

  // مقدمة القطار + مدخنة
  roundRect(x-14, y-28-carCount*62+62-8, 28, 12, 2, '#333');
  circle(x, y-28-carCount*62+62-14, 5, '#555');

  // وميض مصابيح أمامية
  const flashOn = G.nightMode || Math.floor(G.frame/15)%2===0;
  if (flashOn) {
    ctx.save(); ctx.shadowColor='#ffffaa'; ctx.shadowBlur=py2(12);
    circle(x-8, y-26, 4, '#ffffaa');
    circle(x+8, y-26, 4, '#ffffaa');
    ctx.restore();
  }

  if (stopped) {
    // علامة STOP
    roundRect(x-10, y-50, 20, 14, 3, '#ff2200');
    drawText('STOP',x,y-44,8,'#fff');
  }
  ctx.restore();
}

function drawCar(ob) {
  const {x,y,color,facing} = ob;
  // جسم السيارة
  roundRect(x-15,y-12,30,18,3,color||'#ccaa22');
  roundRect(x-11,y-22,22,12,3,color||'#ccaa22');
  // نوافذ
  fillRect(x-8,y-20,9,8,'rgba(150,200,255,0.7)');
  fillRect(x+0,y-20,9,8,'rgba(150,200,255,0.7)');
  // عجلات
  circle(x-10,y+7,5,'#222'); circle(x+10,y+7,5,'#222');
  circle(x-10,y+7,3,'#555'); circle(x+10,y+7,3,'#555');
  // مصابيح
  circle(x-13, y-8, 3, '#ffffcc'); circle(x+13, y-8, 3, '#ff4400');
}

function drawCamel(ob) {
  const {x,y} = ob;
  const bobY = Math.sin(G.frame*0.1)*2;
  fillRect(x-14,y-14+bobY,28,14,'#c4a363'); // جسم
  fillRect(x-4,y-28+bobY,10,16,'#c4a363'); // رقبة
  fillRect(x-8,y-36+bobY,16,12,'#c4a363'); // رأس
  fillRect(x+3,y-20+bobY,8,8,'#c8aa70'); // سنام
  // أرجل
  const lAngle = Math.sin(G.frame*0.12)*0.25;
  [-10,-2,6,14].forEach((dx,i) => {
    ctx.save(); ctx.translate(px(x+dx),py2(y));
    ctx.rotate(i%2===0?lAngle:-lAngle);
    fillRect(-2,0,4,12,'#b8936a'); ctx.restore();
  });
  // عيون
  fillRect(x-5,y-33+bobY,3,3,'#111');
  fillRect(x+3,y-33+bobY,3,3,'#111');
}

function drawBarrier(ob) {
  const {x,y,lane} = ob;
  fillRect(x-15,y-20,3,20,'#ffcc00'); fillRect(x+12,y-20,3,20,'#ffcc00');
  fillRect(x-15,y-18,30,5,'#ff2200'); fillRect(x-15,y-9,30,5,'#cc2200');
  // أسلاك
  ctx.strokeStyle='#888'; ctx.lineWidth=1*Math.min(scaleX,scaleY);
  ctx.beginPath(); ctx.moveTo(px(x-15),py2(y-23)); ctx.lineTo(px(x+15),py2(y-23)); ctx.stroke();
}

function drawWire(ob) {
  const {x,y,lane} = ob;
  // عمود كهرباء
  fillRect(x-2,y-50,4,50,'#666');
  fillRect(x-10,y-52,20,5,'#888');
  // سلك كهربائي
  ctx.strokeStyle = `hsl(${50+Math.sin(G.frame*0.3)*30},100%,60%)`;
  ctx.lineWidth=2.5*Math.min(scaleX,scaleY);
  ctx.shadowColor='#ffff00'; ctx.shadowBlur=py2(8);
  ctx.beginPath(); ctx.moveTo(0,py2(y-48)); ctx.lineTo(W,py2(y-48)); ctx.stroke();
  ctx.shadowBlur=0;
  // وميض كهربائي
  if (G.frame%6<2) {
    circle(x,y-48,4,'rgba(255,255,100,0.8)');
  }
}

function drawPit(ob) {
  const {x,y,w} = ob;
  const grad = ctx.createLinearGradient(0,py2(y),0,py2(y+20));
  grad.addColorStop(0,'#111'); grad.addColorStop(1,'#000');
  ctx.fillStyle=grad;
  ctx.fillRect(px(x-w/2),py2(y-5),px(w),py2(25));
  // حواف
  fillRect(x-w/2-3,y-5,6,5,'#444');
  fillRect(x+w/2-3,y-5,6,5,'#444');
}

function drawHelicopter(ob) {
  const {x,y} = ob;
  const hovY = Math.sin(G.frame*0.08)*4;
  // جسم
  roundRect(x-18,y-8+hovY,36,16,4,'#557755');
  // فوق
  fillRect(x-8,y-14+hovY,16,8,'#445544');
  // دوار
  const rRot = G.frame*0.2;
  ctx.save(); ctx.translate(px(x),py2(y-14+hovY));
  ctx.rotate(rRot); ctx.strokeStyle='#aaa'; ctx.lineWidth=2*Math.min(scaleX,scaleY);
  ctx.beginPath(); ctx.moveTo(-px(22),0); ctx.lineTo(px(22),0); ctx.stroke();
  ctx.restore();
  // ذيل
  fillRect(x+14,y-6+hovY,16,6,'#445544');
  circle(x+28,y-4+hovY,4,'#557755');
  // مصابيح
  circle(x-16,y+3+hovY,3,'#ff4400');
  circle(x+16,y+3+hovY,3,'#00ff44');
}

function drawGhostTrain(ob) {
  ctx.save();
  ctx.globalAlpha = 0.3 + Math.sin(G.frame*0.1)*0.15;
  ctx.shadowColor = '#aaaaff'; ctx.shadowBlur = py2(20);
  drawTrain({...ob, ghost:true, sparks:false});
  ctx.restore();
}

// ─── رسم العملات ─────────────────────────────────────────────────
function drawCoins() {
  G.coinItems.forEach(c => {
    const bobY = Math.sin(G.frame*0.15+c.lane)*3;
    // جنيه مصري (دائرة خضراء)
    circle(c.x, c.y+bobY, 9, '#22aa33');
    circle(c.x, c.y+bobY, 7, '#33cc44');
    // علامة £ (جنيه)
    drawText('£', c.x, c.y+bobY, 8, '#fff');
    // بريق
    if (G.frame % 30 < 5) {
      ctx.save(); ctx.globalAlpha=0.6;
      circle(c.x-3, c.y+bobY-3, 2.5,'#ffffff');
      ctx.restore();
    }
  });
}

// ─── رسم الـ Powerups ────────────────────────────────────────────
function drawPowerups() {
  G.powerups.forEach(p => {
    const pulse = 1 + Math.sin(G.frame*0.15)*0.12;
    const colors = {
      magnet:'#ff00ff', shield3:'#00ccff', doubleJump:'#ffaa00',
      boost:'#ff4400', x10:'#ffff00', rocket:'#ff6600', drone:'#00ffcc', tunnel:'#cc88ff'
    };
    const col = colors[p.type]||'#ffffff';
    ctx.save();
    ctx.shadowColor=col; ctx.shadowBlur=py2(12);
    ctx.translate(px(p.x),py2(p.y));
    ctx.scale(pulse,pulse);
    // مثمن
    ctx.fillStyle=col+'33'; ctx.strokeStyle=col; ctx.lineWidth=2*Math.min(scaleX,scaleY);
    ctx.beginPath();
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2-Math.PI/8;ctx.lineTo(Math.cos(a)*px(12),Math.sin(a)*py2(12));}
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    const icons = {magnet:'🧲',shield3:'🛡️',doubleJump:'⬆️',boost:'🚀',x10:'×10',rocket:'🎯',drone:'🚁',tunnel:'🌀'};
    drawText(icons[p.type]||'★', p.x, p.y, 11, '#fff');
  });
}

// ─── رسم الجسيمات ────────────────────────────────────────────────
function drawParticles() {
  G.particles.forEach(p => {
    const alpha = p.life / p.maxLife;
    ctx.save(); ctx.globalAlpha = Math.min(1,alpha);
    ctx.fillStyle = p.color;
    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(px(p.x),py2(p.y),Math.max(0.5,p.r*Math.min(scaleX,scaleY)),0,Math.PI*2);
      ctx.fill();
    } else {
      fillRect(p.x-p.r, p.y-p.r, p.r*2, p.r*2, p.color);
    }
    ctx.restore();
  });

  // نصوص النقاط
  G.scoreTexts.forEach(t => {
    ctx.save();
    ctx.globalAlpha = Math.min(1, t.life);
    ctx.fillStyle = t.color;
    ctx.font = `900 ${py2(13)}px Cairo, sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(t.text, px(t.x), py2(t.y));
    ctx.restore();
  });
}

// ─── رسم الدرون ──────────────────────────────────────────────────
function drawDrone() {
  if (!G.droneActive) return;
  const {droneX, droneY} = G;
  const hovY = Math.sin(G.frame*0.12)*3;
  roundRect(droneX-10,droneY-5+hovY,20,10,3,'#006644');
  const dRot = G.frame*0.25;
  [-8,8].forEach(dx => {
    ctx.save(); ctx.translate(px(droneX+dx),py2(droneY-5+hovY));
    ctx.rotate(dRot); ctx.strokeStyle='#aaa'; ctx.lineWidth=1.5*Math.min(scaleX,scaleY);
    ctx.beginPath(); ctx.moveTo(-px(7),0); ctx.lineTo(px(7),0); ctx.stroke();
    ctx.restore();
  });
  // خط اتصال
  ctx.strokeStyle='rgba(0,255,150,0.3)'; ctx.lineWidth=1;
  ctx.setLineDash([4,4]);
  ctx.beginPath(); ctx.moveTo(px(droneX),py2(droneY)); ctx.lineTo(px(G.px),py2(G.py-30)); ctx.stroke();
  ctx.setLineDash([]);
}

// ─── رسم أيكونات البوست النشطة ───────────────────────────────────
function updateActiveBoostsUI() {
  const el = document.getElementById('activeBoosts');
  if (!el) return;
  el.innerHTML = '';
  const icons = {magnet:'🧲',shield3:'🛡️',doubleJump:'⬆️',rocket:'🎯',x10:'×10',drone:'🚁',tunnel:'🌀'};
  const colors = {magnet:'#ff88ff',shield3:'#88ccff',doubleJump:'#ffaa00',rocket:'#ff8800',x10:'#ffff00',drone:'#00ffcc',tunnel:'#cc88ff'};
  Object.entries(G.activeBoosts).forEach(([type,frames])=>{
    if (!frames || frames<=0) return;
    const sec = Math.ceil(frames/60);
    const d = document.createElement('div');
    d.className='boost-badge';
    d.style.borderColor = colors[type]||'#fff';
    d.style.color = colors[type]||'#fff';
    d.innerHTML=`${icons[type]||'★'}<span class="btimer">${sec}s</span>`;
    el.appendChild(d);
  });
}

// ─── منطق توليد العقبات ──────────────────────────────────────────
let obstacleSpawnTimer = 0;
let coinSpawnTimer     = 0;
let powerupSpawnTimer  = 0;
let weatherTimer2      = 0;
let voiceTimer         = 0;

function spawnObstacles(dt) {
  obstacleSpawnTimer -= dt;
  if (obstacleSpawnTimer > 0) return;
  const baseInterval = Math.max(0.6, 2.5 - G.score * 0.00008);
  obstacleSpawnTimer = baseInterval * (0.7 + Math.random()*0.6);

  const lane = Math.floor(Math.random()*LANE_CNT);
  const lv   = LEVELS[G.level];
  const r    = Math.random();

  // احتمالية قطارين متتاليين
  if (r < 0.35) {
    spawnTrain(lane);
    if (Math.random() < 0.3 && G.speed > 8) {
      setTimeout(() => { if(G.running) spawnTrain(Math.floor(Math.random()*LANE_CNT)); }, 800);
    }
  } else if (r < 0.55) {
    spawnCar(lane);
  } else if (r < 0.65 && G.score > 1000) {
    spawnCamel(lane);
  } else if (r < 0.72 && G.score > 500) {
    spawnBarrier(lane);
  } else if (r < 0.78 && G.score > 2000) {
    // سلك كهربائي (يستدعي الانزلاق)
    spawnWire(lane);
  } else if (r < 0.83 && G.score > 3000) {
    spawnPit(lane);
  } else if (r < 0.87 && G.score > 5000) {
    spawnHelicopter(lane);
  } else if (r < 0.91 && G.score > 8000) {
    // قطار شبح
    spawnGhostTrain(lane);
  } else {
    spawnTrain(lane);
  }

  // قطار سريع خلف بطيء أحياناً
  if (Math.random() < 0.12 && G.score > 4000) {
    const fastLane = (lane + 1) % LANE_CNT;
    setTimeout(() => { if(G.running) spawnTrain(fastLane, true); }, 400);
  }
}

function spawnTrain(lane, fast=false) {
  const trainColors = ['#227722','#226699','#882222','#886600','#446688'];
  const carCount = 2 + Math.floor(Math.random()*3);
  G.obstacles.push({
    id: Math.random(), type:'train',
    x: LANES_X[lane], y: TRACK_TOP - 20,
    w: 28, h: 55 * carCount,
    lane, carCount,
    color: trainColors[Math.floor(Math.random()*trainColors.length)],
    speed: G.speed * (fast?1.5:1) * LEVELS[G.level].trainSpeed,
    sparks: Math.random()<0.4,
    stopped: false, stoppedTimer: 0,
    whistled: false,
  });
}

function spawnCar(lane) {
  const carColors = ['#ccaa22','#ff4400','#4444cc','#ffffff','#222222','#cc2222'];
  G.obstacles.push({
    id:Math.random(), type:'car',
    x: LANES_X[lane], y: TRACK_TOP-10,
    w:30, h:30, lane,
    color: carColors[Math.floor(Math.random()*carColors.length)],
    speed: G.speed * 0.9,
  });
}

function spawnCamel(lane) {
  G.obstacles.push({ id:Math.random(), type:'camel', x:LANES_X[lane], y:TRACK_TOP, w:28,h:38, lane, speed:G.speed*0.7 });
}

function spawnBarrier(lane) {
  G.obstacles.push({ id:Math.random(), type:'barrier', x:LANES_X[lane], y:GROUND_Y-14, w:30,h:22, lane, speed:G.speed });
}

function spawnWire(lane) {
  G.obstacles.push({ id:Math.random(), type:'wire', x:LANES_X[lane], y:GROUND_Y-30, w:BASE_W, h:10, lane, speed:G.speed, needsSlide:true });
}

function spawnPit(lane) {
  G.obstacles.push({ id:Math.random(), type:'pit', x:LANES_X[lane], y:GROUND_Y-5, w:50,h:20, lane, speed:G.speed });
}

function spawnHelicopter(lane) {
  G.obstacles.push({ id:Math.random(), type:'helicopter', x:LANES_X[lane], y:GROUND_Y-60, w:36,h:20, lane, speed:G.speed*0.8 });
}

function spawnGhostTrain(lane) {
  G.obstacles.push({
    id:Math.random(), type:'ghost_train',
    x:LANES_X[lane], y:TRACK_TOP-20,
    w:28, h:110, lane, carCount:2,
    color:'#aaaaff', speed:G.speed*1.4,
    sparks:false, stopped:false, ghost:true
  });
}

function spawnCoins(dt) {
  coinSpawnTimer -= dt;
  if (coinSpawnTimer > 0) return;
  coinSpawnTimer = 0.5 + Math.random()*0.8;
  // رصفة من 5-8 عملات
  const lane = Math.floor(Math.random()*LANE_CNT);
  const count = 4 + Math.floor(Math.random()*5);
  for (let i=0;i<count;i++) {
    G.coinItems.push({
      id:Math.random(), lane,
      x: LANES_X[lane], y: GROUND_Y-30 - i*22,
      collected: false,
    });
  }
}

function spawnPowerup(dt) {
  powerupSpawnTimer -= dt;
  if (powerupSpawnTimer > 0) return;
  powerupSpawnTimer = 8 + Math.random()*12;
  const types = ['magnet','shield3','doubleJump','boost','x10','rocket','drone','tunnel'];
  const type = types[Math.floor(Math.random()*types.length)];
  const lane = Math.floor(Math.random()*LANE_CNT);
  G.powerups.push({ id:Math.random(), type, x:LANES_X[lane], y:GROUND_Y-35, lane });
}

// ─── منطق العدو (الغيطي) ─────────────────────────────────────────
function updateEnemy(dt) {
  if (!G.enemyVisible) {
    if (G.score > 500) G.enemyVisible = true;
    return;
  }

  // العدو يقترب تدريجياً
  const catchSpeed = 0.3 + G.speed * 0.015 + G.score * 0.000005;
  G.enemyDist -= catchSpeed * dt * 60;

  // إذا كان للاعب بوست، العدو يتأخر
  if (G.boosting || G.activeBoosts.tunnel) {
    G.enemyDist += 2 * dt * 60;
  }

  G.enemyDist = Math.max(-10, Math.min(800, G.enemyDist));

  // العدو يحاول تقليد مسار اللاعب (ذكاء بسيط)
  if (G.frame % 45 === 0) {
    // أحياناً يتوقع التحرك
    const predict = Math.random() < 0.4 ? G.targetLane : G.lane;
    if (G.enemyLane !== predict && Math.abs(G.enemyLane - predict) > 0) {
      G.enemyLane += Math.sign(predict - G.enemyLane);
    }
  }

  // العدو يقفز فوق العقبات
  const enemyX = LANES_X[G.enemyLane];
  if (!G.enemyJumping) {
    const aheadObs = G.obstacles.find(ob => ob.lane===G.enemyLane && ob.y > GROUND_Y-150 && ob.y < GROUND_Y);
    if (aheadObs && Math.random()<0.6) {
      G.enemyJumping = true; G.enemyJumpVY = -10;
    }
  }

  if (G.enemyJumping) {
    G.enemyY += G.enemyJumpVY * dt * 60;
    G.enemyJumpVY += 0.4 * dt * 60;
    if (G.enemyY >= GROUND_Y) { G.enemyY = GROUND_Y; G.enemyJumping = false; G.enemyJumpVY = 0; }
  } else { G.enemyY = GROUND_Y; }

  // صافرة أو تهديد
  G.enemyWhistleTimer -= dt;
  if (G.enemyWhistleTimer <= 0 && G.enemyDist < 200) {
    G.enemyWhistleTimer = 3 + Math.random()*5;
    SFX.enemyClose();
    showHypeMsg(['خد بالك!','مستلحقكش!','يا هههه!'][Math.floor(Math.random()*3)], '#ff4444');
  }

  // لو لمسنا
  if (G.enemyDist < 10 && G.enemyLane === G.lane && !G.activeBoosts.shield3 && G.invincible===0) {
    triggerCrash();
  }

  // شريط الخطر
  const pct = Math.max(0, Math.min(100, (1 - G.enemyDist/800)*100));
  const fill = document.getElementById('dangerFill');
  const pctEl = document.getElementById('dangerPct');
  if (fill) fill.style.width = pct+'%';
  if (pctEl) {
    if (pct > 75) { pctEl.textContent='خطر!'; pctEl.style.color='#ff2200'; }
    else if (pct > 40) { pctEl.textContent='قريب'; pctEl.style.color='#ffaa00'; }
    else { pctEl.textContent='بعيد'; pctEl.style.color='#88ff88'; }
  }
}

// ─── منطق اللاعب ─────────────────────────────────────────────────
const PLAYER_SPEED = 6.5; // px/frame

function updatePlayer(dt) {
  // حركة أفقية ناعمة
  const targetX = LANES_X[G.targetLane];
  G.px += (targetX - G.px) * Math.min(1, 14 * dt);

  // قفز
  if (G.jumping) {
    G.py += G.jumpVY * dt * 60;
    G.jumpVY += 0.55 * dt * 60;
    if (G.py >= GROUND_Y) {
      G.py = GROUND_Y; G.jumping=false; G.jumpVY=0;
      G.doubleJumpUsed=false;
      SFX.land();
      // غبار عند الهبوط
      for(let i=0;i<8;i++) addParticle({x:G.px+(Math.random()-0.5)*14,y:GROUND_Y,vx:(Math.random()-0.5)*1.5,vy:-Math.random()*1.5,life:0.5,r:2,color:'rgba(180,150,100,0.5)',gravity:0.05});
    }
  }

  // انزلاق
  if (G.sliding) {
    G.slideTimer -= dt;
    if (G.slideTimer <= 0) { G.sliding=false; }
  }

  // بوست
  if (G.boosting) {
    G.boostTimer -= dt;
    if (G.boostTimer <= 0) { G.boosting=false; G.boostMeter=0; }
    G.speed = Math.min(30, G.speed * 1.003);
  }

  // تناقص بوست ميتر
  if (!G.boosting) {
    G.speed = 5.5 + G.score * 0.0006; // سرعة أساسية تزيد مع النقاط
    G.speed = Math.min(22, G.speed);
  }
  if (G.speed > G.maxSpeed) G.maxSpeed = G.speed;

  // دجاج مغناطيس
  if (G.activeBoosts.magnet) {
    G.coinItems.forEach(c => {
      if (!c.collected) {
        const dx = G.px - c.x, dy = (G.py-18) - c.y;
        const dist = Math.sqrt(dx*dx+dy*dy);
        if (dist < 90) { c.x += dx/dist*4; c.y += dy/dist*4; }
      }
    });
  }

  // درون يجمع عملات
  if (G.droneActive) {
    G.droneX += (G.px - G.droneX) * 0.06;
    G.droneY += ((G.py - 60) - G.droneY) * 0.06;
    G.coinItems.forEach(c => {
      if (!c.collected) {
        const dx = G.droneX - c.x, dy = G.droneY - c.y;
        if (Math.sqrt(dx*dx+dy*dy) < 60) { c.x += dx*0.15; c.y += dy*0.15; }
      }
    });
  }

  // نفق (اختفاء مؤقت)
  if (G.activeBoosts.tunnel) G.invincible = 999;

  // كاميرا شيك
  if (G.shakeAmt > 0) G.shakeAmt -= dt * 4;

  // تراكم البوست
  G.boostMeter = Math.min(100, G.boostMeter);

  // تحديث الـ invincible
  if (G.invincible > 0 && !G.activeBoosts.tunnel) G.invincible -= dt*60;

  // هاميد ضربة إضافية
  if (DB.selectedChar==='hammad' && G.hamadShieldCooldown > 0) G.hamadShieldCooldown -= dt;

  // حداثة بوستات
  Object.keys(G.activeBoosts).forEach(k => {
    if (G.activeBoosts[k] > 0) G.activeBoosts[k] -= dt;
    if (G.activeBoosts[k] <= 0) delete G.activeBoosts[k];
  });
  if (!G.activeBoosts.drone && G.droneActive) G.droneActive = false;

  // غبار جري
  if (!G.jumping && !G.sliding && G.frame%4===0) {
    addParticle({x:G.px+(Math.random()-0.5)*10,y:GROUND_Y+3,vx:(Math.random()-0.5)*0.8,vy:-0.3,life:0.4,r:2.5,color:'rgba(180,150,100,0.4)'});
  }
  // شرر في الانزلاق
  if (G.sliding && G.frame%2===0) {
    for(let i=0;i<3;i++) addParticle({x:G.px,y:GROUND_Y,vx:(Math.random()-0.5)*3,vy:-Math.random()*2,life:0.35,r:1.5,color:`hsl(${30+Math.random()*30},100%,60%)`,shape:'rect'});
  }
}

// ─── فحص التصادمات ───────────────────────────────────────────────
function checkCollisions() {
  const px2 = G.px, py2b = G.py;
  const pr = G.sliding ? 8 : 12; // نصف قطر اللاعب
  const ph = G.sliding ? 10 : 36;

  // عقبات
  for (let i=G.obstacles.length-1;i>=0;i--) {
    const ob = G.obstacles[i];
    const dist = Math.abs(px2 - ob.x);
    if (dist > ob.w*0.7) continue;

    // تصادم عمودي
    const collideY = py2b > ob.y - ob.h*0.9 && py2b - ph < ob.y + 5;
    if (!collideY) continue;

    // مسار
    if (ob.lane !== G.lane && ob.type !== 'wire' && ob.type !== 'pit') continue;

    // سلك كهربائي يتطلب انزلاق
    if (ob.type === 'wire') {
      if (!G.sliding && py2b - ph < ob.y - 28 && G.invincible<=0) {
        hitEnemy(ob);
      }
      continue;
    }

    // حفرة يتطلب قفز
    if (ob.type === 'pit') {
      if (!G.jumping && G.invincible<=0) hitEnemy(ob);
      continue;
    }

    // هليكوبتر - يتصادم فقط إذا لم نقفز
    if (ob.type === 'helicopter') {
      if (G.jumping && py2b < ob.y - 20) continue; // فوق المروحية
    }

    if (G.invincible > 0) continue;

    // تصادم!
    hitEnemy(ob);
    return;
  }

  // عملات
  for (let i=G.coinItems.length-1;i>=0;i--) {
    const c = G.coinItems[i];
    if (c.collected) continue;
    if (Math.abs(G.px - c.x) < 16 && Math.abs((G.py-15) - c.y) < 18) {
      collectCoin(c, i);
    }
  }

  // بوست
  for (let i=G.powerups.length-1;i>=0;i--) {
    const p = G.powerups[i];
    if (Math.abs(G.px-p.x)<20 && Math.abs((G.py-18)-p.y)<22) {
      activatePowerup(p.type);
      // جسيمات
      for(let j=0;j<16;j++) addParticle({x:p.x,y:p.y,vx:(Math.random()-0.5)*5,vy:-Math.random()*4,life:0.9,r:3,color:`hsl(${Math.random()*360},100%,60%)`});
      G.powerups.splice(i,1);
    }
  }
}

function collectCoin(c, idx) {
  c.collected = true;
  const mult = DB.selectedChar==='awatef' ? 1.5 : 1;
  const coinVal = G.activeBoosts.x10 ? 10 : (G.boosting ? 3 : 1);
  coins_this_run_add(coinVal * mult);
  G.combo++;
  G.comboTimer = 3;
  G.boostMeter = Math.min(100, G.boostMeter + 3);
  G.score += 5 * coinVal;

  // جسيمات ذهبية
  for(let j=0;j<6;j++) addParticle({x:c.x,y:c.y,vx:(Math.random()-0.5)*2.5,vy:-2-Math.random()*2,life:0.7,r:2.5,color:'#ffcc00'});

  // رسالة تحفيز كل X جنيه
  if (G.coins % 10 === 0) {
    const msgs = [
      ['💰 خد يا معلم!','#ffcc00'],['🤑 جامد!','#ffaa00'],['💵 ملياردير!','#ffff00'],
      ['🔥 حارق!','#ff8800'],['👑 الملك!','#ffdd00'],
    ];
    const [txt,col] = msgs[Math.floor(Math.random()*msgs.length)];
    showBigMoneyMsg(txt,col);
    SFX.bigCoin();
  } else {
    SFX.coin();
  }

  // نص النقاط
  addScoreText(c.x, c.y-15, `+${coinVal*5}`, '#ffcc00');
  G.coinItems.splice(idx,1);
}

let _coinsSession = 0;
function coins_this_run_add(v) {
  _coinsSession += v;
  G.coins = Math.floor(_coinsSession);
}

function activatePowerup(type) {
  SFX.powerup();
  const BOOST_DUR = { magnet:8, shield3:6, doubleJump:10, rocket:15, x10:6, drone:12, tunnel:4 };
  const dur = BOOST_DUR[type] || 5;
  switch(type) {
    case 'boost':
      G.boosting=true; G.boostTimer=5; G.boostMeter=100;
      SFX.boost(); showHypeMsg('🚀 انطلاق!','#ff4400');
      break;
    case 'rocket':
      G.activeBoosts.rocket = dur;
      // يدمر أول عقبة في نفس المسار
      fireRocket();
      break;
    case 'drone':
      G.activeBoosts.drone = dur;
      G.droneActive=true; G.droneX=G.px; G.droneY=G.py-60;
      break;
    case 'doubleJump':
      G.doubleJumpReady=true;
      G.activeBoosts.doubleJump = dur;
      break;
    default:
      G.activeBoosts[type] = dur;
  }
  showHypeMsg({magnet:'🧲 مغناطيس!',shield3:'🛡️ درع!',doubleJump:'⬆️ قفز مزدوج!',x10:'×10 نقاط!',tunnel:'🌀 نفق سري!',rocket:'🎯 صاروخ!',drone:'🚁 درون!'}[type]||'✨ تم!','#00ffff');
}

function fireRocket() {
  const target = G.obstacles.find(ob=>ob.lane===G.lane && ob.y > GROUND_Y-200);
  if (!target) return;
  SFX.rocket();
  for(let j=0;j<20;j++) addParticle({x:target.x,y:target.y,vx:(Math.random()-0.5)*5,vy:-4-Math.random()*4,life:1,r:4,color:`hsl(${Math.random()*50},100%,60%)`,shape:'rect'});
  G.obstacles = G.obstacles.filter(ob=>ob!==target);
  G.trainsPassed++;
  addScoreText(target.x, target.y-30, '💥 +100', '#ff8800');
  G.score += 100;
}

function hitEnemy(ob) {
  // هاميد يتحمل ضربة
  if (DB.selectedChar==='hammad' && G.hamadShieldCooldown<=0) {
    G.hamadShieldCooldown=30; G.invincible=120;
    showHypeMsg('🛡️ هاميد صامد!','#88ff88');
    G.shakeAmt = 0.5;
    SFX.powerup();
    return;
  }
  // درع ثلاثي
  if (G.activeBoosts.shield3) {
    G.activeBoosts.shield3 -= 2;
    if (G.activeBoosts.shield3 <= 0) delete G.activeBoosts.shield3;
    G.invincible=90; G.shakeAmt=0.5;
    showHypeMsg('🛡️ انكسر الدرع!','#88ccff');
    return;
  }
  triggerCrash();
}

function triggerCrash() {
  if (!G.running) return;
  SFX.crash();
  if (DB.settings.shake) G.shakeAmt = 1.5;
  // شرر وأجزاء
  for(let j=0;j<30;j++) addParticle({x:G.px,y:G.py-18,vx:(Math.random()-0.5)*8,vy:-6+Math.random()*4,life:1.4,r:3+Math.random()*3,color:`hsl(${Math.random()*50},100%,55%)`,gravity:0.2,shape:'rect'});
  G.running = false;
  stopMusic();
  playVoice('gameover');
  setTimeout(showGameOver, 600);
}

// ─── تحديث العقبات والعملات ──────────────────────────────────────
function updateObstacles(dt) {
  const moveY = G.speed * dt * 60;

  G.obstacles.forEach(ob => {
    // توقف مفاجئ للقطار أحياناً
    if (ob.type==='train' && !ob.stopped && Math.random()<0.0005*G.speed) {
      ob.stopped=true; ob.stoppedTimer=1.5+Math.random()*2;
      SFX.trainClose();
    }
    if (ob.stopped) {
      ob.stoppedTimer -= dt;
      if (ob.stoppedTimer <= 0) ob.stopped = false;
      return;
    }

    ob.y += moveY;

    // صافرة قطار عند الاقتراب
    if (ob.type==='train' && !ob.whistled && ob.y > GROUND_Y-200) {
      ob.whistled=true; SFX.trainClose();
    }

    // تجاوز قطار (نقاط)
    if (ob.y > GROUND_Y + ob.h + 10 && !ob.passed) {
      ob.passed = true;
      if (ob.type==='train') {
        G.trainsPassed++;
        G.score += 50;
        addScoreText(ob.x, GROUND_Y-60, '+50', '#88ff88');
      }
    }
  });

  G.obstacles = G.obstacles.filter(ob => ob.y < BASE_H + 200);

  // عملات
  G.coinItems.forEach(c => { c.y += moveY; });
  G.coinItems = G.coinItems.filter(c => c.y < BASE_H + 30);

  // بوست
  G.powerups.forEach(p => { p.y += moveY; });
  G.powerups = G.powerups.filter(p => p.y < BASE_H + 30);
}

function updateParticles(dt) {
  G.particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.gravity) p.vy += p.gravity;
    p.life -= dt;
  });
  G.particles = G.particles.filter(p => p.life > 0);

  G.scoreTexts.forEach(t => { t.y += t.vy; t.life -= dt; });
  G.scoreTexts = G.scoreTexts.filter(t => t.life > 0);
}

// ─── تحديث بيئة العالم ───────────────────────────────────────────
function updateWorld(dt) {
  const mv = G.speed * dt * 60;

  // ساعة طبيعة
  G.dayNightTimer += dt;
  if (G.dayNightTimer > 240) { G.dayNightTimer=0; G.nightMode=!G.nightMode; }

  // مباني
  G.buildingsX = G.buildingsX.map(bx => { bx += mv*0.18; if(bx>BASE_W+60) bx=-60; return bx; });
  G.cloudX     = G.cloudX.map((cx,i)=>{ cx+=mv*0.05; if(cx>BASE_W+50) cx=-50; return cx; });

  // طقس عشوائي
  G.weatherTimer -= dt;
  if (G.weatherTimer <= 0) {
    G.weatherTimer = 20+Math.random()*40;
    const weathers = ['clear','clear','clear','rain','dust','fog'];
    G.weatherType = weathers[Math.floor(Math.random()*weathers.length)];
  }

  // مرحلة جديدة
  const newLevel = LEVELS.findIndex((l,i)=>l.scoreThresh<=G.score && (i===LEVELS.length-1||LEVELS[i+1].scoreThresh>G.score));
  if (newLevel !== G.level) {
    G.level = Math.max(0,newLevel);
    onLevelUp();
  }
}

function onLevelUp() {
  SFX.levelUp();
  const lv = LEVELS[G.level];
  showHypeMsg(`🏙️ ${lv.name}!`, '#00ffff');
  // جزيمات مرحلة جديدة
  for(let j=0;j<30;j++) addParticle({x:Math.random()*BASE_W,y:Math.random()*BASE_H*0.5,vx:(Math.random()-0.5)*3,vy:2+Math.random()*3,life:1.5,r:4,color:`hsl(${Math.random()*360},100%,60%)`});
  checkAchievements();
}

// ─── نقاط وتقدم ──────────────────────────────────────────────────
function updateScore(dt) {
  const mult = G.activeBoosts.x10 ? 10 : (G.boosting ? 2 : 1);
  G.score += G.speed * dt * mult * 0.5;

  // كومبو timeout
  if (G.combo > 0) {
    G.comboTimer -= dt;
    if (G.comboTimer <= 0) G.combo=0;
  }

  // تعليق صوتي دوري
  voiceTimer -= dt;
  if (voiceTimer <= 0) {
    voiceTimer = 8 + Math.random()*15;
    playVoice('random');
  }

  // برق (حياة إضافية): 1000 نقطة بدون خطأ
  if (Math.floor(G.score)%1000===0 && G.invincible===0 && G.frame%60===0 && G.score>0) {
    G.invincible = 120;
    showHypeMsg('⚡ البرق! +حياة','#ffff44');
    for(let j=0;j<20;j++) addParticle({x:G.px,y:G.py-20,vx:(Math.random()-0.5)*4,vy:-3-Math.random()*3,life:1,r:3,color:'#ffff44'});
  }
}

// ─── الإنجازات ────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  { id:'first1000', label:'🏅 مبتدئ', cond:()=>G.score>=1000, reward:50 },
  { id:'trains10',  label:'🚆 سارق القطارات', cond:()=>G.trainsPassed>=10, reward:100 },
  { id:'coins50',   label:'💰 غني', cond:()=>G.coins>=50, reward:200 },
  { id:'speed20',   label:'💨 أسرع من البرق', cond:()=>G.maxSpeed>=18, reward:150 },
  { id:'level3',    label:'🏙️ مسافر', cond:()=>G.level>=2, reward:100 },
];

let earnedAchieves = new Set();
function checkAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (!earnedAchieves.has(a.id) && a.cond()) {
      earnedAchieves.add(a.id);
      showAchievement(a.label, a.reward);
    }
  });
}

function showAchievement(label, reward) {
  const el=document.getElementById('achieveToast');
  if(!el) return;
  el.textContent = `${label}  +${reward}💰`;
  el.classList.remove('hidden');
  DB.totalCoins += reward;
  G.coins += reward;
  saveDB();
  setTimeout(()=>el.classList.add('hidden'),3200);
}

// ─── رسائل الشاشة ────────────────────────────────────────────────
let hypeTimeout = null;
function showHypeMsg(text, color='#ffff00') {
  const el=document.getElementById('hypeMsg');
  if(!el) return;
  el.textContent=text; el.style.color=color;
  el.classList.remove('hidden');
  el.style.animation='none'; void el.offsetWidth;
  el.style.animation='hypeAnim 1.8s ease forwards';
  if(hypeTimeout) clearTimeout(hypeTimeout);
  hypeTimeout=setTimeout(()=>el.classList.add('hidden'),1900);
}

let bigMoneyTimeout=null;
function showBigMoneyMsg(text,color) {
  const el=document.getElementById('bigMoneyMsg');
  if(!el) return;
  el.textContent=text; el.style.color=color;
  el.style.textShadow=`0 0 30px ${color}, 0 0 60px ${color}`;
  el.classList.remove('hidden');
  el.style.animation='none'; void el.offsetWidth;
  el.style.animation='bigMoneyAnim 2.2s ease forwards';
  if(bigMoneyTimeout) clearTimeout(bigMoneyTimeout);
  bigMoneyTimeout=setTimeout(()=>el.classList.add('hidden'),2300);
}

// ─── تحديث HUD ───────────────────────────────────────────────────
function updateHUD() {
  const scoreEl=document.getElementById('hudScore');
  const coinsEl=document.getElementById('hudCoins');
  const lvEl   =document.getElementById('hudLevelLbl');
  const bfEl   =document.getElementById('boostFill');
  const bpEl   =document.getElementById('boostPct');
  const cdEl   =document.getElementById('comboDisplay');
  const cvEl   =document.getElementById('comboVal');
  const hllEl  =document.getElementById('hudLevel');

  if(scoreEl) scoreEl.textContent=Math.floor(G.score);
  if(coinsEl) coinsEl.textContent=G.coins;
  if(lvEl)    lvEl.textContent=LEVELS[G.level].name;
  if(hllEl)   hllEl.textContent=G.level+1;
  if(bfEl)    bfEl.style.width=G.boostMeter+'%';
  if(bpEl)    bpEl.textContent=Math.floor(G.boostMeter)+'%';

  if(cdEl && cvEl) {
    if(G.combo>=3) {
      cdEl.classList.remove('hidden'); cvEl.textContent=G.combo;
      const h=G.combo>=15?'#ff2200':G.combo>=8?'#ff8800':'#ffff00';
      cdEl.style.color=h;
      cdEl.style.fontSize=`${Math.min(2.5,1+G.combo*0.08)}rem`;
    } else { cdEl.classList.add('hidden'); }
  }

  updateActiveBoostsUI();
  checkAchievements();
}

// ─── حلقة اللعبة الرئيسية ────────────────────────────────────────
let lastTime = 0;
function gameLoop(ts) {
  if (!G.running) return;
  const dt = Math.min(0.05, (ts - lastTime) / 1000);
  lastTime = ts;
  G.frame++;

  // كاميرا شيك
  if (G.shakeAmt > 0.05 && DB.settings.shake) {
    ctx.save();
    const sx=(Math.random()-0.5)*G.shakeAmt*12, sy=(Math.random()-0.5)*G.shakeAmt*8;
    ctx.translate(sx*scaleX, sy*scaleY);
  }

  // رسم الإطار
  ctx.clearRect(0,0,W,H);
  drawBackground();
  drawObstacles();
  drawCoins();
  drawPowerups();
  drawPlayer();
  drawEnemy();
  drawDrone();
  drawParticles();

  if (G.shakeAmt > 0.05 && DB.settings.shake) ctx.restore();

  // منطق
  updatePlayer(dt);
  updateObstacles(dt);
  updateParticles(dt);
  updateWorld(dt);
  updateScore(dt);
  updateEnemy(dt);
  spawnObstacles(dt);
  spawnCoins(dt);
  spawnPowerup(dt);
  updateHUD();

  G.scoreHistory.push(Math.floor(G.score));
  if (G.scoreHistory.length > 200) G.scoreHistory.shift();

  requestAnimationFrame(gameLoop);
}

// ─── التحكم ──────────────────────────────────────────────────────
function doLeft()  { if(G.targetLane>0) G.targetLane--; }
function doRight() { if(G.targetLane<4) G.targetLane++; }
function doJump()  {
  if (!G.jumping) {
    G.jumping=true; G.jumpVY=-12; SFX.jump();
    // حلقة غبار
    for(let i=0;i<8;i++) addParticle({x:G.px+(Math.random()-0.5)*12,y:GROUND_Y,vx:(Math.random()-0.5)*2,vy:-1.5-Math.random()*1.5,life:0.5,r:2,color:'rgba(180,150,100,0.5)'});
  } else if (G.doubleJumpReady && !G.doubleJumpUsed) {
    G.doubleJumpUsed=true; G.jumpVY=-9; SFX.jump();
    for(let i=0;i<12;i++) addParticle({x:G.px,y:G.py,vx:(Math.random()-0.5)*3,vy:-2-Math.random()*2,life:0.6,r:3,color:'#ffaa00'});
    showHypeMsg('⬆️ قفز مزدوج!','#ffaa00');
  }
}
function doSlide() {
  if (!G.jumping) { G.sliding=true; G.slideTimer=1.0; SFX.slide(); }
}
function doBoost() {
  if (G.boostMeter>=100 && !G.boosting) {
    G.boosting=true; G.boostTimer=5; SFX.boost();
    showHypeMsg('⚡ بوست ملكي!','#ffff00');
  }
}

window.addEventListener('keydown', e => {
  if (!G.running) return;
  if (e.key==='ArrowLeft'||e.key==='a'||e.key==='A') doLeft();
  else if (e.key==='ArrowRight'||e.key==='d'||e.key==='D') doRight();
  else if (e.key==='ArrowUp'||e.key==='w'||e.key==='W'||e.key===' ') doJump();
  else if (e.key==='ArrowDown'||e.key==='s'||e.key==='S') doSlide();
  else if (e.key==='Shift') doBoost();
  e.preventDefault();
});

// لمس
let touchSX=0,touchSY=0,touchT=0;
window.addEventListener('touchstart',e=>{
  touchSX=e.touches[0].clientX; touchSY=e.touches[0].clientY; touchT=Date.now();
},{passive:true});
window.addEventListener('touchend',e=>{
  if(!G.running) return;
  const dx=e.changedTouches[0].clientX-touchSX, dy=e.changedTouches[0].clientY-touchSY;
  const elapsed=Date.now()-touchT;
  if(Math.abs(dx)>Math.abs(dy)) {
    if(Math.abs(dx)>25) { dx>0?doRight():doLeft(); }
  } else {
    if(dy<-25) doJump();
    else if(dy>25) doSlide();
    else if(elapsed<200) doJump();
  }
},{passive:true});

// زر لمس HUD
function touchAction(a) {
  if(!G.running) return;
  if(a==='left') doLeft();
  else if(a==='right') doRight();
  else if(a==='up') doJump();
  else if(a==='down') doSlide();
  else if(a==='boost') doBoost();
}

// ─── بدء اللعبة ──────────────────────────────────────────────────
function startGame() {
  initAudio(); resumeAudio();
  resetGameState();
  _coinsSession=0;
  earnedAchieves.clear();
  obstacleSpawnTimer=2; coinSpawnTimer=1; powerupSpawnTimer=10;
  weatherTimer2=0; voiceTimer=5;
  G.running=true; G.startTime=Date.now();

  DB.attempts++;
  showScreen('screenHUD');
  saveDB();
  startMusic();
  playVoice('start');
  lastTime=performance.now();
  requestAnimationFrame(gameLoop);
}

// ─── نهاية اللعبة ────────────────────────────────────────────────
function showGameOver() {
  const sc=Math.floor(G.score);
  const isNew = sc > DB.highScore;
  if(isNew) { DB.highScore=sc; document.getElementById('newRecord')?.classList.remove('hidden'); }
  else { document.getElementById('newRecord')?.classList.add('hidden'); }
  DB.totalCoins += G.coins;

  // لوحة الأوائل
  DB.leaderboard.push({ score:sc, coins:G.coins, date:new Date().toLocaleDateString('ar-EG') });
  DB.leaderboard.sort((a,b)=>b.score-a.score);
  DB.leaderboard = DB.leaderboard.slice(0,5);
  saveDB();

  document.getElementById('ovScore').textContent=sc;
  document.getElementById('ovHS').textContent=DB.highScore;
  document.getElementById('ovCoins').textContent=G.coins;
  document.getElementById('ovSpeed').textContent=(G.maxSpeed*0.6).toFixed(1)+'px/s';
  document.getElementById('ovTrains').textContent=G.trainsPassed;
  const elapsed=Math.floor((Date.now()-G.startTime)/1000);
  document.getElementById('ovTime').textContent=elapsed+'s';

  drawScoreChart();
  showScreen('screenOver');
}

function drawScoreChart() {
  const canvas2=document.getElementById('scoreChart');
  if(!canvas2) return;
  const c2=canvas2.getContext('2d');
  const W2=canvas2.width, H2=canvas2.height;
  c2.clearRect(0,0,W2,H2);
  c2.fillStyle='rgba(255,255,255,0.04)'; c2.fillRect(0,0,W2,H2);
  if(G.scoreHistory.length<2) return;
  const max=Math.max(...G.scoreHistory)||1;
  const grad=c2.createLinearGradient(0,0,W2,0);
  grad.addColorStop(0,'#ff6600'); grad.addColorStop(1,'#ffcc00');
  c2.strokeStyle=grad; c2.lineWidth=2.5; c2.beginPath();
  G.scoreHistory.forEach((s,i)=>{
    const sx=i/G.scoreHistory.length*W2, sy=H2-(s/max)*(H2-10)-5;
    i===0?c2.moveTo(sx,sy):c2.lineTo(sx,sy);
  });
  c2.stroke();
  c2.fillStyle=grad; c2.globalAlpha=0.15;
  c2.lineTo(W2,H2); c2.lineTo(0,H2); c2.fill();
}

// ─── الشاشات ─────────────────────────────────────────────────────
const SCREENS = ['screenStart','screenChar','screenShop','screenLeaders','screenSettings','screenHUD','screenOver'];
function showScreen(id) {
  SCREENS.forEach(s => {
    const el=document.getElementById(s);
    if(!el) return;
    if(s===id) { el.classList.remove('hidden'); setTimeout(()=>el.classList.add('active'),10); }
    else { el.classList.remove('active'); setTimeout(()=>el.classList.add('hidden'),350); }
  });
}

// ─── بناء شاشة الشخصيات ──────────────────────────────────────────
function buildCharScreen() {
  const grid=document.getElementById('charGrid'); if(!grid) return;
  grid.innerHTML='';
  CHARACTERS.forEach(char => {
    const owned=DB.ownedChars.includes(char.id);
    const selected=DB.selectedChar===char.id;
    const div=document.createElement('div');
    div.className=`char-card ${selected?'selected':''} ${owned?'':'locked'}`;
    // رسم الشخصية على كانفاس صغير
    const c=document.createElement('canvas');
    c.width=90; c.height=100; c.className='char-canvas';
    drawMiniChar(c,char);
    div.appendChild(c);
    const nm=document.createElement('div'); nm.className='char-name'; nm.textContent=char.name; div.appendChild(nm);
    const ab=document.createElement('div'); ab.className='char-ability'; ab.textContent=char.ability; div.appendChild(ab);
    if(!owned) {
      const cost=document.createElement('div'); cost.className='char-cost'; cost.textContent=`🔒 ${char.unlockCost}💰`; div.appendChild(cost);
      div.onclick=()=>tryBuyChar(char);
    } else {
      div.onclick=()=>selectChar(char.id);
    }
    grid.appendChild(div);
  });
}

function drawMiniChar(canvas, char) {
  const c=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  c.clearRect(0,0,W,H);
  // رسم بسيط للشخصية
  const x=W/2, by=H-20;
  // رجلان
  c.fillStyle=char.pantsColor; c.fillRect(x-12,by-30,10,30); c.fillRect(x+2,by-30,10,30);
  // جسم
  c.fillStyle=char.shirtColor; c.fillRect(x-14,by-55,28,28);
  // رأس
  c.fillStyle=char.skinColor; c.fillRect(x-10,by-75,20,20);
  // طاقية
  c.fillStyle=char.capColor; c.fillRect(x-12,by-85,24,12);
  // عيون
  c.fillStyle='#fff'; c.fillRect(x-7,by-72,5,5); c.fillRect(x+2,by-72,5,5);
  c.fillStyle='#222'; c.fillRect(x-6,by-71,3,3); c.fillRect(x+3,by-71,3,3);
}

function tryBuyChar(char) {
  if(DB.totalCoins >= char.unlockCost) {
    DB.totalCoins -= char.unlockCost;
    DB.ownedChars.push(char.id);
    selectChar(char.id); saveDB(); buildCharScreen();
  } else {
    showHypeMsg('💰 مش كفاية جنيه!','#ff4444');
  }
}
function selectChar(id) {
  DB.selectedChar=id; saveDB(); buildCharScreen();
}

// ─── شاشة المتجر ─────────────────────────────────────────────────
function buildShopScreen() {
  const grid=document.getElementById('shopGrid'); if(!grid) return;
  grid.innerHTML='';
  document.getElementById('shopCoinsVal').textContent=DB.totalCoins;
  SHOP_ITEMS.forEach(item=>{
    const owned=DB.ownedItems.includes(item.id);
    const div=document.createElement('div');
    div.className=`shop-item ${owned?'owned':''}`;
    div.innerHTML=`<div class="shop-item-icon">${item.icon}</div><div class="shop-item-name">${item.name}</div><div class="shop-item-price ${owned?'owned':''}">${owned?'✓ مشتري':(item.note||item.price+'💰')}</div>`;
    if(!owned && item.price>0) div.onclick=()=>buyShopItem(item);
    grid.appendChild(div);
  });
}
function buyShopItem(item) {
  if(DB.totalCoins<item.price) { showHypeMsg('💰 مش كفاية!','#ff4444'); return; }
  DB.totalCoins-=item.price; DB.ownedItems.push(item.id); saveDB(); buildShopScreen();
}

// ─── لوحة الأوائل ────────────────────────────────────────────────
function buildLeaderboard() {
  const list=document.getElementById('leadersList'); if(!list) return;
  list.innerHTML='';
  const medals=['🥇','🥈','🥉','4️⃣','5️⃣'];
  if(DB.leaderboard.length===0) {
    list.innerHTML='<div style="color:rgba(255,255,255,.4);text-align:center;padding:20px">لا توجد نتائج بعد</div>';
    return;
  }
  DB.leaderboard.forEach((entry,i)=>{
    const div=document.createElement('div'); div.className='leader-row';
    div.innerHTML=`<div class="leader-rank">${medals[i]||i+1}</div><div class="leader-info"><div class="leader-name">نتيجة ${i+1}</div><div class="leader-score">💰 ${entry.coins} | 📅 ${entry.date}</div></div><div style="font-size:1.2rem;font-weight:900;color:#ffcc00">${entry.score}</div>`;
    list.appendChild(div);
  });
}

// ─── إعدادات ─────────────────────────────────────────────────────
function loadSettings() {
  const s=DB.settings;
  document.getElementById('settMusic').checked=s.music;
  document.getElementById('settSfx').checked=s.sfx;
  document.getElementById('settVoice').checked=s.voice;
  document.getElementById('settShake').checked=s.shake;
  document.getElementById('settQuality').value=s.quality;
}
function saveSettings() {
  DB.settings.music=document.getElementById('settMusic').checked;
  DB.settings.sfx=document.getElementById('settSfx').checked;
  DB.settings.voice=document.getElementById('settVoice').checked;
  DB.settings.shake=document.getElementById('settShake').checked;
  DB.settings.quality=document.getElementById('settQuality').value;
  saveDB();
}

// ─── تحديث الإحصائيات في شاشة البداية ───────────────────────────
function updateStartStats() {
  document.getElementById('hsDisplay').textContent=DB.highScore;
  document.getElementById('totalCoinsDisplay').textContent=DB.totalCoins;
  document.getElementById('attemptsDisplay').textContent=DB.attempts;
}

// ─── ربط الأزرار ─────────────────────────────────────────────────
function initUI() {
  document.getElementById('btnPlay').onclick=startGame;
  document.getElementById('btnChar').onclick=()=>{ buildCharScreen(); showScreen('screenChar'); };
  document.getElementById('btnCharBack').onclick=()=>showScreen('screenStart');
  document.getElementById('btnShop').onclick=()=>{ buildShopScreen(); showScreen('screenShop'); };
  document.getElementById('btnShopBack').onclick=()=>showScreen('screenStart');
  document.getElementById('btnLeaders').onclick=()=>{ buildLeaderboard(); showScreen('screenLeaders'); };
  document.getElementById('btnLeadersBack').onclick=()=>showScreen('screenStart');
  document.getElementById('btnSettings').onclick=()=>{ loadSettings(); showScreen('screenSettings'); };
  document.getElementById('btnSettSave').onclick=()=>{ saveSettings(); showScreen('screenStart'); };
  document.getElementById('btnSettBack').onclick=()=>showScreen('screenStart');
  document.getElementById('btnRestart').onclick=startGame;
  document.getElementById('btnHome').onclick=()=>{ updateStartStats(); showScreen('screenStart'); };
}

// ─── الطلق الأول ─────────────────────────────────────────────────
initUI();
updateStartStats();
showScreen('screenStart');

// رسم خلفية البداية على الكانفاس (قطار ديكور)
function drawStartBG() {
  if (G.running) return;
  ctx.clearRect(0,0,W,H);

  // سماء
  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0,'#1a0030'); grad.addColorStop(1,'#0a0010');
  ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);

  // نجوم
  for(let i=0;i<120;i++) {
    const sx=(i*137)%W, sy=(i*97)%H*0.6;
    const alpha=0.3+Math.sin(Date.now()*0.001+i)*0.4;
    ctx.globalAlpha=alpha; ctx.fillStyle='#ffffff';
    ctx.beginPath(); ctx.arc(sx,sy,0.8+i%2,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;

  // قطار ديكوري يتحرك
  const trainX=(Date.now()*0.05)%( W+200)-100;
  ctx.save();
  // جسم
  ctx.fillStyle='#226622'; ctx.fillRect(trainX,H*0.7,90,40);
  ctx.fillStyle='#114411'; ctx.fillRect(trainX,H*0.65,60,20);
  // نوافذ
  ctx.fillStyle='rgba(255,220,100,0.8)';
  [15,32,49,66].forEach(wx=>ctx.fillRect(trainX+wx,H*0.72,10,12));
  // عجلات
  ctx.fillStyle='#222';
  [10,35,60,82].forEach(wx=>{ctx.beginPath();ctx.arc(trainX+wx,H*0.7+40,8,0,Math.PI*2);ctx.fill();});
  // دخان
  for(let s=0;s<3;s++) {
    const sx2=trainX+85, sy=H*0.65-s*20+Math.sin(Date.now()*0.003+s)*5;
    ctx.globalAlpha=0.4-s*0.12; ctx.fillStyle='#aaa';
    ctx.beginPath(); ctx.arc(sx2,sy,8+s*3,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1; ctx.restore();

  // قضبان
  ctx.strokeStyle='#555'; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(0,H*0.7+40); ctx.lineTo(W,H*0.7+40); ctx.stroke();

  requestAnimationFrame(drawStartBG);
}
drawStartBG();

// إيقاف اللعبة عند إخفاء الصفحة
document.addEventListener('visibilitychange',()=>{ if(document.hidden && G.running) { stopMusic(); } });
