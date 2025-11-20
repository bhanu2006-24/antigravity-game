export default class Minimap {
    constructor(size, range) {
        this.size = size;
        this.range = range; // Range in world pixels to show
        this.radius = size / 2;

        this.canvas = document.createElement('canvas');
        this.canvas.width = size;
        this.canvas.height = size;
        this.canvas.style.position = 'absolute';
        this.canvas.style.bottom = '20px';
        this.canvas.style.left = '20px'; // Bottom-Left
        this.canvas.style.border = '2px solid #00f3ff';
        this.canvas.style.backgroundColor = 'rgba(0, 10, 20, 0.8)';
        this.canvas.style.borderRadius = '50%';
        this.canvas.style.overflow = 'hidden';
        this.canvas.style.boxShadow = '0 0 10px #00f3ff';

        document.getElementById('ui-layer').appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }

    update(player, enemies, goal, collectibles, powerups) {
        this.ctx.clearRect(0, 0, this.size, this.size);

        // Draw Radar Grid / Rings
        this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(this.radius, this.radius, this.radius * 0.33, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.arc(this.radius, this.radius, this.radius * 0.66, 0, Math.PI * 2);
        this.ctx.stroke();

        // Draw Goal (Yellow)
        this.drawDotRelative(goal.x, goal.y, player.x, player.y, '#ffff00', 6, true);

        // Draw Enemies (Red)
        for (const enemy of enemies) {
            this.drawDotRelative(enemy.x, enemy.y, player.x, player.y, '#ff0055', 4);
        }

        // Draw Collectibles (Green/Pink)
        for (const item of collectibles) {
            const color = item.type === 'xp' ? '#00ff00' : '#ff00aa';
            this.drawDotRelative(item.x, item.y, player.x, player.y, color, 2);
        }

        // Draw Powerups (Cyan/Orange)
        if (powerups) {
            for (const p of powerups) {
                const color = p.type === 'speed' ? '#00ffff' : '#ffaa00';
                this.drawDotRelative(p.x, p.y, player.x, player.y, color, 3, true);
            }
        }

        // Draw Player (Always Center - Blue Arrow)
        this.ctx.save();
        this.ctx.translate(this.radius, this.radius);
        // Rotate based on movement if we had direction, but for now just a dot/triangle
        this.ctx.beginPath();
        this.ctx.moveTo(0, -5);
        this.ctx.lineTo(4, 5);
        this.ctx.lineTo(-4, 5);
        this.ctx.closePath();
        this.ctx.fillStyle = '#00f3ff';
        this.ctx.fill();
        this.ctx.restore();
    }

    drawDotRelative(x, y, px, py, color, radius, pulse = false) {
        const dx = x - px;
        const dy = y - py;

        // Check if within range
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this.range) return; // Out of radar range

        // Scale to minimap size
        const scale = this.radius / this.range;

        const mx = this.radius + dx * scale;
        const my = this.radius + dy * scale;

        this.ctx.beginPath();
        this.ctx.arc(mx, my, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();

        if (pulse) {
            this.ctx.beginPath();
            this.ctx.arc(mx, my, radius + Math.sin(Date.now() / 200) * 2, 0, Math.PI * 2);
            this.ctx.strokeStyle = color;
            this.ctx.stroke();
        }
    }
}
