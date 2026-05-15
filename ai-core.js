// ============================================
// المصري الذكي ULTRA - v10.0 ELITE (معدل)
// أفخم نسخة: متقدمة، ذكية، سريعة، ضخمة
// ============================================

class EgyptianAIUltra {
    constructor() {
        // ===== 1. الأساسيات والإعدادات =====
        this.version = '10.0 ELITE';
        this.model = null;
        this.isReady = false;
        this.speakEnabled = true;
        this.deepSearchMode = false;
        this.currentContext = 'general';
        this.mood = 'حنون';
        this.friendshipLevel = 0;
        this.apiKey = localStorage.getItem('ai_api_key') || '';
        
        // ===== 2. الذاكرة المتقدمة =====
        this.memory = this.loadMemory();
        this.userProfile = this.loadProfile();
        this.conversationHistory = [];
        this.shortTermMemory = [];  // آخر 500 رسالة
        this.longTermMemory = new Map(); // حقائق دائمة
        this.emotionalState = { happiness: 0.5, trust: 0.3, engagement: 0 };
        this.learningPatterns = new Map();
        
        // ===== 3. Cache المتقدم (LRU + TTL) =====
        this.responseCache = new Map();
        this.cacheMaxSize = 500;
        this.cacheExpiry = 1000 * 60 * 30; // 30 دقيقة
        this.queryAnalyticsCache = new Map();
        
        // ===== 4. نظام الكلام المتقدم =====
        this.speechQueue = [];
        this.isSpeaking = false;
        this.maxQueueSize = 20;
        this.voiceSettings = {
            lang: 'ar-EG',
            rate: 0.95,
            pitch: 1.0,
            volume: 1
        };
        
        // ===== 5. معرفة شاملة =====
        this.knowledgeBase = null;
        this.knowledgeIndex = new Map();
        this.semanticIndex = new Map();
        if (typeof MEGA_KNOWLEDGE !== 'undefined' && MEGA_KNOWLEDGE) {
            this.knowledgeBase = MEGA_KNOWLEDGE;
            this.buildKnowledgeIndex();
        } else {
            console.warn('⚠️ MEGA_KNOWLEDGE غير موجود، سيتم استخدام قاعدة معرفة فارغة مؤقتاً');
        }
        
        // ===== 6. معالجات النية (Intents) =====
        this.intentsSystem = this.initIntents();
        
        // ===== 7. DOM والواجهة =====
        this.dom = {};
        this.uiState = {
            isDarkMode: localStorage.getItem('darkMode') === 'true',
            fontSize: localStorage.getItem('fontSize') || 'medium',
            theme: localStorage.getItem('theme') || 'modern'
        };
        
        // ===== 8. البيانات الضخمة =====
        this.loadExtendedData();
        
        // ===== 9. أدوات خارجية =====
        this.weatherCache = { data: null, timestamp: 0 };
        this.newsCache = { data: null, timestamp: 0 };
        this.trendingCache = { data: null, timestamp: 0 };
        
        // ===== 10. الإحصائيات =====
        this.stats = {
            totalMessages: 0,
            totalResponses: 0,
            avgResponseTime: 0,
            favoriteTopics: new Map(),
            userSatisfaction: 0,
            cacheHitRate: 0,
            learningAccuracy: 0
        };
        
        this.init();
    }

    // ==================== INITIALIZATION ====================
    async init() {
        this.showLoading('⚡ تحميل أفخم إصدارة في التاريخ... المصري الذكي v10.0');
        
        try {
            // تحميل ML models (اختياري)
            if (typeof mobilenet !== 'undefined') {
                try {
                    this.model = await mobilenet.load();
                    console.log('✅ mobilenet loaded');
                } catch(e) { 
                    console.warn('⚠️ mobilenet failed:', e); 
                }
            }
            
            // تحضير النظام (تم بناء الفهرس مسبقاً)
            this.loadExtendedData();
            this.setupEventListeners();
            
            this.isReady = true;
            
            // الترحيب الذكي
            const greeting = this.getSmartGreeting();
            this.addChatMessage(greeting, 'ai');
            this.speak(greeting);
            
            // تحديث البيانات (مع حماية من الأخطاء)
            this.startCamera();
            this.updateNetStatus();
            this.fetchWeather().catch(e => console.warn('Weather fetch error:', e));
            this.fetchNews().catch(e => console.warn('News fetch error:', e));
            this.analyzeContext();
            
            // مراقبة دورية
            setInterval(() => this.updateNetStatus(), 30000);
            setInterval(() => this.fetchWeather().catch(e => console.warn(e)), 600000);
            setInterval(() => this.saveMemory(), 300000);
            setInterval(() => this.optimizeCache(), 900000);
            setInterval(() => this.analyzeContext(), 60000);
            
            console.log('🔥 المصري الذكي v10.0 جاهز بكامل قوته!');
            
        } catch(e) {
            console.error('❌ Error in init:', e);
        } finally {
            this.hideLoading(); // تأكد من إخفاء شاشة التحميل في كل الأحوال
        }
    }

    // ==================== المعرفة والفهرسة ====================
    buildKnowledgeIndex() {
        if (!this.knowledgeBase) return;
        
        // بناء فهرسة سريعة (chunked لتجنب تجميد الواجهة)
        const entries = Object.entries(this.knowledgeBase);
        let i = 0;
        const chunkSize = 100;
        
        const processChunk = () => {
            const end = Math.min(i + chunkSize, entries.length);
            for (; i < end; i++) {
                const [key, value] = entries[i];
                const normalized = this.normalize(key);
                this.knowledgeIndex.set(normalized, { key, value });
                const keywords = this.extractKeywords(key);
                keywords.forEach(kw => {
                    if (!this.semanticIndex.has(kw)) {
                        this.semanticIndex.set(kw, []);
                    }
                    this.semanticIndex.get(kw).push(normalized);
                });
            }
            if (i < entries.length) {
                setTimeout(processChunk, 10);
            } else {
                console.log(`📚 تم بناء فهرس معرفة بـ ${this.knowledgeIndex.size} عنصر`);
            }
        };
        
        processChunk();
    }

    searchKnowledgeAdvanced(query) {
        if (!this.knowledgeBase) return null;
        const nQuery = this.normalize(query);
        const keywords = this.extractKeywords(query);
        
        // 1. بحث مباشر
        if (this.knowledgeIndex.has(nQuery)) {
            return this.knowledgeIndex.get(nQuery);
        }
        
        // 2. بحث دلالي بالكلمات المفتاحية
        const results = new Map();
        keywords.forEach(kw => {
            const matched = this.semanticIndex.get(kw) || [];
            matched.forEach(key => {
                results.set(key, (results.get(key) || 0) + 1);
            });
        });
        
        if (results.size > 0) {
            const topMatch = Array.from(results.entries())
                .sort((a, b) => b[1] - a[1])[0][0];
            return this.knowledgeIndex.get(topMatch);
        }
        
        // 3. بحث جزئي
        for (const [key] of this.knowledgeIndex) {
            if (key.includes(nQuery) || nQuery.includes(key.substring(0, 5))) {
                return this.knowledgeIndex.get(key);
            }
        }
        
        return null;
    }

    // ==================== نظام الذاكرة الذكي ====================
    loadMemory() {
        const defaultMem = {
            facts: {},
            preferences: {},
            corrections: {},
            lastVisit: null,
            visitCount: 0,
            totalMessages: 0,
            favoriteTopics: [],
            achievements: [],
            learnedSkills: [],
            conversationThemes: new Map(),
            userInterests: new Set(),
            emotionalResponses: [],
            correctionLog: []
        };
        
        try {
            const saved = localStorage.getItem('ai_egypt_memory_ultra_v10');
            if (saved) {
                const parsed = JSON.parse(saved);
                return { ...defaultMem, ...parsed };
            }
        } catch(e) {
            console.warn('Memory load error:', e);
        }
        
        return defaultMem;
    }

    saveMemory() {
        try {
            const toSave = {
                facts: this.memory.facts,
                preferences: this.memory.preferences,
                corrections: this.memory.corrections,
                lastVisit: new Date().toISOString(),
                visitCount: this.memory.visitCount,
                totalMessages: this.memory.totalMessages,
                favoriteTopics: Array.from(this.memory.favoriteTopics),
                achievements: this.memory.achievements,
                learnedSkills: this.memory.learnedSkills
            };
            localStorage.setItem('ai_egypt_memory_ultra_v10', JSON.stringify(toSave));
        } catch(e) {
            console.warn('Memory save error:', e);
        }
    }

    loadProfile() {
        try {
            return JSON.parse(localStorage.getItem('ai_egypt_profile_ultra') || '{}');
        } catch {
            return {};
        }
    }

    saveProfile() {
        try {
            localStorage.setItem('ai_egypt_profile_ultra', JSON.stringify(this.userProfile));
        } catch(e) {
            console.warn('Profile save error:', e);
        }
    }

    // ==================== نظام الأغراض (Intents) المتقدم ====================
    initIntents() {
        return {
            greeting: {
                patterns: ['سلام', 'أهلا', 'هلا', 'صباح', 'مسا', 'مرحبا', 'السلام', 'hello', 'hi', 'ازيك'],
                weight: 1.2,
                handler: () => this.getSmartGreeting()
            },
            joke: {
                patterns: ['نكتة', 'ضحك', 'هزار', 'تنكّت', 'موقف', 'طريفة'],
                weight: 1.5,
                handler: () => this.getAdvancedJoke()
            },
            wisdom: {
                patterns: ['حكمة', 'نصيحة', 'عظة', 'درس', 'موعظة'],
                weight: 1.5,
                handler: () => this.getWisdomResponse()
            },
            emotion: {
                patterns: ['زعلان', 'فرحان', 'مبسوط', 'مضايق', 'عصبي', 'حزين', 'سعيد', 'خايف', 'قلق'],
                weight: 1.6,
                handler: (msg) => this.handleEmotion(msg)
            },
            setName: {
                patterns: ['اسمي', 'أنا اسمي', 'ناديني', 'قول لي اسمي'],
                weight: 1.8,
                handler: (msg) => this.handleSetName(msg)
            },
            knowledge: {
                patterns: [],
                weight: 1.4,
                handler: (msg) => this.handleKnowledgeQuery(msg)
            },
            weather: {
                patterns: ['طقس', 'الجو', 'حرارة', 'شمس', 'مطر', 'غيوم', 'رياح'],
                weight: 1.3,
                handler: () => this.getWeatherReport()
            },
            time: {
                patterns: ['وقت', 'ساعة', 'النهاردة', 'كام الساعة', 'تاريخ'],
                weight: 1.1,
                handler: () => this.getTimeReport()
            },
            health: {
                patterns: ['صحة', 'رجيم', 'حمية', 'رياضة', 'فيتامين', 'مرض', 'دواء'],
                weight: 1.4,
                handler: () => this.getHealthAdvice()
            },
            quran: {
                patterns: ['آية', 'قرآن', 'سورة', 'آيات', 'إسلام', 'دين'],
                weight: 1.7,
                handler: () => this.getQuranVerse()
            },
            hadith: {
                patterns: ['حديث', 'رسول', 'النبي', 'محمد', 'صحيح البخاري'],
                weight: 1.7,
                handler: () => this.getHadith()
            },
            recall: {
                patterns: ['افتكر', 'عرفتني', 'إحنا اتكلمنا', 'ركز', 'تذكر'],
                weight: 1.4,
                handler: () => this.recallMemory()
            }
        };
    }

    detectIntent(message) {
        let bestIntent = { key: 'default', score: 0, handler: null };
        const lower = message.toLowerCase();
        
        for (const [key, intent] of Object.entries(this.intentsSystem)) {
            let score = 0;
            for (const pattern of intent.patterns) {
                if (lower.includes(pattern)) {
                    const boost = pattern.length > 2 ? 1.5 : 1;
                    score += boost * intent.weight;
                }
            }
            if (score > bestIntent.score) {
                bestIntent = { key, score, handler: intent.handler };
            }
        }
        
        if (bestIntent.score === 0) {
            if (this.searchKnowledgeAdvanced(lower)) {
                bestIntent.key = 'knowledge';
                bestIntent.handler = this.intentsSystem.knowledge.handler;
            } else if (lower.includes('؟')) {
                bestIntent.key = 'question';
            }
        }
        return bestIntent;
    }

    // ==================== معالجات الأغراض ====================
    getSmartGreeting() {
        const hour = new Date().getHours();
        let timeGreeting;
        if (hour < 6) timeGreeting = 'نص الليل يا فاتح الخيل';
        else if (hour < 12) timeGreeting = 'صباح الفل والياسمين';
        else if (hour < 17) timeGreeting = 'مسا النور والهنا';
        else if (hour < 21) timeGreeting = 'مسا الخير والورد';
        else timeGreeting = 'تصبح على خير وأحلام جميلة';
        
        const name = this.memory.facts.name?.value;
        const visitCount = this.memory.visitCount || 0;
        
        if (visitCount === 0) {
            return `${timeGreeting} يا غالي! 👋\nأنا المصري الذكي v10.0 - أفخم نسخة في التاريخ! 🔥\nقولي اسمك عشان نتعرف أحسن وأنا أحفظك في ذاكرتي 🧠❤️`;
        } else if (visitCount === 1) {
            return `${timeGreeting}${name ? ` يا ${name}` : ''}! 🎉\nأنا سعيد جداً بشوفتك تاني! شكراً إنك رجعت 💫`;
        } else {
            const daysSince = this.getDaysSince(new Date(this.memory.lastVisit));
            if (daysSince === 0) {
                return `${timeGreeting}${name ? ` يا ${name}` : ''}! 👋\nأنت زي اللي ما تروح - ما تطول الغيبة 😄`;
            } else {
                return `${timeGreeting}${name ? ` يا ${name}` : ''}! 🌟\nفاتنك ${daysSince} يوم! كنت أشتاقك والله 💔`;
            }
        }
    }

    getAdvancedJoke() {
        const jokes = [
            { setup: 'مصري قال لصاحبه: أنا عملت حاجة تاريخية النهاردة!', punchline: 'قال: إيه؟ قال: حفظت رقم باص!', category: 'smart' },
            { setup: 'واحد بخيل بقى لاعب كورة!', punchline: 'قالوله: إيه أخبار الريح؟ قال: تمام، بس ما ماشش وحدي 😂', category: 'smart' },
            { setup: 'مصري دخل محل مسدس قال للبياع: عندك حاجة حلوة؟', punchline: 'قال: آه، الجواز! قال: ده ما حلو ده مؤلم! 💍', category: 'classic' },
            { setup: 'الفرق بين السرير والكرسي:', punchline: 'السرير بياخدك في حضنه والكرسي بيخليك تقف على رجليك وتشتغل! 😅', category: 'life' },
            { setup: 'مصري قال: أنا بحب الرياضة!', punchline: 'قالوله: أنت بتلعب كورة؟ قال: لا، بس بحب أتفرج وأقول: ده في! 🎯', category: 'classic' }
        ];
        const joke = jokes[Math.floor(Math.random() * jokes.length)];
        return `😂 ${joke.setup}\n👉 ${joke.punchline}\n\n[${joke.category}]`;
    }

    getWisdomResponse() {
        const wisdoms = [
            { text: 'اللي ياكل وحده يموت وحده', author: 'مثل مصري' },
            { text: 'الصبر مفتاح الفرج', author: 'حكمة إسلامية' },
            { text: 'العقل زينة يا فاقدها', author: 'بيت شعر' },
            { text: 'اللي ما يتعبش ما ياكلش', author: 'مثل شعبي' }
        ];
        const wisdom = wisdoms[Math.floor(Math.random() * wisdoms.length)];
        return `💡 "${wisdom.text}"\n— ${wisdom.author}`;
    }

    handleEmotion(message) {
        const lower = message.toLowerCase();
        if (lower.includes('زعلان') || lower.includes('حزين')) {
            return `متزعلش يا قلبي! 🤗\nحتى أفضل الأيام بتشوبها ساعات سيئة.\nبس تذكر دايماً: "بعد العسر يسر" ✨\nأنا هنا لو حاجة أساعدك فيها`;
        }
        if (lower.includes('فرحان') || lower.includes('مبسوط')) {
            return `🎉 يا سلام! فرحتني بفرحتك!\nدي طاقة إيجابية كويسة جداً.\nتستاهل أفضل حاجة في الدنيا يا غالي! 💫`;
        }
        if (lower.includes('خايف') || lower.includes('قلق')) {
            return `هدّي بالك يا حبيبي! 🧘\nالقلق بيأكل التركيز.\nخد نفس عميق واتوكل على الله.\nأنت أقوى مما تتخيل! 💪`;
        }
        return `أنا حاسس بمشاعرك. تحتاج شيء معين؟ 💙`;
    }

    handleSetName(message) {
        const match = message.match(/(?:اسمي|أنا اسمي|ناديني)\s+([ء-ي\s]{2,})/i);
        if (match) {
            const name = match[1].trim();
            this.memory.facts.name = { value: name, time: Date.now(), firstSet: this.memory.facts.name ? false : true };
            this.saveMemory();
            this.emotionalState.trust += 0.2;
            return `🎉 حفظت يا سيدي!\nمن النهاردة هناديك ${name}!\nاسم جميل والله! فرحتني بمعرفة اسمك! 💙`;
        }
        return 'قول اسمك بوضوح زي "اسمي أحمد" مثلاً 😊';
    }

    handleKnowledgeQuery(message) {
        const result = this.searchKnowledgeAdvanced(message);
        if (result) {
            const { key, value } = result;
            let response = `🎯 ${value.short}\n\n📖 ${value.full}`;
            if (value.recipe) response += `\n\n📝 الطريقة:\n${value.recipe}`;
            if (value.benefits) response += `\n\n🍎 الفوائد: ${value.benefits}`;
            if (value.types) response += `\n\n📂 الأنواع: ${value.types.join(', ')}`;
            if (value.history) response += `\n\n📚 ${value.history}`;
            
            this.memory.favoriteTopics.push(key);
            if (this.memory.favoriteTopics.length > 50) this.memory.favoriteTopics = this.memory.favoriteTopics.slice(-50);
            this.stats.favoriteTopics.set(key, (this.stats.favoriteTopics.get(key) || 0) + 1);
            return response;
        }
        return `❓ لم أجد معلومات عن "${message}".\nجرب تسألني عن حاجة أخرى أو قول لي "نكتة" 😄`;
    }

    getWeatherReport() {
        if (this.weatherCache.data && Date.now() - this.weatherCache.timestamp < 600000) {
            return `🌦️ الطقس: ${this.weatherCache.data}`;
        }
        return 'معلومات الطقس غير متاحة حالياً. حاول تاني بعدين.';
    }

    getTimeReport() {
        const now = new Date();
        const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const day = days[now.getDay()];
        const date = now.getDate();
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        return `⏰ ${day} ${date} ${month} ${year}\n🕐 الساعة: ${time}`;
    }

    getHealthAdvice() {
        const tips = ['🥗 كل صحي: فول + طعمية + خضار = طاقة وصحة', '🏃 اتمشى: 30 دقيقة يومياً = صحة قلب وعقل', '💧 اشرب مية: 8 أكواب يومياً = جسم صحي', '😴 نم كويس: 7-8 ساعات = تركيز أحسن', '🧘 تنفس عميق: يهدي الأعصاب والقلق', '🚴 مارس رياضة: السباحة أحسن رياضة'];
        return tips[Math.floor(Math.random() * tips.length)];
    }

    getQuranVerse() {
        const verses = [
            { text: '﴿ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ ﴾', reference: 'البقرة:153' },
            { text: '﴿ فَإِنَّ مَعَ الْعُسْرِ يُسْرًا ﴾', reference: 'الشرح:5' },
            { text: '﴿ وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ ﴾', reference: 'البقرة:216' }
        ];
        const verse = verses[Math.floor(Math.random() * verses.length)];
        return `📖 آية كريمة:\n${verse.text}\n[${verse.reference}]`;
    }

    getHadith() {
        const hadiths = [
            { text: '"إنما الأعمال بالنيات"', reference: 'رواه البخاري' },
            { text: '"من غشنا فليس منا"', reference: 'رواه مسلم' },
            { text: '"الدين النصيحة"', reference: 'رواه مسلم' }
        ];
        const hadith = hadiths[Math.floor(Math.random() * hadiths.length)];
        return `📖 حديث نبوي:\n${hadith.text}\n(${hadith.reference})`;
    }

    recallMemory() {
        const facts = Object.entries(this.memory.facts);
        if (facts.length === 0) return '🤔 لسه ما تعرفناش كويس!\nقول لي معلومات عنك أحفظها 📝';
        let text = '📚 أنا فاكرك:\n';
        facts.forEach(([k, v]) => text += `✓ ${k}: ${v.value}\n`);
        if (this.memory.favoriteTopics.length > 0) {
            const unique = [...new Set(this.memory.favoriteTopics)];
            text += `\n❤️ الموضوعات اللي بتحب:\n${unique.slice(0, 5).join(', ')}`;
        }
        return text;
    }

    // ==================== نظام الكلام المتقدم ====================
    speak(text) {
        if (!this.speakEnabled || !('speechSynthesis' in window)) return;
        const cleanText = text.replace(/[🎯📖📝🍎📂📚❓🌦️⏰🕐💫🎉🤗😄💔🌟💡🧘💙🎉🏃💧😴🚴📖💪]/g, '').trim();
        this.speechQueue.push(cleanText);
        if (this.speechQueue.length > this.maxQueueSize) this.speechQueue.shift();
        this.processQueue();
    }

    processQueue() {
        if (this.isSpeaking || this.speechQueue.length === 0) return;
        this.isSpeaking = true;
        const text = this.speechQueue.shift();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = this.voiceSettings.lang;
        utterance.rate = this.voiceSettings.rate;
        utterance.pitch = this.voiceSettings.pitch;
        utterance.volume = this.voiceSettings.volume;
        utterance.onend = () => { this.isSpeaking = false; this.processQueue(); };
        utterance.onerror = () => { this.isSpeaking = false; this.processQueue(); };
        try { window.speechSynthesis.speak(utterance); } catch(e) { console.warn('Speech error:', e); this.isSpeaking = false; this.processQueue(); }
    }

    // ==================== معالجة الرسائل ====================
    sendMessage() {
        const input = this.getDom('chatInput');
        if (!input) return;
        const message = input.value.trim();
        if (!message) return;
        this.addChatMessage(message, 'user');
        input.value = '';
        
        const cached = this.getCached(message);
        if (cached) {
            setTimeout(() => {
                this.addChatMessage(cached, 'ai');
                if (this.speakEnabled && cached.length < 400) this.speak(cached);
            }, 100);
            this.stats.cacheHitRate = ((this.stats.cacheHitRate * this.stats.totalMessages) + 1) / (this.stats.totalMessages + 1);
            return;
        }
        
        const response = this.generateResponse(message);
        this.setCached(message, response);
        setTimeout(() => {
            this.addChatMessage(response, 'ai');
            this.learnFromConversation(message, response);
            if (this.speakEnabled && response.length < 400) this.speak(response);
        }, 200);
    }

    generateResponse(message) {
        this.stats.totalMessages++;
        this.memory.totalMessages++;
        this.memory.visitCount++;
        this.memory.lastVisit = new Date().toISOString();
        const intent = this.detectIntent(message);
        if (intent.handler) {
            return intent.handler.call(this, message);
        }
        return this.getSmartDefault(message);
    }

    getSmartDefault(message) {
        const defaults = [
            `💭 سؤال عميق! بس أنا لسه بتعلم. ممكن تشرحلي أكتر؟`,
            `🤔 معلش يا غالي، لسه ما مرت عليا المعلومة دي. ممكن تساعدني؟`,
            `🌟 سؤالك جميل جداً! جرب تسألني عن الأكل أو التاريخ.`,
            `📚 أنا بتعلم كل يوم حاجات جديدة. شكراً على السؤال!`,
            `💡 فكرة جميلة! هحاول أفهم أكتر. قول لي تفاصيل أكتر؟`
        ];
        return defaults[Math.floor(Math.random() * defaults.length)];
    }

    learnFromConversation(message, response) {
        const intent = this.detectIntent(message);
        const pattern = { message, intent: intent.key, timestamp: Date.now(), userSatisfied: true };
        this.learningPatterns.set(`${intent.key}-${message.length}`, pattern);
        this.shortTermMemory.unshift({ user: message, ai: response, intent: intent.key, time: Date.now() });
        if (this.shortTermMemory.length > 500) this.shortTermMemory.pop();
        this.saveMemory();
    }

    // ==================== نظام الـ Cache المتقدم ====================
    getCached(query) {
        const key = this.normalize(query);
        if (this.responseCache.has(key)) {
            const cached = this.responseCache.get(key);
            if (Date.now() - cached.time < this.cacheExpiry) {
                this.responseCache.delete(key);
                this.responseCache.set(key, cached);
                return cached.response;
            } else {
                this.responseCache.delete(key);
            }
        }
        return null;
    }

    setCached(query, response) {
        const key = this.normalize(query);
        if (this.responseCache.size >= this.cacheMaxSize) {
            const oldest = this.responseCache.keys().next().value;
            this.responseCache.delete(oldest);
        }
        this.responseCache.set(key, { response, time: Date.now() });
    }

    optimizeCache() {
        const now = Date.now();
        let removed = 0;
        for (const [key, value] of this.responseCache) {
            if (now - value.time > this.cacheExpiry) {
                this.responseCache.delete(key);
                removed++;
            }
        }
        if (removed > 0) console.log(`🧹 تم تنظيف ${removed} عناصر من الـ Cache`);
    }

    // ==================== بيانات خارجية ====================
    async fetchWeather(city = 'Cairo') {
        try {
            const res = await fetch(`https://wttr.in/${city}?format=%C+%t+%w+%h`);
            const data = await res.text();
            this.weatherCache = { data, timestamp: Date.now() };
        } catch(e) { console.warn('Weather fetch failed:', e); }
    }

    async fetchNews() { /* محاكاة */ }

    analyzeContext() {
        if (this.shortTermMemory.length === 0) return;
        const recent = this.shortTermMemory.slice(0, 10);
        const intentCount = new Map();
        recent.forEach(msg => intentCount.set(msg.intent, (intentCount.get(msg.intent) || 0) + 1));
        const topIntent = Array.from(intentCount.entries()).sort((a,b)=>b[1]-a[1])[0];
        if (topIntent) this.currentContext = topIntent[0];
    }

    // ==================== أدوات مساعدة ====================
    normalize(text) {
        return text.toLowerCase().trim().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[ًٌٍَُِّْ]/g, '').replace(/\s+/g, ' ');
    }

    extractKeywords(text) {
        const stopWords = ['في', 'من', 'إلى', 'هو', 'هي', 'هم', 'أن', 'و', 'أو', 'ل'];
        const words = this.normalize(text).split(/\s+/);
        return words.filter(w => w.length > 2 && !stopWords.includes(w));
    }

    getDaysSince(date) { return Math.floor((Date.now() - date) / (1000*60*60*24)); }

    // ==================== واجهة المستخدم ====================
    getDom(id) {
        if (!this.dom[id]) this.dom[id] = document.getElementById(id);
        return this.dom[id];
    }

    addChatMessage(text, sender) {
        const history = this.getDom('chatHistory');
        if (!history) return;
        const div = document.createElement('div');
        div.className = `chat-message ${sender}`;
        div.textContent = text;
        div.style.animation = 'slideIn 0.3s ease-in-out';
        history.appendChild(div);
        history.scrollTop = history.scrollHeight;
    }

    showLoading(text = '⏳ جاري التحميل...') {
        const loading = this.getDom('loading');
        if (loading) { const p = loading.querySelector('p'); if (p) p.textContent = text; loading.classList.remove('hidden'); }
    }

    hideLoading() { const loading = this.getDom('loading'); if (loading) loading.classList.add('hidden'); }

    updateNetStatus() {
        const online = this.getDom('onlineBadge'), offline = this.getDom('offlineBadge');
        if (navigator.onLine) { if (online) online.style.display = 'inline'; if (offline) offline.style.display = 'none'; }
        else { if (online) online.style.display = 'none'; if (offline) offline.style.display = 'inline'; }
    }

    async startCamera() {
        const video = this.getDom('video');
        if (!video) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = stream;
        } catch(e) { console.log('📷 Camera not available'); }
    }

    async analyzeImage() {
        const video = this.getDom('video'), canvas = this.getDom('canvas');
        if (!video || !canvas || !this.model) return;
        canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d'); ctx.drawImage(video, 0, 0);
        try {
            const predictions = await this.model.classify(canvas);
            if (predictions.length > 0) {
                const top = predictions[0];
                this.showImageResult(top.className, (top.probability * 100).toFixed(2));
            }
        } catch(e) { console.warn('Image analysis error:', e); }
    }

    showImageResult(label, confidence) {
        const result = this.getDom('result'), text = this.getDom('resultText'), conf = this.getDom('resultConfidence');
        if (result) result.classList.remove('hidden');
        if (text) text.textContent = label;
        if (conf) conf.textContent = confidence;
    }

    setupEventListeners() {
        const add = (id, event, fn) => { const el = this.getDom(id); if (el) el.addEventListener(event, fn); };
        add('sendBtn', 'click', () => this.sendMessage());
        add('chatInput', 'keypress', (e) => { if (e.key === 'Enter') this.sendMessage(); });
        add('snapBtn', 'click', () => this.analyzeImage());
        add('clearChatBtn', 'click', () => { const h = this.getDom('chatHistory'); if (h) { h.innerHTML = ''; this.addChatMessage('تم مسح المحادثة ✓', 'ai'); } });
        add('speakToggleBtn', 'click', () => { this.speakEnabled = !this.speakEnabled; const btn = this.getDom('speakToggleBtn'); if (btn) btn.textContent = this.speakEnabled ? '🔊 صوت: مفعّل' : '🔇 صوت: معطّل'; });
    }

    loadExtendedData() { console.log('📊 تحميل البيانات الموسعة...'); }

    getStats() {
        return {
            totalMessages: this.stats.totalMessages,
            totalResponses: this.stats.totalResponses,
            avgResponseTime: `${(this.stats.avgResponseTime).toFixed(0)}ms`,
            cacheHitRate: `${(this.stats.cacheHitRate * 100).toFixed(1)}%`,
            topTopics: Array.from(this.stats.favoriteTopics.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5),
            memorySize: this.shortTermMemory.length,
            knowledgeSize: this.knowledgeIndex.size
        };
    }
}

// ==================== البدء الفوري ====================
window.addEventListener('DOMContentLoaded', () => {
    window.egyptianAI = new EgyptianAIUltra();
    console.log('✅ المصري الذكي ULTRA v10.0 مُفعّل!');
});

function showDevInfo() { const modal = document.getElementById('devModal'); if (modal) modal.classList.remove('hidden'); if (window.egyptianAI) console.table(window.egyptianAI.getStats()); }
function hideDevInfo() { const modal = document.getElementById('devModal'); if (modal) modal.classList.add('hidden'); }
