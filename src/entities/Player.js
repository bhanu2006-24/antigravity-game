export default class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12; // Slightly smaller to avoid getting stuck
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

        this.buffs = {
            speed: 0,
            shield: 0
        };
        this.hasShield = false;
        this.baseSpeed = this.speed;
    }

    applyBuff(type, duration) {
        if (type === 'speed') {
            this.buffs.speed = duration;
        } else if (type === 'shield') {
            this.buffs.shield = duration;
        }
    }

    takeDamage(amount) {
        if (this.isDashing || this.hasShield) return; // Invulnerable while dashing or shielded
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

    update(dt, input, map, particles) {
        // Update Buffs
        if (this.buffs.speed > 0) {
            this.buffs.speed -= dt;
            this.speed = this.baseSpeed * 1.5;
        } else {
            this.speed = this.baseSpeed;
        }

        if (this.buffs.shield > 0) {
            this.buffs.shield -= dt;
            this.hasShield = true;
        } else {
            this.hasShield = false;
        }

        // Movement
        const axis = input.getAxis();
        let dx = axis.x;
        let dy = axis.y;

        // Dash Logic
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (this.dashDuration > 0) {
            this.dashDuration -= dt;
            this.isDashing = true;
            // Dash movement (forced forward)
            // For simplicity, we just keep current velocity or boost speed
            // But here we just multiply speed
        } else {
            this.isDashing = false;
        }

        if (input.isKeyDown('Space') && this.dashCooldown <= 0) {
            this.dashCooldown = 1.0;
            this.dashDuration = 0.2;
            // Add burst of speed
            // We need to store dash direction if we want it to be locked
        }

        const currentSpeed = this.isDashing ? this.speed * 3 : this.speed;

        const moveX = dx * currentSpeed * dt;
        const moveY = dy * currentSpeed * dt;

        // Collision Detection
        if (!map.checkCollision(this.x + moveX, this.y, this.radius)) {
            this.x += moveX;
        }
        if (!map.checkCollision(this.x, this.y + moveY, this.radius)) {
            this.y += moveY;
        }

        // Particles
        if (this.isDashing) {
            particles.emit(this.x, this.y, '#00f3ff', 2);
        }
        if (this.hasShield) {
            if (Math.random() < 0.2) particles.emit(this.x, this.y, '#ffaa00', 1);
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.isDashing ? '#ffffff' : this.color;
        ctx.fill();

        // Glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Shield Visual
        if (this.hasShield) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}
