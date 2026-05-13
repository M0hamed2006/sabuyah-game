// ============================================
// SABUYAH - DYNAMIC AUDIO SYSTEM
// Web Audio API - Professional Grade
// ============================================

class SabuyahAudio {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.volume = 0.8;
        this.isPlaying = false;
        this.currentMusic = null;
        this.bpm = 120;
        this.beatInterval = null;
        
        // Environments music configs
        this.environments = {
            city: { bpm: 128, baseFreq: 150, style: 'electronic' },
            desert: { bpm: 110, baseFreq: 130, style: 'tribal' },
            night: { bpm: 140, baseFreq: 100, style: 'dark' },
            rain: { bpm: 100, baseFreq: 120, style: 'ambient' },
            fog: { bpm: 90, baseFreq: 80, style: 'mysterious' }
        };
        
        this.currentEnv = 'city';
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.musicGain = this.ctx.createGain();
            this.sfxGain = this.ctx.createGain();
            
            this.musicGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.masterGain.connect(this.ctx.destination);
            
            this.setVolume(this.volume);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolume(v) {
        this.volume = v / 100;
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    // --- MUSIC SYSTEM ---
    startMusic(environment = 'city') {
        this.init();
        this.currentEnv = environment;
        const config = this.environments[environment];
        this.bpm = config.bpm;
        
        this.stopMusic();
        this.isPlaying = true;
        
        // Create adaptive music loop
        this.beatInterval = setInterval(() => {
            if (!this.isPlaying) return;
            this.playBeat(config);
        }, 60000 / this.bpm);
        
        // Start bass line
        this.playBassLine(config);
    }

    playBeat(config) {
        const now = this.ctx.currentTime;
        
        // Kick drum
        this.playKick(now);
        
        // Hi-hat on off-beats
        if (Math.random() > 0.3) {
            this.playHiHat(now + 0.25);
        }
        
        // Snare on beats 2 and 4
        this.playSnare(now + 0.5);
        
        // Random percussion for variety
        if (Math.random() > 0.7) {
            this.playPercussion(now + Math.random() * 0.5);
        }
        
        // Melodic elements based on speed
        if (Math.random() > 0.5) {
            this.playMelodic(now, config);
        }
    }

    playKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.musicGain);
        
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
        
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        
        osc.start(time);
        osc.stop(time + 0.15);
    }

    playHiHat(time) {
        // Create noise for hi-hat
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 8000;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        
        noise.start(time);
        noise.stop(time + 0.05);
    }

    playSnare(time) {
        // Noise component
        const bufferSize = this.ctx.sampleRate * 0.1;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);
        
        noise.start(time);
        noise.stop(time + 0.1);
        
        // Tone component
        const osc = this.ctx.createOscillator();
        const toneGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 200;
        toneGain.gain.setValueAtTime(0.3, time);
        toneGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        
        osc.connect(toneGain);
        toneGain.connect(this.musicGain);
        
        osc.start(time);
        osc.stop(time + 0.05);
    }

    playPercussion(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400 + Math.random() * 200, time);
        osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);
        
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        
        osc.connect(gain);
        gain.connect(this.musicGain);
        
        osc.start(time);
        osc.stop(time + 0.05);
    }

    playMelodic(time, config) {
        const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
        const note = notes[Math.floor(Math.random() * notes.length)];
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = config.style === 'dark' ? 'sawtooth' : 'square';
        osc.frequency.setValueAtTime(note, time);
        
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        
        osc.connect(gain);
        gain.connect(this.musicGain);
        
        osc.start(time);
        osc.stop(time + 0.2);
    }

    playBassLine(config) {
        // Continuous bass drone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = config.baseFreq;
        
        gain.gain.value = 0.15;
        
        osc.connect(gain);
        gain.connect(this.musicGain);
        
        this.currentMusic = { osc, gain };
        osc.start();
    }

    stopMusic() {
        this.isPlaying = false;
        if (this.beatInterval) {
            clearInterval(this.beatInterval);
            this.beatInterval = null;
        }
        if (this.currentMusic) {
            try {
                this.currentMusic.osc.stop();
            } catch(e) {}
            this.currentMusic = null;
        }
    }

    changeEnvironment(env) {
        if (this.environments[env] && env !== this.currentEnv) {
            this.currentEnv = env;
            if (this.isPlaying) {
                this.startMusic(env);
            }
        }
    }

    // --- SFX SYSTEM ---
    playCoin() {
        this.init();
        const now = this.ctx.currentTime;
        
        // Multiple tones for satisfying coin sound
        [1200, 1600, 2000].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0.3, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.1);
        });
    }

    playJump() {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playSlide() {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playCrash() {
        this.init();
        const now = this.ctx.currentTime;
        
        // Noise crash
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        
        noise.start(now);
        noise.stop(now + 0.5);
        
        // Low impact sound
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        oscGain.gain.setValueAtTime(0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playBoost() {
        this.init();
        const now = this.ctx.currentTime;
        
        // Rising sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.5);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.5);
        
        // Second layer
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(300, now);
        osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        
        osc2.start(now);
        osc2.stop(now + 0.5);
    }

    playPowerUp(type) {
        this.init();
        const now = this.ctx.currentTime;
        
        const sounds = {
            magnet: [440, 554, 659], // Major chord
            shield: [523, 659, 784], // Higher major
            drone: [330, 392, 494], // Lower
            rocket: [200, 300, 500, 800], // Rising
            ghost: [600, 500, 400, 300], // Falling
            multiplier: [880, 1100, 1320] // High bright
        };
        
        const freqs = sounds[type] || sounds.magnet;
        
        freqs.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0.2, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.15);
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.15);
        });
    }

    playChaserWarning(distance) {
        this.init();
        const now = this.ctx.currentTime;
        
        // Heartbeat that gets faster as chaser gets closer
        const rate = Math.max(0.3, distance / 100);
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 80;
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 0.1);
        
        // Second beat
        setTimeout(() => {
            if (!this.ctx) return;
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.value = 80;
            gain2.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
            osc2.connect(gain2);
            gain2.connect(this.sfxGain);
            osc2.start();
            osc2.stop(this.ctx.currentTime + 0.1);
        }, rate * 1000);
    }

    playTrainPass() {
        this.init();
        const now = this.ctx.currentTime;
        
        // Doppler effect simulation
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 1);
        
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.setValueAtTime(0.2, now + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        
        osc.start(now);
        osc.stop(now + 1);
    }

    // --- UTILITY ---
    mute() {
        if (this.masterGain) {
            this.masterGain.gain.value = 0;
        }
    }

    unmute() {
        if (this.masterGain) {
            this.masterGain.gain.value = this.volume;
        }
    }

    vibrate(pattern) {
        if (navigator.vibrate && document.getElementById('vibrationToggle')?.checked) {
            navigator.vibrate(pattern);
        }
    }
}

// Create global instance
const sabuyahAudio = new SabuyahAudio();
