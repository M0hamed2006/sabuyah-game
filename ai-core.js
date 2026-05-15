// ============================================
// المصري الذكي - Groq AI Core
// يعمل مع Llama 3.3 (مجاني وسريع)
// ============================================

class EgyptianAI {
    constructor() {
        this.groqApiKey = localStorage.getItem('groq_api_key') || '';
        this.speakEnabled = true;
        this.init();
    }

    // حفظ المفتاح
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
                    messages: [{ role: 'user', content: `أجب بالعربية بشكل طبيعي ومفيد: ${question}` }],
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
        } catch (err) {
            console.error('Groq error:', err);
            return null;
        }
    }

    // ردود يدوية بسيطة في حالة عدم وجود نت
    getLocalResponse(message) {
        const lower = message.toLowerCase();
        if (lower.includes('نكتة')) return "😂 واحد مصري قال لصاحبه: أنا عملت حاجة تاريخية! قال: إيه؟ قال: حفظت رقم الباص!";
        if (lower.includes('كشري')) return "🍝 الكشري ملك الأكل المصري! عدس، رز، مكرونة، حمص، بصل محمر، وصلصة حارة.";
        if (lower.includes('أهرامات')) return "🏛️ الأهرامات في الجيزة، بناها الفراعنة قبل 4500 سنة، عجائب الدنيا السبع.";
        if (lower.includes('صلاح')) return "⚽ محمد صلاح، الفرعون المصري، هداف ليفربول ومنتخب مصر، واحد من أفضل لاعبي العالم.";
        if (lower.includes('شكرا')) return "العفو يا غالي! 🤍 أنا هنا في خدمتك دايماً.";
        if (lower.includes('ازيك')) return "أنا زي الفل! الحمد لله. وإنت عامل إيه؟ 😊";
        return null;
    }

    // إضافة رسالة في الشات
    addChatMessage(text, sender) {
        const history = document.getElementById('chatHistory');
        if (!history) return;
        
        const div = document.createElement('div');
        div.className = `chat-message ${sender}`;
        div.textContent = text;
        history.appendChild(div);
        history.scrollTop = history.scrollHeight;
    }

    // إرسال الرسالة الأساسية
    async sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        if (!message) return;

        this.addChatMessage(message, 'user');
        input.value = '';

        let response = null;

        // إذا كان هناك اتصال بالإنترنت ومفتاح موجود -> استخدم Groq
        if (navigator.onLine && this.groqApiKey) {
            response = await this.callGroq(message);
        }

        // إذا فشل استدعاء Groq -> استخدم الردود المحلية
        if (!response) {
            response = this.getLocalResponse(message);
        }

        // إذا لم يوجد رد نهائي
        if (!response) {
            if (!navigator.onLine) {
                response = "🔌 أنت غير متصل بالإنترنت. أسألني مثلاً عن 'نكتة' أو 'كشري'.";
            } else if (!this.groqApiKey) {
                response = "🔑 لم تقم بإدخال مفتاح Groq API بعد. سأستخدم الردود البسيطة. لو عندك مفتاح، أعد تحميل الصفحة وأدخله.";
            } else {
                response = "عذراً، لم أحصل على رد من الذكاء الاصطناعي الآن. جرب سؤالاً آخر.";
            }
        }

        this.addChatMessage(response, 'ai');
    }

    // بدء تشغيل البوت
    init() {
        // تحديث حالة الاتصال
        const statusSpan = document.getElementById('statusText');
        if (statusSpan) {
            statusSpan.textContent = navigator.onLine ? 'متصل' : 'غير متصل';
        }

        // طلب مفتاح Groq إذا لم يكن موجوداً
        if (!this.groqApiKey) {
            const key = prompt("🔑 أدخل مفتاح Groq API المجاني\n(احصل عليه من console.groq.com)\n\nالمفتاح يبدأ بـ gsk_");
            if (key && key.startsWith('gsk_')) {
                this.setGroqKey(key);
                alert("✅ تم حفظ المفتاح! يمكنك الآن استخدام الذكاء الاصطناعي.");
            } else if (key) {
                alert("❌ المفتاح غير صالح. سأعمل بالردود البسيطة فقط.");
            }
        }

        // ربط أزرار الصفحة
        const sendBtn = document.getElementById('sendBtn');
        const chatInput = document.getElementById('chatInput');
        const clearBtn = document.getElementById('clearBtn');

        if (sendBtn) {
            sendBtn.onclick = () => this.sendMessage();
        }
        if (chatInput) {
            chatInput.onkeypress = (e) => {
                if (e.key === 'Enter') this.sendMessage();
            };
        }
        if (clearBtn) {
            clearBtn.onclick = () => {
                const history = document.getElementById('chatHistory');
                if (history) history.innerHTML = '';
                this.addChatMessage('🧹 تم مسح المحادثة. إسأل أي شيء!', 'ai');
            };
        }

        // رسالة ترحيب
        setTimeout(() => {
            this.addChatMessage('🎉 أهلاً بك في المصري الذكي!\n\nأنا شغال بـ Groq AI (Llama 3.3).\nاسألني أي حاجة: ثقافة، دين، رياضة، تاريخ، أو حتى قول "نكتة"!', 'ai');
        }, 500);

        console.log('✅ المصري الذكي جاهز 100%');
    }
}

// بدء التشغيل فور تحميل الصفحة
window.addEventListener('DOMContentLoaded', () => {
    window.ai = new EgyptianAI();
});
