// ═══════════════════════════════════════════════════════════════════
//  SABUYAH ULTIMATE — game.js (The Masterpiece Engine)
// ═══════════════════════════════════════════════════════════════════

'use strict';

// ─── الكانفاس ───────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
let W, H, scaleX, scaleY;
const BASE_W = 480, BASE_H = 854;

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
const SAVE_KEY  = 'sabuyah_ultimate_v4';
const LANE_CNT  = 5;
const LANE_W    = BASE_W / LANE_CNT;
const LANES_X   = Array.from({length: LANE_CNT}, (_,i) => LANE_W * i + LANE_W / 2);
const TRACK_TOP = BASE_H * 0.32;
const GROUND_Y  = BASE_H * 0.78;

// المراحل
const LEVELS = [
  { name:'القاهرة',    color:'#c4813a', sky:['#87ceeb','#6ab0d4'], scoreThresh:0,    trainSpeed:1.0, bgTint:'rgba(200,130,60,.06)' },
  { name:'الإسكندرية', color:'#4488cc', sky:['#6aabcc','#4490bb'], scoreThresh:2000, trainSpeed:1.2, bgTint:'rgba(70,140,200,.06)'  },
  { name:'الأقصر',    color:'#e8a030', sky:['#f0b060','#e87020'], scoreThresh:5000, trainSpeed:1.5, bgTint:'rgba(240,150,40,.08)'  },
  { name:'الغردقة',   color:'#22aacc', sky:['#66ddff','#22aadd'], scoreThresh:10000,trainSpeed:1.8, bgTint:'rgba(30,170,210,.07)'  },
  { name:'الفضاء!',   color:'#aa66ff', sky:['#220044','#440088'], scoreThresh:20000,trainSpeed:2.2, bgTint:'rgba(100,0,200,.08)'   },
];

// الشخصيات
const CHARACTERS = [
  { id:'sabuyah', name:'صابويه',  ability:'⚡ سرعة أساسية', unlockCost:0,   skinColor:'#f4a460', shirtColor:'#2244cc', pantsColor:'#1a1a3a', capColor:'#cc2200' },
  { id:'hammad',  name:'حمادة',   ability:'🛡️ درع إضافي', unlockCost:500, skinColor:'#8b5e3c', shirtColor:'#336633', pantsColor:'#2a1a0a', capColor:'#225500' },
  { id:'awatef',  name:'عواطف',   ability:'💰 عملات ×2', unlockCost:1000, skinColor:'#ffb3a0', shirtColor:'#cc4488', pantsColor:'#660044', capColor:'#ff6699' },
];

const SHOP_ITEMS = [
  { id:'magnet_up', name:'تطوير المغناطيس', icon:'🧲', price:300, type:'upgrade' },
  { id:'boost_up',  name:'تطوير البوست',   icon:'🚀', price:400, type:'upgrade' },
];

// ─── قاعدة البيانات والـ State ─────────────────────────────────
let DB = {
  highScore: 0, totalCoins: 0, attempts: 0,
  selectedChar: 'sabuyah', ownedChars: ['sabuyah'], ownedItems: [],
  leaderboard: [],
  settings: { music:true, sfx:true, voice:true, shake:true, quality:'med' },
};

function loadDB() { try { const s=localStorage.getItem(SAVE_KEY); if(s) DB=JSON.parse(s); } catch(e) {} }
function saveDB() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(DB)); } catch(e) {} }
loadDB();

let G = {};
let loopId;

function resetGameState() {
  G = {
    running: false, paused: false, frame: 0,
    score: 0, coins: 0, combo: 0, sessionCoins: 0,
    speed: 6.0, maxSpeed: 16, level: 0,
    
    // Player
    lane: 2, px: LANES_X[2], py: GROUND_Y,
    jumping: false, jumpVY: 0, sliding: false, slideTimer: 0,
    invincible: 0, doubleJumpReady: false,
    
    // Boost System
    boostMeter: 0, boosting: false, boostTimer: 0, activeBoosts: {},
    
    // Enemy (الغيطي)
    enemyDist: 800, enemyLane: 2, enemyY: GROUND_Y, enemyVisible: false,
    
    // Environment
    nightMode: false, weatherType: 'clear', shakeAmt: 0,
    buildingsX: Array.from({length:12},(_,i)=>-80+i*120),
    buildingsH: Array.from({length:12},()=>80+Math.random()*120),
    cloudX: Array.from({length:6},(_,i)=>i*90),
    cloudY: Array.from({length:6},()=>30+Math.random()*60),
    
    // Entities
    obstacles: [], coinsList: [], powerups: [], particles: [], scoreTexts: [],
    droneActive: false, droneX: 0, droneY: 0
  };
}
resetGameState();

// ─── Audio Engine (Web Audio API) ─────────────────────────────
let AC;
let musicTimer = null;

function initAudio() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if(AC.state === 'suspended') AC.resume(); }
function playTone(freq, dur, vol=0.3, type='sine') {
  if (!AC || !DB.settings.sfx) return;
  const t = AC.currentTime; const o = AC.createOscillator(); const g = AC.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur);
}
function playNoise(dur, vol=0.2) {
  if (!AC || !DB.settings.sfx) return;
  const t = AC.currentTime, size = Math.floor(AC.sampleRate * dur);
  const buf = AC.createBuffer(1, size, AC.sampleRate), data = buf.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = (Math.random()*2-1) * (1 - i/size);
  const src = AC.createBufferSource(), g = AC.createGain();
  src.buffer = buf; g.gain.value = vol;
  src.connect(g); g.connect(AC.destination); src.start(t); src.stop(t + dur);
}

const SFX = {
  jump()  { playTone(400,0.1,0.2,'square'); },
  coin()  { playTone(900,0.08,0.2,'sine'); playTone(1200,0.1,0.15,'sine'); },
  crash() { playNoise(0.5,0.5); playTone(100,0.4,0.4,'sawtooth'); shake(15); },
  boost() { playTone(300,0.2,0.3,'sawtooth'); playTone(600,0.2,0.2,'sawtooth'); },
  power() { playTone(800,0.3,0.2,'sine'); },
  whistle() { playTone(1500,0.2,0.1,'sine'); }
};

function scheduleMusic() {
  if (!AC || !DB.settings.music || !G.running) return;
  const bpm = 120 + (G.speed * 2); const beat = 60 / bpm;
  const t = AC.currentTime + 0.1;
  // Kick
  [0, beat*2].forEach(k => {
    const o=AC.createOscillator(),g=AC.createGain();
    o.frequency.setValueAtTime(150,t+k); o.frequency.exponentialRampToValueAtTime(30,t+k+0.1);
    g.gain.setValueAtTime(0.4,t+k); g.gain.exponentialRampToValueAtTime(0.01,t+k+0.1);
    o.connect(g);g.connect(AC.destination);o.start(t+k);o.stop(t+k+0.1);
  });
  musicTimer = setTimeout(scheduleMusic, (beat * 4) * 1000 - 50);
}

function showHypeMsg(text, color='#ffcc00') {
  const el = document.getElementById('hypeMsg');
  if(!el) return;
  el.textContent = text; el.style.color = color;
  el.classList.remove('hidden');
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = 'hypeAnim 1.8s ease forwards';
}

// ─── Helpers ──────────────────────────────────────────────────
function px(x) { return x * scaleX; }
function py(y){ return y * scaleY; }
function fillRect(x,y,w,h,color) { ctx.fillStyle=color; ctx.fillRect(px(x), py(y), Math.max(1,px(w)), Math.max(1,py(h))); }
function circle(x,y,r,color) { ctx.fillStyle=color; ctx.beginPath(); ctx.arc(px(x),py(y),Math.max(1,r*Math.min(scaleX,scaleY)),0,Math.PI*2); ctx.fill(); }
function shake(amt) { if(DB.settings.shake) G.shakeAmt = amt; }
function addParticle(x,y,color,type='dot') { G.particles.push({x,y,vx:(Math.random()-0.5)*4,vy:(Math.random()-0.5)*4,life:1,color}); }

// ─── Drawing ──────────────────────────────────────────────────
function drawEnv() {
  const lv = LEVELS[G.level];
  const skyGrad = ctx.createLinearGradient(0,0,0,py(TRACK_TOP));
  skyGrad.addColorStop(0, G.nightMode ? '#050510' : lv.sky[0]); 
  skyGrad.addColorStop(1, G.nightMode ? '#101020' : lv.sky[1]);
  ctx.fillStyle = skyGrad; ctx.fillRect(0,0,W,py(TRACK_TOP+20));

  // Buildings & Ground
  G.buildingsX.forEach((bx,i) => {
    fillRect(bx, GROUND_Y - G.buildingsH[i], 50, G.buildingsH[i], G.nightMode ? '#222' : '#555');
  });
  fillRect(0, GROUND_Y, BASE_W, BASE_H-GROUND_Y, G.nightMode ? '#1a1a1a' : lv.color);

  // Lanes
  LANES_X.forEach(lx => fillRect(lx-1.5, GROUND_Y, 3, BASE_H-GROUND_Y, '#888'));
  
  // Weather
  if(G.weatherType === 'rain') {
    ctx.fillStyle='rgba(150,200,255,0.4)';
    for(let i=0;i<30;i++) fillRect((i*137+G.frame*15)%BASE_W, (i*73+G.frame*30)%BASE_H, 2, 15, '#fff');
  }
}

function drawPlayer(x, y, isEnemy=false) {
  const char = isEnemy ? {skinColor:'#6b3515', shirtColor:'#8B0000', pantsColor:'#2a0000', capColor:'#550000'} : 
               CHARACTERS.find(c=>c.id===DB.selectedChar);
  
  ctx.save();
  if(!isEnemy && G.invincible > 0 && Math.floor(G.invincible/4)%2===0) ctx.globalAlpha = 0.4;
  
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(px(x),py(GROUND_Y+4),px(12),py(4),0,0,Math.PI*2); ctx.fill();

  const isSliding = isEnemy ? false : G.sliding; // Simplified enemy sliding
  const bob = isSliding ? 0 : Math.sin(G.frame * 0.3) * 4;
  
  if (isSliding) {
    fillRect(x-15, y-10, 30, 10, char.shirtColor); // Body flat
    fillRect(x+10, y-15, 12, 12, char.skinColor);  // Head
  } else {
    // Legs
    fillRect(x-5, y-10+bob, 4, 14, char.pantsColor);
    fillRect(x+2, y-10-bob, 4, 14, char.pantsColor);
    // Body
    fillRect(x-8, y-25+bob, 16, 20, char.shirtColor);
    // Head
    fillRect(x-7, y-40+bob, 14, 14, char.skinColor);
    // Cap
    fillRect(x-8, y-42+bob, 16, 6, char.capColor);
  }

  // Boost Aura
  if(!isEnemy && G.boosting) {
    ctx.strokeStyle='rgba(255,150,0,0.8)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(px(x),py(y-15),px(25),0,Math.PI*2); ctx.stroke();
  }
  // Shield
  if(!isEnemy && G.activeBoosts.shield) {
     ctx.strokeStyle='rgba(0,255,255,0.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(px(x),py(y-15),px(28),0,Math.PI*2); ctx.stroke();
  }
  
  ctx.restore();
}

function drawEntities() {
  // Coins
  G.coinsList.forEach(c => {
    circle(c.x, c.y + Math.sin(G.frame*0.2)*3, 8, '#ffcc00');
    circle(c.x, c.y + Math.sin(G.frame*0.2)*3, 5, '#ffee55');
  });

  // Powerups
  G.powerups.forEach(p => {
    fillRect(p.x-10, p.y-10 + Math.sin(G.frame*0.1)*5, 20, 20, p.type==='magnet'?'#f0f':(p.type==='boost'?'#f40':'#0ff'));
  });

  // Obstacles
  G.obstacles.forEach(ob => {
    if(ob.type === 'train') {
      fillRect(ob.x-15, ob.y-60, 30, 60, ob.color || '#272');
      fillRect(ob.x-10, ob.y-50, 20, 15, '#add8e6'); // Window
    } else if (ob.type === 'barrier') {
      fillRect(ob.x-15, ob.y-20, 30, 20, '#d22');
      fillRect(ob.x-15, ob.y-15, 30, 5, '#fff');
    } else if (ob.type === 'pit') {
      fillRect(ob.x-20, GROUND_Y-5, 40, 10, '#111');
    }
  });

  // Particles
  G.particles.forEach(p => {
    ctx.globalAlpha = p.life;
    circle(p.x, p.y, 3, p.color);
    ctx.globalAlpha = 1;
  });
}

// ─── Spawners ─────────────────────────────────────────────────
function spawnLogic() {
  if (G.frame % Math.max(30, 100 - Math.floor(G.speed*2)) === 0) {
    const lane = Math.floor(Math.random()*LANE_CNT);
    const r = Math.random();
    
    if (r < 0.6) {
      G.obstacles.push({ type: 'train', x: LANES_X[lane], y: TRACK_TOP, w: 30, h: 60, lane });
    } else if (r < 0.8) {
      G.obstacles.push({ type: 'barrier', x: LANES_X[lane], y: TRACK_TOP+20, w: 30, h: 20, lane });
    } else {
      G.obstacles.push({ type: 'pit', x: LANES_X[lane], y: GROUND_Y, w: 40, h: 10, lane });
    }
  }

  if (G.frame % 40 === 0 && Math.random() < 0.5) {
    const lane = Math.floor(Math.random()*LANE_CNT);
    for(let i=0; i<3; i++) G.coinsList.push({ x: LANES_X[lane], y: TRACK_TOP - i*30, lane });
  }

  if (G.frame % 500 === 0) {
    const types = ['magnet', 'boost', 'shield'];
    G.powerups.push({ type: types[Math.floor(Math.random()*types.length)], x: LANES_X[Math.floor(Math.random()*LANE_CNT)], y: TRACK_TOP });
  }
}

// ─── Game Loop & Physics ──────────────────────────────────────
function update() {
  if (!G.running || G.paused) return;
  G.frame++;

  // Speed & Level Progression
  G.speed = Math.min(G.maxSpeed, 6 + (G.score / 1000));
  const effSpeed = G.boosting ? G.speed * 2 : G.speed;
  G.score += effSpeed * 0.02;
  
  if (G.score > LEVELS[Math.min(G.level+1, LEVELS.length-1)].scoreThresh) {
    G.level++; showHypeMsg(`مرحلة ${LEVELS[G.level].name}!`, '#00ffff');
  }

  // Player X Movement (Lane switching smooth)
  const targetX = LANES_X[G.lane];
  G.px += (targetX - G.px) * 0.3;

  // Player Y Physics (Jumping)
  if (G.jumping) {
    G.py += G.jumpVY;
    G.jumpVY += 1.5; // Gravity
    if (G.py >= GROUND_Y) { G.py = GROUND_Y; G.jumping = false; G.doubleJumpReady = false; SFX.jump(); /* land sound */ }
  }

  // Sliding
  if (G.sliding) {
    G.slideTimer--;
    if (G.slideTimer <= 0) G.sliding = false;
  }

  // Invincibility
  if (G.invincible > 0) G.invincible--;

  // Boost Meter Decay/Active
  if (G.boosting) {
    G.boostTimer--;
    if (G.boostTimer <= 0) G.boosting = false;
    if(G.frame%5===0) addParticle(G.px, G.py, '#ff8800');
  } else {
    // Enemy logic
    if (G.enemyDist < 800) G.enemyDist += 0.5; // Slowly regains distance if playing perfect
  }

  // Active Powerups Timer Update
  for(let p in G.activeBoosts) {
    G.activeBoosts[p]--;
    if(G.activeBoosts[p] <= 0) delete G.activeBoosts[p];
  }

  // Update Entities
  spawnLogic();
  
  // Background Scroll
  G.buildingsX = G.buildingsX.map(x => x - effSpeed*0.1);
  G.buildingsX.forEach((x,i) => { if(x < -100) G.buildingsX[i] = W+100; });

  // Collision & Entity Movement
  const pRect = { x: G.px-10, y: G.sliding ? G.py-15 : G.py-40, w: 20, h: G.sliding ? 15 : 40 };
  
  // Coins
  for (let i = G.coinsList.length - 1; i >= 0; i--) {
    let c = G.coinsList[i];
    if (G.activeBoosts.magnet) {
      if (c.y > TRACK_TOP) {
         c.x += (G.px - c.x) * 0.1; c.y += (G.py - 20 - c.y) * 0.1;
      }
    } else {
      c.y += effSpeed;
    }
    
    if (c.y > BASE_H+50) { G.coinsList.splice(i,1); continue; }
    
    // Coin collision
    if (Math.abs(c.x - G.px) < 20 && Math.abs(c.y - (G.py-20)) < 30) {
      let mult = DB.selectedChar === 'awatef' ? 2 : 1;
      G.coins += mult; G.sessionCoins += mult;
      if (G.boostMeter < 100 && !G.boosting) G.boostMeter = Math.min(100, G.boostMeter + 2);
      SFX.coin();
      for(let j=0;j<3;j++) addParticle(c.x, c.y, '#ffcc00');
      G.coinsList.splice(i,1);
      
      if(G.sessionCoins % 50 === 0) triggerBigMoney();
    }
  }

  // Powerups
  for (let i = G.powerups.length - 1; i >= 0; i--) {
    let p = G.powerups[i];
    p.y += effSpeed;
    if (p.y > BASE_H+50) { G.powerups.splice(i,1); continue; }
    if (Math.abs(p.x - G.px) < 20 && Math.abs(p.y - (G.py-20)) < 30) {
      SFX.power(); showHypeMsg(p.type.toUpperCase()+'!', '#00ffcc');
      if (p.type === 'magnet') G.activeBoosts.magnet = 600; // 10 secs
      if (p.type === 'shield') G.activeBoosts.shield = 600;
      if (p.type === 'boost') { G.boosting = true; G.boostTimer = 300; }
      G.powerups.splice(i,1);
    }
  }

  // Obstacles
  for (let i = G.obstacles.length - 1; i >= 0; i--) {
    let ob = G.obstacles[i];
    ob.y += effSpeed * (ob.type==='train' ? 1.2 : 1);
    if (ob.y > BASE_H+100) { G.obstacles.splice(i,1); continue; }
    
    // Collision
    if (G.invincible <= 0 && !G.boosting) {
      let obRect = { x: ob.x-ob.w/2, y: ob.y-ob.h, w: ob.w, h: ob.h };
      // Simplified AABB
      if (pRect.x < obRect.x + obRect.w && pRect.x + pRect.w > obRect.x &&
          pRect.y < obRect.y + obRect.h && pRect.y + pRect.h > obRect.y) {
          
          if (G.activeBoosts.shield || (DB.selectedChar === 'hammad' && Math.random()<0.3)) {
             delete G.activeBoosts.shield;
             G.invincible = 90;
             G.obstacles.splice(i,1);
             SFX.crash();
             showHypeMsg('درع الحماية!', '#00aaff');
          } else {
             // Enemy catches up
             G.enemyDist -= 400;
             G.obstacles.splice(i,1);
             SFX.crash();
             G.invincible = 60;
             shake(20);
             if (G.enemyDist <= 0) gameOver();
             else { SFX.whistle(); showHypeMsg('الغيطي وراك!!', '#ff0000'); }
          }
      }
    }
  }

  // Particles
  G.particles.forEach((p,i) => {
    p.x += p.vx; p.y += p.vy; p.life -= 0.05;
    if(p.life <= 0) G.particles.splice(i,1);
  });

  updateUI();
}

function render() {
  ctx.save();
  // Camera Shake
  if (G.shakeAmt > 0) {
    ctx.translate(px((Math.random()-0.5)*G.shakeAmt), py((Math.random()-0.5)*G.shakeAmt));
    G.shakeAmt *= 0.8; if(G.shakeAmt < 1) G.shakeAmt = 0;
  }
  
  drawEnv();
  drawEntities();
  
  // Draw Enemy if close
  if (G.enemyDist < 400 && G.running) {
    const ex = G.px; // Follows player lane
    const ey = GROUND_Y + Math.max(0, (G.enemyDist - 100)); // Moves down as he gets further
    ctx.globalAlpha = 1 - (G.enemyDist/400);
    drawPlayer(ex, ey, true);
    ctx.globalAlpha = 1;
  }
  
  drawPlayer(G.px, G.py);
  
  ctx.restore();
}

function gameLoop() {
  if (G.running) { update(); render(); }
  loopId = requestAnimationFrame(gameLoop);
}

// ─── Input Handling ───────────────────────────────────────────
function doAction(action) {
  if (!G.running) return;
  initAudio();
  if (action === 'left' && G.lane > 0) G.lane--;
  if (action === 'right' && G.lane < LANE_CNT-1) G.lane++;
  if (action === 'up') {
    if (!G.jumping && !G.sliding) { G.jumping = true; G.jumpVY = -18; SFX.jump(); }
    else if (G.jumping && !G.doubleJumpReady && G.activeBoosts.doubleJump) {
       G.jumpVY = -15; G.doubleJumpReady = true; SFX.jump(); addParticle(G.px, G.py, '#fff');
    }
  }
  if (action === 'down') {
    if (!G.jumping) { G.sliding = true; G.slideTimer = 45; }
    else { G.jumpVY += 10; } // Fast fall
  }
  if (action === 'boost') {
    if (G.boostMeter >= 100) { G.boostMeter = 0; G.boosting = true; G.boostTimer = 300; SFX.boost(); }
  }
}

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') doAction('left');
  if (e.key === 'ArrowRight'|| e.key.toLowerCase() === 'd') doAction('right');
  if (e.key === 'ArrowUp'   || e.key.toLowerCase() === 'w') doAction('up');
  if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') doAction('down');
  if (e.key === 'Shift'     || e.key === ' ') doAction('boost');
});

// Touch/Swipe
let touchX=0, touchY=0;
window.addEventListener('touchstart', e=>{ touchX=e.touches[0].clientX; touchY=e.touches[0].clientY; initAudio(); });
window.addEventListener('touchend', e=>{
  if(!G.running) return;
  const dx = e.changedTouches[0].clientX - touchX, dy = e.changedTouches[0].clientY - touchY;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (Math.abs(dx) > 30) doAction(dx > 0 ? 'right' : 'left');
  } else {
    if (Math.abs(dy) > 30) doAction(dy > 0 ? 'down' : 'up');
  }
});
window.touchAction = doAction; // For HTML buttons

// ─── UI & Logic bindings ──────────────────────────────────────
function startGame() {
  document.getElementById('screenStart').classList.replace('active','hidden');
  document.getElementById('screenHUD').classList.replace('hidden','active');
  resetGameState();
  G.running = true; DB.attempts++; saveDB();
  initAudio(); scheduleMusic();
  if(!loopId) gameLoop();
}

function gameOver() {
  G.running = false; clearTimeout(musicTimer);
  SFX.crash(); playNoise(1, 0.8);
  
  DB.totalCoins += G.coins;
  let isNew = false;
  if(Math.floor(G.score) > DB.highScore) { DB.highScore = Math.floor(G.score); isNew = true; }
  saveDB();

  document.getElementById('screenHUD').classList.replace('active','hidden');
  const over = document.getElementById('screenOver');
  over.classList.replace('hidden','active');
  
  document.getElementById('ovScore').innerText = Math.floor(G.score);
  document.getElementById('ovHS').innerText = DB.highScore;
  document.getElementById('ovCoins').innerText = G.coins;
  if(isNew) document.getElementById('newRecord').classList.remove('hidden');
}

function updateUI() {
  document.getElementById('hudScore').innerText = Math.floor(G.score);
  document.getElementById('hudCoins').innerText = G.coins;
  document.getElementById('hudLevel').innerText = G.level+1;
  document.getElementById('hudLevelLbl').innerText = LEVELS[G.level]?LEVELS[G.level].name:'أولتيميت';
  
  const bFill = document.getElementById('boostFill');
  bFill.style.width = `${G.boostMeter}%`;
  
  // Danger Bar (الغيطي)
  const dFill = document.getElementById('dangerFill');
  const dPct = document.getElementById('dangerPct');
  let dangerPercent = Math.max(0, 100 - (G.enemyDist / 8));
  dFill.style.width = `${dangerPercent}%`;
  if(dangerPercent > 80) dPct.innerText = 'وراك!!';
  else if(dangerPercent > 50) dPct.innerText = 'بيقرب';
  else dPct.innerText = 'بعيد';
}

function triggerBigMoney() {
  const msg = document.getElementById('bigMoneyMsg');
  if(!msg) return;
  msg.innerText = "💰 الفلوس بتلعب! 💰";
  msg.classList.remove('hidden');
  msg.style.animation = 'none'; void msg.offsetWidth; msg.style.animation = 'bigMoneyAnim 2.2s ease forwards';
}

// ─── Menu Navigation ──────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.replace('active','hidden'));
  document.getElementById(id).classList.replace('hidden','active');
  if(id === 'screenStart') {
    document.getElementById('hsDisplay').innerText = DB.highScore;
    document.getElementById('totalCoinsDisplay').innerText = DB.totalCoins;
    document.getElementById('attemptsDisplay').innerText = DB.attempts;
    renderStartScreenBG();
  }
}

function renderStartScreenBG() {
  if(!G.running) { ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H); }
}

// Button Listeners
document.getElementById('btnPlay').onclick = startGame;
document.getElementById('btnRestart').onclick = startGame;
document.getElementById('btnHome').onclick = () => { document.getElementById('newRecord').classList.add('hidden'); showScreen('screenStart'); };
document.getElementById('btnChar').onclick = () => showScreen('screenChar');
document.getElementById('btnCharBack').onclick = () => showScreen('screenStart');
document.getElementById('btnShop').onclick = () => showScreen('screenShop');
document.getElementById('btnShopBack').onclick = () => showScreen('screenStart');
document.getElementById('btnSettings').onclick = () => showScreen('screenSettings');
document.getElementById('btnSettBack').onclick = () => showScreen('screenStart');

// Initialize
showScreen('screenStart');
