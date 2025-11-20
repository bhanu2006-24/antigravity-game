export default class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'speed', 'shield'
        this.radius = 12;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.rotation = 0;
    }

    update(dt) {
        this.bobOffset += dt * 3;
        this.rotation += dt * 2;
    }

    draw(ctx) {
        const bobY = Math.sin(this.bobOffset) * 5;

        ctx.save();
        ctx.translate(this.x, this.y + bobY);
        ctx.rotate(this.rotation);

        ctx.beginPath();
        if (this.type === 'speed') {
            // Lightning bolt shape (simplified as triangle for now)
            ctx.moveTo(0, -10);
            ctx.lineTo(8, 5);
            ctx.lineTo(-8, 5);
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
        } else {
            // Shield shape (circle)
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fillStyle = '#ffaa00';
            ctx.shadowColor = '#ffaa00';
        }

        ctx.fill();
        ctx.shadowBlur = 15;
        ctx.stroke();

        ctx.restore();
    }
}
