// ============================================
// محرك البحث العميق v4.0 MEGA ELITE
// ONLINE SEARCH + AI SYNTHESIS + CACHE + ABORT
// متوافق مع المصري الذكي
// ============================================

class DeepSearchEngine {
    constructor(config = {}) {
        this.config = {
            cacheExpiry: config.cacheExpiry || 1000 * 60 * 30,
            maxCacheSize: config.maxCacheSize || 200,
            maxSearchHistory: config.maxSearchHistory || 100,
            requestTimeout: config.requestTimeout || 8000,
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 300,
            enableCache: config.enableCache !== false,
            enableAISynthesis: config.enableAISynthesis !== false,
            ...config
        };

        this.cache = new Map();
        this.lruMap = new Map();
        this.searchHistory = [];
        this.currentController = null;
        this.apiKey = this.loadApiKey();
        this.groqKey = this.loadGroqKey();

        this.stats = {
            totalSearches: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: [],
            avgResponseTime: 0,
            successRate: 0
        };

        this.setupCacheAutoClean();
    }

    // ==================== إدارة المفاتيح ====================
    loadApiKey() {
        let key = sessionStorage.getItem('news_api_key');
        if (!key) key = localStorage.getItem('news_api_key');
        return 'd68e6c6fc2bb42c9b31a27dc129a8a66';
    }

    loadGroqKey() {
        let key = sessionStorage.getItem('groq_api_key');
        if (!key) key = localStorage.getItem('groq_api_key');
        return key || '';
    }

    setApiKey(newKey) {
        this.apiKey = newKey;
        sessionStorage.setItem('news_api_key', newKey);
    }

    setGroqKey(newKey) {
        this.groqKey = newKey;
        sessionStorage.setItem('groq_api_key', newKey);
    }

    // ==================== أدوات مساعدة ====================
    normalizeQuery(query) {
        if (typeof query !== 'string') return '';
        return query
            .trim()
            .toLowerCase()
            .replace(/[أإآ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/[ى]/g, 'ي')
            .replace(/\s+/g, ' ');
    }

    escapeHTML(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    safeURL(url) {
        try {
            if (typeof url !== 'string') return '#';
            const parsed = new URL(url);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '#';
        } catch {
            return '#';
        }
    }

    // ==================== Fetch مع Timeout و Retry ====================
    async fetchWithTimeout(url, timeout = null, signal = null) {
        timeout = timeout || this.config.requestTimeout;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, { signal: signal || controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async fetchWithRetry(url, retries = null, timeout = null, signal = null) {
        retries = retries ?? this.config.retryAttempts;
        if (signal?.aborted) throw new Error('Aborted');

        try {
            return await this.fetchWithTimeout(url, timeout, signal);
        } catch (error) {
            if (signal?.aborted) throw new Error('Aborted');
            if (retries > 0 && !error.message.includes('Aborted')) {
                const delay = this.config.retryDelay * (this.config.retryAttempts - retries + 1);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchWithRetry(url, retries - 1, timeout, signal);
            }
            throw error;
        }
    }

    // ==================== Cache LRU ====================
    getCached(key) {
        if (!this.config.enableCache || !this.cache.has(key)) {
            this.stats.cacheMisses++;
            return null;
        }

        const cached = this.cache.get(key);
        const isExpired = Date.now() - cached.time > this.config.cacheExpiry;

        if (isExpired) {
            this.cache.delete(key);
            this.lruMap.delete(key);
            this.stats.cacheMisses++;
            return null;
        }

        this.lruMap.delete(key);
        this.lruMap.set(key, Date.now());
        this.stats.cacheHits++;
        return cached.data;
    }

    setCached(key, data) {
        if (!this.config.enableCache) return;

        if (this.cache.size >= this.config.maxCacheSize && !this.cache.has(key)) {
            let oldestKey = null, oldestTime = Infinity;
            for (let [k, t] of this.lruMap.entries()) {
                if (t < oldestTime) {
                    oldestTime = t;
                    oldestKey = k;
                }
            }
            if (oldestKey) {
                this.cache.delete(oldestKey);
                this.lruMap.delete(oldestKey);
            }
        }

        if (this.lruMap.has(key)) this.lruMap.delete(key);
        this.cache.set(key, { data, time: Date.now() });
        this.lruMap.set(key, Date.now());
    }

    cleanCache() {
        const now = Date.now();
        let removed = 0;
        for (let [key, value] of this.cache.entries()) {
            if (now - value.time > this.config.cacheExpiry) {
                this.cache.delete(key);
                this.lruMap.delete(key);
                removed++;
            }
        }
        return removed;
    }

    setupCacheAutoClean() {
        if (this._cleaner) return;
        this._cleaner = setInterval(() => this.cleanCache(), 1000 * 60 * 10);
    }

    // ==================== Wikipedia البحث ====================
    async searchWikipedia(query, signal = null) {
        if (signal?.aborted) throw new Error('Aborted');

        const normalized = this.normalizeQuery(query);
        const cacheKey = `wiki_${normalized}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const searchUrl = `https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(normalized)}&format=json&origin=*&srlimit=5`;
            const searchResponse = await this.fetchWithRetry(searchUrl, null, null, signal);
            const searchData = await searchResponse.json();

            if (!searchData.query?.search?.length) return null;

            const results = [];
            for (const item of searchData.query.search.slice(0, 3)) {
                try {
                    const extractUrl = `https://ar.wikipedia.org/w/api.php?action=query&pageids=${item.pageid}&prop=extracts|pageimages&exintro=true&explaintext=true&format=json&origin=*&pithumbsize=300`;
                    const extractResponse = await this.fetchWithRetry(extractUrl, 2, null, signal);
                    const extractData = await extractResponse.json();
                    const page = extractData.query.pages[item.pageid];

                    results.push({
                        title: page.title || normalized,
                        extract: (page.extract || item.snippet || '').substring(0, 1000),
                        url: `https://ar.wikipedia.org/wiki/${encodeURIComponent(page.title || normalized)}`,
                        source: 'Wikipedia عربي',
                        language: 'ar',
                        confidence: 0.95,
                        date: new Date().toISOString(),
                        type: 'search_result',
                        image: page.thumbnail?.source || null
                    });
                } catch (e) {
                    if (e.message !== 'Aborted') continue;
                    throw e;
                }
            }

            if (results.length > 0) {
                this.setCached(cacheKey, results);
                return results;
            }
            return null;
        } catch (error) {
            if (error.message === 'Aborted') throw error;
            console.error('❌ Wikipedia error:', error);
            return null;
        }
    }

    // ==================== DuckDuckGo البحث ====================
    async searchDuckDuckGo(query, signal = null) {
        if (signal?.aborted) throw new Error('Aborted');

        const normalized = this.normalizeQuery(query);
        const cacheKey = `ddg_${normalized}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&no_redirect=1`;
            const response = await this.fetchWithRetry(url, null, null, signal);
            const text = await response.text();

            let data = null;
            try {
                data = JSON.parse(text);
            } catch {
                const match = text.match(/\{[\s\S]*\}/);
                if (match) data = JSON.parse(match[0]);
            }

            if (!data) return null;

            let results = [];

            if (data.Abstract && data.Abstract.length > 50) {
                results.push({
                    title: data.Heading || normalized,
                    extract: data.Abstract.substring(0, 1000),
                    url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                    source: 'DuckDuckGo',
                    language: 'mixed',
                    confidence: 0.8,
                    date: new Date().toISOString(),
                    type: 'search_result'
                });
            }

            if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                const topics = data.RelatedTopics.filter(t => t.Text?.length > 30).slice(0, 2);
                for (const topic of topics) {
                    results.push({
                        title: topic.FirstURL ? topic.FirstURL.split('/')[topic.FirstURL.split('/').length - 1] : 'موضوع ذو صلة',
                        extract: topic.Text.substring(0, 800),
                        url: topic.FirstURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                        source: 'DuckDuckGo',
                        language: 'mixed',
                        confidence: 0.65,
                        date: new Date().toISOString(),
                        type: 'search_result'
                    });
                }
            }

            if (results.length > 0) {
                this.setCached(cacheKey, results);
                return results;
            }

            return null;
        } catch (error) {
            if (error.message === 'Aborted') throw error;
            console.error('❌ DuckDuckGo error:', error);
            return null;
        }
    }

    // ==================== الأخبار ====================
    async searchNews(query, signal = null) {
        if (!this.apiKey) return null;
        if (signal?.aborted) throw new Error('Aborted');

        const normalized = this.normalizeQuery(query);
        const cacheKey = `news_${normalized}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(normalized)}&language=ar&sortBy=publishedAt&pageSize=5&apiKey=${this.apiKey}`;
            const response = await this.fetchWithRetry(url, null, null, signal);
            const data = await response.json();

            if (data.status === 'ok' && data.articles?.length) {
                const results = data.articles.slice(0, 3).map(article => ({
                    title: article.title,
                    extract: (article.description || article.content || '').substring(0, 800),
                    url: article.url,
                    source: 'الأخبار',
                    language: 'ar',
                    confidence: 0.75,
                    date: article.publishedAt,
                    type: 'search_result',
                    image: article.urlToImage || null
                }));

                this.setCached(cacheKey, results);
                return results;
            }
            return null;
        } catch (error) {
            if (error.message === 'Aborted') throw error;
            console.error('❌ News error:', error);
            return null;
        }
    }

    // ==================== English Wikipedia Fallback ====================
    async searchEnglishWikipedia(query, signal = null) {
        if (signal?.aborted) throw new Error('Aborted');

        const englishQuery = this.normalizeQuery(query).replace(/[^a-z0-9 ]/g, '').trim();
        if (!englishQuery) return null;

        const cacheKey = `enwiki_${englishQuery}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(englishQuery)}&format=json&origin=*&srlimit=3`;
            const response = await this.fetchWithRetry(searchUrl, 2, null, signal);
            const data = await response.json();

            if (!data.query?.search?.length) return null;

            const results = [];
            for (const item of data.query.search.slice(0, 2)) {
                try {
                    const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${item.pageid}&prop=extracts&exintro=true&explaintext=true&format=json&origin=*`;
                    const extractRes = await this.fetchWithRetry(extractUrl, 2, null, signal);
                    const extractData = await extractRes.json();
                    const page = extractData.query.pages[item.pageid];

                    results.push({
                        title: page.title || englishQuery,
                        extract: (page.extract || '').substring(0, 800),
                        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
                        source: 'Wikipedia English',
                        language: 'en',
                        confidence: 0.85,
                        date: new Date().toISOString(),
                        type: 'search_result'
                    });
                } catch (e) {
                    if (e.message !== 'Aborted') continue;
                    throw e;
                }
            }

            if (results.length > 0) {
                this.setCached(cacheKey, results);
                return results;
            }
            return null;
        } catch (error) {
            if (error.message === 'Aborted') throw error;
            return null;
        }
    }

    // ==================== Groq AI Synthesis ====================
    async synthesizeWithAI(query, results) {
        if (!this.groqKey || !this.config.enableAISynthesis) {
            return null;
        }

        try {
            const resultsText = results
                .slice(0, 3)
                .map(r => `${r.title}: ${r.extract}`)
                .join('\n\n');

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.groqKey}`
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'system',
                            content: 'أنت مساعد ذكي مصري. لخص المعلومات بشكل واضح وطبيعي وودي. استخدم رموز تعبيرية مناسبة.'
                        },
                        {
                            role: 'user',
                            content: `لخص هذه المعلومات عن "${query}":\n\n${resultsText}\n\nاكتب تلخيصاً سريعاً وممتعاً.`
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            return data.choices?.[0]?.message?.content || null;
        } catch (error) {
            console.warn('⚠️ AI synthesis failed:', error);
            return null;
        }
    }

    // ==================== Smart Scoring ====================
    calculateScore(result, queryWords) {
        const text = (result.title + ' ' + result.extract).toLowerCase();
        let score = 0;

        let keywordCount = 0;
        for (const w of queryWords) {
            const regex = new RegExp(w, 'g');
            const matches = text.match(regex);
            if (matches) keywordCount += matches.length;
        }

        const keywordDensity = Math.min(1, keywordCount / 50);
        const relevance = queryWords.some(w => text.includes(w)) ? 300 : 0;
        const confidenceScore = (result.confidence || 0) * 600;
        const lengthScore = Math.min(result.extract.length / 5, 400);
        const freshness = result.source === 'الأخبار' ? 200 : 0;

        const sourceWeights = {
            'Wikipedia عربي': 400,
            'DuckDuckGo': 200,
            'الأخبار': 150,
            'Wikipedia English': 350
        };

        const sourceScore = sourceWeights[result.source] || 0;
        const typeBoost = result.type === 'search_result' ? 100 : 0;

        score = relevance + confidenceScore + lengthScore + freshness + sourceScore + typeBoost + (keywordDensity * 300);
        return score;
    }

    // ==================== البحث الرئيسي ====================
    async performDeepSearch(query) {
        if (this.currentController) {
            this.currentController.abort();
        }

        this.currentController = new AbortController();
        const signal = this.currentController.signal;

        if (!query || typeof query !== 'string') {
            throw new Error('Invalid query');
        }

        const startTime = Date.now();
        this.stats.totalSearches++;

        const originalQuery = query;
        const normalizedQuery = this.normalizeQuery(query);
        const queryWords = normalizedQuery.split(' ').filter(w => w.length > 1);

        let allResults = [];

        try {
            const [wiki, ddg, news, enWiki] = await Promise.allSettled([
                this.searchWikipedia(originalQuery, signal),
                this.searchDuckDuckGo(originalQuery, signal),
                this.apiKey ? this.searchNews(originalQuery, signal) : Promise.resolve(null),
                this.searchEnglishWikipedia(originalQuery, signal)
            ]);

            if (wiki.status === 'fulfilled' && wiki.value) {
                allResults.push(...(Array.isArray(wiki.value) ? wiki.value : [wiki.value]));
            }
            if (ddg.status === 'fulfilled' && ddg.value) {
                allResults.push(...(Array.isArray(ddg.value) ? ddg.value : [ddg.value]));
            }
            if (news.status === 'fulfilled' && news.value) {
                allResults.push(...(Array.isArray(news.value) ? news.value : [news.value]));
            }
            if (enWiki.status === 'fulfilled' && enWiki.value) {
                allResults.push(...(Array.isArray(enWiki.value) ? enWiki.value : [enWiki.value]));
            }
        } catch (err) {
            if (err.message === 'Aborted') {
                this.currentController = null;
                throw new Error('Search cancelled');
            }
        }

        // تصفية النتائج المكررة
        const uniqueResults = new Map();
        for (const result of allResults) {
            const key = this.normalizeQuery(result.title);
            if (!uniqueResults.has(key) || (result.confidence || 0) > (uniqueResults.get(key).confidence || 0)) {
                uniqueResults.set(key, result);
            }
        }
        allResults = Array.from(uniqueResults.values());

        // Scoring والترتيب
        for (const res of allResults) {
            res._score = this.calculateScore(res, queryWords);
        }
        allResults.sort((a, b) => b._score - a._score);

        const hasRealResults = allResults.length > 0;

        // AI Synthesis
        let synthesizedAnswer = null;
        if (hasRealResults && this.config.enableAISynthesis) {
            synthesizedAnswer = await this.synthesizeWithAI(originalQuery, allResults);
        }

        if (!hasRealResults) {
            allResults.push({
                title: originalQuery,
                extract: `🤔 ملقيتش نتيجة مباشرة\n\n💡 جرب:\n• كلمات أبسط\n• اختصر السؤال\n• ابحث بشكل مختلف`,
                url: `https://www.google.com/search?q=${encodeURIComponent(originalQuery)}`,
                source: 'Google',
                confidence: 0,
                date: new Date().toISOString(),
                _score: 0,
                type: 'fallback'
            });
        }

        // Update history
        this.searchHistory.push({
            query: normalizedQuery,
            results: allResults.length,
            timestamp: new Date(),
            hasResults: hasRealResults,
            responseTime: Date.now() - startTime
        });

        if (this.searchHistory.length > this.config.maxSearchHistory) {
            this.searchHistory.shift();
        }

        // Update stats
        const avgTime = this.stats.avgResponseTime || 0;
        this.stats.avgResponseTime = (avgTime + (Date.now() - startTime)) / 2;

        this.currentController = null;

        return {
            results: allResults,
            hasResults: hasRealResults,
            fallbackUsed: !hasRealResults,
            synthesizedAnswer: synthesizedAnswer,
            timestamp: new Date(),
            query: originalQuery,
            responseTime: Date.now() - startTime,
            mode: 'online'
        };
    }

    // ==================== عرض النتائج ====================
    formatForDisplay(searchData) {
        if (!searchData.hasResults && searchData.fallbackUsed) {
            return {
                html: `<div style="padding:20px;background:#f8f9fa;border-radius:8px;text-align:center;">
                        <h3>❌ مالقيتش معلومات</h3>
                        <p>جرب تكتب بشكل تاني أو استخدم كلمات أسهل</p>
                        <small>مثال: "أهرامات" بدل "الأهرامات المصرية القديمة"</small>
                       </div>`,
                text: '❌ مالقيتش معلومات كافية على الإنترنت.'
            };
        }

        let html = '<div style="padding:20px;">';
        let text = '🔍 نتائج البحث من الإنترنت:\n\n';

        if (searchData.synthesizedAnswer) {
            html += `<div style="background:#e3f2fd;border-radius:8px;padding:15px;margin-bottom:20px;">
                        <h3>💡 ملخص ذكي</h3>
                        <p>${this.escapeHTML(searchData.synthesizedAnswer)}</p>
                        <small>⏱️ ${searchData.responseTime}ms</small>
                     </div>`;
            text += `💡 ملخص ذكي:\n${searchData.synthesizedAnswer}\n\n`;
        }

        for (const result of searchData.results.slice(0, 5)) {
            if (result.type === 'fallback') continue;

            const safeLink = this.safeURL(result.url);
            const escapedTitle = this.escapeHTML(result.title);
            const escapedExtract = this.escapeHTML(result.extract.substring(0, 400));
            const confidencePercent = Math.round((result.confidence || 0) * 100);
            const confidenceColor = confidencePercent >= 85 ? '#2e7d32' : (confidencePercent >= 70 ? '#f57c00' : '#c62828');

            html += `<div style="border:1px solid #e0e0e0;border-radius:8px;padding:15px;margin-bottom:15px;background:#fafafa;">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
                            <h3 style="margin:0;color:#1a73e8;">📌 ${escapedTitle}</h3>
                            <span style="background:${confidenceColor};color:white;padding:2px 8px;border-radius:12px;font-size:0.75em;font-weight:bold;">دقة ${confidencePercent}%</span>
                        </div>
                        <p style="margin:0 0 10px 0;color:#555;line-height:1.6;">${escapedExtract}</p>
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:0.9em;color:#666;">
                            <span>🌐 <strong>${result.source}</strong></span>
                            <a href="${safeLink}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:none;">🔗 اقرأ المزيد</a>
                        </div>
                    </div>`;

            text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📌 ${result.title} [دقة ${confidencePercent}%]\n\n📝 ${result.extract}\n\n🌐 المصدر: ${result.source}\n🔗 ${safeLink}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        }

        html += '</div>';
        return { html, text };
    }

    // ==================== الإحصائيات ====================
    getStats() {
        const hitRate = this.stats.totalSearches > 0 
            ? ((this.stats.cacheHits / this.stats.totalSearches) * 100).toFixed(2) 
            : 0;

        return {
            totalSearches: this.stats.totalSearches,
            cacheHits: this.stats.cacheHits,
            cacheMisses: this.stats.cacheMisses,
            hitRate: `${hitRate}%`,
            cacheSize: this.cache.size,
            maxCacheSize: this.config.maxCacheSize,
            searchHistoryLength: this.searchHistory.length,
            avgResponseTime: `${this.stats.avgResponseTime.toFixed(0)}ms`,
            lastSearch: this.searchHistory.length > 0 ? this.searchHistory[this.searchHistory.length - 1] : null
        };
    }

    getSearchHistory(limit = 30) {
        return this.searchHistory.slice(-limit).reverse();
    }

    clearCache() {
        const size = this.cache.size;
        this.cache.clear();
        this.lruMap.clear();
        console.log(`[DeepSearchEngine] Cache cleared (${size} entries)`);
        return size;
    }

    destroy() {
        if (this._cleaner) clearInterval(this._cleaner);
        if (this.currentController) this.currentController.abort();
    }
}

// ==================== Debounce ====================
function debounce(func, delay = 500) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

// ==================== التهيئة ====================
let searchEngine;

window.addEventListener('DOMContentLoaded', () => {
    searchEngine = new DeepSearchEngine({
        cacheExpiry: 1000 * 60 * 30,
        maxCacheSize: 200,
        requestTimeout: 8000,
        retryAttempts: 3,
        enableCache: true,
        enableAISynthesis: true
    });

    window.performDeepSearch = async (query, callback) => {
        try {
            const result = await searchEngine.performDeepSearch(query);
            if (callback) callback(result);
            return result;
        } catch (error) {
            console.error('❌ Search error:', error);
            const fallback = {
                results: [],
                hasResults: false,
                fallbackUsed: true,
                error: error.message
            };
            if (callback) callback(fallback);
            return fallback;
        }
    };

    window.debouncedDeepSearch = debounce(window.performDeepSearch, 500);
    window.searchEngine = searchEngine;

    console.log('✅ DeepSearchEngine v4.0 MEGA جاهز!');
});

window.addEventListener('beforeunload', () => {
    if (searchEngine) searchEngine.destroy();
});
