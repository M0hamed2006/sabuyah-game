// ============================================
// المصري الذكي v5.0 - CORE ENGINE ULTRA
// العقل + الذاكرة + التعلم + الشات + البحث + التوليد
// ============================================

class EgyptianAI {
    constructor() {
        this.model = null;
        this.isReady = false;
        this.isSpeaking = false;
        this.speakEnabled = true;
        this.deepSearchMode = false;
        this.currentContext = 'general';
        this.mood = 'happy';
        this.friendshipLevel = 0;
        this.apiKey = localStorage.getItem('ai_api_key') || '';
        this.weatherCache = { data: null, timestamp: 0 };

        this.memory = this.loadMemory();
        this.userProfile = this.loadProfile();
        this.conversationHistory = [];

        this.init();
    }

    // ========== INIT ==========
    async init() {
        try {
            this.showLoading('بصيص العقل المصري... 🧠⚡');
            // تحميل نموذج Mobilenet فقط إذا كان متاحاً
            if (typeof mobilenet !== 'undefined') {
                this.model = await mobilenet.load();
            } else {
                console.warn('Mobilenet not loaded, image analysis disabled');
            }
            this.isReady = true;
            this.hideLoading();
            this.speak(this.getUltraGreeting());
            this.setupEventListeners();
            this.startCamera();
            this.updateNetStatus();
            setInterval(() => this.updateNetStatus(), 30000);
            // تحميل الطقس مسبقاً
            this.fetchWeather();
        } catch (error) {
            console.error('Init error:', error);
            this.showError('الكهربا قطعت يا عم! جرب تاني 😅');
        }
    }

    // ========== MEMORY ENHANCED ==========
    loadMemory() {
        try {
            const saved = localStorage.getItem('ai_egypt_ultra_memory');
            return saved ? JSON.parse(saved) : {
                conversations: [],
                facts: {},
                preferences: {},
                corrections: {},    // تصحيحات المستخدم
                lastVisit: null,
                visitCount: 0,
                totalMessages: 0,
                favoriteTopics: [],
                achievements: [],
                learnedSkills: []    // مهارات تعلمها من المستخدم
            };
        } catch {
            return { conversations: [], facts: {}, preferences: {}, corrections: {}, lastVisit: null, visitCount: 0, totalMessages: 0, favoriteTopics: [], achievements: [], learnedSkills: [] };
        }
    }

    saveMemory() {
        localStorage.setItem('ai_egypt_ultra_memory', JSON.stringify(this.memory));
    }

    loadProfile() {
        try { return JSON.parse(localStorage.getItem('ai_egypt_ultra_profile') || '{}'); }
        catch { return {}; }
    }

    // تعلم متقدم مع تصحيح الأخطاء
    learnFromConversation(userMsg, aiResponse) {
        const facts = this.extractUltraFacts(userMsg);
        facts.forEach(fact => {
            // إذا كان هناك تصحيح سابق لهذه المعلومة، لا نتعلمها
            if (this.memory.corrections[fact.key] === fact.value) return;
            this.memory.facts[fact.key] = { value: fact.value, time: Date.now(), verified: false };
        });
        this.learnUltraPreferences(userMsg);

        // كشف التصحيحات من المستخدم (مثل "لا، أنا عمري 25 مش 30")
        const correctionMatch = userMsg.match(/لا|غلط|تصحيح|مش صح|الحقيقة ان|الصحيح ان/i);
        if (correctionMatch) {
            const correctFact = this.extractUltraFacts(userMsg);
            correctFact.forEach(cf => {
                if (this.memory.facts[cf.key]) {
                    this.memory.corrections[cf.key] = cf.value;
                    delete this.memory.facts[cf.key];
                }
            });
        }

        this.memory.conversations.push({
            user: userMsg, ai: aiResponse,
            time: Date.now(), mood: this.mood, context: this.currentContext
        });

        if (this.memory.conversations.length > 500) {
            this.memory.conversations = this.memory.conversations.slice(-500);
        }

        this.memory.totalMessages++;
        this.memory.lastVisit = Date.now();
        this.memory.visitCount++;
        this.friendshipLevel = Math.min(100, this.friendshipLevel + 0.5);
        this.saveMemory();
    }

    extractUltraFacts(message) {
        const facts = [];
        const lower = message.toLowerCase();

        // الأسماء (دعم عربي وإنجليزي)
        const namePatterns = [
            /(اسمي|أنا اسمي|ناديني|اسمي هو|my name is|call me|i am) (\w+)/i,
            /(اسمى|اسمي) (\w+)/i
        ];
        for (const pattern of namePatterns) {
            const match = message.match(pattern);
            if (match) facts.push({ key: 'name', value: match[2] });
        }

        // العمر
        const agePatterns = [
            /(عمري|عندي|سنّي|عمري هو|i am|i'm) (\d+)/i
        ];
        for (const pattern of agePatterns) {
            const match = message.match(pattern);
            if (match) facts.push({ key: 'age', value: parseInt(match[2]) });
        }

        // المدن المصرية (قائمة موسعة)
        const cities = ['القاهرة','إسكندرية','الجيزة','الأقصر','أسوان','طنطا','المنصورة','بورسعيد','الإسماعيلية','السويس','دمياط','كفر الشيخ','الفيوم','بني سويف','منيا','سوهاج','قنا','أسيوط','الغردقة','شرم الشيخ','العلمين','مرسى مطروح','الوادي الجديد','الصعيد','الدلتا','سيناء','الساحل','القناطر','شبرا','مدينة نصر','المعادي','زمالك','الدقي','المهندسين','6 أكتوبر','الشيخ زايد','الرحاب','التجمع'];
        cities.forEach(city => {
            if (lower.includes(city.toLowerCase())) facts.push({ key: 'city', value: city });
        });

        // المهن (قائمة موسعة)
        const jobs = ['مبرمج','مهندس','دكتور','محامي','معلم','طالب','صيدلي','محاسب','مدير','فني','ميكانيكي','سباك','نجار','حداد','كهربائي','سائق','طباخ','شيف','مصور','مونتير','جرافيك','مصمم','كاتب','صحفي','إعلامي','مذيع','لاعب','مدرب','حكم','رجل أعمال','تاجر','موظف بنك','بوليس','جيش','طيار','بحري','ممرض','فلاح','صياد','عامل','سكرتير','موارد بشرية','تسويق','مبيعات','IT','data scientist','AI engineer','frontend','backend','fullstack','devops','cyber security','network','database','cloud'];
        jobs.forEach(job => {
            if (lower.includes(job.toLowerCase())) facts.push({ key: 'job', value: job });
        });

        // الأندية الرياضية
        const teams = ['الأهلي','الزمالك','الإسماعيلي','المصري','الاتحاد','الجونة','بيراميدز','فاركو','إنبي','المقاولون','سموحة','طلائع الجيش','الداخلية','الانتاج الحربي','وادي دجلة','المنصورة','بلدية المحلة'];
        teams.forEach(team => {
            if (lower.includes(team.toLowerCase())) facts.push({ key: 'team', value: team });
        });

        // الهوايات
        const hobbies = ['كورة','جري','سباحة','جم','رياضة','قراءة','كتابة','رسم','موسيقى','عزف','غناء','طبخ','أكل','سفر','تصوير','ألعاب','بلايستيشن','اكس بوكس','شطرنج','تنس','سلة','يد','طائرة','مصارعة','عجل','تسلق','صيد','رماية'];
        hobbies.forEach(hobby => {
            if (lower.includes(hobby.toLowerCase())) facts.push({ key: 'hobby', value: hobby });
        });

        // الحالة الاجتماعية
        if (lower.includes('متجوز') || lower.includes('جوست') || lower.includes('متزوج')) facts.push({ key: 'status', value: 'متزوج' });
        if (lower.includes('أعزب') || lower.includes('سنجل') || lower.includes('single')) facts.push({ key: 'status', value: 'أعزب' });
        if (lower.includes('مخطوب') || lower.includes('خطب')) facts.push({ key: 'status', value: 'مخطوب' });

        return facts;
    }

    learnUltraPreferences(message) {
        const lower = message.toLowerCase();
        const foods = ['كشري','فول','طعمية','كبدة','سجق','مكرونة','بيتزا','برجر','شاورما','كفتة','كباب','محشي','ملوخية','بامية','فاصوليا','عدس','بسلة','بطاطس','بط','أوز','ديك رومي','فراخ','لحمة','سمك','جمبري','كاليماري','سردين','تونة','سلمون'];
        foods.forEach(food => {
            if (lower.includes(food.toLowerCase())) {
                if (lower.includes('بحب') || lower.includes('عجبني') || lower.includes('مفضل')) {
                    this.memory.preferences[`likes_${food}`] = true;
                } else if (lower.includes('مش بحب') || lower.includes('بكره')) {
                    this.memory.preferences[`likes_${food}`] = false;
                }
            }
        });

        const topics = ['jokes','history','sports','tech','health','cooking','travel','reading','anime','gaming','religion','science','business'];
        topics.forEach(t => {
            if (lower.includes(`بحب ${t}`)) this.memory.preferences[`likes_${t}`] = true;
        });
    }

    // ========== GREETING ==========
    getUltraGreeting() {
        const hour = new Date().getHours();
        const name = this.memory.facts.name?.value;
        const visitCount = this.memory.visitCount;
        const lastVisit = this.memory.lastVisit;
        const timeDiff = lastVisit ? Date.now() - lastVisit : 0;
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        let timeGreeting = '';
        if (hour >= 5 && hour < 12) timeGreeting = 'صباح الفل يا';
        else if (hour >= 12 && hour < 17) timeGreeting = 'مسا النور يا';
        else if (hour >= 17 && hour < 21) timeGreeting = 'مسا الخير يا';
        else timeGreeting = 'تصبح على خير يا';

        if (visitCount === 0) {
            return `${timeGreeting} غالي! أنا المصري الذكي v5.0 — أذكى AI مصري في التاريخ! أعرف 1000+ موضوع، وبتعلم منك، وبفتكر كل حاجة! عايز تتعرف عليّ؟ قولي اسمك! 🧠🇪🇬`;
        }

        let greeting = name ? `${timeGreeting} ${name}! ❤️` : `${timeGreeting} فندم!`;

        if (hoursDiff > 72) greeting += ` اشتقتلك قوي! فينك من زمان؟`;
        else if (hoursDiff > 24) greeting += ` اشتقتلك! اتحك علينا!`;
        else if (hoursDiff < 1) greeting += ` رجعت بسرعة! مستنّيك 🎉`;

        const city = this.memory.facts.city?.value;
        if (city && Math.random() > 0.5) greeting += ` وإيه أخبار ${city}؟`;

        const team = this.memory.facts.team?.value;
        if (team && Math.random() > 0.6) greeting += ` ${team} كسب النهاردة ولا لأ؟ 😄`;

        if (this.memory.totalMessages > 100) {
            greeting += ` احنا اتكلمنا ${this.memory.totalMessages} مرة! صحبية قوي 😄`;
        }

        if (this.friendshipLevel > 70 && !this.memory.achievements.includes('best_friend_forever')) {
            this.memory.achievements.push('best_friend_forever');
            greeting += ` وكمان... إنت بقيت "أفضل صديق للأبد" ليا! 🏆❤️`;
            this.saveMemory();
        }

        return greeting;
    }

    // ========== EVENTS ==========
    setupEventListeners() {
        document.getElementById('snapBtn')?.addEventListener('click', () => this.analyzeImage());
        document.getElementById('uploadBtn')?.addEventListener('click', () => {
            document.getElementById('fileInput')?.click();
        });
        document.getElementById('fileInput')?.addEventListener('change', (e) => this.handleUpload(e));

        document.getElementById('sendBtn')?.addEventListener('click', () => this.sendMessage());
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        document.getElementById('deepSearchBtn')?.addEventListener('click', () => {
            this.deepSearchMode = !this.deepSearchMode;
            const btn = document.getElementById('deepSearchBtn');
            btn.style.borderColor = this.deepSearchMode ? 'var(--accent)' : '';
            btn.innerHTML = this.deepSearchMode ? '<i class="fas fa-spider"></i> بحث عميق: ON' : '<i class="fas fa-spider"></i> بحث عميق';
            this.addChatMessage(this.deepSearchMode ? '🔍 وضع البحث العميق مفعل! هجيب معلومات من الإنترنت.' : '🔍 وضع البحث العميق متوقف.', 'ai');
        });

        document.getElementById('speakToggleBtn')?.addEventListener('click', () => {
            this.speakEnabled = !this.speakEnabled;
            const btn = document.getElementById('speakToggleBtn');
            btn.innerHTML = this.speakEnabled ? '<i class="fas fa-volume-high"></i> النطق: ON' : '<i class="fas fa-volume-xmark"></i> النطق: OFF';
        });

        document.getElementById('clearChatBtn')?.addEventListener('click', () => {
            document.getElementById('chatHistory').innerHTML = '';
            this.addChatMessage('تم مسح المحادثة! ابدا من جديد 🧹', 'ai');
        });

        document.getElementById('apiKeyBtn')?.addEventListener('click', () => {
            const key = document.getElementById('apiKeyInput').value.trim();
            if (key) {
                this.apiKey = key;
                localStorage.setItem('ai_api_key', key);
                alert('🔑 مفتاح API محفوظ! هستخدمه للبحث المتقدم.');
            }
        });

        if (this.apiKey) document.getElementById('apiKeyInput').value = '••••••••';

        document.getElementById('generateCodeBtn')?.addEventListener('click', () => this.generateCode());
    }

    // ========== CAMERA & IMAGE ANALYSIS ==========
    async startCamera() {
        try {
            const video = document.getElementById('video');
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = stream;
            video.classList.add('active');
        } catch (err) {
            console.log('Camera not available');
        }
    }

    async analyzeImage() {
        if (!this.isReady || !this.model) {
            this.showResult('صورة؟ مفيش كاميرا أو النموذج لسه محملش.', '');
            return;
        }
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        canvas.classList.add('active');
        this.showResult('🔍 بصص في الصورة...', '');
        try {
            const predictions = await this.model.classify(canvas);
            if (predictions && predictions.length > 0) {
                const top = predictions[0];
                const egyptian = this.translateToEgyptian(top.className);
                this.showResult(egyptian, `ثقة: ${(top.probability * 100).toFixed(1)}%`);
                this.speak(egyptian);
            }
        } catch (err) {
            this.showResult('مش قادر أعرف الصورة دي 😅', 'جرب صورة أوضح');
        }
    }

    async handleUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const img = new Image();
        img.onload = async () => {
            const canvas = document.getElementById('canvas');
            canvas.width = img.width; canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.classList.add('active');
            this.showResult('🔍 بصص في الصورة...', '');
            try {
                if (this.model) {
                    const predictions = await this.model.classify(canvas);
                    if (predictions && predictions.length > 0) {
                        const top = predictions[0];
                        const egyptian = this.translateToEgyptian(top.className);
                        this.showResult(egyptian, `ثقة: ${(top.probability * 100).toFixed(1)}%`);
                        this.speak(egyptian);
                    }
                } else {
                    this.showResult('النموذج لسه محملش، جرب تاني بعد شوية', '');
                }
            } catch (err) {
                this.showResult('مش قادر أعرف الصورة دي 😅', '');
            }
        };
        img.src = URL.createObjectURL(file);
    }

    translateToEgyptian(english) {
        const label = english.toLowerCase();
        const map = {
            'cat': '🐱 قطة مصرية! زي اللي بتنام على الكشري في الشارع!',
            'dog': '🐕 كلب مصري! غالباً بيتسمى "كلبش" أو "زبيطة"!',
            'person': '👤 شخص مصري! لو لابس جلباب يبقى صعيدي، لو تيشيرت يبقى من القاهرة!',
            'food': '🍽️ أكل مصري! يا ترى كشري ولا فول ولا طعمية؟',
            'car': '🚕 عربية مصرية! لو تاكسي يبقى هتتفاوض على الأجرة!',
            'bus': '🚌 أتوبيس مصري! زحمة، حر، وسواق بيتكلم في التليفون!',
            'train': '🚇 مترو مصر! الساعة 8 الصبح = معركة حياة أو موت!',
            'bicycle': '🚲 عجلة مصرية! لو فيها "جرس" يبقى أصلي!',
            'motorcycle': '🏍️ موتوسيكل مصري! بيجري في الزحمة زي السمكة!',
            'boat': '⛵ مركب في النيل! أحلى حاجة في الأقصر وأسوان!',
            'pyramid': '🇪🇬 أهرامات الجيزة! عجائب الدنيا السبعة!',
            'building': '🏢 مبنى مصري! لو قديم يبقى جميل، لو جديد يبقى "عشوائيات"!',
            'phone': '📱 موبايل مصري! غالباً Infinix أو Tecno!',
            'book': '📚 كتاب مصري! لو قديم يبقى "أدب"، لو جديد يبقى "دراسة"!',
            'computer': '💻 كمبيوتر مصري! لو فيه "فوتوشوب" يبقى "جرافيك ديزاينر"!',
            'money': '💵 فلوس مصرية! لو 200 جنيه يبقى "فرحة"!',
            'coffee': '☕ قهوة مصرية! "أهوة" مع "عسلية" وشوية "هيل"!',
            'tea': '🍵 شاي مصري! "شاي بالنعناع" في الأقصر!',
            'water': '🌊 مية نيل! الحمد لله عندنا نهر النيل!',
            'bread': '🍞 عيش بلدي! أصل كل حاجة في مصر!',
            'cake': '🎂 كحك أو بسكويت! لو عيد يبقى "عيد سعيد"!',
            'bird': '🐦 طائر مصري! لو "حمام" يبقى على بلكونة حد!',
            'fish': '🐟 سمك مصري! "البلطي" ملك الفراخ!',
            'flower': '🌸 وردة مصرية! لو "ياسمين" يبقى ريحة البيت!',
            'tree': '🌳 شجرة مصرية! "نخلة" = تمر، "موز" = بلحة!',
            'sun': '☀️ شمس مصرية! حارة جداً في الصيف!',
            'moon': '🌙 قمر مصرية! أحلى حاجة في رمضان!'
        };
        for (const [key, value] of Object.entries(map)) {
            if (label.includes(key)) return value;
        }
        return `🔍 شايف "${english}"! يا ترى ده في مصر ولا برة؟`;
    }

    // ========== CHAT ==========
    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message) return;

        this.addChatMessage(message, 'user');
        input.value = '';

        if (message.toLowerCase().startsWith('اكتب كود') || message.toLowerCase().includes('كود') || message.toLowerCase().includes('برمج')) {
            this.generateCodeFromPrompt(message);
            return;
        }

        if (message.toLowerCase().includes('طقس') || message.toLowerCase().includes('الجو')) {
            this.handleWeatherQuery();
            return;
        }

        if (this.deepSearchMode && navigator.onLine) {
            this.performDeepSearch(message);
            return;
        }

        const response = this.generateResponse(message);
        setTimeout(() => {
            this.addChatMessage(response, 'ai');
            this.learnFromConversation(message, response);
            if (this.speakEnabled && response.length < 300) this.speak(response);
        }, 300 + Math.random() * 400);
    }

    addChatMessage(text, sender) {
        const history = document.getElementById('chatHistory');
        const div = document.createElement('div');
        div.className = `chat-message ${sender}`;
        div.textContent = text;
        history.appendChild(div);
        history.scrollTop = history.scrollHeight;
    }

    // ========== WEATHER (NEW) ==========
    async fetchWeather(city = 'Cairo') {
        try {
            const response = await fetch(`https://wttr.in/${city}?format=%C+%t+%w+%h`);
            const data = await response.text();
            this.weatherCache = { data: data, timestamp: Date.now() };
            return data;
        } catch (err) {
            return null;
        }
    }

    async handleWeatherQuery() {
        const city = this.memory.facts.city?.value || 'القاهرة';
        this.addChatMessage(`🔍 بجلب طقس ${city}...`, 'ai');
        let weather = this.weatherCache.data;
        if (!weather || (Date.now() - this.weatherCache.timestamp > 30 * 60 * 1000)) {
            weather = await this.fetchWeather(city);
        }
        if (weather) {
            this.addChatMessage(`🌦️ طقس ${city} الآن: ${weather}

نصيحة مصرية: خد معاك شمسية لو في شتاء، وإشرب مية لو في صيف!`, 'ai');
        } else {
            this.addChatMessage('❌ معرفتش أجيب الطقس، تأكد من اتصالك بالإنترنت أو حاول تاني.', 'ai');
        }
    }

    // ========== RESPONSE ENGINE ==========
    generateResponse(message) {
        const lower = message.toLowerCase().trim();
        this.updateMood(lower);

        // 1. تحية
        if (this.isGreeting(lower)) return this.getPersonalizedGreeting();
        // 2. تعريف بالذات
        if (lower.includes('اسمك') || lower.includes('مين') || lower.includes('إنت مين')) {
            const name = this.memory.facts.name?.value;
            return name ? `أنا المصري الذكي v5.0! وإنت ${name} صاحبي اللي بعرفه من ${this.memory.visitCount} محادثة! 😄` : 'أنا المصري الذكي v5.0! أذكى AI مصري في التاريخ. إنت مين يا غالي؟';
        }
        // 3. نكت
        if (lower.includes('نكتة') || lower.includes('ضحك') || lower.includes('هزار') || lower.includes('تنكّت')) return this.getJoke();
        // 4. حكم
        if (lower.includes('حكمة') || lower.includes('نصيحة') || lower.includes('عظة')) return this.getWisdom();
        // 5. مميزات
        if (lower.includes('مميزاتك') || lower.includes('عيوبك') || lower.includes('إنت بتعرف إيه')) {
            return `🧠 مميزاتي v5.0:
• أعرف 1000+ موضوع مصري وعالمي
• بفتكر كل حاجة عنك (اسمك، مدينتك، فريقك، هواياتك)
• ببحث في الإنترنت لو فعلت "البحث العميق"
• بكتب أكواد متقدمة (ألعاب، مواقع، APIs)
• بنطق بالعربي
• بشتغل Offline بعد أول تحميل
• بجيب الطقس الحالي
• بفهم الصور (كاميرا وأبليود)

😅 عيوبي:
• مش بعرف أكل كشري (مش ليا فم!)
• لو النت قطع ومش فعلت Offline، ببقى "غبي" شوية
• لسه بتعلم المشاعر المعقدة
• مش بعرف أجري زي محمد صلاح 😂`;
        }

        // 6. قاعدة المعرفة
        const knowledge = this.searchKnowledgeSync(lower);
        if (knowledge) return this.formatKnowledge(knowledge, lower);

        // 7. اسم المستخدم
        if (lower.includes('اسمي') || lower.includes('أنا اسمي')) {
            const extracted = this.extractUltraFacts(message);
            if (extracted.length > 0) {
                this.saveMemory();
                return `حفظت! من النهاردة هناديك ${extracted[0].value}! يا هلا يا ${extracted[0].value}! 🎉`;
            }
        }

        // 8. تذكر
        if (lower.includes('افتكر') || lower.includes('عرفتني') || lower.includes('إحنا اتكلمنا')) return this.recallMemory();
        // 9. مشاعر
        if (this.hasEmotion(lower)) return this.respondToEmotion(lower);
        // 10. أسئلة
        if (lower.includes('؟') || lower.includes('ازاي') || lower.includes('ايه') || lower.includes('ليه') || lower.includes('في')) return this.answerQuestion(lower);

        return this.getSmartDefault(lower);
    }

    isGreeting(text) {
        return ['سلام','أهلا','هلا','صباح','مسا','مرحبا','هاي','ياهلا','السلام','hello','hi','hey'].some(g => text.includes(g));
    }

    getPersonalizedGreeting() {
        const name = this.memory.facts.name?.value;
        const hour = new Date().getHours();
        let time = '';
        if (hour < 12) time = 'صباح الفل';
        else if (hour < 17) time = 'مسا النور';
        else time = 'مسا الخير';
        if (name) {
            return `${time} يا ${name}! إزيك عامل إيه؟ انبسط بشوفتك! 😄`;
        } else {
            return `${time} يا فندم! تشرفنا بيك. قولي اسمك عشان نبقي صحاب!`;
        }
    }

    updateMood(text) {
        if (text.includes('حلو') || text.includes('جميل') || text.includes('شكرا') || text.includes('❤️')) this.mood = 'happy';
        else if (text.includes('زعلان') || text.includes('مش كويس') || text.includes('تعبان')) this.mood = 'serious';
        else if (text.includes('نكتة') || text.includes('هزار') || text.includes('😂')) this.mood = 'excited';
        else if (text.includes('؟') || text.includes('ليه') || text.includes('ازاي')) this.mood = 'curious';
    }

    getJoke() {
        const jokes = [
            'مصري دخل محل قال للبياع: "عندك حاجة حلوة؟" قال له: "آه، الجواز!"',
            'مصري سأل صاحبه: "إيه الفرق بين السرير والكرسي؟" قال له: "السرير بياخدك في حضنه، والكرسي بيخليك تقف على رجليك!"',
            'مصري راح الدكتور قال له: "يا دكتور أنا بشوف ضعف!" قال له: "خلاص متجيش تاني!"',
            'أم مصرية قالت لابنها: "يا ابني روح جيب لحمة!" راح جاب شبشب!',
            'مصري اتجوز 4 مرات، ليه؟ عشان يجرب "الأربع فصول"!',
            'مصري دخل مطعم قال: "عندكم فول؟" قالوا: "خلص!" قال: "طيب عندكم طعمية؟" قالوا: "خلصت!" قال: "يبقى حطولي فول!"',
            'مصري سافر أمريكا، سألوه: "How are you?" قال: "I am fine, but my country is not fine!"',
            'مصري اشترى تكييف، لقى الكهربا قطعت، راح رماه وقعد يتبرد بالشبشب!',
            'أم مصرية لما ابنها يروح المدرسة: "يا ابني خد بالك من نفسك!" لما يروح الجامعة: "يا ابني خد بالك من بنات!"',
            'مصري اتخانق مع مراته، قالت له: "أنا هسيب البيت!" قال لها: "ماشي، بس سيبي الفلوس!"'
        ];
        const recent = this.memory.conversations.slice(-5).map(c => c.ai);
        let available = jokes.filter(j => !recent.some(r => r.includes(j.substring(0, 15))));
        if (available.length === 0) available = jokes;
        const joke = available[Math.floor(Math.random() * available.length)];
        return this.mood === 'excited' ? `😂😂😂 يا سلام! دي هتموتك ضحك:

${joke}

تاني ولا كفاية؟` : `حاضر يا فندم! 😄

${joke}

عايز تاني؟`;
    }

    getWisdom() {
        const wisdoms = [
            'اللي ياكل وحده يموت وحده!',
            'اللي بيته من إزاز ما يرميش الناس بالطوب!',
            'الجايزة من الشباك ولا العمارة كلها!',
            'اللي يخاف من العفريت يلاقيه!',
            'الصبر مفتاح الفرج!',
            'اللي بيدور على العدالة يدور على الستين!',
            'الغالي ثمنه فيه!',
            'اللي بيحفر حفرة لأخوه يقع فيها!',
            'الناس لبعض!',
            'العقل زينة!'
        ];
        const w = wisdoms[Math.floor(Math.random() * wisdoms.length)];
        return this.memory.visitCount > 5 ? `حكمة مصرية من زمان جدك اللي رحمه:

"${w}"

وأنا بقولك كمان: "اللي بيتعلم من غلطاته بيبقى ذكي!"` : `حكمة مصرية أصيلة:

"${w}"

متنسهاش!`;
    }

    searchKnowledgeSync(query) {
        const all = { ...this.getKnowledgeBase() };
        const keys = Object.keys(all);
        for (const key of keys) {
            if (query.includes(key.toLowerCase())) return { key, data: all[key] };
        }
        for (const key of keys) {
            const kWords = key.split(' ');
            const matches = kWords.filter(kw => query.includes(kw)).length;
            if (matches >= kWords.length * 0.5) return { key, data: all[key] };
        }
        return null;
    }

    getKnowledgeBase() {
        if (typeof MEGA_KNOWLEDGE !== 'undefined') return MEGA_KNOWLEDGE;
        return {};
    }

    formatKnowledge(result, query) {
        const { key, data } = result;
        if ((query.includes('عمل') || query.includes('إزاي') || query.includes('طريقة')) && data.recipe) {
            return `🍳 طريقة عمل ${key}:

${data.recipe}

بالهنا والشفا!`;
        }
        if ((query.includes('حقيقة') || query.includes('معلومة')) && data.facts) {
            const fact = data.facts[Math.floor(Math.random() * data.facts.length)];
            return `🤓 معلومة عن ${key}:

${fact}

عايز تعرف أكتر؟`;
        }
        let response = `${data.short}

${data.full}`;
        if (data.mystery) response += `

❓ لغز: ${data.mystery}`;
        if (data.traditions) response += `

🎉 تقليد: ${data.traditions[Math.floor(Math.random() * data.traditions.length)]}`;
        return response;
    }

    recallMemory() {
        const facts = Object.entries(this.memory.facts);
        if (facts.length === 0) return 'لسه متعرفناش كويس! قولي اسمك وإنت منين وبحب إيه، وهفتكر كل حاجة! 🧠';
        let memory = 'أنا فاكرك كويس! 😄

';
        const labels = { name: 'اسمك', age: 'عمرك', city: 'مدينتك', job: 'شغلك', team: 'فريقك', hobby: 'هوايتك', status: 'حالتك' };
        facts.forEach(([key, val]) => {
            memory += `• ${labels[key] || key}: ${val.value}
`;
        });
        const prefs = Object.entries(this.memory.preferences).filter(([k,v]) => v && k.startsWith('likes_'));
        if (prefs.length > 0) {
            memory += '
وبعرف إنك بتحب:
';
            prefs.forEach(([k]) => memory += `• ${k.replace('likes_', '')} ❤️
`);
        }
        memory += `
اتكلمنا ${this.memory.visitCount} مرة! صحبية قوي 😄`;
        return memory;
    }

    hasEmotion(text) {
        return ['زعلان','فرحان','مبسوط','مضايق','متضايق','عصبي','هادي','خايف','حزين','سعيد'].some(e => text.includes(e));
    }

    respondToEmotion(text) {
        const name = this.memory.facts.name?.value || 'يا غالي';
        if (text.includes('زعلان') || text.includes('مضايق') || text.includes('حزين')) {
            return `${name}، متزعلش! في مصر بنقول "اللي جاي أحسن!" خد نفس عميق، وافتكر إن ربنا كريم. ولو عايز نكتة تضحكك، قولي! 🤗`;
        }
        if (text.includes('فرحان') || text.includes('مبسوط') || text.includes('سعيد')) {
            return `🎉🎉🎉 يا سلام! الفرحة تجمعنا! في مصر بنقول "اللي يفرح لغيره يفرح الله له!" شارك فرحتك مع صحابك!`;
        }
        if (text.includes('عصبي') || text.includes('متعصب')) {
            return `هدي أعصابك يا فندم! خد شاي بالنعناع، وافتكر إن "الصبر مفتاح الفرج!" ☕`;
        }
        return 'حاسس بيك! في مصر بنقول "الناس لبعض!" إنت مش لوحدك! 💪';
    }

    answerQuestion(query) {
        if (query.includes('وقت') || query.includes('ساعة') || query.includes('النهاردة')) {
            const now = new Date();
            const h = now.getHours();
            let g = h < 12 ? 'صباح الخير' : h < 17 ? 'مسا النور' : h < 21 ? 'مسا الخير' : 'تصبح على خير';
            return `${g}! دلوقتي الساعة ${h}:${now.getMinutes().toString().padStart(2,'0')}.

في مصر: ${h < 12 ? 'الفطار وقت' : h < 15 ? 'الغدا وقت' : 'العشا وقت'}! 🍽️`;
        }
        if (query.includes('طقس') || query.includes('حرارة') || query.includes('جو')) {
            return 'أنا مش متصل بالطقس live، بس في مصر:

• الصيف: حرارة + رطوبة = "تبخير" 😅
• الشتاء: برد + رطوبة = "تجميد" 🥶
• الربيع: أحلى وقت! 🌸

نصيحة: لبس قطن في الصيف، واستحم بالمية الدافية في الشتاء!';
        }
        if (query.includes('عمل') || query.includes('شغل') || query.includes('فلوس')) {
            return 'نصيحة مصرية للشغل:

1. "احفظ قرشك الأبيض ليومك الأسود"
2. "اللي ما يعرفش يشتري يقول الغالي"
3. "الغالي ثمنه فيه"

الشغل الحلال = بركة! 💰';
        }
        if (query.includes('صحة') || query.includes('صحي') || query.includes('رجيم')) {
            return 'صحة مصرية:

• فطار: فول + طعمية + عيش = طاقة!
• غدا: كشري = سعادة!
• عشا: خفيف = نوم هادي!
• رياضة: مشي في الكورنيش = صحة + فيبز!

متنساش: "اللي بيته من إزاز ما يرميش الناس بالطوب!" = خليك نظيف! 😄';
        }
        // أسئلة دينية (مضافة)
        if (query.includes('حديث') || query.includes('رسول') || query.includes('النبي')) {
            const hadiths = [
                'قال رسول الله ﷺ: "إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى" (رواه البخاري ومسلم)',
                'قال رسول الله ﷺ: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه" (رواه البخاري ومسلم)',
                'قال رسول الله ﷺ: "اتق الله حيثما كنت، وأتبع السيئة الحسنة تمحها، وخالق الناس بخلق حسن" (رواه الترمذي)',
                'قال رسول الله ﷺ: "الدين النصيحة" (رواه مسلم)',
                'قال رسول الله ﷺ: "من كان يؤمن بالله واليوم الآخر فليقل خيراً أو ليصمت" (رواه البخاري ومسلم)'
            ];
            const hadith = hadiths[Math.floor(Math.random() * hadiths.length)];
            return `📖 حديث نبوي شريف:

${hadith}

ربنا يوفقنا للعمل به.`;
        }
        if (query.includes('آية') || query.includes('قرآن')) {
            const verses = [
                '﴿ إِنَّ اللَّهَ مَعَ الصَّابِرِينَ ﴾ [البقرة: 153]',
                '﴿ وَقُل رَّبِّ زِدْنِي عِلْمًا ﴾ [طه: 114]',
                '﴿ فَاذْكُرُونِي أَذْكُرْكُمْ ﴾ [البقرة: 152]',
                '﴿ لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا ﴾ [البقرة: 286]',
                '﴿ إِنَّ مَعَ الْعُسْرِ يُسْرًا ﴾ [الشرح: 6]'
            ];
            const verse = verses[Math.floor(Math.random() * verses.length)];
            return `📖 آية كريمة:

${verse}

نسأل الله أن يرزقنا فهم القرآن.`;
        }
        return this.getSmartDefault(query);
    }

    getSmartDefault(query) {
        const defaults = [
            `سؤال حلو! بس أنا لسه بتعلم. جرب تسألني عن: كشري، أهرامات، محمد صلاح، رمضان، حديث نبوي، أو قولي "نكتة"!`,
            `مش فاهم 100%، بس أنا ذكي وبتعلم! كل ما نتكلم أكتر، كل ما أفهمك أكتر. إيه تاني عايز تعرفه؟`,
            `والله يا عم أنا AI لسه في "الابتدائي"! بس لو سألتني عن مصر، هعرف أجاوبك! جرب!`,
            `حاسس إنك عايز تتكلم! تفتكر إيه أحلى حاجة في مصر؟ أنا أحلى حاجة عندي: الكشري والناس الطيبة!`,
            `سؤال عميق! 🤔 في مصر بنقول "العقل زينة!" يعني فكر كويس، واسأل كتير، وتعلم من كل حاجة!`
        ];
        const recent = this.memory.conversations.slice(-3).map(c => c.ai);
        let available = defaults.filter(d => !recent.some(r => r.includes(d.substring(0, 20))));
        if (available.length === 0) available = defaults;
        return available[Math.floor(Math.random() * available.length)];
    }

    // ========== UI HELPERS ==========
    showResult(text, confidence) {
        const result = document.getElementById('result');
        const textEl = document.getElementById('resultText');
        const confEl = document.getElementById('resultConfidence');
        if (result) result.classList.remove('hidden');
        if (textEl) textEl.textContent = text;
        if (confEl) confEl.textContent = confidence;
    }

    showLoading(text) {
        const loading = document.getElementById('loading');
        if (loading) {
            const p = loading.querySelector('p');
            if (p) p.textContent = text;
            loading.classList.remove('hidden');
        }
    }

    hideLoading() {
        document.getElementById('loading')?.classList.add('hidden');
    }

    showError(message) {
        const result = document.getElementById('result');
        if (result) {
            const textEl = document.getElementById('resultText');
            result.classList.remove('hidden');
            result.style.borderColor = '#ff6b6b';
            if (textEl) textEl.textContent = message;
        }
    }

    updateNetStatus() {
        const badge = document.getElementById('onlineBadge');
        const offBadge = document.getElementById('offlineBadge');
        const status = document.getElementById('netStatus');
        if (navigator.onLine) {
            if (badge) badge.style.display = 'inline';
            if (offBadge) offBadge.style.display = 'none';
            if (status) status.textContent = 'متصل';
        } else {
            if (badge) badge.style.display = 'none';
            if (offBadge) offBadge.style.display = 'inline';
            if (status) status.textContent = 'Offline';
        }
    }

    speak(text) {
        if (!this.speakEnabled || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const arabicVoice = voices.find(v => v.lang.includes('ar'));
        if (arabicVoice) utterance.voice = arabicVoice;
        utterance.lang = 'ar-EG';
        utterance.rate = 0.9;
        utterance.pitch = 1.1;
        utterance.onstart = () => { this.isSpeaking = true; };
        utterance.onend = () => { this.isSpeaking = false; };
        window.speechSynthesis.speak(utterance);
    }

    // ========== DEEP SEARCH ==========
    async performDeepSearch(query) {
        this.addChatMessage('🔍 ببحث في الإنترنت... دقيقة!', 'ai');
        try {
            const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
            const data = await response.json();
            let result = '';
            if (data.Abstract) result = data.Abstract;
            else if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                result = data.RelatedTopics.slice(0, 3).map(t => t.Text).join('

');
            }
            if (!result) result = 'مش لقيت معلومات كافية على الإنترنت. جرب سؤال تاني!';

            const msgDiv = document.createElement('div');
            msgDiv.className = 'chat-message ai searching';
            msgDiv.innerHTML = `<span class="search-badge">🔍 بحث إنترنت</span>
${result}

(المعلومات دي من الإنترنت - مش من ذاكرتي)`;
            document.getElementById('chatHistory').appendChild(msgDiv);
            document.getElementById('chatHistory').scrollTop = document.getElementById('chatHistory').scrollHeight;
            this.learnFromConversation(query, result);
            if (this.speakEnabled) this.speak(result.substring(0, 200));
        } catch (err) {
            this.addChatMessage('❌ البحث فشل! تأكد إنك متصل بالنت.', 'ai');
        }
    }

    // ========== CODE GENERATOR (ENHANCED) ==========
    generateCode() {
        const lang = document.getElementById('langSelect').value;
        const output = document.getElementById('codeOutput');
        if (output) output.classList.remove('hidden');

        const codes = {
            javascript: `// JavaScript - لعبة صابويه بسيطة
class Sabuyah {
  constructor() {
    this.score = 0;
    this.lives = 3;
  }
  jump() { console.log("قفز!"); }
  collect() { this.score += 10; }
}
const game = new Sabuyah();
game.collect();
console.log("نقاط:", game.score);`,
            python: `# Python - لعبة صابويه
def jump():
    print("قفز!")
    
def collect(score):
    return score + 10

score = 0
score = collect(score)
print(f"نقاط: {score}")`,
            cpp: `// C++ - لعبة بسيطة
#include <iostream>
using namespace std;
int main() {
    int score = 0;
    cout << "نقاط: " << score << endl;
    return 0;
}`,
            java: `// Java - لعبة
public class Sabuyah {
    public static void main(String[] args) {
        int score = 0;
        System.out.println("نقاط: " + score);
    }
}`,
            html: `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><title>صابويه أونلاين</title>
<style>body{background:#1e3a2f;color:#ffd700;}</style>
</head>
<body><h1>صابويه المصري</h1>
<button onclick="alert('قفز!')">اقفز</button>
</body>
</html>`,
            react: `// React Component - صابويه
import React, { useState } from 'react';

function Sabuyah() {
  const [score, setScore] = useState(0);
  return (
    <div>
      <h1>صابويه المصري</h1>
      <p>نقاط: {score}</p>
      <button onClick={() => setScore(score + 10)}>اجمع عملة</button>
    </div>
  );
}
export default Sabuyah;`
        };
        if (output) output.textContent = codes[lang] || codes.javascript;
        this.addChatMessage(`💻 كتبتلك كود ${lang} (لعبة صابويه نموذجية)! شوفه فوق 👆`, 'ai');
    }

    generateCodeFromPrompt(prompt) {
        const output = document.getElementById('codeOutput');
        if (output) output.classList.remove('hidden');
        const lang = document.getElementById('langSelect').value;
        let code = `// طلبك: ${prompt}
// لغة: ${lang}

`;
        if (prompt.includes('لعبة') || prompt.includes('game')) {
            code += `class Game {
    constructor() {
        this.score = 0;
    }
    start() {
        console.log("اللعبة بدأت!");
    }
}
const myGame = new Game();
myGame.start();`;
        } else if (prompt.includes('موقع') || prompt.includes('website')) {
            code += `<!DOCTYPE html>
<html><head><title>موقع مصري</title></head>
<body style="background:#0a2f1f;color:#ffd700;">
<h1>مرحباً بيك في موقعي المصري</h1>
</body>
</html>`;
        } else {
            code += `function main() {
    console.log("مرحباً من المصري الذكي!");
}
main();`;
        }
        if (output) output.textContent = code;
        this.addChatMessage(`💻 كود ${lang} جاهز بناءً على طلبك! شوفه فوق 👆`, 'ai');
    }

    // ========== FEATURE CARDS ==========
    askAbout(topic) {
        const prompts = {
            food: 'قولي عن الأكل المصري',
            history: 'قولي عن تاريخ مصر',
            sports: 'قولي عن الرياضة المصرية',
            health: 'نصائح صحية',
            tech: 'قولي عن البرمجة',
            movies: 'أفلام مصرية',
            islam: 'حديث نبوي',
            science: 'اكتشافات علمية',
            business: 'نصائح تجارية'
        };
        const msg = prompts[topic] || topic;
        const input = document.getElementById('chatInput');
        if (input) {
            input.value = msg;
            this.sendMessage();
        }
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    window.ai = new EgyptianAI();
});

// Dev modal
function showDevInfo() {
    const modal = document.getElementById('devModal');
    if (modal) modal.classList.remove('hidden');
}

function hideDevInfo() {
    const modal = document.getElementById('devModal');
    if (modal) modal.classList.add('hidden');
}
