export class UI {
    constructor(game) {
        this.game = game;
        this.initButtons();
    }
    
    initButtons() {
        const buttons = document.querySelectorAll('.build-btn');
        buttons.forEach(btn => {
            btn.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                this.selectedBuildType = e.target.dataset.type;
                this.notify(`Wybrano: ${this.selectedBuildType}. Kliknij na mapę, aby zbudować.`);
            });
        });
        
        this.game.canvas.addEventListener('pointerdown', (e) => {
            if (this.selectedBuildType) {
                const worldPos = this.game.camera.screenToWorld(e.clientX, e.clientY);
                const tileX = Math.floor(worldPos.x / this.game.map.tileSize);
                const tileY = Math.floor(worldPos.y / this.game.map.tileSize);
                
                if (tileX >= 0 && tileX < this.game.map.width && tileY >= 0 && tileY < this.game.map.height) {
                    if (this.game.economy.tryBuild(this.selectedBuildType, tileX, tileY)) {
                        this.selectedBuildType = null;
                    }
                }
            }
        });
    }
    
    notify(message) {
        const container = document.getElementById('notifications');
        const note = document.createElement('div');
        note.className = 'notification';
        note.innerText = message;
        container.appendChild(note);
        
        setTimeout(() => {
            note.remove();
        }, 5000);
    }
    
    update() {
        document.getElementById('res-wood').innerText = `Drewno: ${Math.floor(this.game.economy.resources.wood)}`;
        document.getElementById('res-food').innerText = `Jedzenie: ${Math.floor(this.game.economy.resources.food)}`;
        document.getElementById('res-stone').innerText = `Kamień: ${Math.floor(this.game.economy.resources.stone)}`;
        document.getElementById('res-gold').innerText = `Złoto: ${Math.floor(this.game.economy.resources.gold)}`;
        
        const avgHappiness = this.game.population.citizens.length > 0 
            ? Math.floor(this.game.population.citizens.reduce((sum, c) => sum + c.happiness, 0) / this.game.population.citizens.length)
            : 0;

        document.getElementById('stat-pop').innerText = `Pop: ${this.game.population.citizens.length} | Szczęście: ${avgHappiness}%`;
        
        const seasonNames = ['Wiosna', 'Lato', 'Jesień', 'Zima'];
        const hour = Math.floor(this.game.time.timeOfDay * 24);
        const min = Math.floor((this.game.time.timeOfDay * 24 * 60) % 60);
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        
        document.getElementById('stat-time').innerText = `Dzień: ${this.game.time.day} (${seasonNames[this.game.time.season]}) ${timeStr}`;
    }
}
