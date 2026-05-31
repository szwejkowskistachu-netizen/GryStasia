// Medieval City Simulator - Unified Core

const BUILDING_TYPES = {
    castle: {
        name: 'Zamek',
        cost: { wood: 200, stone: 500, gold: 200 },
        description: 'Siedziba króla. Zwiększa prestiż i bezpieczeństwo.'
    },
    house: {
        name: 'Dom',
        cost: { wood: 50, stone: 10 },
        capacity: 4,
        description: 'Zapewnia miejsce zamieszkania dla 4 osób.'
    },
    farm: {
        name: 'Farma',
        cost: { wood: 30 },
        production: { food: 0.5 },
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

class Camera {
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
        canvas.addEventListener('mousedown', (e) => { if (e.button === 0) { this.isDragging = true; this.lastMouseX = e.clientX; this.lastMouseY = e.clientY; } });
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
        window.addEventListener('mouseup', () => { this.isDragging = false; });
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            this.zoom *= delta;
            this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom));
        }, { passive: false });
    }
    clamp() {
        const padding = 100;
        this.x = Math.max(-padding, Math.min(this.game.map.width * this.game.map.tileSize - this.game.canvas.width / this.zoom + padding, this.x));
        this.y = Math.max(-padding, Math.min(this.game.map.height * this.game.map.tileSize - this.game.canvas.height / this.zoom + padding, this.y));
    }
    apply(ctx) { ctx.save(); ctx.scale(this.zoom, this.zoom); ctx.translate(-this.x, -this.y); }
    restore(ctx) { ctx.restore(); }
    screenToWorld(screenX, screenY) { return { x: (screenX / this.zoom) + this.x, y: (screenY / this.zoom) + this.y }; }
}

class Map {
    constructor(game, width, height) {
        this.game = game;
        this.width = width;
        this.height = height;
        this.tileSize = 40;
        this.grid = [];
        this.generate();
    }
    generate() {
        const centerX = Math.floor(this.width / 2);
        const centerY = Math.floor(this.height / 2);
        const clearingSize = 10;
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                let type = 'grass';
                const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                if (dist > clearingSize) {
                    const rand = Math.random();
                    if (rand < 0.6) type = 'tree'; else if (rand < 0.05) type = 'stone';
                } else {
                    const rand = Math.random();
                    if (rand < 0.05) type = 'tree'; else if (rand < 0.02) type = 'stone';
                }
                this.grid[y][x] = { type, building: null };
            }
        }
    }
    draw(ctx) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tile = this.grid[y][x];
                const px = x * this.tileSize;
                const py = y * this.tileSize;
                
                // Better grass with "texture"
                ctx.fillStyle = tile.type === 'grass' ? '#2ecc71' : (tile.type === 'tree' ? '#27ae60' : '#95a5a6');
                ctx.fillRect(px, py, this.tileSize, this.tileSize);
                
                // Subtle texture
                ctx.fillStyle = 'rgba(0,0,0,0.05)';
                if ((x + y) % 2 === 0) ctx.fillRect(px, py, this.tileSize/2, this.tileSize/2);

                if (tile.type === 'tree') {
                    // Shadow
                    ctx.fillStyle = 'rgba(0,0,0,0.2)';
                    ctx.beginPath(); ctx.ellipse(px + 25, py + 30, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
                    // Trunk
                    ctx.fillStyle = '#5d4037';
                    ctx.fillRect(px + 18, py + 25, 4, 10);
                    // Leaves
                    ctx.fillStyle = '#1b5e20';
                    ctx.beginPath(); ctx.arc(px + 20, py + 15, 12, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#2e7d32';
                    ctx.beginPath(); ctx.arc(px + 16, py + 12, 8, 0, Math.PI * 2); ctx.fill();
                }
                
                if (tile.type === 'stone') {
                    ctx.fillStyle = '#7f8c8d';
                    ctx.beginPath(); ctx.moveTo(px+5, py+35); ctx.lineTo(px+20, py+5); ctx.lineTo(px+35, py+35); ctx.fill();
                    ctx.fillStyle = '#95a5a6';
                    ctx.beginPath(); ctx.moveTo(px+15, py+35); ctx.lineTo(px+25, py+15); ctx.lineTo(px+35, py+35); ctx.fill();
                }

                if (tile.building) tile.building.draw(ctx);
            }
        }
    }
}

class Building {
    constructor(game, type, x, y) {
        this.game = game;
        this.type = type;
        this.config = BUILDING_TYPES[type];
        this.x = x; this.y = y;
        this.workers = [];
    }
    update(deltaTime) {
        if (this.config.production) {
            let mult = 1;
            if (this.type === 'farm') {
                if (this.game.time.season === 1) mult = 1.5;
                if (this.game.time.season === 3) mult = 0.2;
            }
            for (const res in this.config.production) {
                this.game.economy.resources[res] += this.config.production[res] * this.workers.length * (deltaTime / 1000) * mult;
            }
        }
    }
    draw(ctx) {
        const px = this.x * this.game.map.tileSize;
        const py = this.y * this.game.map.tileSize;
        const size = this.game.map.tileSize;
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(px + 4, py + 4, size, size);

        if (this.type === 'castle') {
            ctx.fillStyle = '#7f8c8d';
            ctx.fillRect(px, py, size, size);
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(px, py, size/3, size);
            ctx.fillRect(px + size*2/3, py, size/3, size);
            ctx.fillStyle = '#bdc3c7';
            ctx.fillRect(px + size/4, py + size/4, size/2, size/2);
        } else if (this.type === 'house') {
            ctx.fillStyle = '#e67e22';
            ctx.beginPath(); ctx.moveTo(px, py + size/2); ctx.lineTo(px + size/2, py); ctx.lineTo(px + size, py + size/2); ctx.fill();
            ctx.fillStyle = '#f39c12';
            ctx.fillRect(px + 5, py + size/2, size - 10, size/2);
        } else if (this.type === 'farm') {
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
            ctx.fillStyle = '#d4ac0d';
            for(let i=0; i<3; i++) ctx.fillRect(px + 5, py + 5 + i*10, size - 10, 2);
        } else {
            ctx.fillStyle = '#d35400';
            ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
        }
        
        ctx.fillStyle = 'white'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center';
        ctx.fillText(this.config.name[0], px + size/2, py + size - 5);
    }
}

class Citizen {
    constructor(game) {
        this.game = game;
        this.name = this.genName();
        this.age = 18 + Math.floor(Math.random() * 20);
        this.hunger = 0; this.energy = 100; this.health = 100; this.happiness = 100;
        this.job = 'idle'; this.workplace = null; this.home = null;
        this.x = 0; this.y = 0; this.targetX = 0; this.targetY = 0; this.speed = 0.002;
    }
    genName() {
        const names = ['Mieszko', 'Dobrawa', 'Kazimierz', 'Jadwiga', 'Władysław', 'Zygmunt', 'Bolesław', 'Stanisław', 'Wanda'];
        return names[Math.floor(Math.random() * names.length)];
    }
    update(deltaTime) {
        const hour = this.game.time.timeOfDay * 24;
        this.updateHappiness(deltaTime);
        if (hour >= 22 || hour < 6) { if (this.home) { this.targetX = this.home.x; this.targetY = this.home.y; } this.energy = Math.min(100, this.energy + 0.001 * deltaTime); }
        else if (hour >= 8 && hour < 18) { if (this.workplace) { this.targetX = this.workplace.x; this.targetY = this.workplace.y; } }
        else { if (Math.abs(this.x - this.targetX) < 0.1) { const c = this.game.map.width / 2; this.targetX = c + (Math.random() - 0.5) * 10; this.targetY = c + (Math.random() - 0.5) * 10; } }
        const dx = this.targetX - this.x, dy = this.targetY - this.y, dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.1) { this.x += (dx / dist) * this.speed * deltaTime; this.y += (dy / dist) * this.speed * deltaTime; }
        this.hunger += 0.00002 * deltaTime;
        if (this.hunger > 70 && this.game.economy.resources.food > 0.1) { this.game.economy.resources.food -= 0.1; this.hunger = Math.max(0, this.hunger - 40); }
        if (Math.random() < 0.00001 * deltaTime) { this.age++; if (this.age > 70 && Math.random() < 0.01) this.die("ze starości"); }
        if (this.hunger > 100) { this.health -= 0.001 * deltaTime; if (this.health <= 0) this.die("z głodu"); }
    }
    updateHappiness(deltaTime) {
        let h = 0;
        if (this.hunger < 30) h += 1; else if (this.hunger > 70) h -= 2;
        if (this.home) h += 1; else h -= 2;
        this.happiness = Math.max(0, Math.min(100, this.happiness + h * 0.0001 * deltaTime));
    }
    die(r) {
        this.game.ui.notify(`${this.name} zmarł ${r}.`);
        const idx = this.game.population.citizens.indexOf(this);
        if (idx > -1) {
            this.game.population.citizens.splice(idx, 1);
            if (this.workplace) { const wIdx = this.workplace.workers.indexOf(this); if (wIdx > -1) this.workplace.workers.splice(wIdx, 1); }
        }
    }
    draw(ctx) {
        const px = this.x * this.game.map.tileSize, py = this.y * this.game.map.tileSize;
        ctx.fillStyle = this.age < 12 ? '#3498db' : '#e74c3c';
        ctx.beginPath(); ctx.arc(px + 20, py + 20, this.age < 12 ? 3 : 5, 0, Math.PI * 2); ctx.fill();
        if (this.game.camera.zoom > 1.2) { ctx.fillStyle = 'white'; ctx.font = '8px Arial'; ctx.textAlign = 'center'; ctx.fillText(this.name, px + 20, py + 10); }
    }
}

class Population {
    constructor(game) {
        this.game = game; this.citizens = []; this.spawn(5);
    }
    spawn(count) {
        const c = Math.floor(this.game.map.width / 2);
        for (let i = 0; i < count; i++) {
            const citizen = new Citizen(this.game);
            citizen.x = citizen.targetX = c + (Math.random() - 0.5) * 5;
            citizen.y = citizen.targetY = c + (Math.random() - 0.5) * 5;
            this.citizens.push(citizen);
        }
    }
    assignWorkers(building) {
        let assigned = 0;
        for (const c of this.citizens) {
            if (c.job === 'idle' && assigned < (building.config.workers || 0)) {
                c.job = building.type; c.workplace = building; building.workers.push(c); assigned++;
            }
        }
    }
    assignResidents(house) {
        let assigned = 0;
        for (const c of this.citizens) {
            if (!c.home && assigned < house.config.capacity) { c.home = house; assigned++; }
        }
    }
    update(dt) {
        this.citizens.forEach(c => c.update(dt));
        if (Math.random() < 0.0001 * dt / 1000) this.handleBirths();
    }
    handleBirths() {
        if (this.citizens.filter(c => c.age >= 18).length >= 2 && Math.random() < 0.1) {
            const child = new Citizen(this.game); child.age = 0;
            const p = this.citizens.find(c => c.age >= 18); child.x = p.x; child.y = p.y;
            this.citizens.push(child); this.game.ui.notify("Urodziło się nowe dziecko!");
        }
    }
    draw(ctx) { this.citizens.forEach(c => c.draw(ctx)); }
}

class King {
    constructor(game) {
        this.game = game;
        this.x = 25; this.y = 25;
        this.speed = 0.005;
        this.keys = {};
        window.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);
    }
    update(dt) {
        let dx = 0, dy = 0;
        if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
        if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
        if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
        if (this.keys['d'] || this.keys['arrowright']) dx += 1;
        if (dx !== 0 || dy !== 0) {
            const mag = Math.sqrt(dx*dx + dy*dy);
            this.x += (dx/mag) * this.speed * dt;
            this.y += (dy/mag) * this.speed * dt;
            // Center camera on King
            this.game.camera.x = this.x * this.game.map.tileSize - this.game.canvas.width / (2 * this.game.camera.zoom);
            this.game.camera.y = this.y * this.game.map.tileSize - this.game.canvas.height / (2 * this.game.camera.zoom);
        }
    }
    draw(ctx) {
        const px = this.x * this.game.map.tileSize, py = this.y * this.game.map.tileSize;
        // Crown shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.arc(px + 22, py + 22, 7, 0, Math.PI * 2); ctx.fill();
        // Body (Royal Purple)
        ctx.fillStyle = '#8e44ad';
        ctx.beginPath(); ctx.arc(px + 20, py + 20, 8, 0, Math.PI * 2); ctx.fill();
        // Gold Crown
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath(); ctx.moveTo(px+12, py+15); ctx.lineTo(px+14, py+8); ctx.lineTo(px+17, py+12); ctx.lineTo(px+20, py+5); ctx.lineTo(px+23, py+12); ctx.lineTo(px+26, py+8); ctx.lineTo(px+28, py+15); ctx.fill();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.time = { day: 1, season: 0, timeOfDay: 0, update(dt) {
            this.timeOfDay += dt / 60000;
            if (this.timeOfDay >= 1) { this.timeOfDay = 0; this.day++; if (this.day % 30 === 0) this.season = (this.season + 1) % 4; }
        }, getIsNight() { const h = this.timeOfDay * 24; return h > 20 || h < 6; } };
        this.economy = {
            resources: { wood: 500, food: 1000, stone: 1000, gold: 500 },
            buildings: [],
            tryBuild(type, x, y, game) {
                const cfg = BUILDING_TYPES[type];
                if (game.economy.resources.wood >= (cfg.cost.wood || 0) && game.economy.resources.stone >= (cfg.cost.stone || 0) && (game.economy.resources.gold || 0) >= (cfg.cost.gold || 0)) {
                    const tile = game.map.grid[y][x];
                    if (!tile.building && tile.type === 'grass') {
                        game.economy.resources.wood -= (cfg.cost.wood || 0); game.economy.resources.stone -= (cfg.cost.stone || 0);
                        if (cfg.cost.gold) game.economy.resources.gold -= cfg.cost.gold;
                        const b = new Building(game, type, x, y); game.economy.buildings.push(b); tile.building = b;
                        if (type === 'house') game.population.assignResidents(b); else game.population.assignWorkers(b);
                        game.ui.notify(`Zbudowano: ${cfg.name}`); return true;
                    }
                }
                return false;
            }
        };
        this.camera = new Camera(this);
        this.map = new Map(this, 50, 50);
        this.population = new Population(this);
        this.king = new King(this);
        this.ui = {
            selected: null,
            notify(m) {
                const n = document.getElementById('notifications'), d = document.createElement('div');
                d.className = 'notification'; d.innerText = m; n.appendChild(d); setTimeout(() => d.remove(), 5000);
            },
            update(game) {
                document.getElementById('res-wood').innerText = `Drewno: ${Math.floor(game.economy.resources.wood)}`;
                document.getElementById('res-food').innerText = `Jedzenie: ${Math.floor(game.economy.resources.food)}`;
                document.getElementById('res-stone').innerText = `Kamień: ${Math.floor(game.economy.resources.stone)}`;
                const hap = game.population.citizens.length > 0 ? Math.floor(game.population.citizens.reduce((s, c) => s + c.happiness, 0) / game.population.citizens.length) : 0;
                document.getElementById('stat-pop').innerText = `Pop: ${game.population.citizens.length} | Szczęście: ${hap}%`;
                const seasons = ['Wiosna', 'Lato', 'Jesień', 'Zima'], h = Math.floor(game.time.timeOfDay * 24), m = Math.floor((game.time.timeOfDay * 1440) % 60);
                document.getElementById('stat-time').innerText = `Dzień: ${game.time.day} (${seasons[game.time.season]}) ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            }
        };
        this.lastTime = 0;
        this.initUI();
        this.camera.x = (this.map.width * 20) - (this.canvas.width / 2);
        this.camera.y = (this.map.height * 20) - (this.canvas.height / 2);
    }
    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
    initUI() {
        document.querySelectorAll('.build-btn').forEach(b => b.addEventListener('mousedown', (e) => {
            e.stopPropagation(); this.ui.selected = e.target.dataset.type;
            this.ui.notify(`Wybrano: ${this.ui.selected}. Kliknij na mapę.`);
        }));
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.ui.selected) {
                const w = this.camera.screenToWorld(e.clientX, e.clientY);
                const tx = Math.floor(w.x / this.map.tileSize), ty = Math.floor(w.y / this.map.tileSize);
                if (tx >= 0 && tx < this.map.width && ty >= 0 && ty < this.map.height) {
                    if (this.economy.tryBuild(this.ui.selected, tx, ty, this)) this.ui.selected = null;
                }
            }
        });
    }
    start() { requestAnimationFrame((t) => this.loop(t)); this.ui.notify("Witaj w Twojej osadzie, Panie!"); }
    loop(t) {
        const dt = t - this.lastTime; this.lastTime = t;
        if (dt > 100) { requestAnimationFrame((t) => this.loop(t)); return; } 
        this.time.update(dt); this.population.update(dt);
        this.king.update(dt);
        this.economy.buildings.forEach(b => b.update(dt));
        this.ui.update(this);
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }
    draw() {
        const sc = ['#2ecc71', '#27ae60', '#d35400', '#ecf0f1'];
        this.ctx.fillStyle = sc[this.time.season]; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.camera.apply(this.ctx); 
        this.map.draw(this.ctx); 
        this.population.draw(this.ctx); 
        this.king.draw(this.ctx);
        this.camera.restore(this.ctx);
        if (this.time.getIsNight()) { this.ctx.fillStyle = 'rgba(0, 0, 50, 0.4)'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); }
    }
}

window.addEventListener('load', () => { const g = new Game(); g.start(); });
