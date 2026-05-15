// ==================== المصري الذكي v2.0 ====================
// واجهة نظيفة + Groq AI + توليد صور + نماذج متعددة

let API_KEY = localStorage.getItem('groq_api_key') || '';
let selectedModel = 'llama-3.3-70b-versatile';
let isDarkMode = localStorage.getItem('theme') === 'dark';
let chatHistory = [];
let isLoading = false;

// عناصر DOM
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const modelSelect = document.getElementById('modelSelect');
const drawBtn = document.getElementById('drawBtn');
const clearChatBtn = document.getElementById('clearChat');
const themeToggle = document.getElementById('themeToggle');
const apiModal = document.getElementById('apiModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiBtn = document.getElementById('saveApiBtn');
const skipApiBtn = document.getElementById('skipApiBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');

// تحقق من وجود مفتاح
function checkApiKey() {
    if (!API_KEY) {
        apiModal.classList.remove('hidden');
        statusText.textContent = 'الرجاء إدخال مفتاح API';
        statusDot.classList.remove('connected');
    } else {
        statusText.textContent = 'جاهز للاستخدام';
        statusDot.classList.add('connected');
    }
}

// حفظ المفتاح
saveApiBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key.startsWith('gsk_')) {
        API_KEY = key;
        localStorage.setItem('groq_api_key', key);
        apiModal.classList.add('hidden');
        statusText.textContent = 'جاهز للاستخدام';
        statusDot.classList.add('connected');
        addMessage('ai', '✅ تم تفعيل الذكاء الاصطناعي! يمكنك الآن التحدث معي.');
    } else {
        alert('❌ مفتاح غير صالح. تأكد من أنه يبدأ بـ gsk_');
    }
});

skipApiBtn.addEventListener('click', () => {
    apiModal.classList.add('hidden');
    statusText.textContent = 'وضع تجريبي (بدون AI)';
    addMessage('ai', '⚠️ أنت في الوضع التجريبي. أدخل مفتاح API لتفعيل الردود الذكية.');
});

// تبديل الوضع الليلي/النهاري
function toggleTheme() {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
        document.body.classList.add('dark');
        themeToggle.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark');
        themeToggle.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    }
}
themeToggle.addEventListener('click', toggleTheme);
if (isDarkMode) toggleTheme();

// تغيير النموذج
modelSelect.addEventListener('change', (e) => {
    selectedModel = e.target.value;
    addMessage('ai', `🔄 تم تغيير النموذج إلى ${modelSelect.options[modelSelect.selectedIndex].text}`);
});

// مسح المحادثة
clearChatBtn.addEventListener('click', () => {
    chatMessages.innerHTML = '';
    chatHistory = [];
    addMessage('ai', '🧹 تم مسح المحادثة. ابدأ من جديد!');
});

// إضافة رسالة
function addMessage(role, content, isImage = false, imageUrl = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? '👤' : '🤖';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (isImage && imageUrl) {
        contentDiv.innerHTML = `<p>${escapeHtml(content)}</p><img src="${imageUrl}" class="generated-image" onclick="window.open('${imageUrl}','_blank')">`;
    } else {
        contentDiv.innerHTML = formatMessage(content);
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // حفظ في التاريخ (للمستخدم فقط)
    if (role === 'user') {
        chatHistory.push({ role: 'user', content: content });
    } else if (role === 'ai' && !isImage) {
        chatHistory.push({ role: 'assistant', content: content });
        // محدودية عدد الرسائل
        if (chatHistory.length > 20) {
            chatHistory = chatHistory.slice(-20);
        }
    }
}

// تنسيق النص
function formatMessage(text) {
    return text
        .replace(/\n/g, '<br>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function escapeHtml(text) {
    return text.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    }).replace(/\n/g, '<br>');
}

// مؤشر الكتابة
let typingDiv = null;
function showTyping() {
    if (typingDiv) removeTyping();
    typingDiv = document.createElement('div');
    typingDiv.className = 'message ai';
    typingDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {
    if (typingDiv) {
        typingDiv.remove();
        typingDiv = null;
    }
}

// الاتصال بـ Groq API
async function callGroq(messages) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: selectedModel,
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'فشل الطلب');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// توليد صورة (مجاني)
async function generateImage(prompt) {
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512`;
    return imageUrl;
}

// إرسال الرسالة
async function sendMessage(isDrawing = false) {
    const message = chatInput.value.trim();
    if (!message) return;
    
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    if (isDrawing) {
        addMessage('user', `🎨 طلب رسم: ${message}`);
        showTyping();
        try {
            const imgUrl = await generateImage(message);
            removeTyping();
            addMessage('ai', `🖼️ صورة حسب طلبك: "${message}"`, true, imgUrl);
        } catch (error) {
            removeTyping();
            addMessage('ai', `❌ فشل توليد الصورة: ${error.message}`);
        }
        return;
    }
    
    addMessage('user', message);
    
    if (!API_KEY) {
        addMessage('ai', '⚠️ الرجاء إدخال مفتاح Groq API أولاً من النافذة المنبثقة.');
        apiModal.classList.remove('hidden');
        return;
    }
    
    showTyping();
    
    try {
        const messages = [
            { role: 'system', content: 'أنت مساعد مصري ذكي تتحدث بالعربية. أجب بإجابات مفيدة وودودة.' },
            ...chatHistory.slice(-10)
        ];
        
        const reply = await callGroq(messages);
        removeTyping();
        addMessage('ai', reply);
    } catch (error) {
        removeTyping();
        addMessage('ai', `❌ خطأ: ${error.message}`);
        console.error(error);
    }
}

// دعم الإدخال
sendBtn.addEventListener('click', () => sendMessage(false));
drawBtn.addEventListener('click', () => sendMessage(true));
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(false);
    }
});

// توسيع تلقائي للـ textarea
chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// بدء التشغيل
checkApiKey();

// رسالة ترحيب
setTimeout(() => {
    if (chatMessages.children.length === 1) {
        addMessage('ai', '👋 مرحباً! أنا جاهز للمساعدة.\n💬 اسألني أي شيء.\n🎨 اكتب "ارسم: وصف الصورة" أو استخدم زر "ارسم".\n🔧 اختر النموذج المناسب من القائمة.');
    }
}, 500);
