export default class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.speed = 100; // Slower than player
        this.color = '#ff0055';
        this.isDead = false;
    }

    update(dt, player, map) {
        if (this.isDead) return;

        // Simple Chase AI
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            const moveX = (dx / dist) * this.speed * dt;
            const moveY = (dy / dist) * this.speed * dt;

            const newX = this.x + moveX;
            const newY = this.y + moveY;

            // Collision check with walls
            if (!map.checkCollision(newX, this.y, this.radius)) {
                this.x = newX;
            }
            if (!map.checkCollision(this.x, newY, this.radius)) {
                this.y = newY;
            }
        }
    }

    draw(ctx) {
        if (this.isDead) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.stroke();

        ctx.restore();
    }
}
