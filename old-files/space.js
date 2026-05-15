// ============================================
// المصري الذكي - SPACE BACKGROUND (ULTRA)
// Three.js - فضاء متقدم، كواكب تفاعلية
// معدل مع try/catch لمنع تعطيل الصفحة
// ============================================

let scene, camera, renderer, starField, planets = [], nebulae = [];
let mouseX = 0, mouseY = 0, targetRotationX = 0, targetRotationY = 0;
let animationId = null;
let isInitialized = false;

const CONFIG = {
    starCount: 4000,
    fogIntensity: 0.0005,
    planetBaseSpeed: 0.002,
    cameraSmoothing: 0.05,
    mouseInfluence: 0.8,
    enableMobile: true,
    colors: {
        background: 0x0a0a2a,
        fog: 0x0a0a2a,
        starColors: [0xffffff, 0xfff5cc, 0xffcc88, 0xaaddff, 0xffaaee]
    }
};

function initSpace() {
    try {
        if (isInitialized) return;
        
        const container = document.getElementById('canvas-container');
        if (!container) {
            console.warn('⚠️ space.js: #canvas-container not found, creating automatically');
            const newContainer = document.createElement('div');
            newContainer.id = 'canvas-container';
            newContainer.style.position = 'fixed';
            newContainer.style.top = '0';
            newContainer.style.left = '0';
            newContainer.style.width = '100%';
            newContainer.style.height = '100%';
            newContainer.style.zIndex = '-1';
            document.body.insertBefore(newContainer, document.body.firstChild);
            // use the new container
            const finalContainer = document.getElementById('canvas-container');
            if (!finalContainer) return;
            finalContainer.style.position = 'fixed';
            finalContainer.style.top = '0';
            finalContainer.style.left = '0';
            finalContainer.style.width = '100%';
            finalContainer.style.height = '100%';
            finalContainer.style.zIndex = '-1';
            finalContainer.style.pointerEvents = 'none';
            // create scene etc with this container
            initializeThree(finalContainer);
        } else {
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.zIndex = '-1';
            container.style.pointerEvents = 'none';
            initializeThree(container);
        }
        
        isInitialized = true;
        console.log('🚀 Space background initialized with advanced effects');
    } catch(e) {
        console.warn('⚠️ space.js init error (non-critical):', e);
        isInitialized = true; // Mark as initialized to prevent repeated attempts
    }
}

function initializeThree(container) {
    try {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(CONFIG.colors.background);
        scene.fog = new THREE.FogExp2(CONFIG.colors.fog, CONFIG.fogIntensity);
        
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        camera.position.set(0, 10, 80);
        camera.lookAt(0, 0, 0);
        
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);
        
        const ambientLight = new THREE.AmbientLight(0x222222);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 0.5, 200);
        pointLight.position.set(10, 20, 15);
        scene.add(pointLight);
        
        createStarField();
        createNebulae();
        createPlanets();
        createDustParticles();
        
        window.addEventListener('resize', onWindowResize);
        document.addEventListener('mousemove', onMouseMove);
        if (CONFIG.enableMobile) {
            document.addEventListener('touchmove', onTouchMove);
        }
        
        startAnimationLoop();
    } catch(e) {
        console.warn('⚠️ Three.js initialization error:', e);
    }
}

function createStarField() {
    try {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];
        const sizes = [];
        
        for (let i = 0; i < CONFIG.starCount; i++) {
            const radius = 400 + Math.random() * 300;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            vertices.push(x, y, z);
            
            const colorIdx = Math.floor(Math.random() * CONFIG.colors.starColors.length);
            const colorHex = CONFIG.colors.starColors[colorIdx];
            const r = ((colorHex >> 16) & 255) / 255;
            const g = ((colorHex >> 8) & 255) / 255;
            const b = (colorHex & 255) / 255;
            colors.push(r, g, b);
            sizes.push(0.5 + Math.random() * 1.2);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(new Float32Array(sizes), 1));
        
        const vertexShader = `
            attribute float size;
            attribute vec3 color;
            varying vec3 vColor;
            void main() {
                vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * ( 300.0 / ( - mvPosition.z ) );
                gl_PointSize = min(gl_PointSize, 6.0);
                gl_PointSize = max(gl_PointSize, 0.8);
                gl_Position = projectionMatrix * mvPosition;
            }
        `;
        const fragmentShader = `
            varying vec3 vColor;
            void main() {
                float r = distance(gl_PointCoord, vec2(0.5));
                if (r > 0.5) discard;
                float alpha = (1.0 - smoothstep(0.2, 0.5, r)) * 0.9;
                gl_FragColor = vec4(vColor, alpha);
            }
        `;
        
        const material = new THREE.ShaderMaterial({
            uniforms: {},
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        starField = new THREE.Points(geometry, material);
        scene.add(starField);
    } catch(e) {
        console.warn('createStarField error:', e);
    }
}

function createNebulae() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 512, 512);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 300; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const rad = Math.random() * 40 + 5;
            const alpha = Math.random() * 0.2;
            ctx.fillStyle = `rgba(100, 150, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(x, y, rad, 0, Math.PI * 2);
            ctx.fill();
        }
        const nebulaTexture = new THREE.CanvasTexture(canvas);
        
        for (let i = 0; i < 6; i++) {
            const material = new THREE.SpriteMaterial({
                map: nebulaTexture,
                color: new THREE.Color().setHSL(0.6 + Math.random() * 0.2, 0.7, 0.5),
                transparent: true,
                opacity: 0.1 + Math.random() * 0.15,
                blending: THREE.AdditiveBlending
            });
            const sprite = new THREE.Sprite(material);
            const scale = 80 + Math.random() * 100;
            sprite.scale.set(scale, scale, 1);
            sprite.position.set(
                (Math.random() - 0.5) * 400,
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200 - 100
            );
            scene.add(sprite);
            nebulae.push(sprite);
        }
    } catch(e) {
        console.warn('createNebulae error:', e);
    }
}

function createPlanets() {
    try {
        const planetsData = [
            { color: 0xff6666, size: 3.2, pos: [-40, 5, -50], ring: true, name: 'Mars-like' },
            { color: 0x66aaff, size: 3.8, pos: [35, -10, -70], ring: false, name: 'Earth-like' },
            { color: 0xffcc44, size: 4.5, pos: [0, 15, -90], ring: true, name: 'Sun Ra' },
            { color: 0xaa66ff, size: 2.8, pos: [-25, 20, -40], ring: false, name: 'Mystery' },
            { color: 0x44ffaa, size: 3.0, pos: [45, 0, -60], ring: false, name: 'Nile' },
            { color: 0xffaa66, size: 3.5, pos: [15, -15, -110], ring: true, name: 'Desert' }
        ];
        
        planetsData.forEach((data, idx) => {
            const geometry = new THREE.SphereGeometry(data.size, 64, 64);
            const material = new THREE.MeshStandardMaterial({
                color: data.color,
                roughness: 0.4,
                metalness: 0.3,
                emissive: new THREE.Color(data.color),
                emissiveIntensity: 0.1
            });
            const planet = new THREE.Mesh(geometry, material);
            planet.position.set(data.pos[0], data.pos[1], data.pos[2]);
            scene.add(planet);
            
            if (data.ring) {
                const ringGeo = new THREE.TorusGeometry(data.size * 1.3, 0.6, 32, 200);
                const ringMat = new THREE.MeshStandardMaterial({
                    color: data.color,
                    emissive: data.color,
                    emissiveIntensity: 0.15,
                    transparent: true,
                    opacity: 0.4,
                    side: THREE.DoubleSide
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 2 + 0.3;
                ring.rotation.z = 0.5;
                planet.add(ring);
            }
            
            const glowGeo = new THREE.SphereGeometry(data.size * 1.05, 32, 32);
            const glowMat = new THREE.MeshBasicMaterial({
                color: data.color,
                transparent: true,
                opacity: 0.08,
                side: THREE.BackSide
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            planet.add(glow);
            
            planets.push({
                mesh: planet,
                speed: (0.001 + Math.random() * 0.002) * (idx % 2 === 0 ? 1 : -1),
                axisX: (Math.random() - 0.5) * 2,
                axisZ: (Math.random() - 0.5) * 2,
                baseY: data.pos[1],
                floatSpeed: 0.5 + Math.random() * 0.8,
                floatAmp: 2 + Math.random() * 2
            });
        });
    } catch(e) {
        console.warn('createPlanets error:', e);
    }
}

function createDustParticles() {
    try {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        for (let i = 0; i < 2000; i++) {
            vertices.push((Math.random() - 0.5) * 300);
            vertices.push((Math.random() - 0.5) * 200);
            vertices.push((Math.random() - 0.5) * 150 - 50);
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
        const material = new THREE.PointsMaterial({
            color: 0x88aaff,
            size: 0.3,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        const dust = new THREE.Points(geometry, material);
        scene.add(dust);
    } catch(e) {
        console.warn('createDustParticles error:', e);
    }
}

function onMouseMove(event) {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = (event.clientY / window.innerHeight) * 2 - 1;
    targetRotationX = mouseY * CONFIG.mouseInfluence;
    targetRotationY = mouseX * CONFIG.mouseInfluence;
}

function onTouchMove(event) {
    if (event.touches.length) {
        mouseX = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouseY = (event.touches[0].clientY / window.innerHeight) * 2 - 1;
        targetRotationX = mouseY * CONFIG.mouseInfluence;
        targetRotationY = mouseX * CONFIG.mouseInfluence;
    }
}

function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    if (!scene || !camera || !renderer) return;
    
    try {
        camera.rotation.x += (targetRotationX * 0.2 - camera.rotation.x) * 0.05;
        camera.rotation.y += (targetRotationY * 0.2 - camera.rotation.y) * 0.05;
        camera.position.x += (targetRotationX * 8 - camera.position.x) * 0.03;
        camera.position.y += (-targetRotationY * 6 - camera.position.y) * 0.03;
        camera.lookAt(0, 0, -20);
        
        if (starField) {
            starField.rotation.y += 0.0003;
            starField.rotation.x += 0.00015;
        }
        
        nebulae.forEach((neb, i) => {
            neb.position.x += 0.02 * (i % 2 === 0 ? 1 : -1);
            if (Math.abs(neb.position.x) > 300) neb.position.x *= -0.9;
        });
        
        const time = Date.now() * 0.001;
        planets.forEach((p) => {
            p.mesh.rotation.y += p.speed;
            p.mesh.rotation.x += p.speed * 0.7;
            p.mesh.position.y = p.baseY + Math.sin(time * p.floatSpeed) * p.floatAmp;
        });
        
        renderer.render(scene, camera);
    } catch(e) {
        console.warn('animate error:', e);
    }
}

function startAnimationLoop() {
    if (animationId) cancelAnimationFrame(animationId);
    function loop() {
        animate();
        animationId = requestAnimationFrame(loop);
    }
    loop();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSpace);
} else {
    initSpace();
}

window.addEventListener('load', () => {
    if (!isInitialized) initSpace();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (animationId) cancelAnimationFrame(animationId);
        animationId = null;
    } else {
        if (!animationId && isInitialized) startAnimationLoop();
    }
});
