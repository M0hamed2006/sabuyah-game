
            tech: 'قولي عن البرمجة',
            movies: 'أفلام مصرية',
            islam: 'أحاديث نبوية',
            science: 'اكتشافات علمية',
            business: 'نصائح تجارية'
        };
        const msg = prompts[topic] || topic;
        document.getElementById('chatInput').value = msg;
        this.sendMessage();
    }
}

// Initialize
let ai;
window.addEventListener('DOMContentLoaded', () => {
    ai = new EgyptianAI();
});
