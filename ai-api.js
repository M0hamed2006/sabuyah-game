// =============================================
// AI API INTEGRATION - OpenAI (آمن)
// =============================================

const AI_API = {
    // المفتاح يُخزن في localStorage أو sessionStorage
    getApiKey() {
        return localStorage.getItem('openai_api_key') || sessionStorage.getItem('openai_api_key') || '';
    },
    
    setApiKey(key, remember = true) {
        if (remember) {
            localStorage.setItem('openai_api_key', key);
        } else {
            sessionStorage.setItem('openai_api_key', key);
        }
        // نحدّث المتغير المحلي لتجنب قراءة الـ storage كل مرة
        this.apiKey = key;
    },
    
    openaiUrl: 'https://api.openai.com/v1/chat/completions',
    
    async ask(question) {
        const key = this.getApiKey();
        if (!key) {
            console.warn('❌ لم يتم تعيين مفتاح OpenAI API');
            return null;
        }
        
        try {
            const response = await fetch(this.openaiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: question }],
                    max_tokens: 500
                })
            });
            const data = await response.json();
            if (data.choices && data.choices[0]) {
                return data.choices[0].message.content;
            } else {
                console.error('OpenAI error:', data);
                return null;
            }
        } catch (err) {
            console.error('Network error:', err);
            return null;
        }
    }
};
