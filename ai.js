// ============================================
// المصري الذكي - AI Egypt
// TensorFlow.js + MobileNet
// يشتغل Offline بعد أول تحميل
// ============================================

class EgyptianAI {
    constructor() {
        this.model = null;
        this.chatHistory = [];
        this.isReady = false;
        
        // قاعدة معرفة مصرية
        this.egyptianKnowledge = {
            'كشري': 'كشري هو الأكل المصري الشعبي الأشهر! مكون من: عدس، مكرونة، أرز، حمص، بصل مقلي، وصلصة الطماطم الحارة. أشهر محل: كشري أبو طارق!',
            'طعمية': 'الطعمية (الفلافل) هي فول مدقوق مع بقدونس وكزبرة وثوم، مقلية في زيت ساخن. تتاكل مع عيش بلدي وسلطة طحينة!',
            'فول': 'الفول هو ملك الفطار المصري! فول مدمس مع زيت، ليمون، طماطم، بصل، وكمون. أحلى حاجة في الصبح!',
            'أهرامات': 'أهرامات الجيزة من عجائب الدنيا السبعة! اتبنت من 4500 سنة، والأكبر (خوفو) كان أطول مبنى في العالم لـ 3800 سنة.',
            'تمثال': 'تمثال أبو الهول هو تمثال أسطوري بجسم أسد ورأس فرعون (غالباً خفرع). بيحمي الأهرامات من 2500 ق.م!',
            'نيل': 'نهر النيل أطول نهر في العالم! بيمر بـ 11 دولة، ومصر هي "هدية النيل" زي ما قال هيرودوتس.',
            'توك توك': 'التوك توك هو مواصلات مصر الشعبية! 3 عجلات، بيجري في الزحمة زي السمكة في المية، وسعر الرحلة بيتفاوض عليه!',
            'شبشب': 'الشبشب المصري هو السلاح السري! أمهات مصر بيستخدموه للتربية من 5000 سنة، ولسه فعال!',
            'مصر': 'مصر أم الدنيا! بلد الحضارة والتاريخ، 100 مليون مصري بيتكلموا بالعامية المضحكة، وأحلى ناس في الدنيا.',
            'القاهرة': 'القاهرة عاصمة مصر، أكبر مدينة في أفريقيا والشرق الأوسط! معروفة بالزحمة والكراكيب والحلويات.',
            'إسكندرية': 'إسكندرية عروس البحر المتوسط! مدينة جميلة على البحر، مكتبة إسكندرية الجديدة من أحلى مكتبات العالم.',
            'الأقصر': 'الأقصر مدينة المائة باب! فيها وادي الملوك، معبد الكرنك، وكانت عاصمة مصر القديمة.',
            'صعيد': 'الصعيد هو جنوب مصر، الناس هناك طيبة وقوية، وبيحبوا الفول المدمس جداً!',
            'دلتا': 'الدلتا هي شمال مصر، أرض خصبة، والناس هناك بيتكلموا سريع وبيحبوا السمك.',
            'رمضان': 'رمضان في مصر مختلف! فوانيس، مسحراتي، كنافة وقطايف، والأجواء روحانية حلوة.',
            'عيد': 'العيد في مصر يعني: كحك، بسكويت، لحمة، وعيلة كبيرة تجتمع!',
            'كورة': 'الكورة (كرة القدم) هي ديانة مصرية! الأهلي والزمالك هم الكبار، والدوري المصري من أقوى في أفريقيا.',
            'تامر حسني': 'تامر حسني ملك البوب المصري! بيغني من 2000، وعنده جمهور ضخم في الوطن العربي.',
            'عمرو دياب': 'عمرو دياب (الهضبة) أسطورة الموسيقى المصرية! بيغني من 1983، ولسه شباب!',
            'أم كلثوم': 'أم كلثوم (كوكب الشرق) أعظم مغنية في تاريخ العرب! حفلاتها كانت تستمر 3-4 ساعات.',
            'محمد صلاح': 'محمد صلاح (الفرعون المصري) أسطورة كرة القدم العالمية! لعب لليفربول وفاز بدوري أبطال أوروبا.'
        };
        
        this.jokes = [
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
        
        this.init();
    }

    async init() {
        try {
            console.log('جاري تحميل الذكاء الاصطناعي...');
            
            // تحميل MobileNet للتعرف على الصور
            this.model = await mobilenet.load();
            
            this.isReady = true;
            document.getElementById('loading').classList.add('hidden');
            console.log('✅ AI جاهز!');
            
            this.setupEventListeners();
            this.startCamera();
            
        } catch (error) {
            console.error('❌ Error:', error);
            this.showError('حصل مشكلة في التحميل، جرب تاني!');
        }
    }

    setupEventListeners() {
        // زر التصوير
        document.getElementById('snapBtn')?.addEventListener('click', () => this.analyzeImage());
        
        // رفع صورة
        document.getElementById('uploadBtn')?.addEventListener('click', () => {
            document.getElementById('fileInput')?.click();
        });
        
        document.getElementById('fileInput')?.addEventListener('change', (e) => this.handleUpload(e));
        
        // الشات
        document.getElementById('sendBtn')?.addEventListener('click', () => this.sendMessage());
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
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
            console.log('Camera not available, upload only');
        }
    }

    async analyzeImage() {
        if (!this.isReady) return;
        
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        
        // رسم الفيديو على canvas
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        canvas.classList.add('active');
        
        this.showResult('جاري التحليل... 🔍', '');
        
        try {
            const predictions = await this.model.classify(canvas);
            
            if (predictions && predictions.length > 0) {
                const top = predictions[0];
                const egyptianDesc = this.translateToEgyptian(top.className);
                
                this.showResult(
                    egyptianDesc,
                    `ثقة: ${(top.probability * 100).toFixed(1)}%`
                );
            }
        } catch (err) {
            this.showResult('مش قادر أعرف الصورة دي 😅', 'جرب صورة تانية أوضح');
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
            
            this.showResult('جاري التحليل... 🔍', '');
            
            try {
                const predictions = await this.model.classify(canvas);
                if (predictions && predictions.length > 0) {
                    const top = predictions[0];
                    const egyptianDesc = this.translateToEgyptian(top.className);
                    this.showResult(egyptianDesc, `ثقة: ${(top.probability * 100).toFixed(1)}%`);
                }
            } catch (err) {
                this.showResult('مش قادر أعرف الصورة دي 😅', '');
            }
        };
        img.src = URL.createObjectURL(file);
    }

    translateToEgyptian(englishLabel) {
        const label = englishLabel.toLowerCase();
        
        // ترجمة مصرية ذكية
        const translations = {
            'cat': 'قطة مصرية! زي اللي بتنام على الكشري في الشارع 🐱',
            'dog': 'كلب مصري! غالباً بيتسمى "كلبش" أو "زبيطة" 🐕',
            'person': 'شخص مصري! لو لابس جلباب يبقى صعيدي، لو لابس تيشيرت يبقى من القاهرة 👤',
            'food': 'أكل مصري! يا ترى كشري ولا فول ولا طعمية؟ 🍽️',
            'car': 'عربية مصرية! لو تاكسي يبقى هتتفاوض على الأجرة 🚕',
            'bus': 'أتوبيس مصري! زحمة، حر، وسواق بيتكلم في التليفون 🚌',
            'train': 'مترو مصر! الساعة 8 الصبح = معركة حياة أو موت 🚇',
            'bicycle': 'عجلة مصرية! لو فيها "جرس" يبقى أصلي 🚲',
            'motorcycle': 'موتوسيكل مصري! بيجري في الزحمة زي السمكة 🏍️',
            'boat': 'مركب في النيل! أحلى حاجة في الأقصر وأسوان ⛵',
            'pyramid': 'أهرامات الجيزة! عجائب الدنيا السبعة 🇪🇬',
            'building': 'مبنى مصري! لو قديم يبقى جميل، لو جديد يبقى "عشوائيات" 🏢',
            'phone': 'موبايل مصري! غالباً Infinix أو Tecno، وشاحن "صيني" 📱',
            'book': 'كتاب مصري! لو قديم يبقى "أدب"، لو جديد يبقى "دراسة" 📚',
            'computer': 'كمبيوتر مصري! لو فيه "فوتوشوب" يبقى "جرافيك ديزاينر" 💻',
            'money': 'فلوس مصرية! لو 200 جنيه يبقى "فرحة"، لو خمسة يبقى "كحك العيد" 💵',
            'coffee': 'قهوة مصرية! "أهوة" مع "عسلية" وشوية "هيل" ☕',
            'tea': 'شاي مصري! "شاي بالنعناع" في الأقصر وأسوان 🍵',
            'water': 'مية نيل! الحمد لله عندنا نهر النيل 🌊',
            'bread': 'عيش بلدي! أصل كل حاجة في مصر، من الفول للكشري 🍞',
            'cake': 'كحك أو بسكويت! لو عيد يبقى "عيد سعيد" 🎂',
            'bird': 'طائر مصري! لو "حمام" يبقى على بلكونة حد، لو "بط" يبقى في النيل 🐦',
            'fish': 'سمك مصري! "البلطي" ملك الفراخ، و"السردين" ملك الشتاء 🐟',
            'flower': 'وردة مصرية! لو "ياسمين" يبقى ريحة البيت 🌸',
            'tree': 'شجرة مصرية! "نخلة" = تمر، "موز" = بلحة، "مانجو" = سكة 🌳',
            'sun': 'شمس مصرية! حارة جداً في الصيف، بس الشتاء بتحبها ☀️',
            'moon': 'قمر مصرية! أحلى حاجة في رمضان مع الفانوس 🌙'
        };
        
        // Check for matches
        for (const [key, value] of Object.entries(translations)) {
            if (label.includes(key)) return value;
        }
        
        // Generic response
        return `شايف "${englishLabel}"! يا ترى ده في مصر ولا برة؟ 🤔`;
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message) return;
        
        this.addChatMessage(message, 'user');
        input.value = '';
        
        const response = this.generateResponse(message);
        setTimeout(() => this.addChatMessage(response, 'ai'), 500);
    }

    generateResponse(message) {
        const lower = message.toLowerCase();
        
        // Check knowledge base
        for (const [key, value] of Object.entries(this.egyptianKnowledge)) {
            if (lower.includes(key)) return value;
        }
        
        // Joke request
        if (lower.includes('نكتة') || lower.includes('ضحك') || lower.includes('هزار')) {
            return this.jokes[Math.floor(Math.random() * this.jokes.length)];
        }
        
        // Greetings
        if (lower.includes('سلام') || lower.includes('أهلا') || lower.includes('هلا') || lower.includes('صباح') || lower.includes('مسا')) {
            return 'أهلاً يا فندم! أنا المصري الذكي، اسألني أي حاجة عن مصر أو وريني أي صورة! 🇪🇬';
        }
        
        // How are you
        if (lower.includes('إزيك') || lower.includes('أخبارك') || lower.includes('عامل إيه')) {
            return 'الحمد لله! أنا ذكاء اصطناعي مصري، مش محتاج أكل ولا شرب، بس لو عندي "نيت" كويس بشتغل أحسن! 😄';
        }
        
        // Food questions
        if (lower.includes('أكل') || lower.includes('فطار') || lower.includes('غدا') || lower.includes('عشا')) {
            return 'لو فطار: فول وطعمية وعيش! لو غدا: كشري أو كبدة! لو عشا: سجق أو حواوشي! ومتنساش الشاي بالنعناع بعد الأكل! 🍽️';
        }
        
        // Advice
        if (lower.includes('نصيحة') || lower.includes('إيه رأيك')) {
            return 'نصيحة مصرية: "اللي ياكل وحده يموت وحده!" يعني شارك أهلك وأصحابك، ومتنساش تصلي على النبي! 🙏';
        }
        
        // Money
        if (lower.includes('فلوس') || lower.includes('جنيه') || lower.includes('فقر')) {
            return 'في مصر: "الفلوس مش كل حاجة، بس كل حاجة مش من غير فلوس!" الحل: اشتغل بجد، وفكر برة الصندوق، وربنا يرزق الجميع! 💰';
        }
        
        // Love
        if (lower.includes('حب') || lower.includes('جواز') || lower.includes('مراتي')) {
            return 'الجواز في مصر: "الست الأولى بتبقى حب، التانية بتبقى عقل، التالتة بتبقى... حاجة تانية!" 😂 بس الحب الحقيقي هو اللي بيستحمل "الشبشب"!';
        }
        
        // Technology
        if (lower.includes('برمجة') || lower.includes('كود') || lower.includes('كمبيوتر')) {
            return 'أنا نفسي برمجة! المصريين في البرمجة أقوياء جداً، زي Mohamed Ragab (The Small Programmer) اللي عملني! 💻';
        }
        
        // Default
        const defaults = [
            'مش فاهم قصدك أوي، بس أنا متأكد إنك مصري أصيل! 🇪🇬',
            'سؤال حلو! جرب تسألني عن: كشري، أهرامات، محمد صلاح، أو قولي "نكتة"!',
            'والله يا عم أنا ذكاء اصطناعي لسه بتعلم! بس لو سألتني عن مصر هعرف أجاوبك! 😄',
            'حاسس إنك عايز تتكلم! تفتكر إيه أحلى حاجة في مصر؟',
            'يا ترى لو سألتني "إزاي أعمل كشري؟" هعرف أجاوبك ولا لأ؟ 🤔'
        ];
        
        return defaults[Math.floor(Math.random() * defaults.length)];
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
