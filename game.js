// تكملة دالة spawnTrain
  });
}

// ─── رسائل التحفيز والفلوس الكبيرة ────────────────────────────────
function triggerBigMoney() {
  const el = document.getElementById('bigMoneyMsg');
  if (el) {
    el.textContent = "عاش يا وحش الفلوس! 💸";
    el.classList.remove('hidden');
    setTimeout(() => { el.classList.add('hidden'); }, 2200);
  }
}

function showHypeMsg(text, color) {
  const el = document.getElementById('hypeMsg');
  if (el) {
    el.innerHTML = text;
    el.style.color = color || '#ffcc00';
    el.classList.remove('hidden');
    // إعادة تشغيل الأنيميشن
    el.style.animation = 'none';
    void el.offsetWidth; 
    el.style.animation = 'hypeAnim 1.8s ease forwards';
  }
}

// ─── الذكاء الاصطناعي والمطاردة (الغيطي) ──────────────────────────
function updateEnemy(dt) {
  if (!G.enemyVisible) {
    // لو اللاعب غلط، الغيطي بيظهر
    if (G.score > 500 && Math.random() < 0.001) G.enemyVisible = true;
    return;
  }
  
  // سرعة الغيطي بتزيد مع سرعتك، وبيحاول يقلد حركتك ببطء
  const speedDiff = G.speed - 5.5; 
  let enemySpeed = G.speed + 0.2 + (speedDiff * 0.1);

  // لو أنت عامل Boost هو بيتأخر
  if (G.boosting) {
    G.enemyDist += 5;
  } else {
    // الغيطي بيقرب ببطء
    G.enemyDist -= 0.5; 
  }

  // تحديث المسار (بيحاول يروح لمسارك)
  if (G.frame % 30 === 0 && G.enemyLane !== G.targetLane) {
    G.enemyLane += (G.targetLane > G.enemyLane) ? 1 : -1;
  }

  // تحديث شريط الخطر في الـ UI
  const dangerTrack = document.getElementById('dangerFill');
  const dangerPct = document.getElementById('dangerPct');
  if (dangerTrack && dangerPct) {
    let dangerLevel = Math.max(0, 100 - (G.enemyDist / 8)); // 800 هو الأمان، 0 هو الموت
    dangerTrack.style.width = dangerLevel + '%';
    
    if (dangerLevel > 80) dangerPct.textContent = 'هيمسكك!';
    else if (dangerLevel > 50) dangerPct.textContent = 'بيقرب!';
    else dangerPct.textContent = 'بعيد';
  }

  if (G.enemyDist > 1000) G.enemyVisible = false; // هربت منه
  
  // الموت بواسطة الغيطي
  if (G.enemyDist <= 0) {
    gameOver("مسكك الغيطي!");
  }
}

// ─── نظام التصادم (Collisions) ───────────────────────────────────
function checkCollisions() {
  if (G.invincible > 0 || G.activeBoosts.tunnel) return; // النفق السري يجعلك لا تقهر

  const pRect = { x: G.px - 10, y: G.py - 30, w: 20, h: 30 };
  
  // تصادم العقبات
  for (let ob of G.obstacles) {
    const oRect = { x: px(ob.x) - px(ob.w/2||15), y: py2(ob.y) - py2(ob.h||30), w: px(ob.w||30), h: py2(ob.h||30) };
    
    if (isCollide(pRect, oRect)) {
      if (ob.ghost) {
        // القطار الشبح بيعطيك بونص مش بيموتك
        G.score += 500;
        showHypeMsg("عديت من الشبح!", "#aaaaff");
        ob.y = 9999; 
        continue;
      }

      // لو معاك درع حمادة أو الدرع الثلاثي
      if (G.activeBoosts.shield3 > 0) {
        G.activeBoosts.shield3 = 0; // استهلاك الدرع
        G.invincible = 60;
        SFX.crash();
        addParticle({x: G.px, y: G.py, r: 20, color: '#00ccff', type: 'explosion', life: 1.5});
        ob.y = 9999; // تدمير العقبة
        return;
      }

      // لو العقبة صغيرة (حاجز) بتتعثر والغيطي بيقرب
      if (ob.type === 'barrier' || ob.type === 'wire') {
        G.speed *= 0.7; // تباطؤ
        G.enemyVisible = true;
        G.enemyDist -= 200; // الغيطي يقفز مسافة كبيرة نحوك
        SFX.crash();
        G.invincible = 30;
      } else {
        // قطار أو عربية = Game Over
        gameOver("خبطت في " + (ob.type==='train' ? 'القطر!' : 'العربية!'));
      }
    }
  }

  // تصادم العملات
  for (let i = G.coinItems.length - 1; i >= 0; i--) {
    let c = G.coinItems[i];
    // المغناطيس يجذب العملات
    if (G.activeBoosts.magnet) {
      let dx = G.px - px(c.x);
      let dy = (G.py - 15) - py2(c.y);
      let dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < px(150)) {
        c.x += dx * 0.1;
        c.y += dy * 0.1;
      }
    }

    const cRect = { x: px(c.x) - 10, y: py2(c.y) - 10, w: 20, h: 20 };
    if (isCollide(pRect, cRect)) {
      let multiplier = G.activeBoosts.x10 ? 10 : 1;
      let coinVal = 1 * multiplier;
      
      // عواطف بتجمع x1.5
      if (DB.selectedChar === 'awatef') coinVal = Math.ceil(coinVal * 1.5);

      G.coins += coinVal;
      G.boostMeter = Math.min(100, G.boostMeter + 2); // شحن البوست
      SFX.coin();
      G.coinItems.splice(i, 1);
      
      // رسالة الفلوس الكبيرة
      if (G.coins > 0 && G.coins % 100 === 0) triggerBigMoney();
    }
  }
}

function isCollide(r1, r2) {
  return !(r2.x > r1.x + r1.w || r2.x + r2.w < r1.x || r2.y > r1.y + r1.h || r2.y + r2.h < r1.y);
}

// ─── الحلقة الرئيسية للمحرك (Main Game Loop) ─────────────────────
let lastTime = 0;
function loop(timestamp) {
  if (!G.running) return;
  const dt = (timestamp - lastTime) / 1000 || 0.016;
  lastTime = timestamp;
  G.frame++;

  // 1. التحديثات (Updates)
  if (!G.paused) {
    G.score += G.speed * 0.02;
    if (G.score > LEVELS[G.level].scoreThresh && G.level < LEVELS.length - 1) {
      G.level++;
      showHypeMsg(`مرحلة ${LEVELS[G.level].name}!`, LEVELS[G.level].color);
      SFX.levelUp();
    }

    // حركة اللاعب بين المسارات
    const targetX = LANES_X[G.targetLane];
    G.px += (targetX - G.px) * 0.15; // حركة سلسة (Lerp)

    // القفز والجاذبية
    if (G.jumping) {
      G.py += G.jumpVY;
      G.jumpVY += 0.8; // الجاذبية
      if (G.py >= GROUND_Y) {
        G.py = GROUND_Y;
        G.jumping = false;
        G.doubleJumpUsed = false;
        SFX.land();
      }
    }

    // تحديث البوست
    if (G.boosting) {
      G.boostTimer--;
      G.speed = 12; // سرعة جنونية
      if (G.frame % 3 === 0) addParticle({x: G.px, y: G.py, color: '#ffcc00', type: 'line', life: 0.5});
      if (G.boostTimer <= 0) {
        G.boosting = false;
        G.speed = 5.5 + (G.level * 0.5); // عودة للسرعة الطبيعية
      }
    } else {
      G.speed = Math.min(10, 5.5 + (G.score * 0.0005)); // السرعة تزيد مع الوقت
    }

    // تحديث الغيطي والعقبات والتصادم
    updateEnemy(dt);
    spawnObstacles(dt);
    
    // تحريك العقبات للخلف (إعطاء إحساس الجري للأمام)
    G.obstacles.forEach(ob => ob.y += G.speed);
    G.coinItems.forEach(c => c.y += G.speed);
    
    // تنظيف المصفوفات
    G.obstacles = G.obstacles.filter(ob => ob.y < BASE_H + 100);
    G.coinItems = G.coinItems.filter(c => c.y < BASE_H + 100);
    if (G.invincible > 0) G.invincible--;

    checkCollisions();
    
    // تحديث الـ UI
    document.getElementById('hudScore').textContent = Math.floor(G.score);
    document.getElementById('hudCoins').textContent = G.coins;
    document.getElementById('boostFill').style.width = G.boostMeter + '%';
  }

  // 2. الرسم (Render)
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  drawCoins();
  drawPowerups();
  drawObstacles();
  drawEnemy();
  drawPlayer();
  drawParticles();
  drawDrone();

  requestAnimationFrame(loop);
}

// ─── التحكم (Inputs) ─────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  if (!G.running || G.paused) return;
  if (e.key === 'ArrowLeft' && G.targetLane > 0) G.targetLane--;
  if (e.key === 'ArrowRight' && G.targetLane < LANE_CNT - 1) G.targetLane++;
  if (e.key === 'ArrowUp') executeJump();
  if (e.key === 'ArrowDown') executeSlide();
  if (e.key === 'Shift') executeBoost();
});

function touchAction(action) {
  if (!G.running || G.paused) return;
  if (action === 'left' && G.targetLane > 0) G.targetLane--;
  if (action === 'right' && G.targetLane < LANE_CNT - 1) G.targetLane++;
  if (action === 'up') executeJump();
  if (action === 'down') executeSlide();
  if (action === 'boost') executeBoost();
}

function executeJump() {
  if (!G.jumping) {
    G.jumping = true;
    G.jumpVY = -14;
    SFX.jump();
    addParticle({x: G.px, y: GROUND_Y, r: 10, color: '#aaa', life: 0.8}); // غبار القفز
  } else if (G.activeBoosts.doubleJump > 0 && !G.doubleJumpUsed) {
    G.jumpVY = -12; // قفزة مزدوجة
    G.doubleJumpUsed = true;
    SFX.jump();
    addParticle({x: G.px, y: G.py, r: 15, color: '#ffaa00', life: 1}); 
  }
}

function executeSlide() {
  if (!G.jumping && !G.sliding) {
    G.sliding = true;
    SFX.slide();
    setTimeout(() => { G.sliding = false; }, 800); // مدة الانزلاق
  } else if (G.jumping) {
    // هبوط سريع
    G.jumpVY = 15;
  }
}

function executeBoost() {
  if (G.boostMeter >= 100 && !G.boosting) {
    G.boosting = true;
    G.boostMeter = 0;
    G.boostTimer = 300; // 5 ثواني (60 فريم)
    G.invincible = 300;
    SFX.boost();
    showHypeMsg("طياااارة!", "#ff4400");
  }
}

// ─── دورة حياة اللعبة ───────────────────────────────────────────
function startGame() {
  resetGameState();
  G.running = true;
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active'); s.classList.add('hidden');
  });
  document.getElementById('screenHUD').classList.remove('hidden');
  document.getElementById('screenHUD').classList.add('active');
  initAudio();
  startMusic();
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function gameOver(reason) {
  G.running = false;
  stopMusic();
  SFX.crash();
  
  DB.attempts++;
  DB.totalCoins += G.coins;
  let isNewRecord = false;
  if (G.score > DB.highScore) {
    DB.highScore = Math.floor(G.score);
    isNewRecord = true;
  }
  saveDB();

  setTimeout(() => {
    document.getElementById('screenHUD').classList.remove('active');
    document.getElementById('screenHUD').classList.add('hidden');
    
    document.getElementById('overTitle').textContent = reason || "انتهت اللعبة!";
    document.getElementById('ovScore').textContent = Math.floor(G.score);
    document.getElementById('ovCoins').textContent = G.coins;
    document.getElementById('ovHS').textContent = DB.highScore;
    
    const recEl = document.getElementById('newRecord');
    if (isNewRecord) recEl.classList.remove('hidden');
    else recEl.classList.add('hidden');

    document.getElementById('screenOver').classList.remove('hidden');
    document.getElementById('screenOver').classList.add('active');
  }, 1000);
}

// ─── أزرار الـ HTML ─────────────────────────────────────────────
document.getElementById('btnPlay')?.addEventListener('click', startGame);
document.getElementById('btnRestart')?.addEventListener('click', startGame);
document.getElementById('btnHome')?.addEventListener('click', () => location.reload());

// تحميل البيانات في الشاشة الرئيسية
document.getElementById('hsDisplay').textContent = DB.highScore;
document.getElementById('totalCoinsDisplay').textContent = DB.totalCoins;
document.getElementById('attemptsDisplay').textContent = DB.attempts;
