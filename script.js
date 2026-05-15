/* ================================================================
   ✦  المصري الذكي — المحرك الكوني الكامل
   ================================================================ */

'use strict';

// ════════════════════════════════════════════════════════════════
//  ✦  الحالة العامة للتطبيق
// ════════════════════════════════════════════════════════════════
const APP = {
    apiKey:      null,
    webSearch:   false,
    chatHistory: [],
    selectedLang:'python',
    stream:      null,
    audioCtx:    null,
    masterGain:  null,
    musicOn:     false,
    musicBuilt:  false,
    currentSection: 'chat',
};

// ════════════════════════════════════════════════════════════════
//  ✦  شاشة التحميل
// ════════════════════════════════════════════════════════════════
(function initLoader() {
    // جسيمات التحميل
    const lp = document.getElementById('lParticles');
    if (lp) {
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            p.style.cssText = `
                position:absolute;
                width:${2 + Math.random() * 3}px;
                height:${2 + Math.random() * 3}px;
                border-radius:50%;
                background:${['#a259ff','#43e8c0','#f5c842','#ff4d7d'][Math.floor(Math.random()*4)]};
                left:${Math.random()*100}%;
                top:${Math.random()*100}%;
                opacity:${0.2 + Math.random()*0.5};
                animation:float-p ${3+Math.random()*4}s infinite alternate ease-in-out;
                animation-delay:${Math.random()*3}s;
            `;
            lp.appendChild(p);
        }
        const style = document.createElement('style');
        style.textContent = '@keyframes float-p{0%{transform:translateY(0)}100%{transform:translateY(-20px)}}';
        document.head.appendChild(style);
    }

    window.addEventListener('load', () => {
        setTimeout(() => {
            const ld = document.getElementById('loader');
            if (ld) ld.classList.add('gone');
        }, 2500);
    });
})();

// ════════════════════════════════════════════════════════════════
//  ✦  مؤشر الماوس المضيء
// ════════════════════════════════════════════════════════════════
(function initCursor() {
    const glow  = document.getElementById('cursorGlow');
    const trail = document.getElementById('cursorTrail');
    if (!glow || !trail) return;

    let tx = 0, ty = 0, cx = 0, cy = 0;

    window.addEventListener('mousemove', e => {
        tx = e.clientX; ty = e.clientY;
        glow.style.left  = tx + 'px';
        glow.style.top   = ty + 'px';
    });

    (function animTrail() {
        cx += (tx - cx) * 0.12;
        cy += (ty - cy) * 0.12;
        trail.style.left = cx + 'px';
        trail.style.top  = cy + 'px';
        requestAnimationFrame(animTrail);
    })();

    document.addEventListener('mousedown', () => {
        glow.style.width  = '50px';
        glow.style.height = '50px';
    });
    document.addEventListener('mouseup', () => {
        glow.style.width  = '28px';
        glow.style.height = '28px';
    });
})();

// ════════════════════════════════════════════════════════════════
//  ✦  الكون ثلاثي الأبعاد (Three.js)
// ════════════════════════════════════════════════════════════════
(function initUniverse() {
    const canvas = document.getElementById('universe-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 90);

    // ── النجوم ──
    const starCount = 7000;
    const starPos   = new Float32Array(starCount * 3);
    const starCol   = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.acos(2 * Math.random() - 1);
        const r     = 300 + Math.random() * 800;
        starPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
        starPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        starPos[i*3+2] = r * Math.cos(phi);
        const warm = Math.random() > 0.5;
        starCol[i*3]   = warm ? 1 : 0.7 + Math.random()*0.3;
        starCol[i*3+1] = warm ? 0.85 + Math.random()*0.15 : 0.8 + Math.random()*0.2;
        starCol[i*3+2] = warm ? 0.6 + Math.random()*0.3 : 1;
        starSizes[i] = 0.3 + Math.random() * 0.8;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color',    new THREE.BufferAttribute(starCol, 3));
    starGeo.setAttribute('size',     new THREE.BufferAttribute(starSizes, 1));

    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
        size: 0.6, vertexColors: true, transparent: true, opacity: 0.95,
        sizeAttenuation: true,
    })));

    // ── السُّدُم ──
    function makeNebula(count, spread, colorA, colorB, opacity) {
        const geo = new THREE.BufferGeometry();
        const pos = [], col = [];
        const ca  = new THREE.Color(colorA);
        const cb  = new THREE.Color(colorB);
        for (let i = 0; i < count; i++) {
            const rx = (Math.random() - 0.5) * spread;
            const ry = (Math.random() - 0.5) * spread * 0.35;
            const rz = (Math.random() - 0.5) * spread * 0.5;
            pos.push(rx, ry, rz);
            const t = Math.random();
            col.push(
                ca.r + (cb.r - ca.r) * t,
                ca.g + (cb.g - ca.g) * t,
                ca.b + (cb.b - ca.b) * t
            );
        }
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
        geo.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(col), 3));
        return new THREE.Points(geo, new THREE.PointsMaterial({
            size: 1.4, vertexColors: true, transparent: true, opacity,
        }));
    }

    const neb1 = makeNebula(2500, 220, '#5c2fa0', '#43e8c0', 0.13);
    const neb2 = makeNebula(1800, 180, '#c0304a', '#ff6b9d', 0.10);
    const neb3 = makeNebula(1200, 140, '#1a4fa0', '#a259ff', 0.09);
    neb1.position.set(-35, 25, -90);
    neb2.position.set(65, -20, -110);
    neb3.position.set(10, -40, -70);
    scene.add(neb1); scene.add(neb2); scene.add(neb3);

    // ── الكواكب ──
    const PLANET_DATA = [
        { r: 2.8,  color: 0xfff0a0, orbitR: 0,   speed: 0,      name: 'الشمس',    desc: 'نجمنا الذهبي المضيء', emissive: 0.8 },
        { r: 0.9,  color: 0xb0a0c0, orbitR: 14,  speed: 0.026,  name: 'عطارد',    desc: 'أقرب كوكب للشمس',     emissive: 0.05 },
        { r: 1.5,  color: 0xe8944a, orbitR: 22,  speed: 0.017,  name: 'الزهرة',   desc: 'كوكب الجمال اللامع',  emissive: 0.1 },
        { r: 1.7,  color: 0x4499ff, orbitR: 31,  speed: 0.011,  name: 'الأرض',    desc: 'كوكبنا الجميل 🌍',    emissive: 0.05 },
        { r: 1.35, color: 0xd04030, orbitR: 41,  speed: 0.009,  name: 'المريخ',   desc: 'الكوكب الأحمر',       emissive: 0.1 },
        { r: 2.7,  color: 0xe4a868, orbitR: 62,  speed: 0.0044, name: 'المشتري',  desc: 'أكبر كواكب المجموعة', emissive: 0.05 },
        { r: 2.35, color: 0xd4b870, orbitR: 82,  speed: 0.0032, name: 'زحل',     desc: 'كوكب الحلقات الرائع',  emissive: 0.05, rings: true },
        { r: 1.8,  color: 0x60d8f0, orbitR: 102, speed: 0.0022, name: 'أورانوس', desc: 'العملاق الجليدي',      emissive: 0.08 },
        { r: 1.75, color: 0x3060ff, orbitR: 120, speed: 0.0016, name: 'نبتون',   desc: 'أبعد كوكب في مجموعتنا', emissive: 0.1 },
    ];

    const planets = PLANET_DATA.map(d => {
        const group = new THREE.Group();
        const mat   = new THREE.MeshStandardMaterial({
            color: d.color, emissive: d.color,
            emissiveIntensity: d.emissive || 0.05,
            roughness: 0.55, metalness: 0.1,
        });
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(d.r, 64, 64), mat);
        group.add(mesh);

        // هالة خافتة
        const glowMat = new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.07, side: THREE.BackSide });
        group.add(new THREE.Mesh(new THREE.SphereGeometry(d.r * 1.15, 32, 32), glowMat));

        // حلقات زحل
        if (d.rings) {
            const ringGeo = new THREE.RingGeometry(d.r * 1.4, d.r * 2.2, 64);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0xd4b870, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
            const ring    = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2.8;
            group.add(ring);
        }

        // مدار (خط دائري)
        if (d.orbitR > 0) {
            const orbitGeo = new THREE.BufferGeometry();
            const orbitPts = [];
            for (let i = 0; i <= 128; i++) {
                const a = (i / 128) * Math.PI * 2;
                orbitPts.push(Math.cos(a) * d.orbitR, 0, Math.sin(a) * d.orbitR);
            }
            orbitGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(orbitPts), 3));
            scene.add(new THREE.Line(orbitGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.04 })));
        }

        scene.add(group);
        return { group, mesh, orbitR: d.orbitR, speed: d.speed, angle: Math.random() * Math.PI * 2, name: d.name, desc: d.desc };
    });

    // ── الإضاءة ──
    const sunLight = new THREE.PointLight(0xfff8e0, 4, 400);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0x111140, 1.4));

    // ── الشهب ──
    const shootingStars = [];
    function spawnShootingStar() {
        const start = new THREE.Vector3(
            (Math.random() - 0.5) * 250,
            (Math.random() - 0.5) * 120,
            -60
        );
        const dir = new THREE.Vector3(
            -0.5 - Math.random() * 0.4,
            (Math.random() - 0.5) * 0.25,
            0
        ).normalize();
        const pts  = [start.clone(), start.clone().addScaledVector(dir, 18)];
        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0 })
        );
        scene.add(line);
        shootingStars.push({ line, dir, life: 1.0 });
        setTimeout(spawnShootingStar, 4000 + Math.random() * 9000);
    }
    setTimeout(spawnShootingStar, 3000);

    // ── Raycaster للكواكب ──
    const raycaster   = new THREE.Raycaster();
    const mouse       = new THREE.Vector2(-999, -999);
    const planetInfo  = document.getElementById('planetInfo');

    window.addEventListener('mousemove', e => {
        mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // ── حلقة الرسم ──
    let camT = 0;
    function animate() {
        requestAnimationFrame(animate);
        camT += 0.0004;
        camera.position.x = Math.sin(camT) * 7;
        camera.position.y = Math.cos(camT * 0.55) * 3.5;
        camera.lookAt(0, 0, 0);

        neb1.rotation.y += 0.00025;
        neb2.rotation.y -= 0.0002;
        neb3.rotation.x += 0.00015;

        planets.forEach(p => {
            if (p.orbitR === 0) { p.mesh.rotation.y += 0.006; return; }
            p.angle += p.speed;
            p.group.position.x = Math.cos(p.angle) * p.orbitR;
            p.group.position.z = Math.sin(p.angle) * p.orbitR;
            p.mesh.rotation.y += 0.012;
        });

        shootingStars.forEach((s, i) => {
            s.life -= 0.018;
            s.line.position.addScaledVector(s.dir, 1.8);
            s.line.material.opacity = Math.max(0, s.life);
            if (s.life <= 0) { scene.remove(s.line); shootingStars.splice(i, 1); }
        });

        // تفاعل الكواكب
        raycaster.setFromCamera(mouse, camera);
        let found = false;
        planets.forEach(p => {
            if (p.orbitR === 0) return;
            if (raycaster.intersectObject(p.mesh).length > 0) {
                found = true;
                if (planetInfo) {
                    planetInfo.innerHTML = `<strong>${p.name}</strong><br>${p.desc}`;
                    const sx = (mouse.x * 0.5 + 0.5) * window.innerWidth;
                    const sy = (-mouse.y * 0.5 + 0.5) * window.innerHeight;
                    planetInfo.style.left = sx + 14 + 'px';
                    planetInfo.style.top  = sy - 50 + 'px';
                    planetInfo.classList.add('show');
                }
            }
        });
        if (!found && planetInfo) planetInfo.classList.remove('show');

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();

// ════════════════════════════════════════════════════════════════
//  ✦  موسيقى الفضاء والمرئيات الصوتية
// ════════════════════════════════════════════════════════════════
function buildAmbientMusic() {
    APP.audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
    APP.masterGain = APP.audioCtx.createGain();
    APP.masterGain.gain.value = parseFloat(document.getElementById('volRange')?.value || 30) / 100;
    APP.masterGain.connect(APP.audioCtx.destination);

    // صدى الفضاء
    const convBuf = APP.audioCtx.createBuffer(2, APP.audioCtx.sampleRate * 6, APP.audioCtx.sampleRate);
    for (let c = 0; c < 2; c++) {
        const d = convBuf.getChannelData(c);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.2);
    }
    const reverb   = APP.audioCtx.createConvolver();
    reverb.buffer  = convBuf;
    reverb.connect(APP.masterGain);

    // ضوضاء هادئة
    const noiseBuf = APP.audioCtx.createBuffer(1, APP.audioCtx.sampleRate * 3, APP.audioCtx.sampleRate);
    const nd       = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * 0.01;
    const noiseSrc  = APP.audioCtx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    noiseSrc.loop   = true;
    const noiseFilter = APP.audioCtx.createBiquadFilter();
    noiseFilter.type  = 'bandpass';
    noiseFilter.frequency.value = 600;
    noiseFilter.Q.value = 0.5;
    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(reverb);
    noiseSrc.start();

    const CHORDS = [
        [130.81, 164.81, 196.00, 246.94],
        [116.54, 146.83, 174.61, 220.00],
        [138.59, 174.61, 207.65, 261.63],
        [123.47, 155.56, 185.00, 233.08],
        [146.83, 185.00, 220.00, 293.66],
    ];

    let chordIdx = 0;

    function playChord(freqs, start, dur) {
        freqs.forEach(f => {
            const o = APP.audioCtx.createOscillator();
            const g = APP.audioCtx.createGain();
            o.type = 'sine';
            o.frequency.value = f;
            o.detune.value = (Math.random() - 0.5) * 6;
            g.gain.setValueAtTime(0, start);
            g.gain.linearRampToValueAtTime(0.038, start + 2);
            g.gain.setValueAtTime(0.038, start + dur - 2.5);
            g.gain.linearRampToValueAtTime(0, start + dur);
            o.connect(g); g.connect(reverb);
            o.start(start); o.stop(start + dur);
        });
    }

    function playBass(f, start, dur) {
        const o = APP.audioCtx.createOscillator();
        const g = APP.audioCtx.createGain();
        o.type = 'sine';
        o.frequency.value = f / 4;
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(0.05, start + 2.5);
        g.gain.setValueAtTime(0.05, start + dur - 2);
        g.gain.linearRampToValueAtTime(0, start + dur);
        o.connect(g); g.connect(reverb);
        o.start(start); o.stop(start + dur);
    }

    function playMelody(start) {
        const notes = [523.25, 493.88, 440.00, 493.88, 523.25, 587.33, 659.25, 587.33];
        notes.forEach((n, i) => {
            const o = APP.audioCtx.createOscillator();
            const g = APP.audioCtx.createGain();
            o.frequency.value = n;
            g.gain.setValueAtTime(0, start + i * 0.7);
            g.gain.linearRampToValueAtTime(0.022, start + i * 0.7 + 0.35);
            g.gain.exponentialRampToValueAtTime(0.001, start + i * 0.7 + 3.5);
            o.connect(g); g.connect(reverb);
            o.start(start + i * 0.7);
            o.stop(start + i * 0.7 + 4);
        });
    }

    function schedule() {
        if (!APP.musicOn) { setTimeout(schedule, 2000); return; }
        const now = APP.audioCtx.currentTime;
        const ch  = CHORDS[chordIdx % CHORDS.length];
        playChord(ch, now, 8);
        playBass(ch[0], now, 8);
        if (chordIdx % 2 === 0) playMelody(now + 2);
        chordIdx++;
        setTimeout(schedule, 7500);
    }

    schedule();
    APP.musicBuilt = true;
}

function startMusic() {
    if (!APP.musicBuilt) buildAmbientMusic();
    APP.musicOn = true;
    if (APP.masterGain) {
        APP.masterGain.gain.cancelScheduledValues(APP.audioCtx.currentTime);
        APP.masterGain.gain.linearRampToValueAtTime(
            parseFloat(document.getElementById('volRange')?.value || 30) / 100,
            APP.audioCtx.currentTime + 0.5
        );
    }
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) muteBtn.textContent = '🔊';
    document.querySelectorAll('.vis-bar').forEach(b => b.classList.add('active'));
}

function stopMusic() {
    APP.musicOn = false;
    if (APP.masterGain && APP.audioCtx) {
        APP.masterGain.gain.linearRampToValueAtTime(0, APP.audioCtx.currentTime + 0.6);
    }
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) muteBtn.textContent = '🔇';
    document.querySelectorAll('.vis-bar').forEach(b => b.classList.remove('active'));
}

// تهيئة الصوت عند أول نقر
document.addEventListener('click', () => {
    if (!APP.musicBuilt) startMusic();
}, { once: true });

// أزرار الصوت
document.getElementById('muteBtn')?.addEventListener('click', () => {
    APP.musicOn ? stopMusic() : startMusic();
});

document.getElementById('volRange')?.addEventListener('input', function () {
    const v = parseFloat(this.value) / 100;
    document.getElementById('volLabel') && (document.getElementById('volLabel').textContent = this.value + '%');
    const fill = document.getElementById('volFill');
    if (fill) fill.style.width = this.value + '%';
    if (APP.masterGain && APP.audioCtx) APP.masterGain.gain.setValueAtTime(v, APP.audioCtx.currentTime);
});

// مهيئ مستوى الصوت المرئي
(function () {
    const fill = document.getElementById('volFill');
    const rng  = document.getElementById('volRange');
    if (fill && rng) fill.style.width = rng.value + '%';
})();

// ════════════════════════════════════════════════════════════════
//  ✦  التنقل بين الأقسام
// ════════════════════════════════════════════════════════════════
(function initNav() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = {
        chat:     document.getElementById('section-chat'),
        vision:   document.getElementById('section-vision'),
        code:     document.getElementById('section-code'),
        universe: document.getElementById('section-universe'),
    };

    function showSection(name) {
        APP.currentSection = name;
        navBtns.forEach(b => b.classList.toggle('active', b.dataset.section === name));
        Object.entries(sections).forEach(([key, el]) => {
            if (!el) return;
            if (key === name) {
                el.style.display = '';
                el.style.animation = 'section-reveal 0.4s cubic-bezier(0.22,1,0.36,1) both';
            } else {
                el.style.display = 'none';
            }
        });
        // إضافة كيفريم إذا لم يكن موجوداً
        if (!document.getElementById('section-reveal-kf')) {
            const s = document.createElement('style');
            s.id = 'section-reveal-kf';
            s.textContent = '@keyframes section-reveal{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}';
            document.head.appendChild(s);
        }
    }

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => showSection(btn.dataset.section));
    });

    showSection('chat');
})();

// ════════════════════════════════════════════════════════════════
//  ✦  Toast إشعارات
// ════════════════════════════════════════════════════════════════
function showToast(msg, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: '✅', error: '❌', info: '✦', warning: '⚠️' };
    const toast  = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || '✦'}</span><span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toast-out 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ════════════════════════════════════════════════════════════════
//  ✦  إدارة مفتاح API
// ════════════════════════════════════════════════════════════════
document.getElementById('saveApi')?.addEventListener('click', saveApiKey);
document.getElementById('apiKey')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') saveApiKey();
});

function saveApiKey() {
    const k   = document.getElementById('apiKey')?.value.trim();
    const btn = document.getElementById('saveApi');
    const status = document.getElementById('apiStatus');
    if (!k) { showToast('أدخل مفتاح API أولاً', 'error'); return; }
    if (!k.startsWith('sk-ant-')) {
        showToast('تأكد من صحة المفتاح (يبدأ بـ sk-ant-)', 'warning');
        return;
    }
    APP.apiKey = k;
    if (btn) { btn.textContent = '✅ محفوظ'; setTimeout(() => btn.textContent = 'حفظ', 2500); }
    if (status) status.textContent = '🟢 متصل';
    showToast('تم حفظ المفتاح وتفعيل الذكاء الاصطناعي', 'success');
}

// ════════════════════════════════════════════════════════════════
//  ✦  مودال المطور
// ════════════════════════════════════════════════════════════════
document.getElementById('devBtn')?.addEventListener('click', () => {
    document.getElementById('devModal')?.classList.remove('hidden');
});
document.getElementById('closeModal')?.addEventListener('click', () => {
    document.getElementById('devModal')?.classList.add('hidden');
});
document.getElementById('devModal')?.addEventListener('click', function (e) {
    if (e.target === this) this.classList.add('hidden');
});

// ════════════════════════════════════════════════════════════════
//  ✦  الكاميرا والرؤية الذكية
// ════════════════════════════════════════════════════════════════
(function initCamera() {
    const video       = document.getElementById('video');
    const snapCanvas  = document.getElementById('snapCanvas');
    const placeholder = document.getElementById('camPlaceholder');
    const overlay     = document.getElementById('camOverlay');

    const ids = {
        start:   document.getElementById('startCam'),
        snap:    document.getElementById('snapBtn'),
        retake:  document.getElementById('retakeBtn'),
        stop:    document.getElementById('stopCam'),
    };

    function showEl(el)  { el?.classList.remove('hidden'); }
    function hideEl(el)  { el?.classList.add('hidden'); }
    function showEls(...els) { els.forEach(showEl); }
    function hideEls(...els) { els.forEach(hideEl); }

    ids.start?.addEventListener('click', async () => {
        try {
            APP.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            video.srcObject   = APP.stream;
            video.style.display = 'block';
            if (snapCanvas) snapCanvas.style.display = 'none';
            if (placeholder) placeholder.style.display = 'none';
            if (overlay) overlay.classList.add('active');
            showEls(ids.snap, ids.stop);
            hideEls(ids.start, ids.retake);
            showToast('الكاميرا تعمل — التقط الصورة عند الجاهزية', 'info');
        } catch (e) {
            showToast('تعذر فتح الكاميرا: ' + e.message, 'error');
        }
    });

    ids.snap?.addEventListener('click', () => {
        if (!video.videoWidth) { showToast('انتظر تحميل الكاميرا', 'warning'); return; }
        snapCanvas.width  = video.videoWidth;
        snapCanvas.height = video.videoHeight;
        snapCanvas.getContext('2d').drawImage(video, 0, 0);
        const b64 = snapCanvas.toDataURL('image/jpeg', 0.85).split(',')[1];
        video.style.display       = 'none';
        snapCanvas.style.display  = 'block';
        if (overlay) overlay.classList.remove('active');
        showEls(ids.retake);
        hideEls(ids.snap);
        analyzeImage(b64);
    });

    ids.retake?.addEventListener('click', () => {
        video.style.display       = 'block';
        snapCanvas.style.display  = 'none';
        if (overlay) overlay.classList.add('active');
        showEls(ids.snap);
        hideEls(ids.retake);
        const ar = document.getElementById('analysisResult');
        const ap = document.getElementById('analysisPlaceholder');
        if (ar) ar.classList.add('hidden');
        if (ap) ap.style.display = '';
    });

    ids.stop?.addEventListener('click', () => {
        if (APP.stream) APP.stream.getTracks().forEach(t => t.stop());
        APP.stream            = null;
        video.style.display       = 'none';
        snapCanvas.style.display  = 'none';
        if (placeholder) placeholder.style.display = '';
        if (overlay) overlay.classList.remove('active');
        showEls(ids.start);
        hideEls(ids.snap, ids.stop, ids.retake);
    });
})();

async function analyzeImage(b64) {
    const result = document.getElementById('analysisResult');
    const placeholder = document.getElementById('analysisPlaceholder');
    const text   = document.getElementById('resultText');

    if (placeholder) placeholder.style.display = 'none';
    if (result) result.classList.remove('hidden');
    if (text) text.textContent = '⏳ جاري التحليل...';

    if (!APP.apiKey) {
        if (text) text.textContent = '⚠️ أدخل مفتاح API أولاً لتفعيل التحليل الذكي.';
        showToast('أدخل مفتاح API لتحليل الصور', 'warning');
        return;
    }

    try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 700,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } },
                        { type: 'text', text: 'حلل هذه الصورة بالعربية بشكل دقيق ومفيد. اذكر ما تراه، والألوان، والتفاصيل المهمة، وأي معلومات مفيدة.' }
                    ]
                }]
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error.message);
        if (text) text.textContent = data.content?.[0]?.text || 'لم يتم التحليل.';
        showToast('تم التحليل بنجاح', 'success');
    } catch (e) {
        if (text) text.textContent = '❌ خطأ: ' + e.message;
        showToast('فشل التحليل: ' + e.message, 'error');
    }
}

// ════════════════════════════════════════════════════════════════
//  ✦  المحادثة الذكية
// ════════════════════════════════════════════════════════════════
(function initChat() {
    const input   = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const counter = document.getElementById('charCount');

    // عداد الحروف
    input?.addEventListener('input', function () {
        if (counter) counter.textContent = this.value.length;
        // توسيع تلقائي
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 140) + 'px';
    });

    sendBtn?.addEventListener('click', sendChat);

    input?.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChat();
        }
    });

    // بحث الويب
    const wsToggle = document.getElementById('webSearchToggle');
    wsToggle?.addEventListener('click', () => {
        APP.webSearch = !APP.webSearch;
        wsToggle.classList.toggle('active', APP.webSearch);
        const pill = document.getElementById('wsToggle');
        if (pill) {
            pill.textContent = APP.webSearch ? 'تشغيل' : 'إيقاف';
            pill.className   = 'toggle-pill ' + (APP.webSearch ? 'on' : 'off');
        }
        showToast(APP.webSearch ? '🌐 بحث الويب مفعّل' : '🔇 بحث الويب موقف', 'info');
    });

    // مسح المحادثة
    document.getElementById('clearChat')?.addEventListener('click', () => {
        APP.chatHistory = [];
        const hist = document.getElementById('chatHistory');
        if (hist) {
            hist.innerHTML = `
                <div class="msg ai intro-msg">
                    <div class="msg-avatar">✦</div>
                    <div class="msg-content">
                        <span class="msg-tag">المصري الذكي</span>
                        <p>تمت إعادة تعيين المحادثة 🌌<br>أنا جاهز لمساعدتك من جديد.</p>
                    </div>
                </div>`;
        }
        showToast('تم مسح المحادثة', 'info');
    });

    // الاقتراحات السريعة
    document.getElementById('chatHistory')?.addEventListener('click', e => {
        const btn = e.target.closest('.qp-btn');
        if (btn) {
            if (input) input.value = btn.dataset.prompt;
            sendChat();
        }
    });
})();

async function sendChat() {
    const input = document.getElementById('chatInput');
    const text  = input?.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';
    const counter = document.getElementById('charCount');
    if (counter) counter.textContent = '0';

    appendMsg('user', text);
    APP.chatHistory.push({ role: 'user', content: text });

    if (!APP.apiKey) {
        appendMsg('ai', '⚠️ أدخل مفتاح API من الشريط العلوي لتفعيل المحادثة الذكية.', true);
        return;
    }

    const thinking = appendThinking(APP.webSearch ? '🌐 يبحث في الويب...' : '⏳ يفكر...');

    try {
        const body = {
            model:   'claude-sonnet-4-20250514',
            max_tokens: 1500,
            system: `أنت "المصري الذكي"، مساعد ذكاء اصطناعي متقدم يتحدث بالعربية الفصيحة بأسلوب ودي وذكي.
تتميز بـ:
- الإجابات الدقيقة والمفيدة
- الأسلوب الواضح والمنظم
- استخدام النقاط والعناوين عند الحاجة
- الاعتراف بعدم المعرفة عند اللزوم
أجب دائماً بالعربية إلا إذا طُلب غير ذلك.`,
            messages: APP.chatHistory,
        };

        if (APP.webSearch) {
            body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
        }

        const res  = await fetch('https://api.anthropic.com/v1/messages', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(body),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);

        const reply = data.content
            ?.filter(b => b.type === 'text')
            .map(b => b.text)
            .join('\n') || 'لم أتمكن من الإجابة.';

        thinking.remove();
        appendMsg('ai', reply, true);
        APP.chatHistory.push({ role: 'assistant', content: reply });

    } catch (e) {
        thinking.remove();
        appendMsg('ai', '❌ خطأ في الاتصال: ' + e.message, true);
        showToast('فشل الإرسال: ' + e.message, 'error');
    }
}

function appendMsg(type, html, isAI = false) {
    const hist = document.getElementById('chatHistory');
    if (!hist) return;

    const el = document.createElement('div');
    el.className = `msg ${type}`;

    if (type === 'user') {
        el.innerHTML = `
            <div class="msg-avatar">👤</div>
            <div class="msg-content">${escapeHtml(html)}</div>
        `;
    } else {
        el.innerHTML = `
            <div class="msg-avatar">✦</div>
            <div class="msg-content">
                <span class="msg-tag">المصري الذكي</span>
                <div class="msg-text">${formatAIText(html)}</div>
            </div>
        `;
    }

    hist.appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return el;
}

function appendThinking(label) {
    const hist = document.getElementById('chatHistory');
    if (!hist) return { remove: () => {} };

    const el = document.createElement('div');
    el.className = 'msg ai';
    el.innerHTML = `
        <div class="msg-avatar">✦</div>
        <div class="msg-content">
            <span class="msg-tag">المصري الذكي</span>
            <div style="display:flex;align-items:center;gap:8px;color:var(--text-dim);font-size:0.85rem;">
                <span>${label}</span>
                <div class="typing-dots"><span></span><span></span><span></span></div>
            </div>
        </div>
    `;
    hist.appendChild(el);
    el.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return el;
}

function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}

function formatAIText(text) {
    // تنسيق النص: bold, code, قوائم، فقرات
    return text
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code style="background:rgba(67,232,192,0.1);padding:1px 6px;border-radius:4px;font-family:monospace;font-size:0.85em;color:var(--aurora)">$1</code>')
        .replace(/^### (.+)$/gm, '<h4 style="color:var(--gold);margin:10px 0 4px;font-size:0.95rem">$1</h4>')
        .replace(/^## (.+)$/gm, '<h3 style="color:var(--gold);margin:12px 0 6px">$1</h3>')
        .replace(/^# (.+)$/gm, '<h2 style="color:var(--gold);margin:14px 0 8px">$1</h2>')
        .replace(/^[\-\*] (.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="color:var(--aurora)">•</span><span>$1</span></div>')
        .replace(/^(\d+)\. (.+)$/gm, '<div style="display:flex;gap:8px;margin:3px 0"><span style="color:var(--gold);font-weight:700;min-width:18px">$1.</span><span>$2</span></div>')
        .replace(/\n\n/g, '<br><br>')
        .replace(/\n/g, '<br>');
}

// ════════════════════════════════════════════════════════════════
//  ✦  مولد الأكواد الكوني
// ════════════════════════════════════════════════════════════════
(function initCodeGen() {
    // تبويبات اللغات
    const langTabs = document.querySelectorAll('.lang-tab');
    langTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            langTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
            APP.selectedLang = tab.dataset.lang;
        });
    });

    // توليد الكود
    document.getElementById('genCode')?.addEventListener('click', generateCode);
    document.getElementById('codePrompt')?.addEventListener('keydown', e => {
        if (e.key === 'Enter' && e.ctrlKey) generateCode();
    });

    // نسخ الكود
    document.getElementById('copyCode')?.addEventListener('click', () => {
        const content = document.getElementById('codeContent');
        if (!content) return;
        navigator.clipboard.writeText(content.textContent).then(() => {
            const btn = document.getElementById('copyCode');
            if (btn) { btn.textContent = '✅ تم النسخ'; setTimeout(() => btn.textContent = '📋 نسخ', 2000); }
            showToast('تم نسخ الكود', 'success');
        }).catch(() => showToast('فشل النسخ', 'error'));
    });
})();

async function generateCode() {
    const prompt     = document.getElementById('codePrompt')?.value.trim();
    const lang       = APP.selectedLang;
    const codeOut    = document.getElementById('codeOut');
    const codeContent= document.getElementById('codeContent');
    const placeholder= document.getElementById('codePlaceholder');
    const header     = document.getElementById('codeHeader');
    const langBadge  = document.getElementById('codeLangBadge');
    const addComments= document.getElementById('addComments')?.checked;
    const addExamples= document.getElementById('addExamples')?.checked;

    if (!prompt) { showToast('اكتب وصف الكود أولاً', 'warning'); return; }
    if (!APP.apiKey) {
        if (placeholder) placeholder.style.display = 'none';
        if (codeOut) codeOut.classList.remove('hidden');
        if (codeContent) codeContent.textContent = '⚠️ أدخل مفتاح API أولاً.';
        return;
    }

    if (placeholder) placeholder.style.display = 'none';
    if (header) header.classList.remove('hidden');
    if (codeOut) codeOut.classList.remove('hidden');
    if (codeContent) codeContent.textContent = '⏳ جاري توليد الكود...';
    if (langBadge) langBadge.textContent = lang.toUpperCase();

    const langNames = { python: 'Python', javascript: 'JavaScript', html: 'HTML و CSS', cpp: 'C++', sql: 'SQL' };

    let systemPrompt = `أنت مبرمج خبير. اكتب كود ${langNames[lang] || lang} نظيف واحترافي.
القواعد:
- الكود فقط داخل بلوك \`\`\`${lang}
- لا شرح خارج البلوك إلا للتوضيح الضروري
${addComments ? '- أضف تعليقات عربية واضحة داخل الكود' : ''}
${addExamples ? '- أضف مثالاً للاستخدام في نهاية الكود' : ''}
- الكود يجب أن يعمل مباشرة بدون تعديل`;

    try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2000,
                system: systemPrompt,
                messages: [{ role: 'user', content: `اكتب كود ${langNames[lang] || lang} لـ: ${prompt}` }]
            })
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);

        let raw = data.content?.[0]?.text || '// لم يتم التوليد';

        // استخراج الكود من البلوك
        const match = raw.match(/```(?:\w+)?\n([\s\S]+?)```/);
        if (match) raw = match[1].trim();

        if (codeContent) codeContent.textContent = raw;
        showToast('تم توليد الكود بنجاح ⚡', 'success');

    } catch (e) {
        if (codeContent) codeContent.textContent = '// ❌ خطأ: ' + e.message;
        showToast('فشل التوليد: ' + e.message, 'error');
    }
}

// ════════════════════════════════════════════════════════════════
//  ✦  تأثيرات إضافية وتلميحات
// ════════════════════════════════════════════════════════════════

// تأثير الضغط على البطاقات
document.querySelectorAll('.cap-card, .universe-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transition = 'all 0.3s cubic-bezier(0.22,1,0.36,1)';
    });
});

// تلميح مفتاح API
(function checkApiKey() {
    const input = document.getElementById('apiKey');
    if (!input) return;
    input.addEventListener('focus', () => {
        if (!APP.apiKey) showToast('احصل على مفتاحك من console.anthropic.com', 'info', 5000);
    });
})();

// إظهار رسالة ترحيب
setTimeout(() => {
    showToast('✦ مرحباً في المصري الذكي — الكون جاهز', 'success', 4000);
}, 3000);
