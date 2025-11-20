export default class UIManager {
    constructor() {
        this.uiLayer = document.getElementById('ui-layer');
        this.setupHUD();
    }

    setupHUD() {
        this.uiLayer.innerHTML = `
            <div style="position: absolute; top: 20px; left: 20px; font-family: monospace; color: #00f3ff; text-shadow: 0 0 5px #00f3ff; pointer-events: none;">
                <div style="font-size: 24px; font-weight: bold;">LVL <span id="level-display">1</span></div>
                <div style="margin-top: 10px;">
                    HP: <div style="display: inline-block; width: 200px; height: 10px; background: #333; border: 1px solid #555;">
                        <div id="hp-bar" style="width: 100%; height: 100%; background: #ff0055; transition: width 0.2s;"></div>
                    </div>
                </div>
                <div style="margin-top: 5px;">
                    XP: <div style="display: inline-block; width: 200px; height: 10px; background: #333; border: 1px solid #555;">
                        <div id="xp-bar" style="width: 0%; height: 100%; background: #00f3ff; transition: width 0.2s;"></div>
                    </div>
                </div>
                <div style="margin-top: 15px; font-size: 18px; color: #ffff00;">
                    SCORE: <span id="score-display">0</span>
                </div>
                <div style="margin-top: 5px; font-size: 18px; color: #ff5555;">
                    ENEMIES: <span id="enemy-display">0</span>
                </div>
                <div style="margin-top: 15px; font-size: 16px; color: #ffffff; background: rgba(0,0,0,0.5); padding: 5px;">
                    OBJECTIVE: <span id="objective-display">Reach the Goal</span>
                </div>
            </div>
        `;

        this.hpBar = document.getElementById('hp-bar');
        this.xpBar = document.getElementById('xp-bar');
        this.levelDisplay = document.getElementById('level-display');
        this.scoreDisplay = document.getElementById('score-display');
        this.enemyDisplay = document.getElementById('enemy-display');
        this.objectiveDisplay = document.getElementById('objective-display');
    }

    update(player, score, enemyCount) {
        const hpPercent = (player.stats.hp / player.stats.maxHp) * 100;
        const xpPercent = (player.stats.xp / player.stats.maxXp) * 100;

        this.hpBar.style.width = `${hpPercent}%`;
        this.xpBar.style.width = `${xpPercent}%`;
        this.levelDisplay.textContent = player.stats.level;
        this.scoreDisplay.textContent = score;
        this.enemyDisplay.textContent = enemyCount;

        // Dynamic Objective
        if (player.stats.level === 3) {
            this.objectiveDisplay.textContent = "DEFEAT THE BOSS!";
            this.objectiveDisplay.style.color = "#ff0000";
        } else {
            this.objectiveDisplay.textContent = "Find the Yellow Goal";
            this.objectiveDisplay.style.color = "#ffff00";
        }
    }
}
