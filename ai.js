// ============================================
// المصري الذكي v2.0 - THE LEARNING EDITION
// يتعلم منك، يفتكر، يفهم، يتكلم!
// ============================================

class EgyptianAI {
    constructor() {
        this.model = null;
        this.isReady = false;
        this.isSpeaking = false;
        
        // 🧠 الذاكرة الطويلة - يحفظ كل حاجة
        this.memory = this.loadMemory();
        this.conversationHistory = [];
        this.userProfile = this.loadProfile();
        
        // 🎭 شخصية متطورة
        this.mood = 'happy'; // happy, sarcastic, serious, excited
        this.trustLevel = 0; // 0-100, يزيد مع الوقت
        
        // 📚 قاعدة معرفة ضخمة
        this.knowledge = this.buildKnowledge();
        this.jokes = this.buildJokes();
        this.wisdom = this.buildWisdom();
        
        this.init();
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    async init() {
        try {
            this.showLoading('جاري إيقاظ العبقرية المصرية... 🧠');
            
            // تحميل TensorFlow
            this.model = await mobilenet.load();
            
            this.isReady = true;
            this.hideLoading();
            
            this.speak('أهلاً يا فندم! أنا المصري الذكي، جاهز أتعلم منك وأفتكر كل حاجة!');
            this.setupEventListeners();
            this.startCamera();
            
        } catch (error) {
            console.error('Error:', error);
            this.showError('النور قطع يا عم! جرب تاني 😅');
        }
    }

    // ============================================
    // 🧠 MEMORY SYSTEM - يتعلم ويفتكر
    // ============================================

    loadMemory() {
        try {
            const saved = localStorage.getItem('ai_egypt_memory');
            return saved ? JSON.parse(saved) : {
                conversations: [],
                facts: {}, // حقائق تعلمها عن المستخدم
                preferences: {}, // تفضيلات المستخدم
                lastVisit: null,
                visitCount: 0
            };
        } catch {
            return { conversations: [], facts: {}, preferences: {}, lastVisit: null, visitCount: 0 };
        }
    }

    saveMemory() {
        localStorage.setItem('ai_egypt_memory', JSON.stringify(this.memory));
    }

    loadProfile() {
        try {
            return JSON.parse(localStorage.getItem('ai_egypt_profile') || '{}');
        } catch {
            return {};
        }
    }

    saveProfile() {
        localStorage.setItem('ai_egypt_profile', JSON.stringify(this.userProfile));
    }

    learnFromConversation(userMsg, aiResponse) {
        // تعلم حقائق عن المستخدم
        const facts = this.extractFacts(userMsg);
        facts.forEach(fact => {
            this.memory.facts[fact.key] = fact.value;
        });
        
        // تعلم تفضيلات
        if (userMsg.includes('بحب') || userMsg.includes('عجبني') || userMsg.includes('مش بحب')) {
            this.learnPreference(userMsg);
        }
        
        // حفظ المحادثة
        this.memory.conversations.push({
            user: userMsg,
            ai: aiResponse,
            time: Date.now(),
            mood: this.mood
        });
        
        // حفظ آخر 100 محادثة بس
        if (this.memory.conversations.length > 100) {
            this.memory.conversations = this.memory.conversations.slice(-100);
        }
        
        this.memory.lastVisit = Date.now();
        this.memory.visitCount++;
        this.saveMemory();
        
        // زيادة الثقة
        this.trustLevel = Math.min(100, this.trustLevel + 1);
    }

    extractFacts(message) {
        const facts = [];
        const lower = message.toLowerCase();
        
        // استخراج اسم
        const nameMatch = lower.match(/(اسمي|أنا اسمي|ناديني|ممكن تناديني) (\w+)/);
        if (nameMatch) facts.push({ key: 'name', value: nameMatch[2] });
        
        // استخراج عمر
        const ageMatch = lower.match(/(عمري|عندي|سنّي) (\d+)/);
        if (ageMatch) facts.push({ key: 'age', value: parseInt(ageMatch[2]) });
        
        // استخراج مدينة
        const cities = ['القاهرة', 'إسكندرية', 'الأقصر', 'أسوان', 'الصعيد', 'الدلتا', 'طنطا', 'المنصورة', 'بورسعيد', 'الإسماعيلية'];
        cities.forEach(city => {
            if (lower.includes(city.toLowerCase())) facts.push({ key: 'city', value: city });
        });
        
        // استخراج مهنة
        const jobs = ['مبرمج', 'مهندس', 'دكتور', 'محامي', 'معلم', 'طالب', 'صيدلي', 'محاسب', 'مدير', 'فني'];
        jobs.forEach(job => {
            if (lower.includes(job)) facts.push({ key: 'job', value: job });
        });
        
        return facts;
    }

    learnPreference(message) {
        const lower = message.toLowerCase();
        
        // تفضيلات أكل
        const foods = ['كشري', 'فول', 'طعمية', 'كبدة', 'سجق', 'مكرونة', 'بيتزا', 'برجر'];
        foods.forEach(food => {
            if (lower.includes(food)) {
                if (lower.includes('بحب') || lower.includes('عجبني')) {
                    this.memory.preferences[`likes_${food}`] = true;
                } else if (lower.includes('مش بحب') || lower.includes('بكره')) {
                    this.memory.preferences[`likes_${food}`] = false;
                }
            }
        });
        
        // تفضيلات عامة
        if (lower.includes('بحب النكت')) this.memory.preferences.likes_jokes = true;
        if (lower.includes('بحب التاريخ')) this.memory.preferences.likes_history = true;
        if (lower.includes('بحب الرياضة')) this.memory.preferences.likes_sports = true;
    }

    getPersonalizedGreeting() {
        const name = this.memory.facts.name;
        const visitCount = this.memory.visitCount;
        const lastVisit = this.memory.lastVisit;
        
        let greeting = '';
        
        if (visitCount === 0) {
            greeting = 'أهلاً يا غالي! أنا المصري الذكي، أول مرة نشوفك! عايز تتعرف عليّ؟';
        } else if (name) {
            const timeDiff = lastVisit ? Date.now() - lastVisit : 0;
            const hoursDiff = timeDiff / (1000 * 60 * 60);
            
            if (hoursDiff < 1) {
                greeting = `ياهلا ${name}! رجعت تاني بسرعة! مستنيّك 🎉`;
            } else if (hoursDiff < 24) {
                greeting = `صباح الفل يا ${name}! (أو مساها على حسب الوقت 😄)`;
            } else {
                greeting = `ياهلا ${name}! اشتقتلك! إزايك؟`;
            }
        } else {
            greeting = 'أهلاً يا فندم! رجعت تاني! إزايك النهاردة؟';
        }
        
        // إضافة معلومة شخصية
        const city = this.memory.facts.city;
        if (city && Math.random() > 0.7) {
            greeting += ` وإيه أخبار ${city}؟`;
        }
        
        return greeting;
    }

    // ============================================
    // 📚 KNOWLEDGE BASE - يعرف كل حاجة
    // ============================================

    buildKnowledge() {
        return {
            // 🍽️ الأكل المصري
            'كشري': {
                short: 'ملك الأكل المصري! 🍝',
                full: 'كشري هو الأكل الشعبي الأشهر في مصر! مكوناته: عدس بقري، مكرونة (اسباجتي + مكرونة صغيرة)، أرز، حمص، بصل مقلي مقرمش، وصلصة الطماطم الحارة (دقة). أشهر محل: كشري أبو طارق في وسط البلد، وكشري التحرير. السعر: 15-30 جنيه!',
                recipe: '1- سلي العدس والمكرونة والأرز منفصلين. 2- اقلي البصل لحد ما يبقى ذهبي. 3- حط طبقة أرز، طبقة مكرونة، طبقة عدس، رشة حمص، بصل مقلي، ودقة على حسب ذوقك!'
            },
            'فول': {
                short: 'فطار كل مصري! 🥘',
                full: 'الفول المدمس هو فطار مصر الأصيل! بيتعمل من فول مدسوق مع زيت، ليمون، طماطم، بصل، كمون، وشطة. أحلى حاجة: فول بالسجق، فول بالطعمية، أو فول سادة مع عيش بلدي سخن!',
                recipe: '1- ضع الفول في طبق. 2- زود زيت، عصير ليمون، ملح، كمون. 3- هرس lightly عشان يفضل فيه حبات. 4- زود طماطم مقطعة، بصل، شطة!'
            },
            'طعمية': {
                short: 'الفلافل المصرية! 🧆',
                full: 'الطعمية (الفلافل) هي فول مدقوق مع بقدونس، كزبرة، ثوم، كمون، وكركوم. بتتعمل كور صغيرة وتتقلي في زيت ساخن. تتاكل مع عيش بلدي، طحينة، سلطة، ومخلل!',
                recipe: '1- انقع الفول overnight. 2- افرمه مع البقدونس والكزبرة والثوم. 3- زود الكمون والملح. 4- شكل كور صغيرة. 5- اقلي في زيت ساخن لحد ما تبقى ذهبية!'
            },
            'كبدة': {
                short: 'وجبة العمالقة! 🥩',
                full: 'الكبدة المصرية هي كبدة ضاني أو بقري مقطعة صغيرة ومتبلة بثوم، كمون، كزبرة، فلفل أسود، وشطة. بتتقلي بسرعة في زيت ساخن مع بصل. أحلى حاجة: كبدة إسكندراني مع طحينة!',
                recipe: '1- قطع الكبدة صغير. 2- تبلها بثوم، كمون، كزبرة، ملح، فلفل. 3- سخن الزيت جداً. 4- اقلي الكبدة 2-3 دقايق بس! 5- زود بصل مقلي على الوش.'
            },
            'سجق': {
                short: 'السجق المصري الأصيل! 🌭',
                full: 'السجق المصري مختلف عن التركي! هو عبارة about لحمة مفرومة (ضاني أو بقري) متبلة ببهارات خاصة (فلفل حار، ثوم، بهارات سرية). بيتباع في محلات السجق وبيتحمر في الشواية!',
                recipe: '1- اخلط اللحمة المفرومة مع الثوم، الفلفل الحار، الكمون، والبهارات. 2- حطها في علبة سجق أو شكلها أصابع. 3- شوّي أو اقلي. 4- تتاكل مع عيش وطحينة!'
            },
            'كنافة': {
                short: 'حلوى العيد والمناسبات! 🍰',
                full: 'الكنافة المصرية هي عجينة شعرية (كنافة ناعمة أو خشنة) محشية جبنة أو قشدة، ومشربة بشربات سخن. أشهر أنواعها: كنافة بالجبنة (حلوة)، كنافة بالقشدة (حلوة أو مالحة)، كنافة بلدي!',
                recipe: '1- افرد طبقة كنافة في صينية. 2- حط جبنة أو قشدة. 3- غطّي بطبقة تانية. 4- ادخل الفرن لحد ما تتحمر. 5- صبّ الشربات السخن فوراً!'
            },
            
            // 🏛️ التاريخ
            'أهرامات': {
                short: 'عجائب الدنيا السبعة! 🇪🇬',
                full: 'أهرامات الجيزة الثلاثة: خوفو (الأكبر - 146 متر)، خفرع (يبدو الأكبر بسبب موقعه الأعلى)، منكاورع. اتبنت حوالي 2560 ق.م. استخدمت 2.3 مليون حجر، الوزن: 6 مليون طن!',
                facts: [
                    'خوفو كان أطول مبنى في العالم لـ 3800 سنة',
                    'الأحجار من محاجر أسوان (900 كم!)',
                    'المصريين القدماء كانوا يعرفوا الرياضيات المتقدمة',
                    'الأهرامات متجهة تماماً نحو الشمال (خطأ 3 دقائق بس!)'
                ]
            },
            'تمثال': {
                short: 'أبو الهول - حارس الأهرامات! 🦁',
                full: 'تمثال أبو الهول: جسم أسد (طول 73 متر)، رأس فرعون (غالباً خفرع - ارتفاع 20 متر). اتبنى حوالي 2500 ق.م. أنفه اتكسر (مش نابوليون!)، ولسه محدش عارف ليه بالظبط.',
                mystery: 'ليه رأس بشر وجسم أسد؟ = القوة + الذكاء. بيحمي الأهرامات من الشر. العين الواحدة اللي فاضلة (التانية اتكسر خرزها).'
            },
            'توت عنخ': {
                short: 'الملك الذهبي! 👑',
                full: 'توت عنخ آمون: حكم من 1332-1323 ق.م (عمر 9-19 سنة). مشهور بسبب مقبرته اللي اتلقت سليمة 1922. كنزه: 5398 قطعة، أشهرها: القناع الذهبي (11 كجم ذهب!).',
                curse: 'لعنة الفراعنة: 11 شخص ماتوا بعد اكتشاف المقبرة بسنين قليلة. صدفة ولا حقيقة؟ 🤔'
            },
            'كليوباترا': {
                short: 'آخر فراعنة مصر! 👸',
                full: 'كليوباترا السابعة (69-30 ق.م): مش كانت جميلة بالمعنى التقليدي (أنفها كبير شوية)، بس كانت ذكية جداً! عرفت 9 لغات، وكانت أول بطلمة يتكلموا المصري القديم.',
                story: 'اتجوزت يوليوس قيصر (روما)، وبعد موته مارك أنتوني. لما خسرت حرب أكتيوم، انتحرت بأفعى (كوبرا) عشان ما تتأسرش.'
            },
            
            // 🌆 المدن
            'القاهرة': {
                short: 'أم الدنيا! 🌆',
                full: 'القاهرة: عاصمة مصر، أكبر مدينة في أفريقيا والعالم العربي (22 مليون!). معروفة بالزحمة، الكراكيب، الأكل الشعبي، والناس الطيبة. أشهر أماكنها: التحرير، خان الخليلي، الأزهر، الزمالك.',
                nickname: 'القاهرة مش مدينة - هي "دولة"! كل حاجة موجودة: غني وفقير، قديم وجديد، هدوء وصخب.'
            },
            'إسكندرية': {
                short: 'عروس البحر المتوسط! 🌊',
                full: 'إسكندرية: تاني أكبر مدينة في مصر (5 مليون). اتأسست 331 ق.م على إيد الإسكندر الأكبر. مكتبة إسكندرية القديمة كانت أكبر مكتبة في العالم القديم!',
                vibes: 'هوا بحر، كورنيش، سمك، كفيهات قديمة، وناس بتحب القراءة. "إسكندراني" = مثقف، فنان، وشوية عنيد 😄'
            },
            'الأقصر': {
                short: 'مدينة المائة باب! 🏛️',
                full: 'الأقصر: أعظم مجموعة معابد في العالم! معبد الكرنك (أكبر معبد في العالم)، وادي الملوك (63 مقبرة فرعونية)، معبد حتشبسوت، وتمثالي ممنون.',
                magic: 'الأقصر مش بس تاريخ - هي "سحر"! كل حاجة فيها قديمة وجميلة. "اللي ما زارش الأقصر، ما زارش مصر!"'
            },
            
            // 🎵 الفن
            'أم كلثوم': {
                short: 'كوكب الشرق! 🎤',
                full: 'أم كلثوم (1898-1975): أعظم مغنية عربية في التاريخ! حفلاتها كانت 3-4 ساعات، والناس يقفوا يصفقوا 10 دقايق بعد كل أغنية. أشهر أغانيها: الأطلال، أمل حياتي، فكروني.',
                legacy: 'لسه لحد النهاردة، صوتها بيخلّي الناس تبكي. "الست" مش مجرد مغنية - هي ظاهرة ثقافية.'
            },
            'عمرو دياب': {
                short: 'الهضبة! 🕺',
                full: 'عمرو دياب (1961-): ملك البوب المصري من 1983! ألبوماته: نور العين (1996)، تملي معاك (2000)، أحلى وأحلى (2016). أشهر أغانيه: تملي معاك، ولا على باله، نور العين.',
                style: 'الهضبة = أناقة، شباب دائم، وموسيقى بتخلّيك ترقص! لسه بيغني وبيملأ استادات في عمر 60+'
            },
            
            // ⚽ الرياضة
            'محمد صلاح': {
                short: 'الفرعون المصري! ⚽',
                full: 'محمد صلاح (1992-): أسطورة كرة القدم العالمية! لعب لليفربول من 2017، فاز: دوري أبطال أوروبا 2019، الدوري الإنجليزي 2020، كأس العالم للأندية 2019. أهدافه: 200+ مع ليفربول.',
                impact: 'صلاح مش بس لاعب - هو "ظاهرة"! بيخلي العالم يحب مصر، وبيتبرع بملايين لبلده. "مو صلاح" = فخر كل مصري.'
            },
            'الأهلي': {
                short: 'نادي القرن! 🔴',
                full: 'النادي الأهلي (1907): أكثر نادي في العالم فوزاً بالبطولات (140+ بطولة)! دوري أبطال أفريقيا: 10 مرات. كأس العالم للأندية: 4 مرات (أحسن نتيجة: رابع العالم 2005، 2012، 2020، 2021).',
                fans: 'جماهير الأهلي = "الأولتراس" الأقوى في أفريقيا. "الأهلي مش نادي - هي دولة!"'
            },
            'الزمالك': {
                short: 'نادي القرن الحقيقي! ⚪',
                full: 'نادي الزمالك (1911): تاني أكبر نادي في مصر (70+ بطولة). دوري أبطال أفريقيا: 5 مرات. كأس السوبر الأفريقي: 4 مرات. أشهر لاعبيه: حازم إمام، أحمد حسن، شيكابالا.',
                rivalry: 'مباراة الأهلي vs الزمالك = "الماتش"! مش بس كورة - هي حرب أهلية بس بدون سلاح 😂'
            },
            
            // 🎉 الثقافة
            'رمضان': {
                short: 'شهر الخير والفوانيس! 🌙',
                full: 'رمضان في مصر مختلف! فوانيس ملونة، مسحراتي بيدق الطبلة، كنافة وقطايف، برامج تلفزيون خاصة، وصلاة التراويح في الأزهر. الإفطار: تمر، عصير، شوربة، سمبوسك، وبعدها الأكل الجامد!',
                traditions: [
                    'الفانوس: رمضان كريم!',
                    'المسحراتي: "يا نايم وحّد الديّا"',
                    'المدفع: إفطار يا ولاد!',
                    'العمدة: زينة الشوارع'
                ]
            },
            'عيد': {
                short: 'فرحة العيد! 🎉',
                full: 'العيد في مصر = كحك وبسكويت ولحمة! العيد الكبير (الأضحى): لحمة مشوية، كبسة، وعيلة كبيرة. العيد الصغير (الفطر): كحك العيد، بسكويت، ملابس جديدة، وعيدية للولاد!',
                money: 'العيدية = فلوس بتوزع للولاد. "يا عيد يا عيد، يا عيدية!" 😄'
            },
            
            // 🗣️ المصريات
            'شبشب': {
                short: 'السلاح السري! 👡',
                full: 'الشبشب المصري هو أداة تربية متعددة الاستخدامات! أم مصرية تقدر ترميه بـ 100 متر وتجيب هدفها بدقة. استخداماته: تربية، دفاع عن النفس، قتل ناموس، و"تنبيه" الجيران!',
                types: 'شبشب بلاستيك (العادي)، شبشب جلد (الفاخر)، شبشب "كعب" (للسيدات)، شبشب "صندل" (للصيف).'
            },
            'توك توك': {
                short: 'مواصلات مصر الشعبية! 🛺',
                full: 'التوك توك: 3 عجلات، مكينة صينية، بيجري في الزحمة زي السمكة! السعر: يتفاوض (مش ثابت). الأغنية: "توك توك يا حبيبي توك توك!"',
                culture: 'التوك توك = حياة! فيه "توك توك" بـ AC، بـ سماعات، وبـ "ديكور" داخلي. السواق بيتكلم في التليفون، يدخّن، ويسوق بإيد واحدة!'
            },
            'دربكة': {
                short: 'إيقاع مصر النابض! 🥁',
                full: 'الدربكة هي الطبلة المصريّة المعدنية! أنواعها: دربكة مصري (الأصلية)، دف، رق، بندير. بتستخدم في: الحنة، الأفراح، الصوفية، والمهرجانات.',
                rhythm: 'إيقاعات مصرية: مكسوم (4/4)، سماعي (10/8)، أيوب (2/4)، مقسوم (8/4). كل إيقاع له "حالة"!'
            },
            'بصرة': {
                short: 'النظرة المصرية! 👁️',
                full: 'البصرة = نظرة مصرية بتقول كل حاجة من غير كلام! أنواعها: بصرة "استغراب" (إزاي؟)، بصرة "تحذير" (خلي بالك!)، بصرة "إهانة" (يا ابن الـ...)، بصرة "حب" (يا حبيبي!).',
                power: 'البصرة المصرية أقوى من أي كلمة! أم بتقدر "تقتل" ببصرة، وبتقدر "تحيي" ببصرة.'
            },
            
            // 💰 الاقتصاد
            'فلوس': {
                short: 'الجنيه المصري! 💵',
                full: 'الجنيه المصري: عملتنا من 1834. دلوقتي فيه: 1، 5، 10، 20، 50، 100، 200 جنيه. الـ 200 بقى نادر! "الفلوس مش كل حاجة، بس كل حاجة مش من غير فلوس!"',
                tip: 'نصيحة مصرية: "احفظ قرشك الأبيض ليومك الأسود!"'
            },
            'تجارة': {
                short: 'الفن المصري! 🤝',
                full: 'التجارة في مصر = فن! "السعر" مش ثابت - هو "نقطة بداية للمفاوضات"! خطوات: 1- يسأل السعر. 2- يتنهد. 3- يقول "غالي!" 4- يمشي. 5- البياع ينادي "تعالى تعالى!" 6- يتفقوا على السعر الحقيقي.',
                wisdom: 'حكمة مصرية: "اللي ما يعرفش يشتري، يقول الغالي!"'
            }
        };
    }

    buildJokes() {
        return [
            'مصري دخل محل قال للبياع: "عندك حاجة حلوة؟" قال له: "آه، الجواز!"',
            'مصري سأل صاحبه: "إيه الفرق بين السرير والكرسي؟" قال له: "السرير بياخدك في حضنه، والكرسي بيخليك تقف على رجليك!"',
            'مصري راح الدكتور قال له: "يا دكتور أنا بشوف ضعف!" قال له: "خلاص متجيش تاني!"',
            'أم مصرية قالت لابنها: "يا ابني روح جيب لحمة!" راح جاب شبشب!',
            'مصري اتجوز 4 مرات، ليه؟ عشان يجرب "الأربع فصول"!',
            'مصري دخل مطعم قال: "عندكم فول؟" قالوا: "خلص!" قال: "طيب عندكم طعمية؟" قالوا: "خلصت!" قال: "يبقى حطولي فول!"',
            'مصري سافر أمريكا، سألوه: "How are you?" قال: "I am fine, but my country is not fine!"',
            'مصري اشترى تكييف، لقى الكهربا قطعت، راح رماه وقعد يتبرد بالشبشب!',
            'أم مصرية لما ابنها يروح المدرسة: "يا ابني خد بالك من نفسك!" لما يروح الجامعة: "يا ابني خد بالك من بنات!"',
            'مصري اتخانق مع مراته، قالت له: "أنا هسيب البيت!" قال لها: "ماشي، بس سيبي الفلوس!"',
            'مصري راح السينما، لقى المقعد الوحيد فاضي جنب واحدة، قعد جنبها. قالت له: "عندك جرأة!" قال لها: "لا، عندي تذكرة!"',
            'مصري سرق بنك، المدير قال له: "إزاي سرقتنا؟" قال له: "بالصبر والتفاني!"',
            'مصري سأل تاني: "إزاي تبقى غني؟" قال له: "اتجوز بنت غنية!"',
            'مصري دخل عزا، لقى الكرسي الوحيد فاضي جنب العزيزة، قعد. قالت له: "إنت جريء!" قال: "لا، أنا تعبان!"',
            'مصري راح المطار، سألوه: "معاك حاجة ت declare؟" قال: "آه، معايا فخر إني مصري!"'
        ];
    }

    buildWisdom() {
        return [
            'اللي ياكل وحده يموت وحده!',
            'اللي بيته من إزاز ما يرميش الناس بالطوب!',
            'الجايزة من الشباك ولا العمارة كلها!',
            'اللي يخاف من العفريت يلاقيه!',
            'الصبر مفتاح الفرج!',
            'اللي بيته على الدقان ما يخافش من الحر!',
            'اللي ما يعرفش يشتري يقول الغالي!',
            'الكلام من فضة والسكوت من ذهب!',
            'اللي بيدور على العدالة يدور على الستين!',
            'الغالي ثمنه فيه!',
            'اللي بيحفر حفرة لأخوه يقع فيها!',
            'الناس لبعض!',
            'اللي ما عندوش قديم يشتري جديد!',
            'العقل زينة!',
            'اللي بيته مقصوم يقدر يحكم على الناس!'
        ];
    }

    // ============================================
    // 🎙️ TEXT TO SPEECH - يتكلم!
    // ============================================

    speak(text) {
        if ('speechSynthesis' in window) {
            // إلغاء أي كلام سابق
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            
            // محاولة إيجاد صوت عربي
            const voices = window.speechSynthesis.getVoices();
            const arabicVoice = voices.find(v => v.lang.includes('ar'));
            
            if (arabicVoice) {
                utterance.voice = arabicVoice;
            }
            
            utterance.lang = 'ar-EG';
            utterance.rate = 1;
            utterance.pitch = 1.1; // أعلى شوية = أكثر حيوية
            
            utterance.onstart = () => {
                this.isSpeaking = true;
                document.body.classList.add('ai-speaking');
            };
            
            utterance.onend = () => {
                this.isSpeaking = false;
                document.body.classList.remove('ai-speaking');
            };
            
            window.speechSynthesis.speak(utterance);
        }
    }

    // ============================================
    // 🧠 SMART RESPONSE - الرد الذكي
    // ============================================

    generateResponse(message) {
        const lower = message.toLowerCase().trim();
        
        // تحديث المزاج
        this.updateMood(lower);
        
        // 1. تحيات شخصية (بناءً على الذاكرة)
        if (this.isGreeting(lower)) {
            return this.getPersonalizedGreeting();
        }
        
        // 2. سؤال عن نفسه
        if (lower.includes('اسمك') || lower.includes('مين') || lower.includes('إنت مين')) {
            const name = this.memory.facts.name;
            if (name) {
                return `أنا المصري الذكي! وإنت ${name} صاحبي اللي بعرفه من ${this.memory.visitCount} محادثة! 😄`;
            }
            return 'أنا المصري الذكي! أول ذكاء اصطناعي مصري يتعلم ويفتكر. إنت مين يا غالي؟';
        }
        
        // 3. طلب نكتة
        if (lower.includes('نكتة') || lower.includes('ضحك') || lower.includes('هزار') || lower.includes('تنكّت')) {
            return this.getJoke();
        }
        
        // 4. طلب حكمة
        if (lower.includes('حكمة') || lower.includes('نصيحة') || lower.includes('قولي حاجة') || lower.includes('عظة')) {
            return this.getWisdom();
        }
        
        // 5. بحث في المعرفة
        const knowledge = this.searchKnowledge(lower);
        if (knowledge) {
            return this.formatKnowledge(knowledge, lower);
        }
        
        // 6. تعلم اسم المستخدم
        if (lower.includes('اسمي') || lower.includes('أنا اسمي')) {
            const extracted = this.extractFacts(message);
            if (extracted.length > 0) {
                this.saveMemory();
                return `حفظت! من النهاردة هناديك ${extracted[0].value}! يا هلا يا ${extracted[0].value}! 🎉`;
            }
        }
        
        // 7. سؤال عن الذاكرة
        if (lower.includes('افتكر') || lower.includes('عرفتني') || lower.includes('إحنا اتكلمنا')) {
            return this.recallMemory();
        }
        
        // 8. مشاعر
        if (this.hasEmotion(lower)) {
            return this.respondToEmotion(lower);
        }
        
        // 9. سؤال عام
        if (lower.includes('؟') || lower.includes('ازاي') || lower.includes('ايه') || lower.includes('ليه') || lower.includes('في')) {
            return this.answerQuestion(lower);
        }
        
        // 10. ردود افتراضية ذكية
        return this.getSmartDefault(lower);
    }

    isGreeting(text) {
        const greetings = ['سلام', 'أهلا', 'هلا', 'صباح', 'مسا', 'مرحبا', 'هاي', 'هلا', 'ياهلا', 'السلام'];
        return greetings.some(g => text.includes(g));
    }

    updateMood(text) {
        if (text.includes('حلو') || text.includes('جميل') || text.includes('شكرا') || text.includes('❤️')) {
            this.mood = 'happy';
        } else if (text.includes('زعلان') || text.includes('مش كويس') || text.includes('تعبان')) {
            this.mood = 'serious';
        } else if (text.includes('نكتة') || text.includes('هزار') || text.includes('😂')) {
            this.mood = 'excited';
        } else if (text.includes('؟') || text.includes('ليه') || text.includes('ازاي')) {
            this.mood = 'curious';
        }
    }

    getJoke() {
        // يختار نكتة مختلفة عن اللي قالها قبل كده
        const recentJokes = this.memory.conversations
            .slice(-5)
            .map(c => c.ai)
            .filter(a => this.jokes.some(j => a.includes(j.substring(0, 20))));
        
        let availableJokes = this.jokes.filter(j => 
            !recentJokes.some(r => r.includes(j.substring(0, 20)))
        );
        
        if (availableJokes.length === 0) availableJokes = this.jokes;
        
        const joke = availableJokes[Math.floor(Math.random() * availableJokes.length)];
        
        if (this.mood === 'excited') {
            return `😂😂😂 يا سلام! دي هتموتك ضحك:\n\n${joke}\n\nتاني ولا كفاية؟`;
        }
        return `حاضر يا فندم! 😄\n\n${joke}\n\nعايز تاني؟`;
    }

    getWisdom() {
        const wisdom = this.wisdom[Math.floor(Math.random() * this.wisdom.length)];
        
        if (this.memory.visitCount > 5) {
            return `حكمة مصرية من زمان جدك اللي رحمه:\n\n"${wisdom}"\n\nوأنا بقولك كمان: "اللي بيتعلم من غلطاته بيبقى ذكي، واللي بيتعلم من غلطات غيره بيبقى أذكى!"`;
        }
        return `حكمة مصرية أصيلة:\n\n"${wisdom}"\n\nمتنسهاش!`;
    }

    searchKnowledge(query) {
        // بحث ذكي
        const keys = Object.keys(this.knowledge);
        
        // بحث exact
        for (const key of keys) {
            if (query.includes(key.toLowerCase())) {
                return { key, data: this.knowledge[key] };
            }
        }
        
        // بحث partial
        for (const key of keys) {
            const keyWords = key.split('');
            const matchCount = keyWords.filter(kw => query.includes(kw)).length;
            if (matchCount >= key.length * 0.5) {
                return { key, data: this.knowledge[key] };
            }
        }
        
        return null;
    }

    formatKnowledge(result, query) {
        const { key, data } = result;
        
        // يختار الرد بناءً على نوع السؤال
        if (query.includes('عمل') || query.includes('إزاي') || query.includes('طريقة')) {
            if (data.recipe) {
                return `🍳 طريقة عمل ${key}:\n\n${data.recipe}\n\nبالهنا والشفا!`;
            }
        }
        
        if (query.includes('حقيقة') || query.includes('معلومة') || query.includes('عرفني')) {
            if (data.facts) {
                const fact = data.facts[Math.floor(Math.random() * data.facts.length)];
                return `🤓 معلومة عن ${key}:\n\n${fact}\n\nعايز تعرف أكتر؟`;
            }
        }
        
        // رد افتراضي
        let response = `${data.short}\n\n${data.full}`;
        
        if (data.mystery) {
            response += `\n\n❓ لغز: ${data.mystery}`;
        }
        
        if (data.traditions) {
            const tradition = data.traditions[Math.floor(Math.random() * data.traditions.length)];
            response += `\n\n🎉 تقليد: ${tradition}`;
        }
        
        if (data.vibes) {
            response += `\n\n✨ فيبز: ${data.vibes}`;
        }
        
        return response;
    }

    recallMemory() {
        const facts = Object.entries(this.memory.facts);
        if (facts.length === 0) {
            return 'لسه متعرفناش كويس! قولي اسمك وإنت منين وبحب إيه، وهفتكر كل حاجة! 🧠';
        }
        
        let memory = 'أنا فاكرك كويس! 😄\n\n';
        facts.forEach(([key, value]) => {
            const labels = {
                name: 'اسمك',
                age: 'عمرك',
                city: 'مدينتك',
                job: 'شغلك'
            };
            memory += `• ${labels[key] || key}: ${value}\n`;
        });
        
        if (Object.keys(this.memory.preferences).length > 0) {
            memory += '\nوبعرف إنك:\n';
            Object.entries(this.memory.preferences).forEach(([key, value]) => {
                if (value) memory += `• بتحب ${key.replace('likes_', '')} ❤️\n`;
            });
        }
        
        memory += `\nاتكلمنا ${this.memory.visitCount} مرة! صحبية قوي 😄`;
        
        return memory;
    }

    hasEmotion(text) {
        const emotions = ['زعلان', 'فرحان', 'مبسوط', 'مضايق', 'متضايق', 'عصبي', 'هادي', 'خايف', 'مش متطمن', 'حزين', 'سعيد'];
        return emotions.some(e => text.includes(e));
    }

    respondToEmotion(text) {
        if (text.includes('زعلان') || text.includes('مضايق') || text.includes('حزين')) {
            const name = this.memory.facts.name || 'يا غالي';
            return `${name}، متزعلش! في مصر بنقول "اللي جاي أحسن!" خد نفس عميق، وافتكر إن ربنا كريم. ولو عايز نكتة تضحكك، قولي! 🤗`;
        }
        
        if (text.includes('فرحان') || text.includes('مبسوط') || text.includes('سعيد')) {
            return `🎉🎉🎉 يا سلام! الفرحة تجمعنا! في مصر بنقول "اللي يفرح لغيره يفرح الله له!" شارك فرحتك مع صحابك!`;
        }
        
        if (text.includes('عصبي') || text.includes('متعصب')) {
            return `هدي أعصابك يا فندم! خد شاي بالنعناع، وافتكر إن "الصبر مفتاح الفرج!" ولو محتاج تتكلم، أنا هنا! ☕`;
        }
        
        return 'حاسس بيك! في مصر بنقول "الناس لبعض!" إنت مش لوحدك! 💪';
    }

    answerQuestion(query) {
        // أسئلة شائعة
        if (query.includes('وقت') || query.includes('ساعة') || query.includes('النهاردة')) {
            const now = new Date();
            const hours = now.getHours();
            let greeting = '';
            
            if (hours < 12) greeting = 'صباح الخير';
            else if (hours < 17) greeting = 'مسا النور';
            else if (hours < 21) greeting = 'مسا الخير';
            else greeting = 'تصبح على خير';
            
            return `${greeting}! دلوقتي الساعة ${hours}:${now.getMinutes().toString().padStart(2, '0')}.\n\nفي مصر: ${hours < 12 ? 'الفطار وقت' : hours < 15 ? 'الغدا وقت' : 'العشا وقت'}! 🍽️`;
        }
        
        if (query.includes('طقس') || query.includes('حرارة') || query.includes('جو')) {
            return 'أنا مش متصل بالطقس live، بس في مصر:\n\n• الصيف: حرارة + رطوبة = "تبخير" 😅\n• الشتاء: برد + رطوبة = "تجميد" 🥶\n• الربيع: أحلى وقت! 🌸\n\nنصيحة: لبس قطن في الصيف، واستحم بالمية الدافية في الشتاء!';
        }
        
        if (query.includes('عمل') || query.includes('شغل') || query.includes('فلوس')) {
            return 'نصيحة مصرية للشغل:\n\n1. "احفظ قرشك الأبيض ليومك الأسود"\n2. "اللي ما يعرفش يشتري يقول الغالي"\n3. "الغالي ثمنه فيه"\n4. "الكداب مش بعيد عن السارق"\n\nالشغل الحلال = بركة! 💰';
        }
        
        if (query.includes('صحة') || query.includes('صحي') || query.includes('رجيم')) {
            return 'صحة مصرية:\n\n• فطار: فول + طعمية + عيش = طاقة!\n• غدا: كشري = سعادة!\n• عشا: خفيف = نوم هادي!\n• رياضة: مشي في الكورنيش = صحة + فيبز!\n• مية: اشرب كتير (النيل موجود!)\n\nمتنساش: "اللي بيته من إزاز ما يرميش الناس بالطوب!" = خليك نظيف! 😄';
        }
        
        // رد افتراضي ذكي
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
        
        // يختار رد مختلف عن اللي قاله قبل كده
        const recentResponses = this.memory.conversations.slice(-3).map(c => c.ai);
        let available = defaults.filter(d => !recentResponses.some(r => r.includes(d.substring(0, 20))));
        
        if (available.length === 0) available = defaults;
        
        return available[Math.floor(Math.random() * available.length)];
    }

    // ============================================
    // 📸 IMAGE RECOGNITION - التعرف على الصور
    // ============================================

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
                
                this.showResult(
                    egyptian,
                    `ثقة: ${(top.probability * 100).toFixed(1)}%`
                );
                
                // يتكلم!
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
            canvas.width = img.width;
            canvas.height = img.height;
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
        
        const translations = {
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
        
        for (const [key, value] of Object.entries(translations)) {
            if (label.includes(key)) return value;
        }
        
        return `🔍 شايف "${english}"! يا ترى ده في مصر ولا برة؟`;
    }

    // ============================================
    // UI HELPERS
    // ============================================

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
        
        // زر الصوت
        document.getElementById('voiceBtn')?.addEventListener('click', () => {
            if (this.isSpeaking) {
                window.speechSynthesis.cancel();
                this.isSpeaking = false;
            }
        });
    }

    async startCamera() {
        try {
            const video = document.getElementById('video');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            video.srcObject = stream;
            video.classList.add('active');
        } catch (err) {
            console.log('Camera not available');
        }
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message) return;
        
        this.addChatMessage(message, 'user');
        input.value = '';
        
        const response = this.generateResponse(message);
        
        setTimeout(() => {
            this.addChatMessage(response, 'ai');
            this.learnFromConversation(message, response);
            
            // يتكلم لو الرسالة مش طويلة
            if (response.length < 200) {
                this.speak(response);
            }
        }, 500 + Math.random() * 500); // تأخير طبيعي
    }

    addChatMessage(text, sender) {
        const history = document.getElementById('chatHistory');
        const div = document.createElement('div');
        div.className = `chat-message ${sender}`;
        div.textContent = text;
        history.appendChild(div);
        history.scrollTop = history.scrollHeight;
    }

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
}

// Initialize
const ai = new EgyptianAI();
