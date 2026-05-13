// ============================================
// المصري الذكي v4.0 - CORE ENGINE
// العقل + الذاكرة + التعلم + الشات الذكي
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

        this.memory = this.loadMemory();
        this.userProfile = this.loadProfile();
        this.conversationHistory = [];

        this.init();
    }

    // ========== INIT ==========
    async init() {
        try {
            this.showLoading('بصيص العقل المصري... 🧠⚡');
            this.model = await mobilenet.load();
            this.isReady = true;
            this.hideLoading();
            this.speak(this.getUltraGreeting());
            this.setupEventListeners();
            this.startCamera();
            this.updateNetStatus();
        } catch (error) {
            console.error('Error:', error);
            this.showError('الكهربا قطعت يا عم! جرب تاني 😅');
        }
    }

    // ========== MEMORY ==========
    loadMemory() {
        try {
            const saved = localStorage.getItem('ai_egypt_ultra_memory');
            return saved ? JSON.parse(saved) : {
                conversations: [], facts: {}, preferences: {},
                lastVisit: null, visitCount: 0, totalMessages: 0,
                favoriteTopics: [], achievements: []
            };
        } catch {
            return { conversations: [], facts: {}, preferences: {}, lastVisit: null, visitCount: 0, totalMessages: 0, favoriteTopics: [], achievements: [] };
        }
    }

    saveMemory() {
        localStorage.setItem('ai_egypt_ultra_memory', JSON.stringify(this.memory));
    }

    loadProfile() {
        try { return JSON.parse(localStorage.getItem('ai_egypt_ultra_profile') || '{}'); }
        catch { return {}; }
    }

    learnFromConversation(userMsg, aiResponse) {
        const facts = this.extractUltraFacts(userMsg);
        facts.forEach(fact => {
            this.memory.facts[fact.key] = { value: fact.value, time: Date.now() };
        });
        this.learnUltraPreferences(userMsg);

        this.memory.conversations.push({
            user: userMsg, ai: aiResponse,
            time: Date.now(), mood: this.mood, context: this.currentContext
        });

        if (this.memory.conversations.length > 200) {
            this.memory.conversations = this.memory.conversations.slice(-200);
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

        const namePatterns = [
            /(اسمي|أنا اسمي|ناديني|اسمي هو|my name is|call me|i am) (\w+)/i
        ];
        for (const pattern of namePatterns) {
            const match = message.match(pattern);
            if (match) facts.push({ key: 'name', value: match[2] });
        }

        const agePatterns = [
            /(عمري|عندي|سنّي|عمري هو|i am|i'm) (\d+)/i
        ];
        for (const pattern of agePatterns) {
            const match = message.match(pattern);
            if (match) facts.push({ key: 'age', value: parseInt(match[2]) });
        }

        const cities = ['القاهرة','إسكندرية','الجيزة','الأقصر','أسوان','طنطا','المنصورة','بورسعيد','الإسماعيلية','السويس','دمياط','كفر الشيخ','الفيوم','بني سويف','منيا','سوهاج','قنا','أسيوط','الغردقة','شرم الشيخ','العلمين','مرسى مطروح','الوادي الجديد','الصعيد','الدلتا','سيناء','الساحل','القناطر','شبرا','مدينة نصر','المعادي','زمالك','الدقي','المهندسين','6 أكتوبر','الشيخ زايد','الرحاب','التجمع'];
        cities.forEach(city => {
            if (lower.includes(city.toLowerCase())) facts.push({ key: 'city', value: city });
        });

        const jobs = ['مبرمج','مهندس','دكتور','محامي','معلم','طالب','صيدلي','محاسب','مدير','فني','ميكانيكي','سباك','نجار','حداد','كهربائي','سائق','طباخ','شيف','مصور','مونتير','جرافيك','مصمم','كاتب','صحفي','إعلامي','مذيع','لاعب','مدرب','حكم','رجل أعمال','تاجر','موظف بنك','بوليس','جيش','طيار','بحري','ممرض','فلاح','صياد','عامل','سكرتير','موارد بشرية','تسويق','مبيعات','IT','data scientist','AI engineer','frontend','backend','fullstack','devops','cyber security','network','database','cloud'];
        jobs.forEach(job => {
            if (lower.includes(job.toLowerCase())) facts.push({ key: 'job', value: job });
        });

        const teams = ['الأهلي','الزمالك','الإسماعيلي','المصري','الاتحاد','الجونة','بيراميدز','فاركو','إنبي','المقاولون','سموحة','طلائع الجيش','الداخلية','الانتاج الحربي','وادي دجلة','المنصورة','بلدية المحلة'];
        teams.forEach(team => {
            if (lower.includes(team.toLowerCase())) facts.push({ key: 'team', value: team });
        });

        const hobbies = ['كورة','جري','سباحة','جم','رياضة','قراءة','كتابة','رسم','موسيقى','عزف','غناء','طبخ','أكل','سفر','تصوير','ألعاب','بلايستيشن','اكس بوكس','شطرنج','تنس','سلة','يد','طائرة','مصارعة','عجل','تسلق','صيد','رماية'];
        hobbies.forEach(hobby => {
            if (lower.includes(hobby.toLowerCase())) facts.push({ key: 'hobby', value: hobby });
        });

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

        if (lower.includes('بحب النكت')) this.memory.preferences.likes_jokes = true;
        if (lower.includes('بحب التاريخ')) this.memory.preferences.likes_history = true;
        if (lower.includes('بحب الرياضة')) this.memory.preferences.likes_sports = true;
        if (lower.includes('بحب التكنولوجيا')) this.memory.preferences.likes_tech = true;
        if (lower.includes('بحب الصحة')) this.memory.preferences.likes_health = true;
        if (lower.includes('بحب الطبخ')) this.memory.preferences.likes_cooking = true;
        if (lower.includes('بحب السفر')) this.memory.preferences.likes_travel = true;
        if (lower.includes('بحب القراءة')) this.memory.preferences.likes_reading = true;
        if (lower.includes('بحب الأنمي')) this.memory.preferences.likes_anime = true;
        if (lower.includes('بحب الألعاب')) this.memory.preferences.likes_gaming = true;
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
            return `${timeGreeting} غالي! أنا المصري الذكي v4.0 — أذكى AI مصري في التاريخ! أعرف 500+ موضوع، وبتعلم منك، وبفتكر كل حاجة! عايز تتعرف عليّ؟ قولي اسمك! 🧠🇪🇬`;
        }

        let greeting = name ? `${timeGreeting} ${name}! ❤️` : `${timeGreeting} فندم!`;

        if (hoursDiff > 24) greeting += ` اشتقتلك! فينك من زمان؟`;
        else if (hoursDiff < 1) greeting += ` رجعت بسرعة! مستنّيك 🎉`;

        const city = this.memory.facts.city?.value;
        if (city && Math.random() > 0.5) greeting += ` وإيه أخبار ${city}؟`;

        const team = this.memory.facts.team?.value;
        if (team && Math.random() > 0.6) greeting += ` ${team} كسب النهاردة ولا لأ؟ 😄`;

        if (this.memory.totalMessages > 50) {
            greeting += ` احنا اتكلمنا ${this.memory.totalMessages} مرة! صحبية قوي 😄`;
        }

        if (this.friendshipLevel > 50 && !this.memory.achievements.includes('best_friend')) {
            this.memory.achievements.push('best_friend');
            greeting += ` وكمان... إنت بقيت "أفضل صديق" ليا! 🏆`;
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

    // ========== CAMERA ==========
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
        if (!this.isReady) return;
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
                const predictions = await this.model.classify(canvas);
                if (predictions && predictions.length > 0) {
                    const top = predictions[0];
                    const egyptian = this.translateToEgyptian(top.className);
                    this.showResult(egyptian, `ثقة: ${(top.probability * 100).toFixed(1)}%`);
                    this.speak(egyptian);
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

        if (this.deepSearchMode && navigator.onLine) {
            this.performDeepSearch(message);
            return;
        }

        const response = this.generateResponse(message);
        setTimeout(() => {
            this.addChatMessage(response, 'ai');
            this.learnFromConversation(message, response);
            if (this.speakEnabled && response.length < 300) this.speak(response);
        }, 500 + Math.random() * 500);
    }

    addChatMessage(text, sender) {
        const history = document.getElementById('chatHistory');
        const div = document.createElement('div');
        div.className = `chat-message ${sender}`;
        div.textContent = text;
        history.appendChild(div);
        history.scrollTop = history.scrollHeight;
    }

    // ========== RESPONSE ENGINE ==========
    generateResponse(message) {
        const lower = message.toLowerCase().trim();
        this.updateMood(lower);

        if (this.isGreeting(lower)) return this.getPersonalizedGreeting();
        if (lower.includes('اسمك') || lower.includes('مين') || lower.includes('إنت مين')) {
            const name = this.memory.facts.name?.value;
            return name ? `أنا المصري الذكي! وإنت ${name} صاحبي اللي بعرفه من ${this.memory.visitCount} محادثة! 😄` : 'أنا المصري الذكي v4.0! أذكى AI مصري في التاريخ. إنت مين يا غالي؟';
        }
        if (lower.includes('نكتة') || lower.includes('ضحك') || lower.includes('هزار') || lower.includes('تنكّت')) return this.getJoke();
        if (lower.includes('حكمة') || lower.includes('نصيحة') || lower.includes('عظة')) return this.getWisdom();
        if (lower.includes('مميزاتك') || lower.includes('عيوبك') || lower.includes('إنت بتعرف إيه')) {
            return `🧠 مميزاتي:\n• أعرف 500+ موضوع مصري وعالمي\n• بفتكر كل حاجة عنك (اسمك، مدينتك، فريقك)\n• ببحث في الإنترنت لو فعلت "البحث العميق"\n• بكتب أكواد في 12 لغة برمجة\n• بنطق بالعربي\n• بشتغل Offline بعد أول تحميل\n\n😅 عيوبي:\n• مش بعرف أكل كشري (مش ليا فم!)\n• لو النت قطع ومش فعلت Offline، ببقى "غبي" شوية\n• لسه بتعلم المشاعر المعقدة\n• مش بعرف أجري زي محمد صلاح 😂`;
        }

        const knowledge = this.searchKnowledge(lower);
        if (knowledge) return this.formatKnowledge(knowledge, lower);

        if (lower.includes('اسمي') || lower.includes('أنا اسمي')) {
            const extracted = this.extractUltraFacts(message);
            if (extracted.length > 0) {
                this.saveMemory();
                return `حفظت! من النهاردة هناديك ${extracted[0].value}! يا هلا يا ${extracted[0].value}! 🎉`;
            }
        }

        if (lower.includes('افتكر') || lower.includes('عرفتني') || lower.includes('إحنا اتكلمنا')) return this.recallMemory();
        if (this.hasEmotion(lower)) return this.respondToEmotion(lower);
        if (lower.includes('؟') || lower.includes('ازاي') || lower.includes('ايه') || lower.includes('ليه') || lower.includes('في')) return this.answerQuestion(lower);

        return this.getSmartDefault(lower);
    }

    isGreeting(text) {
        return ['سلام','أهلا','هلا','صباح','مسا','مرحبا','هاي','ياهلا','السلام','hello','hi','hey'].some(g => text.includes(g));
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
        return this.mood === 'excited' ? `😂😂😂 يا سلام! دي هتموتك ضحك:\n\n${joke}\n\nتاني ولا كفاية؟` : `حاضر يا فندم! 😄\n\n${joke}\n\nعايز تاني؟`;
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
        return this.memory.visitCount > 5 ? `حكمة مصرية من زمان جدك اللي رحمه:\n\n"${w}"\n\nوأنا بقولك كمان: "اللي بيتعلم من غلطاته بيبقى ذكي!"` : `حكمة مصرية أصيلة:\n\n"${w}"\n\nمتنسهاش!`;
    }

    searchKnowledge(query) {
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
            return `🍳 طريقة عمل ${key}:\n\n${data.recipe}\n\nبالهنا والشفا!`;
        }
        if ((query.includes('حقيقة') || query.includes('معلومة')) && data.facts) {
            const fact = data.facts[Math.floor(Math.random() * data.facts.length)];
            return `🤓 معلومة عن ${key}:\n\n${fact}\n\nعايز تعرف أكتر؟`;
        }
        let response = `${data.short}\n\n${data.full}`;
        if (data.mystery) response += `\n\n❓ لغز: ${data.mystery}`;
        if (data.traditions) response += `\n\n🎉 تقليد: ${data.traditions[Math.floor(Math.random() * data.traditions.length)]}`;
        return response;
    }

    recallMemory() {
        const facts = Object.entries(this.memory.facts);
        if (facts.length === 0) return 'لسه متعرفناش كويس! قولي اسمك وإنت منين وبحب إيه، وهفتكر كل حاجة! 🧠';
        let memory = 'أنا فاكرك كويس! 😄\n\n';
        const labels = { name: 'اسمك', age: 'عمرك', city: 'مدينتك', job: 'شغلك', team: 'فريقك', hobby: 'هوايتك', status: 'حالتك' };
        facts.forEach(([key, val]) => {
            memory += `• ${labels[key] || key}: ${val.value}\n`;
        });
        const prefs = Object.entries(this.memory.preferences).filter(([k,v]) => v && k.startsWith('likes_'));
        if (prefs.length > 0) {
            memory += '\nوبعرف إنك بتحب:\n';
            prefs.forEach(([k]) => memory += `• ${k.replace('likes_', '')} ❤️\n`);
        }
        memory += `\nاتكلمنا ${this.memory.visitCount} مرة! صحبية قوي 😄`;
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
            return `${g}! دلوقتي الساعة ${h}:${now.getMinutes().toString().padStart(2,'0')}.\n\nفي مصر: ${h < 12 ? 'الفطار وقت' : h < 15 ? 'الغدا وقت' : 'العشا وقت'}! 🍽️`;
        }
        if (query.includes('طقس') || query.includes('حرارة') || query.includes('جو')) {
            return 'أنا مش متصل بالطقس live، بس في مصر:\n\n• الصيف: حرارة + رطوبة = "تبخير" 😅\n• الشتاء: برد + رطوبة = "تجميد" 🥶\n• الربيع: أحلى وقت! 🌸\n\nنصيحة: لبس قطن في الصيف، واستحم بالمية الدافية في الشتاء!';
        }
        if (query.includes('عمل') || query.includes('شغل') || query.includes('فلوس')) {
            return 'نصيحة مصرية للشغل:\n\n1. "احفظ قرشك الأبيض ليومك الأسود"\n2. "اللي ما يعرفش يشتري يقول الغالي"\n3. "الغالي ثمنه فيه"\n\nالشغل الحلال = بركة! 💰';
        }
        if (query.includes('صحة') || query.includes('صحي') || query.includes('رجيم')) {
            return 'صحة مصرية:\n\n• فطار: فول + طعمية + عيش = طاقة!\n• غدا: كشري = سعادة!\n• عشا: خفيف = نوم هادي!\n• رياضة: مشي في الكورنيش = صحة + فيبز!\n\nمتنساش: "اللي بيته من إزاز ما يرميش الناس بالطوب!" = خليك نظيف! 😄';
        }
        return this.getSmartDefault(query);
    }

    getSmartDefault(query) {
        const defaults = [
            `سؤال حلو! بس أنا لسه بتعلم. جرب تسألني عن: كشري، أهرامات، محمد صلاح، رمضان، أو قولي "نكتة"!`,
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
        result.classList.remove('hidden');
        textEl.textContent = text;
        confEl.textContent = confidence;
    }

    showLoading(text) {
        const loading = document.getElementById('loading');
        const p = loading.querySelector('p');
        if (p) p.textContent = text;
        loading.classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading')?.classList.add('hidden');
    }

    showError(message) {
        const result = document.getElementById('result');
        const textEl = document.getElementById('resultText');
        result.classList.remove('hidden');
        result.style.borderColor = '#ff6b6b';
        textEl.textContent = message;
    }

    updateNetStatus() {
        const badge = document.getElementById('onlineBadge');
        const offBadge = document.getElementById('offlineBadge');
        const status = document.getElementById('netStatus');
        if (navigator.onLine) {
            badge.style.display = 'inline';
            offBadge.style.display = 'none';
            status.textContent = 'متصل';
        } else {
            badge.style.display = 'none';
            offBadge.style.display = 'inline';
            status.textContent = 'Offline';
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
        utterance.rate = 1;
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
                result = data.RelatedTopics.slice(0, 3).map(t => t.Text).join('\n\n');
            }
            if (!result) result = 'مش لقيت معلومات كافية على الإنترنت. جرب سؤال تاني!';

            const msgDiv = document.createElement('div');
            msgDiv.className = 'chat-message ai searching';
            msgDiv.innerHTML = `<span class="search-badge">🔍 بحث إنترنت</span>\n${result}\n\n(المعلومات دي من الإنترنت - مش من ذاكرتي)`;
            document.getElementById('chatHistory').appendChild(msgDiv);
            document.getElementById('chatHistory').scrollTop = document.getElementById('chatHistory').scrollHeight;
            this.learnFromConversation(query, result);
            if (this.speakEnabled) this.speak(result.substring(0, 200));
        } catch (err) {
            this.addChatMessage('❌ البحث فشل! تأكد إنك متصل بالنت.', 'ai');
        }
    }

    // ========== CODE GENERATOR ==========
    generateCode() {
        const lang = document.getElementById('langSelect').value;
        const output = document.getElementById('codeOutput');
        output.classList.remove('hidden');

        const codes = {
            javascript: `// JavaScript - Hello World\nfunction greet(name) {\n    return "Hello, " + name + "!";\n}\nconsole.log(greet("Egypt"));`,
            python: `# Python - Hello World\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("Egypt"))`,
            cpp: `// C++ - Hello World\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, Egypt!" << endl;\n    return 0;\n}`,
            java: `// Java - Hello World\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Egypt!");\n    }\n}`,
            csharp: `// C# - Hello World\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, Egypt!");\n    }\n}`,
            php: `<?php\n// PHP - Hello World\n$name = "Egypt";\necho "Hello, $name!";\n?>`,
            html: `<!DOCTYPE html>\n<html>\n<head>\n    <title>Egypt AI</title>\n</head>\n<body>\n    <h1>Hello, Egypt!</h1>\n</body>\n</html>`,
            sql: `-- SQL - Create Table\nCREATE TABLE users (\n    id INT PRIMARY KEY,\n    name VARCHAR(100),\n    email VARCHAR(100)\n);`,
            react: `// React Component\nimport React from 'react';\n\nfunction EgyptAI() {\n    return <h1>Hello, Egypt!</h1>;\n}\n\nexport default EgyptAI;`,
            flutter: `// Flutter App\nimport 'package:flutter/material.dart';\n\nvoid main() {\n    runApp(MaterialApp(home: Scaffold(\n        body: Center(child: Text('Hello, Egypt!'))\n    )));\n}`,
            nodejs: `// Node.js Server\nconst http = require('http');\n\nhttp.createServer((req, res) => {\n    res.end('Hello, Egypt!');\n}).listen(3000);`,
            typescript: `// TypeScript - Hello World\nfunction greet(name: string): string {\n    return \\`Hello, \\${name}!\\`;\n}\n\nconsole.log(greet("Egypt"));`
        };

        output.textContent = codes[lang] || codes.javascript;
        this.addChatMessage(`💻 كتبتلك كود ${lang}! شوفه فوق 👆`, 'ai');
    }

    generateCodeFromPrompt(prompt) {
        const output = document.getElementById('codeOutput');
        output.classList.remove('hidden');
        const lang = document.getElementById('langSelect').value;

        let code = `// طلبك: ${prompt}\n// لغة: ${lang}\n\n`;
        if (prompt.includes('لعبة') || prompt.includes('game')) {
            code += `// لعبة بسيطة\nfunction startGame() {\n    let score = 0;\n    let level = 1;\n    console.log("Game Started! Level: " + level);\n    // أضف منطق اللعبة هنا\n}`;
        } else if (prompt.includes('موقع') || prompt.includes('website')) {
            code += `<!DOCTYPE html>\n<html dir="rtl" lang="ar">\n<head>\n    <title>موقع مصري</title>\n    <style>body{font-family:'Cairo';background:#1a1a2e;color:#fff;}</style>\n</head>\n<body>\n    <h1>🇪🇬 مرحباً بيك في الموقع المصري!</h1>\n</body>\n</html>`;
        } else if (prompt.includes('حاسبة') || prompt.includes('calculator')) {
            code += `function calculator(a, b, op) {\n    switch(op) {\n        case '+': return a + b;\n        case '-': return a - b;\n        case '*': return a * b;\n        case '/': return b !== 0 ? a / b : 'Error';\n        default: return 'Invalid';\n    }\n}`;
        } else {
            code += `function main() {\n    console.log("Hello from Egyptian AI!");\n    // اكتب كودك هنا\n}\n\nmain();`;
        }

        output.textContent = code;
        this.addChatMessage(`💻 كتبتلك كود ${lang} بناءً على طلبك! شوفه فوق 👆`, 'ai');
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
            islam: 'أحاديث نبوية',
            science: 'اكتشافات علمية',
            business: 'نصائح تجارية'
        };
        const msg = prompts[topic] || topic;
        document.getElementById('chatInput').value = msg;
        this.sendMessage();
    }
}

// Initialize
let ai;
window.addEventListener('DOMContentLoaded', () => {
    ai = new EgyptianAI();
});

// Dev modal
function showDevInfo() { document.getElementById('devModal').classList.remove('hidden'); }
function hideDevInfo() { document.getElementById('devModal').classList.add('hidden'); }
