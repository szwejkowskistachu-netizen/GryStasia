/**
 * System sterowania graczem i kamera.
 */
window.GameEngine.PlayerSystem = class {
    constructor(world) {
        this.world = world;
        this.keys = {};
        this.playerEntity = null;
        this.camera = { x: 0, y: 0 };
        
        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            // E lub Spacja do interakcji/ataku
            if (e.code === 'KeyE' || e.code === 'Space') {
                if (window.game) {
                    const playerPos = this.world.getComponent(this.playerEntity, 'position');
                    window.game.tradeSystem.interact(playerPos);
                }
            }
        });
        window.addEventListener('keyup', e => this.keys[e.code] = false);
    }

    createPlayer() {
        const id = this.world.createEntity();
        this.world.addComponent(id, 'position', { x: 100, y: 100 });
        this.world.addComponent(id, 'velocity', { x: 0, y: 0 });
        this.world.addComponent(id, 'sprite', { color: '#e74c3c', size: 24, name: 'Gracz' });
        this.world.addComponent(id, 'health', { current: 100, max: 100 });
        this.world.addComponent(id, 'player', true);
        this.playerEntity = id;
        return id;
    }

    update(dt) {
        if (this.playerEntity === null) return;

        const pos = this.world.getComponent(this.playerEntity, 'position');
        const speed = 200; // piksele na sekunde

        if (this.keys['KeyW'] || this.keys['ArrowUp']) pos.y -= speed * dt;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) pos.y += speed * dt;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) pos.x -= speed * dt;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) pos.x += speed * dt;

        // Aktualizacja kamery - podążaj za graczem
        this.camera.x = pos.x - window.innerWidth / 2;
        this.camera.y = pos.y - window.innerHeight / 2;
    }

    draw(ctx) {
        const pos = this.world.getComponent(this.playerEntity, 'position');
        const sprite = this.world.getComponent(this.playerEntity, 'sprite');
        const health = this.world.getComponent(this.playerEntity, 'health');

        // Pasek HP nad graczem
        const barW = 40;
        const barH = 6;
        ctx.fillStyle = 'red';
        ctx.fillRect(pos.x - this.camera.x - barW/2, pos.y - this.camera.y - sprite.size - 10, barW, barH);
        ctx.fillStyle = 'lime';
        ctx.fillRect(pos.x - this.camera.x - barW/2, pos.y - this.camera.y - sprite.size - 10, barW * (health.current / health.max), barH);

        ctx.fillStyle = sprite.color;
        // Rysujemy gracza na środku ekranu (lub relatywnie do kamery)
        ctx.fillRect(
            pos.x - this.camera.x - sprite.size/2, 
            pos.y - this.camera.y - sprite.size/2, 
            sprite.size, 
            sprite.size
        );
        
        // Obramowanie gracza
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            pos.x - this.camera.x - sprite.size/2, 
            pos.y - this.camera.y - sprite.size/2, 
            sprite.size, 
            sprite.size
        );
    }
};
