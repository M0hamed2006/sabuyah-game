// ============================================
// SABUYAH - UI CONTROLLER
// Menus, Shop, Settings, Achievements, Leaderboard
// ============================================

class UIController {
    constructor() {
        this.screens = {
            start: document.getElementById('startScreen'),
            game: document.getElementById('gameUI'),
            gameOver: document.getElementById('gameOverScreen'),
            shop: document.getElementById('shopScreen'),
            settings: document.getElementById('settingsScreen'),
            credits: document.getElementById('creditsScreen')
        };
        
        this.gameData = this.loadGameData();
        this.currentScreen = 'start';
        this.achievements = this.defineAchievements();
        this.shopItems = this.defineShopItems();
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateShopCurrency();
        this.checkDailyRewards();
    }

    // --- SCREEN MANAGEMENT ---
    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.add('hidden');
            screen.classList.remove('active');
        });
        
        if (this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
            this.screens[screenName].classList.add('active');
            this.currentScreen = screenName;
        }
    }

    // --- EVENT BINDING ---
    bindEvents() {
        // Main menu
        document.getElementById('playBtn')?.addEventListener('click', () => {
            sabuyahAudio.init();
            startGame();
        });
        
        document.getElementById('shopBtn')?.addEventListener('click', () => {
            this.showScreen('shop');
            this.renderShop('characters');
        });
        
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.showScreen('settings');
            this.loadSettings();
        });
        
        document.getElementById('creditsBtn')?.addEventListener('click', () => {
            this.showScreen('credits');
        });

        // Game Over
        document.getElementById('restartBtn')?.addEventListener('click', () => {
            startGame();
        });
        
        document.getElementById('menuBtn')?.addEventListener('click', () => {
            this.showScreen('start');
        });

        // Shop
        document.getElementById('closeShopBtn')?.addEventListener('click', () => {
            this.showScreen('start');
        });

        // Shop tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderShop(e.target.dataset.tab);
            });
        });

        // Settings
        document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
            this.saveSettings();
            this.showScreen('start');
        });

        // Credits
        document.getElementById('closeCreditsBtn')?.addEventListener('click', () => {
            this.showScreen('start');
        });

        // Mobile boost
        document.getElementById('boostBtn')?.addEventListener('click', () => {
            if (typeof activateBoost === 'function') activateBoost();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.currentScreen === 'game') {
                    // Pause game
                    if (typeof togglePause === 'function') togglePause();
                } else if (this.currentScreen !== 'start') {
                    this.showScreen('start');
                }
            }
        });
    }

    // --- GAME DATA (LocalStorage) ---
    loadGameData() {
        const defaultData = {
            coins: 0,
            highScore: 0,
            totalDistance: 0,
            gamesPlayed: 0,
            characters: ['default'],
            skins: ['default'],
            powerups: {},
            achievements: [],
            settings: {
                volume: 80,
                vibration: true,
                quality: 'medium',
                sensitivity: 5
            },
            lastDailyReward: null,
            stats: {
                totalCoins: 0,
                totalJumps: 0,
                totalSlides: 0,
                trainsAvoided: 0,
                powerupsUsed: 0
            }
        };
        
        try {
            const saved = localStorage.getItem('sabuyah_save');
            return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
        } catch (e) {
            return defaultData;
        }
    }

    saveGameData() {
        localStorage.setItem('sabuyah_save', JSON.stringify(this.gameData));
    }

    addCoins(amount) {
        this.gameData.coins += amount;
        this.gameData.stats.totalCoins += amount;
        this.saveGameData();
        this.updateShopCurrency();
    }

    // --- ACHIEVEMENTS SYSTEM ---
    defineAchievements() {
        return [
            { id: 'first_run', name: 'أول جولة', desc: 'العب لعبتك الأولى', icon: '🎮', reward: 50, condition: (s) => s.gamesPlayed >= 1 },
            { id: 'coin_collector', name: 'جامع الذهب', desc: 'اجمع 100 عملة في جولة واحدة', icon: '🪙', reward: 100, condition: (s, session) => session.coins >= 100 },
            { id: 'survivor', name: 'الناجي', desc: 'قطع 1000 متر بدون موت', icon: '🏃', reward: 200, condition: (s, session) => session.distance >= 1000 },
            { id: 'train_dodger', name: 'هروب من القطار', desc: 'تفادى 10 قطارات في جولة', icon: '🚂', reward: 150, condition: (s, session) => session.trainsAvoided >= 10 },
            { id: 'boost_master', name: 'سيد السرعة', desc: 'استخدم البوست 5 مرات', icon: '⚡', reward: 100, condition: (s) => s.stats.powerupsUsed >= 5 },
            { id: 'high_jumper', name: 'القفاز', desc: 'اقفز 50 مرة', icon: '🦘', reward: 100, condition: (s) => s.stats.totalJumps >= 50 },
            { id: 'slider', name: 'المنزلق', desc: 'انزلق 30 مرة', icon: '🛹', reward: 100, condition: (s) => s.stats.totalSlides >= 30 },
            { id: 'millionaire', name: 'المليونير', desc: 'اجمع 1000 عملة إجمالي', icon: '💰', reward: 500, condition: (s) => s.stats.totalCoins >= 1000 },
            { id: 'marathon', name: 'الماراثون', desc: 'قطع 5000 متر إجمالي', icon: '🏆', reward: 300, condition: (s) => s.totalDistance >= 5000 },
            { id: 'night_runner', name: 'عدو الليل', desc: 'العب في بيئة الليل', icon: '🌙', reward: 150, condition: (s, session) => session.environment === 'night' },
            { id: 'desert_fox', name: 'ثعلب الصحراء', desc: 'العب في بيئة الصحراء', icon: '🌵', reward: 150, condition: (s, session) => session.environment === 'desert' },
            { id: 'no_damage', name: 'المنيع', desc: 'استخدم الدرع 3 مرات', icon: '🛡️', reward: 200, condition: (s) => s.stats.powerupsUsed >= 3 },
            { id: 'speed_demon', name: 'شيطان السرعة', desc: 'وصل لسرعة 2x', icon: '👹', reward: 250, condition: (s, session) => session.maxSpeed >= 2.0 },
            { id: 'perfectionist', name: 'المثالي', desc: '1000 متر بدون اصطدام جانبي', icon: '✨', reward: 300, condition: (s, session) => session.perfectRun >= 1000 },
            { id: 'egyptian_legend', name: 'أسطورة مصر', desc: 'حصل على كل الإنجازات', icon: '🇪🇬', reward: 1000, condition: (s) => s.achievements.length >= 14 }
        ];
    }

    checkAchievements(sessionData) {
        const newAchievements = [];
        
        this.achievements.forEach(ach => {
            if (!this.gameData.achievements.includes(ach.id)) {
                if (ach.condition(this.gameData, sessionData)) {
                    this.gameData.achievements.push(ach.id);
                    this.gameData.coins += ach.reward;
                    newAchievements.push(ach);
                }
            }
        });
        
        if (newAchievements.length > 0) {
            this.saveGameData();
            this.showAchievementsPopup(newAchievements);
        }
        
        return newAchievements;
    }

    showAchievementsPopup(achievements) {
        const container = document.getElementById('achievementsList');
        if (!container) return;
        
        container.innerHTML = '';
        achievements.forEach(ach => {
            const div = document.createElement('div');
            div.className = 'achievement-item';
            div.innerHTML = `
                <span class="achievement-icon">${ach.icon}</span>
                <div class="achievement-text">
                    <div class="achievement-title">${ach.name}</div>
                    <div class="achievement-desc">${ach.desc} (+${ach.reward} 🪙)</div>
                </div>
            `;
            container.appendChild(div);
        });
        
        // Play achievement sound
        sabuyahAudio.playPowerUp('shield');
    }

    // --- SHOP SYSTEM ---
    defineShopItems() {
        return {
            characters: [
                { id: 'default', name: 'أحمد', icon: '🏃', desc: 'شخصية أساسية متوازنة', price: 0, owned: true, stats: { speed: 5, jump: 5, coin: 5 } },
                { id: 'speedy', name: 'كريم السريع', icon: '⚡', desc: 'سرعة +30%', price: 500, owned: false, stats: { speed: 8, jump: 4, coin: 4 } },
                { id: 'jumper', name: 'عماد القفاز', icon: '🦘', desc: 'قفزة أعلى +40%', price: 600, owned: false, stats: { speed: 4, jump: 8, coin: 4 } },
                { id: 'collector', name: 'سامي الجامع', icon: '🪙', desc: 'جمع عملات +50%', price: 700, owned: false, stats: { speed: 4, jump: 4, coin: 9 } },
                { id: 'ninja', name: 'نينجا مصر', icon: '🥷', desc: 'سرعة +20%، قفزة +20%', price: 1000, owned: false, stats: { speed: 7, jump: 7, coin: 5 } },
                { id: 'pharaoh', name: 'فرعون', icon: '👑', desc: 'كل الإحصائيات +25%', price: 2000, owned: false, stats: { speed: 7, jump: 7, coin: 7 } }
            ],
            skins: [
                { id: 'default', name: 'عادي', icon: '👕', price: 0, owned: true },
                { id: 'red', name: 'أحمر ناري', icon: '🔴', price: 200, owned: false },
                { id: 'blue', name: 'أزرق بحري', icon: '🔵', price: 200, owned: false },
                { id: 'green', name: 'أخضر نباتي', icon: '🟢', price: 200, owned: false },
                { id: 'gold', name: 'ذهبي', icon: '🟡', price: 500, owned: false },
                { id: 'galaxy', name: 'مجرة', icon: '🌌', price: 800, owned: false },
                { id: 'pharaoh_skin', name: 'ملكي', icon: '🏛️', price: 1000, owned: false }
            ],
            powerups: [
                { id: 'magnet', name: 'مغناطيس', icon: '🧲', desc: 'جذب العملات', price: 300, duration: 8 },
                { id: 'shield', name: 'درع', icon: '🛡️', desc: 'حماية من ضربة', price: 250, duration: 10 },
                { id: 'drone', name: 'درون', icon: '🚁', desc: 'يجمع العملات', price: 400, duration: 12 },
                { id: 'rocket', name: 'صاروخ', icon: '🚀', desc: 'يدمر العقبات', price: 500, duration: 5 },
                { id: 'ghost', name: 'شبح', icon: '👻', desc: 'مرور عبر كل شيء', price: 600, duration: 6 },
                { id: 'multiplier', name: 'مضاعف', icon: '✖️', desc: 'x10 العملات', price: 450, duration: 10 }
            ]
        };
    }

    renderShop(category) {
        const container = document.getElementById('shopContent');
        if (!container) return;
        
        container.innerHTML = '';
        const items = this.shopItems[category] || [];
        
        items.forEach(item => {
            const isOwned = this.gameData[category === 'characters' ? 'characters' : category === 'skins' ? 'skins' : 'powerups']?.includes?.(item.id) || item.owned;
            const isEquipped = this.gameData.currentCharacter === item.id || this.gameData.currentSkin === item.id;
            
            const div = document.createElement('div');
            div.className = `shop-item ${isOwned ? '' : 'locked'}`;
            div.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-name">${item.name}</div>
                ${item.desc ? `<div style="font-size:0.7rem;color:#aaa;margin:4px 0;">${item.desc}</div>` : ''}
                ${item.stats ? `
                    <div style="font-size:0.6rem;color:#888;">
                        ⚡${item.stats.speed} 🦘${item.stats.jump} 🪙${item.stats.coin}
                    </div>
                ` : ''}
                <div class="shop-item-price">
                    ${isOwned ? (isEquipped ? '✅ مستخدم' : '✓ مملوك') : `🪙 ${item.price}`}
                </div>
            `;
            
            div.addEventListener('click', () => {
                if (!isOwned) {
                    this.buyItem(category, item);
                } else {
                    this.equipItem(category, item);
                }
            });
            
            container.appendChild(div);
        });
    }

    buyItem(category, item) {
        if (this.gameData.coins >= item.price) {
            this.gameData.coins -= item.price;
            
            if (category === 'characters') {
                this.gameData.characters.push(item.id);
            } else if (category === 'skins') {
                this.gameData.skins.push(item.id);
            } else {
                if (!this.gameData.powerups[item.id]) this.gameData.powerups[item.id] = 0;
                this.gameData.powerups[item.id]++;
            }
            
            this.saveGameData();
            this.updateShopCurrency();
            this.renderShop(category);
            
            sabuyahAudio.playCoin();
            this.showNotification(`تم الشراء: ${item.name}!`);
        } else {
            this.showNotification('عملات غير كافية! 🪙', 'error');
            sabuyahAudio.vibrate([50, 100, 50]);
        }
    }

    equipItem(category, item) {
        if (category === 'characters') {
            this.gameData.currentCharacter = item.id;
        } else if (category === 'skins') {
            this.gameData.currentSkin = item.id;
        }
        
        this.saveGameData();
        this.renderShop(category);
        this.showNotification(`تم التجهيز: ${item.name}`);
    }

    updateShopCurrency() {
        const el = document.getElementById('shopCoins');
        if (el) el.textContent = this.gameData.coins;
    }

    // --- SETTINGS ---
    loadSettings() {
        const s = this.gameData.settings;
        document.getElementById('volumeSlider').value = s.volume;
        document.getElementById('vibrationToggle').checked = s.vibration;
        document.getElementById('qualitySelect').value = s.quality;
        document.getElementById('sensitivitySlider').value = s.sensitivity;
    }

    saveSettings() {
        this.gameData.settings = {
            volume: parseInt(document.getElementById('volumeSlider').value),
            vibration: document.getElementById('vibrationToggle').checked,
            quality: document.getElementById('qualitySelect').value,
            sensitivity: parseInt(document.getElementById('sensitivitySlider').value)
        };
        this.saveGameData();
        
        sabuyahAudio.setVolume(this.gameData.settings.volume);
    }

    // --- LEADERBOARD ---
    saveScore(score, distance, coins) {
        this.gameData.gamesPlayed++;
        this.gameData.totalDistance += distance;
        
        if (score > this.gameData.highScore) {
            this.gameData.highScore = score;
        }
        
        // Save to local leaderboard
        let leaderboard = JSON.parse(localStorage.getItem('sabuyah_leaderboard') || '[]');
        leaderboard.push({
            name: 'أنت',
            score: score,
            distance: distance,
            coins: coins,
            date: new Date().toISOString()
        });
        
        leaderboard.sort((a, b) => b.score - a.score);
        leaderboard = leaderboard.slice(0, 10); // Keep top 10
        
        localStorage.setItem('sabuyah_leaderboard', JSON.stringify(leaderboard));
        this.saveGameData();
        
        return leaderboard;
    }

    getLeaderboard() {
        return JSON.parse(localStorage.getItem('sabuyah_leaderboard') || '[]');
    }

    // --- DAILY REWARDS ---
    checkDailyRewards() {
        const today = new Date().toDateString();
        if (this.gameData.lastDailyReward !== today) {
            // Show daily reward popup (simplified)
            this.gameData.lastDailyReward = today;
            this.gameData.coins += 50; // Daily bonus
            this.saveGameData();
            this.showNotification('🎁 مكافأة يومية: +50 🪙');
        }
    }

    // --- NOTIFICATIONS ---
    showNotification(text, type = 'success') {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? 'rgba(255,0,0,0.9)' : 'rgba(255,170,0,0.9)'};
            color: #fff;
            padding: 12px 30px;
            border-radius: 25px;
            font-weight: bold;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            backdrop-filter: blur(10px);
        `;
        notif.textContent = text;
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.style.opacity = '0';
            notif.style.transition = 'opacity 0.3s';
            setTimeout(() => notif.remove(), 300);
        }, 2000);
    }

    // --- HUD UPDATES ---
    updateHUD(score, coins, distance, level, boostPercent, dangerPercent) {
        document.getElementById('scoreVal').textContent = Math.floor(score);
        document.getElementById('coinVal').textContent = coins;
        document.getElementById('distVal').textContent = Math.floor(distance);
        document.getElementById('levelVal').textContent = level;
        
        // Boost bar
        const boostBar = document.getElementById('boostBar');
        if (boostBar) {
            boostBar.style.width = boostPercent + '%';
        }
        
        // Danger bar
        const dangerBar = document.getElementById('dangerBar');
        const dangerFill = dangerBar?.querySelector('.danger-fill');
        if (dangerBar && dangerFill) {
            if (dangerPercent > 0) {
                dangerBar.classList.add('active');
                dangerFill.style.width = dangerPercent + '%';
            } else {
                dangerBar.classList.remove('active');
            }
        }
    }

    showPowerupIcon(type, duration) {
        const container = document.getElementById('activePowerups');
        if (!container) return;
        
        const icons = {
            magnet: '🧲', shield: '🛡️', drone: '🚁',
            rocket: '🚀', ghost: '👻', multiplier: '✖️'
        };
        
        const div = document.createElement('div');
        div.className = 'powerup-icon';
        div.id = `powerup-${type}`;
        div.innerHTML = `
            ${icons[type] || '⚡'}
            <div class="powerup-timer" id="timer-${type}">${duration}</div>
        `;
        div.style.borderColor = this.getPowerupColor(type);
        
        container.appendChild(div);
        
        // Countdown
        let timeLeft = duration;
        const timer = setInterval(() => {
            timeLeft--;
            const timerEl = document.getElementById(`timer-${type}`);
            if (timerEl) timerEl.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                div.remove();
            }
        }, 1000);
    }

    getPowerupColor(type) {
        const colors = {
            magnet: '#ff00ff', shield: '#00ff00', drone: '#0088ff',
            rocket: '#ff0000', ghost: '#ffffff', multiplier: '#ffff00'
        };
        return colors[type] || '#ffaa00';
    }

    // --- GAME OVER SCREEN ---
    showGameOver(score, distance, coins, maxSpeed, sessionData) {
        document.getElementById('finalScore').textContent = Math.floor(score);
        document.getElementById('finalDist').textContent = Math.floor(distance);
        document.getElementById('finalCoins').textContent = coins;
        document.getElementById('finalSpeed').textContent = maxSpeed.toFixed(1) + 'x';
        
        // Save and check achievements
        const leaderboard = this.saveScore(score, distance, coins);
        const newAchievements = this.checkAchievements(sessionData);
        
        this.showScreen('gameOver');
        
        // Vibrate on game over
        sabuyahAudio.vibrate([100, 50, 100, 50, 200]);
    }

    // --- ENVIRONMENT INDICATOR ---
    showEnvironmentChange(env) {
        const names = {
            city: '🏙️ المدينة', desert: '🌵 الصحراء', night: '🌙 الليل',
            rain: '🌧️ المطر', fog: '🌫️ الضباب'
        };
        
        this.showNotification(`بيئة جديدة: ${names[env] || env}`);
        sabuyahAudio.changeEnvironment(env);
    }

    // --- SCREEN SHAKE EFFECT ---
    triggerScreenShake() {
        document.body.classList.add('screen-shake');
        setTimeout(() => {
            document.body.classList.remove('screen-shake');
        }, 500);
    }

    // --- BOOST OVERLAY ---
    setBoostOverlay(active) {
        let overlay = document.getElementById('boostOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'boostOverlay';
            overlay.className = 'boost-overlay';
            document.body.appendChild(overlay);
        }
        
        if (active) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
}

// Create global instance
const ui = new UIController();
