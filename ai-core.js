// ============================================
// المصري الذكي - Groq Edition v2.0
// متوافق مع index.html الحالي
// ============================================

class EgyptianAI {
    constructor() {
        this.groqApiKey = localStorage.getItem('groq_api_key') || '';
        this.speakEnabled = true;
        this.memory = this.loadMemory();
        
        // عناصر DOM (نفس اللي في index.html)
        this.dom = {
            chatHistory: document.getElementById('chatHistory'),
            chatInput: document.getElementById('chatInput'),
            sendBtn: document.getElementById('sendBtn')
        };
        
        this.init();
    }

    // تخزين مفتاح Groq
    setGroqKey(key) {
        if (key && key.startsWith('gsk_')) {
            localStorage.setItem('groq_api_key', key);
            this.groqApiKey = key;
            return true;
        }
        return false;
    }

    // الاتصال بـ Groq API
    async callGroq(question) {
        if (!this.groqApiKey) return null;
        
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.groqApiKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'user', content: `أجب بالعربية: ${question}` }],
                    temperature: 0.7,
                    max_tokens: 800
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'فشل الطلب');
            }
            
            const data = await response.json();
            return data.choices[0]?.message?.content || null;
        } catch(err) {
            console.error('Groq error:', err);
            return null;
        }
    }

    // الردود المحلية (بدون نت أو لو فشل الـ API)
    getLocalResponse(message) {
        const lower = message.toLowerCase();
        if (lower.includes('نكتة')) return "😂 واحد مصري قال لصاحبه: أنا عملت حاجة تاريخية! قال: إيه؟ قال: حفظت رقم الباص!";
        if (lower.includes('حكمة')) return "💡 اللي ياكل وحده يموت وحده — مثل مصري قديم.";
        if (lower.includes('كشري')) return "🍝 الكشري ملك الأكل المصري! عدس، رز، مكرونة، حمص، بصل محمر، وصلصة حارة.";
        if (lower.includes('أهرامات')) return "🏛️ الأهرامات في الجيزة، بناها الفراعنة من 4500 سنة، عجائب الدنيا السبع!";
        if (lower.includes('صلاح')) return "⚽ محمد صلاح، الفرعون المصري، نجم ليفربول ومنتخب مصر، واحد من أفضل لاعبي العالم.";
        return null;
    }

    // إرسال الرسالة (القلب الرئيسي)
    async sendMessage() {
        if (!this.dom.chatInput) return;
        const message = this.dom.chatInput.value.trim();
        if (!message) return;
        
        this.addChatMessage(message, 'user');
        this.dom.chatInput.value = '';
        
        let response = null;
        
        // لو النت شغال والمفتاح موجود، استخدم Groq
        if (navigator.onLine && this.groqApiKey) {
            response = await this.callGroq(message);
        }
        
        // لو فشل Groq أو مفيش نت، استخدم الردود المحلية
        if (!response) {
            response = this.getLocalResponse(message);
        }
        
        // لو لسه مفيش رد، ارد برد عام
        if (!response) {
            if (!navigator.onLine) {
                response = "🌐 أنت غير متصل بالإنترنت. اسألني عن 'نكتة' أو 'كشري' أو 'أهرامات'.";
            } else if (!this.groqApiKey) {
                response = "🔑 مفتاح Groq API غير موجود. هات مفتاح من console.groq.com واحفظه.";
            } else {
                response = "عذراً، لم أستطع الرد الآن. جرب تسأل حاجة تانية.";
            }
        }
        
        this.addChatMessage(response, 'ai');
        if (this.speakEnabled) this.speak(response);
    }

    // إضافة رسالة للشات
    addChatMessage(text, sender) {
        if (!this.dom.chatHistory) return;
        const div = document.createElement('div');
        div.className = `chat-message ${sender}`;
        div.textContent = text;
        this.dom.chatHistory.appendChild(div);
        this.dom.chatHistory.scrollTop = this.dom.chatHistory.scrollHeight;
    }

    // النطق
    speak(text) {
        if (!this.speakEnabled || !window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-EG';
        window.speechSynthesis.speak(utterance);
    }

    // تحميل الذاكرة
    loadMemory() {
        try {
            return JSON.parse(localStorage.getItem('ai_memory') || '{}');
        } catch {
            return {};
        }
    }

    // تهيئة AI وطلب المفتاح
    init() {
        // لو مفيش مفتاح، اطلب منه
        if (!this.groqApiKey) {
            const key = prompt("🔑 أدخل مفتاح Groq API المجاني\n(احصل عليه من console.groq.com)");
            if (key && key.startsWith('gsk_')) {
                this.setGroqKey(key);
                alert("✅ تم حفظ المفتاح! إسأل أي حاجة.");
            } else {
                alert("⚠️ المفتاح غير صالح. هترد عليك من المعلومات المحلية بس.");
            }
        }
        
        // ربط الأزرار
        if (this.dom.sendBtn) {
            this.dom.sendBtn.onclick = () => this.sendMessage();
        }
        if (this.dom.chatInput) {
            this.dom.chatInput.onkeypress = (e) => {
                if (e.key === 'Enter') this.sendMessage();
            };
        }
        
        console.log('✅ المصري الذكي شغال بـ Groq!');
    }
}

// بدء التشغيل
window.ai = new EgyptianAI();

// دوال المطور (متوافقة مع index.html)
function showDevInfo() {
    const modal = document.getElementById('devModal');
    if (modal) modal.classList.remove('hidden');
    if (window.ai) console.log('AI Stats:', window.ai.memory);
}
function hideDevInfo() {
    const modal = document.getElementById('devModal');
    if (modal) modal.classList.add('hidden');
}
