export default class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = { x: 0, y: 0 };
        this.shake = { x: 0, y: 0, duration: 0, intensity: 0 };
        this.resize();

        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;
    }

    clear() {
        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    triggerShake(duration, intensity) {
        this.shake.duration = duration;
        this.shake.intensity = intensity;
    }

    update(dt) {
        if (this.shake.duration > 0) {
            this.shake.duration -= dt;
            this.shake.x = (Math.random() - 0.5) * 2 * this.shake.intensity;
            this.shake.y = (Math.random() - 0.5) * 2 * this.shake.intensity;
        } else {
            this.shake.x = 0;
            this.shake.y = 0;
        }
    }

    withCamera(callback) {
        this.ctx.save();
        this.ctx.translate(-this.camera.x + this.shake.x, -this.camera.y + this.shake.y);
        callback();
        this.ctx.restore();
    }

    get width() {
        return this.canvas.width;
    }

    get height() {
        return this.canvas.height;
    }
}
