/**
 * Sound Generator - إنشاء الأصوات برمجياً باستخدام Web Audio API
 * بدون الحاجة لملفات صوتية خارجية
 */

class SoundGenerator {
    constructor() {
        // التحقق من دعم Web Audio API
        const audioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new audioContext();
        this.masterVolume = this.audioContext.createGain();
        this.masterVolume.connect(this.audioContext.destination);
        this.masterVolume.gain.value = 0.7;
        this.isMuted = false;
    }

    /**
     * تشغيل صوت القفز
     */
    playJumpSound() {
        if (this.isMuted) return;

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    /**
     * تشغيل صوت جمع العملة
     */
    playCoinSound() {
        if (this.isMuted) return;

        const now = this.audioContext.currentTime;
        
        for (let i = 0; i < 2; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.masterVolume);

            const freq = 800 + (i * 200);
            osc.frequency.setValueAtTime(freq, now + (i * 0.05));
            
            gain.gain.setValueAtTime(0.2, now + (i * 0.05));
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1 + (i * 0.05));

            osc.start(now + (i * 0.05));
            osc.stop(now + 0.1 + (i * 0.05));
        }
    }

    /**
     * تشغيل صوت جمع العنصر المعزز (Power-Up)
     */
    playPowerUpSound() {
        if (this.isMuted) return;

        const now = this.audioContext.currentTime;
        
        // نغمة صاعدة
        for (let i = 0; i < 3; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'square';
            osc.connect(gain);
            gain.connect(this.masterVolume);

            const freq = 500 + (i * 150);
            osc.frequency.setValueAtTime(freq, now + (i * 0.08));
            
            gain.gain.setValueAtTime(0.25, now + (i * 0.08));
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12 + (i * 0.08));

            osc.start(now + (i * 0.08));
            osc.stop(now + 0.12 + (i * 0.08));
        }
    }

    /**
     * تشغيل صوت الاصطدام / Game Over
     */
    playGameOverSound() {
        if (this.isMuted) return;

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.masterVolume);

        // نغمة منخفضة ومكتومة
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    /**
     * تشغيل صوت الاهتزاز عند الاصطدام
     */
    playHitSound() {
        if (this.isMuted) return;

        const now = this.audioContext.currentTime;
        
        // نغمتان
        for (let i = 0; i < 2; i++) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'square';
            osc.connect(gain);
            gain.connect(this.masterVolume);

            osc.frequency.setValueAtTime(300 - (i * 100), now);
            
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            osc.start(now);
            osc.stop(now + 0.15);
        }
    }

    /**
     * موسيقى الخلفية (حلقة بسيطة)
     */
    playBackgroundMusic() {
        if (this.isMuted) return;

        // الموسيقى ستشغل تلقائياً من خلال التكرار
        const playNote = (freq, duration, now) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(this.masterVolume);

            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

            osc.start(now);
            osc.stop(now + duration);
        };

        // نغمات بسيطة متكررة
        const now = this.audioContext.currentTime;
        const notes = [262, 330, 392, 440]; // C, E, G, A

        let time = now;
        for (let i = 0; i < 8; i++) {
            playNote(notes[i % 4], 0.3, time);
            time += 0.35;
        }

        // إعادة التشغيل
        setTimeout(() => this.playBackgroundMusic(), 3000);
    }

    /**
     * صوت متتالي من النقاط
     */
    playComboSound(combo) {
        if (this.isMuted) return;

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.masterVolume);

        // التردد يزيد مع عدد النقاط المتتالية
        const freq = 500 + (combo * 20);
        osc.frequency.setValueAtTime(freq, now);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
     * صوت الانزلاق
     */
    playSlideSound() {
        if (this.isMuted) return;

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'square';
        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(300, now + 0.2);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    /**
     * صوت النقر على الزر
     */
    playClickSound() {
        if (this.isMuted) return;

        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'square';
        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.frequency.setValueAtTime(1000, now);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    /**
     * تحديث مستوى الصوت
     */
    setVolume(volume) {
        // volume من 0 إلى 100
        this.masterVolume.gain.value = volume / 100;
    }

    /**
     * كتم الصوت
     */
    mute() {
        this.isMuted = true;
        this.masterVolume.gain.value = 0;
    }

    /**
     * تفعيل الصوت
     */
    unmute() {
        this.isMuted = false;
        const volume = parseInt(document.getElementById('volumeSlider')?.value || 70);
        this.masterVolume.gain.value = volume / 100;
    }

    /**
     * تبديل كتم الصوت
     */
    toggleMute() {
        if (this.isMuted) {
            this.unmute();
        } else {
            this.mute();
        }
        return !this.isMuted;
    }
}

// إنشاء عنصر الصوت العام
const soundManager = new SoundGenerator();
