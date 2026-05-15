// ============================================
// المصري الذكي - DEEP SEARCH ENGINE v3.4
// ONLINE SEARCH ONLY - NO OFFLINE LOGIC
// بحث + توليد إجابة ذكية + إلغاء الطلبات
// ============================================

class DeepSearchEngine {
    constructor(config = {}) {
        this.config = {
            cacheExpiry: config.cacheExpiry || 1000 * 60 * 30,
            maxCacheSize: config.maxCacheSize || 150,
            maxSearchHistory: config.maxSearchHistory || 50,
            requestTimeout: config.requestTimeout || 5000,
            retryAttempts: config.retryAttempts || 2,
            retryDelay: config.retryDelay || 500,
            enableCache: config.enableCache !== false,
            ...config
        };

        this.cache = new Map();
        this.lruMap = new Map();
        this.searchHistory = [];
        this.currentController = null;
        this.apiKey = this.loadApiKey();

        this.stats = {
            totalSearches: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errors: []
        };

        this.setupCacheAutoClean();
    }

    // ========== API KEY MANAGEMENT ==========
    loadApiKey() {
        let key = sessionStorage.getItem('ai_api_key');
        if (!key) {
            key = localStorage.getItem('ai_api_key');
            if (key) console.warn('[DeepSearchEngine] API key in localStorage (less secure)');
        }
        return key || '';
    }

    setApiKey(newKey) {
        console.warn('[DeepSearchEngine] Store key in sessionStorage. For production, use backend.');
        this.apiKey = newKey;
        sessionStorage.setItem('ai_api_key', newKey);
        localStorage.removeItem('ai_api_key');
    }

    // ========== UTILITIES ==========
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
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    safeURL(url) {
        try {
            if (typeof url !== 'string') return '#';
            const parsed = new URL(url);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:')
                return parsed.href;
            return '#';
        } catch {
            return '#';
        }
    }

    // ========== FETCH WITH TIMEOUT & SIGNAL ==========
    async fetchWithTimeout(url, timeout = null, signal = null) {
        timeout = timeout || this.config.requestTimeout;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        let finalSignal = signal;
        if (signal && controller) {
            const abortHandler = () => controller.abort();
            signal.addEventListener('abort', abortHandler);
            finalSignal = controller.signal;
            try {
                const response = await fetch(url, { signal: finalSignal });
                signal.removeEventListener('abort', abortHandler);
                clearTimeout(timeoutId);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response;
            } catch (err) {
                signal.removeEventListener('abort', abortHandler);
                clearTimeout(timeoutId);
                throw err;
            }
        } else {
            try {
                const response = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response;
            } finally {
                clearTimeout(timeoutId);
            }
        }
    }

    async fetchWithRetry(url, retries = null, timeout = null, signal = null) {
        retries = retries ?? this.config.retryAttempts;
        if (signal?.aborted) throw new Error('Aborted');
        
        try {
            return await this.fetchWithTimeout(url, timeout, signal);
        } catch (error) {
            if (signal?.aborted) throw new Error('Aborted');
            if (retries > 0) {
                const delay = this.config.retryDelay * (this.config.retryAttempts - retries + 1);
                console.warn(`[DeepSearchEngine] Retry ${delay}ms`, error.message);
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fetchWithRetry(url, retries - 1, timeout, signal);
            }
            this.stats.errors.push({ url, error: error.message, timestamp: new Date() });
            throw error;
        }
    }

    // ========== CACHE WITH LRU ==========
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
                if (t < oldestTime) { oldestTime = t; oldestKey = k; }
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
        if (removed) console.log(`[DeepSearchEngine] Cache cleaned: removed ${removed} entries`);
    }

    setupCacheAutoClean() {
        if (this._cleaner) return;
        this._cleaner = setInterval(() => this.cleanCache(), 1000 * 60 * 15);
    }

    destroy() {
        if (this._cleaner) clearInterval(this._cleaner);
        if (this.currentController) this.currentController.abort();
    }

    // ========== WIKIPEDIA SEARCH ==========
    async searchWikipedia(query, signal = null) {
        if (signal?.aborted) throw new Error('Aborted');
        const normalized = this.normalizeQuery(query);
        const cacheKey = `wiki_${normalized}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const searchUrl = `https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(normalized)}&format=json&origin=*&srlimit=3`;
            const searchResponse = await this.fetchWithRetry(searchUrl, null, null, signal);
            const searchData = await searchResponse.json();
            if (!searchData.query?.search?.length) return null;
            const firstResult = searchData.query.search[0];
            const pageId = firstResult.pageid;
            const extractUrl = `https://ar.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=extracts&exintro=true&explaintext=true&format=json&origin=*`;
            const extractResponse = await this.fetchWithRetry(extractUrl, null, null, signal);
            const extractData = await extractResponse.json();
            const page = extractData.query.pages[pageId];
            const result = {
                title: page.title || normalized,
                extract: (page.extract || firstResult.snippet || '').substring(0, 800),
                url: `https://ar.wikipedia.org/wiki/${encodeURIComponent(page.title || normalized)}`,
                source: 'Wikipedia',
                language: 'ar',
                confidence: 0.9,
                date: new Date().toISOString(),
                type: 'search_result'   // ✅ إضافة نوع النتيجة
            };
            this.setCached(cacheKey, result);
            return result;
        } catch (error) {
            if (error.message === 'Aborted') throw error;
            console.error('[DeepSearchEngine] Wikipedia error:', error);
            return null;
        }
    }

    // ========== DUCKDUCKGO SEARCH ==========
    async searchDuckDuckGo(query, signal = null) {
        if (signal?.aborted) throw new Error('Aborted');
        const normalized = this.normalizeQuery(query);
        const cacheKey = `ddg_${normalized}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(normalized)}&format=json&no_html=1&skip_disambig=1&no_redirect=1`;
            const response = await this.fetchWithRetry(url, null, null, signal);
            const text = await response.text();
            let data = null;
            try {
                data = JSON.parse(text);
            } catch {
                const match = text.match(/\{[\s\S]*\}/);
                if (match) data = JSON.parse(match[0]);
            }
            if (!data) throw new Error('Invalid JSON');

            let result = null;
            if (data.Abstract && data.Abstract.length > 50) {
                result = {
                    title: data.Heading || normalized,
                    extract: data.Abstract.substring(0, 800),
                    url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(normalized)}`,
                    source: 'DuckDuckGo',
                    language: 'mixed',
                    confidence: 0.75,
                    date: new Date().toISOString(),
                    type: 'search_result'
                };
            } else if (data.RelatedTopics?.length) {
                const topics = data.RelatedTopics.filter(t => t.Text?.length > 20).slice(0, 3)
                    .map(t => t.Text).join('\n\n');
                if (topics.length > 50) {
                    result = {
                        title: data.Heading || normalized,
                        extract: topics.substring(0, 800),
                        url: `https://duckduckgo.com/?q=${encodeURIComponent(normalized)}`,
                        source: 'DuckDuckGo',
                        language: 'mixed',
                        confidence: 0.6,
                        date: new Date().toISOString(),
                        type: 'search_result'
                    };
                }
            }

            if (!result) {
                result = {
                    title: normalized,
                    extract: `لم يتم العثور على نتيجة مفصلة. يمكنك البحث يدوياً.`,
                    url: `https://duckduckgo.com/?q=${encodeURIComponent(normalized)}`,
                    source: 'DuckDuckGo',
                    language: 'mixed',
                    confidence: 0.3,
                    date: new Date().toISOString(),
                    type: 'search_result'
                };
            }
            this.setCached(cacheKey, result);
            return result;
        } catch (error) {
            if (error.message === 'Aborted') throw error;
            console.error('[DeepSearchEngine] DuckDuckGo error:', error);
            return {
                title: query,
                extract: `حدث خطأ في البحث. جرب مباشرة:`,
                url: `https://duckduckgo.com/?q=${encodeURIComponent(this.normalizeQuery(query))}`,
                source: 'DuckDuckGo',
                confidence: 0.2,
                date: new Date().toISOString(),
                type: 'search_result'
            };
        }
    }

    // ========== NEWS SEARCH ==========
    async searchNews(query, signal = null) {
        if (!this.apiKey) return null;
        if (signal?.aborted) throw new Error('Aborted');
        const normalized = this.normalizeQuery(query);
        const cacheKey = `news_${normalized}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(normalized)}&language=ar&sortBy=relevancy&pageSize=3&apiKey=${this.apiKey}`;
            const response = await this.fetchWithRetry(url, null, null, signal);
            const data = await response.json();
            if (data.status === 'ok' && data.articles?.length) {
                const articles = data.articles.slice(0, 3);
                const result = {
                    title: `أخبار عن: ${normalized}`,
                    extract: articles.map(a => `📰 ${a.title}\n${a.description || ''}`).join('\n\n').substring(0, 800),
                    url: articles[0].url,
                    source: 'NewsAPI',
                    language: 'ar',
                    confidence: 0.7,
                    date: new Date().toISOString(),
                    type: 'search_result'
                };
                this.setCached(cacheKey, result);
                return result;
            }
            return null;
        } catch (error) {
            if (error.message === 'Aborted') throw error;
            console.error('[DeepSearchEngine] News error:', error);
            return null;
        }
    }

    // ========== MULTI-LANGUAGE FALLBACK ==========
    async searchEnglishWikipedia(query, signal = null) {
        if (signal?.aborted) throw new Error('Aborted');
        const englishQuery = this.normalizeQuery(query).replace(/[^a-z0-9 ]/g, '').trim();
        if (!englishQuery) return null;
        const cacheKey = `enwiki_${englishQuery}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;

        try {
            const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(englishQuery)}&format=json&origin=*&srlimit=1`;
            const response = await this.fetchWithRetry(searchUrl, null, null, signal);
            const data = await response.json();
            if (!data.query?.search?.length) return null;
            const pageId = data.query.search[0].pageid;
            const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=extracts&exintro=true&explaintext=true&format=json&origin=*`;
            const extractRes = await this.fetchWithRetry(extractUrl, null, null, signal);
            const extractData = await extractRes.json();
            const page = extractData.query.pages[pageId];
            const result = {
                title: page.title || englishQuery,
                extract: (page.extract || '').substring(0, 800),
                url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
                source: 'Wikipedia (English)',
                language: 'en',
                confidence: 0.85,
                date: new Date().toISOString(),
                type: 'search_result'
            };
            this.setCached(cacheKey, result);
            return result;
        } catch (error) {
            if (error.message === 'Aborted') throw error;
            return null;
        }
    }

    // ========== QUERY SUGGESTIONS (لحالات الفشل فقط) ==========
    generateSuggestions(query) {
        const normalized = this.normalizeQuery(query);
        const words = normalized.split(' ').filter(w => w.length > 2);
        const suggestions = [
            normalized.slice(0, 3),
            words[0],
            `${words[0]} ويكيبيديا`,
            normalized + ' تعريف'
        ].filter(s => s && s.length > 1);
        return [...new Set(suggestions)].slice(0, 3);
    }

    // ========== RESULT SYNTHESIS ==========
    synthesizeResults(results, query) {
        if (!results || results.length === 0) return null;
        const best = results[0];
        let answer = '';
        if (results.length >= 2) {
            const second = results[1];
            answer = `🔍 بناءً على المعلومات من ${best.source} و ${second.source}:\n\n`;
            answer += `📌 ${best.title}\n${best.extract.substring(0, 300)}...\n\n`;
            answer += `📌 ${second.title}\n${second.extract.substring(0, 300)}...\n\n`;
            answer += `💡 يمكنك الاطلاع على التفاصيل الكاملة عبر الروابط أدناه.`;
        } else {
            answer = `🔍 استناداً إلى ${best.source}:\n\n${best.title}\n${best.extract}`;
        }
        return answer;
    }

    // ========== SMART SCORING (مع typeBoost) ==========
    calculateScore(result, queryWords) {
        let score = 0;
        const text = (result.title + ' ' + result.extract).toLowerCase();
        let keywordCount = 0;
        for (const w of queryWords) {
            const regex = new RegExp(w, 'g');
            const matches = text.match(regex);
            if (matches) keywordCount += matches.length;
        }
        const keywordDensity = Math.min(1, keywordCount / 50);
        const relevance = queryWords.some(w => text.includes(w)) ? 200 : 0;
        const confidenceScore = (result.confidence || 0) * 500;
        const lengthScore = Math.min(result.extract.length / 5, 300);
        const freshness = result.source === 'NewsAPI' ? 100 : 0;
        const sourceWeights = { 'Wikipedia': 300, 'DuckDuckGo': 150, 'NewsAPI': 100, 'Wikipedia (English)': 280 };
        const sourceScore = sourceWeights[result.source] || 0;
        // ✅ إضافة 50 نقطة إضافية للنتائج التي تحمل نوع search_result
        const typeBoost = result.type === 'search_result' ? 50 : 0;
        
        score = relevance + confidenceScore + lengthScore + freshness + sourceScore + typeBoost + (keywordDensity * 200);
        return score;
    }

    // ========== COMBINED DEEP SEARCH ==========
    async performDeepSearch(query) {
        if (this.currentController) {
            this.currentController.abort();
            console.log('[DeepSearchEngine] Aborted previous search');
        }
        this.currentController = new AbortController();
        const signal = this.currentController.signal;

        if (!query || typeof query !== 'string') throw new Error('Invalid query');
        this.stats.totalSearches++;
        const originalQuery = query;
        const normalizedQuery = this.normalizeQuery(query);
        const queryWords = normalizedQuery.split(' ').filter(w => w.length > 1);

        let finalResults = [];
        try {
            const [wiki, ddg, news] = await Promise.allSettled([
                this.searchWikipedia(originalQuery, signal),
                this.searchDuckDuckGo(originalQuery, signal),
                this.apiKey ? this.searchNews(originalQuery, signal) : Promise.resolve(null)
            ]);
            if (wiki.status === 'fulfilled' && wiki.value) finalResults.push(wiki.value);
            if (ddg.status === 'fulfilled' && ddg.value) finalResults.push(ddg.value);
            if (news.status === 'fulfilled' && news.value) finalResults.push(news.value);
        } catch (err) {
            if (err.message === 'Aborted') {
                this.currentController = null;
                throw new Error('Search cancelled');
            }
        }

        // Fallback بسيط: إذا لم توجد نتائج عربية، جرّب الإنجليزية (بدون منطق ذكي إضافي)
        if (finalResults.length === 0 && !signal.aborted) {
            const enWiki = await this.searchEnglishWikipedia(originalQuery, signal);
            if (enWiki) finalResults.push(enWiki);
        }

        for (const res of finalResults) {
            res._score = this.calculateScore(res, queryWords);
        }
        finalResults.sort((a, b) => b._score - a._score);

        const hasRealResults = finalResults.length > 0 && finalResults[0].source !== 'اقتراح بحث';

        if (!hasRealResults && !signal.aborted) {
            const suggestions = this.generateSuggestions(originalQuery);
            finalResults.push({
                title: originalQuery,
                extract: `ملقتش نتيجة مباشرة 🤔\n\n🔍 اقتراحات للبحث:\n${suggestions.map(s => `• ${s}`).join('\n')}\n\n💡 جرب:\n• اختصر السؤال\n• استخدم كلمات أوضح`,
                url: `https://www.google.com/search?q=${encodeURIComponent(originalQuery)}`,
                source: 'اقتراح بحث',
                confidence: 0,
                date: new Date().toISOString(),
                _score: 0,
                type: 'fallback'   // ✅ ليس من نوع search_result
            });
        }

        const synthesizedAnswer = this.synthesizeResults(finalResults.filter(r => r.source !== 'اقتراح بحث'), originalQuery);

        this.searchHistory.push({
            query: normalizedQuery,
            results: finalResults.length,
            timestamp: new Date(),
            hasResults: hasRealResults
        });
        if (this.searchHistory.length > this.config.maxSearchHistory) this.searchHistory.shift();

        this.currentController = null;
        return {
            results: finalResults,
            hasResults: hasRealResults,
            fallbackUsed: !hasRealResults,
            synthesizedAnswer: synthesizedAnswer,
            timestamp: new Date(),
            query: originalQuery,
            mode: "online"   // ✅ إضافة وضع البحث عبر الإنترنت فقط
        };
    }

    // ========== FORMAT FOR DISPLAY ==========
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
                        <h3>💡 إجابة ذكية</h3>
                        <p>${this.escapeHTML(searchData.synthesizedAnswer)}</p>
                     </div>`;
            text += `💡 إجابة ذكية:\n${searchData.synthesizedAnswer}\n\n`;
        }
        for (const result of searchData.results) {
            const safeLink = this.safeURL(result.url);
            const escapedTitle = this.escapeHTML(result.title);
            const escapedExtract = this.escapeHTML(result.extract);
            const confidencePercent = Math.round((result.confidence || 0) * 100);
            const confidenceColor = confidencePercent >= 80 ? '#2e7d32' : (confidencePercent >= 60 ? '#f57c00' : '#c62828');
            const confidenceBadge = result.confidence ? `<span style="background:${confidenceColor};color:white;padding:2px 8px;border-radius:12px;font-size:0.75em;font-weight:bold;">دقة ${confidencePercent}%</span>` : '';
            html += `<div style="border:1px solid #e0e0e0;border-radius:8px;padding:15px;margin-bottom:15px;background:#fafafa;">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
                            <h3 style="margin:0;color:#1a73e8;">📌 ${escapedTitle}</h3>
                            ${confidenceBadge}
                        </div>
                        <p style="margin:0 0 10px 0;color:#555;line-height:1.6;">${escapedExtract}</p>
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:0.9em;color:#666;">
                            <span>🌐 <strong>${result.source}</strong></span>
                            <a href="${safeLink}" target="_blank" rel="noopener noreferrer" style="color:#1a73e8;text-decoration:none;">🔗 افتح المصدر</a>
                        </div>
                      </div>`;
            text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📌 ${escapedTitle} [دقة ${confidencePercent}%]\n\n📝 ${escapedExtract}\n\n🌐 المصدر: ${result.source}\n🔗 ${safeLink}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        }
        html += '</div>';
        return { html, text };
    }

    // ========== STATISTICS ==========
    getStats() {
        const hitRate = this.stats.totalSearches > 0 ? ((this.stats.cacheHits / this.stats.totalSearches) * 100).toFixed(2) : 0;
        return {
            totalSearches: this.stats.totalSearches,
            cacheHits: this.stats.cacheHits,
            cacheMisses: this.stats.cacheMisses,
            hitRate: `${hitRate}%`,
            cacheSize: this.cache.size,
            maxCacheSize: this.config.maxCacheSize,
            searchHistoryLength: this.searchHistory.length,
            lastSearch: this.searchHistory.length > 0 ? this.searchHistory[this.searchHistory.length - 1] : null,
            recentErrors: this.stats.errors.slice(-5)
        };
    }

    getSearchHistory(limit = 20) {
        return this.searchHistory.slice(-limit).reverse();
    }

    clearCache() {
        const size = this.cache.size;
        this.cache.clear();
        this.lruMap.clear();
        console.log(`[DeepSearchEngine] Cache cleared (${size} entries)`);
    }

    clearSearchHistory() {
        this.searchHistory = [];
    }

    exportStats() {
        return {
            engine: 'DeepSearchEngine v3.4',
            exportTime: new Date().toISOString(),
            stats: this.getStats(),
            history: this.getSearchHistory(50),
            config: this.config
        };
    }
}

// ========== DEBOUNCE ==========
function debounce(func, delay = 500) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

// ========== INIT ==========
let searchEngine;
window.addEventListener('DOMContentLoaded', () => {
    searchEngine = new DeepSearchEngine({
        cacheExpiry: 1000 * 60 * 30,
        maxCacheSize: 150,
        requestTimeout: 5000,
        retryAttempts: 2,
        enableCache: true
    });
    window.performDeepSearch = async (query, callback) => {
        try {
            const result = await searchEngine.performDeepSearch(query);
            callback(result);
        } catch (error) {
            console.error('[DeepSearchEngine] Search error:', error);
            callback({ results: [], hasResults: false, fallbackUsed: true, error: error.message });
        }
    };
    window.debouncedDeepSearch = debounce(window.performDeepSearch, 500);
    window.searchEngine = searchEngine;
    console.log('[DeepSearchEngine v3.4] Ready (online search only)');
});
