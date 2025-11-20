import InputHandler from './InputHandler.js';
import Renderer from './Renderer.js';
import Player from './entities/Player.js';
import Enemy from './entities/Enemy.js';
import Collectible from './entities/Collectible.js';
import Map from './world/Map.js';
import UIManager from './ui/UIManager.js';
import ParticleSystem from './effects/ParticleSystem.js';
import SoundManager from './SoundManager.js';

export default class Game {
    constructor(canvas) {
        this.renderer = new Renderer(canvas);
        this.input = new InputHandler();
        this.map = new Map(50, 50, 64);
        this.player = new Player(this.renderer.width / 2, this.renderer.height / 2);
        this.ui = new UIManager();
        this.particles = new ParticleSystem();
        this.sound = new SoundManager();
        this.enemies = [];
        this.collectibles = [];

        // Game State
        this.state = 'MENU';
        this.currentLevel = 1;
        this.maxLevels = 3;
        this.goal = { x: 0, y: 0, radius: 30 };

        this.setupLevel(1);

        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.timeStep = 1000 / 60;
    }

    setupLevel(level) {
        this.currentLevel = level;

        // Reset Player Position (Safe Zone)
        this.player.x = 100;
        this.player.y = 100;

        // Generate Map (Procedural-ish)
        // For now, just clear area around start
        this.map = new Map(50 + level * 10, 50 + level * 10, 64); // Larger map per level

        // Ensure start area is clear
        for (let y = 0; y < 5; y++) {
            for (let x = 0; x < 5; x++) {
                this.map.setTile(x, y, 0);
            }
        }

        // Place Goal far away
        this.goal.x = (this.map.width - 2) * this.map.tileSize;
        this.goal.y = (this.map.height - 2) * this.map.tileSize;
        // Clear goal area
        this.map.setTile(this.map.width - 2, this.map.height - 2, 0);

        // Spawn Enemies
        this.enemies = [];
        const enemyCount = level * 8 + 5;
        for (let i = 0; i < enemyCount; i++) {
            this.spawnEntity(Enemy, this.enemies);
        }

        // Spawn Collectibles
        this.collectibles = [];
        const itemCount = level * 5 + 10;
        for (let i = 0; i < itemCount; i++) {
            const type = Math.random() > 0.3 ? 'xp' : 'health';
            this.spawnEntity(Collectible, this.collectibles, type);
        }
    }

    spawnEntity(Class, list, ...args) {
        let ex, ey;
        let attempts = 0;
        do {
            ex = Math.random() * (this.map.width * this.map.tileSize);
            ey = Math.random() * (this.map.height * this.map.tileSize);
            attempts++;
        } while ((this.map.checkCollision(ex, ey, 20) || Math.abs(ex - this.player.x) < 500) && attempts < 100);

        if (attempts < 100) {
            list.push(new Class(ex, ey, ...args));
        }
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
        this.renderer.update(dt); // Update Shake

        if (this.state === 'MENU') {
            if (this.input.isKeyDown('Enter')) {
                this.state = 'PLAYING';
                this.setupLevel(1);
                this.sound.playCollect(); // Start sound
            }
            return;
        }

        if (this.state === 'GAMEOVER' || this.state === 'WIN') {
            if (this.input.isKeyDown('Enter')) {
                this.player = new Player(100, 100);
                this.particles = new ParticleSystem();
                this.state = 'PLAYING';
                this.setupLevel(1);
                this.sound.playCollect();
            }
            return;
        }

        // Check Dash Sound
        if (this.input.isKeyDown('Space') && this.player.dashCooldown <= 0) {
            this.sound.playDash();
        }

        this.player.update(dt, this.input, this.map, this.particles);
        this.particles.update();
        this.ui.update(this.player);

        // Update Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt, this.player, this.map);

            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.player.radius + enemy.radius) {
                if (this.player.isDashing) {
                    this.particles.emit(enemy.x, enemy.y, '#ff0055', 10);
                    this.enemies.splice(i, 1);
                    this.player.gainXp(20);
                    this.sound.playHit();
                    this.renderer.triggerShake(0.1, 5); // Shake on kill
                } else {
                    this.player.takeDamage(1);
                    this.particles.emit(this.player.x, this.player.y, '#ff0000', 2);
                    if (Math.random() < 0.1) this.renderer.triggerShake(0.1, 2); // Shake on hit
                }
            }
        }

        // Update Collectibles
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const item = this.collectibles[i];
            item.update(dt);

            const dx = this.player.x - item.x;
            const dy = this.player.y - item.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.player.radius + item.radius) {
                if (item.type === 'xp') {
                    this.player.gainXp(item.value);
                    this.particles.emit(item.x, item.y, '#00ff00', 5);
                } else {
                    this.player.stats.hp = Math.min(this.player.stats.maxHp, this.player.stats.hp + item.value);
                    this.particles.emit(item.x, item.y, '#ff0055', 5);
                }
                this.sound.playCollect();
                this.collectibles.splice(i, 1);
            }
        }

        // Check Goal / Level Up
        const dx = this.player.x - this.goal.x;
        const dy = this.player.y - this.goal.y;
        if (Math.sqrt(dx * dx + dy * dy) < this.player.radius + this.goal.radius) {
            if (this.currentLevel < this.maxLevels) {
                this.setupLevel(this.currentLevel + 1);
                this.particles.emit(this.player.x, this.player.y, '#ffff00', 20);
                this.sound.playLevelUp();
            } else {
                this.state = 'WIN';
                this.sound.playLevelUp();
            }
        }

        if (this.player.stats.hp <= 0) {
            this.state = 'GAMEOVER';
            this.sound.playHit(); // Game over sound
        }

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

            for (const item of this.collectibles) {
                item.draw(this.renderer.ctx);
            }

            for (const enemy of this.enemies) {
                enemy.draw(this.renderer.ctx);
            }

            this.player.draw(this.renderer.ctx);
        });

        // Draw Level Indicator
        this.renderer.ctx.fillStyle = '#ffffff';
        this.renderer.ctx.font = '20px monospace';
        this.renderer.ctx.textAlign = 'right';
        this.renderer.ctx.fillText(`LEVEL ${this.currentLevel}`, this.renderer.width - 20, 40);

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
