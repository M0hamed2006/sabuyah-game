/* game.js — نسخة محسّنة بصرياً ووظيفياً
   ملاحظات مهمة:
   - كل الكود أصلي ومبني هنا. لا نسخ من ألعاب محمية.
   - التركيز: parallax, player sprite-like, trains detailed, particles, swipe controls.
*/

/* ---------- إعداد الكانفاس والقياسات ---------- */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: true });
const BASE_W = 480, BASE_H = 854;
let W = innerWidth, H = innerHeight, scaleX = 1, scaleY = 1;
function resize(){ W = canvas.width = innerWidth; H = canvas.height = innerHeight; scaleX = W/BASE_W; scaleY = H/BASE_H; }
addEventListener('resize', resize); resize();

/* ---------- بيانات ثابتة ---------- */
const LANE_CNT = 5;
const LANE_W = BASE_W / LANE_CNT;
const LANES_X = Array.from({length:LANE_CNT}, (_,i)=>LANE_W*i + LANE_W/2);
const TRACK_TOP = BASE_H * 0.28;
const GROUND_Y = BASE_H * 0.78;

/* ---------- حفظ محلي ---------- */
const SAVE_KEY = 'sabuyah_pro_v1';
let DB = { highScore:0, totalCoins:0, attempts:0, selectedChar:'sabuyah', settings:{sfx:true,quality:'med'} };
try{ const s = localStorage.getItem(SAVE_KEY); if(s) DB = JSON.parse(s); }catch(e){}
function saveDB(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(DB)); }catch(e){} }

/* ---------- حالة اللعبة ---------- */
let G = {};
function resetGame(){
  G = {
    running:false, frame:0, score:0, coins:0, speed:6, maxSpeed:6,
    levelIndex:0, obstacles:[], coinsOnTrack:[], particles:[],
    lane:2, targetLane:2, px:LANES_X[2], py:GROUND_Y, jumping:false, jumpVY:0, jumpCount:0,
    sliding:false, slideTimer:0, doubleJump:false,
    boostMeter:0, boosting:false, boostTimer:0, activeBoosts:{},
    enemyDist:900, enemyLane:2, enemyY:GROUND_Y, enemyWhistle:0,
    buildingsX:Array.from({length:12},(_,i)=>-80 + i*120), buildingsH:Array.from({length:12},()=>80 + Math.random()*120),
    cloudX:Array.from({length:6},(_,i)=>i*90), cloudY:Array.from({length:6},()=>30 + Math.random()*60),
    scoreHistory:[]
  };
}
resetGame();

/* ---------- WebAudio بسيط ---------- */
let AC = null;
function initAudio(){ if(AC) return; try{ AC = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ AC=null; } }
function playTone(freq,dur,vol=0.18,type='sine',delay=0){ if(!AC || !DB.settings.sfx) return; const t = AC.currentTime + delay; const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+dur+0.02); }

/* ---------- أدوات رسم ---------- */
function px(x){ return x * scaleX; }
function py(y){ return y * scaleY; }
function fillRect(x,y,w,h,color){ ctx.fillStyle=color; ctx.fillRect(px(x), py(y), Math.max(1, px(w)), Math.max(1, py(h))); }
function circle(x,y,r,color){ ctx.fillStyle=color; ctx.beginPath(); ctx.arc(px(x), py(y), Math.max(1, r*Math.min(scaleX,scaleY)), 0, Math.PI*2); ctx.fill(); }
function drawText(text,x,y,size,color='white'){ ctx.fillStyle=color; ctx.font = `${Math.max(10, py(size))}px Cairo, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(text, px(x), py(y)); }

/* ---------- جسيمات (Particles) ---------- */
function emitParticle(p){ if(DB.settings.quality==='low' && G.particles.length>30) return; if(DB.settings.quality==='med' && G.particles.length>120) return; G.particles.push(Object.assign({x:0,y:0,vx:0,vy:0,life:1,maxLife:1,r:3,color:'#fff',gravity:0}, p)); }
function updateParticles(){
  for(let i=G.particles.length-1;i>=0;i--){
    const p = G.particles[i]; p.x += p.vx; p.y += p.vy; p.vy += (p.gravity||0); p.life -= 0.02;
    if(p.life <= 0) G.particles.splice(i,1);
  }
}

/* ---------- توليد عقبات وعملات ---------- */
function spawnObstacle(type,lane,offset=-60){
  const x = LANES_X[lane] + (Math.random()-0.5)*10;
  const y = TRACK_TOP + offset;
  const ob = { id:Date.now()+Math.random(), type, lane, x, y };
  if(type==='train'){ ob.carCount = 1 + Math.floor(Math.random()*3); ob.color = '#2a8'; ob.sparks = Math.random()<0.25; ob.stopped = Math.random()<0.12; }
  if(type==='pit'){ ob.w = 80 + Math.random()*80; }
  G.obstacles.push(ob);
}
function spawnCoin(lane, offset=-20, big=false){
  const x = LANES_X[lane] + (Math.random()-0.5)*18;
  const y = TRACK_TOP + offset + Math.random()*60;
  G.coinsOnTrack.push({ id:Date.now()+Math.random(), x, y, lane, big });
}
function smartSpawn(){
  if(Math.random() < 0.02 + Math.min(0.02, G.score/20000)){
    const lane = Math.floor(Math.random()*LANE_CNT);
    const types = ['car','barrier','wire','pit','camel'];
    if(Math.random()<0.08) spawnObstacle('train', lane, -80);
    else spawnObstacle(types[Math.floor(Math.random()*types.length)], lane, -80);
  }
  if(Math.random() < 0.06 + (G.activeBoosts.magnet?0.12:0)) spawnCoin(Math.floor(Math.random()*LANE_CNT), -30, Math.random()<0.08);
  if(Math.random() < 0.002) spawnObstacle('helicopter', Math.floor(Math.random()*LANE_CNT), -140);
}

/* ---------- حركة اللاعب وميكانيك القفز ---------- */
function moveToLane(i){ G.targetLane = Math.max(0, Math.min(LANE_CNT-1, i)); }
function playerJump(){
  if(G.hanging){ G.hanging=false; G.jumping=true; G.jumpVY=-10; G.jumpCount=1; playTone(320,0.06); return; }
  if(!G.jumping){ G.jumping=true; G.jumpVY=-11; G.jumpCount=1; playTone(320,0.06); }
  else if(G.doubleJump && G.jumpCount < 2){ G.jumpVY=-10; G.jumpCount++; playTone(380,0.06); showHype('قفزة مزدوجة!'); }
}
function playerSlide(){ if(G.jumping) return; G.sliding=true; G.slideTimer=28; playTone(200,0.06); emitSlideSparks(); }

/* ---------- اصطدامات ---------- */
function checkCollisions(){
  const px = G.px, py = G.py;
  for(let i=G.obstacles.length-1;i>=0;i--){
    const ob = G.obstacles[i];
    const dx = Math.abs(ob.x - px), dy = Math.abs(ob.y - py);
    if(dx < 18 && dy < 28){
      if(G.activeBoosts.shield3 && G.activeBoosts.shield3>0){ G.activeBoosts.shield3--; emitParticle({x:px,y:py-10,vy:-1,life:0.6,color:'#88ddff'}); G.score += 20; continue; }
      endGame('اصطدمت بعقبة'); return;
    }
  }
  if(G.enemyDist < 40 && Math.abs(G.enemyLane - G.lane) === 0 && Math.abs(G.enemyY - G.py) < 20){ endGame('الغيطي أمسكك'); }
}

/* ---------- تحديث العدو (AI بسيط) ---------- */
function updateEnemy(){
  const speedFactor = 1 + (G.speed - 6)/10;
  G.enemyDist -= (0.6 * speedFactor + (G.boosting?1.2:0));
  if(G.enemyDist < 0) G.enemyDist = 0;
  const closeOb = G.obstacles.find(o => o.y < TRACK_TOP + 120 && Math.abs(o.x - LANES_X[G.enemyLane]) < 30);
  if(closeOb && Math.random()<0.08){
    const dir = (G.lane > G.enemyLane) ? 1 : -1;
    if(Math.random()<0.6) G.enemyLane = Math.max(0, Math.min(LANE_CNT-1, G.enemyLane + dir));
    else G.enemyLane = Math.max(0, Math.min(LANE_CNT-1, G.enemyLane + (Math.random()<0.5?1:-1)));
    G.enemyWhistle = 30;
  }
  if(!G.enemyJumping && Math.random()<0.01){ G.enemyJumping=true; G.enemyJumpVY=-9; }
  if(G.enemyJumping){ G.enemyJumpVY += 0.5; G.enemyY += G.enemyJumpVY; if(G.enemyY >= GROUND_Y){ G.enemyY = GROUND_Y; G.enemyJumping=false; } }
  if(G.enemyDist < 220 && G.enemyWhistle <= 0){ playTone(900,0.06); G.enemyWhistle = 120; }
  if(G.enemyWhistle>0) G.enemyWhistle--;
}

/* ---------- بوست ---------- */
function tryBoost(){ if(G.boostMeter >= 100 && !G.boosting){ G.boosting=true; G.boostTimer=300; G.boostMeter=0; G.speed *= 1.8; playTone(520,0.12); showHype('بوست!'); } }

/* ---------- تأثيرات شرر عند الانزلاق ---------- */
function emitSlideSparks(){
  for(let i=0;i<8;i++) emitParticle({x:G.px + (Math.random()-0.5)*10, y:G.py+6, vx:(Math.random()-0.5)*2, vy:-Math.random()*1.5, life:0.6, r:1.5, color:'#ffcc66'});
}

/* ---------- رسم اللاعب (sprite-like بسيط) ---------- */
function drawPlayer(){
  const x = G.px, y = G.py;
  // جسم
  fillRect(x-10, y-30, 20, 26, '#2244cc');
  // رأس
  fillRect(x-9, y-46, 18, 18, '#f4a460');
  // طاقية
  fillRect(x-10, y-56, 20, 12, '#cc2200');
  // أرجل متحركة (sine)
  const f = Math.sin(G.frame * 0.28) * 4;
  fillRect(x-8, y-6 + (G.jumping? -6 : 0), 6, 18, '#1a1a3a');
  fillRect(x+2, y-6 + (G.jumping? -6 : 0), 6, 18, '#1a1a3a');
  if(G.sliding){ ctx.save(); ctx.translate(px(x), py(y-8)); ctx.rotate(-0.3); fillRect(-16,-5,32,12,'#2244cc'); ctx.restore(); }
  if(G.activeBoosts.shield3){ ctx.strokeStyle='rgba(100,200,255,0.6)'; ctx.lineWidth=2*Math.min(scaleX,scaleY); ctx.beginPath(); ctx.arc(px(x), py(y-18), px(22), 0, Math.PI*2); ctx.stroke(); }
}

/* ---------- رسم قطار مفصّل مبسّط ---------- */
function drawTrain(ob){
  const x = ob.x, y = ob.y;
  ctx.save();
  for(let c=0;c<ob.carCount;c++){
    const cy = y - c*62;
    const col = c===0 ? (ob.color||'#228822') : `hsl(${130+c*20},40%,30%)`;
    // جسم
    fillRect(x-18, cy-22, 36, 28, col);
    // نوافذ
    fillRect(x-10, cy-14, 8, 8, 'rgba(200,230,255,0.8)');
    fillRect(x+4, cy-14, 8, 8, 'rgba(200,230,255,0.8)');
    // عجلات دوّارة (مؤثر بصري)
    circle(x-10, cy+12, 6, '#222'); circle(x+10, cy+12, 6, '#222');
    // شرر
    if(ob.sparks && c===0 && Math.random()<0.2) emitParticle({x:x + (Math.random()-0.5)*20, y:cy+6, vx:(Math.random()-0.5)*1.5, vy:-Math.random()*1.2, life:0.6, r:1.5, color:'#ffcc66'});
  }
  // مصابيح أمامية
  if(G.frame % 20 < 10){ circle(x-12, y-18, 4, '#ffffaa'); circle(x+12, y-18, 4, '#ffffaa'); }
  ctx.restore();
}

/* ---------- تحديث الواجهة DOM ---------- */
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
  el.hudLevel.textContent = ['القاهرة','الإسكندرية','الأقصر'][G.levelIndex] || 'القاهرة';
  el.hsDisplay.textContent = DB.highScore;
  el.totalCoinsDisplay.textContent = DB.totalCoins;
  el.attemptsDisplay.textContent = DB.attempts;
  el.dangerFill.style.width = Math.min(100, Math.max(4, (100 - G.enemyDist/10))) + '%';
  el.dangerPct.textContent = G.enemyDist > 600 ? 'بعيد' : G.enemyDist > 300 ? 'قريب' : 'خطر';
  el.boostFill.style.width = G.boostMeter + '%';
  el.boostPct.textContent = Math.floor(G.boostMeter) + '%';
}
function showHype(text, time=1400){ el.hypeMsg.textContent = text; el.hypeMsg.classList.remove('hidden'); setTimeout(()=>el.hypeMsg.classList.add('hidden'), time); }
function showToast(text, time=2200){ el.achieveToast.textContent = text; el.achieveToast.classList.remove('hidden'); setTimeout(()=>el.achieveToast.classList.add('hidden'), time); }

/* ---------- حلقة اللعبة الرئيسية ---------- */
let lastTime = performance.now();
function gameLoop(now){
  const dt = Math.min(40, now - lastTime);
  lastTime = now;
  if(G.running){
    G.frame++;
    // سرعة تدريجية
    G.speed = Math.min(18, G.speed + 0.0006 * G.frame);
    G.maxSpeed = Math.max(G.maxSpeed, G.speed);
    if(G.frame % 6 === 0) smartSpawn();
    // تحديث عقبات
    for(let i=G.obstacles.length-1;i>=0;i--){
      const ob = G.obstacles[i];
      ob.y += G.speed * (ob.type==='train'?1.6:1) * (G.boosting?1.4:1);
      if(ob.y > BASE_H + 200){ if(ob.type==='train') G.trainsPassed = (G.trainsPassed||0) + 1; G.obstacles.splice(i,1); }
    }
    // عملات
    for(let i=G.coinsOnTrack.length-1;i>=0;i--){
      const c = G.coinsOnTrack[i];
      c.y += G.speed * (G.boosting?1.4:1);
      if(c.y > BASE_H + 50) G.coinsOnTrack.splice(i,1);
      if(Math.hypot(c.x - G.px, c.y - G.py) < 18){ G.coins += c.big?5:1; G.score += c.big?50:10; DB.totalCoins += c.big?5:1; G.coinsOnTrack.splice(i,1); playTone(880,0.06); for(let k=0;k<6;k++) emitParticle({x:G.px + (Math.random()-0.5)*10, y:G.py-10, vx:(Math.random()-0.5)*1.2, vy:-Math.random()*1.2, life:0.6, r:1.8, color:'#ffd700'}); }
    }
    // حركة أملس للمسار
    const tx = LANES_X[G.targetLane];
    G.px += (tx - G.px) * 0.25;
    // قفز
    if(G.jumping){ G.jumpVY += 0.6; G.py += G.jumpVY; if(G.py >= GROUND_Y){ G.py = GROUND_Y; G.jumping=false; G.jumpVY=0; G.jumpCount=0; } } else G.py = GROUND_Y;
    // انزلاق
    if(G.sliding){ G.slideTimer--; if(G.slideTimer<=0) G.sliding=false; }
    // بوست
    G.boostMeter = Math.min(100, G.boostMeter + 0.02 * (G.coins>0?1.2:1));
    if(G.boosting){ G.boostTimer--; if(G.boostTimer<=0){ G.boosting=false; G.speed /= 1.8; } }
    // عدو
    updateEnemy();
    // اصطدامات
    checkCollisions();
    // جسيمات
    updateParticles();
    // نقاط
    G.score += 0.02 * (G.boosting?3:1);
    G.scoreHistory.push(G.score);
    // واجهة
    updateUI();
  }
  render();
  requestAnimationFrame(gameLoop);
}

/* ---------- رسم المشهد (parallax) ---------- */
function render(){
  ctx.clearRect(0,0,W,H);
  // sky gradient
  const skyGrad = ctx.createLinearGradient(0,0,0,py(TRACK_TOP));
  skyGrad.addColorStop(0,'#87ceeb'); skyGrad.addColorStop(1,'#6ab0d4');
  ctx.fillStyle = skyGrad; ctx.fillRect(0,0,W,py(TRACK_TOP+20));
  // clouds (parallax)
  G.cloudX.forEach((cx,i)=>{ ctx.globalAlpha = 0.7; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(px((cx + G.frame*0.03*(i%2+1))%BASE_W), py(G.cloudY[i]), py(12), 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1; });
  // buildings parallax
  G.buildingsX.forEach((bx,i)=>{ const bh = G.buildingsH[i]; const by = GROUND_Y - bh; const col = i%2? '#2a6':'#446'; fillRect(bx + (G.frame*0.02*(i%3+1))%(BASE_W+200) - 80, by, 55, bh, col); });
  // ground
  fillRect(0, GROUND_Y, BASE_W, BASE_H - GROUND_Y, '#6b4a2a');
  // rails
  LANES_X.forEach(lx => fillRect(lx-1.5, GROUND_Y-2, 3, BASE_H-GROUND_Y+2, '#444'));
  // sleepers
  const sleeperSpacing = 18; const sleeperOff = (G.frame * G.speed * 0.8) % sleeperSpacing;
  for(let sy = TRACK_TOP + sleeperOff; sy < BASE_H; sy += sleeperSpacing) fillRect(8, sy, BASE_W-16, 4, '#5c3d1e');

  // obstacles
  G.obstacles.forEach(ob => { if(ob.type === 'train') drawTrain(ob); else if(ob.type === 'car') drawTrain(ob); else drawGeneric(ob); });

  // coins
  G.coinsOnTrack.forEach(c => circle(c.x, c.y, c.big?5:3, '#ffd700'));

  // shadow
  ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.ellipse(px(G.px), py(GROUND_Y+6), px(14), py(5), 0, 0, Math.PI*2); ctx.fillStyle='#000'; ctx.fill(); ctx.globalAlpha = 1;

  // player & enemy
  drawPlayer(); drawEnemy();

  // particles
  G.particles.forEach(p => { ctx.globalAlpha = Math.max(0, p.life / p.maxLife); circle(p.x, p.y, p.r, p.color); ctx.globalAlpha = 1; });

  // boost visual
  if(G.boosting){ ctx.globalAlpha = 0.12; ctx.fillStyle = '#ffff66'; for(let i=0;i<12;i++){ const lx = (i*40 + G.frame*20) % BASE_W; fillRect(lx, TRACK_TOP + Math.random()*200, 60, 2, 'rgba(255,255,200,0.08)'); } ctx.globalAlpha = 1; }
}

/* ---------- رسومات عامة مبسطة ---------- */
function drawGeneric(ob){ fillRect(ob.x-10, ob.y-12, 20, 18, '#aa3333'); }
function drawEnemy(){ if(!G.enemyVisible) return; const ex = LANES_X[G.enemyLane]; const ey = G.enemyY; ctx.save(); ctx.globalAlpha = Math.min(1, 1 - G.enemyDist/400); fillRect(ex-10, ey-30, 20, 26, '#8B0000'); fillRect(ex-9, ey-46, 18, 18, '#6b3515'); if(G.enemyDist < 150) drawText('⚠️', ex, ey-65, 14, '#ff0000'); ctx.restore(); }

/* ---------- إدخال لوحة ولمس (مع swipe بسيط) ---------- */
addEventListener('keydown', e=>{
  if(e.key === 'ArrowLeft' || e.key === 'a') moveToLane(G.lane-1);
  if(e.key === 'ArrowRight' || e.key === 'd') move
