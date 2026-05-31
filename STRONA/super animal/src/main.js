/**
 * Główna klasa gry.
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.debugEl = document.getElementById('debug');
        
        // Inicjalizacja rdzenia
        this.world = new window.GameEngine.World();
        this.worldManager = new window.GameEngine.WorldManager(this.world);
        this.playerSystem = new window.GameEngine.PlayerSystem(this.world);
        this.aiSystem = new window.GameEngine.AISystem(this.world);
        this.inventory = new window.GameEngine.InventorySystem();
        this.tradeSystem = new window.GameEngine.TradeSystem(this.world, this.inventory);
        
        this.lastTime = 0;
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Tworzenie gracza
        this.playerSystem.createPlayer();
        
        // Start pętli
        requestAnimationFrame(this.loop.bind(this));
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1); // limit dt dla stabilności
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        if (Math.floor(timestamp / 100) % 10 === 0) {
            this.updateDebug(dt);
        }

        requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
        // Logika gracza
        this.playerSystem.update(dt);
        
        // Logika AI
        this.aiSystem.update(dt);

        this.tradeSystem.update(dt);
        
        // Pobierz pozycję gracza dla managera świata
        const playerPos = this.world.getComponent(this.playerSystem.playerEntity, 'position');
        
        // Aktualizacja ładowania chunków
        this.worldManager.updateLoadedChunks(playerPos.x, playerPos.y, this.canvas.width, this.canvas.height);
        
        // Aktualizacja systemów ECS
        this.world.update(dt);
    }

    draw() {
        // Czyść ekran
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Rysuj świat
        this.worldManager.draw(this.ctx, this.playerSystem.camera);
        
        // Rysuj stworzenia
        this.aiSystem.draw(this.ctx, this.playerSystem.camera);
        
        // Rysuj gracza
        this.playerSystem.draw(this.ctx);

        // UI
        this.tradeSystem.draw(this.ctx);
        this.inventory.draw(this.ctx);
    }

    updateDebug(dt) {
        const fps = Math.round(1 / dt);
        const playerPos = this.world.getComponent(this.playerSystem.playerEntity, 'position');
        
        this.debugEl.innerHTML = `
            FPS: ${fps}<br>
            Pozycja: ${Math.floor(playerPos.x)}, ${Math.floor(playerPos.y)}<br>
            Chunki: ${this.worldManager.loadedChunks.size}<br>
            Sterowanie: WSAD / Strzałki
        `;
    }
}

// Uruchom grę po załadowaniu wszystkich skryptów
window.onload = () => {
    window.game = new Game();
};
