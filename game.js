// 3D Game Engine Setup
const container = document.getElementById('game-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xd08a55); // لون سماء يعطي طابع شعبي وقت الغروب
scene.fog = new THREE.Fog(0xd08a55, 20, 100);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 150);
camera.position.set(0, 6, 12);
camera.lookAt(0, 2, -10);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// الإضاءة (تأثير الشمس المائلة)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffddaa, 0.8);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// الأرضية (الشارع)
const roadGeo = new THREE.PlaneGeometry(200, 200);
const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
const road = new THREE.Mesh(roadGeo, roadMat);
road.rotation.x = -Math.PI / 2;
road.receiveShadow = true;
scene.add(road);

// خطوط الشارع
const lineGeo = new THREE.PlaneGeometry(0.2, 200);
const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const line1 = new THREE.Mesh(lineGeo, lineMat); line1.position.set(-1.5, 0.01, 0); line1.rotation.x = -Math.PI/2; scene.add(line1);
const line2 = new THREE.Mesh(lineGeo, lineMat); line2.position.set(1.5, 0.01, 0); line2.rotation.x = -Math.PI/2; scene.add(line2);

// بناء اللاعب (الولد)
const playerGroup = new THREE.Group();
const skinMat = new THREE.MeshLambertMaterial({ color: 0xffccaa });
const shirtMat = new THREE.MeshLambertMaterial({ color: 0xcc2222 });
const jeansMat = new THREE.MeshLambertMaterial({ color: 0x2244aa });

const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), skinMat);
head.position.y = 2.4; head.castShadow = true; playerGroup.add(head);

const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.5), shirtMat);
body.position.y = 1.4; body.castShadow = true; playerGroup.add(body);

const armGeo = new THREE.BoxGeometry(0.3, 1, 0.3);
const leftArm = new THREE.Mesh(armGeo, skinMat); leftArm.position.set(-0.7, 1.5, 0); leftArm.castShadow = true; playerGroup.add(leftArm);
const rightArm = new THREE.Mesh(armGeo, skinMat); rightArm.position.set(0.7, 1.5, 0); rightArm.castShadow = true; playerGroup.add(rightArm);

const legGeo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
const leftLeg = new THREE.Mesh(legGeo, jeansMat); leftLeg.position.set(-0.25, 0.6, 0); leftLeg.castShadow = true; playerGroup.add(leftLeg);
const rightLeg = new THREE.Mesh(legGeo, jeansMat); rightLeg.position.set(0.25, 0.6, 0); rightLeg.castShadow = true; playerGroup.add(rightLeg);

scene.add(playerGroup);

// متغيرات اللعبة
let gameRunning = false, score = 0, coins = 0, speed = 0.4;
let targetX = 0, playerVY = 0, isJumping = false;
let obstacles = [], items = [], buildings = [];
let clock = new THREE.Clock();

// إنشاء المباني (طابع شعبي)
const buildingColors = [0xcc9966, 0xaa7755, 0xddbb99, 0x887766];
function spawnBuilding(z) {
    let side = Math.random() > 0.5 ? 1 : -1;
    let width = 4 + Math.random() * 4;
    let height = 5 + Math.random() * 10;
    let geo = new THREE.BoxGeometry(width, height, 5 + Math.random() * 5);
    let mat = new THREE.MeshLambertMaterial({ color: buildingColors[Math.floor(Math.random()*buildingColors.length)] });
    let mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(side * (5 + width/2), height/2, z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    scene.add(mesh); buildings.push(mesh);
}
for(let i=0; i<20; i++) spawnBuilding(-i * 10);

// إنشاء العقبات (عربيات وقطارات)
function spawnObstacle() {
    if(!gameRunning) return;
    let lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
    let type = Math.random() > 0.6 ? 'train' : 'car';
    let mesh;
    if(type === 'train') {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 10), new THREE.MeshLambertMaterial({ color: 0x228822 }));
        mesh.position.set(lane * 3, 1.5, -80);
        mesh.userData = { type: 'train', bbox: new THREE.Box3() };
    } else {
        mesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.5, 4), new THREE.MeshLambertMaterial({ color: 0xccaa22 }));
        mesh.position.set(lane * 3, 0.75, -80);
        mesh.userData = { type: 'car', bbox: new THREE.Box3() };
    }
    mesh.castShadow = true;
    scene.add(mesh); obstacles.push(mesh);
}

// إنشاء الذهب
function spawnCoin() {
    if(!gameRunning) return;
    let lane = Math.floor(Math.random() * 3) - 1;
    let mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16), new THREE.MeshLambertMaterial({ color: 0xffcc00 }));
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(lane * 3, 1, -80);
    mesh.userData = { isCoin: true, bbox: new THREE.Box3() };
    scene.add(mesh); items.push(mesh);
}

// نظام الموسيقى (Synthesizer)
let audioCtx;
function startMusic() {
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if(audioCtx.state === 'suspended') audioCtx.resume();
    
    // إيقاع بسيط متكرر
    setInterval(() => {
        if(!gameRunning) return;
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    }, 400); // طبلة كل 400ms
}
function playCoinSound() {
    if(!audioCtx) return;
    let osc = audioCtx.createOscillator();
    osc.type = 'sine'; osc.frequency.value = 1200;
    osc.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
}

// اللوب الرئيسي
function animate() {
    requestAnimationFrame(animate);
    let time = clock.getElapsedTime();

    if(gameRunning) {
        // حركة اللاعب يميناً ويساراً (نعومة)
        playerGroup.position.x += (targetX - playerGroup.position.x) * 0.15;
        
        // الجاذبية والقفز
        if(isJumping) {
            playerGroup.position.y += playerVY;
            playerVY -= 0.02; // قوة الجاذبية
            if(playerGroup.position.y <= 0) {
                playerGroup.position.y = 0;
                isJumping = false;
                playerVY = 0;
            }
        }

        // تحريك أطراف الولد (الجري)
        if(!isJumping) {
            leftArm.rotation.x = Math.sin(time * 15) * 0.5;
            rightArm.rotation.x = Math.sin(time * 15 + Math.PI) * 0.5;
            leftLeg.rotation.x = Math.sin(time * 15 + Math.PI) * 0.5;
            rightLeg.rotation.x = Math.sin(time * 15) * 0.5;
        } else {
            leftLeg.rotation.x = -0.5; rightLeg.rotation.x = 0;
        }

        // تحريك المباني
        buildings.forEach(b => {
            b.position.z += speed;
            if(b.position.z > 20) b.position.z -= 200;
        });

        // حركة العقبات والاصطدام
        let pBox = new THREE.Box3().setFromObject(playerGroup);
        pBox.expandByScalar(-0.2); // تقليل حجم الاصطدام قليلاً ليكون عادلاً

        for(let i=obstacles.length-1; i>=0; i--) {
            let obs = obstacles[i];
            obs.position.z += speed;
            obs.userData.bbox.setFromObject(obs);
            
            if(pBox.intersectsBox(obs.userData.bbox)) {
                gameOver();
            }
            if(obs.position.z > 20) {
                scene.remove(obs);
                obstacles.splice(i, 1);
            }
        }

        // حركة الذهب
        for(let i=items.length-1; i>=0; i--) {
            let item = items[i];
            item.position.z += speed;
            item.rotation.y += 0.1;
            item.userData.bbox.setFromObject(item);
            
            if(pBox.intersectsBox(item.userData.bbox)) {
                coins++;
                document.getElementById('coinVal').innerText = coins;
                playCoinSound();
                scene.remove(item);
                items.splice(i, 1);
                continue;
            }
            if(item.position.z > 20) { scene.remove(item); items.splice(i, 1); }
        }

        score += speed;
        document.getElementById('scoreVal').innerText = Math.floor(score);
        speed += 0.0001; // زيادة السرعة تدريجياً

        // توليد عشوائي
        if(Math.random() < 0.02) spawnObstacle();
        if(Math.random() < 0.05) spawnCoin();
    }

    renderer.render(scene, camera);
}
animate();

// التحكم
function moveLeft() { if(targetX > -3) targetX -= 3; }
function moveRight() { if(targetX < 3) targetX += 3; }
function jump() { if(!isJumping) { isJumping = true; playerVY = 0.4; } }

window.addEventListener('keydown', (e) => {
    if(!gameRunning) return;
    if(e.key === 'ArrowLeft') moveLeft();
    if(e.key === 'ArrowRight') moveRight();
    if(e.key === 'ArrowUp' || e.key === ' ') jump();
});

let touchX = 0, touchY = 0;
window.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; touchY = e.touches[0].clientY; });
window.addEventListener('touchend', e => {
    if(!gameRunning) return;
    let dx = e.changedTouches[0].clientX - touchX;
    let dy = e.changedTouches[0].clientY - touchY;
    if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) {
        if(dx > 0) moveRight(); else moveLeft();
    } else if(dy < -30) {
        jump();
    } else { jump(); } // النقر للقفز
});

// UI Logic
function startGame() {
    obstacles.forEach(o => scene.remove(o)); obstacles = [];
    items.forEach(i => scene.remove(i)); items = [];
    score = 0; coins = 0; speed = 0.4; targetX = 0;
    playerGroup.position.set(0,0,0);
    document.getElementById('scoreVal').innerText = '0';
    document.getElementById('coinVal').innerText = '0';
    
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('gameUI').classList.remove('hidden');
    
    gameRunning = true;
    startMusic();
}

function gameOver() {
    gameRunning = false;
    document.getElementById('gameUI').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.remove('hidden');
    document.getElementById('finalScore').innerText = Math.floor(score);
    document.getElementById('finalCoins').innerText = coins;
}

document.getElementById('playBtn').onclick = startGame;
document.getElementById('restartBtn').onclick = startGame;
document.getElementById('creditsBtn').onclick = () => {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('creditsScreen').classList.remove('hidden');
};
document.getElementById('closeCreditsBtn').onclick = () => {
    document.getElementById('creditsScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.remove('hidden');
};

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
