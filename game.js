const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let G = {
  running:false, frame:0, score:0, coins:0,
  lane:2, targetLane:2, px:canvas.width/2, py:canvas.height*0.8,
  jumping:false, jumpVY:0, boostMeter:0, boosting:false, boostTimer:0,
  enemyDist:600, enemyLane:2
};

// واجهة DOM
const el = {
  start: document.getElementById('startScreen'),
  hud: document.getElementById('hud'),
  over: document.getElementById('gameOver'),
  score: document.getElementById('score'),
  coins: document.getElementById('coins'),
  level: document.getElementById('level'),
  dangerFill: document.getElementById('dangerFill'),
  boostFill: document.getElementById('boostFill'),
  finalScore: document.getElementById('finalScore')
};

// بدء اللعبة
document.getElementById('btnPlay').onclick = startGame;
document.getElementById('btnRestart').onclick = startGame;

function startGame(){
  G.running = true; G.score=0; G.coins=0; G.enemyDist=600;
  el.start.classList.add('hidden'); el.over.classList.add('hidden');
  loop();
}

function loop(){
  if(!G.running) return;
  G.frame++;
  update();
  render();
  requestAnimationFrame(loop);
}

function update(){
  G.score += 0.1;
  G.boostMeter = Math.min(100, G.boostMeter+0.05);
  if(G.boosting){ G.boostTimer--; if(G.boostTimer<=0){ G.boosting=false; } }
  G.enemyDist -= 0.3;
  if(G.enemyDist<=0){ endGame(); }
  el.score.textContent = Math.floor(G.score);
  el.coins.textContent = G.coins;
  el.dangerFill.style.width = Math.max(5,(100-G.enemyDist/6))+"%";
  el.boostFill.style.width = G.boostMeter+"%";
}

function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // خلفية بسيطة
  ctx.fillStyle = "#87ceeb"; ctx.fillRect(0,0,canvas.width,canvas.height*0.3);
  ctx.fillStyle = "#444"; ctx.fillRect(0,canvas.height*0.3,canvas.width,canvas.height*0.7);
  // اللاعب
  ctx.fillStyle = "#2244cc"; ctx.fillRect(G.px-20,G.py-40,40,40);
  // العدو
  ctx.fillStyle = "#8B0000"; ctx.fillRect(G.px-20,G.py-G.enemyDist,40,40);
}

function endGame(){
  G.running=false;
  el.finalScore.textContent = Math.floor(G.score);
  el.over.classList.remove('hidden');
}
