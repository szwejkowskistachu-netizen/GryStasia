/**
 * Game initialization and loop
 */
class Game {
    constructor() {
        this.lastTime = 0;
        this.fps = 0;
        this.fpsUpdateTime = 0;
        
        // Initialize other components
        this.input = new Input();
        this.world = new World();
        this.player = new Player(this.world, this.input);
        this.ui = new UI(this.player);

        requestAnimationFrame((time) => this.loop(time));
    }

    loop(time) {
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        if (dt < 0.1) { // Prevent huge jumps
            this.update(dt);
            this.render();
        }

        // Update FPS counter
        if (time - this.fpsUpdateTime > 500) {
            this.fps = Math.round(1 / dt);
            this.fpsUpdateTime = time;
            document.getElementById('fps').innerText = this.fps;
        }

        requestAnimationFrame((time) => this.loop(time));
    }

    update(dt) {
        this.player.update(dt);
        this.world.update(this.player.position);
        this.ui.update();
    }

    render() {
        if (!renderer) return;
        renderer.clear();
        
        // Render world relative to player camera
        this.world.render(renderer, this.player.camera);
    }
}

let game;
window.addEventListener('load', () => {
    game = new Game();
});
