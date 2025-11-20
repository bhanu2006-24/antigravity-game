export default class Enemy {
    constructor(x, y, type = 'normal') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 15;
        this.speed = 150;
        this.color = '#ff0055';
        this.isDead = false;

        // Type specific stats
        if (this.type === 'fast') {
            this.speed = 250;
            this.color = '#ffaa00';
            this.radius = 12;
        } else if (this.type === 'tank') {
            this.speed = 80;
            this.color = '#aa00ff';
            this.radius = 20;
            this.hp = 3; // Takes 3 hits (simulated by not dying immediately)
        } else {
            this.hp = 1;
        }
    }

    update(dt, player, map) {
        if (this.isDead) return;

        // Simple AI: Chase Player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const moveX = (dx / dist) * this.speed * dt;
            const moveY = (dy / dist) * this.speed * dt;

            // Collision with Map
            if (!map.checkCollision(this.x + moveX, this.y, this.radius)) {
                this.x += moveX;
            }
            if (!map.checkCollision(this.x, this.y + moveY, this.radius)) {
                this.y += moveY;
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.isDead = true;
        }
    }

    draw(ctx) {
        if (this.isDead) return;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 5, this.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}
