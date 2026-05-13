// ==================== SPAWNER: العقبات، العملات، الباور يب ====================
window.Spawner = class Spawner {
    constructor(canvasWidth, canvasHeight, lanesX, playerLaneGetter) {
        this.canvasW = canvasWidth;
        this.canvasH = canvasHeight;
        this.lanesX = lanesX;
        this.getPlayerLane = playerLaneGetter;
        this.obstacles = [];
        this.coins = [];
        this.powerups = [];
        this.frame = 0;
    }

    spawnObstacle() {
        let lane = Math.floor(Math.random() * 3);
        let type = Math.random() < 0.5 ? 'train' : (Math.random() < 0.6 ? 'car' : 'barrier');
        this.obstacles.push({
            x: this.lanesX[lane] + (42-38)/2,
            y: -48,
            w: 38, h: 48,
            type: type,
            update: function(speed) { this.y += speed; },
            draw: function(ctx) {
                ctx.fillStyle = this.type==='train' ? '#4a4a5a' : (this.type==='car' ? '#2299ff' : '#8B4513');
                ctx.fillRect(this.x, this.y, this.w, this.h);
                if(this.type==='train') {
                    ctx.fillStyle='#ff4444';
                    ctx.fillRect(this.x+5,this.y-3,8,6);
                    ctx.fillRect(this.x+this.w-13,this.y-3,8,6);
                }
                if(this.type==='car') {
                    ctx.fillStyle='#333';
                    ctx.fillRect(this.x+5,this.y+8,6,10);
                    ctx.fillRect(this.x+this.w-11,this.y+8,6,10);
                }
            },
            offScreen: function() { return this.y > this.canvasH; }.bind(this)
        });
    }

    spawnCoin() {
        let lane = Math.floor(Math.random() * 3);
        this.coins.push({
            x: this.lanesX[lane] + 21 - 12,
            y: -24,
            s: 24,
            update: function(speed) { this.y += speed; },
            draw: function(ctx) {
                ctx.fillStyle='#ffd700';
                ctx.beginPath();
                ctx.arc(this.x+this.s/2, this.y+this.s/2, this.s/2, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle='#b87c00';
                ctx.font='bold 18px monospace';
                ctx.fillText('$', this.x+this.s/2-6, this.y+this.s/2+4);
            },
            offScreen: function() { return this.y > this.canvasH; }
        });
    }

    spawnPowerUp() {
        let lane = Math.floor(Math.random() * 3);
        let kinds = ['magnet', 'jetpack', 'shield', '2x'];
        let kind = kinds[Math.floor(Math.random() * 4)];
        this.powerups.push({
            x: this.lanesX[lane] + 21 - 14,
            y: -28,
            s: 28,
            kind: kind,
            update: function(speed) { this.y += speed; },
            draw: function(ctx) {
                ctx.fillStyle = this.kind==='magnet' ? '#ffaa44' : (this.kind==='jetpack' ? '#44aaff' : (this.kind==='shield' ? '#00ffcc' : '#ff44ff'));
                ctx.fillRect(this.x, this.y, this.s, this.s);
                ctx.fillStyle='white';
                ctx.font='bold 18px monospace';
                let emoji = { magnet:'🧲', jetpack:'✈️', shield:'🛡️', '2x':'×2' }[this.kind];
                ctx.fillText(emoji, this.x+4, this.y+22);
            },
            offScreen: function() { return this.y > this.canvasH; }
        });
    }

    updateAll(speed, frameCount) {
        // تحديث المواقع
        [...this.obstacles, ...this.coins, ...this.powerups].forEach(item => item.update(speed));
        // إزالة خارج الشاشة
        this.obstacles = this.obstacles.filter(o => !o.offScreen());
        this.coins = this.coins.filter(c => !c.offScreen());
        this.powerups = this.powerups.filter(p => !p.offScreen());

        // توليد جديد
        let spawnGap = Math.max(30, 45 - Math.floor(frameCount/200));
        if (frameCount % spawnGap === 0) this.spawnObstacle();
        if (frameCount % 45 === 0) this.spawnCoin();
        if (frameCount % 150 === 0 && Math.random() < 0.4) this.spawnPowerUp();
    }

    drawAll(ctx) {
        this.obstacles.forEach(o => o.draw(ctx));
        this.coins.forEach(c => c.draw(ctx));
        this.powerups.forEach(p => p.draw(ctx));
    }

    getCollidables() {
        return {
            obstacles: this.obstacles,
            coins: this.coins,
            powerups: this.powerups
        };
    }
};
