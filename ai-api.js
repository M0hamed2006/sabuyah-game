// =============================================
// AI API INTEGRATION - OpenAI
// =============================================

const AI_API = {
    // 🔑 المفتاح الخاص بك (تم وضعه كما طلبت)
    apiKey: '',
    
    openaiUrl: 'https://api.openai.com/v1/chat/completions',
    
    async ask(question) {
        try {
            const response = await fetch(this.openaiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
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
