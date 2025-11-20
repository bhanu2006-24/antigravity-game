import InputHandler from './InputHandler.js';
import Renderer from './Renderer.js';
import Player from './entities/Player.js';
import Enemy from './entities/Enemy.js';
import Boss from './entities/Boss.js';
import Collectible from './entities/Collectible.js';
import PowerUp from './entities/PowerUp.js';
import Map from './world/Map.js';
import UIManager from './ui/UIManager.js';
import ParticleSystem from './effects/ParticleSystem.js';
import SoundManager from './SoundManager.js';
// import Minimap from './ui/Minimap.js';

export default class Game {
    constructor(canvas) {
        this.renderer = new Renderer(canvas);
        this.input = new InputHandler();
        this.map = new Map(50, 50, 64);
        this.player = new Player(this.renderer.width / 2, this.renderer.height / 2);
        this.ui = new UIManager();
        this.particles = new ParticleSystem();
        this.sound = new SoundManager();
        // this.minimap = new Minimap(150, 1500); // Radar: 150px size, 1500px range
        this.enemies = [];
        this.collectibles = [];
        this.powerups = [];
        this.projectiles = [];

        // Game State
        this.state = 'MENU';
        this.currentLevel = 1;
        this.maxLevels = 3;
        this.goal = { x: 0, y: 0, radius: 30 };
        this.score = 0;

        this.setupLevel(1);

        this.lastTime = 0;
        this.accumulatedTime = 0;
        this.timeStep = 1000 / 60;
    }

    setupLevel(level) {
        this.currentLevel = level;
        this.projectiles = [];

        // Generate Map (Cellular Automata)
        // We need to ensure start and end are reachable.
        // Simple approach: Clear a path or just clear large areas.
        this.map = new Map(50 + level * 10, 50 + level * 10, 64);

        // Find a valid start position
        let startX = 5, startY = 5;
        this.clearArea(startX, startY, 3);
        this.player.x = startX * 64 + 32;
        this.player.y = startY * 64 + 32;

        // Find a valid goal position far away
        let goalX = this.map.width - 5;
        let goalY = this.map.height - 5;
        this.clearArea(goalX, goalY, 3);
        this.goal.x = goalX * 64 + 32;
        this.goal.y = goalY * 64 + 32;
        // Spawn Enemies
        this.enemies = [];

        if (level === 3) {
            // Boss Level
            this.spawnEntity(Boss, this.enemies);
            // Add some minions
            for (let i = 0; i < 10; i++) {
                this.spawnEntity(Enemy, this.enemies, 'normal');
            }
        } else {
            const enemyCount = level * 8 + 5;
            for (let i = 0; i < enemyCount; i++) {
                const rand = Math.random();
                let type = 'normal';
                if (rand > 0.7) type = 'fast';
                if (rand > 0.9) type = 'tank';
                this.spawnEntity(Enemy, this.enemies, type);
            }
        }

        this.collectibles = [];
        const itemCount = level * 5 + 10;
        for (let i = 0; i < itemCount; i++) {
            const type = Math.random() > 0.3 ? 'xp' : 'health';
            this.spawnEntity(Collectible, this.collectibles, type);
        }

        this.powerups = [];
        const powerupCount = level * 2 + 2;
        for (let i = 0; i < powerupCount; i++) {
            const type = Math.random() > 0.5 ? 'speed' : 'shield';
            this.spawnEntity(PowerUp, this.powerups, type);
        }
    }

    clearArea(cx, cy, radius) {
        for (let y = cy - radius; y <= cy + radius; y++) {
            for (let x = cx - radius; x <= cx + radius; x++) {
                this.map.setTile(x, y, 0);
            }
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
        this.renderer.update(dt);

        if (this.state === 'MENU') {
            if (this.input.isKeyDown('Enter')) {
                this.state = 'PLAYING';
                this.score = 0;
                this.setupLevel(1);
                this.sound.playCollect();
            }
            return;
        }

        if (this.state === 'GAMEOVER' || this.state === 'WIN') {
            if (this.input.isKeyDown('Enter')) {
                this.player = new Player(100, 100);
                this.particles = new ParticleSystem();
                this.state = 'PLAYING';
                this.score = 0;
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
        this.ui.update(this.player, this.score, this.enemies.length);
        // this.minimap.update(this.player, this.enemies, this.goal, this.collectibles, this.powerups);

        // Update Powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.update(dt);

            const dx = this.player.x - p.x;
            const dy = this.player.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.player.radius + p.radius) {
                if (p.type === 'speed') {
                    this.player.applyBuff('speed', 5.0); // 5 seconds speed
                    this.particles.emit(p.x, p.y, '#00ffff', 10);
                } else {
                    this.player.applyBuff('shield', 10.0); // 10 seconds shield
                    this.particles.emit(p.x, p.y, '#ffaa00', 10);
                }
                this.sound.playCollect();
                this.powerups.splice(i, 1);
            }
        }

        // Update Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;

            if (p.life <= 0 || this.map.checkCollision(p.x, p.y, p.radius)) {
                this.projectiles.splice(i, 1);
                continue;
            }

            // Hit Player
            const dx = this.player.x - p.x;
            const dy = this.player.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.player.radius + p.radius) {
                if (!this.player.isDashing && !this.player.hasShield) {
                    this.player.takeDamage(10);
                    this.particles.emit(this.player.x, this.player.y, '#ff0000', 5);
                    this.renderer.triggerShake(0.2, 5);
                    this.sound.playHit();
                }
                this.projectiles.splice(i, 1);
            }
        }

        // Update Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy instanceof Boss) {
                enemy.update(dt, this.player, this.map, this.projectiles);
            } else {
                enemy.update(dt, this.player, this.map);
            }

            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.player.radius + enemy.radius) {
                if (this.player.isDashing) {
                    if (enemy instanceof Boss) {
                        enemy.takeDamage(50); // Boss takes damage
                        this.particles.emit(enemy.x, enemy.y, '#ff0000', 5);
                        this.renderer.triggerShake(0.1, 3);
                        if (enemy.isDead) {
                            this.enemies.splice(i, 1);
                            this.score += 1000;
                            this.sound.playLevelUp(); // Boss kill sound
                        }
                    } else {
                        enemy.takeDamage(1); // Regular enemies take 1 damage
                        if (enemy.hp <= 0) {
                            this.particles.emit(enemy.x, enemy.y, '#ff0055', 10);
                            this.enemies.splice(i, 1);
                            this.player.gainXp(20);
                            this.score += 100;
                            this.sound.playHit();
                            this.renderer.triggerShake(0.1, 5);
                        } else {
                            // Knockback
                            const angle = Math.atan2(dy, dx);
                            enemy.x -= Math.cos(angle) * 20;
                            enemy.y -= Math.sin(angle) * 20;
                            this.particles.emit(enemy.x, enemy.y, '#ffffff', 2);
                            this.sound.playHit();
                        }
                    }
                } else {
                    if (!this.player.hasShield) {
                        this.player.takeDamage(1);
                        this.particles.emit(this.player.x, this.player.y, '#ff0000', 2);
                        if (Math.random() < 0.1) this.renderer.triggerShake(0.1, 2); // Shake on hit
                    }
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
                    this.score += 10;
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
                this.score += 500;
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

            for (const p of this.powerups) {
                p.draw(this.renderer.ctx);
            }

            for (const enemy of this.enemies) {
                enemy.draw(this.renderer.ctx);
            }

            for (const p of this.projectiles) {
                this.renderer.ctx.beginPath();
                this.renderer.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.renderer.ctx.fillStyle = p.color;
                this.renderer.ctx.fill();
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
        this.renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.renderer.ctx.fillRect(0, 0, this.renderer.width, this.renderer.height);

        this.renderer.ctx.fillStyle = '#00f3ff';
        this.renderer.ctx.font = '60px monospace';
        this.renderer.ctx.textAlign = 'center';
        this.renderer.ctx.fillText('ANTIGRAVITY', this.renderer.width / 2, this.renderer.height / 2 - 50);

        this.renderer.ctx.fillStyle = '#ffffff';
        this.renderer.ctx.font = '24px monospace';
        this.renderer.ctx.fillText('Press ENTER to Start', this.renderer.width / 2, this.renderer.height / 2 + 20);

        this.renderer.ctx.font = '16px monospace';
        this.renderer.ctx.fillStyle = '#aaaaaa';
        this.renderer.ctx.fillText('WASD / Arrows to Move', this.renderer.width / 2, this.renderer.height / 2 + 60);
        this.renderer.ctx.fillText('SPACE to Dash (Attack)', this.renderer.width / 2, this.renderer.height / 2 + 85);
        this.renderer.ctx.fillText('Collect Orbs to Level Up', this.renderer.width / 2, this.renderer.height / 2 + 110);
    }

    drawGameOver() {
        this.renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.renderer.ctx.fillRect(0, 0, this.renderer.width, this.renderer.height);

        this.renderer.ctx.fillStyle = '#ff0055';
        this.renderer.ctx.font = '60px monospace';
        this.renderer.ctx.textAlign = 'center';
        this.renderer.ctx.fillText('GAME OVER', this.renderer.width / 2, this.renderer.height / 2);

        this.renderer.ctx.fillStyle = '#ffffff';
        this.renderer.ctx.font = '24px monospace';
        this.renderer.ctx.fillText('Press ENTER to Restart', this.renderer.width / 2, this.renderer.height / 2 + 50);
    }

    drawWin() {
        this.renderer.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.renderer.ctx.fillRect(0, 0, this.renderer.width, this.renderer.height);

        this.renderer.ctx.fillStyle = '#ffff00';
        this.renderer.ctx.font = '60px monospace';
        this.renderer.ctx.textAlign = 'center';
        this.renderer.ctx.fillText('YOU WIN!', this.renderer.width / 2, this.renderer.height / 2);

        this.renderer.ctx.fillStyle = '#ffffff';
        this.renderer.ctx.font = '24px monospace';
        this.renderer.ctx.fillText(`Final Score: ${this.score}`, this.renderer.width / 2, this.renderer.height / 2 + 50);
        this.renderer.ctx.fillText('Press ENTER to Play Again', this.renderer.width / 2, this.renderer.height / 2 + 90);
    }
}
