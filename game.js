<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>صابويه الترمس 🚆</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');

:root {
  --gold: #ffc200;
  --red: #ff2244;
  --blue: #00aaff;
  --green: #00ff88;
  --purple: #cc44ff;
  --dark: #0a0010;
  --panel: rgba(255,255,255,0.06);
  --border: rgba(255,255,255,0.12);
}

* { margin:0; padding:0; box-sizing:border-box; -webkit-tap-highlight-color:transparent; }

body {
  background: #000;
  font-family: 'Cairo', sans-serif;
  overflow: hidden;
  width: 100vw; height: 100vh;
  touch-action: none;
}

canvas#gc {
  position: fixed; top:0; left:0;
  width:100%; height:100%;
  display: block;
}

/* ═══════════════ HUD ═══════════════ */
#hud {
  position: fixed; top:0; left:0; right:0;
  pointer-events: none;
  z-index: 20;
  padding: 10px 14px 0;
}
.hud-top {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 8px;
}
.hud-box {
  background: rgba(0,0,0,0.55);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 6px 12px;
  backdrop-filter: blur(8px);
  min-width: 70px;
  text-align: center;
}
.hud-label { font-size: 0.6rem; color: rgba(255,255,255,0.5); letter-spacing:1px; text-transform:uppercase; }
.hud-val { font-size: 1.3rem; font-weight: 900; color: #fff; line-height:1; }
.hud-val.gold { color: var(--gold); }
.hud-val.blue { color: var(--blue); }

/* شريط البوست */
#boostBarWrap {
  margin-top: 8px;
  background: rgba(0,0,0,0.5);
  border: 1.5px solid var(--border);
  border-radius: 20px;
  height: 10px; overflow: hidden;
  backdrop-filter: blur(4px);
}
#boostBar {
  height:100%; width:0%;
  background: linear-gradient(90deg, #ff6600, #ffcc00, #fff);
  border-radius: 20px;
  transition: width 0.15s;
  box-shadow: 0 0 8px #ff8800;
}

/* كومبو */
#comboDisplay {
  position:fixed; top:50%; left:50%;
  transform: translate(-50%,-60%);
  font-size: 2.5rem; font-weight:900;
  text-shadow: 0 0 30px currentColor;
  pointer-events:none; z-index:25;
  opacity:0; transition: opacity 0.3s;
}
#comboDisplay.show { opacity:1; }

/* شريط خطر الغيطي */
#dangerBar {
  position: fixed; bottom: 120px; left:14px; right:14px;
  z-index: 20; pointer-events:none;
}
.danger-label {
  font-size:0.65rem; color:rgba(255,255,255,0.6);
  margin-bottom:3px; display:flex; justify-content:space-between;
}
.danger-track {
  height:8px; background:rgba(0,0,0,0.5);
  border-radius:10px; overflow:hidden;
  border:1px solid rgba(255,0,0,0.3);
}
#dangerFill {
  height:100%; width:0%;
  background: linear-gradient(90deg, #00ff44, #ffcc00, #ff2200);
  border-radius:10px;
  transition: width 0.2s;
  box-shadow: 0 0 6px #ff4400;
}
#dangerText { font-size:0.65rem; color:#ff4444; font-weight:700; text-align:center; }

/* بوستات نشطة */
#activePowers {
  position:fixed; top:90px; right:14px;
  display:flex; flex-direction:column; gap:6px;
  pointer-events:none; z-index:20;
}
.power-badge {
  background:rgba(0,0,0,0.6);
  border-radius:10px; padding:4px 8px;
  font-size:0.7rem; font-weight:700;
  border:1.5px solid currentColor;
  display:flex; align-items:center; gap:4px;
  backdrop-filter:blur(4px);
}

/* رسائل فوق الشاشة */
#hypeMsg {
  position:fixed; top:28%; left:50%;
  transform: translateX(-50%);
  font-size:1.8rem; font-weight:900;
  text-shadow: 0 0 20px currentColor, 0 2px 8px rgba(0,0,0,0.8);
  pointer-events:none; z-index:30;
  white-space:nowrap;
  opacity:0;
}
#hypeMsg.pop {
  animation: hypePop 1.6s cubic-bezier(.17,.67,.38,1.4) forwards;
}
@keyframes hypePop {
  0%   { opacity:0; transform:translateX(-50%) scale(0.4) rotate(-5deg); }
  15%  { opacity:1; transform:translateX(-50%) scale(1.15) rotate(2deg); }
  30%  { transform:translateX(-50%) scale(1) rotate(0deg); }
  70%  { opacity:1; transform:translateX(-50%) scale(1); }
  100% { opacity:0; transform:translateX(-50%) scale(0.9) translateY(-20px); }
}

#bigMoney {
  position:fixed; top:40%; left:50%;
  transform: translateX(-50%);
  font-size:2.8rem; font-weight:900;
  pointer-events:none; z-index:31;
  opacity:0;
}
#bigMoney.pop { animation: bigPop 2s ease forwards; }
@keyframes bigPop {
  0%   { opacity:0; transform:translateX(-50%) scale(0.2); }
  20%  { opacity:1; transform:translateX(-50%) scale(1.3); }
  40%  { transform:translateX(-50%) scale(1); }
  75%  { opacity:1; }
  100% { opacity:0; transform:translateX(-50%) translateY(-40px) scale(0.8); }
}

/* إنجاز */
#achieveToast {
  position:fixed; top:50%; right:-400px;
  background:linear-gradient(135deg,#1a0030,#0d001a);
  border:2px solid var(--gold);
  border-radius:16px; padding:12px 20px;
  font-size:1rem; font-weight:700; color:var(--gold);
  transition: right 0.5s cubic-bezier(.17,.67,.38,1.4);
  z-index:35; box-shadow:0 0 30px rgba(255,200,0,0.3);
}
#achieveToast.show { right:14px; }

/* ═══════════════ أزرار التحكم ═══════════════ */
#controls {
  position:fixed; bottom:12px; left:0; right:0;
  display:flex; justify-content:space-between;
  align-items:flex-end;
  padding:0 12px 8px;
  z-index:20;
  pointer-events:none;
}
.ctrl-group { display:flex; gap:8px; pointer-events:all; }
.ctrl-btn {
  width:62px; height:62px;
  background:rgba(0,0,0,0.55);
  border:2px solid rgba(255,255,255,0.2);
  border-radius:18px; backdrop-filter:blur(8px);
  font-size:1.5rem; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:transform 0.08s, background 0.1s;
  user-select:none;
  -webkit-user-select:none;
  color:#fff;
}
.ctrl-btn:active, .ctrl-btn.pressed {
  transform:scale(0.88);
  background:rgba(255,255,255,0.18);
}
.ctrl-btn.big { width:70px; height:70px; font-size:1.8rem; border-color:var(--gold); }
#btnBoostCtrl {
  width:100px; height:50px;
  border-radius:25px;
  font-size:0.85rem; font-weight:900;
  background:linear-gradient(135deg,#ff6600,#ffcc00);
  border-color:#ffcc00;
  box-shadow:0 0 15px rgba(255,150,0,0.4);
  color:#000;
}

/* ═══════════════ الشاشات ═══════════════ */
.screen {
  position:fixed; inset:0;
  z-index:50;
  display:flex; flex-direction:column;
  align-items:center; justify-content:flex-start;
  padding:20px;
  overflow-y:auto;
  background:transparent;
  transition:opacity 0.35s, transform 0.35s;
}
.screen.hidden { display:none !important; }
.screen:not(.hidden) { display:flex; }

/* ━━━ شاشة البداية ━━━ */
#screenStart {
  background:linear-gradient(180deg,#0d0020 0%,#1a0035 50%,#0a001a 100%);
}
.start-logo {
  margin-top:20px;
  font-size:3.5rem; font-weight:900;
  background:linear-gradient(135deg,#ffc200,#ff6600,#ff2244);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  text-shadow:none;
  filter:drop-shadow(0 0 20px rgba(255,150,0,0.6));
  line-height:1;
  animation: logoFloat 3s ease-in-out infinite;
}
@keyframes logoFloat {
  0%,100% { transform:translateY(0) rotate(-1deg); }
  50% { transform:translateY(-8px) rotate(1deg); }
}
.start-sub {
  font-size:0.9rem; color:rgba(255,255,255,0.5);
  margin-top:4px; letter-spacing:2px;
}
.start-stats {
  display:grid; grid-template-columns:1fr 1fr 1fr;
  gap:10px; width:100%; max-width:380px;
  margin:20px 0;
}
.stat-box {
  background:var(--panel);
  border:1px solid var(--border);
  border-radius:14px; padding:12px 8px;
  text-align:center;
}
.stat-box .sval { font-size:1.4rem; font-weight:900; color:var(--gold); }
.stat-box .slabel { font-size:0.6rem; color:rgba(255,255,255,0.45); margin-top:2px; }

.btn-main {
  width:100%; max-width:320px;
  padding:18px; border-radius:20px; border:none;
  font-family:'Cairo',sans-serif; font-size:1.3rem; font-weight:900;
  cursor:pointer; margin:6px 0;
  transition:transform 0.12s, box-shadow 0.12s;
  letter-spacing:1px;
}
.btn-main:active { transform:scale(0.95); }
.btn-play {
  background:linear-gradient(135deg,#ff4400,#ff9900,#ffcc00);
  color:#000;
  box-shadow:0 8px 30px rgba(255,150,0,0.5);
  font-size:1.6rem;
}
.btn-secondary {
  background:var(--panel);
  border:1.5px solid var(--border);
  color:#fff;
  backdrop-filter:blur(8px);
  font-size:1rem;
}

.menu-grid {
  display:grid; grid-template-columns:1fr 1fr;
  gap:10px; width:100%; max-width:360px;
}

/* ━━━ شاشات عامة ━━━ */
.screen-panel {
  background:rgba(10,0,20,0.92);
  border:1.5px solid var(--border);
  border-radius:24px;
  width:100%; max-width:400px;
  padding:20px;
  backdrop-filter:blur(20px);
  box-shadow:0 20px 60px rgba(0,0,0,0.8);
  margin-top:10px;
}
.panel-title {
  font-size:1.4rem; font-weight:900; color:var(--gold);
  text-align:center; margin-bottom:16px;
  padding-bottom:12px;
  border-bottom:1px solid var(--border);
}

/* شاشة الشخصيات */
#screenChar { background:linear-gradient(180deg,#001a30,#000820); }
.char-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
.char-card {
  background:var(--panel); border:2px solid var(--border);
  border-radius:16px; padding:12px 8px; text-align:center;
  cursor:pointer; transition:all 0.2s; position:relative;
  overflow:hidden;
}
.char-card:active { transform:scale(0.95); }
.char-card.selected { border-color:var(--gold); background:rgba(255,200,0,0.1); box-shadow:0 0 20px rgba(255,200,0,0.3); }
.char-card.locked { opacity:0.65; }
.char-card canvas { width:70px; height:80px; }
.char-card .cname { font-size:0.75rem; font-weight:700; color:#fff; margin-top:4px; }
.char-card .cability { font-size:0.55rem; color:rgba(255,255,255,0.5); margin-top:2px; }
.char-card .ccost { font-size:0.7rem; color:var(--gold); margin-top:4px; }
.selected-badge {
  position:absolute; top:4px; right:4px;
  background:var(--gold); color:#000;
  border-radius:8px; padding:1px 5px;
  font-size:0.5rem; font-weight:900;
}

/* شاشة المتجر */
#screenShop { background:linear-gradient(180deg,#001a10,#000810); }
.shop-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.shop-item {
  background:var(--panel); border:1.5px solid var(--border);
  border-radius:14px; padding:14px 10px; text-align:center;
  cursor:pointer; transition:all 0.2s;
}
.shop-item:active { transform:scale(0.96); }
.shop-item.owned { border-color:var(--green); background:rgba(0,255,100,0.07); }
.shop-item .sicon { font-size:2rem; }
.shop-item .sname { font-size:0.75rem; font-weight:700; color:#fff; margin-top:6px; }
.shop-item .sprice { font-size:0.8rem; color:var(--gold); font-weight:900; margin-top:4px; }
.shop-item.owned .sprice { color:var(--green); }
.shop-coins { text-align:center; margin-bottom:14px; font-size:1.1rem; color:var(--gold); font-weight:700; }

/* لوحة الأوائل */
#screenLeaders { background:linear-gradient(180deg,#1a1000,#0a0800); }
.leader-row {
  display:flex; align-items:center; gap:12px;
  padding:12px 10px; border-radius:12px;
  background:var(--panel); border:1px solid var(--border);
  margin-bottom:8px;
}
.leader-rank { font-size:1.4rem; }
.leader-info { flex:1; }
.leader-name { font-size:0.85rem; font-weight:700; color:#fff; }
.leader-sub { font-size:0.65rem; color:rgba(255,255,255,0.45); }
.leader-score { font-size:1.2rem; font-weight:900; color:var(--gold); }

/* شاشة الإعدادات */
#screenSettings { background:linear-gradient(180deg,#001020,#000810); }
.sett-row {
  display:flex; justify-content:space-between; align-items:center;
  padding:12px 0; border-bottom:1px solid var(--border);
}
.sett-label { font-size:0.9rem; color:rgba(255,255,255,0.8); }
.toggle-wrap { position:relative; width:48px; height:26px; }
.toggle-wrap input { opacity:0; width:0; height:0; }
.toggle-slider {
  position:absolute; inset:0;
  background:rgba(255,255,255,0.15); border-radius:13px;
  cursor:pointer; transition:0.3s;
}
.toggle-slider::before {
  content:''; position:absolute;
  width:20px; height:20px; left:3px; top:3px;
  background:#fff; border-radius:50%;
  transition:0.3s; box-shadow:0 2px 6px rgba(0,0,0,0.4);
}
input:checked+.toggle-slider { background:var(--gold); }
input:checked+.toggle-slider::before { transform:translateX(22px); background:#000; }
select.sett-select {
  background:rgba(255,255,255,0.1); border:1px solid var(--border);
  color:#fff; border-radius:8px; padding:4px 8px;
  font-family:'Cairo',sans-serif; font-size:0.8rem;
}

/* شاشة Game Over */
#screenOver { background:linear-gradient(180deg,#200010,#0a0005); }
#newRecord {
  font-size:1.5rem; font-weight:900; color:var(--gold);
  text-align:center; margin-bottom:8px;
  animation:pulse 0.8s ease-in-out infinite alternate;
}
@keyframes pulse { to { transform:scale(1.05); filter:brightness(1.3); } }
.stats-grid {
  display:grid; grid-template-columns:1fr 1fr;
  gap:8px; margin:12px 0;
}
.stat-row {
  background:var(--panel); border:1px solid var(--border);
  border-radius:10px; padding:10px;
  text-align:center;
}
.stat-row .sval { font-size:1.2rem; font-weight:900; color:var(--gold); }
.stat-row .slabel { font-size:0.6rem; color:rgba(255,255,255,0.45); }

#scoreChart {
  width:100%; height:70px;
  border-radius:10px; border:1px solid var(--border);
  background:rgba(0,0,0,0.3);
  margin:8px 0;
}

/* زر رجوع */
.back-btn {
  position:fixed; top:12px; right:14px;
  width:44px; height:44px;
  background:rgba(0,0,0,0.6); border:1.5px solid var(--border);
  border-radius:12px; font-size:1.1rem; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  color:#fff; backdrop-filter:blur(8px);
  z-index:60;
  transition:transform 0.1s;
}
.back-btn:active { transform:scale(0.9); }

/* الطقس */
#weatherOverlay {
  position:fixed; inset:0; pointer-events:none; z-index:15;
}

/* مؤشر مسار */
#laneIndicator {
  position:fixed; bottom:100px; left:50%;
  transform:translateX(-50%);
  display:flex; gap:8px; pointer-events:none; z-index:20;
}
.lane-dot {
  width:8px; height:8px; border-radius:50%;
  background:rgba(255,255,255,0.2);
  border:1px solid rgba(255,255,255,0.3);
  transition:all 0.2s;
}
.lane-dot.active { background:#fff; box-shadow:0 0 8px #fff; }

/* نفق / بوست تأثير */
#tunnelFx {
  position:fixed; inset:0; pointer-events:none; z-index:18;
  background:radial-gradient(ellipse at center,transparent 30%,rgba(100,0,200,0.4));
  opacity:0; transition:opacity 0.3s;
}
#tunnelFx.active { opacity:1; }

/* رسالة مرحبا */
#welcomeMsg {
  position:fixed; top:20%; left:50%;
  transform:translateX(-50%);
  background:rgba(0,0,0,0.8); border:2px solid var(--gold);
  border-radius:20px; padding:16px 28px;
  font-size:1.1rem; font-weight:700; color:var(--gold);
  z-index:55; pointer-events:none;
  animation:welcomeAnim 3s ease forwards;
}
@keyframes welcomeAnim {
  0% { opacity:0; transform:translateX(-50%) translateY(-20px); }
  20% { opacity:1; transform:translateX(-50%) translateY(0); }
  75% { opacity:1; }
  100% { opacity:0; transform:translateX(-50%) translateY(-30px); }
}
#welcomeMsg.hidden { display:none; }

/* صواريخ UI */
#rocketUI {
  position:fixed; top:90px; left:14px;
  pointer-events:none; z-index:20;
}
.rocket-count {
  font-size:1.2rem; font-weight:900; color:#ff8800;
  text-shadow:0 0 10px #ff8800;
}

/* شريط الحياة */
#livesBar {
  position:fixed; top:10px; left:50%;
  transform:translateX(-50%);
  display:flex; gap:5px;
  pointer-events:none; z-index:25;
}
.life-heart { font-size:1.3rem; filter:drop-shadow(0 0 5px red); }
.life-heart.lost { filter:grayscale(1) opacity(0.3); }

/* ══════════ animations ══════════ */
@keyframes shake {
  0%,100%{transform:translate(0,0);}
  20%{transform:translate(-6px,3px);}
  40%{transform:translate(5px,-4px);}
  60%{transform:translate(-4px,5px);}
  80%{transform:translate(4px,-2px);}
}
.shaking { animation:shake 0.35s ease; }

/* وميض التصادم */
#crashFlash {
  position:fixed; inset:0; background:rgba(255,0,0,0.5);
  pointer-events:none; z-index:100; opacity:0;
  transition:opacity 0.1s;
}
#crashFlash.on { opacity:1; }

/* ذكاء الطقس */
.rain-drop {
  position:absolute; width:2px;
  background:linear-gradient(180deg,transparent,rgba(100,150,255,0.6));
  animation:rainFall linear infinite;
}
@keyframes rainFall {
  from{top:-30px;} to{top:100vh;}
}
</style>
</head>
<body>

<canvas id="gc"></canvas>

<!-- HUD -->
<div id="hud" class="hidden">
  <div class="hud-top">
    <div class="hud-box">
      <div class="hud-label">نقاط</div>
      <div class="hud-val" id="hudScore">0</div>
    </div>
    <div class="hud-box" style="flex:1">
      <div class="hud-label" id="hudLvlName">القاهرة</div>
      <div style="display:flex;gap:4px;align-items:center;justify-content:center">
        <div class="hud-val gold" id="hudCoins">0</div>
        <span style="color:var(--gold);font-size:0.9rem">💰</span>
      </div>
    </div>
    <div class="hud-box">
      <div class="hud-label">سرعة</div>
      <div class="hud-val blue" id="hudSpeed">0</div>
    </div>
  </div>
  <div style="margin-top:6px;">
    <div id="boostBarWrap"><div id="boostBar"></div></div>
  </div>
</div>

<!-- حياة -->
<div id="livesBar" class="hidden">
  <div class="life-heart" id="h1">❤️</div>
  <div class="life-heart" id="h2">❤️</div>
  <div class="life-heart" id="h3">❤️</div>
</div>

<!-- بوستات نشطة -->
<div id="activePowers"></div>

<!-- رصاصات الصاروخ -->
<div id="rocketUI" class="hidden"><div class="rocket-count" id="rocketCount">🚀×0</div></div>

<!-- مؤشر مسار -->
<div id="laneIndicator" class="hidden">
  <div class="lane-dot" id="ld0"></div>
  <div class="lane-dot" id="ld1"></div>
  <div class="lane-dot" id="ld2"></div>
  <div class="lane-dot" id="ld3"></div>
  <div class="lane-dot" id="ld4"></div>
</div>

<!-- خطر الغيطي -->
<div id="dangerBar" class="hidden">
  <div class="danger-label">
    <span>🏃‍♂️ الغيطي</span>
    <span id="dangerText">بعيد</span>
  </div>
  <div class="danger-track"><div id="dangerFill"></div></div>
</div>

<!-- كومبو -->
<div id="comboDisplay">
  <span id="comboVal">0</span>×  كومبو!!
</div>

<!-- رسائل -->
<div id="hypeMsg"></div>
<div id="bigMoney"></div>
<div id="achieveToast"></div>
<div id="crashFlash"></div>
<div id="tunnelFx"></div>
<div id="welcomeMsg" class="hidden"></div>

<!-- أزرار تحكم -->
<div id="controls" class="hidden">
  <div class="ctrl-group">
    <button class="ctrl-btn" ontouchstart="ctrlDown('left')" ontouchend="ctrlUp('left')" onmousedown="ctrlDown('left')" onmouseup="ctrlUp('left')">◀</button>
    <button class="ctrl-btn" ontouchstart="ctrlDown('right')" ontouchend="ctrlUp('right')" onmousedown="ctrlDown('right')" onmouseup="ctrlUp('right')">▶</button>
  </div>
  <div class="ctrl-group">
    <button id="btnBoostCtrl" class="ctrl-btn" ontouchstart="ctrlDown('boost')" ontouchend="ctrlUp('boost')" onmousedown="ctrlDown('boost')">⚡ BOOST</button>
  </div>
  <div class="ctrl-group">
    <button class="ctrl-btn big" ontouchstart="ctrlDown('slide')" ontouchend="ctrlUp('slide')" onmousedown="ctrlDown('slide')">⬇</button>
    <button class="ctrl-btn big" ontouchstart="ctrlDown('jump')" ontouchend="ctrlUp('jump')" onmousedown="ctrlDown('jump')">⬆</button>
  </div>
</div>

<!-- ═══════════════════ شاشة البداية ═══════════════════ -->
<div id="screenStart" class="screen">
  <div class="start-logo">🚆 صابويه</div>
  <div class="start-sub">الترمس الهارب</div>

  <div class="start-stats">
    <div class="stat-box"><div class="sval" id="hsDisplay">0</div><div class="slabel">أعلى نقطة</div></div>
    <div class="stat-box"><div class="sval" id="totalCoinsDisplay">0</div><div class="slabel">💰 جنيه</div></div>
    <div class="stat-box"><div class="sval" id="attemptsDisplay">0</div><div class="slabel">محاولة</div></div>
  </div>

  <button class="btn-main btn-play" onclick="startGame()">🎮 العب دلوقتي!</button>

  <div class="menu-grid">
    <button class="btn-main btn-secondary" onclick="showScreen('screenChar')">👤 الشخصيات</button>
    <button class="btn-main btn-secondary" onclick="showScreen('screenShop');buildShop()">🛒 المتجر</button>
    <button class="btn-main btn-secondary" onclick="showScreen('screenLeaders');buildLeaders()">🏆 الأوائل</button>
    <button class="btn-main btn-secondary" onclick="showScreen('screenSettings');loadSettings()">⚙️ الإعدادات</button>
  </div>

  <div style="margin-top:12px;font-size:0.65rem;color:rgba(255,255,255,0.25);text-align:center">
    اسحب يمين/شمال للتحرك • أسفل للانزلاق • فوق للقفز
  </div>
</div>

<!-- ═══════════════════ شاشة الشخصيات ═══════════════════ -->
<div id="screenChar" class="screen hidden">
  <button class="back-btn" onclick="showScreen('screenStart')">✕</button>
  <div class="screen-panel" style="margin-top:40px">
    <div class="panel-title">👤 اختر شخصيتك</div>
    <div class="char-grid" id="charGrid"></div>
    <div style="margin-top:14px;text-align:center;font-size:0.7rem;color:rgba(255,255,255,0.4)">
      رصيدك: <span id="charCoinsVal" style="color:var(--gold);font-weight:700">0</span> 💰
    </div>
  </div>
</div>

<!-- ═══════════════════ شاشة المتجر ═══════════════════ -->
<div id="screenShop" class="screen hidden">
  <button class="back-btn" onclick="showScreen('screenStart')">✕</button>
  <div class="screen-panel" style="margin-top:40px">
    <div class="panel-title">🛒 المتجر</div>
    <div class="shop-coins">رصيدك: <span id="shopCoinsVal">0</span> 💰</div>
    <div class="shop-grid" id="shopGrid"></div>
  </div>
</div>

<!-- ═══════════════════ لوحة الأوائل ═══════════════════ -->
<div id="screenLeaders" class="screen hidden">
  <button class="back-btn" onclick="showScreen('screenStart')">✕</button>
  <div class="screen-panel" style="margin-top:40px">
    <div class="panel-title">🏆 لوحة الأوائل</div>
    <div id="leadersList"></div>
  </div>
</div>

<!-- ═══════════════════ شاشة الإعدادات ═══════════════════ -->
<div id="screenSettings" class="screen hidden">
  <button class="back-btn" onclick="showScreen('screenStart')">✕</button>
  <div class="screen-panel" style="margin-top:40px">
    <div class="panel-title">⚙️ الإعدادات</div>
    <div class="sett-row">
      <span class="sett-label">🎵 موسيقى</span>
      <label class="toggle-wrap"><input type="checkbox" id="settMusic" checked><div class="toggle-slider"></div></label>
    </div>
    <div class="sett-row">
      <span class="sett-label">🔊 مؤثرات صوتية</span>
      <label class="toggle-wrap"><input type="checkbox" id="settSfx" checked><div class="toggle-slider"></div></label>
    </div>
    <div class="sett-row">
      <span class="sett-label">📳 اهتزاز الشاشة</span>
      <label class="toggle-wrap"><input type="checkbox" id="settShake" checked><div class="toggle-slider"></div></label>
    </div>
    <div class="sett-row">
      <span class="sett-label">🎨 جودة الرسم</span>
      <select class="sett-select" id="settQuality">
        <option value="low">منخفض</option>
        <option value="med" selected>متوسط</option>
        <option value="high">عالي</option>
      </select>
    </div>
    <button class="btn-main btn-play" style="margin-top:16px;font-size:1rem;padding:14px" onclick="saveSettings();showScreen('screenStart')">✅ حفظ</button>
  </div>
</div>

<!-- ═══════════════════ شاشة Game Over ═══════════════════ -->
<div id="screenOver" class="screen hidden">
  <div class="screen-panel" style="margin-top:30px">
    <div id="newRecord" class="hidden">🏆 رقم قياسي جديد!</div>
    <div class="panel-title" style="margin-bottom:8px">انتهت اللعبة 😅</div>
    <canvas id="scoreChart"></canvas>
    <div class="stats-grid">
      <div class="stat-row"><div class="sval" id="ovScore">0</div><div class="slabel">نقطة</div></div>
      <div class="stat-row"><div class="sval" id="ovHS">0</div><div class="slabel">أعلى نقطة</div></div>
      <div class="stat-row"><div class="sval" id="ovCoins">0</div><div class="slabel">💰 جنيه</div></div>
      <div class="stat-row"><div class="sval" id="ovSpeed">0</div><div class="slabel">أقصى سرعة</div></div>
      <div class="stat-row"><div class="sval" id="ovTrains">0</div><div class="slabel">قطارات</div></div>
      <div class="stat-row"><div class="sval" id="ovTime">0s</div><div class="slabel">مدة اللعب</div></div>
    </div>
    <button class="btn-main btn-play" onclick="startGame()">🔄 مجدداً!</button>
    <button class="btn-main btn-secondary" onclick="showScreen('screenStart');updateStartStats()">🏠 الرئيسية</button>
  </div>
</div>

<script>
'use strict';

// ══════════════════════════════════════════════
//  ENGINE CORE
// ══════════════════════════════════════════════
const canvas = document.getElementById('gc');
const ctx = canvas.getContext('2d');
let W, H, SX, SY;
const BW = 480, BH = 854;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  W = canvas.width; H = canvas.height;
  SX = W / BW; SY = H / BH;
}
window.addEventListener('resize', resize);
resize();

// ══════════════════════════════════════════════
//  DATA & SAVE
// ══════════════════════════════════════════════
const SAVE_KEY = 'sabuyah_v5';

const LEVELS = [
  { name:'القاهرة',    sky:['#1a3a6a','#2a5a9a'], ground:'#c4813a', bgTint:'rgba(200,130,60,.06)', trainSpd:1.0 },
  { name:'الإسكندرية', sky:['#0d3355','#1a5580'], ground:'#5588bb', bgTint:'rgba(70,140,200,.06)', trainSpd:1.2 },
  { name:'الأقصر',    sky:['#8b3a00','#d06010'], ground:'#e8a030', bgTint:'rgba(240,150,40,.08)', trainSpd:1.5 },
  { name:'الغردقة',   sky:['#003355','#005588'], ground:'#22aacc', bgTint:'rgba(30,170,210,.07)', trainSpd:1.8 },
  { name:'الفضاء!',   sky:['#020008','#080020'], ground:'#220044', bgTint:'rgba(100,0,200,.08)', trainSpd:2.2 },
];

const CHARS = [
  { id:'sabuyah', name:'صابويه',  ability:'⚡ سرعة أعلى ×1.2', cost:0,   skin:'#f4a460', shirt:'#2244cc', pants:'#1a1a3a', cap:'#cc2200', desc:'البطل الأصلي' },
  { id:'hammad',  name:'حمادة',   ability:'🛡️ يمتص ضربة كل 30ث', cost:500, skin:'#8b5e3c', shirt:'#336633', pants:'#2a1a0a', cap:'#225500', desc:'الضارب الحديدي' },
  { id:'awatef',  name:'عواطف',   ability:'💰 عملات ×1.5',       cost:800, skin:'#ffb3a0', shirt:'#cc4488', pants:'#660044', cap:'#ff6699', desc:'ملكة الجنيه' },
  { id:'abdo',    name:'عبده',    ability:'🧲 مغناطيس دائم',      cost:1200,skin:'#d4956a', shirt:'#884400', pants:'#442200', cap:'#ff8800', desc:'جامع الفلوس' },
  { id:'fahim',   name:'فهيم',    ability:'🚀 صاروخ إضافي',      cost:1500,skin:'#c4a0d4', shirt:'#663388', pants:'#221133', cap:'#9933cc', desc:'الصاروخجي' },
];

const SHOP = [
  { id:'x2boost',    name:'بوست مزدوج',   icon:'⚡', price:300, type:'boost' },
  { id:'magnet_plus',name:'مغناطيس قوي',   icon:'🧲', price:400, type:'boost' },
  { id:'shield3',    name:'درع ثلاثي',     icon:'🛡️', price:500, type:'boost' },
  { id:'rocket2',    name:'صاروخان',       icon:'🚀', price:250, type:'boost' },
  { id:'coin_rain',  name:'مطر الجنيه',    icon:'💰', price:600, type:'boost' },
  { id:'ghost_mode', name:'وضع الشبح',     icon:'👻', price:700, type:'boost' },
  { id:'hoverboard', name:'سكيت بورد',     icon:'🛹', price:1000,type:'board' },
  { id:'jetpack',    name:'طائرة صغيرة',   icon:'🎒', price:1500,type:'board' },
  { id:'cap_gold',   name:'طاقية ذهبية',   icon:'👑', price:350, type:'skin' },
  { id:'wing_run',   name:'جناح الطيار',   icon:'🦅', price:800, type:'skin' },
];

let DB = {
  highScore:0, totalCoins:0, attempts:0,
  selectedChar:'sabuyah', ownedChars:['sabuyah'],
  ownedItems:[], equippedBoard:'none',
  leaderboard:[],
  dailyMissions:[],
  settings:{ music:true, sfx:true, shake:true, quality:'med' },
};

function loadDB() { try { const s=localStorage.getItem(SAVE_KEY); if(s) DB={...DB,...JSON.parse(s)}; } catch(e){} }
function saveDB() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(DB)); } catch(e){} }
loadDB();

// ══════════════════════════════════════════════
//  GAME STATE
// ══════════════════════════════════════════════
const LANE_CNT = 5;
const LANE_W = BW / LANE_CNT;
const LANES = Array.from({length:LANE_CNT},(_,i)=>LANE_W*i+LANE_W/2);
const GY = BH * 0.78; // ground Y
const TT = BH * 0.30; // track top

let G = {};

function resetG() {
  G = {
    running:false, paused:false, dead:false,
    score:0, coins:0, combo:0, comboTimer:0,
    speed:5.5, maxSpeed:0, level:0, frame:0,
    startTime:0, scoreHist:[],
    // player
    lane:2, targetLane:2, px:LANES[2], py:GY,
    jumping:false, jumpVY:0, sliding:false, slideTimer:0,
    doubleJumpUsed:false,
    invincible:0, lives:3,
    // board/powerup
    boardActive:false, boardType:'none',
    boardTimer:0, boardHitCount:0,
    // boosts
    boostMeter:0, boosting:false, boostTimer:0,
    powers:{}, // { type: framesLeft }
    rocketAmmo:0,
    hamadCD:0, abdoMagnet:false,
    // enemy
    enemyDist:1000, enemyLane:2, enemyY:GY,
    enemyJump:false, enemyJumpVY:0,
    enemySlide:false, enemyVisible:false,
    enemyWhistle:0, enemyAnger:0,
    enemyTrip:false, enemyTripTimer:0,
    // world
    nightMode:false, dayTimer:0,
    weather:'clear', weatherTimer:0,
    // parallax
    bldX:Array.from({length:14},(_,i)=>i*80-60),
    bldH:Array.from({length:14},()=>70+Math.random()*130),
    bldColor:Array.from({length:14},()=>`hsl(${200+Math.random()*40},${15+Math.random()*20}%,${10+Math.random()*15}%)`),
    clouds:Array.from({length:7},(_,i)=>({x:i*80,y:25+Math.random()*50,w:50+Math.random()*40,speed:0.3+Math.random()*0.3})),
    stars:Array.from({length:120},()=>({x:Math.random()*BW,y:Math.random()*BH*0.6,s:0.5+Math.random()*2,t:Math.random()*Math.PI*2})),
    // obstacles / items
    obstacles:[], coins:[], powerups:[], particles:[], scoreTexts:[],
    // spawn timers
    spawnT:2, coinT:1, powerT:10, weatherT:30,
    // camera
    shakeAmt:0,
    // trains passed
    trainsPassed:0,
    // score multiplier from coin_rain
    coinRainTimer:0,
    // drone
    droneActive:false, droneX:0, droneY:0,
    // ghost powerup
    ghostModeTimer:0,
    // magnet range
    magnetRange:0,
  };
}

// ══════════════════════════════════════════════
//  AUDIO
// ══════════════════════════════════════════════
let AC, musicLoop=null;
function initAudio() { if(!AC) AC=new(window.AudioContext||window.webkitAudioContext)(); }
function resumeAC() { if(AC&&AC.state==='suspended') AC.resume(); }

function tone(f,d,v=0.25,type='sine',delay=0) {
  if(!AC||!DB.settings.sfx) return;
  const t=AC.currentTime+delay;
  const o=AC.createOscillator(), g=AC.createGain();
  o.type=type; o.frequency.value=f;
  g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(0.001,t+d);
  o.connect(g); g.connect(AC.destination);
  o.start(t); o.stop(t+d+0.02);
}
function noise(d,v=0.2,delay=0) {
  if(!AC||!DB.settings.sfx) return;
  const t=AC.currentTime+delay;
  const sz=Math.ceil(AC.sampleRate*d);
  const buf=AC.createBuffer(1,sz,AC.sampleRate);
  const dt=buf.getChannelData(0);
  for(let i=0;i<sz;i++) dt[i]=(Math.random()*2-1)*(1-i/sz);
  const s=AC.createBufferSource(), g=AC.createGain();
  s.buffer=buf; g.gain.value=v;
  s.connect(g); g.connect(AC.destination);
  s.start(t); s.stop(t+d+0.02);
}

const SFX = {
  jump(){ tone(300,0.07,0.2,'square'); tone(500,0.12,0.1,'sine',0,0.05); },
  land(){ tone(70,0.09,0.15,'triangle'); noise(0.04,0.05); },
  coin(){ tone(880,0.07,0.2,'sine'); tone(1320,0.1,0.12,'sine',0,0.06); },
  bigCoin(){ [880,1108,1320,1760].forEach((f,i)=>tone(f,0.13,0.28,'sine',0,i*0.06)); },
  crash(){ noise(0.5,0.5); tone(80,0.35,0.4,'sawtooth'); },
  boost(){ [300,450,700,1000].forEach((f,i)=>tone(f,0.15,0.22,'sawtooth',0,i*0.06)); },
  powerup(){ [500,700,1000,1400].forEach((f,i)=>tone(f,0.13,0.22,'sine',0,i*0.07)); },
  whistle(){ tone(900,0.1,0.22,'sine'); tone(700,0.3,0.15,'sine',0,0.1); },
  trainHorn(){ tone(180,0.5,0.3,'sawtooth'); tone(140,0.55,0.25,'sawtooth',0,0.05); },
  slide(){ noise(0.15,0.12); tone(180,0.1,0.08,'sawtooth'); },
  levelUp(){ [523,659,784,1046,1318].forEach((f,i)=>tone(f,0.2,0.3,'sine',0,i*0.1)); },
  rocket(){ tone(400,0.06,0.35,'sawtooth'); noise(0.25,0.2,0.06); tone(200,0.3,0.2,'sawtooth',0,0.06); },
  enemyNear(){ tone(600,0.06,0.18,'square'); tone(400,0.1,0.12,'square',0,0.08); },
  hit(){ tone(200,0.1,0.3,'sawtooth'); noise(0.15,0.25); },
  doubleJump(){ tone(440,0.06,0.18,'square'); tone(660,0.1,0.15,'sine',0,0.05); },
  boardRevive(){ [400,600,800].forEach((f,i)=>tone(f,0.12,0.2,'sine',0,i*0.08)); },
  comboHigh(){ tone(1200,0.06,0.15,'sine'); tone(1800,0.1,0.1,'sine',0,0.05); },
};

function scheduleMusic() {
  if(!AC||!DB.settings.music||!G.running) return;
  const bpm=Math.min(200,135+G.speed*2);
  const bt=60/bpm;
  const t=AC.currentTime+0.05;
  // kick
  [0,bt*2,bt*3.5].forEach(k=>{
    const o=AC.createOscillator(),g=AC.createGain();
    o.type='sine';
    o.frequency.setValueAtTime(160,t+k);
    o.frequency.exponentialRampToValueAtTime(28,t+k+0.09);
    g.gain.setValueAtTime(0.45,t+k);
    g.gain.exponentialRampToValueAtTime(0.001,t+k+0.1);
    o.connect(g);g.connect(AC.destination);
    o.start(t+k);o.stop(t+k+0.12);
  });
  // snare
  [bt,bt*3].forEach(k=>noise(0.08,0.2,k));
  // hihat
  for(let i=0;i<16;i++) noise(0.03,0.04+i%2*0.02,i*bt*0.5);
  // bass melody
  const mel=[130,130,146,130,116,130,155,130];
  mel.forEach((f,i)=>{
    const o=AC.createOscillator(),g=AC.createGain();
    o.type='sawtooth';o.frequency.value=f;
    g.gain.setValueAtTime(0.14,t+i*bt*0.5);
    g.gain.exponentialRampToValueAtTime(0.001,t+i*bt*0.5+bt*0.48);
    o.connect(g);g.connect(AC.destination);
    o.start(t+i*bt*0.5);o.stop(t+i*bt*0.5+bt*0.5);
  });
  // lead melody (شعبي)
  if(G.score>300){
    const lead=[523,587,659,523,493,440,523,0];
    lead.forEach((f,i)=>{
      if(!f) return;
      const o=AC.createOscillator(),g=AC.createGain();
      o.type='triangle';o.frequency.value=f;
      g.gain.setValueAtTime(0.08,t+i*bt*0.5);
      g.gain.exponentialRampToValueAtTime(0.001,t+i*bt*0.5+bt*0.44);
      o.connect(g);g.connect(AC.destination);
      o.start(t+i*bt*0.5);o.stop(t+i*bt*0.5+bt*0.5);
    });
  }
  const barLen=bt*8;
  musicLoop=setTimeout(scheduleMusic,(barLen-0.12)*1000);
}
function startMusic(){ resumeAC(); scheduleMusic(); }
function stopMusic(){ if(musicLoop) clearTimeout(musicLoop); musicLoop=null; }

// ══════════════════════════════════════════════
//  DRAW HELPERS
// ══════════════════════════════════════════════
function sx(x){return x*SX;} function sy(y){return y*SY;}
function fr(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(sx(x),sy(y),Math.max(1,sx(w)),Math.max(1,sy(h)));}
function cr(x,y,r2,c){ctx.fillStyle=c;ctx.beginPath();ctx.arc(sx(x),sy(y),Math.max(1,r2*Math.min(SX,SY)),0,Math.PI*2);ctx.fill();}
function rr(x,y,w,h,r,c){ctx.fillStyle=c;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(sx(x),sy(y),sx(w),sy(h),r*Math.min(SX,SY));else{ctx.rect(sx(x),sy(y),sx(w),sy(h));}ctx.fill();}
function txt(t,x,y,sz,c,al='center',b=true){
  ctx.save();ctx.fillStyle=c;
  ctx.font=`${b?'900':'400'} ${sy(sz)}px Cairo,sans-serif`;
  ctx.textAlign=al;ctx.textBaseline='middle';
  ctx.fillText(t,sx(x),sy(y));ctx.restore();
}

// ══════════════════════════════════════════════
//  BACKGROUND
// ══════════════════════════════════════════════
function drawBG() {
  const lv=LEVELS[G.level];
  const [s1,s2]=G.nightMode?['#020010','#050020']:lv.sky;

  // سماء
  const sg=ctx.createLinearGradient(0,0,0,sy(TT+30));
  sg.addColorStop(0,s1); sg.addColorStop(1,s2);
  ctx.fillStyle=sg; ctx.fillRect(0,0,W,sy(TT+30));

  // نجوم ليلية
  if(G.nightMode||G.level===4){
    G.stars.forEach(s=>{
      const a=0.3+Math.sin(s.t+G.frame*0.02)*0.4;
      ctx.globalAlpha=a; ctx.fillStyle='#ffffff';
      ctx.beginPath(); ctx.arc(sx(s.x),sy(s.y),s.s*Math.min(SX,SY),0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha=1;
  }

  // سحاب
  G.clouds.forEach(cl=>{
    const ca=G.nightMode?0.25:0.65;
    ctx.globalAlpha=ca;
    ctx.fillStyle=G.nightMode?'#334466':'#ffffff';
    [-15,0,15,-8,8].forEach((dx,j)=>{
      const r=(12+j*3)*Math.min(SX,SY);
      ctx.beginPath();ctx.arc(sx(cl.x+dx),sy(cl.y+j*2),r,0,Math.PI*2);ctx.fill();
    });
    ctx.globalAlpha=1;
  });

  // مباني
  G.bldX.forEach((bx,i)=>{
    const bh=G.bldH[i];
    const by=GY-bh;
    fr(bx,by,58,bh,G.bldColor[i]);
    // نوافذ
    const winC=G.nightMode?'rgba(255,220,100,0.85)':'rgba(200,220,255,0.25)';
    for(let wy=by+6;wy<GY-8;wy+=14){
      for(let wx=bx+5;wx<bx+53;wx+=12){
        if((i+Math.floor(wx)+Math.floor(wy))%3!==0||G.nightMode) fr(wx,wy,8,8,winC);
      }
    }
    // سطح
    fr(bx-2,by,62,4,G.nightMode?'#334':'#556');
    // هوائي
    fr(bx+25,by-18,2,18,'#888');
    fr(bx+20,by-20,14,2,'#666');
  });

  // أرض
  const gg=ctx.createLinearGradient(0,sy(GY),0,H);
  gg.addColorStop(0,lv.ground); gg.addColorStop(1,G.nightMode?'#111':'#7a5020');
  ctx.fillStyle=gg; ctx.fillRect(0,sy(GY),W,H-sy(GY));

  // مسارات
  LANES.forEach(lx=>{
    fr(lx-1.5,TT,3,GY-TT,G.nightMode?'#444':'#666');
  });

  // نعالات (sleepers)
  const slp=16;
  const sloff=(G.frame*G.speed*0.9)%slp;
  for(let y=TT+sloff;y<BH;y+=slp){
    fr(6,y,BW-12,3.5,G.nightMode?'#1e140a':'#4a2d10');
  }

  // تأثير بيئة
  ctx.fillStyle=lv.bgTint; ctx.fillRect(0,0,W,H);

  // طقس
  drawWeather();
}

function drawWeather(){
  if(G.weather==='rain'){
    ctx.strokeStyle='rgba(100,150,255,0.35)';
    ctx.lineWidth=1.2;
    for(let i=0;i<50;i++){
      const rx=((i*179+G.frame*9)%BW);
      const ry=((i*83+G.frame*17)%BH);
      ctx.beginPath();ctx.moveTo(sx(rx),sy(ry));ctx.lineTo(sx(rx-4),sy(ry+14));ctx.stroke();
    }
    // سطح تحت المطر
    ctx.fillStyle='rgba(100,150,255,0.06)';ctx.fillRect(0,0,W,H);
  } else if(G.weather==='dust'){
    ctx.fillStyle='rgba(200,150,80,0.14)';ctx.fillRect(0,0,W,H);
    for(let i=0;i<25;i++){
      const dx=((i*193+G.frame*4)%BW);
      const dy=((i*107+G.frame*2)%BH);
      cr(dx,dy,4+i%6,'rgba(200,160,100,0.15)');
    }
  } else if(G.weather==='fog'){
    const fg=ctx.createLinearGradient(0,0,0,sy(GY));
    fg.addColorStop(0,'rgba(200,210,220,0)');
    fg.addColorStop(1,'rgba(200,210,220,0.25)');
    ctx.fillStyle=fg;ctx.fillRect(0,0,W,H);
  } else if(G.weather==='snow'){
    ctx.fillStyle='rgba(255,255,255,0.7)';
    for(let i=0;i<40;i++){
      const sx2=((i*173+G.frame*2)%BW);
      const sy2=((i*97+G.frame*4)%BH);
      cr(sx2,sy2,1.5+i%3,'rgba(255,255,255,0.6)');
    }
  }
}

// ══════════════════════════════════════════════
//  PLAYER DRAW
// ══════════════════════════════════════════════
function drawPlayer(){
  const char=CHARS.find(c=>c.id===DB.selectedChar)||CHARS[0];
  const x=G.px, y=G.py, f=G.frame;

  ctx.save();
  if(G.invincible>0&&Math.floor(G.invincible/4)%2===0) ctx.globalAlpha=0.4;

  // ظل
  if(!G.boardActive){
    const sha=0.22*(1-Math.max(0,(GY-y)/90));
    ctx.globalAlpha*=sha;
    ctx.fillStyle='#000';
    ctx.beginPath();ctx.ellipse(sx(x),sy(GY+5),sx(15),sy(5),0,0,Math.PI*2);ctx.fill();
    ctx.globalAlpha=(G.invincible>0&&Math.floor(G.invincible/4)%2===0)?0.4:1;
  }

  // ghost mode
  if(G.powers.ghost>0){
    ctx.globalAlpha*=0.5;
    ctx.shadowColor='#aaaaff';ctx.shadowBlur=sy(20);
  }

  if(G.sliding) { drawSlide(x,y,char); }
  else { drawRun(x,y,char,f); }

  // السكيت بورد
  if(G.boardActive) drawBoard(x,y);

  // درع
  if(G.powers.shield3){
    ctx.strokeStyle=`rgba(100,200,255,${0.5+Math.sin(f*0.2)*0.3})`;
    ctx.lineWidth=2.5*Math.min(SX,SY);
    ctx.beginPath();ctx.arc(sx(x),sy(y-18),sx(24),0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=`rgba(100,200,255,${0.2+Math.sin(f*0.15)*0.2})`;
    ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(sx(x),sy(y-18),sx(28),0,Math.PI*2);ctx.stroke();
  }

  // مغناطيس دائرة
  if(G.powers.magnet||G.abdoMagnet){
    ctx.strokeStyle='rgba(255,100,255,0.4)';
    ctx.lineWidth=1.5*Math.min(SX,SY);
    ctx.setLineDash([4,5]);
    ctx.beginPath();ctx.arc(sx(x),sy(y-18),sx(70),0,Math.PI*2);ctx.stroke();
    ctx.setLineDash([]);
  }

  // بوست تأثير
  if(G.boosting){
    // خطوط سرعة
    for(let i=0;i<16;i++){
      const lx=((i*37+G.frame*25)%BW);
      fr(lx,TT+Math.random()*220,70+Math.random()*90,2,`rgba(255,220,0,${0.08+Math.random()*0.12})`);
    }
  }

  ctx.restore();
}

function drawRun(x,y,char,f){
  const bob=Math.sin(f*0.28);
  const legL=bob*10, legR=-bob*10;
  const armL=-bob*8, armR=bob*8;

  if(G.jumping){
    // جسم
    drawBody(x,y-2,char);
    // رجلان مطوية
    ctx.save();ctx.translate(sx(x-5),sy(y+10));ctx.rotate(0.45);fr(-3,-10,6,22,char.pants);fr(-4,20,8,5,'#222');ctx.restore();
    ctx.save();ctx.translate(sx(x+5),sy(y+10));ctx.rotate(-0.45);fr(-3,-10,6,22,char.pants);fr(-4,20,8,5,'#222');ctx.restore();
    drawArms(x,y,char,-0.8,0.8);
  } else {
    // رجلان
    ctx.save();ctx.translate(sx(x-5),sy(y+8));ctx.rotate(legL*0.028);fr(-3,0,6,20,char.pants);fr(-4,18,8,5,'#222');ctx.restore();
    ctx.save();ctx.translate(sx(x+5),sy(y+8));ctx.rotate(legR*0.028);fr(-3,0,6,20,char.pants);fr(-4,18,8,5,'#222');ctx.restore();
    drawBody(x,y,char);
    drawArms(x,y,char,armL*0.03,armR*0.03);
  }

  const blink=Math.floor(f/200)%7===0&&f%5<2;
  drawFace(x,y-34,char,blink);
}

function drawBody(x,y,char){
  fr(x-10,y-30,20,28,char.shirt);
  fr(x-2,y-26,4,14,'rgba(0,0,0,.2)');
  // ياقة
  fr(x-8,y-32,16,4,'rgba(255,255,255,.15)');
}
function drawArms(x,y,char,al,ar){
  ctx.save();ctx.translate(sx(x-10),sy(y-22));ctx.rotate(al);fr(-4,0,7,17,char.skin);ctx.restore();
  ctx.save();ctx.translate(sx(x+10),sy(y-22));ctx.rotate(ar);fr(-3,0,7,17,char.skin);ctx.restore();
}
function drawFace(x,y,char,blink){
  fr(x-9,y-12,18,20,char.skin);
  fr(x-10,y-22,20,12,char.cap);
  fr(x-11,y-11,22,3,char.cap);
  fr(x-12,y-24,24,4,'rgba(0,0,0,.3)');
  if(!blink){
    fr(x-7,y-7,4,4,'#111');fr(x+2,y-7,4,4,'#111');
    fr(x-8,y-8,3,3,'#fff');fr(x+1,y-8,3,3,'#fff');
    cr(x-5,y-6,1,'#fff');cr(x+4,y-6,1,'#fff');
  } else {
    fr(x-8,y-5,6,2,'#111');fr(x+1,y-5,6,2,'#111');
  }
  ctx.strokeStyle='#882200';ctx.lineWidth=1.5*Math.min(SX,SY);
  ctx.beginPath();ctx.arc(sx(x),sy(y-1),sx(3),0.2,Math.PI-0.2);ctx.stroke();
}
function drawSlide(x,y,char){
  ctx.save();ctx.translate(sx(x),sy(GY-9));ctx.rotate(-0.25);
  fr(-18,-6,36,13,char.shirt);
  fr(12,-14,15,14,char.skin);
  fr(11,-22,17,10,char.cap);
  fr(11,-13,15,3,char.cap);
  fr(18,-11,4,4,'#111');
  ctx.restore();
}
function drawBoard(x,y){
  const by=GY+4;
  // لوح
  rr(x-20,by-6,40,10,4,'#ff6600');
  fr(x-18,by-4,36,6,'rgba(255,255,255,0.15)');
  // عجلات
  cr(x-13,by+5,5,'#222');cr(x+13,by+5,5,'#222');
  cr(x-13,by+5,3,'#555');cr(x+13,by+5,3,'#555');
  // جسيمات لوح
  if(G.frame%3===0) addP({x:x+(Math.random()-0.5)*30,y:GY+8,vx:(Math.random()-0.5)*1.5,vy:-0.5,life:0.4,r:2,color:'rgba(255,150,0,0.5)'});
}

// ══════════════════════════════════════════════
//  ENEMY (الغيطي)
// ══════════════════════════════════════════════
function drawEnemy(){
  if(!G.enemyVisible) return;
  const ex=LANES[G.enemyLane], ey=G.enemyY, f=G.frame;
  const alpha=Math.min(1,(1-G.enemyDist/900)*1.5);
  if(alpha<0.05) return;

  ctx.save();
  ctx.globalAlpha=Math.max(0,Math.min(1,alpha));

  // تأثير غضب
  if(G.enemyAnger>0){
    ctx.shadowColor='#ff0000';
    ctx.shadowBlur=sy(15+Math.sin(f*0.3)*8);
  }

  // عثرة
  if(G.enemyTrip){
    ctx.translate(sx(ex),sy(ey));ctx.rotate(0.4);
    fr(-10,-25,20,30,'#8B0000');
    ctx.restore();return;
  }

  if(G.enemySlide){
    ctx.translate(sx(ex),sy(GY-9));ctx.rotate(-0.25);
    fr(-18,-6,36,13,'#8B0000');
    fr(12,-14,15,14,'#6b3515');
    fr(11,-22,17,10,'#550000');
    ctx.restore();return;
  }

  const bob=Math.sin(f*0.32);
  const ll=bob*10,lr=-bob*10;

  // رجلان
  ctx.save();ctx.translate(sx(ex-5),sy(ey+8));ctx.rotate(ll*0.028);
  fr(-3,0,6,20,'#330000');fr(-4,18,8,5,'#111');ctx.restore();
  ctx.save();ctx.translate(sx(ex+5),sy(ey+8));ctx.rotate(lr*0.028);
  fr(-3,0,6,20,'#330000');fr(-4,18,8,5,'#111');ctx.restore();

  // جسم
  fr(ex-10,ey-30,20,28,'#8B0000');
  fr(ex-2,ey-26,4,14,'rgba(0,0,0,.3)');

  // أذرع
  ctx.save();ctx.translate(sx(ex-10),sy(ey-22));ctx.rotate(-bob*0.03);fr(-4,0,7,17,'#6b3515');ctx.restore();
  ctx.save();ctx.translate(sx(ex+10),sy(ey-22));ctx.rotate(bob*0.03);fr(-3,0,7,17,'#6b3515');ctx.restore();

  // رأس
  fr(ex-9,ey-46,18,20,'#6b3515');
  fr(ex-10,ey-56,20,12,'#550000');
  fr(ex-11,ey-45,22,3,'#550000');

  // كمامة + عيون غضب
  fr(ex-8,ey-40,16,7,'#222');
  fr(ex-7,ey-48,6,4,'#ff2200');fr(ex+1,ey-48,6,4,'#ff2200');

  // تهديد قريب
  if(G.enemyDist<180){
    const p=Math.sin(f*0.3)*0.4+0.6;
    ctx.save();ctx.globalAlpha=p;
    txt('⚠️',ex,ey-68,16,'#ff2200');ctx.restore();
  }

  ctx.restore();

  // ظل
  const sha=Math.max(0,0.2*(1-G.enemyDist/500));
  ctx.globalAlpha=sha;ctx.fillStyle='#000';
  ctx.beginPath();ctx.ellipse(sx(ex),sy(GY+5),sx(15),sy(5),0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=1;
}

// ══════════════════════════════════════════════
//  OBSTACLES DRAW
// ══════════════════════════════════════════════
function drawObstacles(){
  G.obstacles.forEach(ob=>{
    if(ob.y<TT-80||ob.y>BH+100) return;
    ctx.save();
    if(ob.ghost){ctx.globalAlpha=0.3+Math.sin(G.frame*0.1)*0.15;ctx.shadowColor='#aaaaff';ctx.shadowBlur=sy(18);}
    switch(ob.type){
      case 'train': drawTrain(ob); break;
      case 'car': drawCar(ob); break;
      case 'camel': drawCamel(ob); break;
      case 'barrier': drawBarrier(ob); break;
      case 'wire': drawWire(ob); break;
      case 'pit': drawPit(ob); break;
      case 'helicopter': drawHeli(ob); break;
      case 'truck': drawTruck(ob); break;
      case 'police': drawPolice(ob); break;
      case 'roadblock': drawRoadblock(ob); break;
    }
    ctx.restore();
  });
}

function drawTrain(ob){
  const {x,y,carCount,color,sparks,stopped}=ob;
  for(let c=0;c<carCount;c++){
    const cy=y-c*65;
    const col=c===0?color:`hsl(${parseInt(color.replace('#',''),16)%360},40%,${25+c*4}%)`;
    rr(x-14,cy-30,28,58,3,col);
    rr(x-11,cy-26,22,50,2,'rgba(255,255,255,0.07)');

    // نوافذ
    const wc=G.nightMode?'rgba(255,220,100,.9)':'rgba(180,220,255,.7)';
    [cy-20,cy-6,cy+9].forEach(wy=>{
      fr(x-9,wy,8,10,wc);fr(x+1,wy,8,10,wc);
    });

    // عجلات
    const rot=G.frame*0.16;
    [-16,16].forEach(dx=>{
      cr(x+dx,cy+26,7.5,'#1a1a1a');cr(x+dx,cy+26,5,'#444');
      ctx.save();ctx.translate(sx(x+dx),sy(cy+26));ctx.rotate(rot);
      ctx.strokeStyle='#777';ctx.lineWidth=1.5*Math.min(SX,SY);
      ctx.beginPath();ctx.moveTo(0,-sy(4.5));ctx.lineTo(0,sy(4.5));ctx.stroke();
      ctx.beginPath();ctx.moveTo(-sx(4.5),0);ctx.lineTo(sx(4.5),0);ctx.stroke();
      ctx.restore();
    });

    // شرر
    if(sparks&&c===0){
      for(let s=0;s<6;s++){
        const spx=x+(Math.random()-0.5)*30,spy=cy+22+Math.random()*8;
        cr(spx,spy,1+Math.random()*2,`rgba(255,${130+Math.random()*120},0,${Math.random()*0.9})`);
      }
    }
  }

  // مقدمة
  const ty=y-carCount*65+65-10;
  rr(x-14,ty-10,28,14,2,'#222');
  cr(x,ty-16,5,'#444');

  // مصابيح
  if(G.nightMode||G.frame%20<10){
    ctx.save();ctx.shadowColor='#ffffaa';ctx.shadowBlur=sy(14);
    cr(x-9,y-28,4.5,'#ffffcc');cr(x+9,y-28,4.5,'#ffffcc');
    ctx.restore();
  }
  if(stopped){rr(x-10,y-55,20,14,3,'#ff2200');txt('STOP',x,y-49,7,'#fff');}
}

function drawCar(ob){
  const {x,y,color}=ob;
  rr(x-16,y-14,32,20,4,color||'#ccaa22');
  rr(x-12,y-26,24,14,4,color||'#ccaa22');
  fr(x-9,y-24,10,9,'rgba(140,200,255,0.7)');fr(x+1,y-24,10,9,'rgba(140,200,255,0.7)');
  cr(x-11,y+7,5.5,'#1a1a1a');cr(x+11,y+7,5.5,'#1a1a1a');
  cr(x-11,y+7,3.5,'#444');cr(x+11,y+7,3.5,'#444');
  cr(x-14,y-8,3,'#ffffcc');cr(x+14,y-8,3,'#ff4400');
}

function drawTruck(ob){
  const {x,y}=ob;
  rr(x-18,y-36,36,50,3,'#cc6600');rr(x-14,y-20,28,32,2,'rgba(255,255,255,0.06)');
  rr(x-16,y-56,32,22,3,'#aa5500');fr(x-11,y-52,22,14,'rgba(140,200,255,0.5)');
  cr(x-14,y+16,7,'#111');cr(x+14,y+16,7,'#111');cr(x-14,y+16,4,'#444');cr(x+14,y+16,4,'#444');
  cr(x-16,y-28,3,'#ffffcc');cr(x+16,y-28,3,'#ff4400');
}

function drawPolice(ob){
  const {x,y}=ob;
  rr(x-16,y-14,32,20,4,'#ffffff');rr(x-12,y-26,24,14,4,'#ffffff');
  fr(x-13,y-16,26,8,'#1133ff');
  fr(x-9,y-24,10,9,'rgba(140,200,255,0.7)');fr(x+1,y-24,10,9,'rgba(140,200,255,0.7)');
  // ضوء شرطة وامض
  const lc=G.frame%20<10?'#ff0000':'#0000ff';
  cr(x-5,y-30,4,lc);cr(x+5,y-30,4,lc);
  cr(x-11,y+7,5.5,'#1a1a1a');cr(x+11,y+7,5.5,'#1a1a1a');
}

function drawCamel(ob){
  const {x,y}=ob;
  const bob=Math.sin(G.frame*0.1)*2;
  fr(x-15,y-16+bob,30,16,'#c4a363');fr(x-5,y-30+bob,12,16,'#c4a363');fr(x-9,y-38+bob,18,12,'#c4a363');
  fr(x+2,y-24+bob,10,10,'#c8aa70');
  const la=Math.sin(G.frame*0.12)*0.28;
  [-12,-3,5,14].forEach((dx,i)=>{
    ctx.save();ctx.translate(sx(x+dx),sy(y));ctx.rotate(i%2===0?la:-la);fr(-2,0,4,13,'#b8936a');ctx.restore();
  });
  fr(x-6,y-35+bob,3,3,'#111');fr(x+4,y-35+bob,3,3,'#111');
}

function drawBarrier(ob){
  const {x,y}=ob;
  fr(x-16,y-22,3,22,'#ffcc00');fr(x+13,y-22,3,22,'#ffcc00');
  fr(x-16,y-20,32,5,'#ff2200');fr(x-16,y-11,32,5,'#cc2200');
  ctx.strokeStyle='#888';ctx.lineWidth=1*Math.min(SX,SY);
  ctx.beginPath();ctx.moveTo(sx(x-16),sy(y-25));ctx.lineTo(sx(x+16),sy(y-25));ctx.stroke();
}

function drawWire(ob){
  const {x,y}=ob;
  fr(x-2,y-55,4,55,'#555');
  fr(x-12,y-57,24,5,'#777');
  const hue=50+Math.sin(G.frame*0.3)*30;
  ctx.strokeStyle=`hsl(${hue},100%,60%)`;ctx.lineWidth=3*Math.min(SX,SY);
  ctx.shadowColor='#ffff00';ctx.shadowBlur=sy(10);
  ctx.beginPath();ctx.moveTo(0,sy(y-53));ctx.lineTo(W,sy(y-53));ctx.stroke();
  ctx.shadowBlur=0;
  if(G.frame%6<3) cr(x,y-53,4+Math.random()*3,'rgba(255,255,100,0.9)');
}

function drawPit(ob){
  const {x,y,w}=ob;
  const pg=ctx.createLinearGradient(0,sy(y),0,sy(y+30));
  pg.addColorStop(0,'#111');pg.addColorStop(1,'#000');
  ctx.fillStyle=pg;ctx.fillRect(sx(x-w/2),sy(y-6),sx(w),sy(30));
  fr(x-w/2-3,y-6,6,6,'#444');fr(x+w/2-3,y-6,6,6,'#444');
}

function drawHeli(ob){
  const {x,y}=ob;
  const hov=Math.sin(G.frame*0.09)*5;
  rr(x-20,y-10+hov,40,18,5,'#557755');fr(x-9,y-16+hov,18,8,'#445544');
  const rr2=G.frame*0.22;
  ctx.save();ctx.translate(sx(x),sy(y-15+hov));ctx.rotate(rr2);
  ctx.strokeStyle='#aaa';ctx.lineWidth=2*Math.min(SX,SY);
  ctx.beginPath();ctx.moveTo(-sx(24),0);ctx.lineTo(sx(24),0);ctx.stroke();
  ctx.restore();
  fr(x+15,y-7+hov,18,6,'#445544');cr(x+31,y-5+hov,4,'#557755');
  cr(x-18,y+4+hov,3,'#ff4400');cr(x+18,y+4+hov,3,'#00ff44');
  if(G.frame%4<2){cr(x,y+10+hov,2,'#ff6600');}
}

function drawRoadblock(ob){
  const {x,y}=ob;
  fr(x-24,y-30,48,30,'#ff8800');fr(x-20,y-28,40,6,'#000');fr(x-20,y-18,40,6,'#000');
  rr(x-3,y-40,6,12,2,'#ff8800');fr(x-8,y-42,16,4,'#ff2200');
  cr(x-15,y+2,4,'#222');cr(x+15,y+2,4,'#222');
}

// ══════════════════════════════════════════════
//  COINS & POWERUPS
// ══════════════════════════════════════════════
function drawCoins(){
  G.coins.forEach(c=>{
    const bob=Math.sin(G.frame*0.15+c.lane*0.8)*3;
    cr(c.x,c.y+bob,9,'#22aa33');cr(c.x,c.y+bob,7,'#33cc44');
    txt('£',c.x,c.y+bob,8,'#fff');
    if(G.frame%30<5){ctx.save();ctx.globalAlpha=0.7;cr(c.x-3,c.y+bob-3,2.5,'#ffffff');ctx.restore();}
  });
}

const PW_ICONS={magnet:'🧲',shield3:'🛡️',doubleJump:'⬆️',boost:'🚀',x10:'×10',rocket:'🎯',drone:'🚁',ghost:'👻',coin_rain:'💸',revive:'💖'};
const PW_COLORS={magnet:'#ff00ff',shield3:'#00ccff',doubleJump:'#ffaa00',boost:'#ff4400',x10:'#ffff00',rocket:'#ff6600',drone:'#00ffcc',ghost:'#aaaaff',coin_rain:'#ffcc00',revive:'#ff4488'};

function drawPowerups(){
  G.powerups.forEach(p=>{
    const col=PW_COLORS[p.type]||'#fff';
    const pulse=1+Math.sin(G.frame*0.15)*0.12;
    ctx.save();
    ctx.shadowColor=col;ctx.shadowBlur=sy(14);
    ctx.translate(sx(p.x),sy(p.y));ctx.scale(pulse,pulse);
    ctx.fillStyle=col+'33';ctx.strokeStyle=col;ctx.lineWidth=2*Math.min(SX,SY);
    ctx.beginPath();
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2-Math.PI/8;ctx.lineTo(Math.cos(a)*sx(13),Math.sin(a)*sy(13));}
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.restore();
    txt(PW_ICONS[p.type]||'★',p.x,p.y,12,'#fff');
  });
}

// ══════════════════════════════════════════════
//  PARTICLES
// ══════════════════════════════════════════════
function addP(o){
  if(DB.settings.quality==='low'&&G.particles.length>25) return;
  if(DB.settings.quality==='med'&&G.particles.length>70) return;
  G.particles.push({x:o.x,y:o.y,vx:o.vx||0,vy:o.vy||0,life:o.life||1,maxLife:o.life||1,r:o.r||3,color:o.color||'#fff',gravity:o.gravity||0,shape:o.shape||'circle'});
}
function addST(x,y,text,color){
  G.scoreTexts.push({x,y,text,color:color||'#ffcc00',life:1.5,vy:-1.2});
}

function drawParticles(){
  G.particles.forEach(p=>{
    const a=p.life/p.maxLife;
    ctx.save();ctx.globalAlpha=Math.min(1,a);
    ctx.fillStyle=p.color;
    if(p.shape==='circle'){
      ctx.beginPath();ctx.arc(sx(p.x),sy(p.y),Math.max(0.5,p.r*Math.min(SX,SY)),0,Math.PI*2);ctx.fill();
    } else {
      fr(p.x-p.r,p.y-p.r,p.r*2,p.r*2,p.color);
    }
    ctx.restore();
  });
  G.scoreTexts.forEach(t=>{
    ctx.save();ctx.globalAlpha=Math.min(1,t.life);
    ctx.fillStyle=t.color;ctx.font=`900 ${sy(13)}px Cairo,sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(t.text,sx(t.x),sy(t.y));ctx.restore();
  });
}

// ══════════════════════════════════════════════
//  SPAWN LOGIC
// ══════════════════════════════════════════════
function spawnObs(dt){
  G.spawnT-=dt;
  if(G.spawnT>0) return;
  const baseInt=Math.max(0.55,2.6-G.score*0.000085);
  G.spawnT=baseInt*(0.65+Math.random()*0.7);

  const lane=Math.floor(Math.random()*LANE_CNT);
  const r=Math.random();
  const sc=G.score;

  if(r<0.30) spawnTrain(lane);
  else if(r<0.45) spawnCar(lane);
  else if(r<0.55&&sc>500) spawnObType('truck',lane);
  else if(r<0.62&&sc>800) spawnCamel(lane);
  else if(r<0.68&&sc>400) spawnBarrier(lane);
  else if(r<0.74&&sc>1500) spawnWire(lane);
  else if(r<0.79&&sc>2500) spawnPit(lane);
  else if(r<0.83&&sc>3500) spawnHeli(lane);
  else if(r<0.87&&sc>4000) spawnObType('police',lane);
  else if(r<0.91&&sc>6000) spawnObType('roadblock',lane);
  else if(r<0.95&&sc>8000) spawnGhost(lane);
  else spawnTrain(lane);

  // قطار ثانٍ أحياناً
  if(Math.random()<0.15&&sc>3000){
    const fl=(lane+1+Math.floor(Math.random()*2))%LANE_CNT;
    setTimeout(()=>{if(G.running)spawnTrain(fl,true);},700);
  }
  // قطار مزدوج
  if(Math.random()<0.08&&sc>6000){
    const fl2=(lane+2)%LANE_CNT;
    setTimeout(()=>{if(G.running)spawnTrain(fl2);},400);
  }
}

const TRAIN_COLORS=['#227722','#226699','#882222','#886600','#446688','#668866'];

function spawnTrain(lane,fast=false){
  const cnt=2+Math.floor(Math.random()*3);
  G.obstacles.push({
    id:Math.random(),type:'train',
    x:LANES[lane],y:TT-20,w:28,h:65*cnt,lane,carCount:cnt,
    color:TRAIN_COLORS[Math.floor(Math.random()*TRAIN_COLORS.length)],
    speed:G.speed*(fast?1.6:1)*LEVELS[G.level].trainSpd,
    sparks:Math.random()<0.4,stopped:false,stoppedT:0,whistled:false,passed:false,ghost:false
  });
}

function spawnCar(lane){
  const cols=['#ccaa22','#ff4400','#4444cc','#ffffff','#222222','#cc2222','#22cc44'];
  G.obstacles.push({id:Math.random(),type:'car',x:LANES[lane],y:TT-10,w:32,h:32,lane,color:cols[Math.floor(Math.random()*cols.length)],speed:G.speed*0.9,passed:false});
}
function spawnObType(type,lane){
  const configs={
    truck:{w:36,h:56,speed:G.speed*0.8},
    police:{w:32,h:32,speed:G.speed*1.1},
    roadblock:{w:48,h:30,speed:G.speed*0.7},
  };
  const c=configs[type]||{w:30,h:30,speed:G.speed};
  G.obstacles.push({id:Math.random(),type,x:LANES[lane],y:TT-10,lane,...c,passed:false,ghost:false});
}
function spawnCamel(lane){G.obstacles.push({id:Math.random(),type:'camel',x:LANES[lane],y:TT,w:30,h:40,lane,speed:G.speed*0.65,passed:false,ghost:false});}
function spawnBarrier(lane){G.obstacles.push({id:Math.random(),type:'barrier',x:LANES[lane],y:GY-15,w:32,h:24,lane,speed:G.speed,passed:false,ghost:false});}
function spawnWire(lane){G.obstacles.push({id:Math.random(),type:'wire',x:LANES[lane],y:GY-32,w:BW,h:12,lane,speed:G.speed,passed:false,ghost:false});}
function spawnPit(lane){G.obstacles.push({id:Math.random(),type:'pit',x:LANES[lane],y:GY-5,w:54,h:20,lane,speed:G.speed,passed:false,ghost:false});}
function spawnHeli(lane){G.obstacles.push({id:Math.random(),type:'helicopter',x:LANES[lane],y:GY-65,w:40,h:22,lane,speed:G.speed*0.75,passed:false,ghost:false});}
function spawnGhost(lane){
  G.obstacles.push({id:Math.random(),type:'train',x:LANES[lane],y:TT-20,w:28,h:130,lane,carCount:2,
    color:'#aaaaff',speed:G.speed*1.5*LEVELS[G.level].trainSpd,sparks:false,stopped:false,stoppedT:0,whistled:false,passed:false,ghost:true});
}

function spawnCoins(dt){
  G.coinT-=dt;
  if(G.coinT>0) return;
  G.coinT=0.4+Math.random()*0.9;
  const lane=Math.floor(Math.random()*LANE_CNT);
  const cnt=3+Math.floor(Math.random()*6);
  // شكل: خط مستقيم أو متعرج
  const zigzag=Math.random()<0.3;
  for(let i=0;i<cnt;i++){
    const xl=zigzag?LANES[(lane+i%2)%LANE_CNT]:LANES[lane];
    G.coins.push({id:Math.random(),lane,x:xl,y:GY-32-i*24,collected:false});
  }
  // مطر عملات
  if(G.powers.coin_rain>0){
    for(let i=0;i<3;i++){
      const rl=Math.floor(Math.random()*LANE_CNT);
      G.coins.push({id:Math.random(),lane:rl,x:LANES[rl],y:GY-32-i*30,collected:false});
    }
  }
}

function spawnPowerup(dt){
  G.powerT-=dt;
  if(G.powerT>0) return;
  G.powerT=7+Math.random()*14;
  const types=['magnet','shield3','doubleJump','boost','x10','rocket','drone','ghost','coin_rain','revive'];
  const type=types[Math.floor(Math.random()*types.length)];
  const lane=Math.floor(Math.random()*LANE_CNT);
  G.powerups.push({id:Math.random(),type,x:LANES[lane],y:GY-38,lane});
}

// ══════════════════════════════════════════════
//  PLAYER UPDATE
// ══════════════════════════════════════════════
function updatePlayer(dt){
  // حركة ناعمة
  const tx=LANES[G.targetLane];
  G.px+=(tx-G.px)*Math.min(1,15*dt);

  // قفز
  if(G.jumping){
    G.py+=G.jumpVY*dt*60;
    G.jumpVY+=0.58*dt*60;
    if(G.py>=GY){
      G.py=GY;G.jumping=false;G.jumpVY=0;G.doubleJumpUsed=false;
      SFX.land();
      for(let i=0;i<10;i++) addP({x:G.px+(Math.random()-0.5)*16,y:GY,vx:(Math.random()-0.5)*2,vy:-Math.random()*2,life:0.5,r:2.5,color:'rgba(180,150,100,0.5)'});
    }
  }

  // انزلاق
  if(G.sliding){G.slideTimer-=dt;if(G.slideTimer<=0)G.sliding=false;}

  // بوست
  if(G.boosting){
    G.boostTimer-=dt;
    if(G.boostTimer<=0){G.boosting=false;G.boostMeter=0;}
    G.speed=Math.min(28,G.speed*1.004);
  } else {
    G.speed=5.5+G.score*0.00065;
    G.speed=Math.min(20,G.speed);
    // سرعة صابويه
    if(DB.selectedChar==='sabuyah') G.speed=Math.min(24,G.speed*1.2);
  }
  if(G.speed>G.maxSpeed) G.maxSpeed=G.speed;

  // مغناطيس عبده الدائم
  const hasMag=G.powers.magnet>0||DB.selectedChar==='abdo';
  if(hasMag){
    G.coins.forEach(c=>{
      if(c.collected) return;
      const dx=G.px-c.x,dy=(G.py-18)-c.y;
      const d=Math.sqrt(dx*dx+dy*dy);
      if(d<(DB.selectedChar==='abdo'?100:75)){c.x+=dx/d*5;c.y+=dy/d*5;}
    });
  }

  // درون
  if(G.droneActive){
    G.droneX+=(G.px-G.droneX)*0.07;
    G.droneY+=((G.py-65)-G.droneY)*0.07;
    G.coins.forEach(c=>{
      if(c.collected) return;
      const dx=G.droneX-c.x,dy=G.droneY-c.y;
      if(Math.sqrt(dx*dx+dy*dy)<65){c.x+=dx*0.18;c.y+=dy*0.18;}
    });
  }

  // ghost mode = invincible
  if(G.powers.ghost>0) G.invincible=999;
  else if(G.invincible>0&&!G.powers.ghost) G.invincible-=dt*60;

  // hamad cooldown
  if(G.hamadCD>0) G.hamadCD-=dt;

  // تحديث powers
  Object.keys(G.powers).forEach(k=>{
    G.powers[k]-=dt;
    if(G.powers[k]<=0) delete G.powers[k];
  });
  if(!G.powers.drone&&G.droneActive) G.droneActive=false;
  if(!G.powers.coin_rain) G.coinRainTimer=0;

  // كاميرا شيك
  if(G.shakeAmt>0) G.shakeAmt-=dt*5;

  // غبار جري
  if(!G.jumping&&!G.sliding&&G.frame%4===0){
    addP({x:G.px+(Math.random()-0.5)*12,y:GY+4,vx:(Math.random()-0.5)*0.8,vy:-0.4,life:0.45,r:2.5,color:'rgba(180,150,100,0.38)'});
  }
  // شرار انزلاق
  if(G.sliding&&G.frame%2===0){
    for(let i=0;i<3;i++) addP({x:G.px,y:GY,vx:(Math.random()-0.5)*4,vy:-Math.random()*2.5,life:0.35,r:1.5,color:`hsl(${25+Math.random()*35},100%,60%)`,shape:'rect'});
  }
  // تأثير بوست
  if(G.boosting&&G.frame%3===0){
    addP({x:G.px+(Math.random()-0.5)*14,y:G.py,vx:(Math.random()-0.5)*3,vy:1+Math.random()*2,life:0.6,r:4,color:`hsl(${30+Math.random()*40},100%,55%)`});
  }
}

// ══════════════════════════════════════════════
//  ENEMY UPDATE
// ══════════════════════════════════════════════
function updateEnemy(dt){
  if(!G.enemyVisible){
    if(G.score>400) G.enemyVisible=true;
    return;
  }

  // اقتراب
  const cspd=0.35+G.speed*0.018+G.score*0.000006;
  G.enemyDist-=cspd*dt*60;

  // بوست أو نفق يبعّده
  if(G.boosting||G.powers.ghost) G.enemyDist+=2.5*dt*60;

  // عثرة عشوائية (الغيطي يتعثر)
  if(!G.enemyTrip&&Math.random()<0.0008*G.speed){
    G.enemyTrip=true;G.enemyTripTimer=1.5+Math.random()*2;
    G.enemyDist+=80;
    showHype('😅 الغيطي اتعثر!','#88ff88');
  }
  if(G.enemyTrip){
    G.enemyTripTimer-=dt;
    if(G.enemyTripTimer<=0) G.enemyTrip=false;
  }

  G.enemyDist=Math.max(-5,Math.min(1000,G.enemyDist));

  // ذكاء المسار
  if(G.frame%50===0&&!G.enemyTrip){
    const target=Math.random()<0.45?G.targetLane:G.lane;
    if(G.enemyLane!==target) G.enemyLane+=Math.sign(target-G.enemyLane);
  }

  // قفز عقبات
  if(!G.enemyJump){
    const ahead=G.obstacles.find(ob=>ob.lane===G.enemyLane&&ob.y>GY-160&&ob.y<GY);
    if(ahead&&Math.random()<0.65){G.enemyJump=true;G.enemyJumpVY=-10;}
    // انزلاق تحت السلك
    const wire=G.obstacles.find(ob=>ob.type==='wire'&&ob.y>GY-100&&ob.y<GY);
    if(wire&&Math.random()<0.5) G.enemySlide=true;
  }
  if(G.enemyJump){
    G.enemyY+=G.enemyJumpVY*dt*60;G.enemyJumpVY+=0.5*dt*60;
    if(G.enemyY>=GY){G.enemyY=GY;G.enemyJump=false;G.enemyJumpVY=0;}
  } else G.enemyY=GY;

  G.enemyAnger=Math.max(0,G.enemyAnger-dt);
  G.enemyWhistle-=dt;
  if(G.enemyWhistle<=0&&G.enemyDist<220){
    G.enemyWhistle=2.5+Math.random()*4;
    G.enemyAnger=1.5;
    SFX.enemyNear();
    const msgs=['خد بالك!','مستلحقكش!','يا هههه!','وقف يا صابويه!','انتهيت!'];
    showHype(msgs[Math.floor(Math.random()*msgs.length)],'#ff4444');
  }

  // لمسة العدو
  if(G.enemyDist<8&&G.enemyLane===G.lane&&G.invincible<=0) {
    triggerCrash();
  }

  // UI الخطر
  const pct=Math.max(0,Math.min(100,(1-G.enemyDist/900)*100));
  const df=document.getElementById('dangerFill');
  const dt2=document.getElementById('dangerText');
  if(df) df.style.width=pct+'%';
  if(dt2){
    if(pct>78){dt2.textContent='خطر!!';dt2.style.color='#ff2200';}
    else if(pct>45){dt2.textContent='قريب!';dt2.style.color='#ffaa00';}
    else{dt2.textContent='بعيد';dt2.style.color='#88ff88';}
  }
}

// ══════════════════════════════════════════════
//  COLLISIONS
// ══════════════════════════════════════════════
function checkCollisions(){
  const px2=G.px,py2=G.py;
  const ph=G.sliding?10:36;

  for(let i=G.obstacles.length-1;i>=0;i--){
    const ob=G.obstacles[i];
    if(Math.abs(px2-ob.x)>ob.w*0.75) continue;
    if(ob.ghost&&G.invincible>0) continue;
    const cy=py2>ob.y-ob.h*0.85&&py2-ph<ob.y+6;
    if(!cy) continue;
    if(ob.type!=='wire'&&ob.type!=='pit'&&ob.lane!==G.lane) continue;

    if(ob.type==='wire'){
      if(!G.sliding&&py2-ph<ob.y-30&&G.invincible<=0) doHit(ob);
      continue;
    }
    if(ob.type==='pit'){
      if(!G.jumping&&G.invincible<=0) doHit(ob);
      continue;
    }
    if(ob.type==='helicopter'&&G.jumping&&py2<ob.y-22) continue;
    if(G.invincible>0) continue;
    doHit(ob); return;
  }

  // عملات
  for(let i=G.coins.length-1;i>=0;i--){
    const c=G.coins[i];
    if(c.collected) continue;
    if(Math.abs(px2-c.x)<16&&Math.abs((py2-14)-c.y)<18) collectCoin(c,i);
  }

  // بوست
  for(let i=G.powerups.length-1;i>=0;i--){
    const p=G.powerups[i];
    if(Math.abs(px2-p.x)<20&&Math.abs((py2-18)-p.y)<22){
      activatePower(p.type);
      for(let j=0;j<18;j++) addP({x:p.x,y:p.y,vx:(Math.random()-0.5)*5,vy:-Math.random()*4.5,life:0.9,r:3,color:`hsl(${Math.random()*360},100%,60%)`});
      G.powerups.splice(i,1);
    }
  }
}

function collectCoin(c,idx){
  c.collected=true;
  const isAwatef=DB.selectedChar==='awatef';
  const coinV=(G.powers.x10?10:(G.boosting?3:1))*(isAwatef?1.5:1);
  G.coins_total=(G.coins_total||0)+coinV;
  G.coins=Math.floor(G.coins_total);
  G.combo++;G.comboTimer=3.5;
  G.boostMeter=Math.min(100,G.boostMeter+4);
  G.score+=6*coinV;
  for(let j=0;j<7;j++) addP({x:c.x,y:c.y,vx:(Math.random()-0.5)*3,vy:-2.5-Math.random()*2,life:0.7,r:2.5,color:'#ffcc00'});
  if(G.coins%10===0){
    const msgs=[['💰 جامد فشخ!','#ffcc00'],['🤑 ملياردير!','#ffaa00'],['💵 خد يا معلم!','#ffff00'],['🔥 حارق!','#ff8800']];
    const [t,col]=msgs[Math.floor(Math.random()*msgs.length)];
    showBigMoney(t,col);SFX.bigCoin();
  } else SFX.coin();
  addST(c.x,c.y-15,`+${Math.round(coinV*6)}`,'#ffcc00');
  if(G.combo>=3&&G.combo%5===0) SFX.comboHigh();
  G.coins.splice?.(idx,1)??G.coins.splice(idx,1);
  G.coins.splice(idx,1);
}

function activatePower(type){
  SFX.powerup();
  const DUR={magnet:9,shield3:7,doubleJump:12,rocket:18,x10:7,drone:14,ghost:5,coin_rain:10,revive:0};
  const dur=DUR[type]??6;
  switch(type){
    case 'boost':
      G.boosting=true;G.boostTimer=6;G.boostMeter=100;SFX.boost();
      showHype('🚀 انطلاق الملكي!','#ff4400'); break;
    case 'rocket':
      G.powers.rocket=(G.powers.rocket||0)+dur;
      G.rocketAmmo+=2;
      document.getElementById('rocketUI').classList.remove('hidden');
      document.getElementById('rocketCount').textContent='🚀×'+G.rocketAmmo;
      break;
    case 'drone':
      G.powers.drone=dur;G.droneActive=true;G.droneX=G.px;G.droneY=G.py-65; break;
    case 'doubleJump':
      G.doubleJumpReady=true;G.powers.doubleJump=dur; break;
    case 'revive':
      if(G.lives<3){G.lives++;updateLives();showHype('💖 حياة إضافية!','#ff4488');}
      return;
    default:
      G.powers[type]=dur;
  }
  const labels={magnet:'🧲 مغناطيس!',shield3:'🛡️ درع!',doubleJump:'⬆️ قفز مزدوج!',x10:'×10 نقاط!',ghost:'👻 وضع الشبح!',coin_rain:'💸 مطر الجنيه!',drone:'🚁 درون!'};
  showHype(labels[type]||'✨ بوست!','#00ffff');
  document.getElementById('tunnelFx').classList.toggle('active',type==='ghost');
}

function doHit(ob){
  if(DB.selectedChar==='hammad'&&G.hamadCD<=0){
    G.hamadCD=30;G.invincible=130;
    showHype('🛡️ هاميد صامد!','#88ff88');G.shakeAmt=0.4;SFX.hit(); return;
  }
  if(G.powers.shield3){
    G.powers.shield3=Math.max(0,G.powers.shield3-2);
    if(G.powers.shield3<=0) delete G.powers.shield3;
    G.invincible=100;G.shakeAmt=0.4;showHype('💥 انكسر الدرع!','#88ccff');SFX.hit(); return;
  }
  if(G.boardActive){
    G.boardActive=false;G.boardHitCount++;
    G.invincible=150;G.shakeAmt=0.5;SFX.boardRevive();
    showHype('🛹 اللوح انكسر!','#ff8800'); return;
  }
  if(G.lives>1){
    G.lives--;updateLives();G.invincible=200;G.shakeAmt=1;
    SFX.hit();
    document.getElementById('crashFlash').classList.add('on');
    setTimeout(()=>document.getElementById('crashFlash').classList.remove('on'),200);
    showHype('💔 حياة!'+(G.lives>0?` (${G.lives} متبقي)`:' الأخيرة!'),'#ff4444');
    return;
  }
  triggerCrash();
}

function triggerCrash(){
  if(!G.running) return;
  SFX.crash();if(DB.settings.shake) G.shakeAmt=2;
  for(let j=0;j<35;j++) addP({x:G.px,y:G.py-20,vx:(Math.random()-0.5)*9,vy:-7+Math.random()*4,life:1.5,r:3+Math.random()*4,color:`hsl(${Math.random()*50},100%,55%)`,gravity:0.22,shape:'rect'});
  document.getElementById('crashFlash').classList.add('on');
  setTimeout(()=>document.getElementById('crashFlash').classList.remove('on'),300);
  G.running=false;stopMusic();
  showHype('💀 اتمسكت!','#ff2244');
  setTimeout(showGameOver,700);
}

// ══════════════════════════════════════════════
//  UPDATE OBSTACLES
// ══════════════════════════════════════════════
function updateObs(dt){
  const mv=G.speed*dt*60;
  G.obstacles.forEach(ob=>{
    if(ob.stopped){ob.stoppedT-=dt;if(ob.stoppedT<=0)ob.stopped=false;return;}
    if(ob.type==='train'&&!ob.stopped&&Math.random()<0.0004*G.speed){ob.stopped=true;ob.stoppedT=1.5+Math.random()*2.5;SFX.trainHorn();}
    ob.y+=mv;
    if(ob.type==='train'&&!ob.whistled&&ob.y>GY-210){ob.whistled=true;SFX.trainHorn();}
    if(ob.y>GY+ob.h+10&&!ob.passed){
      ob.passed=true;
      if(ob.type==='train'){G.trainsPassed++;G.score+=60;addST(ob.x,GY-65,'+60','#88ff88');}
    }
  });
  G.obstacles=G.obstacles.filter(ob=>ob.y<BH+220);
  G.coins.forEach(c=>c.y+=mv);G.coins=G.coins.filter(c=>c.y<BH+30);
  G.powerups.forEach(p=>p.y+=mv);G.powerups=G.powerups.filter(p=>p.y<BH+30);
}

function updateParticles(dt){
  G.particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.gravity)p.vy+=p.gravity;p.life-=dt;});
  G.particles=G.particles.filter(p=>p.life>0);
  G.scoreTexts.forEach(t=>{t.y+=t.vy;t.life-=dt;});
  G.scoreTexts=G.scoreTexts.filter(t=>t.life>0);
}

// ══════════════════════════════════════════════
//  WORLD UPDATE
// ══════════════════════════════════════════════
function updateWorld(dt){
  const mv=G.speed*dt*60;
  G.dayTimer+=dt;if(G.dayTimer>220){G.dayTimer=0;G.nightMode=!G.nightMode;}
  G.bldX=G.bldX.map(bx=>{bx+=mv*0.16;if(bx>BW+65)bx=-65;return bx;});
  G.clouds.forEach(cl=>{cl.x+=mv*cl.speed*0.04;if(cl.x>BW+70)cl.x=-70;});
  G.stars.forEach(s=>s.t+=0.015);

  // طقس
  G.weatherTimer-=dt;
  if(G.weatherTimer<=0){
    G.weatherTimer=18+Math.random()*40;
    const ws=['clear','clear','clear','rain','dust','fog','snow'];
    G.weather=ws[Math.floor(Math.random()*ws.length)];
  }

  // مرحلة
  let newLv=0;
  for(let i=LEVELS.length-1;i>=0;i--){if(G.score>=LEVELS[i].scoreThresh??[0,2000,5000,10000,20000][i]){newLv=i;break;}}
  const thresholds=[0,2000,5000,10000,20000];
  newLv=thresholds.findIndex((t,i)=>G.score>=t&&(i===thresholds.length-1||G.score<thresholds[i+1]));
  if(newLv<0) newLv=thresholds.length-1;
  if(newLv!==G.level){G.level=newLv;onLevelUp();}
}

function onLevelUp(){
  SFX.levelUp();
  showHype(`🏙️ ${LEVELS[G.level].name}!`,'#00ffff');
  for(let j=0;j<35;j++) addP({x:Math.random()*BW,y:Math.random()*BH*0.5,vx:(Math.random()-0.5)*3.5,vy:2.5+Math.random()*3,life:1.8,r:4,color:`hsl(${Math.random()*360},100%,60%)`});
  checkAchievements();
}

// ══════════════════════════════════════════════
//  SCORE
// ══════════════════════════════════════════════
const LEVELS_THRESH=[0,2000,5000,10000,20000];

function updateScore(dt){
  const mult=G.powers.x10?10:(G.boosting?2:1);
  G.score+=G.speed*dt*mult*0.52;
  G.boostMeter=Math.min(100,G.boostMeter);
  if(G.combo>0){G.comboTimer-=dt;if(G.comboTimer<=0)G.combo=0;}
}

// ══════════════════════════════════════════════
//  ACHIEVEMENTS
// ══════════════════════════════════════════════
const ACHIEVES=[
  {id:'first1k',label:'🏅 مبتدئ',cond:()=>G.score>=1000,reward:50},
  {id:'first5k',label:'⭐ محترف',cond:()=>G.score>=5000,reward:120},
  {id:'first20k',label:'👑 أسطورة',cond:()=>G.score>=20000,reward:300},
  {id:'trains10',label:'🚆 سارق القطارات',cond:()=>G.trainsPassed>=10,reward:80},
  {id:'trains50',label:'🚄 أمير السكك',cond:()=>G.trainsPassed>=50,reward:200},
  {id:'coins50',label:'💰 غني شوية',cond:()=>G.coins>=50,reward:100},
  {id:'coins200',label:'💎 ملياردير',cond:()=>G.coins>=200,reward:400},
  {id:'speed18',label:'💨 سريع البرق',cond:()=>G.maxSpeed>=15,reward:150},
  {id:'lv3',label:'✈️ مسافر',cond:()=>G.level>=2,reward:100},
  {id:'lv5',label:'🚀 رائد فضاء',cond:()=>G.level>=4,reward:250},
];
let earnedA=new Set();
function checkAchievements(){
  ACHIEVES.forEach(a=>{
    if(!earnedA.has(a.id)&&a.cond()){
      earnedA.add(a.id);showAchieve(a.label,a.reward);
    }
  });
}
function showAchieve(label,reward){
  const el=document.getElementById('achieveToast');if(!el)return;
  el.textContent=`${label}  +${reward}💰`;el.classList.add('show');
  DB.totalCoins+=reward;saveDB();
  setTimeout(()=>el.classList.remove('show'),3500);
}

// ══════════════════════════════════════════════
//  HUD UPDATE
// ══════════════════════════════════════════════
function drawDrone(){
  if(!G.droneActive) return;
  const {droneX,droneY}=G;
  const hov=Math.sin(G.frame*0.13)*3;
  rr(droneX-12,droneY-6+hov,24,12,3,'#006644');
  const dr=G.frame*0.28;
  [-9,9].forEach(dx=>{
    ctx.save();ctx.translate(sx(droneX+dx),sy(droneY-6+hov));ctx.rotate(dr);
    ctx.strokeStyle='#aaa';ctx.lineWidth=1.5*Math.min(SX,SY);
    ctx.beginPath();ctx.moveTo(-sx(8),0);ctx.lineTo(sx(8),0);ctx.stroke();ctx.restore();
  });
  ctx.strokeStyle='rgba(0,255,150,0.3)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
  ctx.beginPath();ctx.moveTo(sx(droneX),sy(droneY));ctx.lineTo(sx(G.px),sy(G.py-30));ctx.stroke();
  ctx.setLineDash([]);
}

function updateHUD(){
  const sc=Math.floor(G.score),spd=Math.floor(G.speed*0.7);
  document.getElementById('hudScore').textContent=sc;
  document.getElementById('hudCoins').textContent=G.coins||0;
  document.getElementById('hudSpeed').textContent=spd;
  document.getElementById('hudLvlName').textContent=LEVELS[G.level].name;
  document.getElementById('boostBar').style.width=G.boostMeter+'%';

  // كومبو
  const cd=document.getElementById('comboDisplay'),cv=document.getElementById('comboVal');
  if(cd&&cv){
    if(G.combo>=3){cd.classList.add('show');cv.textContent=G.combo;const h=G.combo>=20?'#ff2200':G.combo>=10?'#ff8800':'#ffff00';cd.style.color=h;}
    else cd.classList.remove('show');
  }

  // مؤشر مسار
  for(let i=0;i<5;i++){
    const ld=document.getElementById('ld'+i);
    if(ld) ld.classList.toggle('active',i===G.lane);
  }

  // بوستات نشطة
  const ap=document.getElementById('activePowers');if(ap){
    ap.innerHTML='';
    Object.entries(G.powers).forEach(([type,frames])=>{
      if(frames<=0) return;
      const sec=Math.ceil(frames);
      const d=document.createElement('div');d.className='power-badge';
      d.style.color=PW_COLORS[type]||'#fff';d.style.borderColor=PW_COLORS[type]||'#fff';
      d.textContent=(PW_ICONS[type]||'★')+' '+sec+'s';ap.appendChild(d);
    });
    if(G.boosting){
      const d=document.createElement('div');d.className='power-badge';
      d.style.color='#ff8800';d.style.borderColor='#ff8800';
      d.textContent='⚡ '+Math.ceil(G.boostTimer)+'s';ap.appendChild(d);
    }
  }
  checkAchievements();
}

function updateLives(){
  [1,2,3].forEach(i=>{
    const h=document.getElementById('h'+i);
    if(h) h.classList.toggle('lost',i>G.lives);
  });
}

// ══════════════════════════════════════════════
//  MESSAGES
// ══════════════════════════════════════════════
let hypeT=null;
function showHype(text,color='#ffff00'){
  const el=document.getElementById('hypeMsg');if(!el)return;
  el.textContent=text;el.style.color=color;
  el.style.animation='none';void el.offsetWidth;
  el.classList.add('pop');el.style.animation='';
  el.style.animation='hypePop 1.6s cubic-bezier(.17,.67,.38,1.4) forwards';
  if(hypeT)clearTimeout(hypeT);
  hypeT=setTimeout(()=>{el.style.animation='';},1700);
}

let bmT=null;
function showBigMoney(text,color){
  const el=document.getElementById('bigMoney');if(!el)return;
  el.textContent=text;el.style.color=color;el.style.textShadow=`0 0 30px ${color},0 0 60px ${color}`;
  el.style.animation='none';void el.offsetWidth;
  el.style.animation='bigPop 2s ease forwards';
  if(bmT)clearTimeout(bmT);bmT=setTimeout(()=>el.style.animation='',2100);
}

// ══════════════════════════════════════════════
//  MAIN LOOP
// ══════════════════════════════════════════════
let lastT=0;
function gameLoop(ts){
  if(!G.running) return;
  const dt=Math.min(0.05,(ts-lastT)/1000);lastT=ts;G.frame++;

  // shake
  if(G.shakeAmt>0.05&&DB.settings.shake){
    ctx.save();
    ctx.translate((Math.random()-0.5)*G.shakeAmt*14*SX,(Math.random()-0.5)*G.shakeAmt*9*SY);
  }

  ctx.clearRect(0,0,W,H);
  drawBG();
  drawObstacles();
  drawCoins();
  drawPowerups();
  drawPlayer();
  drawEnemy();
  drawDrone();
  drawParticles();

  if(G.shakeAmt>0.05&&DB.settings.shake) ctx.restore();

  updatePlayer(dt);
  updateObs(dt);
  updateParticles(dt);
  updateWorld(dt);
  updateScore(dt);
  updateEnemy(dt);
  spawnObs(dt);
  spawnCoins(dt);
  spawnPowerup(dt);
  checkCollisions();
  updateHUD();

  G.scoreHist.push(Math.floor(G.score));
  if(G.scoreHist.length>200) G.scoreHist.shift();
  if(G.frame%60===0) checkAchievements();

  requestAnimationFrame(gameLoop);
}

// ══════════════════════════════════════════════
//  CONTROLS
// ══════════════════════════════════════════════
function doLeft(){if(G.targetLane>0){G.targetLane--;}}
function doRight(){if(G.targetLane<4){G.targetLane++;}}
function doJump(){
  if(!G.jumping){
    G.jumping=true;G.jumpVY=-12.5;SFX.jump();
    for(let i=0;i<10;i++) addP({x:G.px+(Math.random()-0.5)*14,y:GY,vx:(Math.random()-0.5)*2.5,vy:-1.8-Math.random()*1.5,life:0.55,r:2.5,color:'rgba(180,150,100,0.5)'});
  } else if(G.doubleJumpReady&&!G.doubleJumpUsed){
    G.doubleJumpUsed=true;G.jumpVY=-9.5;SFX.doubleJump();
    for(let i=0;i<14;i++) addP({x:G.px,y:G.py,vx:(Math.random()-0.5)*3.5,vy:-2.5-Math.random()*2,life:0.7,r:3,color:'#ffaa00'});
    showHype('⬆️ قفز مزدوج!','#ffaa00');
  }
}
function doSlide(){if(!G.jumping){G.sliding=true;G.slideTimer=1.1;SFX.slide();}}
function doBoost(){
  if(G.boostMeter>=100&&!G.boosting){G.boosting=true;G.boostTimer=6;SFX.boost();showHype('⚡ بوست الملكي!','#ffff00');}
}
function doRocket(){
  if(G.rocketAmmo>0){
    const t=G.obstacles.find(ob=>ob.lane===G.lane&&ob.y>GY-250);
    if(t){
      SFX.rocket();G.rocketAmmo--;
      document.getElementById('rocketCount').textContent='🚀×'+G.rocketAmmo;
      if(G.rocketAmmo===0) document.getElementById('rocketUI').classList.add('hidden');
      for(let j=0;j<25;j++) addP({x:t.x,y:t.y,vx:(Math.random()-0.5)*6,vy:-5-Math.random()*4,life:1.2,r:4+Math.random()*3,color:`hsl(${Math.random()*50},100%,60%)`,shape:'rect',gravity:0.1});
      G.obstacles=G.obstacles.filter(ob=>ob!==t);
      G.trainsPassed++;G.score+=100;addST(t.x,t.y-30,'💥+100','#ff8800');
      showHype('💥 دمرته!','#ff8800');
    }
  }
}

// لوحة المفاتيح
window.addEventListener('keydown',e=>{
  if(!G.running) return;
  if(e.key==='ArrowLeft'||e.key==='a') doLeft();
  else if(e.key==='ArrowRight'||e.key==='d') doRight();
  else if(e.key==='ArrowUp'||e.key==='w'||e.key===' ') doJump();
  else if(e.key==='ArrowDown'||e.key==='s') doSlide();
  else if(e.key==='Shift') doBoost();
  else if(e.key==='r'||e.key==='R') doRocket();
  e.preventDefault();
});

// سوايب
let tx0=0,ty0=0,tt0=0;
window.addEventListener('touchstart',e=>{tx0=e.touches[0].clientX;ty0=e.touches[0].clientY;tt0=Date.now();},{passive:true});
window.addEventListener('touchend',e=>{
  if(!G.running) return;
  const dx=e.changedTouches[0].clientX-tx0,dy=e.changedTouches[0].clientY-ty0,el=Date.now()-tt0;
  if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>25){dx>0?doRight():doLeft();}
  else if(dy<-25) doJump();
  else if(dy>25) doSlide();
  else if(el<200) doJump();
},{passive:true});

// أزرار لمس
function ctrlDown(a){
  const map={left:doLeft,right:doRight,jump:doJump,slide:doSlide,boost:doBoost};
  if(map[a]) map[a]();
}
function ctrlUp(a){}

// ══════════════════════════════════════════════
//  SCREENS
// ══════════════════════════════════════════════
const SCRS=['screenStart','screenChar','screenShop','screenLeaders','screenSettings','screenHUD','screenOver'];
function showScreen(id){
  SCRS.forEach(s=>{
    const el=document.getElementById(s);if(!el)return;
    if(s===id){el.classList.remove('hidden');}
    else{el.classList.add('hidden');}
  });
  // HUD اللعبة
  const inGame=id==='screenHUD';
  ['hud','controls','dangerBar','laneIndicator','livesBar'].forEach(e=>{
    const el=document.getElementById(e);if(el)el.classList.toggle('hidden',!inGame);
  });
}

// ══════════════════════════════════════════════
//  START GAME
// ══════════════════════════════════════════════
function startGame(){
  initAudio();resumeAC();
  resetG();G.coins_total=0;
  earnedA.clear();
  G.running=true;G.startTime=Date.now();
  DB.attempts++;saveDB();
  showScreen('screenHUD');
  updateLives();
  // صاروخ إضافي لفهيم
  if(DB.selectedChar==='fahim'){G.rocketAmmo=1;document.getElementById('rocketUI').classList.remove('hidden');document.getElementById('rocketCount').textContent='🚀×1';}
  startMusic();
  lastT=performance.now();
  requestAnimationFrame(gameLoop);
  showHype('يلا يا صابويه!','#ffff00');
}

// ══════════════════════════════════════════════
//  GAME OVER
// ══════════════════════════════════════════════
function showGameOver(){
  const sc=Math.floor(G.score);
  const isNew=sc>DB.highScore;
  if(isNew){DB.highScore=sc;document.getElementById('newRecord').classList.remove('hidden');}
  else document.getElementById('newRecord').classList.add('hidden');
  DB.totalCoins+=G.coins||0;
  DB.leaderboard.push({score:sc,coins:G.coins||0,date:new Date().toLocaleDateString('ar-EG'),char:DB.selectedChar});
  DB.leaderboard.sort((a,b)=>b.score-a.score);DB.leaderboard=DB.leaderboard.slice(0,8);
  saveDB();
  document.getElementById('ovScore').textContent=sc;
  document.getElementById('ovHS').textContent=DB.highScore;
  document.getElementById('ovCoins').textContent=G.coins||0;
  document.getElementById('ovSpeed').textContent=Math.floor(G.maxSpeed*0.65);
  document.getElementById('ovTrains').textContent=G.trainsPassed;
  const el=Math.floor((Date.now()-G.startTime)/1000);
  document.getElementById('ovTime').textContent=el+'s';
  drawChart();updateStartStats();
  showScreen('screenOver');
}

function drawChart(){
  const c=document.getElementById('scoreChart');if(!c||G.scoreHist.length<2)return;
  const cx=c.getContext('2d');const W2=c.width=c.clientWidth||320,H2=c.height=70;
  cx.clearRect(0,0,W2,H2);cx.fillStyle='rgba(255,255,255,0.04)';cx.fillRect(0,0,W2,H2);
  const mx=Math.max(...G.scoreHist)||1;
  const g=cx.createLinearGradient(0,0,W2,0);g.addColorStop(0,'#ff6600');g.addColorStop(1,'#ffcc00');
  cx.strokeStyle=g;cx.lineWidth=2.5;cx.beginPath();
  G.scoreHist.forEach((s,i)=>{const px2=i/G.scoreHist.length*W2,py2=H2-(s/mx)*(H2-10)-5;i===0?cx.moveTo(px2,py2):cx.lineTo(px2,py2);});
  cx.stroke();cx.fillStyle=g;cx.globalAlpha=0.15;cx.lineTo(W2,H2);cx.lineTo(0,H2);cx.fill();
}

// ══════════════════════════════════════════════
//  UI BUILDERS
// ══════════════════════════════════════════════
function buildChars(){
  const grid=document.getElementById('charGrid');if(!grid) return;
  document.getElementById('charCoinsVal').textContent=DB.totalCoins;
  grid.innerHTML='';
  CHARS.forEach(char=>{
    const owned=DB.ownedChars.includes(char.id);
    const selected=DB.selectedChar===char.id;
    const div=document.createElement('div');
    div.className='char-card'+(selected?' selected':'')+(owned?'':' locked');
    const c=document.createElement('canvas');c.width=70;c.height=82;c.className='char-canvas';
    drawMiniChar(c,char);div.appendChild(c);
    if(selected){const b=document.createElement('div');b.className='selected-badge';b.textContent='✓';div.appendChild(b);}
    const nm=document.createElement('div');nm.className='cname';nm.textContent=char.name;div.appendChild(nm);
    const ab=document.createElement('div');ab.className='cability';ab.textContent=char.ability;div.appendChild(ab);
    if(!owned){
      const cs=document.createElement('div');cs.className='ccost';cs.textContent=`🔒 ${char.cost}💰`;div.appendChild(cs);
      div.onclick=()=>buyChar(char);
    } else div.onclick=()=>selChar(char.id);
    grid.appendChild(div);
  });
}

function drawMiniChar(cv,char){
  const c=cv.getContext('2d'),W=cv.width,H=cv.height,x=W/2,by=H-10;
  c.clearRect(0,0,W,H);
  c.fillStyle=char.pants;c.fillRect(x-12,by-28,10,28);c.fillRect(x+2,by-28,10,28);
  c.fillStyle='#222';c.fillRect(x-13,by-2,11,5);c.fillRect(x+1,by-2,11,5);
  c.fillStyle=char.shirt;c.fillRect(x-13,by-54,26,28);
  c.fillStyle=char.skin;c.fillRect(x-14,by-65,6,16);c.fillRect(x+8,by-65,6,16);
  c.fillStyle=char.skin;c.fillRect(x-9,by-74,18,20);
  c.fillStyle=char.cap;c.fillRect(x-10,by-83,20,11);c.fillRect(x-11,by-73,22,3);
  c.fillStyle='#fff';c.fillRect(x-7,by-71,4,4);c.fillRect(x+2,by-71,4,4);
  c.fillStyle='#222';c.fillRect(x-6,by-70,2.5,2.5);c.fillRect(x+3,by-70,2.5,2.5);
}

function buyChar(char){
  if(DB.totalCoins>=char.cost){DB.totalCoins-=char.cost;DB.ownedChars.push(char.id);selChar(char.id);saveDB();buildChars();}
  else showHype('💰 مش كفاية جنيه!','#ff4444');
}
function selChar(id){DB.selectedChar=id;saveDB();buildChars();}

function buildShop(){
  const grid=document.getElementById('shopGrid');if(!grid)return;
  document.getElementById('shopCoinsVal').textContent=DB.totalCoins;
  grid.innerHTML='';
  SHOP.forEach(item=>{
    const owned=DB.ownedItems.includes(item.id);
    const div=document.createElement('div');div.className='shop-item'+(owned?' owned':'');
    div.innerHTML=`<div class="sicon">${item.icon}</div><div class="sname">${item.name}</div><div class="sprice">${owned?'✓ مشتري':item.price+'💰'}</div>`;
    if(!owned&&item.price>0) div.onclick=()=>buyItem(item);
    grid.appendChild(div);
  });
}
function buyItem(item){
  if(DB.totalCoins<item.price){showHype('💰 مش كفاية!','#ff4444');return;}
  DB.totalCoins-=item.price;DB.ownedItems.push(item.id);saveDB();buildShop();
}

function buildLeaders(){
  const list=document.getElementById('leadersList');if(!list)return;
  list.innerHTML='';
  const medals=['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣'];
  if(!DB.leaderboard.length){list.innerHTML='<div style="color:rgba(255,255,255,.35);text-align:center;padding:24px">لا توجد نتائج بعد</div>';return;}
  DB.leaderboard.forEach((e,i)=>{
    const div=document.createElement('div');div.className='leader-row';
    const charName=CHARS.find(c=>c.id===e.char)?.name||'صابويه';
    div.innerHTML=`<div class="leader-rank">${medals[i]||i+1}</div><div class="leader-info"><div class="leader-name">${charName}</div><div class="leader-sub">💰${e.coins} | 📅${e.date}</div></div><div class="leader-score">${e.score}</div>`;
    list.appendChild(div);
  });
}

function loadSettings(){
  const s=DB.settings;
  document.getElementById('settMusic').checked=s.music;
  document.getElementById('settSfx').checked=s.sfx;
  document.getElementById('settShake').checked=s.shake;
  document.getElementById('settQuality').value=s.quality;
}
function saveSettings(){
  DB.settings.music=document.getElementById('settMusic').checked;
  DB.settings.sfx=document.getElementById('settSfx').checked;
  DB.settings.shake=document.getElementById('settShake').checked;
  DB.settings.quality=document.getElementById('settQuality').value;
  saveDB();
}

function updateStartStats(){
  document.getElementById('hsDisplay').textContent=DB.highScore;
  document.getElementById('totalCoinsDisplay').textContent=DB.totalCoins;
  document.getElementById('attemptsDisplay').textContent=DB.attempts;
}

// ══════════════════════════════════════════════
//  SCREEN NAV
// ══════════════════════════════════════════════
document.getElementById('screenChar').addEventListener('click',()=>{});
document.querySelectorAll('.screen').forEach(s=>{
  s.addEventListener('touchstart',e=>{},{passive:true});
});

// ══════════════════════════════════════════════
//  START BG ANIMATION
// ══════════════════════════════════════════════
let bgF=0;
function drawStartBG(){
  if(G.running) return;
  bgF++;
  ctx.clearRect(0,0,W,H);
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#020008');g.addColorStop(0.5,'#080020');g.addColorStop(1,'#020008');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // نجوم
  for(let i=0;i<150;i++){
    const stx=(i*173)%W,sty=(i*97)%(H*0.75);
    const a=0.25+Math.sin(bgF*0.02+i)*0.45;
    ctx.globalAlpha=a;ctx.fillStyle='#fff';
    ctx.beginPath();ctx.arc(stx,sty,0.8+(i%2)*0.7,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  // قمر
  ctx.save();ctx.shadowColor='#aaddff';ctx.shadowBlur=30;
  ctx.fillStyle='#ddeeff';ctx.beginPath();ctx.arc(W*0.8,H*0.12,22,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#080020';ctx.beginPath();ctx.arc(W*0.8+8,H*0.12-5,18,0,Math.PI*2);ctx.fill();
  ctx.restore();
  // مدينة (أفق)
  const cols=['#1a1230','#221540','#1a1030','#281848','#1e1438'];
  for(let i=0;i<12;i++){
    const bx=(i*95+bgF*0.3)%( W+100)-50;
    const bh=80+i%4*45+(i%3)*30;
    ctx.fillStyle=cols[i%cols.length];
    ctx.fillRect(bx,H*0.55-bh,75,bh);
    // نوافذ
    ctx.fillStyle='rgba(255,220,100,0.7)';
    for(let wy=H*0.55-bh+8;wy<H*0.55-12;wy+=14){
      for(let wx=bx+6;wx<bx+65;wx+=10){
        if((i+Math.floor(wx)+Math.floor(wy))%3!==0) ctx.fillRect(wx,wy,6,8);
      }
    }
  }
  // أرض
  const grd=ctx.createLinearGradient(0,H*0.55,0,H);
  grd.addColorStop(0,'#1a0a30');grd.addColorStop(1,'#0a0018');
  ctx.fillStyle=grd;ctx.fillRect(0,H*0.55,W,H);
  // قضبان
  ctx.strokeStyle='#333';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(0,H*0.75);ctx.lineTo(W,H*0.75);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,H*0.78);ctx.lineTo(W,H*0.78);ctx.stroke();
  // قطار ديكوري
  const tx=(bgF*1.2)%(W+250)-130;
  ctx.fillStyle='#226622';ctx.fillRect(tx,H*0.7,100,44);
  ctx.fillStyle='#114411';ctx.fillRect(tx,H*0.66,65,22);
  ctx.fillStyle='rgba(255,220,100,0.85)';
  [16,33,52,70].forEach(wx=>ctx.fillRect(tx+wx,H*0.72,10,12));
  ctx.fillStyle='#1a1a1a';
  [12,38,65,88].forEach(wx=>{ctx.beginPath();ctx.arc(tx+wx,H*0.7+44,9,0,Math.PI*2);ctx.fill();});
  // دخان
  for(let s=0;s<4;s++){
    const smx=tx+95,smy=H*0.65-s*22+Math.sin(bgF*0.04+s)*7;
    ctx.globalAlpha=0.45-s*0.1;ctx.fillStyle='#667';
    ctx.beginPath();ctx.arc(smx,smy,9+s*4,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;

  // هالة توهج على العنوان
  const pulse=0.6+Math.sin(bgF*0.04)*0.2;
  ctx.save();ctx.globalAlpha=pulse*0.15;
  const rg=ctx.createRadialGradient(W/2,H*0.25,0,W/2,H*0.25,W*0.35);
  rg.addColorStop(0,'#ff6600');rg.addColorStop(1,'transparent');
  ctx.fillStyle=rg;ctx.fillRect(0,0,W,H*0.5);
  ctx.restore();

  requestAnimationFrame(drawStartBG);
}

// ══════════════════════════════════════════════
//  DAILY MISSIONS (بسيطة)
// ══════════════════════════════════════════════
// (مخفية لكن تُحسب)

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════
showScreen('screenStart');
updateStartStats();
drawStartBG();

// فتح شاشة الشخصيات
document.querySelector('[onclick*="screenChar"]')?.removeAttribute('onclick');
document.querySelectorAll('.btn-secondary').forEach(b=>{
  if(b.textContent.includes('الشخصيات')) b.onclick=()=>{buildChars();showScreen('screenChar');};
});

document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.running)stopMusic();});
window.addEventListener('focus',()=>{if(G.running)startMusic();});
</script>
</body>
</html>
