// ============================================
// المصري الذكي v7.1 - CORE ENGINE STABLE
// متكامل مع search, memory, intents, speech, cache
// ============================================

class EgyptianAI {
    constructor() {
        // الأساسيات
        this.model = null;
        this.isReady = false;
        this.speakEnabled = true;
        this.deepSearchMode = false;
        this.currentContext = 'general';
        this.mood = 'happy';
        this.friendshipLevel = 0;
        this.apiKey = localStorage.getItem('ai_api_key') || '';
        this.weatherCache = { data: null, timestamp: 0 };

        // Speech queue
        this.speechQueue = [];
        this.isSpeaking = false;
        this.maxQueueSize = 8;

        // Response cache (LRU)
        this.responseCache = new Map();
        this.cacheMaxSize = 200;
        this.cacheExpiry = 1000 * 60 * 10; // 10 دقائق

        // Memory (sync)
        this.memory = this.loadMemory();
        this.userProfile = this.loadProfile();

        // معرفة من window.aiKnowledgeBase? (إن وجدت)
        this.knowledgeBase = null;
        if (typeof MEGA_KNOWLEDGE !== 'undefined') this.knowledgeBase = MEGA_KNOWLEDGE;

        // DOM refs (سيتم تعبئتها عند الحاجة)
        this.dom = {};

        this.init();
    }

    // ========== MEMORY (مع حدود) ==========
    loadMemory() {
        const defaultMem = {
            facts: {},             // max 100
            preferences: {},
            corrections: {},
            lastVisit: null,
            visitCount: 0,
            totalMessages: 0,
            favoriteTopics: [],
            achievements: [],
            learnedSkills: []
        };
        try {
            const saved = localStorage.getItem('ai_egypt_ultra_memory_profile');
            if (saved) {
                const profile = JSON.parse(saved);
                // تنظيف الحقائق: إزالة القديمة (أكثر من 7 أيام) والحد الأقصى 100
                const now = Date.now();
                const cleanFacts = {};
                for (const [key, val] of Object.entries(profile.facts || {})) {
                    if (now - val.time < 7 * 24 * 60 * 60 * 1000) {
                        cleanFacts[key] = val;
                    }
                }
                const factEntries = Object.entries(cleanFacts);
                if (factEntries.length > 100) {
                    factEntries.sort((a,b) => b[1].time - a[1].time);
                    profile.facts = Object.fromEntries(factEntries.slice(0,100));
                } else {
                    profile.facts = cleanFacts;
                }
                return { ...defaultMem, ...profile };
            }
            return defaultMem;
        } catch {
            return defaultMem;
        }
    }

    saveMemory() {
        const toSave = {
            facts: this.memory.facts,
            preferences: this.memory.preferences,
            corrections: this.memory.corrections,
            lastVisit: this.memory.lastVisit,
            visitCount: this.memory.visitCount,
            totalMessages: this.memory.totalMessages,
            favoriteTopics: this.memory.favoriteTopics,
            achievements: this.memory.achievements,
            learnedSkills: this.memory.learnedSkills
        };
        localStorage.setItem('ai_egypt_ultra_memory_profile', JSON.stringify(toSave));
    }

    loadProfile() {
        try { return JSON.parse(localStorage.getItem('ai_egypt_ultra_profile') || '{}'); }
        catch { return {}; }
    }

    // ========== INTENTS (scoring محسن) ==========
    intents = [
        { key: 'greeting', patterns: ['سلام','أهلا','هلا','صباح','مسا','مرحبا','السلام','hello','hi'], weight: 1.2 },
        { key: 'joke', patterns: ['نكتة','ضحك','هزار','تنكّت'], weight: 1.5 },
        { key: 'wisdom', patterns: ['حكمة','نصيحة','عظة'], weight: 1.5 },
        { key: 'features', patterns: ['مميزاتك','عيوبك'], weight: 1.3 },
        { key: 'set_name', patterns: ['اسمي','أنا اسمي','ناديني'], weight: 1.8 },
        { key: 'recall', patterns: ['افتكر','عرفتني','إحنا اتكلمنا'], weight: 1.4 },
        { key: 'emotion', patterns: ['زعلان','فرحان','مبسوط','مضايق','عصبي','حزين','سعيد'], weight: 1.5 },
        { key: 'weather', patterns: ['طقس','الجو','حرارة','شمس','مطر'], weight: 1.4 },
        { key: 'time', patterns: ['وقت','ساعة','النهاردة'], weight: 1.2 },
        { key: 'health', patterns: ['صحة','رجيم','حمية'], weight: 1.3 },
        { key: 'quran', patterns: ['آية','قرآن','سورة'], weight: 1.6 },
        { key: 'hadith', patterns: ['حديث','رسول','النبي'], weight: 1.6 }
    ];

    detectIntent(message) {
        let lower = message.toLowerCase();
        let best = { key: 'default', score: 0 };
        for (let intent of this.intents) {
            let score = 0;
            for (let pat of intent.patterns) {
                let idx = lower.indexOf(pat);
                if (idx !== -1) {
                    // boost حسب طول النمط وموقعه
                    let boost = (pat.length > 2 ? 1.5 : 1) * (idx === 0 ? 1.2 : 1);
                    score += boost * intent.weight;
                }
            }
            if (score > best.score) {
                best = { key: intent.key, score: score };
            }
        }
        if (best.score < 0.5 && lower.includes('؟')) best.key = 'question';
        if (best.key === 'default' && this.searchKnowledge(lower)) best.key = 'knowledge';
        if (best.key === 'default' && (lower.includes('اسمي') || lower.includes('أنا اسمي'))) best.key = 'set_name';
        if (best.key === 'default' && (lower.includes('مين') || lower.includes('إنت مين'))) best.key = 'whoami';
        return best.key;
    }

    // ========== KNOWLEDGE (بحث سريع) ==========
    searchKnowledge(query) {
        if (!this.knowledgeBase) return null;
        const q = query.toLowerCase();
        for (let [key, data] of Object.entries(this.knowledgeBase)) {
            if (q.includes(key.toLowerCase())) return { key, data };
        }
        // حاول بالكلمات
        let words = q.split(/\s+/);
        for (let w of words) {
            if (w.length < 2) continue;
            for (let [key, data] of Object.entries(this.knowledgeBase)) {
                if (key.toLowerCase().includes(w)) return { key, data };
            }
        }
        return null;
    }

    // ========== RESPONSE CACHE ==========
    getCached(query) {
        let key = this.normalizeKey(query);
        if (this.responseCache.has(key)) {
            let cached = this.responseCache.get(key);
            if (Date.now() - cached.time < this.cacheExpiry) {
                this.responseCache.delete(key);
                this.responseCache.set(key, cached); // LRU update
                return cached.response;
            } else {
                this.responseCache.delete(key);
            }
        }
        return null;
    }

    setCached(query, response) {
        let key = this.normalizeKey(query);
        if (this.responseCache.size >= this.cacheMaxSize) {
            let oldest = this.responseCache.keys().next().value;
            this.responseCache.delete(oldest);
        }
        this.responseCache.set(key, { response, time: Date.now() });
    }

    normalizeKey(str) {
        return str.trim().toLowerCase().replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/[ى]/g,'ي');
    }

    // ========== SPEECH QUEUE ==========
    speak(text) {
        if (!this.speakEnabled || !('speechSynthesis' in window)) return;
        this.speechQueue.push(text);
        if (this.speechQueue.length > this.maxQueueSize) this.speechQueue.shift();
        this.processQueue();
    }

    processQueue() {
        if (this.isSpeaking || this.speechQueue.length === 0) return;
        this.isSpeaking = true;
        let text = this.speechQueue.shift();
        let utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-EG';
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.onend = () => {
            this.isSpeaking = false;
            this.processQueue();
        };
        utterance.onerror = () => {
            this.isSpeaking = false;
            this.processQueue();
        };
        window.speechSynthesis.speak(utterance);
    }

    // ========== INIT ==========
    async init() {
        this.showLoading('بصيص العقل المصري... 🧠⚡');
        if (typeof mobilenet !== 'undefined') {
            try {
                this.model = await mobilenet.load();
            } catch(e) { console.warn('mobilenet failed', e); }
        }
        this.isReady = true;
        this.hideLoading();
        this.speak(this.getGreeting());
        this.setupEventListeners();
        this.startCamera();
        this.updateNetStatus();
        setInterval(() => this.updateNetStatus(), 30000);
        this.fetchWeather();
    }

    getGreeting() {
        let hour = new Date().getHours();
        let time = hour<12?'صباح الفل':hour<17?'مسا النور':hour<21?'مسا الخير':'تصبح على خير';
        let name = this.memory.facts.name?.value;
        if (this.memory.visitCount === 0) return `${time} يا غالي! أنا المصري الذكي v7.1. قولي اسمك عشان نتعرف! 🧠🇪🇬`;
        return name ? `${time} يا ${name}! ❤️` : `${time} يا فندم! تشرفنا`;
    }

    // ========== UI & DOM ==========
    getDom(id) {
        if (!this.dom[id]) this.dom[id] = document.getElementById(id);
        return this.dom[id];
    }

    addChatMessage(text, sender) {
        let history = this.getDom('chatHistory');
        if (!history) return;
        let div = document.createElement('div');
        div.className = `chat-message ${sender}`;
        div.textContent = text;
        history.appendChild(div);
        history.scrollTop = history.scrollHeight;
    }

    sendMessage() {
        let input = this.getDom('chatInput');
        if (!input) return;
        let msg = input.value.trim();
        if (!msg) return;
        this.addChatMessage(msg, 'user');
        input.value = '';

        let cached = this.getCached(msg);
        if (cached) {
            setTimeout(() => {
                this.addChatMessage(cached, 'ai');
                if (this.speakEnabled && cached.length<300) this.speak(cached);
            }, 100);
            return;
        }

        let response = this.generateResponse(msg);
        this.setCached(msg, response);
        setTimeout(() => {
            this.addChatMessage(response, 'ai');
            this.learnFromConversation(msg, response);
            if (this.speakEnabled && response.length<300) this.speak(response);
        }, 200);
    }

    generateResponse(message) {
        let lower = message.toLowerCase();
        let intent = this.detectIntent(message);
        switch(intent) {
            case 'greeting': return this.getGreeting();
            case 'joke': return this.getJoke();
            case 'wisdom': return this.getWisdom();
            case 'features': return this.getFeatures();
            case 'set_name': return this.handleSetName(message);
            case 'recall': return this.recallMemory();
            case 'emotion': return this.respondToEmotion(message);
            case 'weather': return this.weatherReply();
            case 'time': return this.timeReply();
            case 'health': return this.healthReply();
            case 'quran': return '📖 آية كريمة: ﴿ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ ﴾ [البقرة:153]';
            case 'hadith': return '📖 حديث نبوي: "إنما الأعمال بالنيات" (رواه البخاري)';
            case 'knowledge': {
                let k = this.searchKnowledge(lower);
                if (k) return this.formatKnowledge(k);
                break;
            }
            case 'whoami': {
                let name = this.memory.facts.name?.value;
                return name ? `إنت ${name} صاحبي!` : 'لسه متعرفناش، قولي اسمك';
            }
        }
        if (lower.includes('؟')) return this.answerQuestion(lower);
        return this.getSmartDefault();
    }

    formatKnowledge(result) {
        let { key, data } = result;
        return `${data.short}\n\n${data.full}`;
    }

    handleSetName(msg) {
        let m = msg.match(/(?:اسمي|أنا اسمي|ناديني)\s+([\u0600-\u06FFa-zA-Z\s]{2,})/i);
        if (m) {
            this.memory.facts.name = { value: m[1].trim(), time: Date.now() };
            this.saveMemory();
            return `حفظت! من النهاردة هناديك ${m[1]}! 🎉`;
        }
        return 'قول اسمك بوضوح زي "اسمي محمد"';
    }

    recallMemory() {
        let facts = Object.entries(this.memory.facts);
        if (facts.length===0) return 'لسه متعرفناش كويس';
        let txt = 'أنا فاكرك:\n';
        for (let [k,v] of facts) txt += `• ${k}: ${v.value}\n`;
        return txt;
    }

    respondToEmotion(txt) {
        if (txt.includes('زعلان')) return 'متزعلش! اللي جاي أحسن 🤗';
        if (txt.includes('فرحان')) return '🎉 يا سلام! فرحتني';
        return 'حاسس بيك! إنت مش لوحدك 💪';
    }

    weatherReply() {
        if (this.weatherCache.data) return `🌦️ الطقس: ${this.weatherCache.data}`;
        return 'الطقس مش معروف حالياً، حاول تاني.';
    }

    timeReply() {
        let d = new Date();
        return `الساعة ${d.getHours()}:${d.getMinutes().toString().padStart(2,'0')}`;
    }

    healthReply() {
        return 'صحة: فول وطعمية = طاقة، مشي 30 دقيقة يومياً = صحة!';
    }

    answerQuestion(q) {
        if (q.includes('طقس')) return this.weatherReply();
        if (q.includes('وقت')) return this.timeReply();
        return 'سؤال حلو! جرب تسألني عن الأكل المصري أو التاريخ أو نكتة!';
    }

    getJoke() {
        let jokes = ['مصري دخل محل قال للبياع: عندك حاجة حلوة؟ قال: آه الجواز!','مصري سأل صاحبه: إيه الفرق بين السرير والكرسي؟ قال: السرير بياخدك في حضنه والكرسي بيخليك تقف على رجليك!'];
        return jokes[Math.floor(Math.random()*jokes.length)];
    }

    getWisdom() {
        let w = ['اللي ياكل وحده يموت وحده','الصبر مفتاح الفرج','العقل زينة'];
        return w[Math.floor(Math.random()*w.length)];
    }

    getFeatures() {
        return `🧠 مميزاتي: 1000+ موضوع، ذاكرة، بحث إنترنت، كود، نطق، صور، طقس.`;
    }

    getSmartDefault() {
        return 'اتكلم معايا! اسأل عن حاجة معينة أو قولي "نكتة" 😄';
    }

    learnFromConversation(user, ai) {
        // حفظ آخر محادثة (اختياري) بدون تعقيد
        this.memory.totalMessages++;
        this.memory.visitCount = (this.memory.visitCount||0)+1;
        this.saveMemory();
    }

    // ========== WEATHER ==========
    async fetchWeather(city='Cairo') {
        try {
            let res = await fetch(`https://wttr.in/${city}?format=%C+%t+%w+%h`);
            let data = await res.text();
            this.weatherCache = { data, timestamp: Date.now() };
        } catch(e) {
            this.weatherCache = { data: 'معلومات الطقس غير متاحة', timestamp: Date.now() };
        }
    }

    // ========== DEEP SEARCH (يستخدم searchEngine من ai-search.js) ==========
    async performDeepSearch(query) {
        if (window.searchEngine) {
            let result = await window.searchEngine.performDeepSearch(query);
            let formatted = window.searchEngine.formatForDisplay(result);
            this.addChatMessage(formatted.text, 'ai');
        } else {
            this.addChatMessage('❌ محرك البحث غير جاهز', 'ai');
        }
    }

    // ========== CAMERA (اختصار) ==========
    async startCamera() {
        let vid = this.getDom('video');
        if (!vid) return;
        try {
            let stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            vid.srcObject = stream;
        } catch(e) { console.log('camera error'); }
    }

    async analyzeImage() {
        let video = this.getDom('video'), canvas = this.getDom('canvas');
        if (!video || !canvas || !this.model) return;
        canvas.width = video.videoWidth||640;
        canvas.height = video.videoHeight||480;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(video,0,0);
        let pred = await this.model.classify(canvas);
        if(pred.length) this.showResult(pred[0].className, pred[0].probability.toFixed(2));
    }

    showResult(txt, conf) {
        let res = this.getDom('result');
        if(res) res.classList.remove('hidden');
        let rt = this.getDom('resultText');
        if(rt) rt.textContent = txt;
        let rc = this.getDom('resultConfidence');
        if(rc) rc.textContent = conf;
    }

    showLoading(txt) {
        let ld = this.getDom('loading');
        if(ld) {
            let p = ld.querySelector('p');
            if(p) p.textContent = txt;
            ld.classList.remove('hidden');
        }
    }

    hideLoading() {
        let ld = this.getDom('loading');
        if(ld) ld.classList.add('hidden');
    }

    updateNetStatus() {
        let on = this.getDom('onlineBadge'), off = this.getDom('offlineBadge'), st = this.getDom('netStatus');
        if(navigator.onLine) {
            if(on) on.style.display='inline';
            if(off) off.style.display='none';
            if(st) st.textContent='متصل';
        } else {
            if(on) on.style.display='none';
            if(off) off.style.display='inline';
            if(st) st.textContent='Offline';
        }
    }

    setupEventListeners() {
        let btn = (id, fn) => { let el = this.getDom(id); if(el) el.addEventListener('click', fn); };
        btn('snapBtn', ()=>this.analyzeImage());
        btn('uploadBtn', ()=>this.getDom('fileInput')?.click());
        btn('sendBtn', ()=>this.sendMessage());
        btn('clearChatBtn', ()=>{ if(this.getDom('chatHistory')) this.getDom('chatHistory').innerHTML=''; this.addChatMessage('تم المسح','ai'); });
        btn('speakToggleBtn', ()=>{ this.speakEnabled=!this.speakEnabled; let b=this.getDom('speakToggleBtn'); if(b) b.innerHTML=this.speakEnabled?'النطق: ON':'النطق: OFF'; });
        btn('deepSearchBtn', ()=>{ this.deepSearchMode=!this.deepSearchMode; let b=this.getDom('deepSearchBtn'); if(b) b.style.borderColor=this.deepSearchMode?'var(--accent)':''; b.innerHTML=this.deepSearchMode?'🔍 بحث عميق ON':'🔍 بحث عميق'; this.addChatMessage(this.deepSearchMode?'وضع البحث العميق مفعل':'وضع البحث العميق متوقف','ai'); });
        let input = this.getDom('chatInput');
        if(input) input.addEventListener('keypress', e=>{ if(e.key==='Enter') this.sendMessage(); });
    }

    askAbout(topic) {
        let prompts = { food:'قولي عن الأكل المصري', history:'تاريخ مصر', sports:'الرياضة المصرية' };
        let msg = prompts[topic] || topic;
        let inp = this.getDom('chatInput');
        if(inp) { inp.value = msg; this.sendMessage(); }
    }
}

// بدء التشغيل
window.addEventListener('DOMContentLoaded', () => {
    window.ai = new EgyptianAI();
});
function showDevInfo() { let m=document.getElementById('devModal'); if(m) m.classList.remove('hidden'); }
function hideDevInfo() { let m=document.getElementById('devModal'); if(m) m.classList.add('hidden'); }
