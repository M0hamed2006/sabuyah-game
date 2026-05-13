// ============================================
// المصري الذكي - DEEP SEARCH ENGINE v2.0
// بحث Wikipedia + DuckDuckGo + News API
// Created by: Mohamed Ragab Abdelmonem
// ============================================

class DeepSearchEngine {
    constructor() {
        this.cache = new Map();
        this.cacheExpiry = 1000 * 60 * 30; // 30 minutes
        this.apiKey = localStorage.getItem('ai_api_key') || '';
        this.searchHistory = [];
    }

    // ========== WIKIPEDIA SEARCH ==========
    async searchWikipedia(query) {
        const cacheKey = 'wiki_' + query;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.time < this.cacheExpiry) {
                return cached.data;
            }
        }

        try {
            // Wikipedia API (CORS-friendly)
            const searchUrl = `https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=3`;
            const searchResponse = await fetch(searchUrl);
            const searchData = await searchResponse.json();

            if (!searchData.query || !searchData.query.search || searchData.query.search.length === 0) {
                return null;
            }

            // Get first result details
            const firstResult = searchData.query.search[0];
            const pageId = firstResult.pageid;

            // Get page extract
            const extractUrl = `https://ar.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=extracts&exintro=true&explaintext=true&format=json&origin=*`;
            const extractResponse = await fetch(extractUrl);
            const extractData = await extractResponse.json();

            const page = extractData.query.pages[pageId];
            const result = {
                title: page.title,
                extract: page.extract ? page.extract.substring(0, 800) + '...' : firstResult.snippet,
                url: `https://ar.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
                source: 'Wikipedia'
            };

            this.cache.set(cacheKey, { data: result, time: Date.now() });
            return result;

        } catch (error) {
            console.error('Wikipedia search error:', error);
            return null;
        }
    }

    // ========== DUCKDUCKGO SEARCH ==========
    async searchDuckDuckGo(query) {
        const cacheKey = 'ddg_' + query;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.time < this.cacheExpiry) {
                return cached.data;
            }
        }

        try {
            // DuckDuckGo Instant Answer API
            const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&no_redirect=1`;
            
            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            const text = await response.text();
            
            // DuckDuckGo returns JSON with callback, need to parse carefully
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                // Try extracting JSON from callback wrapper
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    data = JSON.parse(jsonMatch[0]);
                } else {
                    return null;
                }
            }

            let result = null;

            // Try Abstract
            if (data.Abstract && data.Abstract.length > 50) {
                result = {
                    title: data.Heading || query,
                    extract: data.Abstract.substring(0, 800),
                    url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                    source: 'DuckDuckGo'
                };
            }
            // Try RelatedTopics
            else if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                const topics = data.RelatedTopics
                    .filter(t => t.Text)
                    .slice(0, 3)
                    .map(t => t.Text)
                    .join('\n\n');
                
                if (topics.length > 50) {
                    result = {
                        title: data.Heading || query,
                        extract: topics.substring(0, 800),
                        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
                        source: 'DuckDuckGo'
                    };
                }
            }

            if (result) {
                this.cache.set(cacheKey, { data: result, time: Date.now() });
            }
            return result;

        } catch (error) {
            console.error('DuckDuckGo search error:', error);
            return null;
        }
    }

    // ========== NEWS SEARCH ==========
    async searchNews(query) {
        if (!this.apiKey) return null;

        try {
            const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=ar&sortBy=relevancy&pageSize=3&apiKey=${this.apiKey}`;
            
            const response = await fetch(url);
            const data = await response.json();

            if (data.status === 'ok' && data.articles && data.articles.length > 0) {
                const articles = data.articles.slice(0, 3);
                return {
                    title: 'أخبار عن: ' + query,
                    extract: articles.map(a => `📰 ${a.title}\n${a.description || ''}`).join('\n\n'),
                    url: articles[0].url,
                    source: 'NewsAPI'
                };
            }
            return null;

        } catch (error) {
            console.error('News search error:', error);
            return null;
        }
    }

    // ========== COMBINED SEARCH ==========
    async performDeepSearch(query) {
        const results = [];
        const errors = [];

        // Try Wikipedia first (most reliable for facts)
        try {
            const wikiResult = await this.searchWikipedia(query);
            if (wikiResult) results.push(wikiResult);
        } catch (e) {
            errors.push('Wikipedia: ' + e.message);
        }

        // Try DuckDuckGo
        try {
            const ddgResult = await this.searchDuckDuckGo(query);
            if (ddgResult) results.push(ddgResult);
        } catch (e) {
            errors.push('DuckDuckGo: ' + e.message);
        }

        // Try News if API key exists
        if (this.apiKey) {
            try {
                const newsResult = await this.searchNews(query);
                if (newsResult) results.push(newsResult);
            } catch (e) {
                errors.push('News: ' + e.message);
            }
        }

        // Save to history
        this.searchHistory.push({
            query,
            results: results.length,
            time: Date.now()
        });

        return {
            results,
            errors: errors.length > 0 ? errors : null,
            hasResults: results.length > 0
        };
    }

    // ========== FORMAT RESULTS ==========
    formatForAI(searchData) {
        if (!searchData.hasResults) {
            return '❌ مالقيتش معلومات كافية على الإنترنت. جرب سؤال تاني أو تأكد من الاتصال.';
        }

        let formatted = '🔍 نتائج البحث من الإنترنت:\n\n';
        
        searchData.results.forEach((result, index) => {
            formatted += `[${index + 1}] ${result.title}\n`;
            formatted += `${result.extract}\n`;
            formatted += `المصدر: ${result.source}\n`;
            formatted += `🔗 ${result.url}\n\n`;
        });

        if (searchData.errors) {
            formatted += `\n⚠️ ملاحظة: بعض المصادر مش متاحة (${searchData.errors.length} errors)`;
        }

        return formatted;
    }

    // ========== CACHE MANAGEMENT ==========
    clearCache() {
        this.cache.clear();
        console.log('Search cache cleared');
    }

    getStats() {
        return {
            cacheSize: this.cache.size,
            searchHistory: this.searchHistory.length,
            lastSearch: this.searchHistory.length > 0 ? 
                new Date(this.searchHistory[this.searchHistory.length - 1].time) : null
        };
    }
}

// Global instance
let searchEngine;
window.addEventListener('DOMContentLoaded', () => {
    searchEngine = new DeepSearchEngine();
});
