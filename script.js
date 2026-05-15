// ================================================================
//  ✦  THREE.JS 3D COSMIC UNIVERSE  ✦
// ================================================================
(function(){
    const canvas = document.getElementById('universe-canvas');
    if(!canvas) return;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 80);
    // Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 6000;
    const starPos = new Float32Array(starCount * 3);
    const starColor = new Float32Array(starCount * 3);
    for(let i = 0; i < starCount; i++){
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 300 + Math.random() * 700;
        starPos[i*3] = r * Math.sin(phi) * Math.cos(theta);
        starPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        starPos[i*3+2] = r * Math.cos(phi);
        starColor[i*3] = 0.8 + Math.random()*0.3; starColor[i*3+1] = 0.7 + Math.random()*0.3; starColor[i*3+2] = 1;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColor, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.5, vertexColors: true, transparent: true })));
    // Nebula clouds
    function makeNebula(count, spread, colorA, colorB, opacity){
        const geo = new THREE.BufferGeometry(), pos = [], col = [];
        const ca = new THREE.Color(colorA), cb = new THREE.Color(colorB);
        for(let i=0; i<count; i++){
            pos.push((Math.random()-0.5)*spread, (Math.random()-0.5)*spread*0.4, (Math.random()-0.5)*spread*0.6);
            const t = Math.random();
            col.push(ca.r + (cb.r-ca.r)*t, ca.g + (cb.g-ca.g)*t, ca.b + (cb.b-ca.b)*t);
        }
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
        const cloud = new THREE.Points(geo, new THREE.PointsMaterial({ size: 1.2, vertexColors: true, transparent: true, opacity }));
        return cloud;
    }
    const neb1 = makeNebula(2000, 200, '#6c3fc5', '#43e8c0', 0.12); neb1.position.set(-30,20,-80); scene.add(neb1);
    const neb2 = makeNebula(1500, 160, '#e0405a', '#ff6b9d', 0.1); neb2.position.set(60,-15,-100); scene.add(neb2);
    // Planets
    function makePlanet(radius, color, orbitR, orbitSpeed, name, desc){
        const group = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.15, roughness: 0.4 });
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 64), mat);
        group.add(mesh);
        const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.08, side: THREE.BackSide });
        group.add(new THREE.Mesh(new THREE.SphereGeometry(radius*1.12, 32, 32), glowMat));
        scene.add(group);
        return { group, mesh, orbitR, orbitSpeed, angle: Math.random()*Math.PI*2, name, desc };
    }
    const planets = [];
    planets.push(makePlanet(2.5, 0xf5c842, 0, 0, 'الشمس', 'نجمنا الذهبي'));
    planets.push(makePlanet(1.1, 0xa0a0c0, 14, 0.024, 'عطارد', 'أقرب الكواكب'));
    planets.push(makePlanet(1.7, 0xe87c40, 22, 0.015, 'الزهرة', 'كوكب الجمال'));
    planets.push(makePlanet(1.9, 0x4488ff, 31, 0.01, 'الأرض', 'كوكبنا الجميل'));
    planets.push(makePlanet(1.5, 0xd05030, 40, 0.008, 'المريخ', 'الكوكب الأحمر'));
    planets.push(makePlanet(2.8, 0xe4a060, 60, 0.004, 'المشتري', 'أكبر الكواكب'));
    planets.push(makePlanet(2.5, 0xd4b060, 80, 0.003, 'زحل', 'كوكب الحلقات'));
    planets.push(makePlanet(1.9, 0x60d0e8, 100, 0.002, 'أورانوس', 'الكوكب الجليدي'));
    planets.push(makePlanet(1.9, 0x3060ff, 118, 0.0015, 'نبتون', 'أبعد الكواكب'));
    // Lights
    const sunLight = new THREE.PointLight(0xfff8e0, 3.5, 350); sunLight.position.set(0,0,0); scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0x111130, 1.2));
    // Shooting stars
    let shootingStars = [];
    function spawnShootingStar(){
        const start = new THREE.Vector3((Math.random()-0.5)*200, (Math.random()-0.5)*100, -50);
        const dir = new THREE.Vector3((Math.random()-0.5)*0.3 - 0.4, (Math.random()-0.5)*0.2, 0).normalize();
        const points = [start, start.clone().addScaledVector(dir, 15)];
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
        scene.add(line);
        shootingStars.push({ line, dir, life: 1.0 });
        setTimeout(spawnShootingStar, 3000 + Math.random() * 8000);
    }
    setTimeout(spawnShootingStar, 2000);
    // Raycaster & Mouse
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const planetInfo = document.getElementById('planetInfo');
    window.addEventListener('mousemove', (e) => {
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        const glow = document.getElementById('cursorGlow');
        if(glow){ glow.style.left = e.clientX + 'px'; glow.style.top = e.clientY + 'px'; }
    });
    // Animate
    let camT = 0;
    function animate(){
        requestAnimationFrame(animate);
        camT += 0.0005;
        camera.position.x = Math.sin(camT) * 6; camera.position.y = Math.cos(camT * 0.6) * 3; camera.lookAt(0,0,0);
        if(neb1) { neb1.rotation.y += 0.0003; neb2.rotation.y -= 0.0002; }
        planets.forEach(p => {
            if(p.orbitR === 0){ p.mesh.rotation.y += 0.005; return; }
            p.angle += p.orbitSpeed;
            p.group.position.x = Math.cos(p.angle) * p.orbitR;
            p.group.position.z = Math.sin(p.angle) * p.orbitR;
            p.mesh.rotation.y += 0.01;
        });
        shootingStars.forEach((s,i) => {
            s.life -= 0.02;
            s.line.position.addScaledVector(s.dir, 1.5);
            s.line.material.opacity = Math.max(0, s.life);
            if(s.life <= 0){ scene.remove(s.line); shootingStars.splice(i,1); }
        });
        raycaster.setFromCamera(mouse, camera);
        let found = false;
        planets.forEach(p => {
            if(p.orbitR === 0) return;
            if(raycaster.intersectObject(p.mesh).length > 0){
                found = true;
                if(planetInfo){
                    planetInfo.innerHTML = `<strong>${p.name}</strong><br>${p.desc}`;
                    planetInfo.style.left = (mouse.x * 0.5 + 0.5) * window.innerWidth + 'px';
                    planetInfo.style.top = ((-mouse.y * 0.5 + 0.5) * window.innerHeight - 60) + 'px';
                    planetInfo.classList.add('show');
                }
            }
        });
        if(!found && planetInfo) planetInfo.classList.remove('show');
        renderer.render(scene, camera);
    }
    animate();
    window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });
})();

// ================================================================
//  ✦  WEB AUDIO — MUSIC & VISUALIZER  ✦
// ================================================================
let audioCtx = null, masterGain = null, musicPlaying = false;
const muteBtn = document.getElementById('muteBtn'), volRange = document.getElementById('volRange'), volLabel = document.getElementById('volLabel');
const visBars = document.querySelectorAll('.vis-bar');
function buildAmbientMusic(){
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain(); masterGain.gain.value = parseFloat(volRange.value)/100;
    masterGain.connect(audioCtx.destination);
    const reverb = (()=>{ const buf = audioCtx.createBuffer(2, audioCtx.sampleRate*5, audioCtx.sampleRate); for(let c=0;c<2;c++){ const d=buf.getChannelData(c); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2.5); } const rv=audioCtx.createConvolver(); rv.buffer=buf; return rv; })();
    reverb.connect(masterGain);
    const noise = (()=>{ const buf=audioCtx.createBuffer(1, audioCtx.sampleRate*2, audioCtx.sampleRate); const d=buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.012; const src=audioCtx.createBufferSource(); src.buffer=buf; src.loop=true; const filt=audioCtx.createBiquadFilter(); filt.type='bandpass'; filt.frequency.value=700; src.connect(filt); filt.connect(reverb); src.start(); return src; })();
    let time = audioCtx.currentTime+0.5;
    function chord(freqs, start, dur){ freqs.forEach((f,i)=>{ const o=audioCtx.createOscillator(); const g=audioCtx.createGain(); o.type='sine'; o.frequency.value=f; o.detune.value=(Math.random()-0.5)*5; g.gain.setValueAtTime(0,start); g.gain.linearRampToValueAtTime(0.04,start+1.5); g.gain.setValueAtTime(0.04,start+dur-2); g.gain.linearRampToValueAtTime(0,start+dur); o.connect(g); g.connect(reverb); o.start(start); o.stop(start+dur); }); }
    function bass(f, start, dur){ const o=audioCtx.createOscillator(); const g=audioCtx.createGain(); o.type='sine'; o.frequency.value=f/4; g.gain.setValueAtTime(0,start); g.gain.linearRampToValueAtTime(0.055,start+2); g.gain.setValueAtTime(0.055,start+dur-2); g.gain.linearRampToValueAtTime(0,start+dur); o.connect(g); g.connect(reverb); o.start(start); o.stop(start+dur); }
    function melody(start){ const notes=[523.25,493.88,440,493.88,523.25,587.33]; notes.forEach((n,i)=>{ const o=audioCtx.createOscillator(); const g=audioCtx.createGain(); o.frequency.value=n; g.gain.setValueAtTime(0,start+i*0.6); g.gain.linearRampToValueAtTime(0.025,start+i*0.6+0.3); g.gain.exponentialRampToValueAtTime(0.001,start+i*0.6+3); o.connect(g); g.connect(reverb); o.start(start+i*0.6); o.stop(start+i*0.6+3); }); }
    const chs=[[130.81,164.81,196,246.94],[116.54,146.83,174.61,220],[138.59,174.61,207.65,261.63],[123.47,155.56,185,233.08]];
    let idx=0;
    function schedule(){ if(!musicPlaying){ setTimeout(schedule,2000); return; } const now=audioCtx.currentTime; chord(chs[idx%chs.length], now, 7); bass(chs[idx%chs.length][0], now, 7); melody(now+1.5); melody(now+4.5); idx++; setTimeout(schedule, 6500); }
    schedule();
}
function startMusic(){ if(!audioCtx){ buildAmbientMusic(); musicPlaying=true; } else if(!musicPlaying){ musicPlaying=true; masterGain.gain.setValueAtTime(parseFloat(volRange.value)/100, audioCtx.currentTime); } muteBtn.textContent='🔊'; visBars.forEach(b=>b.classList.add('active')); }
function stopMusic(){ musicPlaying=false; if(masterGain) masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime+0.5); muteBtn.textContent='🔇'; visBars.forEach(b=>b.classList.remove('active')); }
if(muteBtn) muteBtn.addEventListener('click', ()=> musicPlaying ? stopMusic() : startMusic());
if(volRange) volRange.addEventListener('input', ()=>{ const v=parseFloat(volRange.value)/100; volLabel.textContent=volRange.value+'%'; if(masterGain) masterGain.gain.setValueAtTime(v, audioCtx.currentTime); });
let musicStarted=false;
document.addEventListener('click', ()=>{ if(!musicStarted && typeof startMusic === 'function'){ musicStarted=true; startMusic(); } }, { once: true });
window.addEventListener('load', ()=>{ setTimeout(()=>{ const ld=document.getElementById('loader'); if(ld) ld.classList.add('gone'); }, 2100); });

// ================================================================
//  ✦  UI & API  ✦
// ================================================================
document.getElementById('devBtn')?.addEventListener('click', ()=>document.getElementById('devModal')?.classList.remove('hidden'));
document.getElementById('closeModal')?.addEventListener('click', ()=>document.getElementById('devModal')?.classList.add('hidden'));
document.getElementById('devModal')?.addEventListener('click', function(e){ if(e.target===this) this.classList.add('hidden'); });
document.getElementById('saveApi')?.addEventListener('click', ()=>{ const k=document.getElementById('apiKey').value.trim(); if(k){ window._apiKey=k; document.getElementById('saveApi').textContent='✅'; setTimeout(()=>document.getElementById('saveApi').textContent='💾',2000); } });

// Camera
let stream=null;
const video=document.getElementById('video'), snapCanvas=document.getElementById('snapCanvas');
document.getElementById('startCam')?.addEventListener('click', async ()=>{ try{ stream=await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); video.srcObject=stream; video.style.display='block'; document.getElementById('camPlaceholder').style.display='none'; document.getElementById('snapBtn').classList.remove('hidden'); document.getElementById('stopCam').classList.remove('hidden'); document.getElementById('startCam').classList.add('hidden'); } catch(e){ alert('تعذر فتح الكاميرا'); } });
document.getElementById('snapBtn')?.addEventListener('click', ()=>{ snapCanvas.width=video.videoWidth; snapCanvas.height=video.videoHeight; snapCanvas.getContext('2d').drawImage(video,0,0); const b64=snapCanvas.toDataURL('image/jpeg',0.82).split(',')[1]; video.style.display='none'; snapCanvas.style.display='block'; document.getElementById('snapBtn').classList.add('hidden'); document.getElementById('retakeBtn').classList.remove('hidden'); analyzeImage(b64); });
document.getElementById('retakeBtn')?.addEventListener('click', ()=>{ snapCanvas.style.display='none'; video.style.display='block'; document.getElementById('retakeBtn').classList.add('hidden'); document.getElementById('snapBtn').classList.remove('hidden'); document.getElementById('analysisResult').classList.add('hidden'); });
document.getElementById('stopCam')?.addEventListener('click', ()=>{ if(stream) stream.getTracks().forEach(t=>t.stop()); video.style.display='none'; snapCanvas.style.display='none'; document.getElementById('camPlaceholder').style.display='flex'; document.getElementById('startCam').classList.remove('hidden'); ['snapBtn','stopCam','retakeBtn'].forEach(id=>{ const el=document.getElementById(id); if(el) el.classList.add('hidden'); }); });
async function analyzeImage(b64){ const div=document.getElementById('analysisResult'); const txt=document.getElementById('resultText'); const conf=document.getElementById('resultConf'); div.classList.remove('hidden'); txt.textContent='⏳ تحليل الصورة...'; conf.textContent=''; if(!window._apiKey){ txt.textContent='⚠️ أدخل مفتاح API أولاً'; return; } try{ const r=await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:500, messages:[{ role:'user', content:[{ type:'image', source:{ type:'base64', media_type:'image/jpeg', data:b64 } },{ type:'text', text:'حلل هذه الصورة بالعربية بإيجاز.' }] }] }) }); const d=await r.json(); txt.textContent=d.content?.[0]?.text||'لم يتم التحليل'; conf.textContent='✦ Claude Vision'; } catch(e){ txt.textContent='خطأ: '+e.message; } }

// Chat
let chatHistory=[], webSearch=false;
document.getElementById('webSearchToggle')?.addEventListener('click', ()=>{ webSearch=!webSearch; document.getElementById('wsStatus').textContent=webSearch?'فعّال ✦':'متوقف'; document.getElementById('webSearchToggle').style.borderColor=webSearch?'var(--aurora1)':''; });
document.getElementById('clearChat')?.addEventListener('click', ()=>{ chatHistory=[]; document.getElementById('chatHistory').innerHTML='<div class="msg ai"><span class="stag">✦ المصري الذكي ✦</span><br>تمت إعادة المحادثة 🌌</div>'; });
document.getElementById('sendBtn')?.addEventListener('click', sendChat);
document.getElementById('chatInput')?.addEventListener('keydown', e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendChat(); } });
async function sendChat(){ const input=document.getElementById('chatInput'); const text=input.value.trim(); if(!text) return; input.value=''; appendMsg('user',text); chatHistory.push({ role:'user', content:text }); if(!window._apiKey){ appendMsg('ai','⚠️ أدخل مفتاح API أولاً'); return; } const think=appendMsg('ai',webSearch?'🌐 يبحث...':'⏳ يفكر...',webSearch?'ai searching':'ai'); try{ const body={ model:'claude-sonnet-4-20250514', max_tokens:1000, system:'أنت مساعد ذكي مصري، أجب بالعربية بأسلوب ودود.', messages:chatHistory }; if(webSearch) body.tools=[{ type:'web_search_20250305', name:'web_search' }]; const r=await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(body) }); const d=await r.json(); const reply=d.content?.filter(b=>b.type==='text').map(b=>b.text).join('\n')||'لم أتمكن من الإجابة.'; think.innerHTML=(webSearch?'🌐 بحث الويب<br>':'')+reply; chatHistory.push({ role:'assistant', content:reply }); } catch(e){ think.innerHTML='❌ خطأ: '+e.message; } }
function appendMsg(type,html,cls){ const el=document.createElement('div'); el.className='msg '+(cls||type); el.innerHTML=html; document.getElementById('chatHistory').appendChild(el); el.scrollIntoView({ behavior:'smooth', block:'end' }); return el; }

// Code Gen
document.getElementById('genCode')?.addEventListener('click', async ()=>{ const prompt=document.getElementById('codePrompt').value.trim(); const lang=document.getElementById('langSelect').value; const out=document.getElementById('codeOut'); if(!prompt) return; if(!window._apiKey){ out.classList.remove('hidden'); out.textContent='⚠️ أدخل مفتاح API أولاً'; return; } out.classList.remove('hidden'); out.textContent='⏳ توليد الكود...'; try{ const r=await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1200, messages:[{ role:'user', content:`اكتب كود ${lang} لـ: ${prompt}` }] }) }); const d=await r.json(); out.textContent=d.content?.[0]?.text||'لم يتم التوليد.'; } catch(e){ out.textContent='خطأ: '+e.message; } });
