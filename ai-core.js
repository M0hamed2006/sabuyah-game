// ============================================
// المصري الذكي v12.0 MEGA ELITE - معدل
// متوافق مع index.html
// ============================================

class EgyptianAIMega {
    constructor() {
        // ===== APIs =====
        this.groqApiKey = localStorage.getItem('groq_api_key') || '';
        this.hfToken = localStorage.getItem('hf_token') || '';
        this.groqURL = 'https://api.groq.com/openai/v1/chat/completions';
        this.imageModel = 'black-forest-labs/FLUX.1-dev';
        
        // ===== الإعدادات =====
        this.speakEnabled = true;
        this.deepSearchMode = false;
        this.currentContext = 'general';
        this.mood = 'حنون';
        this.friendshipLevel = 0;
        this.thinkingMessage = null;
        
        // ===== النماذج والذاكرة =====
        this.model = null;
        this.isReady = false;
        this.memory = this.loadMemory();
        this.responseCache = new Map();
        this.shortTermMemory = [];
        this.conversationHistory = [];
        this.knowledgeBase = typeof MEGA_KNOWLEDGE !== 'undefined' ? MEGA_KNOWLEDGE : {};
        
        // ===== الإحصائيات =====
        this.stats = {
            totalMessages: 0,
            groqCalls: 0,
            imageCalls: 0,
            cacheHits: 0,
            successRate: 0
        };
        
        this.init();
    }

    // ==================== إدارة المفاتيح ====================
    setGroqKey(key) {
        if (key && key.startsWith('gsk_')) {
            localStorage.setItem('groq_api_key', key);
            this.groqApiKey = key;
            this.addChatMessage('✅ تم حفظ مفتاح Groq! الآن يمكنك الحصول على ردود ذكية جداً!', 'ai');
            return true;
        }
        this.addChatMessage('❌ المفتاح غير صحيح. يجب أن يبدأ بـ gsk_', 'ai');
        return false;
    }

    setHfToken(token) {
        if (token && token.length > 10) {
            localStorage.setItem('hf_token', token);
            this.hfToken = token;
            this.addChatMessage('✅ تم حفظ توكن Hugging Face! يمكنك الآن رسم الصور!', 'ai');
            return true;
        }
        return false;
    }

    promptForKeys() {
        if (!this.groqApiKey) {
            const key = prompt("🔑 أدخل مفتاح Groq API (مجاني من console.groq.com)\nمثال: gsk_abcd1234...");
            if (key) this.setGroqKey(key);
        }
    }

    // ==================== Groq AI للردود الذكية ====================
    async callGroq(question) {
        if (!this.groqApiKey) return null;
        
        // إزالة رسالة "جاري التفكير" السابقة
        this.removeThinkingMessage();
        
        // إضافة رسالة جديدة
        this.thinkingMessage = this.addTempMessage('⏳ جاري التفكير...', 'ai');
        
        try {
            const systemPrompt = "أنت مساعد ذكي مصري يجيب بالعربية الفصحى والعامية المصرية. تكون طبيعي وودي ومفيد جداً. تستخدم رموز تعبيرية مناسبة. تعطي معلومات دقيقة وسهلة الفهم.";
            
            const messages = this.conversationHistory.slice(-5);
            messages.push({ role: 'user', content: question });
            
            const response = await fetch(this.groqURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.groqApiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages
                    ],
                    temperature: 0.7,
                    max_tokens: 1000,
                    top_p: 0.9
                })
            });

            this.removeThinkingMessage();
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content || null;
            
            if (reply) {
                this.conversationHistory.push({ role: 'user', content: question });
                this.conversationHistory.push({ role: 'assistant', content: reply });
                if (this.conversationHistory.length > 20) {
                    this.conversationHistory = this.conversationHistory.slice(-20);
                }
                this.stats.groqCalls++;
            }
            
            return reply;
        } catch (err) {
            this.removeThinkingMessage();
            console.error('❌ Groq error:', err);
            return null;
        }
    }

    removeThinkingMessage() {
        if (this.thinkingMessage && this.thinkingMessage.parentNode) {
            this.thinkingMessage.remove();
            this.thinkingMessage = null;
        }
    }

    addTempMessage(text, sender) {
        const history = document.getElementById('chatHistory');
        if (!history) return null;
        const div = document.createElement('div');
        div.className = `chat-message ${sender}`;
        div.textContent = text;
        history.appendChild(div);
        history.scrollTop = history.scrollHeight;
        return div;
    }

    // ==================== توليد الصور ====================
    async generateImage(prompt) {
        if (!this.hfToken) {
            const token = prompt("🎨 أدخل Access Token من Hugging Face (مجاني)\n1. سجل في huggingface.co\n2. Settings → Access Tokens\n3. أنشئ token وانسخه");
            if (token) {
                this.setHfToken(token);
                this.generateImage(prompt);
            }
            return;
        }

        this.addChatMessage(`🎨 جاري رسم: "${prompt}"\n⏳ قد يستغرق 15-30 ثانية...`, 'ai');
        
        try {
            const response = await fetch(
                `https://api-inference.huggingface.co/models/${this.imageModel}`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.hfToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ inputs: prompt })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const imageBlob = await response.blob();
            const imageUrl = URL.createObjectURL(imageBlob);
            
            const msgDiv = document.createElement('div');
            msgDiv.className = 'chat-message ai';
            msgDiv.style.textAlign = 'center';
            msgDiv.innerHTML = `
                <div style="margin-bottom: 10px;">
                    <strong>🖼️ صورة من الذكاء الاصطناعي:</strong><br>
                    <em>"${prompt}"</em>
                </div>
                <img src="${imageUrl}" style="max-width: 100%; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
            `;
            
            const history = document.getElementById('chatHistory');
            if (history) {
                history.appendChild(msgDiv);
                history.scrollTop = history.scrollHeight;
            }
            
            this.stats.imageCalls++;
        } catch (err) {
            console.error('❌ Image generation error:', err);
            this.addChatMessage(`❌ فشل توليد الصورة: ${err.message}\nالنموذج قد يكون مشغول. حاول بعد شوية.`, 'ai');
        }
    }

    // ==================== الردود المحلية ====================
    getLocalResponse(message) {
        const lower = message.toLowerCase();
        
        if (this.knowledgeBase) {
            for (let key in this.knowledgeBase) {
                if (lower.includes(key.toLowerCase())) {
                    const data = this.knowledgeBase[key];
                    return data.full || data.short || `معلومات عن ${key}`;
                }
            }
        }
        
        const jokes = {
            'نكتة': "😂 واحد مصري قال: أنا عملت حاجة تاريخية! قال: إيه؟ قال: حفظت رقم الباص!",
            'حكمة': "💡 اللي ياكل وحده يموت وحده — مثل مصري عظيم.",
            'كشري': "🍝 الكشري ملك الأكل! عدس، رز، مكرونة، حمص، بصل محمر، دقة حارة. جنة!",
            'أهرامات': "🏛️ الأهرامات بناها الفراعنة قبل 4500 سنة. عجائب الدنيا الوحيدة المتبقية!",
            'صلاح': "⚽ محمد صلاح الفرعون! نجم ليفربول ومصر، أفضل لاعب في العالم.",
            'فول': "🥘 الفول والطعمية أساس الفطار المصري! صحة وطاقة.",
            'نيل': "🌊 النيل شريان الحياة! أطول نهر في العالم.",
            'حب': "❤️ الحب أجمل شعور في الدنيا. يعطي الحياة معنى.",
            'صبر': "⏳ الصبر مفتاح الفرج. بعد العسر يسر دائماً.",
            'قرآن': "📖 القرآن الكريم كتاب الله الخالد. فيه كل شيء."
        };
        
        for (let key in jokes) {
            if (lower.includes(key)) {
                return jokes[key];
            }
        }
        
        return null;
    }

    // ==================== إرسال الرسالة ====================
    async sendMessage(isDrawing = false) {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.addChatMessage(message, 'user');
        input.value = '';
        this.stats.totalMessages++;
        
        if (isDrawing) {
            await this.generateImage(message);
            return;
        }
        
        let response = null;
        
        if (navigator.onLine && this.groqApiKey) {
            response = await this.callGroq(message);
        }
        
        if (!response) {
            response = this.getLocalResponse(message);
        }
        
        if (!response) {
            if (!navigator.onLine) {
                response = "🌐 أنت غير متصل. اسألني عن 'نكتة'، 'كشري'، 'أهرامات'، أو 'صلاح'.";
            } else if (!this.groqApiKey) {
                response = "🔑 ما في مفتاح Groq. استخدم الردود المحلية. اتصل بالمطور لإضافة المفتاح.";
            } else {
                response = "عذراً، ما حصلت على رد الآن. جرب سؤال آخر.";
            }
        }
        
        this.addChatMessage(response, 'ai');
        this.setCached(message, response);
        
        if (this.speakEnabled && response.length < 400) {
            this.speak(response);
        }
    }

    // ==================== Caching ====================
    getCached(query) {
        const key = this.normalizeKey(query);
        if (this.responseCache.has(key)) {
            this.stats.cacheHits++;
            return this.responseCache.get(key);
        }
        return null;
    }

    setCached(query, response) {
        const key = this.normalizeKey(query);
        if (this.responseCache.size > 100) {
            const firstKey = this.responseCache.keys().next().value;
            this.responseCache.delete(firstKey);
        }
        this.responseCache.set(key, response);
    }

    normalizeKey(str) {
        return str.toLowerCase().trim().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
    }

    // ==================== تحليل الصور ====================
    async analyzeImage() {
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        
        if (!video || !canvas || !this.model) {
            this.addChatMessage('📷 الكاميرا أو النموذج غير متاح.', 'ai');
            return;
        }
        
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        this.showResult('🔍 جاري التحليل...', '');
        
        try {
            const predictions = await this.model.classify(canvas);
            if (predictions.length) {
                const top = predictions[0];
                const confidence = (top.probability * 100).toFixed(1);
                this.showResult(top.className, confidence + '%');
                this.addChatMessage(`📸 أرى: <strong>${top.className}</strong> (دقة ${confidence}%)`, 'ai');
            }
        } catch (e) {
            console.warn('❌ Image analysis error:', e);
            this.showResult('حدث خطأ', '');
        }
    }

    // ==================== مولد الأكواد ====================
    generateCode() {
        const lang = document.getElementById('langSelect')?.value || 'javascript';
        const input = document.getElementById('chatInput')?.value || '';
        
        const templates = {
            javascript: `// ${input || 'مثال JavaScript'}\nconst greeting = "مرحباً من المصري الذكي!";\nconsole.log(greeting);`,
            python: `# ${input || 'مثال Python'}\ngreeting = "مرحباً من المصري الذكي!"\nprint(greeting)`,
            html: `<!DOCTYPE html>\n<html>\n<head><title>${input || 'صفحة'}</title></head>\n<body>\n  <h1>${input || 'مرحبا'}</h1>\n</body>\n</html>`,
            cpp: `#include <iostream>\nusing namespace std;\nint main() {\n  cout << "${input || 'مرحبا'}" << endl;\n  return 0;\n}`,
            react: `import React from 'react';\nconst App = () => {\n  return <h1>${input || 'مرحبا'}</h1>;\n};\nexport default App;`
        };
        
        const code = templates[lang] || templates.javascript;
        const output = document.getElementById('codeOutput');
        
        if (output) {
            output.textContent = code;
            output.classList.remove('hidden');
        }
        
        this.addChatMessage(`💻 كود ${lang} جاهز!`, 'ai');
    }

    // ==================== نطق ====================
    speak(text) {
        if (!this.speakEnabled) return;
        try {
            const cleanText = text.replace(/[🎯📖🎨🔍⏳❌✅]/g, '').trim();
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'ar-EG';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn('Speech error:', e);
        }
    }

    // ==================== واجهة المستخدم ====================
    addChatMessage(text, sender) {
        const history = document.getElementById('chatHistory');
        if (!history) return;
        const div = document.createElement('div');
        div.className = `chat-message ${sender}`;
        div.textContent = text;
        history.appendChild(div);
        history.scrollTop = history.scrollHeight;
    }

    showResult(text, confidence) {
        const resultDiv = document.getElementById('result');
        const textDiv = document.getElementById('resultText');
        const confDiv = document.getElementById('resultConfidence');
        if (resultDiv && textDiv) {
            textDiv.textContent = text;
            if (confDiv) confDiv.textContent = confidence;
            resultDiv.classList.remove('hidden');
        }
    }

    loadMemory() {
        try {
            return JSON.parse(localStorage.getItem('ai_memory') || '{}');
        } catch {
            return {};
        }
    }

    saveMemory() {
        try {
            localStorage.setItem('ai_memory', JSON.stringify(this.memory));
        } catch (e) {
            console.warn('Memory save error:', e);
        }
    }

    askAbout(topic) {
        const prompts = {
            food: 'قولي عن الأكل المصري',
            history: 'تاريخ مصر والفراعنة',
            sports: 'الرياضة المصرية والكورة',
            health: 'نصائح صحية وفوائد غذائية',
            tech: 'البرمجة والتكنولوجيا',
            movies: 'الأفلام والسينما المصرية',
            islam: 'الإسلام والأحاديث النبوية',
            science: 'العلوم والاكتشافات',
            business: 'البيزنس والاستثمار',
            culture: 'الثقافة والأدب والشعر'
        };
        const msg = prompts[topic] || topic;
        const input = document.getElementById('chatInput');
        if (input) {
            input.value = msg;
            this.sendMessage(false);
        }
    }

    // ==================== التهيئة والأزرار ====================
    async init() {
        if (typeof mobilenet !== 'undefined') {
            try {
                this.model = await mobilenet.load();
                console.log('✅ Mobilenet loaded');
            } catch (e) {
                console.warn('⚠️ Mobilenet failed:', e);
            }
        }

        this.promptForKeys();
        this.bindButtons();

        setTimeout(() => {
            this.addChatMessage(
                '🎉 مرحباً في المصري الذكي v12.0! 🎉\n\n' +
                '💬 اسألني أي سؤال (Groq AI)\n' +
                '🎨 اضغط "ارسم" لتوليد صور\n' +
                '📸 استخدم الكاميرا للتعرف\n' +
                '⚡ مولد أكواد + نطق عربي',
                'ai'
            );
        }, 500);

        this.isReady = true;
        console.log('✅ المصري الذكي v12.0 جاهز بكل قوته!');
    }

    bindButtons() {
        document.getElementById('sendBtn')?.addEventListener('click', () => this.sendMessage(false));
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage(false);
        });

        // إنشاء زر الرسم إذا لم يكن موجوداً
        let drawBtn = document.getElementById('drawBtn');
        if (!drawBtn) {
            const wrapper = document.querySelector('.chat-input-wrapper');
            if (wrapper) {
                drawBtn = document.createElement('button');
                drawBtn.id = 'drawBtn';
                drawBtn.className = 'btn-glow';
                drawBtn.innerHTML = '<i class="fas fa-palette"></i> ارسم';
                drawBtn.style.marginLeft = '8px';
                wrapper.appendChild(drawBtn);
            }
        }
        drawBtn?.addEventListener('click', () => this.sendMessage(true));

        document.getElementById('clearChatBtn')?.addEventListener('click', () => {
            const history = document.getElementById('chatHistory');
            if (history) history.innerHTML = '';
            this.addChatMessage('🧹 تم مسح المحادثة.', 'ai');
        });

        document.getElementById('generateCodeBtn')?.addEventListener('click', () => this.generateCode());
        document.getElementById('snapBtn')?.addEventListener('click', () => this.analyzeImage());

        document.getElementById('speakToggleBtn')?.addEventListener('click', (e) => {
            this.speakEnabled = !this.speakEnabled;
            e.target.innerHTML = this.speakEnabled 
                ? '<i class="fas fa-volume-high"></i> النطق: ON' 
                : '<i class="fas fa-volume-xmark"></i> النطق: OFF';
        });

        document.getElementById('deepSearchBtn')?.addEventListener('click', () => {
            this.deepSearchMode = !this.deepSearchMode;
            this.addChatMessage(
                this.deepSearchMode 
                    ? '🔍 وضع البحث العميق مفعل!' 
                    : '🔍 وضع البحث العميق متوقف.',
                'ai'
            );
        });

        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', () => {
                const topic = card.getAttribute('data-topic');
                this.askAbout(topic);
            });
        });
    }

    // ==================== إحصائيات ====================
    getStats() {
        return {
            'إجمالي الرسائل': this.stats.totalMessages,
            'استدعاءات Groq': this.stats.groqCalls,
            'صور تم رسمها': this.stats.imageCalls,
            'Cache Hits': this.stats.cacheHits,
            'حجم الذاكرة': this.conversationHistory.length + ' رسالة',
            'Cache': this.responseCache.size + ' عنصر'
        };
    }
}

window.ai = new EgyptianAIMega();

function showDevInfo() {
    const modal = document.getElementById('devModal');
    if (modal) modal.classList.remove('hidden');
    if (window.ai) console.table(window.ai.getStats());
}

function hideDevInfo() {
    const modal = document.getElementById('devModal');
    if (modal) modal.classList.add('hidden');
}
