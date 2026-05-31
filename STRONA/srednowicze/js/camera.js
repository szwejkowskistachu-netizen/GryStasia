export class Camera {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.minZoom = 0.5;
        this.maxZoom = 2;
        
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.initControls();
    }
    
    initControls() {
        const canvas = this.game.canvas;
        
        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click to drag
                this.isDragging = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });
        
        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                
                this.x -= dx / this.zoom;
                this.y -= dy / this.zoom;
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                
                this.clamp();
            }
        });
        
        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom *= delta;
            this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom));
        }, { passive: false });
    }
    
    clamp() {
        const mapWidthPx = this.game.map.width * this.game.map.tileSize;
        const mapHeightPx = this.game.map.height * this.game.map.tileSize;
        
        // Allow some padding
        const padding = 100;
        this.x = Math.max(-padding, Math.min(mapWidthPx - this.game.canvas.width / this.zoom + padding, this.x));
        this.y = Math.max(-padding, Math.min(mapHeightPx - this.game.canvas.height / this.zoom + padding, this.y));
    }
    
    apply(ctx) {
        ctx.save();
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }
    
    restore(ctx) {
        ctx.restore();
    }
    
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX / this.zoom) + this.x,
            y: (screenY / this.zoom) + this.y
        };
    }
}
