export const BUILDING_TYPES = {
    house: {
        name: 'Dom',
        cost: { wood: 50, stone: 10 },
        capacity: 4,
        description: 'Zapewnia miejsce zamieszkania dla 4 osób.'
    },
    farm: {
        name: 'Farma',
        cost: { wood: 30 },
        production: { food: 0.5 }, // per tick or per worker? Let's say per worker per second
        workers: 2,
        description: 'Produkuje jedzenie.'
    },
    lumberjack: {
        name: 'Tartak',
        cost: { wood: 20, stone: 5 },
        production: { wood: 0.3 },
        workers: 2,
        description: 'Produkuje drewno.'
    },
    quarry: {
        name: 'Kamieniołom',
        cost: { wood: 40 },
        production: { stone: 0.2 },
        workers: 3,
        description: 'Produkuje kamień.'
    },
    warehouse: {
        name: 'Magazyn',
        cost: { wood: 100, stone: 50 },
        description: 'Zwiększa limit składowania surowców.'
    },
    market: {
        name: 'Rynek',
        cost: { wood: 150, stone: 50, gold: 50 },
        description: 'Umożliwia handel.'
    }
};

export class Building {
    constructor(game, type, x, y) {
        this.game = game;
        this.type = type;
        this.config = BUILDING_TYPES[type];
        this.x = x;
        this.y = y;
        this.workers = [];
    }
    
    update(deltaTime) {
        if (this.config.production) {
            // Season effects
            let multiplier = 1;
            if (this.type === 'farm') {
                if (this.game.time.season === 1) multiplier = 1.5; // Summer bonus
                if (this.game.time.season === 3) multiplier = 0.2; // Winter penalty
            }

            // Production based on current workers
            for (const res in this.config.production) {
                const amount = this.config.production[res] * this.workers.length * (deltaTime / 1000) * multiplier;
                this.game.economy.resources[res] += amount;
            }
        }
    }
    
    draw(ctx) {
        const px = this.x * this.game.map.tileSize;
        const py = this.y * this.game.map.tileSize;
        const size = this.game.map.tileSize;
        
        ctx.fillStyle = '#d35400';
        ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
        
        // Simple building icon representation
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.config.name.substring(0, 3), px + size/2, py + size/2 + 4);
    }
}
