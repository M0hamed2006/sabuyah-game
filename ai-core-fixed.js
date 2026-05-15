// ==================== المصري الذكي - نسخة مبسطة وموثوقة ====================
class SimpleAI {
    constructor() {
        this.groqKey = localStorage.getItem('groq_api_key') || '';
        this.speakEnabled = true;
        this.init();
    }

    async askGroq(question) {
        if (!this.groqKey) {
            const key = prompt("أدخل مفتاح Groq API (من console.groq.com)");
            if (key) {
                localStorage.setItem('groq_api_key', key);
                this.groqKey = key;
            } else return "مفتاح API غير موجود";
        }
        try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.groqKey}` },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'user', content: `أجب بالعربية: ${question}` }],
                    temperature: 0.7,
                    max_tokens: 800
                })
            });
            const data = await res.json();
            return data.choices?.[0]?.message?.content || "ما عرفت أرد";
        } catch(e) {
            return "حدث خطأ في الاتصال";
        }
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const msg = input.value.trim();
        if (!msg) return;
        this.addMessage(msg, 'user');
        input.value = '';
        const reply = await this.askGroq(msg);
        this.addMessage(reply, 'ai');
        if (this.speakEnabled) this.speak(reply);
    }

    addMessage(text, sender) {
        const history = document.getElementById('chatHistory');
        if (!history) return;
        const div = document.createElement('div');
        div.className = `chat-message ${sender}`;
        div.textContent = text;
        history.appendChild(div);
        history.scrollTop = history.scrollHeight;
    }

    speak(text) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-EG';
        window.speechSynthesis.speak(utterance);
    }

    init() {
        // إخفاء شاشة التحميل فوراً
        const loading = document.getElementById('loading');
        if (loading) loading.style.display = 'none';

        // ربط الأزرار
        const sendBtn = document.getElementById('sendBtn');
        const chatInput = document.getElementById('chatInput');
        if (sendBtn) sendBtn.onclick = () => this.sendMessage();
        if (chatInput) chatInput.onkeypress = (e) => { if (e.key === 'Enter') this.sendMessage(); };

        this.addMessage("🎉 مرحباً! أنا المصري الذكي. اسألني أي شيء.", 'ai');
    }
}

window.ai = new SimpleAI();
