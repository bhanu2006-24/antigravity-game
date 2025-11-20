import InputHandler from './InputHandler.js';
import Renderer from './Renderer.js';
import Player from './entities/Player.js';
import Map from './world/Map.js';
import UIManager from './ui/UIManager.js';
import ParticleSystem from './effects/ParticleSystem.js';

export default class Game {
    constructor(canvas) {
        this.renderer = new Renderer(canvas);
        this.input = new InputHandler();
        this.map = new Map(50, 50, 64);
        this.player = new Player(this.renderer.width / 2, this.renderer.height / 2);
        this.ui = new UIManager();
        this.particles = new ParticleSystem();

        // Game State
        this.state = 'MENU'; // MENU, PLAYING, GAMEOVER, WIN
        this.goal = { x: 48 * 64, y: 48 * 64, radius: 30 }; // Goal at bottom right

        // Ensure player doesn't start in a wall
        while (this.map.checkCollision(this.player.x, this.player.y, this.player.radius)) {
            this.player.x += 64;
            this.player.y += 64;
        }

        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.timeStep = 1000 / 60;
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame((timestamp) => this.loop(timestamp));
    }

    loop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        this.accumulatedTime += deltaTime;

        while (this.accumulatedTime >= this.timeStep) {
            this.update(this.timeStep / 1000);
            this.accumulatedTime -= this.timeStep;
        }

        this.draw();
        requestAnimationFrame((timestamp) => this.loop(timestamp));
    }

    update(dt) {
        if (this.state === 'MENU') {
            if (this.input.isKeyDown('Enter')) {
                this.state = 'PLAYING';
            }
            return;
        }

        if (this.state === 'GAMEOVER' || this.state === 'WIN') {
            if (this.input.isKeyDown('Enter')) {
                // Reset Game
                this.player = new Player(this.renderer.width / 2, this.renderer.height / 2);
                this.particles = new ParticleSystem();
                this.state = 'PLAYING';
                while (this.map.checkCollision(this.player.x, this.player.y, this.player.radius)) {
                    this.player.x += 64;
                    this.player.y += 64;
                }
            }
            return;
        }

        this.player.update(dt, this.input, this.map, this.particles);
        this.particles.update();
        this.ui.update(this.player);

        // Check Win
        const dx = this.player.x - this.goal.x;
        const dy = this.player.y - this.goal.y;
        if (Math.sqrt(dx * dx + dy * dy) < this.player.radius + this.goal.radius) {
            this.state = 'WIN';
        }

        // Check Game Over
        if (this.player.stats.hp <= 0) {
            this.state = 'GAMEOVER';
        }

        // Update Camera to follow player
        this.renderer.camera.x = this.player.x - this.renderer.width / 2;
        this.renderer.camera.y = this.player.y - this.renderer.height / 2;
    }

    draw() {
        this.renderer.clear();

        if (this.state === 'MENU') {
            this.drawMenu();
            return;
        }

        this.renderer.withCamera(() => {
            this.map.draw(this.renderer.ctx, {
                x: this.renderer.camera.x,
                y: this.renderer.camera.y,
                width: this.renderer.width,
                height: this.renderer.height
            });

            // Draw Goal
            this.renderer.ctx.beginPath();
            this.renderer.ctx.arc(this.goal.x, this.goal.y, this.goal.radius, 0, Math.PI * 2);
            this.renderer.ctx.fillStyle = '#ffff00';
            this.renderer.ctx.fill();
            this.renderer.ctx.shadowBlur = 20;
            this.renderer.ctx.shadowColor = '#ffff00';
            this.renderer.ctx.stroke();
            this.renderer.ctx.shadowBlur = 0;

            this.particles.draw(this.renderer.ctx);
            this.player.draw(this.renderer.ctx);
        });

        if (this.state === 'GAMEOVER') {
            this.drawGameOver();
        } else if (this.state === 'WIN') {
            this.drawWin();
        }
    }

    drawMenu() {
        const ctx = this.renderer.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.renderer.width, this.renderer.height);

        ctx.fillStyle = '#00f3ff';
        ctx.font = '40px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('ANTIGRAVITY RPG', this.renderer.width / 2, this.renderer.height / 2 - 50);

        ctx.font = '20px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Press ENTER to Start', this.renderer.width / 2, this.renderer.height / 2 + 20);
        ctx.fillText('WASD to Move | SPACE to Dash', this.renderer.width / 2, this.renderer.height / 2 + 60);
    }

    drawGameOver() {
        const ctx = this.renderer.ctx;
        ctx.fillStyle = 'rgba(50, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.renderer.width, this.renderer.height);

        ctx.fillStyle = '#ff0055';
        ctx.font = '50px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.renderer.width / 2, this.renderer.height / 2);

        ctx.font = '20px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Press ENTER to Restart', this.renderer.width / 2, this.renderer.height / 2 + 50);
    }

    drawWin() {
        const ctx = this.renderer.ctx;
        ctx.fillStyle = 'rgba(0, 50, 0, 0.7)';
        ctx.fillRect(0, 0, this.renderer.width, this.renderer.height);

        ctx.fillStyle = '#00ff00';
        ctx.font = '50px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION ACCOMPLISHED', this.renderer.width / 2, this.renderer.height / 2);

        ctx.font = '20px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Press ENTER to Play Again', this.renderer.width / 2, this.renderer.height / 2 + 50);
    }
}
