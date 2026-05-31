export class MapSystem {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.grid = [];
        this.tileSize = 40;
        this.colors = {
            '.': '#2b2b3b', // Empty
            '#': '#45475a', // Wall
            'C': '#f9e2af', // Chest (Skrzynia)
            'K': '#fab387', // Key (Klucz)
            'D': '#eba0ac', // Door (Drzwi)
            'E': '#a6e3a1', // End (Meta)
            'X': '#f38ba8', // Enemy (Przeciwnik)
        };
    }

    load(grid) {
        this.grid = JSON.parse(JSON.stringify(grid)); // Deep copy
        this.canvas.width = this.grid[0].length * this.tileSize;
        this.canvas.height = this.grid.length * this.tileSize;
    }

    getAt(x, y) {
        if (y >= 0 && y < this.grid.length && x >= 0 && x < this.grid[0].length) {
            return this.grid[y][x];
        }
        return '#'; // Treat out of bounds as walls
    }

    setAt(x, y, value) {
        if (y >= 0 && y < this.grid.length && x >= 0 && x < this.grid[0].length) {
            this.grid[y][x] = value;
        }
    }

    findRobot() {
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x] === 'R') {
                    this.grid[y][x] = '.'; // Remove robot from grid data, it's managed by Robot class
                    return { x, y };
                }
            }
        }
        return { x: 0, y: 0 };
    }

    draw(robot) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const cell = this.grid[y][x];
                this.ctx.fillStyle = this.colors[cell] || '#000';
                this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                
                // Grid lines
                this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                this.ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);

                // Labels for items
                if (['C', 'K', 'D', 'E', 'X'].includes(cell)) {
                    this.ctx.fillStyle = '#11111b';
                    this.ctx.font = 'bold 20px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(cell, x * this.tileSize + this.tileSize/2, y * this.tileSize + this.tileSize/2);
                }
            }
        }

        this.drawRobot(robot);
    }

    drawRobot(robot) {
        const px = robot.x * this.tileSize + this.tileSize / 2;
        const py = robot.y * this.tileSize + this.tileSize / 2;
        const size = this.tileSize * 0.8;

        this.ctx.save();
        this.ctx.translate(px, py);
        
        // Rotate based on direction
        const rotations = { 'UP': 0, 'RIGHT': Math.PI / 2, 'DOWN': Math.PI, 'LEFT': -Math.PI / 2 };
        this.ctx.rotate(rotations[robot.direction]);

        // Robot Body
        this.ctx.fillStyle = '#89b4fa';
        this.ctx.fillRect(-size/2, -size/2, size, size);
        
        // Robot "Face" / Direction Indicator
        this.ctx.fillStyle = '#1e1e2e';
        this.ctx.fillRect(-size/4, -size/2, size/2, size/4);

        this.ctx.restore();
    }
}
