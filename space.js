// ============================================
// المصري الذكي - SPACE BACKGROUND
// Three.js - فضاء + كواكب + نجوم متحركة
// Created by: Mohamed Ragab Abdelmonem
// ============================================

let scene, camera, renderer, stars, planets = [];
let mouseX = 0, mouseY = 0;
let isInitialized = false;

function initSpace() {
    const container = document.getElementById('canvas-container');
    if (!container || isInitialized) return;
    isInitialized = true;

    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.0008);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    // Stars
    createStars();

    // Planets
    createPlanets();

    // Mouse interaction
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('resize', onWindowResize, { passive: true });

    // Animation
    animate();
}

function createStars() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];

    for (let i = 0; i < 8000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        vertices.push(x, y, z);

        // Star colors: white, blue, yellow, red, purple
        const colorType = Math.random();
        let r, g, b;
        if (colorType < 0.6) { r = 1; g = 1; b = 1; }
        else if (colorType < 0.7) { r = 0.5; g = 0.7; b = 1; }
        else if (colorType < 0.8) { r = 1; g = 0.9; b = 0.5; }
        else if (colorType < 0.9) { r = 1; g = 0.5; b = 0.5; }
        else { r = 0.8; g = 0.5; b = 1; }
        colors.push(r, g, b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    stars = new THREE.Points(geometry, material);
    scene.add(stars);
}

function createPlanets() {
    // Planet 1: Mars-like (Red) - Egyptian Desert
    const planet1 = createPlanet(0xff6b6b, 3, -30, 10, -20);
    planets.push(planet1);

    // Planet 2: Earth-like (Blue) - Nile River
    const planet2 = createPlanet(0x48dbfb, 2.5, 40, -15, -30);
    planets.push(planet2);

    // Planet 3: Gold (Egyptian Sun) - Ra
    const planet3 = createPlanet(0xfeca57, 4, 0, 30, -50);
    planets.push(planet3);

    // Planet 4: Purple (Mystery) - Egyptian Magic
    const planet4 = createPlanet(0xff9ff3, 2, -50, -20, -40);
    planets.push(planet4);

    // Planet 5: Green (Nile Delta) - Life
    const planet5 = createPlanet(0x1dd1a1, 2.8, 25, 20, -35);
    planets.push(planet5);
}

function createPlanet(color, size, x, y, z) {
    // Main planet sphere
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.5,
        wireframe: true
    });
    const planet = new THREE.Mesh(geometry, material);
    planet.position.set(x, y, z);
    
    // Inner glow
    const glowGeometry = new THREE.SphereGeometry(size * 1.1, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.08
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    planet.add(glow);

    // Outer ring (Saturn style for some planets)
    if (Math.random() > 0.5) {
        const ringGeometry = new THREE.RingGeometry(size * 1.3, size * 1.6, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        planet.add(ring);
    }

    scene.add(planet);
    return { 
        mesh: planet, 
        speed: Math.random() * 0.005 + 0.002, 
        orbitRadius: Math.sqrt(x*x + z*z),
        verticalOffset: y
    };
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

    if (!stars || !camera) return;

    // Rotate stars slowly
    stars.rotation.y += 0.0002;
    stars.rotation.x += 0.0001;

    // Animate planets
    const time = Date.now() * 0.001;
    planets.forEach((planet, index) => {
        // Self rotation
        planet.mesh.rotation.y += planet.speed;
        planet.mesh.rotation.x += planet.speed * 0.5;
        
        // Orbit movement (elliptical)
        const angle = time * planet.speed * 0.5 + index * Math.PI / 2;
        planet.mesh.position.x = Math.cos(angle) * planet.orbitRadius;
        planet.mesh.position.z = Math.sin(angle) * planet.orbitRadius - 50;
        
        // Vertical bobbing
        planet.mesh.position.y = planet.verticalOffset + Math.sin(time * 0.5 + index) * 3;
    });

    // Camera follows mouse smoothly
    camera.position.x += (mouseX * 30 - camera.position.x) * 0.03;
    camera.position.y += (-mouseY * 30 - camera.position.y) * 0.03;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSpace);
} else {
    initSpace();
}

// Also try on window load as backup
window.addEventListener('load', function() {
    if (!isInitialized) initSpace();
});
