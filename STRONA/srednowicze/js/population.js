export class Population {
    constructor(game) {
        this.game = game;
        this.citizens = [];
        this.spawnInitialCitizens(5);
    }
    
    spawnInitialCitizens(count) {
        const centerX = Math.floor(this.game.map.width / 2);
        const centerY = Math.floor(this.game.map.height / 2);
        for (let i = 0; i < count; i++) {
            const citizen = new Citizen(this.game);
            citizen.x = centerX + (Math.random() - 0.5) * 5;
            citizen.y = centerY + (Math.random() - 0.5) * 5;
            citizen.targetX = citizen.x;
            citizen.targetY = citizen.y;
            this.citizens.push(citizen);
        }
    }
    
    assignWorkersToBuilding(building) {
        if (!building.config.workers) return;
        
        let assigned = 0;
        for (const citizen of this.citizens) {
            if (citizen.job === 'idle' && assigned < building.config.workers) {
                citizen.job = building.type;
                citizen.workplace = building;
                building.workers.push(citizen);
                assigned++;
            }
        }
        
        if (assigned < building.config.workers) {
            this.game.ui.notify(`Brakuje ${building.config.workers - assigned} pracowników dla: ${building.config.name}`);
        }
    }
    
    assignResidentsToHouse(house) {
        let assigned = 0;
        for (const citizen of this.citizens) {
            if (!citizen.home && assigned < house.config.capacity) {
                citizen.home = house;
                assigned++;
            }
        }
    }
    
    update(deltaTime) {
        this.citizens.forEach(c => c.update(deltaTime));
        
        // Births and growth
        if (Math.random() < 0.0001 * deltaTime / 1000) {
            this.handleBirths();
        }
    }
    
    handleBirths() {
        const couples = Math.floor(this.citizens.filter(c => c.age >= 18 && c.age < 50).length / 2);
        if (couples > 0 && Math.random() < 0.1) {
            const child = new Citizen(this.game);
            child.age = 0;
            const parent = this.citizens.find(c => c.age >= 18);
            child.x = parent.x;
            child.y = parent.y;
            this.citizens.push(child);
            this.game.ui.notify("Urodziło się nowe dziecko!");
        }
    }
    
    draw(ctx) {
        this.citizens.forEach(c => c.draw(ctx));
    }
}

class Citizen {
    constructor(game) {
        this.game = game;
        this.name = this.generateName();
        this.age = 18 + Math.floor(Math.random() * 20);
        this.hunger = 0;
        this.energy = 100;
        this.health = 100;
        this.happiness = 100;
        this.job = 'idle';
        this.workplace = null;
        this.home = null;
        
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.speed = 0.002;
    }
    
    generateName() {
        const names = ['Mieszko', 'Dobrawa', 'Kazimierz', 'Jadwiga', 'Władysław', 'Zygmunt', 'Bolesław', 'Stanisław', 'Wanda', 'Grajek'];
        return names[Math.floor(Math.random() * names.length)];
    }
    
    update(deltaTime) {
        const hour = this.game.time.timeOfDay * 24;
        
        this.updateHappiness(deltaTime);

        // Movement Logic
        if (hour >= 22 || hour < 6) {
            // Sleep
            if (this.home) {
                this.targetX = this.home.x;
                this.targetY = this.home.y;
            }
            this.energy = Math.min(100, this.energy + 0.001 * deltaTime);
        } else if (hour >= 8 && hour < 18) {
            // Work
            if (this.workplace) {
                this.targetX = this.workplace.x;
                this.targetY = this.workplace.y;
            } else if (Math.abs(this.x - this.targetX) < 0.1) {
                this.targetX = this.x + (Math.random() - 0.5) * 5;
                this.targetY = this.y + (Math.random() - 0.5) * 5;
            }
            this.energy -= 0.0002 * deltaTime;
        } else {
            // Free time
            if (Math.abs(this.x - this.targetX) < 0.1) {
                const centerX = this.game.map.width / 2;
                const centerY = this.game.map.height / 2;
                this.targetX = centerX + (Math.random() - 0.5) * 10;
                this.targetY = centerY + (Math.random() - 0.5) * 10;
            }
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0.1) {
            this.x += (dx / dist) * this.speed * deltaTime;
            this.y += (dy / dist) * this.speed * deltaTime;
        }
        
        // Needs
        this.hunger += 0.00002 * deltaTime;
        if (this.hunger > 70) {
            if (this.game.economy.resources.food > 0.1) {
                this.game.economy.resources.food -= 0.1;
                this.hunger = Math.max(0, this.hunger - 40);
            }
        }

        // Aging
        if (Math.random() < 0.00001 * deltaTime) {
            this.age += 1;
            if (this.age > 70 && Math.random() < 0.01) {
                this.die("ze starości");
            }
        }

        if (this.hunger > 100) {
            this.health -= 0.001 * deltaTime;
            if (this.health <= 0) this.die("z głodu");
        }
    }

    updateHappiness(deltaTime) {
        let h = 0;
        if (this.hunger < 30) h += 1; else if (this.hunger > 70) h -= 2;
        if (this.home) h += 1; else h -= 2;
        if (this.health < 50) h -= 3;
        
        this.happiness = Math.max(0, Math.min(100, this.happiness + h * 0.0001 * deltaTime));
    }

    die(reason) {
        this.game.ui.notify(`${this.name} zmarł ${reason}.`);
        const index = this.game.population.citizens.indexOf(this);
        if (index > -1) {
            this.game.population.citizens.splice(index, 1);
            if (this.workplace) {
                const wIdx = this.workplace.workers.indexOf(this);
                if (wIdx > -1) this.workplace.workers.splice(wIdx, 1);
            }
        }
    }
    
    draw(ctx) {
        const px = this.x * this.game.map.tileSize;
        const py = this.y * this.game.map.tileSize;
        
        ctx.fillStyle = this.age < 12 ? '#3498db' : '#e74c3c';
        ctx.beginPath();
        ctx.arc(px + 20, py + 20, this.age < 12 ? 3 : 5, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.game.camera.zoom > 1.2) {
            ctx.fillStyle = 'white';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.name} (${Math.floor(this.age)})`, px + 20, py + 10);
        }
    }
}
