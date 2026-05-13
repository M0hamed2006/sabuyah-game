// ==================== ENEMY (المطارد) ====================
window.Enemy = class Enemy {
    constructor(canvasWidth, canvasHeight, playerRef) {
        this.w = 40;
        this.h = 48;
        this.x = canvasWidth/2;
        this.y = canvasHeight - this.h - 20;
        this.speed = 4;   // سرعة الحركة خلف اللاعب
        this.player = playerRef;
        this.lane = 1;
        this.lanesX = [
            canvasWidth/3/2 - this.w/2,
            canvasWidth/3 + canvasWidth/3/2 - this.w/2,
            canvasWidth/3*2 + canvasWidth/3/2 - this.w/2
        ];
        this.updateLane();
    }

    updateLane() {
        this.x = this.lanesX[this.lane];
    }

    update(gameSpeed) {
        // يتحرك خلف اللاعب: يحاول محاكاة مساره
        let targetLane = this.player.lane;
        if (this.lane < targetLane) this.lane++;
        else if (this.lane > targetLane) this.lane--;
        this.updateLane();
        // سرعة العدو تزيد مع سرعة اللعبة
        this.speed = gameSpeed * 0.8 + 2;
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = '#2c3e50';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.w, this.h, 10);
        ctx.fill();
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(this.x+5, this.y-5, 8, 8);
        ctx.fillRect(this.x+this.w-13, this.y-5, 8, 8);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x+10, this.y+15, 4, 0, Math.PI*2);
        ctx.arc(this.x+this.w-10, this.y+15, 4, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x+9, this.y+14, 2, 0, Math.PI*2);
        ctx.arc(this.x+this.w-11, this.y+14, 2, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
    }

    getRect() {
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }
};
