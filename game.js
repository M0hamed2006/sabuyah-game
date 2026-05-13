// ============================================
// SABUYAH - CARTOON STYLE (Like Subway Surfers)
// "Bright, colorful, fun!" 🇪🇬
// ============================================

const CONFIG = {
    LANES: 3,
    LANE_WIDTH: 3.5,
    BASE_SPEED: 0.5,
    MAX_SPEED: 1.8,
    SPEED_INCREMENT: 0.00008,
    JUMP_FORCE: 0.45,
    GRAVITY: 0.018,
    SLIDE_DURATION: 500,
    BOOST_SPEED: 1.4,
    BOOST_DURATION: 4000,
    CHASER_BASE_DISTANCE: 40,
    ENVIRONMENT_SWITCH: 2000,
    FOG_START: 120,
    FOG_END: 200,
    DRAW_DISTANCE: 250
};

// BRIGHT CARTOON COLORS like Subway Surfers
const ENVIRONMENTS = {
    city: {
        name: 'المدينة',
        skyColor: 0x4FC3F7,      // Bright blue sky
        fogColor: 0x81D4FA,      // Light blue fog
        fogDensity: 0.003,        // Very light fog
        groundColor: 0x8D6E63,    // Warm brown tracks
        trackColor: 0x5D4037,     // Darker track
        buildingColors: [0xFF7043, 0xFFCA28, 0x66BB6A, 0x42A5F5, 0xAB47BC, 0xEF5350],
        lightColor: 0xFFFDE7,     // Warm sunlight
        lightIntensity: 1.5,
        ambientIntensity: 0.9
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
let world = { ground: null, tracks: [], buildings: [], obstacles: [], coins: [], powerups: [] };
let clock;

// ============================================
// INITIALIZATION - BRIGHT & CARTOON
// ============================================

function init() {
    const container = document.getElementById('game-container');
    
    scene = new THREE.Scene();
    const env = ENVIRONMENTS.city;
    scene.background = new THREE.Color(env.skyColor);
    
    // Very light fog for depth only
    scene.fog = new THREE.Fog(env.fogColor, CONFIG.FOG_START, CONFIG.FOG_END);

    // Camera - angled like Subway Surfers (from above-back)
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, CONFIG.DRAW_DISTANCE);
    camera.position.set(0, 8, 12);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4; // BRIGHTER!

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
    const env = ENVIRONMENTS.city;
    
    // Bright ambient
    const ambient = new THREE.AmbientLight(0xffffff, env.ambientIntensity);
    scene.add(ambient);

    // Hemisphere for sky/ground
    const hemi = new THREE.HemisphereLight(0x4FC3F7, 0x8D6E63, 0.7);
    scene.add(hemi);

    // Strong warm sun
    const sun = new THREE.DirectionalLight(env.lightColor, env.lightIntensity);
    sun.position.set(20, 40, 30);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 150;
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    sun.shadow.bias = -0.0001;
    scene.add(sun);

    // Fill light
    const fill = new THREE.DirectionalLight(0xB3E5FC, 0.5);
    fill.position.set(-15, 20, -10);
    scene.add(fill);
}

// ============================================
// WORLD - COLORFUL TRACKS
// ============================================

function createWorld() {
    createGround();
    createTracks();
    createBuildings();
}

function createGround() {
    const env = ENVIRONMENTS.city;
    
    // Main ground plane (dirt/sand around tracks)
    const groundGeo = new THREE.PlaneGeometry(100, 400);
    const groundMat = new THREE.MeshStandardMaterial({ 
        color: 0xD7CCC8,  // Light sand
        roughness: 1
    });
    world.ground = new THREE.Mesh(groundGeo, groundMat);
    world.ground.rotation.x = -Math.PI / 2;
    world.ground.position.y = -0.1;
    world.ground.receiveShadow = true;
    scene.add(world.ground);
}

function createTracks() {
    const env = ENVIRONMENTS.city;
    
    // 3 track beds (dark brown)
    for (let i = -1; i <= 1; i++) {
        const trackGeo = new THREE.BoxGeometry(2.8, 0.2, 400);
        const trackMat = new THREE.MeshStandardMaterial({ 
            color: env.trackColor,
            roughness: 0.9
        });
        const track = new THREE.Mesh(trackGeo, trackMat);
        track.position.set(i * CONFIG.LANE_WIDTH, 0, 0);
        track.receiveShadow = true;
        scene.add(track);
        
        // Rails (silver)
        const railGeo = new THREE.BoxGeometry(0.15, 0.3, 400);
        const railMat = new THREE.MeshStandardMaterial({ 
            color: 0xB0BEC5,
            metalness: 0.8,
            roughness: 0.2
        });
        
        [-1.2, 1.2].forEach(offset => {
            const rail = new THREE.Mesh(railGeo, railMat);
            rail.position.set(i * CONFIG.LANE_WIDTH + offset, 0.25, 0);
            scene.add(rail);
        });
        
        // Sleepers (wooden planks)
        for (let z = -200; z < 200; z += 2) {
            const sleeperGeo = new THREE.BoxGeometry(2.6, 0.15, 0.6);
            const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 });
            const sleeper = new THREE.Mesh(sleeperGeo, sleeperMat);
            sleeper.position.set(i * CONFIG.LANE_WIDTH, 0.05, z);
            scene.add(sleeper);
        }
    }
    
    // Platform/sidewalks
    [-1, 1].forEach(side => {
        const platformGeo = new THREE.BoxGeometry(5, 0.5, 400);
        const platformMat = new THREE.MeshStandardMaterial({ color: 0x9E9E9E });
        const platform = new THREE.Mesh(platformGeo, platformMat);
        platform.position.set(side * 8, 0.25, 0);
        platform.receiveShadow = true;
        scene.add(platform);
        
        // Yellow safety line
        const lineGeo = new THREE.BoxGeometry(0.3, 0.05, 400);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xFFEB3B });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.position.set(side * 5.5, 0.51, 0);
        scene.add(line);
    });
}

function createBuildings() {
    for (let i = 0; i < 50; i++) {
        spawnBuilding(-i * 8 - 15);
    }
}

function spawnBuilding(z) {
    const env = ENVIRONMENTS.city;
    const side = Math.random() > 0.5 ? 1 : -1;
    const dist = 16 + Math.random() * 12;
    
    const width = 5 + Math.random() * 8;
    const height = 8 + Math.random() * 20;
    const depth = 6 + Math.random() * 10;
    
    // Main building - BRIGHT COLORS
    const geo = new THREE.BoxGeometry(width, height, depth);
    const color = env.buildingColors[Math.floor(Math.random() * env.buildingColors.length)];
    const mat = new THREE.MeshLambertMaterial({ color: color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(side * dist, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // White window frames
    const frameRows = Math.floor(height / 3);
    const frameCols = Math.floor(width / 2.5);
    
    for (let r = 0; r < frameRows; r++) {
        for (let c = 0; c < frameCols; c++) {
            const isLit = Math.random() > 0.3;
            
            // Window frame (white)
            const frameGeo = new THREE.BoxGeometry(1.4, 1.8, 0.1);
            const frameMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
            const frame = new THREE.Mesh(frameGeo, frameMat);
            frame.position.set(
                (c - frameCols/2 + 0.5) * 2.2,
                (r - frameRows/2 + 0.5) * 3 + height/2,
                side > 0 ? -depth/2 - 0.05 : depth/2 + 0.05
            );
            mesh.add(frame);
            
            // Glass (blue or yellow if lit)
            const glassGeo = new THREE.PlaneGeometry(1.2, 1.6);
            const glassColor = isLit ? 0xFFEB3B : 0x81D4FA;
            const glassMat = new THREE.MeshBasicMaterial({ 
                color: glassColor,
                transparent: true,
                opacity: isLit ? 0.9 : 0.6
            });
            const glass = new THREE.Mesh(glassGeo, glassMat);
            glass.position.z = side > 0 ? -0.06 : 0.06;
            frame.add(glass);
        }
    }
    
    // Roof details
    if (Math.random() > 0.5) {
        // AC units
        const acGeo = new THREE.BoxGeometry(1.5, 1, 1.5);
        const acMat = new THREE.MeshStandardMaterial({ color: 0xB0BEC5 });
        const ac = new THREE.Mesh(acGeo, acMat);
        ac.position.y = height/2 + 0.5;
        ac.position.x = (Math.random() - 0.5) * width * 0.6;
        mesh.add(ac);
    }
    
    // Sign/billboard on some buildings
    if (Math.random() > 0.7) {
        const signGeo = new THREE.BoxGeometry(width * 0.8, 2, 0.3);
        const signColors = [0xFF1744, 0x00E676, 0x2979FF, 0xFFEA00];
        const signMat = new THREE.MeshStandardMaterial({ 
            color: signColors[Math.floor(Math.random() * signColors.length)],
            emissive: signColors[Math.floor(Math.random() * signColors.length)],
            emissiveIntensity: 0.2
        });
        const sign = new THREE.Mesh(signGeo, signMat);
        sign.position.set(0, height/2 + 2, side > 0 ? -depth/2 - 0.2 : depth/2 + 0.2);
        mesh.add(sign);
    }
    
    scene.add(mesh);
    world.buildings.push(mesh);
}

// ============================================
// PLAYER - BIGGER & MORE COLORFUL
// ============================================

function createPlayer() {
    player.group = new THREE.Group();
    
    // BRIGHT colors like Subway Surfers
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xFFCC80, roughness: 0.4 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xFF5722, roughness: 0.5 }); // Orange-Red
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x2196F3, roughness: 0.5 }); // Bright blue
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.6 });
    
    // Bigger head (chibi style)
    const headGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 2.8;
    head.castShadow = true;
    player.group.add(head);
    
    // Red cap (like Jake)
    const capGeo = new THREE.BoxGeometry(1.1, 0.35, 1.1);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xD32F2F });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 3.35;
    player.group.add(cap);
    
    // Cap brim
    const brimGeo = new THREE.BoxGeometry(1.1, 0.1, 0.4);
    const brim = new THREE.Mesh(brimGeo, capMat);
    brim.position.set(0, 3.2, 0.6);
    player.group.add(brim);
    
    // Big expressive eyes
    const eyeWhiteGeo = new THREE.PlaneGeometry(0.25, 0.3);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    [-1, 1].forEach(side => {
        const white = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
        white.position.set(side * 0.22, 2.85, 0.51);
        player.group.add(white);
        
        const pupilGeo = new THREE.CircleGeometry(0.08, 8);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const pupil = new THREE.Mesh(pupilGeo, pupilMat);
        pupil.position.set(side * 0.22, 2.85, 0.52);
        player.group.add(pupil);
    });
    
    // Smile
    const smileGeo = new THREE.TorusGeometry(0.15, 0.03, 4, 8, Math.PI);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const smile = new THREE.Mesh(smileGeo, smileMat);
    smile.position.set(0, 2.6, 0.51);
    smile.rotation.z = Math.PI;
    player.group.add(smile);
    
    // Body (hoodie)
    const bodyGeo = new THREE.BoxGeometry(1.2, 1.4, 0.7);
    const body = new THREE.Mesh(bodyGeo, shirtMat);
    body.position.y = 1.8;
    body.castShadow = true;
    player.group.add(body);
    
    // White stripe on hoodie
    const stripeGeo = new THREE.BoxGeometry(1.25, 0.2, 0.72);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = 2.2;
    player.group.add(stripe);
    
    // Backpack (green)
    const packGeo = new THREE.BoxGeometry(0.8, 1.2, 0.5);
    const packMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
    const pack = new THREE.Mesh(packGeo, packMat);
    pack.position.set(0, 2.0, -0.6);
    player.group.add(pack);
    
    // Arms (bigger)
    const armGeo = new THREE.BoxGeometry(0.35, 1.2, 0.35);
    [-1, 1].forEach((side, i) => {
        const arm = new THREE.Mesh(armGeo, skinMat);
        arm.position.set(side * 0.9, 1.9, 0);
        arm.castShadow = true;
        arm.name = i === 0 ? 'leftArm' : 'rightArm';
        player.group.add(arm);
    });
    
    // Legs (baggy pants)
    const legGeo = new THREE.BoxGeometry(0.45, 1.4, 0.45);
    [-1, 1].forEach((side, i) => {
        const leg = new THREE.Mesh(legGeo, pantsMat);
        leg.position.set(side * 0.35, 0.7, 0);
        leg.castShadow = true;
        leg.name = i === 0 ? 'leftLeg' : 'rightLeg';
        player.group.add(leg);
    });
    
    // Big shoes (sneakers)
    const shoeGeo = new THREE.BoxGeometry(0.6, 0.3, 0.8);
    [-1, 1].forEach(side => {
        const shoe = new THREE.Mesh(shoeGeo, shoeMat);
        shoe.position.set(side * 0.35, 0, 0.15);
        player.group.add(shoe);
        
        // Red accent on shoes
        const accentGeo = new THREE.BoxGeometry(0.62, 0.1, 0.3);
        const accentMat = new THREE.MeshBasicMaterial({ color: 0xFF1744 });
        const accent = new THREE.Mesh(accentGeo, accentMat);
        accent.position.y = 0.12;
        shoe.add(accent);
    });
    
    // Shadow
    const shadowGeo = new THREE.CircleGeometry(0.8, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ 
        color: 0x000000, 
        transparent: true, 
        opacity: 0.25 
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    shadow.name = 'shadow';
    player.group.add(shadow);
    
    scene.add(player.group);
}

// ============================================
// CHASER - SECURITY GUARD
// ============================================

function createChaser() {
    chaser.mesh = new THREE.Group();
    
    // Guard body (blue uniform)
    const bodyGeo = new THREE.BoxGeometry(2, 3.5, 1.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1565C0 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.75;
    chaser.mesh.add(body);
    
    // Hat
    const hatGeo = new THREE.BoxGeometry(2.2, 0.3, 1.7);
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x0D47A1 });
    const hat = new THREE.Mesh(hatGeo, hatMat);
    hat.position.y = 3.6;
    chaser.mesh.add(hat);
    
    // Angry eyes
    const eyeGeo = new THREE.SphereGeometry(0.15);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    [-1, 1].forEach(side => {
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        eye.position.set(side * 0.4, 2.8, 0.8);
        chaser.mesh.add(eye);
    });
    
    // Mustache
    const stacheGeo = new THREE.BoxGeometry(0.8, 0.1, 0.1);
    const stacheMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const stache = new THREE.Mesh(stacheGeo, stacheMat);
    stache.position.set(0, 2.5, 0.8);
    chaser.mesh.add(stache);
    
    // Flashlight
    const flashGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.8);
    const flashMat = new THREE.MeshStandardMaterial({ color: 0x424242, metalness: 0.8 });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.rotation.x = Math.PI / 2;
    flash.position.set(1.2, 2, 0.5);
    chaser.mesh.add(flash);
    
    // Light beam
    const beamGeo = new THREE.ConeGeometry(0.5, 4, 8, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({ 
        color: 0xFFFF00, 
        transparent: true, 
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(1.2, 2, 2.5);
    chaser.mesh.add(beam);
    
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
            jump();
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
        if (typeof sabuyahAudio !== 'undefined') sabuyahAudio.playJump();
    }
}

function slide() {
    if (!player.isSliding && !player.isJumping) {
        player.isSliding = true;
        player.slideTimer = CONFIG.SLIDE_DURATION;
        player.group.scale.y = 0.35;
        player.group.position.y = -1.0;
        if (typeof sabuyahAudio !== 'undefined') sabuyahAudio.playSlide();
    }
}

function activateBoost() {
    if (gameState.boostMeter >= 100 && !gameState.boostActive) {
        gameState.boostActive = true;
        gameState.boostMeter = 0;
        if (typeof sabuyahAudio !== 'undefined') sabuyahAudio.playBoost();
        
        setTimeout(() => {
            gameState.boostActive = false;
        }, CONFIG.BOOST_DURATION);
    }
}

// ============================================
// SPAWNING - COLORFUL OBSTACLES
// ============================================

function spawnObstacle() {
    if (!gameState.running) return;
    
    const lane = Math.floor(Math.random() * 3) - 1;
    const type = Math.random() > 0.5 ? 'train' : 'car';
    let mesh;
    
    if (type === 'train') {
        // COLORFUL train
        const colors = [0x4CAF50, 0xFF9800, 0x9C27B0, 0x00BCD4, 0xE91E63];
        const trainColor = colors[Math.floor(Math.random() * colors.length)];
        
        const geo = new THREE.BoxGeometry(2.8, 3.8, 12);
        const mat = new THREE.MeshStandardMaterial({ 
            color: trainColor,
            roughness: 0.3,
            metalness: 0.4
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(lane * CONFIG.LANE_WIDTH, 1.9, -100);
        
        // Windows with yellow light
        for (let i = 0; i < 5; i++) {
            const winGeo = new THREE.PlaneGeometry(2.2, 1.2);
            const winMat = new THREE.MeshBasicMaterial({ 
                color: 0xFFEB3B,
                transparent: true,
                opacity: 0.8
            });
            const win = new THREE.Mesh(winGeo, winMat);
            win.position.set(0, 0.5, -4.5 + i * 2.2);
            mesh.add(win);
        }
        
        // Headlight
        const lightGeo = new THREE.SphereGeometry(0.3);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.set(0, 0, 6.1);
        mesh.add(light);
        
        mesh.userData = { type: 'train', lane: lane, bbox: new THREE.Box3() };
        
    } else {
        // COLORFUL car
        const colors = [0xFF1744, 0x2979FF, 0xFFEA00, 0x00E676, 0xFF6D00];
        const carColor = colors[Math.floor(Math.random() * colors.length)];
        
        const geo = new THREE.BoxGeometry(2.2, 1.6, 4.5);
        const mat = new THREE.MeshStandardMaterial({ 
            color: carColor,
            roughness: 0.2,
            metalness: 0.7
        });
        mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(lane * CONFIG.LANE_WIDTH, 0.8, -100);
        
        // Roof
        const roofGeo = new THREE.BoxGeometry(1.8, 0.8, 3);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const roof = new THREE.Mesh(roofGeo, roofMat);
        roof.position.y = 1.0;
        mesh.add(roof);
        
        // Wheels (black with silver hub)
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 12);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x212121 });
        const hubGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.26, 8);
        const hubMat = new THREE.MeshStandardMaterial({ color: 0xB0BEC5, metalness: 0.9 });
        
        [[-1, -1.5], [1, -1.5], [-1, 1.5], [1, 1.5]].forEach(([side, z]) => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(side * 1.2, -0.4, z);
            mesh.add(wheel);
            
            const hub = new THREE.Mesh(hubGeo, hubMat);
            hub.rotation.z = Math.PI / 2;
            hub.position.set(side * 1.2, -0.4, z);
            mesh.add(hub);
        });
        
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
    
    if (pattern < 0.4) {
        createCoin(lane * CONFIG.LANE_WIDTH, 1.2, -100);
    } else if (pattern < 0.7) {
        for (let i = 0; i < 5; i++) {
            createCoin(lane * CONFIG.LANE_WIDTH, 1.2, -100 - i * 3);
        }
    } else {
        // Arc
        for (let i = 0; i < 7; i++) {
            const y = 1.2 + Math.sin(i * Math.PI / 6) * 2.5;
            createCoin(lane * CONFIG.LANE_WIDTH, y, -100 - i * 2.5);
        }
    }
}

function createCoin(x, y, z) {
    // BIGGER, SHINIER coins
    const geo = new THREE.CylinderGeometry(0.6, 0.6, 0.12, 16);
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0xFFD700,
        metalness: 1,
        roughness: 0.1,
        emissive: 0xFFAA00,
        emissiveIntensity: 0.5
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, y, z);
    
    // Outer ring (brighter)
    const ringGeo = new THREE.TorusGeometry(0.7, 0.08, 8, 16);
    const ringMat = new THREE.MeshBasicMaterial({ 
        color: 0xFFECB3,
        transparent: true,
        opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    mesh.add(ring);
    
    // Sparkle
    const sparkleGeo = new THREE.OctahedronGeometry(0.15);
    const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const sparkle = new THREE.Mesh(sparkleGeo, sparkleMat);
    sparkle.position.y = 0.5;
    mesh.add(sparkle);
    
    mesh.userData = { 
        isCoin: true, 
        bbox: new THREE.Box3(), 
        baseY: y,
        sparkle: sparkle 
    };
    
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
    const speedMult = gameState.boostActive ? CONFIG.BOOST_SPEED : 1;
    gameState.speed = Math.min(CONFIG.MAX_SPEED, CONFIG.BASE_SPEED + gameState.distance * CONFIG.SPEED_INCREMENT);
    const currentSpeed = gameState.speed * speedMult;
    
    gameState.score += currentSpeed;
    gameState.distance += currentSpeed;
    
    const newLevel = Math.floor(gameState.distance / CONFIG.ENVIRONMENT_SWITCH) + 1;
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
    }
    
    if (!gameState.boostActive && gameState.boostMeter < 100) {
        gameState.boostMeter = Math.min(100, gameState.boostMeter + 0.02);
    }
    
    player.lane += (player.targetLane - player.lane) * 0.1;
    player.group.position.x += (player.targetLane * CONFIG.LANE_WIDTH - player.group.position.x) * 0.12;
    
    if (player.isJumping) {
        player.group.position.y += player.vy;
        player.vy -= CONFIG.GRAVITY;
        
        if (player.group.position.y <= 0) {
            player.group.position.y = 0;
            player.isJumping = false;
            player.vy = 0;
        }
    }
    
    if (player.isSliding) {
        player.slideTimer -= delta * 1000;
        if (player.slideTimer <= 0) {
            player.isSliding = false;
            player.group.scale.y = 1;
            player.group.position.y = 0;
        }
    }
    
    // Animation
    if (!player.isJumping && !player.isSliding) {
        const runSpeed = 10;
        const leftArm = player.group.getObjectByName('leftArm');
        const rightArm = player.group.getObjectByName('rightArm');
        const leftLeg = player.group.getObjectByName('leftLeg');
        const rightLeg = player.group.getObjectByName('rightLeg');
        
        if (leftArm) leftArm.rotation.x = Math.sin(time * runSpeed) * 0.8;
        if (rightArm) rightArm.rotation.x = Math.sin(time * runSpeed + Math.PI) * 0.8;
        if (leftLeg) leftLeg.rotation.x = Math.sin(time * runSpeed + Math.PI) * 0.8;
        if (rightLeg) rightLeg.rotation.x = Math.sin(time * runSpeed) * 0.8;
        
        player.group.position.y = Math.abs(Math.sin(time * runSpeed * 2)) * 0.1;
    } else if (player.isJumping) {
        const leftArm = player.group.getObjectByName('leftArm');
        const rightArm = player.group.getObjectByName('rightArm');
        if (leftArm) leftArm.rotation.x = -1.2;
        if (rightArm) rightArm.rotation.x = -1.2;
    }
    
    // Update HUD
    if (typeof ui !== 'undefined') {
        ui.updateHUD(gameState.score, gameState.coins, gameState.distance, gameState.level, gameState.boostMeter, 0);
    }
}

function updateVisuals(delta, time) {
    const speed = gameState.speed * (gameState.boostActive ? CONFIG.BOOST_SPEED : 1);
    
    // Buildings
    world.buildings.forEach(b => {
        b.position.z += speed;
        if (b.position.z > 30) {
            b.position.z -= 400;
            b.position.x = (Math.random() > 0.5 ? 1 : -1) * (16 + Math.random() * 12);
        }
    });
    
    // Obstacles
    for (let i = world.obstacles.length - 1; i >= 0; i--) {
        const obs = world.obstacles[i];
        obs.position.z += speed;
        
        if (obs.position.z > 20) {
            scene.remove(obs);
            world.obstacles.splice(i, 1);
        }
    }
    
    // Coins with sparkle
    for (let i = world.coins.length - 1; i >= 0; i--) {
        const coin = world.coins[i];
        coin.position.z += speed;
        coin.rotation.y += 4 * delta;
        coin.position.y = coin.userData.baseY + Math.sin(time * 2.5 + coin.position.z * 0.1) * 0.15;
        
        // Sparkle rotation
        if (coin.userData.sparkle) {
            coin.userData.sparkle.rotation.y += 5 * delta;
            coin.userData.sparkle.position.y = 0.5 + Math.sin(time * 4) * 0.2;
        }
        
        if (coin.position.z > 20) {
            scene.remove(coin);
            world.coins.splice(i, 1);
        }
    }
    
    // Spawn
    if (Math.random() < 0.012) spawnObstacle();
    if (Math.random() < 0.035) spawnCoin();
}

function checkCollisions() {
    const pBox = new THREE.Box3().setFromObject(player.group);
    pBox.expandByScalar(-0.3);
    
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
    
    for (let i = world.coins.length - 1; i >= 0; i--) {
        const coin = world.coins[i];
        coin.userData.bbox.setFromObject(coin);
        
        if (pBox.intersectsBox(coin.userData.bbox)) {
            gameState.coins++;
            gameState.score += 10;
            gameState.boostMeter = Math.min(100, gameState.boostMeter + 2);
            if (typeof sabuyahAudio !== 'undefined') sabuyahAudio.playCoin();
            
            scene.remove(coin);
            world.coins.splice(i, 1);
        }
    }
}

function updateCamera() {
    const targetX = player.group.position.x * 0.3;
    const targetY = 8 + player.group.position.y * 0.3;
    const targetZ = gameState.boostActive ? 14 : 12;
    
    camera.position.x += (targetX - camera.position.x) * 0.04;
    camera.position.y += (targetY - camera.position.y) * 0.04;
    camera.position.z += (targetZ - camera.position.z) * 0.04;
    
    camera.lookAt(player.group.position.x * 0.2, 3, -15);
    
    const targetFOV = gameState.boostActive ? 75 : 60;
    camera.fov += (targetFOV - camera.fov) * 0.05;
    camera.updateProjectionMatrix();
}

function updateChaser() {
    if (gameState.distance < 150) {
        chaser.mesh.visible = false;
        return;
    }
    
    chaser.mesh.visible = true;
    
    const catchUp = (gameState.speed * 0.92) - gameState.speed;
    chaser.distance -= catchUp + 0.015;
    chaser.distance = Math.max(4, chaser.distance);
    
    chaser.mesh.position.set(
        player.lane * CONFIG.LANE_WIDTH,
        Math.sin(Date.now() * 0.004) * 0.2,
        player.group.position.z + chaser.distance
    );
    
    const danger = Math.max(0, 100 - (chaser.distance / CONFIG.CHASER_BASE_DISTANCE) * 100);
    if (typeof ui !== 'undefined') {
        ui.updateHUD(gameState.score, gameState.coins, gameState.distance, gameState.level, gameState.boostMeter, danger);
    }
    
    if (chaser.distance <= 4) gameOver();
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
    
    world.obstacles.forEach(o => scene.remove(o));
    world.obstacles = [];
    world.coins.forEach(c => scene.remove(c));
    world.coins = [];
    
    if (typeof ui !== 'undefined') {
        ui.showScreen('game');
        ui.setBoostOverlay(false);
    }
    
    if (typeof sabuyahAudio !== 'undefined') sabuyahAudio.startMusic('city');
}

function gameOver() {
    gameState.running = false;
    
    if (typeof sabuyahAudio !== 'undefined') {
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
    
    if (typeof ui !== 'undefined') {
        ui.showGameOver(gameState.score, gameState.distance, gameState.coins, gameState.speed, sessionData);
    }
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
        if (typeof sabuyahAudio !== 'undefined') sabuyahAudio.init();
        startGame();
    });
    
    document.getElementById('restartBtn')?.addEventListener('click', startGame);
    document.getElementById('menuBtn')?.addEventListener('click', () => {
        if (typeof ui !== 'undefined') ui.showScreen('start');
    });
    document.getElementById('boostBtn')?.addEventListener('click', activateBoost);
});

window.startGame = startGame;
window.activateBoost = activateBoost;
