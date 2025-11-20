export default class Collectible {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'xp' or 'health'
        this.radius = 8;
        this.value = type === 'xp' ? 10 : 20;
        this.bobOffset = Math.random() * Math.PI * 2;
    }

    update(dt) {
        this.bobOffset += dt * 5;
    }

    draw(ctx) {
        const bobY = Math.sin(this.bobOffset) * 5;

        ctx.save();
        ctx.translate(this.x, this.y + bobY);

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);

        if (this.type === 'xp') {
            ctx.fillStyle = '#00ff00';
            ctx.shadowColor = '#00ff00';
        } else {
            ctx.fillStyle = '#ff0055';
            ctx.shadowColor = '#ff0055';
        }

        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.stroke();

        ctx.restore();
    }
}
