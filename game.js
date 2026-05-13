// ... (الإبقاء على كود الصوت والتعريفات الأساسية كما هي)

class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.speedX = (Math.random() - 0.5) * 8;
        this.speedY = (Math.random() - 0.5) * 8;
        this.life = 1.0;
    }
    update() {
        this.x += this.speedX; this.y += this.speedY;
        this.life -= 0.02;
    }
    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI*2);
        ctx.fill();
    }
}

let particles = [];

// تطوير دالة الرسم الأساسية
function draw() {
    // 1. رسم الخلفية المتدرجة
    let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a0a2e');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. رسم خطوط الطريق بتأثير النيون
    ctx.strokeStyle = 'rgba(0, 242, 255, 0.2)';
    ctx.lineWidth = 4;
    for(let i=1; i<3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * LANE_W, 0);
        ctx.lineTo(i * LANE_W, canvas.height);
        ctx.stroke();
        
        // رسم تأثير الـ Glow على الخطوط
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'var(--primary)';
    }

    // 3. رسم الجزيئات (Particles)
    particles.forEach((p, i) => {
        p.update();
        p.draw();
        if(p.life <= 0) particles.splice(i, 1);
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // 4. رسم اللاعب (بشكل احترافي)
    player.draw();

    // 5. رسم العوائق والعملات
    obstacles.forEach(o => {
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'red';
        o.draw();
    });
    
    coins.forEach(c => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'gold';
        c.draw();
    });
}

// تعديل Collision لعمل انفجار جزيئات
function triggerExplosion(x, y, color) {
    for(let i=0; i<15; i++) particles.push(new Particle(x, y, color));
}

// في دالة التحديث عند لمس العملة:
// triggerExplosion(c.x, c.y, '#ffd700');
