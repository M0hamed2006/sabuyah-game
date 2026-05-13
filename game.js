// ============================================
// SABUYAH - 3D ENDLESS RUNNER ENGINE
// "Made with soul in Egypt" 🇪🇬
// 
// Developer: Mohamed Ragab Abdelmonem
// The Small Programmer
// 
// This isn't just code. It's passion, late nights,
// countless cups of tea, and the dream of creating
// something that makes people smile.
// ============================================

// --- CONFIGURATION & CONSTANTS ---
const CONFIG = {
    LANES: 5,                    // 5 lanes instead of 3 (more strategy)
    LANE_WIDTH: 3,               // Distance between lanes
    BASE_SPEED: 0.4,             // Starting speed
    MAX_SPEED: 2.5,              // Max speed cap
    SPEED_INCREMENT: 0.00015,    // Gradual acceleration
    JUMP_FORCE: 0.45,            // Jump power
    GRAVITY: 0.018,              // Realistic gravity
    SLIDE_DURATION: 800,         // Slide time in ms
    BOOST_SPEED: 1.8,            // Boost multiplier
    BOOST_DURATION: 5000,        // 5 seconds
    CHASER_BASE_DISTANCE: 25,    // Starting distance behind
    CHASER_SPEED_FACTOR: 0.95,   // Chaser catches up slowly
    ENVIRONMENT_SWITCH: 2000,    // Switch env every 2000 points
    FOG_START: 60,               // Fog starts at this distance
    FOG_END: 120,                // Fog ends here
    SHADOW_MAP_SIZE: 2048,       // High quality shadows
    PARTICLE_COUNT: 100,         // Max particles
    DRAW_DISTANCE: 150,          // How far we render
    TRAIN_SPAWN_CHANCE: 0.015,   // Train probability
    CAR_SPAWN_CHANCE: 0.025,     // Car probability
    COIN_SPAWN_CHANCE: 0.08,     // Coin probability
    POWERUP_CHANCE: 0.005,       // Powerup probability
    PERFECT_JUMP_BONUS: 50,      // Bonus for perfect timing
    SECRET_LANE_CHANCE: 0.003    // Rare secret lane
};

// --- ENVIRONMENT DEFINITIONS ---
const ENVIRONMENTS = {
    city: {
        name: 'المدينة',
        skyColor: 0x87CEEB,
        fogColor: 0xcccccc,
        fogDensity: 0.015,
        groundColor: 0x444444,
        buildingColors: [0xcc9966, 0xaa7755, 0xddbb99, 0x887766, 0x998877],
        lightColor: 0xffffff,
        lightIntensity: 0.8,
        ambientIntensity: 0.6,
        rain: false,
        particles: 'dust'
    },
    desert: {
        name: 'الصحراء',
        skyColor: 0xE8C98F,
        fogColor: 0xD4A76A,
        fogDensity: 0.02,
        groundColor: 0xC2B280,
        buildingColors: [0xD4A76A, 0xC19A6B, 0xA0826D, 0x8B7355],
        lightColor: 0xFFE4B5,
        lightIntensity: 1.0,
        ambientIntensity: 0.7,
        rain: false,
        particles: 'sand'
    },
    night: {
        name: 'الليل',
        skyColor: 0x0a0a2a,
        fogColor: 0x1a1a3a,
        fogDensity: 0.025,
        groundColor: 0x222233,
        buildingColors: [0x2a2a4a, 0x333355, 0x1a1a3a, 0x444466],
        lightColor: 0x8888ff,
        lightIntensity: 0.4,
        ambientIntensity: 0.3,
        rain: false,
        particles: 'none'
    },
    rain: {
        name: 'المطر',
        skyColor: 0x556677,
        fogColor: 0x667788,
        fogDensity: 0.03,
        groundColor: 0x333344,
        buildingColors: [0x555566, 0x666677, 0x444455],
        lightColor: 0xaaaaaa,
        lightIntensity: 0.5,
        ambientIntensity: 0.4,
        rain: true,
        particles: 'rain'
    },
    fog: {
        name: 'الضباب',
        skyColor: 0x888899,
        fogColor: 0x9999aa,
        fogDensity: 0.04,
        groundColor: 0x555566,
        buildingColors: [0x777788, 0x888899, 0x666677],
        lightColor: 0xcccccc,
        lightIntensity: 0.3,
        ambientIntensity: 0.2,
        rain: false,
        particles: 'fog'
    }
};

// --- POWERUP DEFINITIONS ---
const POWERUPS = {
    magnet: { icon: '🧲', color: 0xff00ff, duration: 8000, radius: 8 },
    shield: { icon: '🛡️', color: 0x00ff00, duration: 10000, hits: 1 },
    drone: { icon: '🚁', color: 0x0088ff, duration: 12000, collectRate: 3 },
    rocket: { icon: '🚀', color: 0xff0000, duration: 5000, destroyRadius: 5 },
    ghost: { icon: '👻', color: 0xffffff, duration: 6000, passThrough: true },
    multiplier: { icon: '✖️', color: 0xffff00, duration: 10000, multiplier: 10 }
};

// --- GLOBAL STATE ---
let gameState = {
    running: false,
    paused: false,
    score: 0,
    coins: 0,
    distance: 0,
    speed: CONFIG.BASE_SPEED,
    maxSpeed: CONFIG.BASE_SPEED,
    level: 1,
    environment: 'city',
    boostActive: false,
    boostMeter: 0,
    combo: 0,
    perfectJumps: 0,
    trainsAvoided: 0,
    powerupsUsed: 0,
    deaths: 0,
    startTime: 0,
    sessionStats: {
        jumps: 0,
        slides: 0,
        laneSwitches: 0,
        nearMisses: 0,
        coinsCollected: 0,
        powerupsCollected: 0
    }
};

// --- THREE.JS CORE ---
let scene, camera, renderer;
let ambientLight, dirLight, hemiLight;
let clock, deltaTime;

// --- GAME OBJECTS ---
let player = {
    mesh: null,
    group: null,
    lane: 0,           // -2 to 2 (5 lanes)
    targetLane: 0,
    y: 0,
    vy: 0,
    isJumping: false,
    isDoubleJumping: false,
    isSliding: false,
    slideTimer: 0,
    hasShield: false,
    hasGhost: false,
    magnetActive: false,
    multiplier: 1,
    invincible: false
};

let chaser = {
    mesh: null,
    distance: CONFIG.CHASER_BASE_DISTANCE,
    speed: 0,
    visible: false,
    angry: false
};

let world = {
    ground: null,
    laneLines: [],
    buildings: [],
    obstacles: [],
    coins: [],
    powerups: [],
    particles: [],
    rainSystem: null,
    secretLane: null
};

let cameraEffects = {
    shake: 0,
    shakeDecay: 0.9,
    fov: 60,
    targetFov: 60,
    tilt: 0
};

// --- INITIALIZATION ---
function init() {
    const container = document.getElementById('game-container');
    
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(ENVIRONMENTS.city.skyColor);
    
    // Fog for depth and atmosphere
    scene.fog = new THREE.Fog(
        ENVIRONMENTS.city.fogColor,
        CONFIG.FOG_START,
        CONFIG.FOG_END
    );

    // Camera with cinematic feel
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        CONFIG.DRAW_DISTANCE
    );
    camera.position.set(0, 7, 15);
    camera.lookAt(0, 2, -10);

    // High quality renderer
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    container.appendChild(renderer.domElement);

    // Clock for timing
    clock = new THREE.Clock();

    // Setup lighting
    setupLighting();

    // Create world
    createGround();
    createLaneMarkers();
    createBuildings();
    
    // Create player
    createPlayer();
    
    // Create chaser (hidden initially)
    createChaser();

    // Event listeners
    setupControls();
    
    // Start render loop
    animate();

    // Handle resize
    window.addEventListener('resize', onWindowResize);
}

function setupLighting() {
    // Ambient - soft fill
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Hemisphere - sky/ground gradient
    hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    // Directional - main sun/moon light
    dirLight = new THREE.DirectionalLight(0xffddaa, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = CONFIG.SHADOW_MAP_SIZE;
    dirLight.shadow.mapSize.height = CONFIG.SHADOW_MAP_SIZE;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);
}

function createGround() {
    // Main road
    const roadGeo = new THREE.PlaneGeometry(200, 400);
    const roadMat = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        roughness: 0.9,
        metalness: 0.1
    });
    world.ground = new THREE.Mesh(roadGeo, roadMat);
    world.ground.rotation.x = -Math.PI / 2;
    world.ground.receiveShadow = true;
    scene.add(world.ground);

    // Sidewalks
    const sidewalkGeo = new THREE.BoxGeometry(8, 0.3, 400);
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    
    const leftWalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    leftWalk.position.set(-14, 0.15, 0);
    leftWalk.receiveShadow = true;
    scene.add(leftWalk);
    
    const rightWalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    rightWalk.position.set(14, 0.15, 0);
    rightWalk.receiveShadow = true;
    scene.add(rightWalk);

    // Rails on sides
    const railGeo = new THREE.BoxGeometry(0.3, 1, 400);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
    
    const leftRail = new THREE.Mesh(railGeo, railMat);
    leftRail.position.set(-10, 0.5, 0);
    scene.add(leftRail);
    
    const rightRail = new THREE.Mesh(railGeo, railMat);
    rightRail.position.set(10, 0.5, 0);
    scene.add(rightRail);
}

function createLaneMarkers() {
    // 4 lane dividers for 5 lanes
    for (let i = -1.5; i <= 1.5; i++) {
        const lineGeo = new THREE.PlaneGeometry(0.15, 400);
        const lineMat = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.6
        });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.x = -Math.PI / 2;
        line.position.set(i * CONFIG.LANE_WIDTH, 0.02, 0);
        scene.add(line);
        world.laneLines.push(line);
    }
}

function createBuildings() {
    const env = ENVIRONMENTS[gameState.environment];
    
    // Create initial building pool
    for (let i = 0; i < 30; i++) {
        spawnBuilding(-i * 12 - 20);
    }
}

function spawnBuilding(z) {
    const env = ENVIRONMENTS[gameState.environment];
    const side = Math.random() > 0.5 ? 1 : -1;
    const width = 3 + Math.random() * 5;
    const height = 4 + Math.random() * 12;
    const depth = 4 + Math.random() * 6;
    
    // Main building body
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshLambertMaterial({ 
        color: env.buildingColors[Math.floor(Math.random() * env.buildingColors.length)]
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(side * (12 + width/2 + Math.random() * 3), height/2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // Add windows for realism
    const windowRows = Math.floor(height / 2);
    const windowCols = Math.floor(width / 1.5);
    
    for (let r = 0; r < windowRows; r++) {
        for (let c = 0; c < windowCols; c++) {
            if (Math.random() > 0.3) { // Not all windows lit
                const winGeo = new THREE.PlaneGeometry(0.6, 0.8);
                const winColor = Math.random() > 0.5 ? 0xffffaa : 0x333333; // Lit or dark
                const winMat = new THREE.MeshBasicMaterial({ 
                    color: winColor,
                    transparent: true,
                    opacity: winColor === 0xffffaa ? 0.8 : 0.3
                });
                const win = new THREE.Mesh(winGeo, winMat);
                win.position.set(
                    (c - windowCols/2 + 0.5) * 1.2,
                    (r - windowRows/2 + 0.5) * 2 + height/2,
                    side > 0 ? -depth/2 - 0.01 : depth/2 + 0.01
                );
                mesh.add(win);
            }
        }
    }
    
    // Roof details
    if (Math.random() > 0.5) {
        const antennaGeo = new THREE.CylinderGeometry(0.05, 0.05, 2);
        const antennaMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 });
        const antenna = new THREE.Mesh(antennaGeo, antennaMat);
        antenna.position.y = height/2 + 1;
        mesh.add(antenna);
        
        // Blinking light on top
        const lightGeo = new THREE.SphereGeometry(0.15);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.y = height/2 + 2;
        mesh.add(light);
    }
    
    scene.add(mesh);
    world.buildings.push(mesh);
}

// --- PLAYER CREATION (Detailed Character) ---
function createPlayer() {
    player.group = new THREE.Group();
    
    // Materials based on selected character
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.5 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.7 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2244aa, roughness: 0.6 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
    
    // Head
    const headGeo = new THREE.BoxGeometry(0.7, 0.75, 0.7);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 2.3;
    head.castShadow = true;
    player.group.add(head);
    
    // Hair/Cap
    const capGeo = new THREE.BoxGeometry(0.75, 0.25, 0.8);
    const capMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 2.7;
    player.group.add(cap);
    
    // Eyes
    const eyeGeo = new THREE.PlaneGeometry(0.12, 0.08);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.15, 2.35, 0.36);
    player.group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.15, 2.35, 0.36);
    player.group.add(rightEye);
    
    // Body (torso)
    const bodyGeo = new THREE.BoxGeometry(0.9, 1.1, 0.5);
    const body = new THREE.Mesh(bodyGeo, shirtMat);
    body.position.y = 1.45;
    body.castShadow = true;
    player.group.add(body);
    
    // Backpack
    const backpackGeo = new THREE.BoxGeometry(0.6, 0.8, 0.3);
    const backpackMat = new THREE.MeshStandardMaterial({ color: 0x4488cc });
    const backpack = new THREE.Mesh(backpackGeo, backpackMat);
    backpack.position.set(0, 1.5, -0.4);
    player.group.add(backpack);
    
    // Arms
    const armGeo = new THREE.BoxGeometry(0.25, 0.9, 0.25);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.65, 1.5, 0);
    leftArm.castShadow = true;
    leftArm.name = 'leftArm';
    player.group.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(0.65, 1.5, 0);
    rightArm.castShadow = true;
    rightArm.name = 'rightArm';
    player.group.add(rightArm);
    
    // Legs
    const legGeo = new THREE.BoxGeometry(0.35, 1.1, 0.35);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.25, 0.55, 0);
    leftLeg.castShadow = true;
    leftLeg.name = 'leftLeg';
    player.group.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.25, 0.55, 0);
    rightLeg.castShadow = true;
    rightLeg.name = 'rightLeg';
    player.group.add(rightLeg);
    
    // Shoes
    const shoeGeo = new THREE.BoxGeometry(0.4, 0.2, 0.5);
    const leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    leftShoe.position.set(-0.25, 0, 0.05);
    player.group.add(leftShoe);
    
    const rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rightShoe.position.set(0.25, 0, 0.05);
    player.group.add(rightShoe);
    
    // Shadow blob under player
    const shadowGeo = new THREE.CircleGeometry(0.6, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ 
        color: 0x000000, 
        transparent: true, 
        opacity: 0.3 
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    shadow.name = 'shadow';
    player.group.add(shadow);
    
    scene.add(player.group);
    player.mesh = player.group;
}

// --- CHASER CREATION (The Threat) ---
function createChaser() {
    chaser.group = new THREE.Group();
    
    // Angry red glow material
    const glowMat = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5
    });
    
    // Chaser body - menacing shape
    const bodyGeo = new THREE.BoxGeometry(1.5, 2.5, 1);
    const body = new THREE.Mesh(bodyGeo, glowMat);
    body.position.y = 1.25;
    chaser.group.add(body);
    
    // Glowing eyes
    const eyeGeo = new THREE.SphereGeometry(0.15);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.3, 2.2, 0.5);
    chaser.group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.3, 2.2, 0.5);
    chaser.group.add(rightEye);
    
    // Trail particles behind chaser
    const trailGeo = new THREE.BufferGeometry();
    const trailCount = 50;
    const positions = new Float32Array(trailCount * 3);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const trailMat = new THREE.PointsMaterial({
        color: 0xff0000,
        size: 0.3,
        transparent: true,
        opacity: 0.6
    });
    const trail = new THREE.Points(trailGeo, trailMat);
    trail.name = 'trail';
    chaser.group.add(trail);
    
    chaser.group.visible = false;
    scene.add(chaser.group);
    chaser.mesh = chaser.group;
}

// --- CONTROLS ---
function setupControls() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
        if (!gameState.running || gameState.paused) return;
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                moveLane(-1);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                moveLane(1);
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
            case ' ':
                jump();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                slide();
                break;
            case 'Shift':
                activateBoost();
                break;
        }
    });

    // Touch controls with improved detection
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    window.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        if (!gameState.running || gameState.paused) return;
        
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const dt = Date.now() - touchStartTime;
        
        // Quick tap = jump
        if (Math.abs(dx) < 20 && Math.abs(dy) < 20 && dt < 200) {
            jump();
            return;
        }
        
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        
        if (absDx > absDy && absDx > 40) {
            // Horizontal swipe
            moveLane(dx > 0 ? 1 : -1);
        } else if (absDy > absDx && absDy > 40) {
            // Vertical swipe
            if (dy < 0) {
                jump();
            } else {
                slide();
            }
        }
    }, { passive: true });
}

// --- MOVEMENT FUNCTIONS ---
function moveLane(direction) {
    const newLane = player.targetLane + direction;
    if (newLane >= -2 && newLane <= 2) {
        player.targetLane = newLane;
        gameState.sessionStats.laneSwitches++;
        
        // Tilt effect
        cameraEffects.tilt = direction * 0.1;
        
        // Sound
        if (Math.abs(player.lane - player.targetLane) === 1) {
            // Whoosh sound
        }
    }
}

function jump() {
    if (!player.isJumping) {
        player.vy = CONFIG.JUMP_FORCE;
        player.isJumping = true;
        gameState.sessionStats.jumps++;
        sabuyahAudio.playJump();
        
        // Squash animation
        squashPlayer(0.8, 1.2);
    } else if (!player.isDoubleJumping && gameState.boostActive) {
        // Double jump only during boost
        player.vy = CONFIG.JUMP_FORCE * 0.8;
        player.isDoubleJumping = true;
        createParticles(player.group.position, 0x00ffff, 10);
    }
}

function slide() {
    if (!player.isSliding && !player.isJumping) {
        player.isSliding = true;
        player.slideTimer = CONFIG.SLIDE_DURATION;
        gameState.sessionStats.slides++;
        sabuyahAudio.playSlide();
        
        // Flatten player
        player.group.scale.y = 0.4;
        player.group.position.y = -0.5;
        
        // Create dust
        createParticles(player.group.position, 0x888888, 5);
    }
}

function activateBoost() {
    if (gameState.boostMeter >= 100 && !gameState.boostActive) {
        gameState.boostActive = true;
        gameState.boostMeter = 0;
        gameState.powerupsUsed++;
        
        sabuyahAudio.playBoost();
        ui.setBoostOverlay(true);
        
        // Visual effects
        createParticles(player.group.position, 0x00ffff, 30);
        cameraEffects.fov = 75; // Widen FOV for speed feel
        
        setTimeout(() => {
            gameState.boostActive = false;
            ui.setBoostOverlay(false);
            cameraEffects.fov = 60;
        }, CONFIG.BOOST_DURATION);
    }
}

// --- SPAWN SYSTEMS ---
function spawnObstacle() {
    if (!gameState.running) return;
    
    const env = ENVIRONMENTS[gameState.environment];
    const lane = Math.floor(Math.random() * 5) - 2; // -2 to 2
    
    // Don't spawn if player is in ghost mode
    if (player.hasGhost) return;
    
    // Smart spawning - avoid impossible combinations
    const recentObstacles = world.obstacles.filter(o => o.position.z < -50 && o.position.z > -70);
    const laneOccupied = recentObstacles.some(o => o.userData.lane === lane);
    
    if (laneOccupied && Math.random() > 0.3) return; // 70% chance to avoid double obstacles
    
    const type = Math.random() > 0.6 ? 'train' : 'car';
    let mesh;
    
    if (type === 'train') {
        // Train - long and dangerous
        const length = 8 + Math.random() * 6;
        const geo = new THREE.BoxGeometry(2.2, 3.5, length);
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0x228822,
            roughness: 0.4,
            metalness: 0.6
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(lane * CONFIG.LANE_WIDTH, 1.75, -100);
        
        // Train details
        const windowGeo = new THREE.PlaneGeometry(1.8, 1);
        const windowMat = new THREE.MeshBasicMaterial({ color: 0x87CEEB });
        for (let i = 0; i < 3; i++) {
            const win = new THREE.Mesh(windowGeo, windowMat);
            win.position.set(0, 0.5, -length/3 + i * length/3);
            win.rotation.y = 0;
            mesh.add(win);
        }
        
        // Headlights
        const lightGeo = new THREE.SphereGeometry(0.2);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
        const leftLight = new THREE.Mesh(lightGeo, lightMat);
        leftLight.position.set(-0.6, 0, length/2 + 0.1);
        mesh.add(leftLight);
        const rightLight = new THREE.Mesh(lightGeo, lightMat);
        rightLight.position.set(0.6, 0, length/2 + 0.1);
        mesh.add(rightLight);
        
        mesh.userData = { 
            type: 'train', 
            lane: lane,
            bbox: new THREE.Box3(),
            length: length,
            moving: Math.random() > 0.7 // Some trains move!
        };
        
        if (mesh.userData.moving) {
            mesh.userData.speed = 0.2 + Math.random() * 0.3;
        }
        
    } else {
        // Car - smaller, faster
        const geo = new THREE.BoxGeometry(1.8, 1.4, 3.5);
        const colors = [0xcc2222, 0x2244cc, 0xccaa22, 0xffffff, 0x333333];
        const mat = new THREE.MeshStandardMaterial({ 
            color: colors[Math.floor(Math.random() * colors.length)],
            roughness: 0.3,
            metalness: 0.7
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(lane * CONFIG.LANE_WIDTH, 0.7, -100);
        
        // Car details
        const roofGeo = new THREE.BoxGeometry(1.4, 0.6, 2);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 0.8;
        mesh.add(roof);
        
        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        const positions = [[-0.7, -0.4, 1], [0.7, -0.4, 1], [-0.7, -0.4, -1], [0.7, -0.4, -1]];
        positions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...pos);
            mesh.add(wheel);
        });
        
        mesh.userData = { 
            type: 'car', 
            lane: lane,
            bbox: new THREE.Box3(),
            moving: Math.random() > 0.5
        };
        
        if (mesh.userData.moving) {
            mesh.userData.speed = 0.3 + Math.random() * 0.4;
            mesh.userData.direction = Math.random() > 0.5 ? 1 : -1;
        }
    }
    
    mesh.castShadow = true;
    scene.add(mesh);
    world.obstacles.push(mesh);
}

function spawnCoin() {
    if (!gameState.running) return;
    
    const pattern = Math.random();
    const lane = Math.floor(Math.random() * 5) - 2;
    const z = -100;
    
    if (pattern < 0.3) {
        // Single coin
        createCoin(lane * CONFIG.LANE_WIDTH, 1, z);
    } else if (pattern < 0.6) {
        // Line of coins
        for (let i = 0; i < 5; i++) {
            createCoin(lane * CONFIG.LANE_WIDTH, 1, z - i * 3);
        }
    } else if (pattern < 0.8) {
        // Arc of coins (jump to collect)
        for (let i = 0; i < 7; i++) {
            const y = 1 + Math.sin(i * Math.PI / 6) * 2;
            createCoin(lane * CONFIG.LANE_WIDTH, y, z - i * 2.5);
        }
    } else {
        // Cross-lane coins
        for (let i = -2; i <= 2; i++) {
            createCoin(i * CONFIG.LANE_WIDTH, 1, z);
        }
    }
}

function createCoin(x, y, z) {
    const geo = new THREE.CylinderGeometry(0.4, 0.4, 0.08, 16);
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0xffcc00,
        metalness: 1.0,
        roughness: 0.2,
        emissive: 0xffaa00,
        emissiveIntensity: 0.3
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, y, z);
    
    // Glow ring
    const ringGeo = new THREE.TorusGeometry(0.5, 0.05, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({ 
        color: 0xffcc00,
        transparent: true,
        opacity: 0.5
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    mesh.add(ring);
    
    mesh.userData = { 
        isCoin: true, 
        bbox: new THREE.Box3(),
        baseY: y,
        spinSpeed: 3 + Math.random() * 2
    };
    
    scene.add(mesh);
    world.coins.push(mesh);
}

function spawnPowerup() {
    if (!gameState.running) return;
    
    const types = Object.keys(POWERUPS);
    const type = types[Math.floor(Math.random() * types.length)];
    const lane = Math.floor(Math.random() * 5) - 2;
    
    const config = POWERUPS[type];
    const geo = new THREE.OctahedronGeometry(0.6);
    const mat = new THREE.MeshStandardMaterial({ 
        color: config.color,
        emissive: config.color,
        emissiveIntensity: 0.6,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: 0.9
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(lane * CONFIG.LANE_WIDTH, 1.5, -100);
    
    // Floating animation offset
    mesh.userData = {
        isPowerup: true,
        type: type,
        bbox: new THREE.Box3(),
        floatOffset: Math.random() * Math.PI * 2,
        baseY: 1.5
    };
    
    // Particle aura
    const auraGeo = new THREE.SphereGeometry(0.8);
    const auraMat = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.2,
        wireframe: true
    });
    const aura = new THREE.Mesh(auraGeo, auraMat);
    mesh.add(aura);
    
    scene.add(mesh);
    world.powerups.push(mesh);
}

// --- PARTICLE SYSTEM ---
function createParticles(position, color, count) {
    for (let i = 0; i < count; i++) {
        const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const mat = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 1
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(position);
        mesh.position.x += (Math.random() - 0.5) * 2;
        mesh.position.y += (Math.random() - 0.5) * 2;
        mesh.position.z += (Math.random() - 0.5) * 2;
        
        mesh.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.3,
                Math.random() * 0.3,
                (Math.random() - 0.5) * 0.3
            ),
            life: 1.0,
            decay: 0.02 + Math.random() * 0.03
        };
        
        scene.add(mesh);
        world.particles.push(mesh);
    }
}

function updateParticles() {
    for (let i = world.particles.length - 1; i >= 0; i--) {
        const p = world.particles[i];
        p.position.add(p.userData.velocity);
        p.userData.velocity.y -= 0.01; // Gravity
        p.userData.life -= p.userData.decay;
        p.material.opacity = p.userData.life;
        p.rotation.x += 0.1;
        p.rotation.y += 0.1;
        
        if (p.userData.life <= 0) {
            scene.remove(p);
            world.particles.splice(i, 1);
        }
    }
}

// --- ANIMATION HELPERS ---
function squashPlayer(xScale, yScale) {
    player.group.scale.x = xScale;
    player.group.scale.y = yScale;
    player.group.scale.z = xScale;
    
    setTimeout(() => {
        player.group.scale.set(1, 1, 1);
    }, 150);
}

// --- ENVIRONMENT TRANSITIONS ---
function switchEnvironment() {
    const envs = Object.keys(ENVIRONMENTS);
    let newEnv;
    do {
        newEnv = envs[Math.floor(Math.random() * envs.length)];
    } while (newEnv === gameState.environment);
    
    gameState.environment = newEnv;
    const env = ENVIRONMENTS[newEnv];
    
    // Smooth transition
    const duration = 2000;
    const startTime = Date.now();
    const oldColor = scene.background.clone();
    const newColor = new THREE.Color(env.skyColor);
    const oldFog = scene.fog.color.clone();
    
    function transition() {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        
        scene.background.lerpColors(oldColor, newColor, t);
        scene.fog.color.lerpColors(oldFog, newColor, t);
        scene.fog.density = env.fogDensity;
        
        ambientLight.intensity = env.ambientIntensity;
        dirLight.color.setHex(env.lightColor);
        dirLight.intensity = env.lightIntensity;
        
        if (t < 1) requestAnimationFrame(transition);
    }
    
    transition();
    
    // Update ground
    world.ground.material.color.setHex(env.groundColor);
    
    // Update buildings gradually
    world.buildings.forEach(b => {
        b.material.color.setHex(env.buildingColors[Math.floor(Math.random() * env.buildingColors.length)]);
    });
    
    // Rain system
    if (env.rain && !world.rainSystem) {
        createRainSystem();
    } else if (!env.rain && world.rainSystem) {
        removeRainSystem();
    }
    
    ui.showEnvironmentChange(newEnv);
}

function createRainSystem() {
    const rainCount = 2000;
    const rainGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(rainCount * 3);
    
    for (let i = 0; i < rainCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 60;
        positions[i + 1] = Math.random() * 40;
        positions[i + 2] = (Math.random() - 0.5) * 100;
    }
    
    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const rainMat = new THREE.PointsMaterial({
        color: 0xaaaaaa,
        size: 0.1,
        transparent: true,
        opacity: 0.6
    });
    
    world.rainSystem = new THREE.Points(rainGeo, rainMat);
    scene.add(world.rainSystem);
}

function removeRainSystem() {
    if (world.rainSystem) {
        scene.remove(world.rainSystem);
        world.rainSystem = null;
    }
}

function updateRain() {
    if (!world.rainSystem) return;
    
    const positions = world.rainSystem.geometry.attributes.position.array;
    for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 0.5;
        if (positions[i] < 0) {
            positions[i] = 40;
            positions[i - 1] = (Math.random() - 0.5) * 60;
            positions[i + 1] = (Math.random() - 0.5) * 100 - 50;
        }
    }
    world.rainSystem.geometry.attributes.position.needsUpdate = true;
}

// --- COLLISION DETECTION ---
function checkCollisions() {
    // Player bounding box (smaller than visual for fairness)
    const pBox = new THREE.Box3().setFromObject(player.group);
    pBox.expandByScalar(-0.25);
    
    // Obstacles
    for (let i = world.obstacles.length - 1; i >= 0; i--) {
        const obs = world.obstacles[i];
        obs.userData.bbox.setFromObject(obs);
        
        // Check if player is in same lane
        const laneDiff = Math.abs((obs.position.x / CONFIG.LANE_WIDTH) - player.lane);
        if (laneDiff > 0.5) continue; // Different lane, skip
        
        if (pBox.intersectsBox(obs.userData.bbox)) {
            if (player.hasGhost) {
                // Pass through
                continue;
            } else if (player.hasShield) {
                // Shield absorbs hit
                player.hasShield = false;
                createParticles(obs.position, 0x00ff00, 20);
                sabuyahAudio.playCrash();
                scene.remove(obs);
                world.obstacles.splice(i, 1);
                ui.showPowerupIcon('shield', 0);
                continue;
            } else if (player.isSliding && obs.userData.type === 'car') {
                // Can slide under some cars
                if (obs.position.y > 1.0) continue;
            }
            
            // Game over
            gameOver();
            return;
        }
        
        // Near miss detection
        if (laneDiff < 0.5 && Math.abs(obs.position.z - player.group.position.z) < 3) {
            if (!obs.userData.nearMissCounted) {
                obs.userData.nearMissCounted = true;
                gameState.sessionStats.nearMisses++;
                if (gameState.sessionStats.nearMisses % 5 === 0) {
                    gameState.score += 50; // Near miss bonus
                }
            }
        }
        
        // Remove if behind camera
        if (obs.position.z > 20) {
            scene.remove(obs);
            world.obstacles.splice(i, 1);
        }
    }
    
    // Coins
    for (let i = world.coins.length - 1; i >= 0; i--) {
        const coin = world.coins[i];
        coin.userData.bbox.setFromObject(coin);
        
        // Magnet effect
        if (player.magnetActive) {
            const dist = coin.position.distanceTo(player.group.position);
            if (dist < POWERUPS.magnet.radius) {
                const dir = new THREE.Vector3().subVectors(player.group.position, coin.position).normalize();
                coin.position.add(dir.multiplyScalar(0.3));
            }
        }
        
        if (pBox.intersectsBox(coin.userData.bbox)) {
            const value = 1 * player.multiplier;
            gameState.coins += value;
            gameState.sessionStats.coinsCollected += value;
            gameState.score += 10;
            gameState.boostMeter = Math.min(100, gameState.boostMeter + 2);
            
            sabuyahAudio.playCoin();
            createParticles(coin.position, 0xffcc00, 8);
            
            scene.remove(coin);
            world.coins.splice(i, 1);
        } else if (coin.position.z > 20) {
            scene.remove(coin);
            world.coins.splice(i, 1);
        }
    }
    
    // Powerups
    for (let i = world.powerups.length - 1; i >= 0; i--) {
        const pup = world.powerups[i];
        pup.userData.bbox.setFromObject(pup);
        
        if (pBox.intersectsBox(pup.userData.bbox)) {
            activatePowerup(pup.userData.type);
            sabuyahAudio.playPowerUp(pup.userData.type);
            createParticles(pup.position, POWERUPS[pup.userData.type].color, 15);
            
            scene.remove(pup);
            world.powerups.splice(i, 1);
        } else if (pup.position.z > 20) {
            scene.remove(pup);
            world.powerups.splice(i, 1);
        }
    }
}

function activatePowerup(type) {
    const config = POWERUPS[type];
    gameState.powerupsUsed++;
    gameState.sessionStats.powerupsCollected++;
    
    switch(type) {
        case 'magnet':
            player.magnetActive = true;
            setTimeout(() => { player.magnetActive = false; }, config.duration);
            break;
        case 'shield':
            player.hasShield = true;
            break;
        case 'drone':
            // Drone logic handled in update loop
            spawnDrone();
            break;
        case 'rocket':
            // Destroy obstacles ahead
            world.obstacles.forEach(obs => {
                if (obs.position.z < player.group.position.z - 5 && 
                    obs.position.z > player.group.position.z - 30) {
                    createParticles(obs.position, 0xff0000, 20);
                    scene.remove(obs);
                }
            });
            world.obstacles = world.obstacles.filter(o => o.position.z <= player.group.position.z - 30 || o.position.z > player.group.position.z - 5);
            break;
        case 'ghost':
            player.hasGhost = true;
            player.group.traverse(child => {
                if (child.material) {
                    child.material.transparent = true;
                    child.material.opacity = 0.5;
                }
            });
            setTimeout(() => {
                player.hasGhost = false;
                player.group.traverse(child => {
                    if (child.material) {
                        child.material.opacity = 1;
                        child.material.transparent = false;
                    }
                });
            }, config.duration);
            break;
        case 'multiplier':
            player.multiplier = config.multiplier;
            setTimeout(() => { player.multiplier = 1; }, config.duration);
            break;
    }
    
    ui.showPowerupIcon(type, config.duration / 1000);
}

function spawnDrone() {
    // Simple drone that follows and collects
    const droneGeo = new THREE.SphereGeometry(0.3);
    const droneMat = new THREE.MeshStandardMaterial({ color: 0x0088ff, emissive: 0x0088ff, emissiveIntensity: 0.5 });
    const drone = new THREE.Mesh(droneGeo, droneMat);
    drone.position.set(1, 3, -2);
    player.group.add(drone);
    
    setTimeout(() => {
        player.group.remove(drone);
    }, POWERUPS.drone.duration);
}

// --- CHASER AI ---
function updateChaser() {
    if (!gameState.running) return;
    
    // Chaser appears after some distance
    if (gameState.distance < 200) {
        chaser.mesh.visible = false;
        return;
    }
    
    chaser.mesh.visible = true;
    
    // Smart AI - predicts player movement
    const playerZ = player.group.position.z;
    const playerLane = player.lane;
    
    // Base catch-up speed
    let catchUp = (gameState.speed * CONFIG.CHASER_SPEED_FACTOR) - gameState.speed;
    
    // If player is slow or stopped, chaser catches up faster
    if (gameState.speed < CONFIG.BASE_SPEED) {
        catchUp += 0.1;
    }
    
    // Chaser gets angry when close
    if (chaser.distance < 10) {
        catchUp += 0.05;
        if (!chaser.angry) {
            chaser.angry = true;
            sabuyahAudio.playChaserWarning(chaser.distance);
        }
    } else {
        chaser.angry = false;
    }
    
    chaser.distance -= catchUp;
    chaser.distance = Math.max(2, chaser.distance); // Minimum distance
    
    // Position chaser behind player
    chaser.mesh.position.set(
        playerLane * CONFIG.LANE_WIDTH + Math.sin(Date.now() * 0.003) * 0.5,
        0,
        playerZ + chaser.distance
    );
    
    // Update danger bar
    const dangerPercent = Math.max(0, 100 - (chaser.distance / CONFIG.CHASER_BASE_DISTANCE) * 100);
    ui.updateHUD(gameState.score, gameState.coins, gameState.distance, gameState.level, gameState.boostMeter, dangerPercent);
    
    // Game over if caught
    if (chaser.distance <= 2) {
        gameOver();
    }
}

// --- MAIN GAME LOOP (Part 1 ends here, continues in next message) ---
// ============================================
// PART 2: MAIN GAME LOOP & ADVANCED SYSTEMS
// ============================================

function animate() {
    requestAnimationFrame(animate);
    
    if (gameState.paused) return;
    
    deltaTime = clock.getDelta();
    const time = clock.getElapsedTime();
    
    if (gameState.running) {
        updateGameLogic(time);
        updateVisuals(time);
        updateParticles();
        updateRain();
        updateChaser();
        checkCollisions();
        updateCamera();
    }
    
    renderer.render(scene, camera);
}

function updateGameLogic(time) {
    // Speed progression (dynamic curve, not linear)
    const speedMultiplier = gameState.boostActive ? CONFIG.BOOST_SPEED : 1;
    const baseAccel = CONFIG.SPEED_INCREMENT * (1 + gameState.distance / 10000);
    gameState.speed = Math.min(
        CONFIG.MAX_SPEED,
        CONFIG.BASE_SPEED + baseAccel * gameState.distance
    );
    
    const currentSpeed = gameState.speed * speedMultiplier;
    gameState.maxSpeed = Math.max(gameState.maxSpeed, gameState.speed);
    
    // Update score and distance
    gameState.score += currentSpeed;
    gameState.distance += currentSpeed;
    
    // Level progression
    const newLevel = Math.floor(gameState.distance / CONFIG.ENVIRONMENT_SWITCH) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        switchEnvironment();
    }
    
    // Boost meter regeneration
    if (!gameState.boostActive && gameState.boostMeter < 100) {
        gameState.boostMeter = Math.min(100, gameState.boostMeter + 0.05);
    }
    
    // Player lane movement (smooth)
    const targetX = player.targetLane * CONFIG.LANE_WIDTH;
    player.lane += (player.targetLane - player.lane) * 0.08;
    player.group.position.x += (targetX - player.group.position.x) * 0.12;
    
    // Camera tilt recovery
    cameraEffects.tilt *= 0.9;
    
    // Jump physics
    if (player.isJumping) {
        player.group.position.y += player.vy;
        player.vy -= CONFIG.GRAVITY;
        
        // Perfect jump detection (landing on train/car)
        if (player.vy < 0 && player.group.position.y < 2) {
            // Check if landing on obstacle (train surfing)
            for (const obs of world.obstacles) {
                if (obs.userData.type === 'train' && 
                    Math.abs(obs.position.x - player.group.position.x) < 1.5 &&
                    Math.abs(obs.position.z - player.group.position.z) < 5) {
                    // Landed on train!
                    player.group.position.y = 3.5; // On top of train
                    player.vy = 0;
                    player.isJumping = false;
                    player.isDoubleJumping = false;
                    gameState.perfectJumps++;
                    gameState.score += CONFIG.PERFECT_JUMP_BONUS;
                    createParticles(player.group.position, 0x00ff00, 15);
                    squashPlayer(1.1, 0.9);
                    break;
                }
            }
        }
        
        // Normal landing
        if (player.group.position.y <= 0) {
            player.group.position.y = 0;
            player.isJumping = false;
            player.isDoubleJumping = false;
            player.vy = 0;
            squashPlayer(1.1, 0.9);
            
            // Landing particles
            createParticles(player.group.position, 0x888888, 5);
        }
    }
    
    // Slide timer
    if (player.isSliding) {
        player.slideTimer -= deltaTime * 1000;
        if (player.slideTimer <= 0) {
            player.isSliding = false;
            player.group.scale.y = 1;
            player.group.position.y = 0;
        }
    }
    
    // Running animation
    if (!player.isJumping && !player.isSliding) {
        const runSpeed = 15 * (gameState.speed / CONFIG.BASE_SPEED);
        const leftArm = player.group.getObjectByName('leftArm');
        const rightArm = player.group.getObjectByName('rightArm');
        const leftLeg = player.group.getObjectByName('leftLeg');
        const rightLeg = player.group.getObjectByName('rightLeg');
        
        if (leftArm) leftArm.rotation.x = Math.sin(time * runSpeed) * 0.6;
        if (rightArm) rightArm.rotation.x = Math.sin(time * runSpeed + Math.PI) * 0.6;
        if (leftLeg) leftLeg.rotation.x = Math.sin(time * runSpeed + Math.PI) * 0.6;
        if (rightLeg) rightLeg.rotation.x = Math.sin(time * runSpeed) * 0.6;
        
        // Body bob
        player.group.position.y = Math.abs(Math.sin(time * runSpeed * 2)) * 0.1;
        
        // Shadow scaling
        const shadow = player.group.getObjectByName('shadow');
        if (shadow) {
            const shadowScale = 1 - player.group.position.y * 0.3;
            shadow.scale.setScalar(Math.max(0.5, shadowScale));
            shadow.material.opacity = 0.3 * shadowScale;
        }
    } else if (player.isJumping) {
        // Jump pose
        const leftArm = player.group.getObjectByName('leftArm');
        const rightArm = player.group.getObjectByName('rightArm');
        const leftLeg = player.group.getObjectByName('leftLeg');
        const rightLeg = player.group.getObjectByName('rightLeg');
        
        if (leftArm) leftArm.rotation.x = -0.8;
        if (rightArm) rightArm.rotation.x = -0.8;
        if (leftLeg) leftLeg.rotation.x = -0.3;
        if (rightLeg) rightLeg.rotation.x = 0.3;
    } else if (player.isSliding) {
        // Slide pose
        const leftArm = player.group.getObjectByName('leftArm');
        const rightArm = player.group.getObjectByName('rightArm');
        
        if (leftArm) leftArm.rotation.x = 0.5;
        if (rightArm) rightArm.rotation.x = 0.5;
    }
    
    // Chaser animation
    if (chaser.mesh.visible) {
        chaser.mesh.position.y = Math.sin(time * 10) * 0.2;
        const trail = chaser.mesh.getObjectByName('trail');
        if (trail) {
            trail.rotation.y += 0.1;
        }
    }
    
    // Update HUD
    ui.updateHUD(
        gameState.score,
        gameState.coins,
        gameState.distance,
        gameState.level,
        gameState.boostMeter,
        0 // Danger handled in updateChaser
    );
}

function updateVisuals(time) {
    // Move world objects toward camera
    const moveSpeed = gameState.speed * (gameState.boostActive ? CONFIG.BOOST_SPEED : 1);
    
    // Buildings
    world.buildings.forEach(b => {
        b.position.z += moveSpeed;
        if (b.position.z > 30) {
            b.position.z -= 200;
            // Randomize side
            const side = Math.random() > 0.5 ? 1 : -1;
            b.position.x = side * (12 + Math.random() * 5);
        }
    });
    
    // Obstacles
    for (let i = world.obstacles.length - 1; i >= 0; i--) {
        const obs = world.obstacles[i];
        obs.position.z += moveSpeed;
        
        // Moving obstacles (trains/cars that move)
        if (obs.userData.moving) {
            if (obs.userData.type === 'car') {
                obs.position.x += obs.userData.speed * obs.userData.direction;
                // Bounce off rails
                if (Math.abs(obs.position.x) > 9) {
                    obs.userData.direction *= -1;
                }
            } else if (obs.userData.type === 'train') {
                // Moving trains come toward player!
                obs.position.z += obs.userData.speed;
            }
        }
        
        // Rotate wheels on cars
        if (obs.userData.type === 'car') {
            obs.children.forEach(child => {
                if (child.geometry && child.geometry.type === 'CylinderGeometry') {
                    child.rotation.x += 0.2;
                }
            });
        }
        
        if (obs.position.z > 30) {
            scene.remove(obs);
            world.obstacles.splice(i, 1);
        }
    }
    
    // Coins animation
    world.coins.forEach(coin => {
        coin.position.z += moveSpeed;
        coin.rotation.y += coin.userData.spinSpeed * deltaTime;
        coin.rotation.z = Math.sin(time * 3) * 0.2;
        
        // Floating animation
        coin.position.y = coin.userData.baseY + Math.sin(time * 2 + coin.position.z * 0.1) * 0.2;
        
        // Ring rotation
        if (coin.children[0]) {
            coin.children[0].rotation.z += 0.05;
        }
    });
    
    // Powerups animation
    world.powerups.forEach(pup => {
        pup.position.z += moveSpeed;
        pup.rotation.y += 2 * deltaTime;
        pup.rotation.x += deltaTime;
        
        // Float
        pup.position.y = pup.userData.baseY + Math.sin(time * 3 + pup.userData.floatOffset) * 0.3;
        
        // Aura pulse
        if (pup.children[0]) {
            const scale = 1 + Math.sin(time * 4) * 0.2;
            pup.children[0].scale.setScalar(scale);
        }
    });
    
    // Lane markers (parallax)
    world.laneLines.forEach(line => {
        // Texture scroll effect via position reset
        const textureOffset = (gameState.distance * 2) % 10;
        // Visual movement
    });
    
    // Spawn new objects
    if (Math.random() < CONFIG.TRAIN_SPAWN_CHANCE * (1 + gameState.level * 0.1)) {
        spawnObstacle();
    }
    if (Math.random() < CONFIG.COIN_SPAWN_CHANCE) {
        spawnCoin();
    }
    if (Math.random() < CONFIG.POWERUP_CHANCE) {
        spawnPowerup();
    }
    
    // Secret lane (rare)
    if (Math.random() < CONFIG.SECRET_LANE_CHANCE && !world.secretLane) {
        spawnSecretLane();
    }
}

function spawnSecretLane() {
    // Hidden path with bonus coins
    const z = -100;
    for (let i = -2; i <= 2; i++) {
        const geo = new THREE.BoxGeometry(2, 0.1, 30);
        const mat = new THREE.MeshStandardMaterial({ 
            color: 0xffcc00,
            emissive: 0xffaa00,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.7
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(i * CONFIG.LANE_WIDTH, 0.05, z);
        scene.add(mesh);
        world.secretLane = mesh;
        
        // Coins on secret lane
        for (let j = 0; j < 10; j++) {
            createCoin(i * CONFIG.LANE_WIDTH, 1, z - j * 3);
        }
    }
    
    setTimeout(() => {
        if (world.secretLane) {
            scene.remove(world.secretLane);
            world.secretLane = null;
        }
    }, 5000);
}

function updateCamera() {
    // Smooth FOV transition
    cameraEffects.fov += (cameraEffects.targetFov - cameraEffects.fov) * 0.05;
    camera.fov = cameraEffects.fov;
    camera.updateProjectionMatrix();
    
    // Position follows player with lag for smooth feel
    const targetX = player.group.position.x * 0.3;
    const targetY = 7 + player.group.position.y * 0.5;
    const targetZ = 15 - gameState.speed * 2; // Pull back at high speed
    
    camera.position.x += (targetX - camera.position.x) * 0.05;
    camera.position.y += (targetY - camera.position.y) * 0.05;
    camera.position.z += (targetZ - camera.position.z) * 0.05;
    
    // Look ahead of player
    const lookTarget = new THREE.Vector3(
        player.group.position.x * 0.5,
        2 + player.group.position.y * 0.3,
        -20
    );
    camera.lookAt(lookTarget);
    
    // Tilt from lane switching
    camera.rotation.z = cameraEffects.tilt;
    
    // Screen shake
    if (cameraEffects.shake > 0) {
        camera.position.x += (Math.random() - 0.5) * cameraEffects.shake;
        camera.position.y += (Math.random() - 0.5) * cameraEffects.shake;
        cameraEffects.shake *= cameraEffects.shakeDecay;
        if (cameraEffects.shake < 0.01) cameraEffects.shake = 0;
    }
    
    // Boost motion blur effect (simulated via FOV and camera lag)
    if (gameState.boostActive) {
        cameraEffects.shake = 0.3;
    }
}

function triggerCameraShake(intensity = 1) {
    cameraEffects.shake = intensity;
    ui.triggerScreenShake();
}

// --- GAME FLOW CONTROL ---

function startGame() {
    // Reset state
    gameState.running = true;
    gameState.paused = false;
    gameState.score = 0;
    gameState.coins = 0;
    gameState.distance = 0;
    gameState.speed = CONFIG.BASE_SPEED;
    gameState.maxSpeed = CONFIG.BASE_SPEED;
    gameState.level = 1;
    gameState.boostActive = false;
    gameState.boostMeter = 0;
    gameState.combo = 0;
    gameState.perfectJumps = 0;
    gameState.trainsAvoided = 0;
    gameState.powerupsUsed = 0;
    gameState.startTime = Date.now();
    gameState.sessionStats = {
        jumps: 0,
        slides: 0,
        laneSwitches: 0,
        nearMisses: 0,
        coinsCollected: 0,
        powerupsCollected: 0
    };
    
    // Reset player
    player.lane = 0;
    player.targetLane = 0;
    player.group.position.set(0, 0, 0);
    player.vy = 0;
    player.isJumping = false;
    player.isDoubleJumping = false;
    player.isSliding = false;
    player.hasShield = false;
    player.hasGhost = false;
    player.magnetActive = false;
    player.multiplier = 1;
    
    // Reset chaser
    chaser.distance = CONFIG.CHASER_BASE_DISTANCE;
    chaser.angry = false;
    chaser.mesh.visible = false;
    
    // Clear world objects
    world.obstacles.forEach(o => scene.remove(o));
    world.obstacles = [];
    world.coins.forEach(c => scene.remove(c));
    world.coins = [];
    world.powerups.forEach(p => scene.remove(p));
    world.powerups = [];
    world.particles.forEach(p => scene.remove(p));
    world.particles = [];
    
    // Reset environment
    gameState.environment = 'city';
    const env = ENVIRONMENTS.city;
    scene.background.setHex(env.skyColor);
    scene.fog.color.setHex(env.fogColor);
    scene.fog.density = env.fogDensity;
    ambientLight.intensity = env.ambientIntensity;
    dirLight.color.setHex(env.lightColor);
    dirLight.intensity = env.lightIntensity;
    
    // UI
    ui.showScreen('game');
    ui.setBoostOverlay(false);
    
    // Audio
    sabuyahAudio.startMusic('city');
    
    // Reset camera
    camera.position.set(0, 7, 15);
    cameraEffects.fov = 60;
    cameraEffects.shake = 0;
}

function togglePause() {
    gameState.paused = !gameState.paused;
    if (gameState.paused) {
        sabuyahAudio.stopMusic();
        // Show pause menu (could add later)
    } else {
        sabuyahAudio.startMusic(gameState.environment);
    }
}

function gameOver() {
    gameState.running = false;
    
    // Death effects
    sabuyahAudio.playCrash();
    triggerCameraShake(2);
    createParticles(player.group.position, 0xff0000, 50);
    
    // Slow motion effect (brief)
    let slowMo = 1;
    const slowMoInterval = setInterval(() => {
        slowMo *= 0.9;
        if (slowMo < 0.1) {
            clearInterval(slowMoInterval);
            
            // Show game over
            const sessionData = {
                score: gameState.score,
                distance: gameState.distance,
                coins: gameState.coins,
                environment: gameState.environment,
                maxSpeed: gameState.maxSpeed,
                perfectRun: gameState.distance // Simplified
            };
            
            ui.showGameOver(
                gameState.score,
                gameState.distance,
                gameState.coins,
                gameState.maxSpeed,
                sessionData
            );
            
            sabuyahAudio.stopMusic();
        }
    }, 50);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- INITIALIZATION ---
// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // Bind UI buttons that need game functions
    document.getElementById('playBtn')?.addEventListener('click', () => {
        sabuyahAudio.init();
        startGame();
    });
    
    document.getElementById('restartBtn')?.addEventListener('click', () => {
        startGame();
    });
    
    document.getElementById('menuBtn')?.addEventListener('click', () => {
        ui.showScreen('start');
    });
    
    document.getElementById('boostBtn')?.addEventListener('click', () => {
        activateBoost();
    });
});

// Export for UI
window.startGame = startGame;
window.togglePause = togglePause;
window.activateBoost = activateBoost;

// ============================================
// END OF SABUYAH ENGINE
// "Every line of code is a step toward greatness"
// Made with ❤️ in Egypt
// ============================================
