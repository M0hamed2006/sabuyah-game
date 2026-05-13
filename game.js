// ====================================================
// SABUYAH GAME - game.js
// لعبة صابويه - النسخة الاحترافية الكاملة
// ====================================================

// --- المتغيرات العامة ---
let scene, camera, renderer, clock;
let playerGroup, playerBody, playerHead, playerCapMesh;
let leftArm, rightArm, leftLeg, rightLeg;
let eyeL, eyeR;

let obstacles = [], items = [], particles = [], boostRings = [];
let buildings = [], tracks = [], groundTiles = [];
let clouds = [], dustParticles = [];

let score = 0, coins = 0, combo = 0, comboTimer = 0;
let speed = 0.35;
let targetX = 0;
let isJumping = false, playerVY = 0;
let isSliding = false, slideTimer = 0;
let doubleJumpReady = false, doubleJumpUsed = false;
let gameRunning = false;
let boostMeter = 0, isBoosting = false, boostTimer = 0;
let nightMode = false, dayNightTimer = 0;
let frameCount = 0;
let highScore = parseInt(localStorage.getItem('sabuyah_highscore') || '0');
let cameraShake = 0;
let eyeBlinkTimer = 0;
let activeBoosts = {}; // { magnet, shield, doubleJump }

// نظام المسارات الخمسة
const LANES = [-6, -3, 0, 3, 6];
let currentLane = 2; // المسار الأوسط (0 to 4)

// نظام الشخصيات
const CHARACTERS = {
  sabuyah: { color: 0xf4a460, capColor: 0xcc2200, bodyColor: 0x2244aa, name: 'صابويه', ability: 'speed' },
  hammad:  { color: 0x8b5e3c, capColor: 0x225500, bodyColor: 0x884400, name: 'حمادة',  ability: 'shield' }
};
let selectedChar = 'sabuyah';
let selectedSkin = localStorage.getItem('sabuyah_skin') || 'default';

// ====================================================
// تهيئة المشهد الثلاثي الأبعاد
// ====================================================
function initScene() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x87ceeb, 0.012);

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 2, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.getElementById('game-container').appendChild(renderer.domElement);

  clock = new THREE.Clock();

  // إضاءة
  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff4e0, 1.2);
  sun.position.set(10, 30, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 1024;
  sun.shadow.mapSize.height = 1024;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 200;
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  scene.add(sun);
  scene.userData.sun = sun;

  const fill = new THREE.DirectionalLight(0x4488ff, 0.3);
  fill.position.set(-10, 5, 5);
  scene.add(fill);

  // السماء
  const skyGeo = new THREE.SphereGeometry(200, 16, 16);
  const skyMat = new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide });
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);
  scene.userData.sky = sky;

  buildWorld();
  buildPlayer();
  buildHUD();
}

// ====================================================
// بناء العالم (أرض، مسارات، مباني، سحاب)
// ====================================================
function buildWorld() {
  // الأرض
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
  for (let z = -200; z < 20; z += 10) {
    const g = new THREE.Mesh(new THREE.BoxGeometry(25, 0.3, 10), groundMat);
    g.position.set(0, -0.15, z);
    g.receiveShadow = true;
    scene.add(g);
    groundTiles.push(g);
  }

  // القضبان (5 مسارات)
  const railMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
  const sleeperMat = new THREE.MeshLambertMaterial({ color: 0x5c3d1e });
  for (let i = 0; i < 5; i++) {
    const x = LANES[i];
    // 2 قضبان لكل مسار
    [-0.6, 0.6].forEach(dx => {
      for (let z = -200; z < 20; z += 3) {
        const r = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 3.1), railMat);
        r.position.set(x + dx, 0.2, z);
        scene.add(r);
        tracks.push(r);
      }
    });
    // نعالات
    for (let z = -200; z < 20; z += 2) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(2, 0.08, 0.3), sleeperMat);
      s.position.set(x, 0.1, z);
      scene.add(s);
      tracks.push(s);
    }
  }

  // مباني جانبية
  const buildingColors = [0xd4a96a, 0xc4956a, 0xb8860b, 0x8b7355, 0xcd853f];
  for (let i = 0; i < 30; i++) {
    const side = Math.random() > 0.5 ? 1 : -1;
    const h = 5 + Math.random() * 20;
    const w = 3 + Math.random() * 5;
    const mat = new THREE.MeshLambertMaterial({ color: buildingColors[Math.floor(Math.random() * buildingColors.length)] });
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat);
    b.position.set(side * (12 + Math.random() * 8), h / 2, -20 - i * 7);
    b.castShadow = true;
    scene.add(b);
    buildings.push(b);

    // نوافذ مضيئة
    const winMat = new THREE.MeshBasicMaterial({ color: 0xffee88 });
    for (let wy = 1; wy < h - 1; wy += 2) {
      for (let wx = -w / 2 + 0.5; wx < w / 2; wx += 1.5) {
        if (Math.random() > 0.4) {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.7), winMat);
          win.position.set(b.position.x + wx, wy, b.position.z - w / 2 - 0.01);
          scene.add(win);
          buildings.push(win);
        }
      }
    }
  }

  // نخيل وعمود إنارة
  for (let i = 0; i < 20; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const palmGroup = buildPalm(side * 9.5, -10 - i * 10);
    scene.add(palmGroup);
    buildings.push(palmGroup);
  }

  // سحاب
  for (let i = 0; i < 15; i++) {
    const cloud = buildCloud();
    cloud.position.set((Math.random() - 0.5) * 80, 25 + Math.random() * 10, -20 - Math.random() * 150);
    scene.add(cloud);
    clouds.push(cloud);
  }
}

function buildPalm(x, z) {
  const g = new THREE.Group();
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 4, 6), trunkMat);
  trunk.position.y = 2;
  g.add(trunk);
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x228b22 });
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2, 4), leafMat);
    const angle = (i / 6) * Math.PI * 2;
    leaf.position.set(Math.cos(angle) * 0.8, 4.5, Math.sin(angle) * 0.8);
    leaf.rotation.z = Math.cos(angle) * 0.5;
    leaf.rotation.x = Math.sin(angle) * 0.5;
    g.add(leaf);
  }
  g.position.set(x, 0, z);
  return g;
}

function buildCloud() {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  [0, 1.2, -1.2, 0.6, -0.6].forEach((dx, i) => {
    const r = 0.8 + Math.random() * 0.6;
    const s = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 6), mat);
    s.position.set(dx, (i === 0 ? 0 : -0.3), 0);
    g.add(s);
  });
  return g;
}

// ====================================================
// بناء الشخصية (صابويه)
// ====================================================
function buildPlayer() {
  playerGroup = new THREE.Group();
  const char = CHARACTERS[selectedChar];

  // جسم
  const bodyMat = new THREE.MeshLambertMaterial({ color: char.bodyColor });
  playerBody = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.6), bodyMat);
  playerBody.position.y = 1.25;
  playerBody.castShadow = true;
  playerGroup.add(playerBody);

  // رأس
  const headMat = new THREE.MeshLambertMaterial({ color: char.color });
  playerHead = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), headMat);
  playerHead.position.y = 2.45;
  playerHead.castShadow = true;
  playerGroup.add(playerHead);

  // طربوش/كاب
  const capMat = new THREE.MeshLambertMaterial({ color: char.capColor });
  playerCapMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.5, 8), capMat);
  playerCapMesh.position.y = 3.1;
  playerGroup.add(playerCapMesh);

  // بريم الطاقية
  const brimMat = new THREE.MeshLambertMaterial({ color: char.capColor });
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.08, 8), brimMat);
  brim.position.y = 2.87;
  brim.position.z = 0.15;
  playerGroup.add(brim);

  // عيون
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  eyeL = new THREE.Group();
  const eL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), eyeMat);
  const pL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), pupilMat);
  pL.position.z = 0.09;
  eyeL.add(eL); eyeL.add(pL);
  eyeL.position.set(-0.22, 2.5, 0.46);
  playerGroup.add(eyeL);

  eyeR = eyeL.clone();
  eyeR.position.set(0.22, 2.5, 0.46);
  playerGroup.add(eyeR);

  // أبواه
  const limbMat = new THREE.MeshLambertMaterial({ color: char.color });
  const pantsMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
  const shoesMat = new THREE.MeshLambertMaterial({ color: 0x111111 });

  // ذراعان
  leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.1, 0.3), limbMat);
  leftArm.position.set(-0.65, 1.4, 0);
  leftArm.geometry.translate(0, -0.55, 0);
  playerGroup.add(leftArm);

  rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.1, 0.3), limbMat);
  rightArm.position.set(0.65, 1.4, 0);
  rightArm.geometry.translate(0, -0.55, 0);
  playerGroup.add(rightArm);

  // رجلان
  leftLeg = new THREE.Group();
  const lLegUpper = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.7, 0.35), pantsMat);
  lLegUpper.position.y = -0.35;
  const lLegLower = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.6, 0.32), pantsMat);
  lLegLower.position.y = -0.85;
  const lShoe = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.5), shoesMat);
  lShoe.position.set(0, -1.15, 0.08);
  leftLeg.add(lLegUpper); leftLeg.add(lLegLower); leftLeg.add(lShoe);
  leftLeg.position.set(-0.28, 0.5, 0);
  playerGroup.add(leftLeg);

  rightLeg = leftLeg.clone();
  rightLeg.position.set(0.28, 0.5, 0);
  playerGroup.add(rightLeg);

  playerGroup.position.set(0, 0, 0);
  scene.add(playerGroup);

  // ظل اللاعب
  const shadowGeo = new THREE.CircleGeometry(0.6, 16);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
  const playerShadow = new THREE.Mesh(shadowGeo, shadowMat);
  playerShadow.rotation.x = -Math.PI / 2;
  playerShadow.position.y = 0.01;
  playerGroup.add(playerShadow);
  playerGroup.userData.shadow = playerShadow;
}

// ====================================================
// HUD داخل المشهد (نص 3D)
// ====================================================
function buildHUD() {
  // التحديث يتم عبر DOM
}

// ====================================================
// نظام الجسيمات
// ====================================================
function spawnCoinParticles(x, y, z) {
  for (let i = 0; i < 8; i++) {
    const geo = new THREE.SphereGeometry(0.08, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    const p = new THREE.Mesh(geo, mat);
    p.position.set(x, y, z);
    p.userData = {
      vx: (Math.random() - 0.5) * 0.15,
      vy: Math.random() * 0.15 + 0.05,
      vz: (Math.random() - 0.5) * 0.15,
      life: 1.0,
      type: 'coin'
    };
    scene.add(p);
    particles.push(p);
  }
}

function spawnCrashParticles(x, y, z) {
  for (let i = 0; i < 20; i++) {
    const colors = [0xff4400, 0xff8800, 0xffcc00, 0xffffff];
    const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const mat = new THREE.MeshBasicMaterial({ color: colors[Math.floor(Math.random() * colors.length)] });
    const p = new THREE.Mesh(geo, mat);
    p.position.set(x, y, z);
    p.userData = {
      vx: (Math.random() - 0.5) * 0.4,
      vy: Math.random() * 0.3 + 0.1,
      vz: (Math.random() - 0.5) * 0.4,
      vRot: (Math.random() - 0.5) * 0.3,
      life: 1.5,
      type: 'crash'
    };
    scene.add(p);
    particles.push(p);
  }
}

function spawnBoostRing() {
  const geo = new THREE.TorusGeometry(1.2, 0.08, 8, 24);
  const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
  const ring = new THREE.Mesh(geo, mat);
  ring.position.copy(playerGroup.position);
  ring.position.y = 1.5;
  ring.userData = { life: 1.0, scale: 1 };
  scene.add(ring);
  boostRings.push(ring);
}

function spawnDustParticle() {
  const geo = new THREE.SphereGeometry(0.05 + Math.random() * 0.1, 4, 4);
  const mat = new THREE.MeshBasicMaterial({ color: 0xc4a882, transparent: true, opacity: 0.5 });
  const p = new THREE.Mesh(geo, mat);
  const laneX = LANES[currentLane];
  p.position.set(laneX + (Math.random() - 0.5) * 2, 0.1, playerGroup.position.z - 1 - Math.random() * 2);
  p.userData = {
    vx: (Math.random() - 0.5) * 0.05,
    vy: Math.random() * 0.03,
    vz: Math.random() * 0.05,
    life: 1.2,
    type: 'dust'
  };
  scene.add(p);
  dustParticles.push(p);
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.userData.life -= dt * 1.5;
    p.position.x += p.userData.vx;
    p.position.y += p.userData.vy;
    p.position.z += p.userData.vz;
    if (p.userData.type === 'crash') {
      p.userData.vy -= 0.01;
      p.rotation.x += p.userData.vRot;
    }
    p.material.opacity = Math.max(0, p.userData.life);
    p.material.transparent = true;
    if (p.userData.life <= 0) {
      scene.remove(p);
      particles.splice(i, 1);
    }
  }

  for (let i = boostRings.length - 1; i >= 0; i--) {
    const r = boostRings[i];
    r.userData.life -= dt * 2;
    r.userData.scale += dt * 3;
    r.scale.set(r.userData.scale, r.userData.scale, r.userData.scale);
    r.material.opacity = Math.max(0, r.userData.life * 0.8);
    if (r.userData.life <= 0) {
      scene.remove(r);
      boostRings.splice(i, 1);
    }
  }

  for (let i = dustParticles.length - 1; i >= 0; i--) {
    const p = dustParticles[i];
    p.userData.life -= dt;
    p.position.x += p.userData.vx;
    p.position.y += p.userData.vy;
    p.position.z += p.userData.vz;
    p.material.opacity = Math.max(0, p.userData.life * 0.5);
    if (p.userData.life <= 0) {
      scene.remove(p);
      dustParticles.splice(i, 1);
    }
  }
}

// ====================================================
// العقبات (قطارات + عربات + حواجز + جمال)
// ====================================================
function spawnObstacle() {
  if (!gameRunning) return;
  const lane = Math.floor(Math.random() * 5);
  const type = Math.random();
  let mesh;

  if (type < 0.4) {
    // قطار حقيقي (3 عربات)
    mesh = buildTrain(LANES[lane]);
  } else if (type < 0.65) {
    // سيارة / تاكسي
    mesh = buildCar(LANES[lane]);
  } else if (type < 0.8) {
    // حاجز/أسلاك
    mesh = buildBarrier(LANES[lane]);
  } else {
    // جمل مينيكاريكاتور
    mesh = buildCamel(LANES[lane]);
  }

  mesh.position.z = -90;
  mesh.userData.lane = lane;
  mesh.userData.bbox = new THREE.Box3();
  scene.add(mesh);
  obstacles.push(mesh);
}

function buildTrain(x) {
  const g = new THREE.Group();
  const trainColors = [0x228822, 0x226699, 0xaa2222, 0x884400];
  const col = trainColors[Math.floor(Math.random() * trainColors.length)];

  for (let c = 0; c < 3; c++) {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.8, 5),
      new THREE.MeshLambertMaterial({ color: col })
    );
    body.position.set(0, 1.4, -c * 5.2);
    body.castShadow = true;

    // نوافذ
    const winMat = new THREE.MeshBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.8 });
    for (let wy = 0.8; wy <= 1.8; wy += 0.9) {
      for (let wz = -1.5; wz <= 1.5; wz += 1.2) {
        const w = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), winMat);
        w.position.set(1.21, wy, wz);
        body.add(w);
        const w2 = w.clone();
        w2.position.set(-1.21, wy, wz);
        w2.rotation.y = Math.PI;
        body.add(w2);
      }
    }

    // عجلات
    const wheelMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
    [-1.5, 1.5].forEach(wz => {
      [-1, 1].forEach(wx => {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.2, 12), wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(wx * 1.3, 0.4, wz + body.position.z);
        wheel.userData.isWheel = true;
        g.add(wheel);
      });
    });

    g.add(body);
  }

  // مدخنة + دخان
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.6, 8), new THREE.MeshLambertMaterial({ color: 0x333333 }));
  chimney.position.set(0, 3.1, -10.4);
  g.add(chimney);

  g.position.set(x, 0, 0);
  g.userData = { type: 'train', wheelRot: 0, smokeTimer: 0 };
  return g;
}

function buildCar(x) {
  const g = new THREE.Group();
  const carColors = [0xccaa22, 0xff4400, 0x4444cc, 0xffffff, 0x888888];
  const col = carColors[Math.floor(Math.random() * carColors.length)];

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 4), new THREE.MeshLambertMaterial({ color: col }));
  body.position.y = 0.6;
  body.castShadow = true;
  g.add(body);

  const top = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 2.2), new THREE.MeshLambertMaterial({ color: col }));
  top.position.set(0, 1.4, -0.3);
  g.add(top);

  const winMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
  const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), winMat);
  windshield.position.set(0, 1.4, 0.8);
  g.add(windshield);

  // عجلات
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  [[-0.9, 1.2], [0.9, 1.2], [-0.9, -1.2], [0.9, -1.2]].forEach(([wx, wz]) => {
    const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.15, 10), wheelMat);
    wh.rotation.z = Math.PI / 2;
    wh.position.set(wx, 0.3, wz);
    g.add(wh);
  });

  // مصابيح
  const headMat = new THREE.MeshBasicMaterial({ color: 0xffffee });
  [[0.55, 0.65, 2.01], [-0.55, 0.65, 2.01]].forEach(([lx, ly, lz]) => {
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), headMat);
    hl.position.set(lx, ly, lz);
    g.add(hl);
  });

  g.position.set(x, 0, 0);
  g.userData = { type: 'car', wheelRot: 0 };
  return g;
}

function buildBarrier(x) {
  const g = new THREE.Group();
  // حاجز معدني
  const mat = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
  const mat2 = new THREE.MeshLambertMaterial({ color: 0xcc2200 });
  for (let i = -1; i <= 1; i += 2) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.5, 6), mat);
    post.position.set(i * 0.8, 0.75, 0);
    g.add(post);
  }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 0.15), mat2);
  bar.position.y = 1.2;
  g.add(bar);
  const bar2 = bar.clone();
  bar2.position.y = 0.7;
  g.add(bar2);

  // أسلاك شائكة
  const wireMat = new THREE.LineBasicMaterial({ color: 0x888888 });
  const wireGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-1, 1.4, 0), new THREE.Vector3(1, 1.4, 0)]);
  const wire = new THREE.Line(wireGeo, wireMat);
  g.add(wire);

  g.position.set(x, 0, 0);
  g.userData = { type: 'barrier' };
  return g;
}

function buildCamel(x) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: 0xc4a363 });

  // جسم
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 2), mat);
  body.position.y = 1.2;
  g.add(body);

  // رأس
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.6), mat);
  head.position.set(0, 1.8, 1.1);
  g.add(head);

  // رقبة
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.3), mat);
  neck.position.set(0, 1.4, 0.85);
  g.add(neck);

  // سنام
  const hump = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), mat);
  hump.position.set(0, 1.85, -0.2);
  g.add(hump);

  // أرجل
  const legMat = new THREE.MeshLambertMaterial({ color: 0xb8936a });
  [[-0.4, 0.7], [0.4, 0.7], [-0.4, -0.7], [0.4, -0.7]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), legMat);
    leg.position.set(lx, 0.4, lz);
    g.add(leg);
  });

  // عيون كاريكاتورية
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  [[-0.15, 0], [0.15, 0]].forEach(([ex]) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeMat);
    eye.position.set(ex, 2.0, 1.41);
    g.add(eye);
  });

  g.position.set(x, 0, 0);
  g.userData = { type: 'camel', walkAnim: 0 };
  return g;
}

// ====================================================
// العملات (فلوس مصرية بدل ذهب)
// ====================================================
function spawnCoin() {
  if (!gameRunning) return;
  const lane = Math.floor(Math.random() * 5);
  const geo = new THREE.CylinderGeometry(0.4, 0.4, 0.08, 16);
  const mat = new THREE.MeshLambertMaterial({ color: 0x22bb22, emissive: 0x006600 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(LANES[lane], 1.2, -90);

  // علامة الجنيه
  const markMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), markMat);
  mark.position.z = 0.05;
  mesh.add(mark);

  mesh.userData = { isCoin: true, bbox: new THREE.Box3(), lane };
  scene.add(mesh);
  items.push(mesh);
}

// ====================================================
// عناصر معززة (Powerups)
// ====================================================
function spawnPowerup() {
  if (!gameRunning) return;
  const types = ['magnet', 'shield', 'doubleJump', 'boost'];
  const type = types[Math.floor(Math.random() * types.length)];
  const lane = Math.floor(Math.random() * 5);
  const colors = { magnet: 0xff00ff, shield: 0x00ffff, doubleJump: 0xffaa00, boost: 0xff4400 };

  const geo = new THREE.OctahedronGeometry(0.5);
  const mat = new THREE.MeshLambertMaterial({ color: colors[type], emissive: colors[type], emissiveIntensity: 0.5 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(LANES[lane], 1.5, -90);
  mesh.userData = { isPowerup: true, powerType: type, bbox: new THREE.Box3(), lane };
  scene.add(mesh);
  items.push(mesh);
}

// ====================================================
// دخان القطارات
// ====================================================
function spawnTrainSmoke(x, y, z) {
  for (let i = 0; i < 3; i++) {
    const geo = new THREE.SphereGeometry(0.2 + Math.random() * 0.2, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0xdddddd, transparent: true, opacity: 0.6 });
    const p = new THREE.Mesh(geo, mat);
    p.position.set(x + (Math.random() - 0.5) * 0.3, y, z);
    p.userData = {
      vx: (Math.random() - 0.5) * 0.02,
      vy: 0.04 + Math.random() * 0.03,
      vz: 0.02,
      life: 2.0,
      type: 'smoke'
    };
    scene.add(p);
    particles.push(p);
  }
}

// ====================================================
// نظام الصوت (Web Audio API)
// ====================================================
let audioCtx;
let musicNodes = {};
let musicInterval;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function startMusic() {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  stopMusic();

  // إيقاع إلكتروشعبي مصري
  const bpm = 140;
  const beat = 60 / bpm;

  const patterns = [
    { note: 150, dur: 0.08, time: 0 },
    { note: 100, dur: 0.06, time: beat * 0.5 },
    { note: 200, dur: 0.05, time: beat },
    { note: 120, dur: 0.08, time: beat * 1.5 },
    { note: 80,  dur: 0.1,  time: beat * 2 },
    { note: 180, dur: 0.06, time: beat * 2.5 },
    { note: 150, dur: 0.08, time: beat * 3 },
  ];

  let startTime = audioCtx.currentTime + 0.1;
  const barLength = beat * 4;

  function scheduleBar() {
    if (!gameRunning) return;
    const t = startTime;
    patterns.forEach(p => {
      // طبلة (kick)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(p.note * (isBoosting ? 1.5 : 1), t + p.time);
      osc.frequency.exponentialRampToValueAtTime(20, t + p.time + p.dur);
      gain.gain.setValueAtTime(0.4, t + p.time);
      gain.gain.exponentialRampToValueAtTime(0.001, t + p.time + p.dur);
      osc.start(t + p.time); osc.stop(t + p.time + p.dur + 0.01);
    });

    // ميلودي بسيطة
    const melody = [392, 440, 523, 440, 392, 349, 392, 440];
    melody.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass'; filter.frequency.value = 800;
      osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
      osc.type = 'sawtooth';
      osc.frequency.value = freq * (isBoosting ? 1.2 : 1);
      gain.gain.setValueAtTime(0.08, t + i * beat * 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * beat * 0.5 + beat * 0.45);
      osc.start(t + i * beat * 0.5);
      osc.stop(t + i * beat * 0.5 + beat * 0.5);
    });

    startTime += barLength;
    const delay = Math.max(0, (startTime - audioCtx.currentTime - 0.2) * 1000);
    musicInterval = setTimeout(scheduleBar, delay);
  }

  scheduleBar();
}

function stopMusic() {
  if (musicInterval) clearTimeout(musicInterval);
}

function playCoinSound() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);
  gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
  osc.start(); osc.stop(audioCtx.currentTime + 0.15);
}

function playJumpSound() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = 'square';
  osc.frequency.setValueAtTime(300, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
  osc.start(); osc.stop(audioCtx.currentTime + 0.2);
}

function playTrainWhistle() {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(700, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.5);
  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
  osc.start(); osc.stop(audioCtx.currentTime + 0.6);
}

function playPowerupSound() {
  if (!audioCtx) return;
  [500, 700, 900, 1200].forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.08 + 0.1);
    osc.start(audioCtx.currentTime + i * 0.08);
    osc.stop(audioCtx.currentTime + i * 0.08 + 0.12);
  });
}

function playCrashSound() {
  if (!audioCtx) return;
  const bufferSize = audioCtx.sampleRate * 0.4;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const gain = audioCtx.createGain();
  gain.gain.value = 0.5;
  source.connect(gain); gain.connect(audioCtx.destination);
  source.start();
}

function playVoiceover(type) {
  if (!audioCtx) return;
  // تشفير صوتي بدائي عبر نغمات
  const sequences = {
    start:   [{ f: 400, d: 0.1 }, { f: 500, d: 0.1 }, { f: 600, d: 0.15 }, { f: 500, d: 0.1 }],
    gameover:[{ f: 300, d: 0.2 }, { f: 200, d: 0.3 }],
    powerup: [{ f: 800, d: 0.05 }, { f: 1000, d: 0.05 }, { f: 1200, d: 0.08 }]
  };
  const seq = sequences[type] || sequences.start;
  let t = audioCtx.currentTime + 0.05;
  seq.forEach(s => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'sine'; osc.frequency.value = s.f;
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + s.d);
    osc.start(t); osc.stop(t + s.d + 0.01);
    t += s.d + 0.02;
  });
}

// ====================================================
// اللوب الرئيسي (Animate)
// ====================================================
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.getElapsedTime();
  frameCount++;

  if (gameRunning) {
    updatePlayer(dt, time);
    updateWorld(dt, time);
    updateObstacles(dt, time);
    updateItems(dt, time);
    updateParticles(dt);
    updateBoosts(dt);
    updateDayNight(dt);
    updateScore(dt);
    updateCombo(dt);
    updateCameraShake(dt);
    spawnRandomly();
    updateHUD();
  }

  renderer.render(scene, camera);
}

// ====================================================
// تحديث اللاعب
// ====================================================
function updatePlayer(dt, time) {
  // حركة أفقية ناعمة
  const targetLaneX = LANES[currentLane];
  playerGroup.position.x += (targetLaneX - playerGroup.position.x) * 0.18;

  // قفز وجاذبية
  if (isJumping) {
    playerGroup.position.y += playerVY;
    playerVY -= 0.025;
    if (playerGroup.position.y <= 0) {
      playerGroup.position.y = 0;
      isJumping = false;
      playerVY = 0;
      doubleJumpUsed = false;
    }
    // ظل يصغر عند القفز
    if (playerGroup.userData.shadow) {
      const h = playerGroup.position.y;
      playerGroup.userData.shadow.scale.setScalar(Math.max(0.3, 1 - h * 0.08));
      playerGroup.userData.shadow.material.opacity = Math.max(0.05, 0.3 - h * 0.02);
    }
  } else if (playerGroup.userData.shadow) {
    playerGroup.userData.shadow.scale.setScalar(1);
    playerGroup.userData.shadow.material.opacity = 0.3;
  }

  // انزلاق
  if (isSliding) {
    slideTimer -= dt;
    playerGroup.scale.y = 0.5;
    playerGroup.position.y = -0.5;
    if (slideTimer <= 0) {
      isSliding = false;
      playerGroup.scale.y = 1;
      playerGroup.position.y = 0;
    }
  }

  // رمش العيون كل 3 ثوانٍ
  eyeBlinkTimer += dt;
  if (eyeBlinkTimer > 3) {
    eyeBlinkTimer = 0;
    eyeL.scale.y = 0.1; eyeR.scale.y = 0.1;
    setTimeout(() => {
      if (eyeL) { eyeL.scale.y = 1; eyeR.scale.y = 1; }
    }, 120);
  }

  // تحريك الأطراف (جري)
  if (!isJumping && !isSliding) {
    const runSpeed = speed * 18;
    leftArm.rotation.x  = Math.sin(time * runSpeed) * 0.6;
    rightArm.rotation.x = Math.sin(time * runSpeed + Math.PI) * 0.6;
    leftLeg.rotation.x  = Math.sin(time * runSpeed + Math.PI) * 0.7;
    rightLeg.rotation.x = Math.sin(time * runSpeed) * 0.7;
    // تأرجح طفيف في الجسم
    playerBody.rotation.z = Math.sin(time * runSpeed * 0.5) * 0.05;
    playerCapMesh.rotation.z = Math.sin(time * runSpeed * 0.5) * 0.08;
  } else if (isJumping) {
    leftLeg.rotation.x = -0.6; rightLeg.rotation.x = 0.3;
    leftArm.rotation.x = -0.8; rightArm.rotation.x = -0.8;
  }

  // غبار تحت القدمين أثناء الجري
  if (!isJumping && frameCount % 8 === 0) spawnDustParticle();

  // بوست: تحليق وحلقات
  if (isBoosting) {
    boostTimer -= dt;
    if (boostTimer <= 0) {
      isBoosting = false;
      boostMeter = 0;
      document.getElementById('boostBar').style.width = '0%';
    }
    if (frameCount % 6 === 0) spawnBoostRing();
    playerGroup.position.y = Math.sin(time * 5) * 0.5 + 1.5;
  }

  // مغناطيس: جذب العملات
  if (activeBoosts.magnet && activeBoosts.magnet > 0) {
    items.forEach(item => {
      if (item.userData.isCoin) {
        const dist = playerGroup.position.distanceTo(item.position);
        if (dist < 8) {
          const dir = new THREE.Vector3().subVectors(playerGroup.position, item.position).normalize();
          item.position.addScaledVector(dir, 0.2);
        }
      }
    });
  }
}

// ====================================================
// تحديث العالم (مباني، سحاب، قضبان)
// ====================================================
function updateWorld(dt, time) {
  const moveZ = speed;

  buildings.forEach(b => {
    b.position.z += moveZ;
    if (b.position.z > 25) b.position.z -= 250;
  });

  groundTiles.forEach(g => {
    g.position.z += moveZ;
    if (g.position.z > 15) g.position.z -= 220;
  });

  clouds.forEach((c, i) => {
    c.position.z += moveZ * 0.3;
    c.position.x += Math.sin(time * 0.2 + i) * 0.005;
    if (c.position.z > 30) c.position.z -= 180;
  });

  // لا نحرك tracks لأنها ديناميكية في buildWorld
}

// ====================================================
// تحديث العقبات
// ====================================================
function updateObstacles(dt, time) {
  const pBox = new THREE.Box3().setFromObject(playerGroup);
  pBox.expandByScalar(-0.25);

  const hasShield = activeBoosts.shield && activeBoosts.shield > 0;

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.position.z += speed * (isBoosting ? 2.5 : 1);
    obs.userData.bbox.setFromObject(obs);

    // تدوير عجلات القطار/السيارة
    if (obs.userData.type === 'train' || obs.userData.type === 'car') {
      obs.traverse(child => {
        if (child.userData && child.userData.isWheel) {
          child.rotation.x += speed * 0.5;
        }
      });
    }

    // دخان القطار كل فترة
    if (obs.userData.type === 'train') {
      obs.userData.smokeTimer = (obs.userData.smokeTimer || 0) + dt;
      if (obs.userData.smokeTimer > 0.5) {
        obs.userData.smokeTimer = 0;
        spawnTrainSmoke(obs.position.x, 3.5, obs.position.z - 10.5);
      }
      // صفارة لما تقترب
      if (obs.position.z > -15 && obs.position.z < -12 && !obs.userData.whistled) {
        obs.userData.whistled = true;
        playTrainWhistle();
      }
    }

    // تحريك الجمل
    if (obs.userData.type === 'camel') {
      obs.userData.walkAnim += dt * 5;
      obs.traverse(child => {
        if (child.geometry && child.geometry.type === 'BoxGeometry' && child.position.y < 0.6) {
          child.rotation.x = Math.sin(obs.userData.walkAnim + child.position.x) * 0.3;
        }
      });
    }

    // اصطدام
    if (!hasShield && pBox.intersectsBox(obs.userData.bbox)) {
      handleCrash(obs);
      return;
    }

    // إزالة لو عدت
    if (obs.position.z > 20) {
      scene.remove(obs);
      obstacles.splice(i, 1);
    }
  }
}

// ====================================================
// تحديث العملات والعناصر المعززة
// ====================================================
function updateItems(dt, time) {
  const pBox = new THREE.Box3().setFromObject(playerGroup);
  pBox.expandByScalar(0.3);

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    item.position.z += speed * (isBoosting ? 2.5 : 1);
    item.rotation.y += dt * 3;
    item.userData.bbox.setFromObject(item);

    // تحرك طفيف لأعلى وأسفل
    item.position.y = 1.2 + Math.sin(time * 3 + i) * 0.15;

    if (pBox.intersectsBox(item.userData.bbox)) {
      if (item.userData.isCoin) {
        coins++;
        combo++;
        comboTimer = 3;
        boostMeter = Math.min(100, boostMeter + 5);
        spawnCoinParticles(item.position.x, item.position.y, item.position.z);
        playCoinSound();
        updateHUD();
      } else if (item.userData.isPowerup) {
        activatePowerup(item.userData.powerType);
        spawnBoostRing();
        playPowerupSound();
        playVoiceover('powerup');
      }
      scene.remove(item);
      items.splice(i, 1);
      continue;
    }

    if (item.position.z > 20) {
      scene.remove(item);
      items.splice(i, 1);
    }
  }
}

// ====================================================
// تفعيل العناصر المعززة
// ====================================================
function activatePowerup(type) {
  switch (type) {
    case 'magnet':
      activeBoosts.magnet = 8;
      showPowerupUI('🧲 مغناطيس!', '#ff00ff');
      break;
    case 'shield':
      activeBoosts.shield = 5;
      showPowerupUI('🛡️ درع!', '#00ffff');
      // حلقة دفاع مرئية
      if (!playerGroup.userData.shieldMesh) {
        const sg = new THREE.SphereGeometry(1.8, 12, 12);
        const sm = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.25, wireframe: true });
        const shield = new THREE.Mesh(sg, sm);
        shield.position.y = 1.5;
        playerGroup.add(shield);
        playerGroup.userData.shieldMesh = shield;
      }
      break;
    case 'doubleJump':
      doubleJumpReady = true;
      activeBoosts.doubleJump = 10;
      showPowerupUI('⬆️ قفز مزدوج!', '#ffaa00');
      break;
    case 'boost':
      isBoosting = true;
      boostTimer = 5;
      showPowerupUI('🚀 انطلاق!', '#ff4400');
      break;
  }
}

function updateBoosts(dt) {
  ['magnet', 'shield', 'doubleJump'].forEach(type => {
    if (activeBoosts[type] && activeBoosts[type] > 0) {
      activeBoosts[type] -= dt;
      if (activeBoosts[type] <= 0) {
        activeBoosts[type] = 0;
        if (type === 'shield' && playerGroup.userData.shieldMesh) {
          playerGroup.remove(playerGroup.userData.shieldMesh);
          playerGroup.userData.shieldMesh = null;
        }
        if (type === 'doubleJump') doubleJumpReady = false;
      }
    }
  });
}

// ====================================================
// تحديث النهار والليل
// ====================================================
function updateDayNight(dt) {
  dayNightTimer += dt;
  if (dayNightTimer > 300) { // كل 5 دقائق
    dayNightTimer = 0;
    nightMode = !nightMode;
    const targetColor = nightMode ? new THREE.Color(0x0a0a2a) : new THREE.Color(0x87ceeb);
    scene.fog.color.lerp(targetColor, 0.1);
    scene.userData.sky.material.color.lerp(targetColor, 0.1);
    scene.userData.sun.intensity = nightMode ? 0.2 : 1.2;
    scene.userData.sun.color.set(nightMode ? 0x2233aa : 0xfff4e0);
    document.getElementById('game-container').style.filter = nightMode ? 'brightness(0.7)' : 'brightness(1)';
  }
}

// ====================================================
// تحديث النقاط والكومبو
// ====================================================
function updateScore(dt) {
  const multiplier = (combo >= 10 ? 4 : combo >= 5 ? 2 : 1) * (isBoosting ? 2 : 1);
  score += speed * dt * 100 * multiplier;
  speed += 0.00005;

  if (score > highScore) {
    highScore = Math.floor(score);
    localStorage.setItem('sabuyah_highscore', highScore);
  }
}

function updateCombo(dt) {
  if (comboTimer > 0) {
    comboTimer -= dt;
    if (comboTimer <= 0) combo = 0;
  }
}

// ====================================================
// اهتزاز الكاميرا
// ====================================================
function updateCameraShake(dt) {
  if (cameraShake > 0) {
    cameraShake -= dt * 5;
    camera.position.x = (Math.random() - 0.5) * cameraShake * 0.5;
    camera.position.y = 5 + (Math.random() - 0.5) * cameraShake * 0.3;
  } else {
    cameraShake = 0;
    camera.position.x += (0 - camera.position.x) * 0.1;
    camera.position.y += (5 - camera.position.y) * 0.1;
  }
}

// ====================================================
// توليد عشوائي
// ====================================================
function spawnRandomly() {
  const spawnRate = Math.max(0.005, 0.018 - score * 0.000001);
  if (Math.random() < spawnRate) spawnObstacle();
  if (Math.random() < 0.04) spawnCoin();
  if (Math.random() < 0.003) spawnPowerup();
}

// ====================================================
// اصطدام وانتهاء اللعبة
// ====================================================
function handleCrash(obs) {
  const pos = playerGroup.position;
  spawnCrashParticles(pos.x, pos.y + 1, pos.z);
  playCrashSound();
  playVoiceover('gameover');
  cameraShake = 3;
  setTimeout(() => {
    if (gameRunning) gameOver();
  }, 300);
}

function gameOver() {
  gameRunning = false;
  stopMusic();

  const finalS = Math.floor(score);
  document.getElementById('gameUI').classList.add('hidden');
  document.getElementById('gameOverScreen').classList.remove('hidden');
  document.getElementById('gameOverScreen').classList.add('active');
  document.getElementById('finalScore').innerText = finalS;
  document.getElementById('finalCoins').innerText = coins;
  document.getElementById('highScoreDisplay').innerText = highScore;

  // إنجاز
  if (finalS > 5000) showAchievement('🏆 أسطورة الشبكة!');
  else if (finalS > 2000) showAchievement('⭐ لاعب ممتاز!');

  // حفظ السجل
  const save = { score: finalS, coins, date: new Date().toLocaleDateString('ar-EG'), speed: speed.toFixed(2) };
  localStorage.setItem('sabuyah_last', JSON.stringify(save));
}

// ====================================================
// واجهة المستخدم
// ====================================================
function updateHUD() {
  document.getElementById('scoreVal').innerText = Math.floor(score);
  document.getElementById('coinVal').innerText = coins;
  document.getElementById('speedVal').innerText = (speed * 100).toFixed(0);
  document.getElementById('boostBar').style.width = boostMeter + '%';
  document.getElementById('highScoreHUD').innerText = highScore;

  const comboEl = document.getElementById('comboDisplay');
  if (combo >= 3) {
    comboEl.style.display = 'block';
    comboEl.innerText = `🔥 x${combo}`;
    comboEl.style.fontSize = Math.min(3, 1 + combo * 0.1) + 'rem';
    comboEl.style.color = combo >= 10 ? '#ff4400' : combo >= 5 ? '#ffaa00' : '#ffff00';
  } else {
    comboEl.style.display = 'none';
  }

  // مؤشرات البوست النشطة
  ['magnet', 'shield', 'doubleJump'].forEach(type => {
    const el = document.getElementById(`boost_${type}`);
    if (el) {
      if (activeBoosts[type] && activeBoosts[type] > 0) {
        el.style.opacity = '1';
        el.querySelector('.boost-timer').style.width = (activeBoosts[type] / 10 * 100) + '%';
      } else {
        el.style.opacity = '0.3';
      }
    }
  });
}

function showPowerupUI(text, color) {
  const el = document.createElement('div');
  el.className = 'powerup-popup';
  el.innerText = text;
  el.style.color = color;
  el.style.borderColor = color;
  document.querySelector('.ui-layer').appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

function showAchievement(text) {
  const el = document.createElement('div');
  el.className = 'achievement-popup';
  el.innerText = text;
  document.querySelector('.ui-layer').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ====================================================
// تحكم اللاعب
// ====================================================
function moveLeft() {
  if (currentLane > 0) {
    currentLane--;
    spawnDustParticle();
  }
}

function moveRight() {
  if (currentLane < 4) {
    currentLane++;
    spawnDustParticle();
  }
}

function jump() {
  if (!isJumping) {
    isJumping = true;
    playerVY = 0.42;
    isSliding = false;
    playerGroup.scale.y = 1;
    playJumpSound();
  } else if (doubleJumpReady && !doubleJumpUsed) {
    doubleJumpUsed = true;
    playerVY = 0.35;
    playJumpSound();
    spawnBoostRing();
  }
}

function slide() {
  if (!isJumping && !isSliding) {
    isSliding = true;
    slideTimer = 1.2;
  }
}

function activateBoost() {
  if (boostMeter >= 100 && !isBoosting) {
    isBoosting = true;
    boostTimer = 5;
    showPowerupUI('🚀 انطلاق يا صابويه!', '#ff4400');
  }
}

// ====================================================
// أحداث لوحة المفاتيح واللمس
// ====================================================
window.addEventListener('keydown', (e) => {
  if (!gameRunning) return;
  if (e.key === 'ArrowLeft'  || e.key === 'a' || e.key === 'A') moveLeft();
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') moveRight();
  if (e.key === 'ArrowUp'    || e.key === ' ' || e.key === 'w' || e.key === 'W') jump();
  if (e.key === 'ArrowDown'  || e.key === 's' || e.key === 'S') slide();
  if (e.key === 'b' || e.key === 'B') activateBoost();
  e.preventDefault();
});

let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
window.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  touchStartTime = Date.now();
});
window.addEventListener('touchend', e => {
  if (!gameRunning) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  const dt_touch = Date.now() - touchStartTime;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (Math.abs(dx) > 25) { dx > 0 ? moveRight() : moveLeft(); }
  } else {
    if (dy < -25) jump();
    else if (dy > 25) slide();
    else if (dt_touch < 200) jump(); // نقر سريع = قفز
  }
});

// ====================================================
// بدء وإعادة اللعبة
// ====================================================
function startGame() {
  initAudio();

  // تنظيف العالم
  obstacles.forEach(o => scene.remove(o)); obstacles = [];
  items.forEach(i => scene.remove(i)); items = [];
  particles.forEach(p => scene.remove(p)); particles = [];
  boostRings.forEach(r => scene.remove(r)); boostRings = [];

  // إعادة التعيين
  score = 0; coins = 0; combo = 0; comboTimer = 0;
  speed = 0.35; currentLane = 2; targetX = 0;
  isJumping = false; isSliding = false; playerVY = 0;
  isBoosting = false; boostMeter = 0; boostTimer = 0;
  doubleJumpReady = false; doubleJumpUsed = false;
  activeBoosts = {}; cameraShake = 0;
  frameCount = 0; dayNightTimer = 0;

  playerGroup.position.set(0, 0, 0);
  playerGroup.scale.set(1, 1, 1);
  if (playerGroup.userData.shieldMesh) {
    playerGroup.remove(playerGroup.userData.shieldMesh);
    playerGroup.userData.shieldMesh = null;
  }

  document.getElementById('boostBar').style.width = '0%';
  document.getElementById('scoreVal').innerText = '0';
  document.getElementById('coinVal').innerText = '0';
  document.getElementById('startScreen').classList.remove('active');
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('gameOverScreen').classList.remove('active');
  document.getElementById('gameOverScreen').classList.add('hidden');
  document.getElementById('gameUI').classList.remove('hidden');
  document.getElementById('gameUI').classList.add('active');

  gameRunning = true;
  startMusic();
  playVoiceover('start');
}

// ====================================================
// واجهة HTML الديناميكية (HUD عناصر إضافية)
// ====================================================
function injectExtraUI() {
  const ui = document.querySelector('.ui-layer');

  // إضافة عناصر HUD
  const gameUI = document.getElementById('gameUI');
  gameUI.innerHTML = `
    <div class="hud">
      <div class="score-box">النقاط: <span id="scoreVal">0</span></div>
      <div class="hud-center">
        <div class="boost-container">
          <span class="boost-label">⚡ بوست</span>
          <div class="boost-bg"><div id="boostBar" class="boost-fill"></div></div>
        </div>
        <div id="comboDisplay" class="combo-display" style="display:none">🔥 x0</div>
      </div>
      <div class="coin-box">🪙 <span id="coinVal">0</span></div>
    </div>
    <div class="hud-bottom">
      <div class="speed-box">💨 <span id="speedVal">35</span></div>
      <div class="high-box">🏆 <span id="highScoreHUD">${highScore}</span></div>
      <div class="boost-icons">
        <div id="boost_magnet" class="boost-icon" style="opacity:0.3">🧲<div class="boost-timer-bg"><div class="boost-timer"></div></div></div>
        <div id="boost_shield" class="boost-icon" style="opacity:0.3">🛡️<div class="boost-timer-bg"><div class="boost-timer"></div></div></div>
        <div id="boost_doubleJump" class="boost-icon" style="opacity:0.3">⬆️<div class="boost-timer-bg"><div class="boost-timer"></div></div></div>
      </div>
    </div>
    <div class="touch-controls">
      <button class="touch-btn" ontouchstart="moveLeft()" onclick="moveLeft()">◀</button>
      <div class="touch-center-btns">
        <button class="touch-btn touch-jump" ontouchstart="jump()" onclick="jump()">▲</button>
        <button class="touch-btn touch-slide" ontouchstart="slide()" onclick="slide()">▼</button>
      </div>
      <button class="touch-btn" ontouchstart="moveRight()" onclick="moveRight()">▶</button>
      <button class="touch-btn touch-boost" ontouchstart="activateBoost()" onclick="activateBoost()">⚡</button>
    </div>
  `;

  // تحديث شاشة نهاية اللعبة
  const go = document.getElementById('gameOverScreen');
  go.innerHTML = `
    <div class="glass-card game-over-card">
      <h2>💥 انتهت اللعبة!</h2>
      <div class="stats-grid">
        <div class="stat-item"><span class="stat-icon">🎯</span><span class="stat-label">النقاط</span><span class="stat-val" id="finalScore">0</span></div>
        <div class="stat-item"><span class="stat-icon">🪙</span><span class="stat-label">الجنيهات</span><span class="stat-val" id="finalCoins">0</span></div>
        <div class="stat-item"><span class="stat-icon">🏆</span><span class="stat-label">أعلى نقطة</span><span class="stat-val" id="highScoreDisplay">${highScore}</span></div>
      </div>
      <button id="restartBtn" class="btn-royal">🔄 إعادة المحاولة</button>
      <button id="exportBtn" class="btn-glass">📥 حفظ النتيجة</button>
    </div>
  `;

  document.getElementById('restartBtn').onclick = startGame;
  document.getElementById('exportBtn').onclick = exportScore;

  // CSS إضافي
  const style = document.createElement('style');
  style.textContent = `
    .hud { position:absolute; top:15px; width:100%; display:flex; justify-content:space-between; align-items:flex-start; padding:0 15px; gap:10px; }
    .hud-center { display:flex; flex-direction:column; align-items:center; gap:6px; flex:1; }
    .boost-container { display:flex; align-items:center; gap:8px; background:rgba(0,0,0,0.5); padding:6px 12px; border-radius:20px; }
    .boost-label { color:#ffaa00; font-size:0.85rem; font-weight:bold; }
    .boost-bg { width:120px; height:12px; background:rgba(255,255,255,0.15); border-radius:6px; border:1px solid #ffaa00; overflow:hidden; }
    .boost-fill { height:100%; width:0%; background:linear-gradient(90deg, #ff4400, #ffaa00, #ffff00); border-radius:6px; transition:width 0.2s; }
    .combo-display { font-size:1.5rem; font-weight:900; text-shadow:0 0 10px currentColor; animation:comboPulse 0.3s ease; }
    @keyframes comboPulse { 0%{transform:scale(1.3)} 100%{transform:scale(1)} }
    .hud-bottom { position:absolute; bottom:100px; width:100%; display:flex; justify-content:space-between; padding:0 15px; align-items:center; }
    .speed-box, .high-box { background:rgba(0,0,0,0.45); padding:5px 12px; border-radius:15px; color:#fff; font-size:0.9rem; border:1px solid rgba(255,255,255,0.2); }
    .boost-icons { display:flex; gap:8px; }
    .boost-icon { background:rgba(0,0,0,0.5); border-radius:12px; padding:5px 10px; font-size:1.2rem; position:relative; transition:opacity 0.3s; text-align:center; }
    .boost-timer-bg { width:40px; height:4px; background:rgba(255,255,255,0.2); border-radius:2px; margin-top:3px; }
    .boost-timer { height:100%; background:#00ffff; border-radius:2px; width:0%; transition:width 0.1s; }
    .touch-controls { position:absolute; bottom:15px; width:100%; display:flex; justify-content:space-between; align-items:center; padding:0 10px; pointer-events:auto; }
    .touch-btn { background:rgba(255,255,255,0.15); border:2px solid rgba(255,255,255,0.3); color:#fff; font-size:1.8rem; width:65px; height:65px; border-radius:50%; cursor:pointer; backdrop-filter:blur(5px); transition:0.15s; }
    .touch-btn:active { background:rgba(255,170,0,0.4); transform:scale(0.9); }
    .touch-center-btns { display:flex; flex-direction:column; gap:8px; }
    .touch-jump { border-color:#ffaa00; color:#ffaa00; }
    .touch-slide { border-color:#4488ff; color:#4488ff; }
    .touch-boost { border-color:#ff4400; color:#ff4400; }
    .powerup-popup { position:absolute; top:30%; left:50%; transform:translateX(-50%); font-size:1.8rem; font-weight:900; padding:12px 25px; background:rgba(0,0,0,0.7); border-radius:15px; border:2px solid; pointer-events:none; animation:popupAnim 2s ease forwards; z-index:100; }
    @keyframes popupAnim { 0%{opacity:0;transform:translateX(-50%) translateY(20px) scale(0.8)} 20%{opacity:1;transform:translateX(-50%) translateY(0) scale(1.1)} 40%{transform:translateX(-50%) scale(1)} 80%{opacity:1} 100%{opacity:0;transform:translateX(-50%) translateY(-30px)} }
    .achievement-popup { position:absolute; top:20%; left:50%; transform:translateX(-50%); font-size:1.5rem; font-weight:900; padding:15px 30px; background:linear-gradient(135deg,rgba(20,20,20,0.95),rgba(40,20,0,0.95)); border-radius:15px; border:2px solid #ffaa00; color:#ffaa00; pointer-events:none; animation:achieveAnim 3.5s ease forwards; z-index:100; }
    @keyframes achieveAnim { 0%{opacity:0;transform:translateX(-50%) scale(0.5)} 15%{opacity:1;transform:translateX(-50%) scale(1.05)} 25%{transform:translateX(-50%) scale(1)} 80%{opacity:1} 100%{opacity:0} }
    .game-over-card { min-width:340px; }
    .stats-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:15px; margin:20px 0; }
    .stat-item { display:flex; flex-direction:column; align-items:center; background:rgba(255,255,255,0.05); padding:12px; border-radius:12px; }
    .stat-icon { font-size:1.5rem; }
    .stat-label { font-size:0.75rem; color:#aaa; margin:4px 0; }
    .stat-val { font-size:1.4rem; font-weight:900; color:#ffcc00; }
    .score-box, .coin-box { background:rgba(0,0,0,0.55); padding:8px 16px; border-radius:20px; color:#fff; font-size:1.3rem; font-weight:bold; border:2px solid #ffaa00; }
    .coin-box { color:#ffcc00; border-color:#ffcc00; }
  `;
  document.head.appendChild(style);
}

function exportScore() {
  const data = localStorage.getItem('sabuyah_last') || '{}';
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'sabuyah_score.json'; a.click();
}

// ====================================================
// تهيئة الأزرار في شاشة البداية
// ====================================================
function initUI() {
  document.getElementById('playBtn').onclick = startGame;
  document.getElementById('creditsBtn').onclick = () => {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('creditsScreen').classList.remove('hidden');
    document.getElementById('creditsScreen').classList.add('active');
  };
  document.getElementById('closeCreditsBtn').onclick = () => {
    document.getElementById('creditsScreen').classList.remove('active');
    document.getElementById('creditsScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.remove('hidden');
    document.getElementById('startScreen').classList.add('active');
  };

  // عرض أعلى نقطة في شاشة البداية
  const hs = document.createElement('div');
  hs.style.cssText = 'margin-top:15px;color:#ffcc00;font-size:1.1rem;';
  hs.innerHTML = `🏆 أعلى نقطة: <strong>${highScore}</strong>`;
  document.getElementById('startScreen').appendChild(hs);
}

// ====================================================
// Resize
// ====================================================
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ====================================================
// تشغيل كل شيء
// ====================================================
initScene();
injectExtraUI();
initUI();
animate();

// تجميد المحرك لو الصفحة مخفية
document.addEventListener('visibilitychange', () => {
  if (document.hidden && gameRunning) {
    gameRunning = false;
    stopMusic();
  }
});
