// ============================================
// المصري الذكي - ULTRA SPACE BACKGROUND v2.0
// Three.js - فضاء + كواكب + نجوم + سحب كونية
// Created by: Mohamed Ragab Abdelmonem
// ============================================

let scene, camera, renderer, stars, planets = [], nebulae = [];
let mouseX = 0, mouseY = 0;
let isInitialized = false;
let frameCount = 0;

function initSpace() {
    const container = document.getElementById('canvas-container');
    if (!container || isInitialized) return;
    isInitialized = true;

    // Scene with deep space fog
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050510, 0.0012);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 60;

    // Renderer with alpha
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    // Create space elements
    createGalaxyStars();
    createPlanets();
    createNebulae();
    createShootingStars();

    // Events
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', onWindowResize, { passive: true });

    animate();
}

function createGalaxyStars() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    const sizes = [];

    // Create spiral galaxy effect
    for (let i = 0; i < 15000; i++) {
        // Spiral distribution
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 800 + Math.random() * 200;
        const spiralOffset = angle * 2;
        
        const x = Math.cos(angle + spiralOffset) * radius + (Math.random() - 0.5) * 100;
        const y = (Math.random() - 0.5) * 400;
        const z = Math.sin(angle + spiralOffset) * radius + (Math.random() - 0.5) * 100;
        
        vertices.push(x, y, z);

        // Egyptian-themed star colors
        const colorType = Math.random();
        let r, g, b;
        if (colorType < 0.25) { r = 1; g = 0.9; b = 0.5; }      // Gold (Ra)
        else if (colorType < 0.4) { r = 0.5; g = 0.8; b = 1; }   // Blue (Nile)
        else if (colorType < 0.55) { r = 1; g = 0.6; b = 0.6; }  // Red (Desert)
        else if (colorType < 0.7) { r = 0.8; g = 0.5; b = 1; }   // Purple (Magic)
        else if (colorType < 0.85) { r = 1; g = 1; b = 1; }      // White
        else { r = 0.3; g = 0.8; b = 0.6; }                      // Green (Delta)
        
        colors.push(r, g, b);
        sizes.push(Math.random() * 3 + 0.5);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });

    stars = new THREE.Points(geometry, material);
    scene.add(stars);
}

function createPlanets() {
    // Planet 1: Egyptian Sun (Ra) - Large, glowing gold
    const sun = createAdvancedPlanet({
        color: 0xffaa00,
        size: 5,
        x: 0, y: 20, z: -80,
        glowIntensity: 0.4,
        hasRing: false,
        pulseSpeed: 0.001
    });
    planets.push(sun);

    // Planet 2: Nile World - Blue with water shimmer
    const nile = createAdvancedPlanet({
        color: 0x00aaff,
        size: 3.5,
        x: 50, y: -10, z: -60,
        glowIntensity: 0.3,
        hasRing: true,
        ringColor: 0x0088ff,
        pulseSpeed: 0.002
    });
    planets.push(nile);

    // Planet 3: Desert Mars - Red, rugged
    const desert = createAdvancedPlanet({
        color: 0xff4444,
        size: 2.8,
        x: -40, y: 15, z: -70,
        glowIntensity: 0.25,
        hasRing: false,
        pulseSpeed: 0.0015
    });
    planets.push(desert);

    // Planet 4: Mystic Purple - Egyptian magic
    const mystic = createAdvancedPlanet({
        color: 0xaa44ff,
        size: 2.2,
        x: 30, y: 25, z: -50,
        glowIntensity: 0.35,
        hasRing: true,
        ringColor: 0xff44aa,
        pulseSpeed: 0.003
    });
    planets.push(mystic);

    // Planet 5: Delta Green - Life
    const delta = createAdvancedPlanet({
        color: 0x00ff88,
        size: 3,
        x: -25, y: -20, z: -55,
        glowIntensity: 0.2,
        hasRing: false,
        pulseSpeed: 0.0025
    });
    planets.push(delta);

    // Planet 6: Silver Moon - Egyptian moon god Khonsu
    const moon = createAdvancedPlanet({
        color: 0xcccccc,
        size: 2,
        x: 60, y: 30, z: -40,
        glowIntensity: 0.15,
        hasRing: false,
        pulseSpeed: 0.004
    });
    planets.push(moon);
}

function createAdvancedPlanet(config) {
    const group = new THREE.Group();
    
    // Main planet with wireframe for tech look
    const geometry = new THREE.SphereGeometry(config.size, 32, 32);
    const material = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.4,
        wireframe: true
    });
    const planet = new THREE.Mesh(geometry, material);
    group.add(planet);

    // Solid inner core
    const coreGeometry = new THREE.SphereGeometry(config.size * 0.7, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: 0.15
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    // Glow layers
    for (let i = 1; i <= 3; i++) {
        const glowGeometry = new THREE.SphereGeometry(config.size * (1 + i * 0.2), 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: config.glowIntensity / i
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);
    }

    // Ring system
    if (config.hasRing) {
        const ringGeometry = new THREE.RingGeometry(
            config.size * 1.4, 
            config.size * 2, 
            64
        );
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: config.ringColor || config.color,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2 + Math.random() * 0.5;
        group.add(ring);
    }

    group.position.set(config.x, config.y, config.z);
    scene.add(group);

    return {
        mesh: group,
        speed: config.pulseSpeed,
        orbitRadius: Math.sqrt(config.x * config.x + config.z * config.z),
        verticalOffset: config.y,
        originalY: config.y,
        phase: Math.random() * Math.PI * 2
    };
}

function createNebulae() {
    // Create floating nebula clouds
    for (let i = 0; i < 5; i++) {
        const geometry = new THREE.PlaneGeometry(100, 100);
        const material = new THREE.MeshBasicMaterial({
            color: [0xff6b6b, 0x48dbfb, 0xfeca57, 0xff9ff3, 0x1dd1a1][i],
            transparent: true,
            opacity: 0.03,
            side: THREE.DoubleSide
        });
        const nebula = new THREE.Mesh(geometry, material);
        nebula.position.set(
            (Math.random() - 0.5) * 400,
            (Math.random() - 0.5) * 200,
            -100 - Math.random() * 200
        );
        nebula.rotation.z = Math.random() * Math.PI;
        scene.add(nebula);
        nebulae.push({ mesh: nebula, speed: Math.random() * 0.0005 });
    }
}

function createShootingStars() {
    // Periodically create shooting stars
    setInterval(() => {
        if (Math.random() > 0.7) createShootingStar();
    }, 3000);
}

function createShootingStar() {
    const geometry = new THREE.BufferGeometry();
    const startX = (Math.random() - 0.5) * 400;
    const startY = 100 + Math.random() * 100;
    const startZ = -50 - Math.random() * 100;
    
    const vertices = [startX, startY, startZ, startX + 10, startY - 5, startZ];
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    
    const material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
    });
    
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    
    // Animate and remove
    let progress = 0;
    const animateStar = () => {
        progress += 0.02;
        const positions = line.geometry.attributes.position.array;
        positions[0] += 5;
        positions[1] -= 3;
        positions[3] += 5;
        positions[4] -= 3;
        line.geometry.attributes.position.needsUpdate = true;
        material.opacity -= 0.02;
        
        if (material.opacity > 0) {
            requestAnimationFrame(animateStar);
        } else {
            scene.remove(line);
            geometry.dispose();
            material.dispose();
        }
    };
    animateStar();
}

function onMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2) * 0.001;
    mouseY = (event.clientY - window.innerHeight / 2) * 0.001;
}

function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    frameCount++;

    if (!stars || !camera) return;

    // Galaxy rotation
    stars.rotation.y += 0.00015;
    stars.rotation.x += 0.00005;

    // Twinkle effect
    if (frameCount % 60 === 0) {
        stars.material.opacity = 0.7 + Math.random() * 0.3;
    }

    // Planet animation
    const time = Date.now() * 0.001;
    planets.forEach((planet, index) => {
        // Self rotation
        planet.mesh.rotation.y += planet.speed;
        
        // Complex orbit
        const angle = time * planet.speed * 0.3 + planet.phase;
        planet.mesh.position.x = Math.cos(angle) * planet.orbitRadius;
        planet.mesh.position.z = Math.sin(angle) * planet.orbitRadius - 60;
        
        // Vertical wave
        planet.mesh.position.y = planet.originalY + Math.sin(time * 0.5 + index) * 5;
        
        // Scale pulse
        const scale = 1 + Math.sin(time * 2 + index) * 0.05;
        planet.mesh.scale.set(scale, scale, scale);
    });

    // Nebula drift
    nebulae.forEach(nebula => {
        nebula.mesh.rotation.z += nebula.speed;
        nebula.mesh.position.y += Math.sin(time * 0.2) * 0.1;
    });

    // Smooth camera follow
    camera.position.x += (mouseX * 40 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 40 - camera.position.y) * 0.02;
    
    // Subtle camera drift
    camera.position.x += Math.sin(time * 0.1) * 0.02;
    camera.position.y += Math.cos(time * 0.15) * 0.02;
    
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSpace);
} else {
    initSpace();
}

window.addEventListener('load', () => {
    if (!isInitialized) initSpace();
});
