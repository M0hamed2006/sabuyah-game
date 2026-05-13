// ==================== PLAYER ====================
window.Player = class Player {
    constructor(canvasWidth, canvasHeight) {
        this.w = 42;
        this.h = 50;
        this.lane = 1;          // 0,1,2 (3 lanes)
        this.lanesX = [
            canvasWidth/3/2 - this.w/2,
            canvasWidth/3 + canvasWidth/3/2 - this.w/2,
            canvasWidth/3*2 + canvasWidth/3/2 - this.w/2
        ];
        this.x = this.lanesX[this.lane];
        this.y = canvasHeight - this.h - 20;
        this.baseY = this.y;
        this.jumping = false;
        this.ducking = false;
        this.jumpVel = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.jetpack = false;
        this.jetpackTimer = 0;
        this.extraSpeed = 0;
    }

    update(canvasHeight) {
        if (this.jetpack) {
            this.jetpackTimer--;
            if (this.jetpackTimer <= 0) this.jetpack = false;
            this.y = this.baseY - 70 + Math.sin(Date.now() * 0.01) * 8;
        } else {
            if (this.jumping) {
                this.y += this.jumpVel;
                this.jumpVel += 0.6;
                if (this.y >= this.baseY) {
                    this.y = this.baseY;
                    this.jumping = false;
                    this.jumpVel = 0;
                }
            } else {
                this.y = this.baseY;
            }
        }
        // الانزلاق
        if (this.ducking && !this.jumping) {
            this.h = 25;
            this.y = this.baseY + 25;
        } else {
            this.h = 50;
            if (!this.jumping && !this.jetpack) this.y = this.baseY;
        }
        // الحماية
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }
    }

    moveLeft() { if (this.lane > 0) { this.lane--; this.x = this.lanesX[this.lane]; utils.sound.click(); } }
    moveRight() { if (this.lane < 2) { this.lane++; this.x = this.lanesX[this.lane]; utils.sound.click(); } }
    jump() { if (!this.jumping && !this.jetpack) { this.jumping = true; this.jumpVel = -12; utils.sound.jump(); } }
    duck() { if (!this.jumping) { this.ducking = true; utils.sound.slide(); } }
    stand() { this.ducking = false; }
    activateJetpack() { this.jetpack = true; this.jetpackTimer = 300; this.jumping = false; }
    activateInvincible(dur=180) { this.invincible = true; this.invincibleTimer = dur; }

    draw(ctx, frameCounter) {
        ctx.save();
        // ظل ذهبي للحماية أو تمييز
        if (this.invincible) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
        } else {
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(0,0,0,0.3)";
        }
        ctx.fillStyle = this.invincible ? (frameCounter%10<5 ? '#ffaa44' : '#ff6600') : '#ff6600';
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.w, this.h, 12);
        ctx.fill();
        // وجه
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x+12, this.y+14, 5, 0, Math.PI*2);
        ctx.arc(this.x+this.w-12, this.y+14, 5, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x+11, this.y+13, 2, 0, Math.PI*2);
        ctx.arc(this.x+this.w-13, this.y+13, 2, 0, Math.PI*2);
        ctx.fill();
        // تاج
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(this.x+this.w/2-12, this.y-5);
        ctx.lineTo(this.x+this.w/2, this.y-18);
        ctx.lineTo(this.x+this.w/2+12, this.y-5);
        ctx.fill();
        ctx.restore();
    }
};
