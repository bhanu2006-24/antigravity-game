export default class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.speed = 300; // Pixels per second
        this.color = '#00f3ff';

        this.stats = {
            hp: 100,
            maxHp: 100,
            xp: 0,
            maxXp: 100,
            level: 1
        };

        // Dash properties
        this.dashCooldown = 0;
        this.dashDuration = 0;
        this.isDashing = false;
    }

    takeDamage(amount) {
        if (this.isDashing) return; // Invulnerable while dashing
        this.stats.hp = Math.max(0, this.stats.hp - amount);
    }

    gainXp(amount) {
        this.stats.xp += amount;
        if (this.stats.xp >= this.stats.maxXp) {
            this.stats.xp -= this.stats.maxXp;
            this.stats.level++;
            this.stats.maxXp = Math.floor(this.stats.maxXp * 1.5);
            this.stats.maxHp += 20;
            this.stats.hp = this.stats.maxHp;
            // Visual effect for level up could go here
        }
    }

    update(dt, input, map, particleSystem) {
        // Dash Input
        if (input.isKeyDown('Space') && this.dashCooldown <= 0) {
            this.isDashing = true;
            this.dashDuration = 0.2; // 200ms dash
            this.dashCooldown = 1.0; // 1s cooldown
        }

        if (this.dashCooldown > 0) this.dashCooldown -= dt;

        let currentSpeed = this.speed;
        if (this.isDashing) {
            this.dashDuration -= dt;
            currentSpeed *= 3; // Triple speed
            particleSystem.emit(this.x, this.y, '#00f3ff', 2); // Trail effect

            if (this.dashDuration <= 0) {
                this.isDashing = false;
            }
        }

        const axis = input.getAxis();

        if (axis.x !== 0 || axis.y !== 0) {
            const newX = this.x + axis.x * currentSpeed * dt;
            const newY = this.y + axis.y * currentSpeed * dt;

            // Check X axis
            if (!map.checkCollision(newX, this.y, this.radius)) {
                this.x = newX;
            }

            // Check Y axis
            if (!map.checkCollision(this.x, newY, this.radius)) {
                this.y = newY;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw Player Body (Circle for now)
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Draw Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.stroke();

        ctx.restore();
    }
}
