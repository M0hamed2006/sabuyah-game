// ============================================
// المصري الذكي ULTRA - v10.5 (Gemini فقط)
// ============================================
class EgyptianAIUltra {
    constructor() {
        this.version = '10.5';
        this.isReady = false;
        this.speakEnabled = true;
        this.memory = this.loadMemory();
        this.dom = {};
        this.init();
    }

    getGeminiKey() {
        return localStorage.getItem('gemini_api_key');
    }

    setGeminiKey(key) {
        localStorage.setItem('gemini_api_key', key);
    }

    async callGemini(question) {
        const key = this.getGeminiKey();
        if (!key) return null;
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `أجب كمساعد مصري ذكي وبإجابات طويلة مفيدة: ${question}` }] }],
                    generationConfig: { temperature: 0.9, maxOutputTokens: 1024 }
                })
            });
            const data = await res.json();
            return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
        } catch(e) {
            console.error(e);
            return null;
        }
    }

    async sendMessage() {
        const input = document.getElementById('chatInput');
        const msg = input.value.trim();
        if (!msg) return;
        this.addChatMessage(msg, 'user');
        input.value = '';

        let response = null;
        if (navigator.onLine && this.getGeminiKey()) {
            response = await this.callGemini(msg);
        }
        if (!response) {
            response = "عذراً، لم أستطع الاتصال بـ Gemini. تأكد من اتصال الإنترنت والمفتاح، أو اسألني عن حاجة من معلوماتي المحلية (مثل 'نكتة').";
        }
        this.addChatMessage(response, 'ai');
        if (this.speakEnabled) this.speak(response);
    }

    addChatMessage(text, sender) {
        const history = document.getElementById('chatHistory');
        if (!history) return;
        const div = document.createElement('div');
        div.className = `chat-message ${sender}`;
        div.textContent = text;
        history.appendChild(div);
        history.scrollTop = history.scrollHeight;
    }

    speak(text) {
        if (!this.speakEnabled) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-EG';
        window.speechSynthesis.speak(utterance);
    }

    loadMemory() { return {}; }
    init() {
        if (!this.getGeminiKey()) {
            const key = prompt("🔑 أدخل مفتاح Gemini المجاني (احصل عليه من aistudio.google.com)");
            if (key) this.setGeminiKey(key);
        }
        document.getElementById('sendBtn')?.addEventListener('click', () => this.sendMessage());
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.sendMessage(); });
        this.isReady = true;
        console.log('✅ جاهز');
    }
}
window.egyptianAI = new EgyptianAIUltra();
