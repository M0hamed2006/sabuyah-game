// ============================================
// المصري الذكي - AUDIO ENGINE v2.0
// موسيقى هادئة + نطق عربي + تحكم صوت
// Created by: Mohamed Ragab Abdelmonem
// ============================================

class AudioEngine {
    constructor() {
        this.musicEnabled = false;
        this.speechEnabled = true;
        this.volume = 0.25; // 25% default
        this.audioContext = null;
        this.oscillators = [];
        this.gainNode = null;
        this.isPlaying = false;
        this.currentNotes = [];
        this.noteIndex = 0;
        
        // Egyptian ambient music - pentatonic scale (C, D, E, G, A)
        // Creates relaxing, mystical atmosphere
        this.melody = [
            { note: 261.63, duration: 2000, type: 'sine' },   // C4
            { note: 293.66, duration: 1500, type: 'sine' },   // D4
            { note: 329.63, duration: 2000, type: 'sine' },   // E4
            { note: 392.00, duration: 1500, type: 'sine' },   // G4
            { note: 440.00, duration: 2000, type: 'sine' },   // A4
            { note: 329.63, duration: 1500, type: 'sine' },   // E4
            { note: 293.66, duration: 2000, type: 'sine' },   // D4
            { note: 261.63, duration: 3000, type: 'sine' },   // C4 (long)
            { note: 196.00, duration: 2000, type: 'triangle' }, // G3 (bass)
            { note: 261.63, duration: 1500, type: 'sine' },   // C4
            { note: 392.00, duration: 2000, type: 'sine' },   // G4
            { note: 440.00, duration: 1500, type: 'sine' },   // A4
            { note: 523.25, duration: 3000, type: 'sine' },   // C5 (high)
            { note: 440.00, duration: 2000, type: 'sine' },   // A4
            { note: 392.00, duration: 1500, type: 'sine' },   // G4
            { note: 329.63, duration: 4000, type: 'sine' },   // E4 (long fade)
        ];
        
        this.init();
    }

    init() {
        this.setupUI();
        this.setupSpeech();
    }

    setupUI() {
        const musicToggle = document.getElementById('musicToggle');
        const volumeSlider = document.getElementById('volumeSlider');
        const volumeLabel = document.getElementById('volumeLabel');

        if (musicToggle) {
            musicToggle.addEventListener('click', () => {
                this.musicEnabled = !this.musicEnabled;
                musicToggle.innerHTML = this.musicEnabled ? 
                    '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
                
                if (this.musicEnabled) {
                    this.startMusic();
                } else {
                    this.stopMusic();
                }
            });
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.volume = e.target.value / 100;
                if (volumeLabel) volumeLabel.textContent = e.target.value + '%';
                if (this.gainNode) {
                    this.gainNode.gain.value = this.volume * 0.3; // Max 30% for background
                }
            });
        }
    }

    setupSpeech() {
        this.loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
    }

    loadVoices() {
        this.voices = speechSynthesis.getVoices();
        this.arabicVoice = this.voices.find(v => v.lang.includes('ar')) || 
                           this.voices.find(v => v.lang.includes('Arabic'));
        console.log('Voices loaded:', this.voices.length, 'Arabic:', this.arabicVoice ? 'YES' : 'NO');
    }

    // ========== MUSIC GENERATION ==========
    startMusic() {
        if (!window.AudioContext && !window.webkitAudioContext) {
            console.warn('Web Audio API not supported');
            return;
        }

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.volume * 0.3;
        this.gainNode.connect(this.audioContext.destination);
        
        this.isPlaying = true;
        this.noteIndex = 0;
        this.playNextNote();
    }

    playNextNote() {
        if (!this.isPlaying || !this.audioContext) return;

        const noteData = this.melody[this.noteIndex % this.melody.length];
        
        // Create oscillator for main note
        const osc = this.audioContext.createOscillator();
        const noteGain = this.audioContext.createGain();
        
        osc.type = noteData.type;
        osc.frequency.value = noteData.note;
        
        // Envelope for smooth fade in/out
        const now = this.audioContext.currentTime;
        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(0.15, now + 0.5);
        noteGain.gain.linearRampToValueAtTime(0.15, now + (noteData.duration / 1000) - 0.5);
        noteGain.gain.linearRampToValueAtTime(0, now + (noteData.duration / 1000));
        
        osc.connect(noteGain);
        noteGain.connect(this.gainNode);
        
        osc.start(now);
        osc.stop(now + (noteData.duration / 1000) + 0.1);
        
        // Add harmony (fifth interval)
        if (Math.random() > 0.5) {
            const harmony = this.audioContext.createOscillator();
            const harmonyGain = this.audioContext.createGain();
            harmony.type = 'sine';
            harmony.frequency.value = noteData.note * 1.5; // Perfect fifth
            harmonyGain.gain.value = 0.05;
            harmony.connect(harmonyGain);
            harmonyGain.connect(this.gainNode);
            harmony.start(now);
            harmony.stop(now + (noteData.duration / 1000));
        }
        
        // Add sub-bass for depth
        if (noteData.note > 300) {
            const bass = this.audioContext.createOscillator();
            const bassGain = this.audioContext.createGain();
            bass.type = 'triangle';
            bass.frequency.value = noteData.note / 4;
            bassGain.gain.value = 0.08;
            bass.connect(bassGain);
            bassGain.connect(this.gainNode);
            bass.start(now);
            bass.stop(now + (noteData.duration / 1000));
        }

        this.noteIndex++;
        
        // Schedule next note
        setTimeout(() => this.playNextNote(), noteData.duration);
    }

    stopMusic() {
        this.isPlaying = false;
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }

    // ========== TEXT TO SPEECH ==========
    speak(text, priority = false) {
        if (!this.speechEnabled || !('speechSynthesis' in window)) return;
        
        // Stop current speech if priority
        if (priority) {
            speechSynthesis.cancel();
        } else if (speechSynthesis.speaking) {
            return; // Don't interrupt
        }

        const utterance = new SpeechSynthesisUtterance(text);
        
        if (this.arabicVoice) {
            utterance.voice = this.arabicVoice;
        }
        
        utterance.lang = 'ar-EG';
        utterance.rate = 0.9; // Slightly slower for clarity
        utterance.pitch = 1.1;
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
            document.body.classList.add('ai-speaking');
        };
        
        utterance.onend = () => {
            document.body.classList.remove('ai-speaking');
        };
        
        utterance.onerror = (e) => {
            console.warn('Speech error:', e);
            document.body.classList.remove('ai-speaking');
        };
        
        speechSynthesis.speak(utterance);
    }

    // ========== SOUND EFFECTS ==========
    playSound(type) {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        switch(type) {
            case 'click':
                osc.type = 'sine';
                osc.frequency.value = 800;
                gain.gain.value = 0.1;
                break;
            case 'success':
                osc.type = 'sine';
                osc.frequency.value = 600;
                gain.gain.value = 0.15;
                break;
            case 'error':
                osc.type = 'sawtooth';
                osc.frequency.value = 200;
                gain.gain.value = 0.1;
                break;
        }
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    // ========== VOICE INPUT ==========
    async startVoiceInput(callback) {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('المتصفح مش بيدعم التعرف على الصوت! جرب Chrome.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'ar-EG';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => {
            document.getElementById('voiceInputBtn').innerHTML = '<i class="fas fa-microphone-lines"></i> سجل...';
            document.getElementById('voiceInputBtn').style.borderColor = '#ff6b6b';
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (callback) callback(transcript);
        };
        
        recognition.onerror = (event) => {
            console.error('Voice error:', event.error);
            document.getElementById('voiceInputBtn').innerHTML = '<i class="fas fa-microphone-lines"></i> تحدث';
            document.getElementById('voiceInputBtn').style.borderColor = '';
        };
        
        recognition.onend = () => {
            document.getElementById('voiceInputBtn').innerHTML = '<i class="fas fa-microphone-lines"></i> تحدث';
            document.getElementById('voiceInputBtn').style.borderColor = '';
        };
        
        recognition.start();
    }
}

// Global instance
let audioEngine;
window.addEventListener('DOMContentLoaded', () => {
    audioEngine = new AudioEngine();
});
