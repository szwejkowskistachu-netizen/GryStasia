class Engine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = CONFIG.MAP_WIDTH;
        this.canvas.height = CONFIG.MAP_HEIGHT;
        
        this.units = [];
        this.factions = {};
        this.isRunning = false;
        this.speedMultiplier = 1;
        
        this.init();
    }

    init() {
        CONFIG.FACTIONS.forEach(fConfig => {
            const faction = new Faction(fConfig);
            this.factions[faction.id] = faction;
            
            for (let i = 0; i < CONFIG.INITIAL_UNITS_PER_FACTION; i++) {
                const x = Math.random() * CONFIG.MAP_WIDTH;
                const y = Math.random() * CONFIG.MAP_HEIGHT;
                const unit = new Unit(x, y, faction);
                this.units.push(unit);
                faction.units.push(unit);
            }
        });
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.loop();
        }
    }

    pause() {
        this.isRunning = false;
    }

    setSpeed(speed) {
        this.speedMultiplier = speed;
    }

    loop() {
        if (!this.isRunning) return;

        for (let i = 0; i < this.speedMultiplier; i++) {
            this.update();
        }
        
        this.draw();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        // Remove dead units
        this.units = this.units.filter(u => {
            if (u.hp <= 0) {
                u.faction.deaths++;
                if (u.lastAttackerFaction) {
                    u.lastAttackerFaction.kills++;
                }
                return false;
            }
            return true;
        });

        // Update each unit
        this.units.forEach(unit => unit.update(this));
        
        this.checkGameOver();
    }

    checkGameOver() {
        const activeFactions = new Set(this.units.map(u => u.faction.id));
        if (activeFactions.size <= 1 && this.units.length > 0) {
            const winnerId = Array.from(activeFactions)[0];
            const winner = this.factions[winnerId];
            this.isRunning = false;
            alert(`Game Over! ${winner.name} Faction wins!`);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background grid (optional)
        this.ctx.strokeStyle = '#222';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += CONFIG.GRID_SIZE * 5) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += CONFIG.GRID_SIZE * 5) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        this.units.forEach(unit => unit.draw(this.ctx));
        this.updateUI();
    }

    updateUI() {
        const statsPanel = document.getElementById('faction-stats');
        let html = '';
        
        Object.values(this.factions).forEach(f => {
            const aliveCount = this.units.filter(u => u.faction.id === f.id).length;
            html += `
                <div class="faction-stat-row">
                    <span>
                        <span class="faction-color-box" style="background: ${f.color}"></span>
                        ${f.name} (${f.strategyName}):
                    </span>
                    <span>${aliveCount} alive</span>
                </div>
            `;
        });
        
        statsPanel.innerHTML = html;
    }
}
