export class Map {
    constructor(game, width, height) {
        this.game = game;
        this.width = width;
        this.height = height;
        this.tileSize = 40;
        this.grid = [];
        
        this.generate();
    }
    
    generate() {
        // Create a clearing in the center, forest around
        const centerX = Math.floor(this.width / 2);
        const centerY = Math.floor(this.height / 2);
        const clearingSize = 10;

        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                let type = 'grass';
                const distToCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                
                if (distToCenter > clearingSize) {
                    // Forest area
                    const rand = Math.random();
                    if (rand < 0.6) type = 'tree';
                    else if (rand < 0.05) type = 'stone';
                } else {
                    // Clearing area
                    const rand = Math.random();
                    if (rand < 0.05) type = 'tree';
                    else if (rand < 0.02) type = 'stone';
                }
                
                this.grid[y][x] = {
                    type: type,
                    building: null
                };
            }
        }
        
        // Position camera to clearing
        this.game.camera.x = centerX * this.tileSize - this.game.canvas.width / 2;
        this.game.camera.y = centerY * this.tileSize - this.game.canvas.height / 2;
    }
    
    draw(ctx) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.grid[y][x];
                this.drawTile(ctx, x, y, tile);
            }
        }
    }
    
    drawTile(ctx, x, y, tile) {
        const px = x * this.tileSize;
        const py = y * this.tileSize;
        
        // Basic terrain color
        switch (tile.type) {
            case 'grass': ctx.fillStyle = '#27ae60'; break;
            case 'tree': ctx.fillStyle = '#1e8449'; break;
            case 'stone': ctx.fillStyle = '#7f8c8d'; break;
            default: ctx.fillStyle = '#27ae60';
        }
        
        ctx.fillRect(px, py, this.tileSize, this.tileSize);
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.strokeRect(px, py, this.tileSize, this.tileSize);
        
        if (tile.type === 'tree') {
            ctx.fillStyle = '#0e6251';
            ctx.beginPath();
            ctx.arc(px + 20, py + 20, 10, 0, Math.PI * 2);
            ctx.fill();
        } else if (tile.type === 'stone') {
            ctx.fillStyle = '#515a5a';
            ctx.fillRect(px + 10, py + 10, 20, 20);
        }
        
        if (tile.building) {
            tile.building.draw(ctx);
        }
    }
}
