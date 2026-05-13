/* game.js — محرك اللعبة المنفصل
   ملاحظات:
   - هذا الملف يعتمد على index.html و style.css أعلاه.
   - يحتوي على محرك Canvas، منطق العدو، spawn ذكي، نظام boost، إنجازات، WebAudio، ودعم لمس.
*/

/* ---------- إعداد الكانفاس والقياسات ---------- */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: true });
let W = innerWidth, H = innerHeight;
const BASE_W = 480, BASE_H = 854;
let scaleX = 1, scaleY = 1;
function resize() {
  W = canvas.width = innerWidth;
  H = canvas.height = innerHeight;
  scaleX = W / BASE_W; scaleY = H / BASE_H;
}
addEventListener('resize', resize);
resize();

/* ---------- قاعدة البيانات المحلية ---------- */
const SAVE_KEY = 'sabuyah_ultimate_final_v1';
let DB = {
  highScore:0, totalCoins:0, attempts:0,
  selectedChar:'sabuyah', ownedChars:['sabuyah'],
  ownedItems:[], equippedItems:[],
  leaderboard:[], settings:{music:true,sfx:true,voice:true,shake:true,quality:'med'},
  achievements:{}
};
try{ const s=localStorage.getItem(SAVE_KEY); if(s) DB=JSON.parse(s);}catch(e){}
function saveDB(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(DB)); }catch(e){} }

/* ---------- إعدادات اللعبة وبيانات ثابتة ---------- */
const LANE_CNT = 5;
const LANE_W = BASE_W / LANE_CNT;
const LANES_X = Array.from({length:LANE_CNT},(_,i)=>LANE_W*i + LANE_W/2);
const TRACK_TOP = BASE_H * 0.28;
const GROUND_Y = BASE_H * 0.78;

const LEVELS = [
  {name:'القاهرة', color:'#c4813a', sky:['#87ceeb','#6ab0d4'], scoreThresh:0, trainSpeed:1.0, bgTint:'rgba(200,130,60,.06)'},
  {name:'الإسكندرية', color:'#4488cc', sky:['#6aabcc','#4490bb'], scoreThresh:2000, trainSpeed:1.2, bgTint:'rgba(70,140,200,.06)'},
  {name:'الأقصر', color:'#e8a030', sky:['#f0b060','#e87020'], scoreThresh:5000, trainSpeed:1.5, bgTint:'rgba(240,150,40,.08)'},
  {name:'الغردقة', color:'#22aacc', sky:['#66ddff','#22aadd'], scoreThresh:10000, trainSpeed:1.8, bgTint:'rgba(30,170,210,.07)'},
  {name:'الفضاء', color:'#aa66ff', sky:['#220044','#440088'], scoreThresh:20000, trainSpeed:2.2, bgTint:'rgba(100,0,200,.08)'}
];

const CHARACTERS = [
  {id:'sabuyah', name:'صابويه', ability:'⚡ سرعة متوسطة', unlockCost:0, skin:'#f4a460', shirt:'#2244cc', pants:'#1a1a3a', cap:'#cc2200'},
  {id:'hammad', name:'حمادة', ability:'🛡️ يتحمل صدمة كل 30ث', unlockCost:500, skin:'#8b5e3c', shirt:'#336633', pants:'#2a1a0a', cap:'#225500'},
  {id:'awatef', name:'عواطف', ability:'💰 عملات ×1.5', unlockCost:800, skin:'#ffb3a0', shirt:'#cc4488', pants:'#660044', cap:'#ff6699'}
];

const POWERUPS = [
  {id:'rocket', name:'صاروخ', icon:'🚀', type:'offense', price:150},
  {id:'magnet', name:'مغناطيس', icon:'🧲', type:'utility', price:300},
  {id:'shield3', name:'درع ثلاثي', icon:'🛡️', type:'defense', price:400},
  {id:'drone', name:'طائرة', icon:'🛸', type:'utility', price:600},
  {id:'x10', name:'مجنون النقاط ×10', icon:'🔥', type:'score', price:0}
];

/* ---------- حالة اللعبة (G) ---------- */
let G = {};
function resetGameState() {
  G = {
    running:false, paused:false, frame:0, startTime:0, score:0, coins:0, speed:6.0, maxSpeed:6.0,
    levelIndex:0, trainsPassed:0, obstacles:[], coinsOnTrack:[], powerups:[], particles:[],
    lane:2, targetLane:2, px:LANES_X[2], py:GROUND_Y, jumping:false, jumpVY:0, jumpCount:0,
    sliding:false, slideTimer:0, doubleJumpEnabled:false, hangReady:false, hanging:false,
    boostMeter:0, boosting:false, boostTimer:0, activeBoosts:{}, enemyDist:900, enemyLane:2, enemyY:GROUND_Y,
    enemyVisible:true, enemySpeed:6.5, enemyWhistleTimer:0, dayNightTimer:0, nightMode:false,
    weatherType:'clear', weatherTimer:0, buildingsX:Array.from({length:12},(_,i)=>-80+i*120),
    buildingsH:Array.from({length:12},()=>80+Math.random()*120), cloudX:Array.from({length:6},(_,i)=>i*90),
    cloudY:Array.from({length:6},()=>30+Math.random()*60), combo:0, comboTimer:0,
    scoreHistory:[], performance:{fps:60, lastTick:performance.now(), adaptLevel:1}
  };
}
resetGameState();

/* ---------- نظام الصوت WebAudio ---------- */
let AC = null;
function initAudio() {
  if (AC) return;
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){ AC=null; }
}
function resumeAudio(){ if(AC && AC.state==='suspended') AC.resume(); }
function playTone(freq,dur,vol=0.2,type='sine',delay=0){
  if(!AC || !DB.settings.sfx) return;
  const t = AC.currentTime + delay;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+dur+0.02);
}
function playNoise(dur,vol=0.2,delay=0){
  if(!AC || !DB.settings.sfx) return;
  const t = AC.currentTime + delay;
  const size = Math.floor(AC.sampleRate * dur);
  const buf = AC.createBuffer(1,size,AC.sampleRate);
  const data = buf.getChannelData(0);
  for(let i=0;i<size;i++) data[i] = (Math.random()*2-1)*(1 - i/size);
  const src = AC.createBufferSource(); src.buffer = buf;
  const g = AC.createGain(); g.gain.value = vol;
  src.connect(g); g.connect(AC.destination); src.start(t); src.stop(t+dur+0.02);
}

/* ---------- مؤثرات صوتية بسيطة ---------- */
const SFX = {
  jump(){ playTone(320,0.06,0.18,'square'); playTone(520,0.12,0.08,'sine',0.03); },
  land(){ playTone(120,0.08,0.12,'triangle'); },
  coin(){ playTone(880,0.08,0.18,'sine'); },
  crash(){ playNoise(0.4,0.4); playTone(80,0.3,0.25,'sawtooth'); },
  whistle(){ playTone(900,0.08,0.18,'sine'); playTone(700,0.18,0.12,'sine',0.06); },
  trainClose(){ playTone(200,0.4,0.25,'sawtooth'); },
  boost(){ [300,400,600,900].forEach((f,i)=>playTone(f,0.12,0.18,'sawtooth',i*0.03)); }
};

/* ---------- أدوات رسم مساعدة ---------- */
function px(x){ return x * scaleX; }
function py(y){ return y * scaleY; }
function fillRect(x,y,w,h,color){ ctx.fillStyle=color; ctx.fillRect(px(x),py(y),Math.max(1,px(w)),Math.max(1,py(h))); }
function circle(x,y,r,color){ ctx.fillStyle=color; ctx.beginPath(); ctx.arc(px(x),py(y),Math.max(1,r*Math.min(scaleX,scaleY)),0,Math.PI*2); ctx.fill(); }
function drawText(text,x,y,size,color,align='center'){ ctx.fillStyle=color; ctx.font = `${Math.max(10,py(size))}px Cairo, sans-serif`; ctx.textAlign=align; ctx.textBaseline='middle'; ctx.fillText(text, px(x), py(y)); }

/* ---------- نظام الجسيمات ---------- */
function addParticle(p){
  if(DB.settings.quality==='low' && G.particles.length>30) return;
  if(DB.settings.quality==='med' && G.particles.length>80) return;
  G.particles.push(Object.assign({x:0,y:0,vx:0,vy:0,life:1,maxLife:1,r:3,color:'#fff',gravity:0},p));
}

/* ---------- توليد العقبات والعملات ---------- */
function spawnObstacle(type,lane,xOffset=0){
  const x = LANES_X[lane] + (Math.random()-0.5)*10;
  const y = TRACK_TOP + xOffset;
  const ob = {id:Date.now()+Math.random(), type, lane, x, y, vx:0, extra:{}};
  if(type==='train'){ ob.carCount = 1 + Math.floor(Math.random()*3); ob.color = '#228822'; ob.sparks = Math.random()<0.2; ob.stopped = Math.random()<0.12; }
  if(type==='car'){ ob.color = ['#ccaa22','#aa2233','#2255aa'][Math.floor(Math.random()*3)]; ob.facing = Math.random()<0.5? -1:1; }
  if(type==='pit'){ ob.w = 80 + Math.random()*80; }
  if(type==='helicopter'){ ob.hov = Math.random()*20; ob.rot = 0; }
  G.obstacles.push(ob);
}

function spawnCoin(lane, xOffset=0, big=false){
  const x = LANES_X[lane] + (Math.random()-0.5)*18;
  const y = TRACK_TOP + xOffset + (Math.random()*80);
  G.coinsOnTrack.push({id:Date.now()+Math.random(), x, y, lane, big});
}

/* ذكي: توزيع العقبات */
function smartSpawnLogic(){
  if(Math.random() < 0.02 + Math.min(0.02, G.score/20000)){
    const lane = Math.floor(Math.random()*LANE_CNT);
    const types = ['car','barrier','wire','pit','camel'];
    if(Math.random()<0.08) spawnObstacle('train', lane, -40);
    else spawnObstacle(types[Math.floor(Math.random()*types.length)], lane, -40);
  }
  if(Math.random() < 0.06 + (G.activeBoosts.magnet?0.12:0)){
    const lane = Math.floor(Math.random()*LANE_CNT);
    spawnCoin(lane, -20, Math.random()<0.08);
  }
  if(Math.random()<0.002) spawnObstacle('helicopter', Math.floor(Math.random()*LANE_CNT), -120);
}

/* ---------- تحديث حالة اللاعب ---------- */
function playerMoveToLane(targetLane){
  G.targetLane = Math.max(0, Math.min(LANE_CNT-1, targetLane));
}
function playerJump(){
  if(G.hanging){
    G.hanging = false; G.jumpVY = -10; G.jumping = true; G.jumpCount = 1; SFX.jump(); return;
  }
  if(!G.jumping){
    G.jumping = true; G.jumpVY = -11; G.jumpCount = 1; SFX.jump();
  } else if(G.doubleJumpEnabled && G.jumpCount < 2){
    G.jumpVY = -10; G.jumpCount++; SFX.jump(); showHype('قفزة مزدوجة!', '#66ffcc');
  }
}
function playerSlide(){
  if(G.jumping) return;
  G.sliding = true; G.slideTimer = 28; SFX.whistle();
}

/* ---------- الاصطدامات ---------- */
function checkCollisions(){
  const px = G.px, py = G.py;
  for(let i=G.obstacles.length-1;i>=0;i--){
    const ob = G.obstacles[i];
    const dx = Math.abs(ob.x - px);
    const dy = Math.abs(ob.y - py);
    if(dx < 18 && dy < 28){
      if(G.activeBoosts.shield3 && G.activeBoosts.shield3>0){
        G.activeBoosts.shield3--; addParticle({x:px,y:py-10,vy:-1,life:0.6,color:'#88ddff'}); G.score += 20; continue;
      }
      gameOver('اصطدمت بعقبة');
      return;
    }
  }
  if(G.enemyDist < 40 && Math.abs(G.enemyLane - G.lane) === 0 && Math.abs(G.enemyY - G.py) < 20){
    gameOver('الغيطي أمسكك');
  }
}

/* ---------- نظام العدو (مطاردة ذكية بسيطة) ---------- */
function updateEnemy(){
  const speedFactor = 1 + (G.speed - 6)/10;
  G.enemyDist -= (0.6 * speedFactor + (G.boosting?1.2:0.0));
  if(G.enemyDist < 0) G.enemyDist = 0;
  const closeOb = G.obstacles.find(o => o.y < TRACK_TOP + 120 && Math.abs(o.x - LANES_X[G.enemyLane]) < 30);
  if(closeOb && Math.random()<0.08){
    const dir = (G.lane > G.enemyLane) ? 1 : -1;
    if(Math.random()<0.6) G.enemyLane = Math.max(0, Math.min(LANE_CNT-1, G.enemyLane + dir));
    else G.enemyLane = Math.max(0, Math.min(LANE_CNT-1, G.enemyLane + (Math.random()<0.5?1:-1)));
    G.enemyWhistleTimer = 30;
  }
  if(!G.enemyJumping && Math.random()<0.01) { G.enemyJumping = true; G.enemyJumpVY = -9; }
  if(G.enemyJumping){ G.enemyJumpVY += 0.5; G.enemyY += G.enemyJumpVY; if(G.enemyY >= GROUND_Y){ G.enemyY = GROUND_Y; G.enemyJumping=false; } }
  if(G.enemyDist < 220 && G.enemyWhistleTimer <= 0){ SFX.whistle(); G.enemyWhistleTimer = 120; }
  if(G.enemyWhistleTimer>0) G.enemyWhistleTimer--;
}

/* ---------- نظام البوست ---------- */
function tryBoost(){
  if(G.boostMeter >= 100 && !G.boosting){
    G.boosting = true; G.boostTimer = 300; G.boostMeter = 0;
    G.speed *= 1.8; showHype('بوست! انطلق!', '#ffff66'); SFX.boost();
  }
}

/* ---------- واجهات المستخدم البسيطة ---------- */
const el = {
  hsDisplay: document.getElementById('hsDisplay'),
  totalCoinsDisplay: document.getElementById('totalCoinsDisplay'),
  attemptsDisplay: document.getElementById('attemptsDisplay'),
  hudScore: document.getElementById('hudScore'),
  hudLevel: document.getElementById('hudLevel'),
  hudCoins: document.getElementById('hudCoins'),
  dangerFill: document.getElementById('dangerFill'),
  dangerPct: document.getElementById('dangerPct'),
  boostFill: document.getElementById('boostFill'),
  boostPct: document.getElementById('boostPct'),
  hypeMsg: document.getElementById('hypeMsg'),
  achieveToast: document.getElementById('achieveToast'),
  screenStart: document.getElementById('screenStart'),
  screenOver: document.getElementById('screenOver'),
  ovScore: document.getElementById('ovScore'),
  ovSpeed: document.getElementById('ovSpeed'),
  ovTrains: document.getElementById('ovTrains')
};

function showHype(text,color='#fff'){ el.hypeMsg.style.display='block'; el.hypeMsg.style.color=color; el.hypeMsg.textContent = text; setTimeout(()=>el.hypeMsg.style.display='none',1600); }
function showToast(text){ el.achieveToast.style.display='block'; el.achieveToast.textContent = text; setTimeout(()=>el.achieveToast.style.display='none',3000); }

/* ---------- نظام الإنجازات ---------- */
const ACHIEVEMENTS = [
  {id:'a1000', title:'مبتدئ', desc:'أول 1000 نقطة', cond: g=>g.score>=1000, reward:()=>{ DB.totalCoins += 50; saveDB(); showToast('مكافأة 50 جنيه!'); }},
  {id:'a10trains', title:'سارق القطارات', desc:'تجاوز 10 قطارات', cond: g=>g.trainsPassed>=10, reward:()=>{ DB.totalCoins += 120; saveDB(); showToast('مكافأة 120 جنيه!'); }},
  {id:'a50coins', title:'غني', desc:'اجمع 50 عملة في جولة', cond: g=>g.coins>=50, reward:()=>{ DB.totalCoins += 80; saveDB(); showToast('مكافأة 80 جنيه!'); }},
  {id:'aRocketHit', title:'قناص', desc:'اضرب العدو بصاروخ', cond: g=>false, reward:()=>{ DB.totalCoins += 200; saveDB(); showToast('مكافأة 200 جنيه!'); }}
];

function checkAchievements(){
  ACHIEVEMENTS.forEach(a=>{
    if(!DB.achievements[a.id] && a.cond(G)){
      DB.achievements[a.id] = true; a.reward(); saveDB();
      showToast('إنجاز: ' + a.title);
    }
  });
}

/* ---------- نظام الأداء التكيفي ---------- */
function adaptPerformance(){
  const now = performance.now();
  const dt = now - G.performance.lastTick;
  G.performance.lastTick = now;
  const fps = 1000 / dt;
  G.performance.fps = 0.9 * G.performance.fps + 0.1 * fps;
  if(G.performance.fps < 45 && G.performance.adaptLevel > 0) { G.performance.adaptLevel--; DB.settings.quality = (G.performance.adaptLevel===2?'high':G.performance.adaptLevel===1?'med':'low'); }
  else if(G.performance.fps > 58 && G.performance.adaptLevel < 2) { G.performance.adaptLevel++; DB.settings.quality = (G.performance.adaptLevel===2?'high':G.performance.adaptLevel===1?'med':'low'); }
}

/* ---------- حلقة اللعبة الرئيسية ---------- */
let lastTime = performance.now();
function gameLoop(now){
  const dt = Math.min(40, now - lastTime);
  lastTime = now;
  adaptPerformance();
  if(G.running && !G.paused){
    G.frame++;
    G.speed = Math.min(18, G.speed + 0.0005 * G.frame);
    G.maxSpeed = Math.max(G.maxSpeed, G.speed);
    if(G.frame % 6 === 0) smartSpawnLogic();
    for(let i=G.obstacles.length-1;i>=0;i--){
      const ob = G.obstacles[i];
      ob.y += G.speed * (1 + (ob.type==='train'?0.6:0)) * (1 + (G.boosting?0.6:0));
      if(ob.y > BASE_H + 200) { G.obstacles.splice(i,1); if(ob.type==='train') G.trainsPassed++; }
    }
    for(let i=G.coinsOnTrack.length-1;i>=0;i--){
      const c = G.coinsOnTrack[i];
      c.y += G.speed * (1 + (G.boosting?0.6:0));
      if(c.y > BASE_H + 50) G.coinsOnTrack.splice(i,1);
      if(Math.hypot(c.x - G.px, c.y - G.py) < 18){
        G.coins += c.big?5:1; G.score += c.big?50:10; DB.totalCoins += c.big?5:1; SFX.coin(); addParticle({x:G.px,y:G.py-10,vy:-1,life:0.8,color:'#ffd700'}); G.coinsOnTrack.splice(i,1);
      }
    }
    const targetX = LANES_X[G.targetLane];
    G.px += (targetX - G.px) * 0.25;
    if(G.jumping){
      G.jumpVY += 0.6;
      G.py += G.jumpVY;
      if(G.py >= GROUND_Y){ G.py = GROUND_Y; G.jumping=false; G.jumpVY=0; G.jumpCount=0; SFX.land(); }
    } else {
      G.py = GROUND_Y;
    }
    if(G.sliding){ G.slideTimer--; if(G.slideTimer<=0) G.sliding=false; }
    G.boostMeter = Math.min(100, G.boostMeter + 0.02 * (G.coins>0?1.2:1));
    if(G.boosting){ G.boostTimer--; if(G.boostTimer<=0){ G.boosting=false; G.speed /= 1.8; } }
    updateEnemy();
    checkCollisions();
    for(let i=G.particles.length-1;i>=0;i--){
      const p = G.particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += (p.gravity||0);
      p.life -= 0.02;
      if(p.life <= 0) G.particles.splice(i,1);
    }
    G.score += 0.02 * (G.boosting?3:1);
    G.scoreHistory.push(G.score);
    if(G.frame % 60 === 0) checkAchievements();
    el.hudScore.textContent = Math.floor(G.score);
    el.hudCoins.textContent = G.coins;
    el.hudLevel.textContent = LEVELS[G.levelIndex].name;
    el.hsDisplay.textContent = DB.highScore;
    el.totalCoinsDisplay.textContent = DB.totalCoins;
    el.attemptsDisplay.textContent = DB.attempts;
    el.dangerFill.style.width = Math.min(100, Math.max(4, (100 - G.enemyDist/10))) + '%';
    el.dangerPct.textContent = G.enemyDist > 600 ? 'بعيد' : G.enemyDist > 300 ? 'قريب' : 'خطر';
    el.boostFill.style.width = G.boostMeter + '%';
    el.boostPct.textContent = Math.floor(G.boostMeter) + '%';
  }

  render();
  requestAnimationFrame(gameLoop);
}

/* ---------- رسم المشهد بالكامل ---------- */
function render(){
  ctx.clearRect(0,0,W,H);
  const lv = LEVELS[G.levelIndex];
  const sky1 = G.nightMode ? '#040818' : lv.sky[0];
  const sky2 = G.nightMode ? '#0a1530' : lv.sky[1];
  const grad = ctx.createLinearGradient(0,0,0,py(TRACK_TOP));
  grad.addColorStop(0, sky1); grad.addColorStop(1, sky2);
  ctx.fillStyle = grad; ctx.fillRect(0,0, W, py(TRACK_TOP+20));
  G.cloudX.forEach((cx,i)=>{
    const cy = G.cloudY[i];
    ctx.globalAlpha = G.nightMode?0.25:0.7;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(px(cx + (G.frame*0.05)%BASE_W), py(cy), py(12), 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  });
  G.buildingsX.forEach((bx,i)=>{
    const bh = G.buildingsH[i];
    const by = GROUND_Y - bh;
    const col = G.nightMode ? `hsl(${200+i*15},20%,${8+i%4*3}%)` : `hsl(${20+i*10},30%,${35+i%4*5}%)`;
    fillRect(bx + (G.frame*0.02*(i%3+1))% (BASE_W+200) - 80, by, 55, bh, col);
  });
  fillRect(0, GROUND_Y, BASE_W, BASE_H - GROUND_Y, lv.color);
  LANES_X.forEach(lx => { fillRect(lx-1.5, GROUND_Y-2, 3, BASE_H-GROUND_Y+2, '#666'); });
  const sleeperSpacing = 18;
  const sleeperOff = (G.frame * G.speed * 0.8) % sleeperSpacing;
  for(let sy = TRACK_TOP + sleeperOff; sy < BASE_H; sy += sleeperSpacing){
    fillRect(8, sy, BASE_W-16, 4, '#5c3d1e');
  }

  G.obstacles.forEach(ob => {
    if(ob.type === 'train') drawTrain(ob);
    else if(ob.type === 'car') drawCar(ob);
    else if(ob.type === 'camel') drawCamel(ob);
    else if(ob.type === 'barrier') drawBarrier(ob);
    else if(ob.type === 'wire') drawWire(ob);
    else if(ob.type === 'pit') drawPit(ob);
    else if(ob.type === 'helicopter') drawHelicopter(ob);
  });

  G.coinsOnTrack.forEach(c => {
    circle(c.x, c.y, c.big?5:3, '#ffd700');
    if(Math.random()<0.02) addParticle({x:c.x,y:c.y,vx:(Math.random()-0.5)*0.6,vy:-0.6,life:0.6,color:'#ffd700'});
  });

  ctx.globalAlpha = 0.25;
  ctx.beginPath(); ctx.ellipse(px(G.px), py(GROUND_Y+6), px(14), py(5), 0, 0, Math.PI*2); ctx.fillStyle='#000'; ctx.fill();
  ctx.globalAlpha = 1;

  drawPlayer();
  drawEnemy();

  G.particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    circle(p.x, p.y, p.r, p.color);
    ctx.globalAlpha = 1;
  });

  if(G.boosting){
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#ffff66';
    for(let i=0;i<12;i++){
      const lx = (i*40 + G.frame*20) % BASE_W;
      fillRect(lx, TRACK_TOP + Math.random()*200, 60, 2, 'rgba(255,255,200,0.08)');
    }
    ctx.globalAlpha = 1;
  }
}

/* ---------- رسم اللاعب (مبسّط pixel-like) ---------- */
function drawPlayer(){
  const char = CHARACTERS.find(c=>c.id===DB.selectedChar) || CHARACTERS[0];
  const x = G.px, y = G.py;
  fillRect(x-10, y-30, 20, 26, char.shirt);
  fillRect(x-9, y-46, 18, 18, char.skin);
  fillRect(x-10, y-56, 20, 12, char.cap);
  if(G.jumping){
    fillRect(x-6, y-10, 6, 18, char.pants);
    fillRect(x+0, y-10, 6, 18, char.pants);
  } else {
    fillRect(x-8, y-6, 6, 18, char.pants);
    fillRect(x+2, y-6, 6, 18, char.pants);
  }
  fillRect(x-6, y-40, 4, 4, '#222'); fillRect(x+2, y-40, 4, 4, '#222');
  if(G.sliding){
    ctx.save(); ctx.translate(px(x), py(y-8)); ctx.rotate(-0.3);
    fillRect(-16, -5, 32, 12, char.shirt);
    fillRect(10, -12, 14, 14, char.skin);
    ctx.restore();
  }
  if(G.activeBoosts.shield3){
    ctx.strokeStyle='rgba(100,200,255,0.6)'; ctx.lineWidth=2*Math.min(scaleX,scaleY);
    ctx.beginPath(); ctx.arc(px(x), py(y-18), px(22), 0, Math.PI*2); ctx.stroke();
  }
}

/* ---------- رسم العدو ---------- */
function drawEnemy(){
  if(!G.enemyVisible) return;
  const ex = LANES_X[G.enemyLane];
  const ey = G.enemyY;
  const alpha = Math.min(1, 1 - G.enemyDist/400);
  ctx.save(); ctx.globalAlpha = alpha;
  fillRect(ex-10, ey-30, 20, 26, '#8B0000');
  fillRect(ex-9, ey-46, 18, 18, '#6b3515');
  fillRect(ex-10, ey-56, 20, 12, '#550000');
  fillRect(ex-7, ey-48, 5, 3, '#ff3300'); fillRect(ex+1, ey-48, 5, 3, '#ff3300');
  if(G.enemyDist < 150){
    drawText('⚠️', ex, ey-65, 16, '#ff0000');
  }
  ctx.restore();
}

/* ---------- رسم أنواع العقبات (مبسطة) ---------- */
function drawTrain(ob){
  const x = ob.x, y = ob.y;
  ctx.save();
  for(let c=0;c<ob.carCount;c++){
    const cy = y - c*62;
    const col = c===0 ? (ob.color||'#228822') : `hsl(${130+c*20},40%,30%)`;
    fillRect(x-14, cy-28, 28, 55, col);
    fillRect(x-9, cy-18, 7, 9, 'rgba(180,220,255,0.7)');
    fillRect(x+2, cy-18, 7, 9, 'rgba(180,220,255,0.7)');
    circle(x-16, cy+24, 7, '#222'); circle(x+16, cy+24, 7, '#222');
  }
  if(G.frame%20<10) { circle(x-8, y-26, 4, '#ffffaa'); circle(x+8, y-26, 4, '#ffffaa'); }
  ctx.restore();
}
function drawCar(ob){ const x = ob.x, y = ob.y; fillRect(x-15, y-12, 30, 18, ob.color||'#ccaa22'); fillRect(x-11, y-22, 22, 12, ob.color||'#ccaa22'); circle(x-10, y+7, 5, '#222'); circle(x+10, y+7, 5, '#222'); }
function drawCamel(ob){ const x = ob.x, y = ob.y; const bob = Math.sin(G.frame*0.1)*2; fillRect(x-14, y-14+bob, 28, 14, '#c4a363'); fillRect(x-4, y-28+bob, 10, 16, '#c4a363'); }
function drawBarrier(ob){ const x = ob.x, y = ob.y; fillRect(x-15, y-20, 3, 20, '#ffcc00'); fillRect(x+12, y-20, 3, 20, '#ffcc00'); fillRect(x-15, y-18, 30, 5, '#ff2200'); }
function drawWire(ob){ const x = ob.x, y = ob.y; fillRect(x-2, y-50, 4, 50, '#666'); ctx.strokeStyle = '#ffff66'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, py(y-48)); ctx.lineTo(W, py(y-48)); ctx.stroke(); }
function drawPit(ob){ const x = ob.x, y = ob.y, w = ob.w; ctx.fillStyle = '#000'; ctx.fillRect(px(x-w/2), py(y-5), px(w), py(25)); }
function drawHelicopter(ob){ const x = ob.x, y = ob.y; const hov = Math.sin(G.frame*0.08)*4; fillRect(x-18, y-8+hov, 36, 16, '#557755'); ctx.save(); ctx.translate(px(x), py(y-14+hov)); ctx.rotate(G.frame*0.2); ctx.strokeStyle='#aaa'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-40,0); ctx.lineTo(40,0); ctx.stroke(); ctx.restore(); }

/* ---------- أحداث الإدخال (لوحة ومس) ---------- */
const keys = {};
addEventListener('keydown', e=>{
  if(e.key === 'ArrowLeft' || e.key === 'a') playerMoveToLane(G.lane-1);
  if(e.key === 'ArrowRight' || e.key === 'd') playerMoveToLane(G.lane+1);
  if(e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') playerJump();
  if(e.key === 'ArrowDown' || e.key === 's') playerSlide();
  if(e.key === 'Shift') tryBoost();
  if(e.key === 'Escape') togglePause();
  keys[e.key] = true;
});
addEventListener('keyup', e=>{ keys[e.key] = false; });

function touchAction(act){
  if(act === 'left') playerMoveToLane(G.lane-1);
  if(act === 'right') playerMoveToLane(G.lane+1);
  if(act === 'up') playerJump();
  if(act === 'down') playerSlide();
  if(act === 'boost') tryBoost();
}
document.getElementById('tbLeft').addEventListener('click', ()=>touchAction('left'));
document.getElementById('tbRight').addEventListener('click', ()=>touchAction('right'));
document.getElementById('tbUp').addEventListener('click', ()=>touchAction('up'));
document.getElementById('tbDown').addEventListener('click', ()=>touchAction('down'));
document.getElementById('tbBoost').addEventListener('click', ()=>touchAction('boost'));

/* ---------- أزرار الواجهة ---------- */
document.getElementById('btnPlay').addEventListener('click', startGame);
document.getElementById('btnRestart').addEventListener('click', ()=>{ document.getElementById('screenOver').style.display='none'; startGame(); });
document.getElementById('btnHome').addEventListener('click', ()=>{ document.getElementById('screenOver').style.display='none'; document.getElementById('screenStart').classList.add('active'); });

/* ---------- بدء اللعبة وإنهاؤها ---------- */
function startGame(){
  initAudio(); resumeAudio();
  resetGameState();
  G.running = true; G.startTime = performance.now();
  DB.attempts++; saveDB();
  document.getElementById('screenStart').classList.remove('active');
  document.getElementById('screenOver').style.display = 'none';
  G.levelIndex = 0;
  for(let i=0;i<20;i++){ spawnCoin(Math.floor(Math.random()*LANE_CNT), - (i*40)); }
  requestAnimationFrame(gameLoop);
}

function gameOver(reason){
  if(!G.running) return;
  G.running = false;
  SFX.crash();
  DB.highScore = Math.max(DB.highScore, Math.floor(G.score));
  saveDB();
  el.ovScore.textContent = Math.floor(G.score);
  el.ovSpeed.textContent = Math.floor(G.maxSpeed);
  el.ovTrains.textContent = G.trainsPassed;
  document.getElementById('screenOver').style.display = 'flex';
  checkAchievements();
}

/* ---------- وظائف مساعدة إضافية ---------- */
function showHypeMsg(text, color='#fff'){ showHype(text,color); }
function spawnPowerup(type, lane){
  if(type === 'magnet'){ G.activeBoosts.magnet = 600; showHype('مغناطيس مفعل', '#66ccff'); }
  if(type === 'shield3'){ G.activeBoosts.shield3 = 3; showHype('درع ثلاثي', '#88ff88'); }
  if(type === 'rocket'){
    const target = G.obstacles.find(o => o.y < TRACK_TOP + 220 && o.y > TRACK_TOP && Math.abs(o.x - G.px) < 120);
    if(target){ G.obstacles = G.obstacles.filter(o=>o!==target); showHype('صاروخ ضرب الهدف!', '#ffcc00'); DB.totalCoins += 10; saveDB(); }
  }
}

/* ---------- بدء حلقة الرسم حتى لو لم يبدأ اللعب (idle animation) ---------- */
requestAnimationFrame(gameLoop);

/* ---------- حفظ دوري ---------- */
setInterval(()=>saveDB(), 5000);

/* ---------- وظائف إضافية صغيرة ---------- */
function togglePause(){ G.paused = !G.paused; if(G.paused) showToast('موقوف مؤقتاً'); else showToast('استمر'); }

/* ---------- نهاية الملف ---------- */
