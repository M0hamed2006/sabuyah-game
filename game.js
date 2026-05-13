/* game.js — نسخة مرتبة ومركزة
   - كل الوظائف الأساسية هنا: تحجيم الكانفاس، تحكم اللاعب، عدو مطارد، spawn ذكي، جمع عملات، boost، حفظ محلي.
   - التعليقات بالعربي لتسهيل التعديل لاحقاً.
*/

/* ---------- إعداد الكانفاس والقياسات ---------- */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: true });

const BASE_W = 480, BASE_H = 854;
let W = innerWidth, H = innerHeight, scaleX = 1, scaleY = 1;
function resize() {
  W = canvas.width = innerWidth;
  H = canvas.height = innerHeight;
  scaleX = W / BASE_W; scaleY = H / BASE_H;
}
addEventListener('resize', resize);
resize();

/* ---------- بيانات ثابتة ---------- */
const LANE_CNT = 5;
const LANE_W = BASE_W / LANE_CNT;
const LANES_X = Array.from({length:LANE_CNT}, (_,i) => LANE_W*i + LANE_W/2);
const TRACK_TOP = BASE_H * 0.28;
const GROUND_Y = BASE_H * 0.78;

const LEVELS = [
  {name:'القاهرة', scoreThresh:0, color:'#c4813a'},
  {name:'الإسكندرية', scoreThresh:2000, color:'#4488cc'},
  {name:'الأقصر', scoreThresh:5000, color:'#e8a030'}
];

/* ---------- حفظ محلي (LocalStorage) ---------- */
const SAVE_KEY = 'sabuyah_clean_v1';
let DB = { highScore:0, totalCoins:0, attempts:0, selectedChar:'sabuyah', ownedChars:['sabuyah'], settings:{music:true,sfx:true,quality:'med'} };
try { const s = localStorage.getItem(SAVE_KEY); if(s) DB = JSON.parse(s); } catch(e){}
function saveDB(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(DB)); }catch(e){} }

/* ---------- حالة اللعبة ---------- */
let G = {};
function resetGameState(){
  G = {
    running:false, paused:false, frame:0, score:0, coins:0, speed:6, maxSpeed:6,
    levelIndex:0, obstacles:[], coinsOnTrack:[], particles:[],
    lane:2, targetLane:2, px:LANES_X[2], py:GROUND_Y, jumping:false, jumpVY:0, jumpCount:0,
    sliding:false, slideTimer:0, doubleJump:false,
    boostMeter:0, boosting:false, boostTimer:0, activeBoosts:{},
    enemyDist:900, enemyLane:2, enemyY:GROUND_Y, enemyWhistle:0,
    scoreHistory:[]
  };
}
resetGameState();

/* ---------- WebAudio بسيط ---------- */
let AC = null;
function initAudio(){ if(AC) return; try{ AC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ AC=null; } }
function playTone(freq,dur,vol=0.2,type='sine'){ if(!AC || !DB.settings.sfx) return; const t=AC.currentTime; const o=AC.createOscillator(), g=AC.createGain(); o.type=type; o.frequency.value=freq; g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+dur+0.02); }

/* ---------- أدوات رسم ---------- */
function px(x){ return x * scaleX; }
function py(y){ return y * scaleY; }
function fillRect(x,y,w,h,color){ ctx.fillStyle=color; ctx.fillRect(px(x), py(y), Math.max(1, px(w)), Math.max(1, py(h))); }
function circle(x,y,r,color){ ctx.fillStyle=color; ctx.beginPath(); ctx.arc(px(x), py(y), Math.max(1, r*Math.min(scaleX,scaleY)), 0, Math.PI*2); ctx.fill(); }

/* ---------- spawn ذكي مبسّط ---------- */
function spawnObstacle(type, lane, offsetY = -40){
  const x = LANES_X[lane] + (Math.random()-0.5)*8;
  const y = TRACK_TOP + offsetY;
  const ob = { id:Date.now()+Math.random(), type, lane, x, y };
  if(type === 'train'){ ob.carCount = 1 + Math.floor(Math.random()*2); ob.color = '#2a8'; ob.stopped = Math.random()<0.12; }
  if(type === 'pit'){ ob.w = 80 + Math.random()*60; }
  G.obstacles.push(ob);
}
function spawnCoin(lane, offsetY = -20, big=false){
  const x = LANES_X[lane] + (Math.random()-0.5)*12;
  const y = TRACK_TOP + offsetY + Math.random()*60;
  G.coinsOnTrack.push({ id:Date.now()+Math.random(), x, y, lane, big });
}
function smartSpawner(){
  // احتمال عقبة يعتمد على النقاط
  if(Math.random() < 0.02 + Math.min(0.02, G.score/20000)){
    const lane = Math.floor(Math.random()*LANE_CNT);
    const types = ['car','barrier','wire','pit','camel'];
    if(Math.random() < 0.08) spawnObstacle('train', lane, -60);
    else spawnObstacle(types[Math.floor(Math.random()*types.length)], lane, -60);
  }
  if(Math.random() < 0.06) spawnCoin(Math.floor(Math.random()*LANE_CNT), -30, Math.random()<0.08);
}

/* ---------- تحكم اللاعب ---------- */
function moveToLane(i){ G.targetLane = Math.max(0, Math.min(LANE_CNT-1, i)); }
function jump(){
  if(G.hanging){ G.hanging=false; G.jumping=true; G.jumpVY=-10; G.jumpCount=1; playTone(320,0.06); return; }
  if(!G.jumping){ G.jumping=true; G.jumpVY=-11; G.jumpCount=1; playTone(320,0.06); }
  else if(G.doubleJump && G.jumpCount < 2){ G.jumpVY=-10; G.jumpCount++; playTone(380,0.06); }
}
function slide(){
  if(G.jumping) return;
  G.sliding = true; G.slideTimer = 28; playTone(200,0.06);
}

/* ---------- اصطدامات مبسطة ---------- */
function checkCollisions(){
  const px = G.px, py = G.py;
  for(let i=G.obstacles.length-1;i>=0;i--){
    const ob = G.obstacles[i];
    const dx = Math.abs(ob.x - px), dy = Math.abs(ob.y - py);
    if(dx < 18 && dy < 28){
      if(G.activeBoosts.shield && G.activeBoosts.shield > 0){ G.activeBoosts.shield--; G.score += 10; continue; }
      endGame('اصطدمت');
      return;
    }
  }
  if(G.enemyDist < 40 && Math.abs(G.enemyLane - G.lane) === 0) endGame('الغيطي أمسكك');
}

/* ---------- عدو مطارد بسيط ---------- */
function updateEnemy(){
  const factor = 1 + (G.speed - 6)/10;
  G.enemyDist -= 0.6 * factor + (G.boosting?1.2:0);
  if(G.enemyDist < 0) G.enemyDist = 0;
  // يتفادى عقبات بسيطة
  const close = G.obstacles.find(o => o.y < TRACK_TOP + 120 && Math.abs(o.x - LANES_X[G.enemyLane]) < 30);
  if(close && Math.random() < 0.08){
    const dir = (G.lane > G.enemyLane) ? 1 : -1;
    G.enemyLane = Math.max(0, Math.min(LANE_CNT-1, G.enemyLane + (Math.random()<0.6?dir:(Math.random()<0.5?1:-1))));
    G.enemyWhistle = 30;
  }
  if(G.enemyWhistle <= 0 && G.enemyDist < 220){ playTone(900,0.06); G.enemyWhistle = 120; }
  if(G.enemyWhistle > 0) G.enemyWhistle--;
}

/* ---------- نظام البوست ---------- */
function tryBoost(){
  if(G.boostMeter >= 100 && !G.boosting){
    G.boosting = true; G.boostTimer = 300; G.boostMeter = 0; G.speed *= 1.8; playTone(500,0.12);
  }
}

/* ---------- حلقة اللعبة الرئيسية ---------- */
let lastTime = performance.now();
function gameLoop(now){
  const dt = Math.min(40, now - lastTime);
  lastTime = now;
  if(G.running && !G.paused){
    G.frame++;
    // سرعة تدريجية
    G.speed = Math.min(18, G.speed + 0.0006 * G.frame);
    G.maxSpeed = Math.max(G.maxSpeed, G.speed);
    if(G.frame % 6 === 0) smartSpawner();

    // تحديث عقبات وعملات
    for(let i=G.obstacles.length-1;i>=0;i--){
      const ob = G.obstacles[i];
      ob.y += G.speed * (ob.type === 'train' ? 1.6 : 1) * (G.boosting ? 1.4 : 1);
      if(ob.y > BASE_H + 200) { if(ob.type === 'train') G.trainsPassed = (G.trainsPassed||0) + 1; G.obstacles.splice(i,1); }
    }
    for(let i=G.coinsOnTrack.length-1;i>=0;i--){
      const c = G.coinsOnTrack[i];
      c.y += G.speed * (G.boosting ? 1.4 : 1);
      if(c.y > BASE_H + 50) G.coinsOnTrack.splice(i,1);
      if(Math.hypot(c.x - G.px, c.y - G.py) < 18){ G.coins += c.big?5:1; G.score += c.big?50:10; DB.totalCoins += c.big?5:1; G.coinsOnTrack.splice(i,1); playTone(880,0.06); }
    }

    // حركة اللاعب نحو المسار الهدف
    const tx = LANES_X[G.targetLane];
    G.px += (tx - G.px) * 0.25;
    // قفز
    if(G.jumping){ G.jumpVY += 0.6; G.py += G.jumpVY; if(G.py >= GROUND_Y){ G.py = GROUND_Y; G.jumping=false; G.jumpVY=0; G.jumpCount=0; } }
    else G.py = GROUND_Y;
    // انزلاق
    if(G.sliding){ G.slideTimer--; if(G.slideTimer <= 0) G.sliding = false; }
    // بوست
    G.boostMeter = Math.min(100, G.boostMeter + 0.02 * (G.coins>0?1.2:1));
    if(G.boosting){ G.boostTimer--; if(G.boostTimer <= 0){ G.boosting = false; G.speed /= 1.8; } }
    // عدو
    updateEnemy();
    // اصطدامات
    checkCollisions();
    // نقاط
    G.score += 0.02 * (G.boosting ? 3 : 1);
    // واجهة
    updateUI();
  }
  render();
  requestAnimationFrame(gameLoop);
}

/* ---------- رسم المشهد ---------- */
function render(){
  ctx.clearRect(0,0,W,H);
  // سماء
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(0,0,W,py(TRACK_TOP));
  // مباني بسيطة
  for(let i=0;i<10;i++){ fillRect(i*60 - (G.frame*0.2)%60, GROUND_Y - 60 - (i%3)*20, 40, 60 + (i%3)*20, i%2? '#2a6':'#446'); }
  // أرضية
  fillRect(0, GROUND_Y, BASE_W, BASE_H - GROUND_Y, '#6b4a2a');
  // قضبان
  LANES_X.forEach(lx => fillRect(lx-1.5, GROUND_Y-2, 3, BASE_H-GROUND_Y+2, '#444'));
  // sleepers
  const sleeperSpacing = 18;
  const sleeperOff = (G.frame * G.speed * 0.8) % sleeperSpacing;
  for(let sy = TRACK_TOP + sleeperOff; sy < BASE_H; sy += sleeperSpacing) fillRect(8, sy, BASE_W-16, 4, '#5c3d1e');

  // عقبات
  G.obstacles.forEach(ob => {
    if(ob.type === 'train') drawTrain(ob);
    else if(ob.type === 'car') drawCar(ob);
    else if(ob.type === 'pit') drawPit(ob);
    else drawGeneric(ob);
  });

  // عملات
  G.coinsOnTrack.forEach(c => circle(c.x, c.y, c.big?5:3, '#ffd700'));

  // ظل اللاعب
  ctx.globalAlpha = 0.25;
  ctx.beginPath(); ctx.ellipse(px(G.px), py(GROUND_Y+6), px(14), py(5), 0, 0, Math.PI*2); ctx.fillStyle='#000'; ctx.fill();
  ctx.globalAlpha = 1;

  // لاعب
  drawPlayer();

  // عدو
  drawEnemy();

  // تأثيرات بوست
  if(G.boosting){
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = '#ffff66';
    for(let i=0;i<10;i++) fillRect((i*50 + G.frame*20)%BASE_W, TRACK_TOP + Math.random()*200, 40, 2, 'rgba(255,255,200,0.08)');
    ctx.globalAlpha = 1;
  }
}

/* ---------- رسمات مبسطة ---------- */
function drawPlayer(){
  const x = G.px, y = G.py;
  fillRect(x-10, y-30, 20, 26, '#2244cc'); // جسم
  fillRect(x-9, y-46, 18, 18, '#f4a460'); // رأس
  fillRect(x-10, y-56, 20, 12, '#cc2200'); // طاقية
  if(G.sliding){ ctx.save(); ctx.translate(px(x), py(y-8)); ctx.rotate(-0.3); fillRect(-16,-5,32,12,'#2244cc'); ctx.restore(); }
}
function drawEnemy(){
  const ex = LANES_X[G.enemyLane], ey = G.enemyY;
  ctx.save(); ctx.globalAlpha = Math.min(1, 1 - G.enemyDist/400);
  fillRect(ex-10, ey-30, 20, 26, '#8B0000');
  fillRect(ex-9, ey-46, 18, 18, '#6b3515');
  if(G.enemyDist < 150) drawText('⚠️', ex, ey-65, 14, '#ff0000');
  ctx.restore();
}
function drawTrain(ob){
  const x = ob.x, y = ob.y;
  fillRect(x-18, y-20, 36, 28, ob.color || '#228822');
  circle(x-12, y+10, 6, '#222'); circle(x+12, y+10, 6, '#222');
}
function drawCar(ob){ fillRect(ob.x-12, ob.y-10, 24, 14, '#ccaa22'); circle(ob.x-8, ob.y+6, 5, '#222'); circle(ob.x+8, ob.y+6, 5, '#222'); }
function drawPit(ob){ fillRect(ob.x - ob.w/2, ob.y-5, ob.w, 20, '#000'); }
function drawGeneric(ob){ fillRect(ob.x-10, ob.y-12, 20, 18, '#aa3333'); }
function drawText(text,x,y,size,color){ ctx.fillStyle=color; ctx.font = `${Math.max(10, py(size))}px Cairo, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(text, px(x), py(y)); }

/* ---------- واجهة المستخدم ---------- */
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
function updateUI(){
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
function showHype(text, time=1400){ el.hypeMsg.textContent = text; el.hypeMsg.style.display = 'block'; setTimeout(()=>el.hypeMsg.style.display='none', time); }
function showToast(text, time=2200){ el.achieveToast.textContent = text; el.achieveToast.style.display = 'block'; setTimeout(()=>el.achieveToast.style.display='none', time); }

/* ---------- إدخال لوحة ومس ---------- */
addEventListener('keydown', e=>{
  if(e.key === 'ArrowLeft' || e.key === 'a') moveToLane(G.lane-1);
  if(e.key === 'ArrowRight' || e.key === 'd') moveToLane(G.lane+1);
  if(e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') jump();
  if(e.key === 'ArrowDown' || e.key === 's') slide();
  if(e.key === 'Shift') tryBoost();
});
document.getElementById('tbLeft').addEventListener('click', ()=>moveToLane(G.lane-1));
document.getElementById('tbRight').addEventListener('click', ()=>moveToLane(G.lane+1));
document.getElementById('tbUp').addEventListener('click', ()=>jump());
document.getElementById('tbDown').addEventListener('click', ()=>slide());
document.getElementById('tbBoost').addEventListener('click', ()=>tryBoost());

/* ---------- أزرار الواجهة ---------- */
document.getElementById('btnPlay').addEventListener('click', ()=>{
  initAudio(); startGame();
});
document.getElementById('btnRestart').addEventListener('click', ()=>{ document.getElementById('screenOver').classList.add('hidden'); startGame(); });
document.getElementById('btnHome').addEventListener('click', ()=>{ document.getElementById('screenOver').classList.add('hidden'); document.getElementById('screenStart').classList.add('active'); });

/* ---------- بدء وإنهاء اللعبة ---------- */
function startGame(){
  resetGameState();
  G.running = true; G.startTime = performance.now();
  DB.attempts++; saveDB();
  document.getElementById('screenStart').classList.remove('active');
  document.getElementById('screenOver').classList.add('hidden');
  // تهيئة أولية
  for(let i=0;i<12;i++) spawnCoin(Math.floor(Math.random()*LANE_CNT), - (i*30));
  requestAnimationFrame(gameLoop);
}
function endGame(reason){
  if(!G.running) return;
  G.running = false;
  playTone(80,0.3);
  DB.highScore = Math.max(DB.highScore, Math.floor(G.score));
  saveDB();
  el.ovScore.textContent = Math.floor(G.score);
  el.ovSpeed.textContent = Math.floor(G.maxSpeed);
  el.ovTrains.textContent = G.trainsPassed || 0;
  document.getElementById('screenOver').classList.remove('hidden');
  showToast('انتهت اللعبة: ' + reason);
}

/* ---------- بدء حلقة الرسم ---------- */
requestAnimationFrame(gameLoop);

/* ---------- حفظ دوري ---------- */
setInterval(()=>saveDB(), 5000);

/* ---------- ملاحظات للمطور لاحقاً ----------
  - هذه نسخة مركزة: لو عايز أضيف بعد كده (دوبلر، Web Speech، متجر، رسومات بيكسل متعددة إطارات، تحسين AI متقدم)، أعمل ملفات منفصلة وأضيفها.
  - لو في سلوك معين ملخبّط عندك دلوقتي (مثلاً: اللاعب يخرج من المسار، أو العدو مش بيتحرك صح)، ابعتلي وصف سريع للخطأ وأنا أصلحه فوراً.
*/
