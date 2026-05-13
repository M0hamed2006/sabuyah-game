// ==================== UTILS ====================
window.utils = (function() {
    // الصوت (نفس SoundFX السابق لكن مع تحسين طفيف)
    let audioCtx = null;
    let masterGain = null;
    let soundMuted = false;
    let musicOn = true;
    let musicInterval = null;

    function initAudio() {
        if (audioCtx) return;
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.connect(audioCtx.destination);
        masterGain.gain.value = 0.7;
    }

    function playTone(freq, duration, endFreq) {
        if (soundMuted || !audioCtx) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.frequency.setValueAtTime(freq, now);
        if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.start(now);
        osc.stop(now + duration);
    }

    function playChord(freqs, duration) {
        freqs.forEach(f => playTone(f, duration, f * 1.2));
    }

    const sound = {
        init: initAudio,
        jump: () => playTone(500, 0.12, 800),
        coin: () => playTone(900, 0.08, 1200),
        powerUp: () => playChord([600,750,900], 0.2),
        gameOver: () => playTone(300, 0.4, 150),
        slide: () => playTone(400, 0.15, 250),
        click: () => playTone(1200, 0.03, 1200),
        enemyHit: () => playTone(200, 0.2, 100),
        startMusic: function() {
            if (!musicOn || soundMuted || !audioCtx) return;
            if (musicInterval) clearInterval(musicInterval);
            const playMelody = () => {
                if (soundMuted || !musicOn) return;
                playTone(262, 0.2, 330);
                setTimeout(() => playTone(330, 0.2, 392), 250);
                setTimeout(() => playTone(392, 0.3, 440), 500);
            };
            playMelody();
            musicInterval = setInterval(playMelody, 3000);
        },
        stopMusic: () => { if (musicInterval) clearInterval(musicInterval); },
        setVolume: (vol) => { if (masterGain) masterGain.gain.value = vol / 100; },
        mute: (m) => { soundMuted = m; if (m) sound.stopMusic(); else if (musicOn) sound.startMusic(); },
        setMusicOn: (on) => { musicOn = on; if (!on) sound.stopMusic(); else if (!soundMuted) sound.startMusic(); }
    };

    // LocalStorage helpers
    const storage = {
        getHighScore: () => parseInt(localStorage.getItem('sabuyahHigh')) || 0,
        setHighScore: (val) => localStorage.setItem('sabuyahHigh', val),
        getAttempts: () => parseInt(localStorage.getItem('sabuyahAttempts')) || 0,
        incAttempts: () => localStorage.setItem('sabuyahAttempts', (storage.getAttempts()+1)),
        getDifficulty: () => localStorage.getItem('sabuyahDiff') || 'normal',
        setDifficulty: (d) => localStorage.setItem('sabuyahDiff', d),
        getSoundEnabled: () => localStorage.getItem('sabuyahSound') !== 'false',
        setSoundEnabled: (val) => localStorage.setItem('sabuyahSound', val),
        getMusicEnabled: () => localStorage.getItem('sabuyahMusic') !== 'false',
        setMusicEnabled: (val) => localStorage.setItem('sabuyahMusic', val)
    };

    // Collision helper (AABB)
    function collide(r1, r2) {
        return !(r2.x > r1.x + r1.w ||
            r2.x + r2.w < r1.x ||
            r2.y > r1.y + r1.h ||
            r2.y + r2.h < r1.y);
    }

    return { sound, storage, collide, initAudio: initAudio };
})();
