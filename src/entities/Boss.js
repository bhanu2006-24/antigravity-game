import Enemy from './Enemy.js';

export default class Boss extends Enemy {
    constructor(x, y) {
        super(x, y, 'tank'); // Inherit tank properties initially
        this.radius = 40;
        this.color = '#ff0000';
        this.hp = 500;
        this.maxHp = 500;
        this.speed = 80;

        this.attackCooldown = 0;
        this.attackInterval = 2.0; // Seconds between attacks
    }

    update(dt, player, map, projectiles) {
        super.update(dt, player, map);

        // Boss Logic
        this.attackCooldown -= dt;
        if (this.attackCooldown <= 0) {
            this.attack(player, projectiles);
            this.attackCooldown = this.attackInterval;
        }
    }

    attack(player, projectiles) {
        // Shoot 8 projectiles in a circle
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const speed = 200;
            projectiles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 8,
                color: '#ffff00',
                life: 3.0 // Seconds
            });
        }
    }

    draw(ctx) {
        if (this.isDead) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Boss Body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // Inner Core
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = '#aa0000';
        ctx.fill();

        // Health Bar
        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = '#330000';
        ctx.fillRect(-30, -50, 60, 10);
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-30, -50, 60 * hpPercent, 10);

        // Glow
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff0000';
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
    }
}
