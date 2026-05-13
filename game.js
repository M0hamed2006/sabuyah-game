// ============================================
// SABUYAH - 3D ENDLESS RUNNER
// "Made with soul in Egypt" 🇪🇬
// ============================================

const CONFIG = {
    LANES: 3,
    LANE_WIDTH: 3.5,
    BASE_SPEED: 0.6,
    MAX_SPEED: 2.0,
    SPEED_INCREMENT: 0.0001,
    JUMP_FORCE: 0.5,
    GRAVITY: 0.02,
    SLIDE_DURATION: 600,
    BOOST_SPEED: 1.5,
    BOOST_DURATION: 4000,
    CHASER_BASE_DISTANCE: 30,
    ENVIRONMENT_SWITCH: 1500,
    FOG_START: 80,
    FOG_END: 160,
    DRAW_DISTANCE: 200
};

const ENVIRONMENTS = {
    city: {
        name: 'المدينة',
        skyColor: 0x87CEEB,
        fogColor: 0xB8D4E3,
        fogDensity: 0.008,
        groundColor: 0x555555,
        buildingColors: [0xE8D5B7, 0xD4C4A8, 0xC9B896, 0xB8A888, 0xD9C9A9],
        lightColor: 0xFFF5E1,
        lightIntensity: 1.2,
        ambientIntensity: 0.8
    },
    desert: {
        name: 'الصحراء',
        skyColor: 0xFFD89B,
        fogColor: 0xE8C98F,
        fogDensity: 0.012,
        groundColor: 0xC2A878,
        buildingColors: [0xD4A76A, 0xC19A6B, 0xB8936A],
        lightColor: 0xFFE8C8,
        lightIntensity: 1.4,
        ambientIntensity: 0.9
    },
    night: {
        name: 'الليل',
        skyColor: 0x1a1a3a,
        fogColor: 0x2a2a4a,
        fogDensity: 0.015,
        groundColor: 0x333344,
        buildingColors: [0x4a4a6a, 0x5a5a7a, 0x3a3a5a],
        lightColor: 0xaaaaff,
        lightIntensity: 0.6,
        ambientIntensity: 0.4
    }
};

let gameState = {
    running: false,
    score: 0,
    coins: 0,
    distance: 0,
    speed: CONFIG.BASE_SPEED,
    level: 1,
    environment: 'city',
    boostActive: false,
    boostMeter: 0
};

let scene, camera, renderer;
let player = { group: null, lane: 0, targetLane: 0, vy: 0, isJumping: false, isSliding: false, slideTimer: 0 };
let chaser = { mesh: null, distance: CONFIG.CHASER_BASE_DISTANCE };
let world = { ground: null, buildings: [], obstacles: [], coins: [], powerups: [] };
let clock;

// ============================================
// INITIALIZATION
// ============================================

function init() {
    const container = document.getElementById('game-container');
    
    scene = new THREE.Scene();
    const env = ENVIRONMENTS.city;
    scene.background = new THREE.Color(env.skyColor);
    scene.fog = new THREE.Fog(env.fogColor, CONFIG.FOG_START, CONFIG.FOG_END);

    // CAMERA - closer and more dynamic
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, CONFIG.DRAW_DISTANCE);
    camera.position.set(0, 5, 8); // Closer to player!

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2; // Brighter!

    container.appendChild(renderer.domElement);
    clock = new THREE.Clock();

    setupLights();
    createWorld();
    createPlayer();
    createChaser();

    setupControls();
    animate();
    window.addEventListener('resize', onWindowResize);
}

function setupLights() {
    const env = ENVIRONMENTS[gameState.environment];
    
    // Bright ambient
    const ambient = new THREE.AmbientLight(0xffffff, env.ambientIntensity);
    scene.add(ambient);

    // Hemisphere for natural sky/ground gradient
    const hemi = new THREE.HemisphereLight(0x87CEEB, 0x444444, 0.6);
    scene.add(hemi);

    // Strong directional sun
    const sun = new THREE.DirectionalLight(env.lightColor, env.lightIntensity);
    sun.position.set(15, 30, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 100;
    sun.shadow.camera.left = -20;
    sun.shadow.camera.right = 20;
    sun.shadow.camera.top = 20;
    sun.shadow.camera.bottom = -20;
    sun.shadow.bias = -0.0001;
    scene.add(sun);

    // Fill light from opposite side
    const fill = new THREE.DirectionalLight(0x99ccff, 0.4);
    fill.position.set(-10, 10, -10);
    scene.add(fill);
}

// ============================================
// WORLD CREATION - Better visuals
// ============================================

function createWorld() {
    createGround();
    createBuildings();
}

function createGround() {
    // Main road with better material
    const roadGeo = new THREE.PlaneGeometry(30, 400);
    const roadMat = new THREE.MeshStandardMaterial({ 
        color: 0x444444,
        roughness: 0.8,
        metalness: 0.1
    });
    world.ground = new THREE.Mesh(roadGeo, roadMat);
    world.ground.rotation.x = -Math.PI / 2;
    world.ground.receiveShadow = true;
    scene.add(world.ground);

    // Road markings - dashed lines
    for (let i = -1; i <= 1; i++) {
        for (let z = -200; z < 200; z += 6) {
            const dashGeo = new THREE.PlaneGeometry(0.2, 3);
            const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
            const dash = new THREE.Mesh(dashGeo, dashMat);
            dash.rotation.x = -Math.PI / 2;
            dash.position.set(i * CONFIG.LANE_WIDTH, 0.02, z);
            scene.add(dash);
        }
    }

    // Sidewalks with curbs
    const walkGeo = new THREE.BoxGeometry(4, 0.4, 400);
    const walkMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
    
    [-1, 1].forEach(side => {
        const walk = new THREE.Mesh(walkGeo, walkMat);
        walk.position.set(side * 12, 0.2, 0);
        walk.receiveShadow = true;
        scene.add(walk);

        // Curb
        const curbGeo = new THREE.BoxGeometry(0.3, 0.6, 400);
        const curbMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
        const curb = new THREE.Mesh(curbGeo, curbMat);
        curb.position.set(side * 10, 0.3, 0);
        scene.add(curb);
    });
}

function createBuildings() {
    for (let i = 0; i < 40; i++) {
        spawnBuilding(-i * 10 - 20);
    }
}

function spawnBuilding(z) {
    const env = ENVIRONMENTS[gameState.environment];
    const side = Math.random() > 0.5 ? 1 : -1;
    const dist = 14 + Math.random() * 8;
    
    const width = 4 + Math.random() * 6;
    const height = 6 + Math.random() * 15;
    const depth = 5 + Math.random() * 8;
    
    // Main building
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshLambertMaterial({ 
        color: env.buildingColors[Math.floor(Math.random() * env.buildingColors.length)]
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(side * dist, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Windows grid
    const winRows = Math.floor(height / 2.5);
    const winCols = Math.floor(width / 2);
    
    for (let r = 0; r < winRows; r++) {
        for (let c = 0; c < winCols; c++) {
            const isLit = Math.random() > 0.4;
            const winGeo = new THREE.PlaneGeometry(1, 1.2);
            const winMat = new THREE.MeshBasicMaterial({ 
                color: isLit ? 0xFFF8DC : 0x333344,
                transparent: true,
                opacity: isLit ? 0.9 : 0.5
            });
            const win = new THREE.Mesh(winGeo, winMat);
            win.position.set(
                (c - winCols/2 + 0.5) * 1.8,
                (r - winRows/2 + 0.5) * 2.5 + height/2,
                side > 0 ? -depth/2 - 0.01 : depth/2 + 0.01
            );
            mesh.add(win);
        }
    }
    
    // Roof detail
    if (Math.random() > 0.6) {
        const roofGeo = new THREE.BoxGeometry(width * 0.8, 0.5, depth * 0.8);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = height/2 + 0.25;
        mesh.add(roof);
    }
    
    scene.add(mesh);
    world.buildings.push(mesh);
}

// ============================================
// PLAYER - Bigger and more visible
// ============================================

function createPlayer() {
    player.group = new THREE.Group();
    
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.5 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xdd3333, roughness: 0.6 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2244bb, roughness: 0.6 });
    
    // Bigger head
    const headGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 2.6;
    head.castShadow = true;
    player.group.add(head);
    
    // Cap
    const capGeo = new THREE.BoxGeometry(1, 0.3, 1);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 3.1;
    player.group.add(cap);
    
    // Eyes (bigger)
    const eyeGeo = new THREE.PlaneGeometry(0.15, 0.12);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    [-1, 1].forEach(side => {
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(side * 0.2, 2.65, 0.46);
        player.group.add(eye);
    });
    
    // Body
    const bodyGeo = new THREE.BoxGeometry(1.1, 1.3, 0.6);
    const body = new THREE.Mesh(bodyGeo, shirtMat);
    body.position.y = 1.6;
    body.castShadow = true;
    player.group.add(body);
    
    // Backpack
    const packGeo = new THREE.BoxGeometry(0.7, 1, 0.4);
    const packMat = new THREE.MeshStandardMaterial({ color: 0x4488cc });
    const pack = new THREE.Mesh(packGeo, packMat);
    pack.position.set(0, 1.7, -0.5);
    player.group.add(pack);
    
    // Arms
    const armGeo = new THREE.BoxGeometry(0.3, 1.1, 0.3);
    [-1, 1].forEach((side, i) => {
        const arm = new THREE.Mesh(armGeo, skinMat);
        arm.position.set(side * 0.8, 1.7, 0);
        arm.castShadow = true;
        arm.name = i === 0 ? 'leftArm' : 'rightArm';
        player.group.add(arm);
    });
    
    // Legs
    const legGeo = new THREE.BoxGeometry(0.4, 1.3, 0.4);
    [-1, 1].forEach((side, i) => {
        const leg = new THREE.Mesh(legGeo, pantsMat);
        leg.position.set(side * 0.3, 0.65, 0);
        leg.castShadow = true;
        leg.name = i === 0 ? 'leftLeg' : 'rightLeg';
        player.group.add(leg);
    });
    
    // Shoes
    const shoeGeo = new THREE.BoxGeometry(0.5, 0.25, 0.6);
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    [-1, 1].forEach(side => {
        const shoe = new THREE.Mesh(shoeGeo, shoeMat);
        shoe.position.set(side * 0.3, 0, 0.1);
        player.group.add(shoe);
    });
    
    scene.add(player.group);
}

// ============================================
// CHASER
// ============================================

function createChaser() {
    chaser.mesh = new THREE.Group();
    
    const bodyGeo = new THREE.BoxGeometry(1.8, 3, 1.2);
    const bodyMat = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.3
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.5;
    chaser.mesh.add(body);
    
    // Glowing eyes
    const eyeGeo = new THREE.SphereGeometry(0.2);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    [-1, 1].forEach(side => {
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(side * 0.4, 2.5, 0.6);
        chaser.mesh.add(eye);
    });
    
    chaser.mesh.visible = false;
    scene.add(chaser.mesh);
}

// ============================================
// CONTROLS
// ============================================

function setupControls() {
    window.addEventListener('keydown', (e) => {
        if (!gameState.running) return;
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
                moveLane(-1);
                break;
            case 'ArrowRight':
            case 'd':
                moveLane(1);
                break;
            case 'ArrowUp':
            case ' ':
            case 'w':
                jump();
                break;
            case 'ArrowDown':
            case 's':
                slide();
                break;
            case 'Shift':
                activateBoost();
                break;
        }
    });

    let touchStartX = 0, touchStartY = 0;
    
    window.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        if (!gameState.running) return;
        
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        
        if (Math.abs(dx) > 40 || Math.abs(dy) > 40) {
            if (Math.abs(dx) > Math.abs(dy)) {
                moveLane(dx > 0 ? 1 : -1);
            } else {
                dy < 0 ? jump() : slide();
            }
        } else {
            jump(); // Tap to jump
        }
    }, { passive: true });
}

function moveLane(dir) {
    const newLane = player.targetLane + dir;
    if (newLane >= -1 && newLane <= 1) {
        player.targetLane = newLane;
    }
}

function jump() {
    if (!player.isJumping) {
        player.vy = CONFIG.JUMP_FORCE;
        player.isJumping = true;
        if (sabuyahAudio) sabuyahAudio.playJump();
    }
}

function slide() {
    if (!player.isSliding && !player.isJumping) {
        player.isSliding = true;
        player.slideTimer = CONFIG.SLIDE_DURATION;
        player.group.scale.y = 0.4;
        player.group.position.y = -0.8;
        if (sabuyahAudio) sabuyahAudio.playSlide();
    }
}

function activateBoost() {
    if (gameState.boostMeter >= 100 && !gameState.boostActive) {
        gameState.boostActive = true;
        gameState.boostMeter = 0;
        if (sabuyahAudio) sabuyahAudio.playBoost();
        
        setTimeout(() => {
            gameState.boostActive = false;
        }, CONFIG.BOOST_DURATION);
    }
}

// ============================================
// SPAWNING
// ============================================

function spawnObstacle() {
    if (!gameState.running) return;
    
    const lane = Math.floor(Math.random() * 3) - 1;
    const type = Math.random() > 0.5 ? 'train' : 'car';
    let mesh;
    
    if (type === 'train') {
        const geo = new THREE.BoxGeometry(2.5, 3.5, 10);
        const mat = new THREE.MeshStandardMaterial({ color: 0x228822, roughness: 0.4 });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(lane * CONFIG.LANE_WIDTH, 1.75, -100);
        
        // Windows
        for (let i = 0; i < 4; i++) {
            const winGeo = new THREE.PlaneGeometry(2, 1);
            const winMat = new THREE.MeshBasicMaterial({ color: 0x87CEEB });
            const win = new THREE.Mesh(winGeo, winMat);
            win.position.set(0, 0.5, -3.75 + i * 2.5);
            mesh.add(win);
        }
        
        mesh.userData = { type: 'train', lane: lane, bbox: new THREE.Box3() };
    } else {
        const geo = new THREE.BoxGeometry(2, 1.5, 4);
        const colors = [0xcc2222, 0x2244cc, 0xccaa22, 0xffffff];
        const mat = new THREE.MeshStandardMaterial({ 
            color: colors[Math.floor(Math.random() * colors.length)],
            roughness: 0.3,
            metalness: 0.6
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(lane * CONFIG.LANE_WIDTH, 0.75, -100);
        mesh.userData = { type: 'car', lane: lane, bbox: new THREE.Box3() };
    }
    
    mesh.castShadow = true;
    scene.add(mesh);
    world.obstacles.push(mesh);
}

function spawnCoin() {
    if (!gameState.running) return;
    
    const lane = Math.floor(Math.random() * 3) - 1;
    const pattern = Math.random();
    
    if (pattern < 0.5) {
        // Single
        createCoin(lane * CONFIG.LANE_WIDTH, 1, -100);
    } else {
        // Line
        for (let i = 0; i < 5; i++) {
            createCoin(lane * CONFIG.LANE_WIDTH, 1, -100 - i * 3);
        }
    }
}

function createCoin(x, y, z) {
    const geo = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0xffcc00,
        metalness: 1,
        roughness: 0.2,
        emissive: 0xffaa00,
        emissiveIntensity: 0.4
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, y, z);
    mesh.userData = { isCoin: true, bbox: new THREE.Box3(), baseY: y };
    scene.add(mesh);
    world.coins.push(mesh);
}

// ============================================
// MAIN LOOP
// ============================================

function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();
    
    if (gameState.running) {
        updateGame(delta, time);
        updateVisuals(delta, time);
        checkCollisions();
        updateCamera();
        updateChaser();
    }
    
    renderer.render(scene, camera);
}

function updateGame(delta, time) {
    // Speed
    const speedMult = gameState.boostActive ? CONFIG.BOOST_SPEED : 1;
    gameState.speed = Math.min(CONFIG.MAX_SPEED, CONFIG.BASE_SPEED + gameState.distance * CONFIG.SPEED_INCREMENT);
    const currentSpeed = gameState.speed * speedMult;
    
    gameState.score += currentSpeed;
    gameState.distance += currentSpeed;
    
    // Level
    const newLevel = Math.floor(gameState.distance / CONFIG.ENVIRONMENT_SWITCH) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        switchEnvironment();
    }
    
    // Boost meter
    if (!gameState.boostActive && gameState.boostMeter < 100) {
        gameState.boostMeter = Math.min(100, gameState.boostMeter + 0.03);
    }
    
    // Lane movement
    player.lane += (player.targetLane - player.lane) * 0.1;
    player.group.position.x += (player.targetLane * CONFIG.LANE_WIDTH - player.group.position.x) * 0.12;
    
    // Jump physics
    if (player.isJumping) {
        player.group.position.y += player.vy;
        player.vy -= CONFIG.GRAVITY;
        
        if (player.group.position.y <= 0) {
            player.group.position.y = 0;
            player.isJumping = false;
            player.vy = 0;
        }
    }
    
    // Slide
    if (player.isSliding) {
        player.slideTimer -= delta * 1000;
        if (player.slideTimer <= 0) {
            player.isSliding = false;
            player.group.scale.y = 1;
            player.group.position.y = 0;
        }
    }
    
    // Running animation
    if (!player.isJumping && !player.isSliding) {
        const runSpeed = 12;
        const leftArm = player.group.getObjectByName('leftArm');
        const rightArm = player.group.getObjectByName('rightArm');
        const leftLeg = player.group.getObjectByName('leftLeg');
        const rightLeg = player.group.getObjectByName('rightLeg');
        
        if (leftArm) leftArm.rotation.x = Math.sin(time * runSpeed) * 0.7;
        if (rightArm) rightArm.rotation.x = Math.sin(time * runSpeed + Math.PI) * 0.7;
        if (leftLeg) leftLeg.rotation.x = Math.sin(time * runSpeed + Math.PI) * 0.7;
        if (rightLeg) rightLeg.rotation.x = Math.sin(time * runSpeed) * 0.7;
        
        player.group.position.y = Math.abs(Math.sin(time * runSpeed * 2)) * 0.15;
    } else if (player.isJumping) {
        const leftArm = player.group.getObjectByName('leftArm');
        const rightArm = player.group.getObjectByName('rightArm');
        if (leftArm) leftArm.rotation.x = -1;
        if (rightArm) rightArm.rotation.x = -1;
    }
    
    // Update HUD
    if (ui) ui.updateHUD(gameState.score, gameState.coins, gameState.distance, gameState.level, gameState.boostMeter, 0);
}

function updateVisuals(delta, time) {
    const speed = gameState.speed * (gameState.boostActive ? CONFIG.BOOST_SPEED : 1);
    
    // Move buildings
    world.buildings.forEach(b => {
        b.position.z += speed;
        if (b.position.z > 30) {
            b.position.z -= 400;
            b.position.x = (Math.random() > 0.5 ? 1 : -1) * (14 + Math.random() * 10);
        }
    });
    
    // Move obstacles
    for (let i = world.obstacles.length - 1; i >= 0; i--) {
        const obs = world.obstacles[i];
        obs.position.z += speed;
        
        if (obs.position.z > 20) {
            scene.remove(obs);
            world.obstacles.splice(i, 1);
        }
    }
    
    // Move coins
    for (let i = world.coins.length - 1; i >= 0; i--) {
        const coin = world.coins[i];
        coin.position.z += speed;
        coin.rotation.y += 5 * delta;
        coin.position.y = coin.userData.baseY + Math.sin(time * 3 + coin.position.z * 0.1) * 0.2;
        
        if (coin.position.z > 20) {
            scene.remove(coin);
            world.coins.splice(i, 1);
        }
    }
    
    // Spawn
    if (Math.random() < 0.015) spawnObstacle();
    if (Math.random() < 0.04) spawnCoin();
}

function checkCollisions() {
    const pBox = new THREE.Box3().setFromObject(player.group);
    pBox.expandByScalar(-0.3);
    
    // Obstacles
    for (let i = world.obstacles.length - 1; i >= 0; i--) {
        const obs = world.obstacles[i];
        obs.userData.bbox.setFromObject(obs);
        
        const laneDiff = Math.abs((obs.position.x / CONFIG.LANE_WIDTH) - player.lane);
        if (laneDiff > 0.5) continue;
        
        if (pBox.intersectsBox(obs.userData.bbox)) {
            if (player.isSliding && obs.userData.type === 'car') continue;
            gameOver();
            return;
        }
    }
    
    // Coins
    for (let i = world.coins.length - 1; i >= 0; i--) {
        const coin = world.coins[i];
        coin.userData.bbox.setFromObject(coin);
        
        if (pBox.intersectsBox(coin.userData.bbox)) {
            gameState.coins++;
            gameState.score += 10;
            gameState.boostMeter = Math.min(100, gameState.boostMeter + 2);
            if (sabuyahAudio) sabuyahAudio.playCoin();
            
            scene.remove(coin);
            world.coins.splice(i, 1);
        }
    }
}

function updateCamera() {
    // Smooth follow
    const targetX = player.group.position.x * 0.4;
    const targetY = 5 + player.group.position.y * 0.5;
    const targetZ = gameState.boostActive ? 10 : 8;
    
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    
    // Look at player
    camera.lookAt(player.group.position.x * 0.3, 2, -10);
    
    // FOV for speed feel
    const targetFOV = gameState.boostActive ? 80 : 70;
    camera.fov += (targetFOV - camera.fov) * 0.05;
    camera.updateProjectionMatrix();
}

function updateChaser() {
    if (gameState.distance < 100) {
        chaser.mesh.visible = false;
        return;
    }
    
    chaser.mesh.visible = true;
    
    const catchUp = (gameState.speed * 0.9) - gameState.speed;
    chaser.distance -= catchUp + 0.02;
    chaser.distance = Math.max(3, chaser.distance);
    
    chaser.mesh.position.set(
        player.lane * CONFIG.LANE_WIDTH,
        Math.sin(Date.now() * 0.005) * 0.3,
        player.group.position.z + chaser.distance
    );
    
    const danger = Math.max(0, 100 - (chaser.distance / CONFIG.CHASER_BASE_DISTANCE) * 100);
    if (ui) ui.updateHUD(gameState.score, gameState.coins, gameState.distance, gameState.level, gameState.boostMeter, danger);
    
    if (chaser.distance <= 3) gameOver();
}

function switchEnvironment() {
    const envs = Object.keys(ENVIRONMENTS);
    let newEnv;
    do {
        newEnv = envs[Math.floor(Math.random() * envs.length)];
    } while (newEnv === gameState.environment);
    
    gameState.environment = newEnv;
    const env = ENVIRONMENTS[newEnv];
    
    // Smooth transition
    scene.background.setHex(env.skyColor);
    scene.fog.color.setHex(env.fogColor);
    scene.fog.density = env.fogDensity;
    
    // Update lights
    scene.traverse(child => {
        if (child.isAmbientLight) child.intensity = env.ambientIntensity;
        if (child.isDirectionalLight && child.castShadow) {
            child.color.setHex(env.lightColor);
            child.intensity = env.lightIntensity;
        }
    });
    
    // Update ground
    world.ground.material.color.setHex(env.groundColor);
    
    // Update buildings
    world.buildings.forEach(b => {
        b.material.color.setHex(env.buildingColors[Math.floor(Math.random() * env.buildingColors.length)]);
    });
    
    if (ui) ui.showEnvironmentChange(newEnv);
    if (sabuyahAudio) sabuyahAudio.changeEnvironment(newEnv);
}

// ============================================
// GAME FLOW
// ============================================

function startGame() {
    gameState.running = true;
    gameState.score = 0;
    gameState.coins = 0;
    gameState.distance = 0;
    gameState.speed = CONFIG.BASE_SPEED;
    gameState.level = 1;
    gameState.boostActive = false;
    gameState.boostMeter = 0;
    
    player.lane = 0;
    player.targetLane = 0;
    player.group.position.set(0, 0, 0);
    player.vy = 0;
    player.isJumping = false;
    player.isSliding = false;
    
    chaser.distance = CONFIG.CHASER_BASE_DISTANCE;
    chaser.mesh.visible = false;
    
    // Clear objects
    world.obstacles.forEach(o => scene.remove(o));
    world.obstacles = [];
    world.coins.forEach(c => scene.remove(c));
    world.coins = [];
    
    // Reset environment
    gameState.environment = 'city';
    const env = ENVIRONMENTS.city;
    scene.background.setHex(env.skyColor);
    scene.fog.color.setHex(env.fogColor);
    scene.fog.density = env.fogDensity;
    
    if (ui) {
        ui.showScreen('game');
        ui.setBoostOverlay(false);
    }
    
    if (sabuyahAudio) sabuyahAudio.startMusic('city');
}

function gameOver() {
    gameState.running = false;
    
    if (sabuyahAudio) {
        sabuyahAudio.playCrash();
        sabuyahAudio.stopMusic();
    }
    
    const sessionData = {
        score: gameState.score,
        distance: gameState.distance,
        coins: gameState.coins,
        environment: gameState.environment,
        maxSpeed: gameState.speed
    };
    
    if (ui) ui.showGameOver(gameState.score, gameState.distance, gameState.coins, gameState.speed, sessionData);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================
// START
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    init();
    
    document.getElementById('playBtn')?.addEventListener('click', () => {
        if (sabuyahAudio) sabuyahAudio.init();
        startGame();
    });
    
    document.getElementById('restartBtn')?.addEventListener('click', startGame);
    document.getElementById('menuBtn')?.addEventListener('click', () => {
        if (ui) ui.showScreen('start');
    });
    document.getElementById('boostBtn')?.addEventListener('click', activateBoost);
});

window.startGame = startGame;
window.activateBoost = activateBoost;
