import { Building, BUILDING_TYPES } from './buildings.js';

export class Economy {
    constructor(game) {
        this.game = game;
        this.resources = {
            wood: 200,
            food: 400,
            stone: 100,
            gold: 100
        };
        this.buildings = [];
    }
    
    update(deltaTime) {
        this.buildings.forEach(b => b.update(deltaTime));
    }
    
    canAfford(cost) {
        for (const res in cost) {
            if (this.resources[res] < cost[res]) return false;
        }
        return true;
    }
    
    spend(cost) {
        for (const res in cost) {
            this.resources[res] -= cost[res];
        }
    }
    
    tryBuild(type, x, y) {
        const config = BUILDING_TYPES[type];
        if (this.canAfford(config.cost)) {
            const tile = this.game.map.grid[y][x];
            if (!tile.building && tile.type === 'grass') {
                this.spend(config.cost);
                const building = new Building(this.game, type, x, y);
                this.buildings.push(building);
                tile.building = building;
                this.game.ui.notify(`Zbudowano: ${config.name}`);
                
                // If it's a house, assign residents
                if (type === 'house') {
                    this.game.population.assignResidentsToHouse(building);
                } else {
                    // Assign workers from idle population
                    this.game.population.assignWorkersToBuilding(building);
                }
                
                return true;
            } else {
                this.game.ui.notify("Nie można tu budować!");
            }
        } else {
            this.game.ui.notify("Nie stać Cię na ten budynek!");
        }
        return false;
    }
}
