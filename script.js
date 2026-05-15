// ==================== STARS BACKGROUND ====================
(function(){
  const c = document.getElementById('stars-canvas');
  if(!c) return;
  const ctx = c.getContext('2d');
  let W, H, stars = [];
  function resize(){ W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  for(let i = 0; i < 220; i++){
    stars.push({ x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.4+0.2, sp: Math.random()*0.4+0.1, p: Math.random()*Math.PI*2 });
  }
  function draw(){
    if(!ctx) return;
    ctx.clearRect(0,0,W,H);
    stars.forEach(s => {
      s.p += s.sp * 0.02;
      const a = 0.35 + 0.6 * Math.abs(Math.sin(s.p));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(200,190,255,${a})`; ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// ==================== LOADER ====================
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if(loader) setTimeout(() => loader.classList.add('gone'), 1400);
});

// ==================== AUDIO CONTROLS ====================
const muteBtn = document.getElementById('muteBtn');
const volRange = document.getElementById('volRange');
const volLabel = document.getElementById('volLabel');
let muted = false;
if(muteBtn){
  muteBtn.addEventListener('click', () => { muted = !muted; muteBtn.textContent = muted ? '🔇' : '🔊'; });
}
if(volRange && volLabel){
  volRange.addEventListener('input', () => volLabel.textContent = volRange.value + '%');
}

// ==================== DEV MODAL ====================
const devBtn = document.getElementById('devBtn');
const devModal = document.getElementById('devModal');
const closeModal = document.getElementById('closeModal');
if(devBtn && devModal){
  devBtn.addEventListener('click', () => devModal.classList.remove('hidden'));
  closeModal?.addEventListener('click', () => devModal.classList.add('hidden'));
  devModal.addEventListener('click', function(e){ if(e.target === this) this.classList.add('hidden'); });
}

// ==================== API KEY ====================
const saveApi = document.getElementById('saveApi');
const apiKeyInput = document.getElementById('apiKey');
if(saveApi){
  saveApi.addEventListener('click', () => {
    const key = apiKeyInput?.value.trim();
    if(key){
      window._apiKey = key;
      saveApi.textContent = '✅';
      setTimeout(() => saveApi.textContent = '💾', 2000);
    }
  });
}

// ==================== CAMERA ====================
let stream = null;
const video = document.getElementById('video');
const snapCanvas = document.getElementById('snapCanvas');
const startCam = document.getElementById('startCam');
const snapBtn = document.getElementById('snapBtn');
const stopCam = document.getElementById('stopCam');
const retakeBtn = document.getElementById('retakeBtn');
const analysisResult = document.getElementById('analysisResult');
const resultText = document.getElementById('resultText');
const resultConf = document.getElementById('resultConf');
const camPlaceholder = document.getElementById('camPlaceholder');

if(startCam){
  startCam.addEventListener('click', async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if(video) video.srcObject = stream;
      if(video) video.style.display = 'block';
      if(camPlaceholder) camPlaceholder.style.display = 'none';
      if(snapBtn) snapBtn.classList.remove('hidden');
      if(stopCam) stopCam.classList.remove('hidden');
      startCam.classList.add('hidden');
    } catch(e){ alert('تعذر فتح الكاميرا: ' + e.message); }
  });
}

if(snapBtn){
  snapBtn.addEventListener('click', () => {
    if(!video || !snapCanvas) return;
    snapCanvas.width = video.videoWidth;
    snapCanvas.height = video.videoHeight;
    snapCanvas.getContext('2d').drawImage(video, 0, 0);
    const b64 = snapCanvas.toDataURL('image/jpeg', 0.8).split(',')[1];
    if(video) video.style.display = 'none';
    snapCanvas.style.display = 'block';
    snapBtn.classList.add('hidden');
    if(retakeBtn) retakeBtn.classList.remove('hidden');
    analyzeImage(b64);
  });
}

if(retakeBtn){
  retakeBtn.addEventListener('click', () => {
    if(snapCanvas) snapCanvas.style.display = 'none';
    if(video) video.style.display = 'block';
    retakeBtn.classList.add('hidden');
    if(snapBtn) snapBtn.classList.remove('hidden');
    if(analysisResult) analysisResult.classList.add('hidden');
  });
}

if(stopCam){
  stopCam.addEventListener('click', () => {
    if(stream) stream.getTracks().forEach(t => t.stop());
    if(video) video.style.display = 'none';
    if(snapCanvas) snapCanvas.style.display = 'none';
    if(camPlaceholder) camPlaceholder.style.display = 'flex';
    startCam?.classList.remove('hidden');
    ['snapBtn','stopCam','retakeBtn'].forEach(id => {
      const el = document.getElementById(id);
      if(el) el.classList.add('hidden');
    });
  });
}

async function analyzeImage(b64){
  if(!analysisResult || !resultText || !resultConf) return;
  analysisResult.classList.remove('hidden');
  resultText.textContent = '⏳ جارٍ تحليل الصورة…';
  resultConf.textContent = '';
  if(!window._apiKey){ resultText.textContent = '⚠️ أدخل API Key أولاً!'; return; }
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', max_tokens: 400,
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } },
          { type: 'text', text: 'حلل هذه الصورة بدقة باللغة العربية. أخبرني: ما الذي تراه؟ وما أبرز التفاصيل؟ كن دقيقاً ومختصراً في 3 جمل.' }
        ]}]
      })
    });
    const d = await r.json();
    resultText.textContent = d.content?.[0]?.text || 'لم يتمكن النظام من التحليل';
    resultConf.textContent = '✦ تم التحليل بواسطة Claude Vision';
  } catch(e){ resultText.textContent = 'خطأ: ' + e.message; }
}

// ==================== CHAT ====================
let chatHistory = [];
let webSearch = false;
const webSearchToggle = document.getElementById('webSearchToggle');
const wsStatus = document.getElementById('wsStatus');
const clearChat = document.getElementById('clearChat');
const chatHistoryDiv = document.getElementById('chatHistory');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');

if(webSearchToggle && wsStatus){
  webSearchToggle.addEventListener('click', () => {
    webSearch = !webSearch;
    wsStatus.textContent = webSearch ? 'فعّال' : 'متوقف';
    webSearchToggle.style.borderColor = webSearch ? 'var(--aurora1)' : '';
  });
}

if(clearChat && chatHistoryDiv){
  clearChat.addEventListener('click', () => {
    chatHistory = [];
    if(chatHistoryDiv) chatHistoryDiv.innerHTML = '<div class="msg ai"><span class="search-tag">SABUYAH AI</span><br>تمت إعادة المحادثة ✦ كيف يمكنني مساعدتك؟</div>';
  });
}

if(sendBtn && chatInput){
  sendBtn.addEventListener('click', sendChat);
  chatInput.addEventListener('keydown', e => { if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); sendChat(); } });
}

async function sendChat(){
  const text = chatInput.value.trim();
  if(!text) return;
  chatInput.value = '';
  appendMsg('user', text);
  chatHistory.push({ role: 'user', content: text });
  if(!window._apiKey){ appendMsg('ai', '⚠️ أدخل API Key أولاً من الشريط العلوي!'); return; }
  const thinkMsg = appendMsg('ai', webSearch ? '<span class="search-tag">🌐 جارٍ البحث…</span><br>أبحث في الإنترنت…' : '<span>⏳ أفكر…</span>', webSearch ? 'ai searching' : 'ai');
  try {
    const body = {
      model: 'claude-sonnet-4-20250514', max_tokens: 1000,
      system: 'أنت مساعد ذكي اسمه SABUYAH من عالم المستقبل. أجب دائماً باللغة العربية بأسلوب ذكي وودود.',
      messages: chatHistory
    };
    if(webSearch) body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json();
    const reply = d.content?.filter(b => b.type === 'text').map(b => b.text).join('\n') || 'لم أتمكن من الإجابة.';
    thinkMsg.innerHTML = (webSearch ? '<span class="search-tag">🌐 بحث الويب</span><br>' : '') + reply;
    chatHistory.push({ role: 'assistant', content: reply });
  } catch(e){ thinkMsg.innerHTML = '❌ خطأ: ' + e.message; }
}

function appendMsg(type, html, cls){
  const container = document.getElementById('chatHistory');
  if(!container) return null;
  const el = document.createElement('div');
  el.className = 'msg ' + (cls || type);
  el.innerHTML = html;
  container.appendChild(el);
  el.scrollIntoView({ behavior: 'smooth', block: 'end' });
  return el;
}

// ==================== CODE GENERATOR ====================
const genCode = document.getElementById('genCode');
const codePrompt = document.getElementById('codePrompt');
const langSelect = document.getElementById('langSelect');
const codeOut = document.getElementById('codeOut');

if(genCode){
  genCode.addEventListener('click', async () => {
    const prompt = codePrompt?.value.trim();
    const lang = langSelect?.value || 'python';
    if(!prompt) return;
    if(!window._apiKey){ if(codeOut){ codeOut.classList.remove('hidden'); codeOut.textContent = '⚠️ أدخل API Key أولاً!'; } return; }
    if(codeOut){ codeOut.classList.remove('hidden'); codeOut.textContent = '⏳ جارٍ توليد الكود…'; }
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', max_tokens: 1200,
          messages: [{ role: 'user', content: `اكتب كود ${lang} لـ: ${prompt}\nأعطني الكود فقط بدون شرح مطول. اجعله احترافياً وموثقاً.` }]
        })
      });
      const d = await r.json();
      if(codeOut) codeOut.textContent = d.content?.[0]?.text || 'لم يتم التوليد.';
    } catch(e){ if(codeOut) codeOut.textContent = 'خطأ: ' + e.message; }
  });
}
