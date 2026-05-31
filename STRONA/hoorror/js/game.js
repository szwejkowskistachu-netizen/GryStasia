// BUNDLE WSZYSTKICH SKRYPTÓW GRY (Dla uniknięcia problemów z CORS w file://)

// --- MAP GENERATOR ---
class MapGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.map = [];
        this.rooms = [];
    }

    generate() {
        this.map = Array(this.height).fill().map(() => Array(this.width).fill(1));
        this.rooms = [];
        const minRoomSize = 4;
        const maxRoomSize = 10;
        const maxRooms = 15;

        for (let i = 0; i < maxRooms; i++) {
            const w = Math.floor(Math.random() * (maxRoomSize - minRoomSize)) + minRoomSize;
            const h = Math.floor(Math.random() * (maxRoomSize - minRoomSize)) + minRoomSize;
            const x = Math.floor(Math.random() * (this.width - w - 1)) + 1;
            const y = Math.floor(Math.random() * (this.height - h - 1)) + 1;
            const newRoom = { x, y, w, h, centerX: Math.floor(x + w / 2), centerY: Math.floor(y + h / 2) };
            let intersects = false;
            for (let otherRoom of this.rooms) {
                if (this.roomsIntersect(newRoom, otherRoom)) {
                    intersects = true;
                    break;
                }
            }
            if (!intersects) {
                this.createRoom(newRoom);
                if (this.rooms.length > 0) {
                    const prevRoom = this.rooms[this.rooms.length - 1];
                    this.createHTunnel(prevRoom.centerX, newRoom.centerX, prevRoom.centerY);
                    this.createVTunnel(prevRoom.centerY, newRoom.centerY, newRoom.centerX);
                }
                this.rooms.push(newRoom);
            }
        }
        return { grid: this.map, rooms: this.rooms };
    }

    roomsIntersect(r1, r2) {
        return (r1.x <= r2.x + r2.w && r1.x + r1.w >= r2.x && r1.y <= r2.y + r2.h && r1.y + r1.h >= r2.y);
    }

    createRoom(room) {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                if (y >= 0 && y < this.height && x >= 0 && x < this.width) this.map[y][x] = 0;
            }
        }
    }

    createHTunnel(x1, x2, y) {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            if (y >= 0 && y < this.height && x >= 0 && x < this.width) this.map[y][x] = 0;
        }
    }

    createVTunnel(y1, y2, x) {
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            if (y >= 0 && y < this.height && x >= 0 && x < this.width) this.map[y][x] = 0;
        }
    }
}

// --- PLAYER ---
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.speed = 2;
        this.angle = 0;
        this.battery = 100;
        this.isFlashlightOn = true;
        this.flashlightRange = 450; // Zwiększony zasięg
        this.flashlightAngle = Math.PI / 2.5; // Szerszy kąt
        this.inventory = [];
        this.fear = 0;
        this.isRunning = false;
        this.noise = 0;
        this.isHiding = false;
        this.isFlickering = false;
    }

    update(keys, mouse, map) {
        if (this.isHiding) return;
        let dx = 0;
        let dy = 0;
        this.isRunning = keys['ShiftLeft'] || keys['ShiftRight'];
        const currentSpeed = this.isRunning ? this.speed * 1.8 : this.speed;
        if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx = (dx / length) * currentSpeed;
            dy = (dy / length) * currentSpeed;
            if (!this.checkCollision(this.x + dx, this.y, map)) this.x += dx;
            if (!this.checkCollision(this.x, this.y + dy, map)) this.y += dy;
            this.noise = this.isRunning ? 100 : 40;
        } else {
            this.noise = 0;
        }

        this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);

        if (this.isFlashlightOn && this.battery > 0) {
            this.battery -= 0.01;
            this.isFlickering = (this.battery < 10 && Math.random() < 0.1);
        } else {
            this.isFlashlightOn = false;
        }
    }

    checkCollision(nx, ny, map) {
        const tileSize = 40;
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
            const cx = nx + Math.cos(angle) * this.radius;
            const cy = ny + Math.sin(angle) * this.radius;
            const gx = Math.floor(cx / tileSize);
            const gy = Math.floor(cy / tileSize);
            if (gy < 0 || gy >= map.length || gx < 0 || gx >= map[0].length || map[gy][gx] === 1) return true;
        }
        return false;
    }

    draw(ctx, camera) {
        if (this.isHiding) return;
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.radius + 5, 0);
        ctx.stroke();
        ctx.restore();
    }
}

// --- MONSTER ---
class Monster {
    constructor(x, y, difficulty) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.speed = difficulty === 'easy' ? 1 : (difficulty === 'nightmare' ? 2.2 : 1.6);
        this.angle = 0;
        this.state = 'PATROL';
        this.target = null;
        this.memory = { playerVisits: {}, hidingSpotsChecked: [], lastPlayerPos: null };
        this.searchTimer = 0;
    }

    update(player, map, rooms) {
        const distToPlayer = this.getDistance(this.x, this.y, player.x, player.y);
        const canSeePlayer = this.checkLineOfSight(player, map) && !player.isHiding;
        const canHearPlayer = player.noise > 0 && distToPlayer < (player.noise * 3);

        if (canSeePlayer) {
            this.state = 'CHASE';
            this.target = { x: player.x, y: player.y };
            this.memory.lastPlayerPos = { x: player.x, y: player.y };
            this.updatePlayerVisits(player, rooms);
        } else if (canHearPlayer && this.state !== 'CHASE') {
            this.state = 'INVESTIGATE';
            this.target = { x: player.x, y: player.y };
        } else if (this.state === 'CHASE' && !canSeePlayer) {
            this.state = 'INVESTIGATE';
            this.searchTimer = 300;
        }

        this.move(map);
        if (this.state === 'PATROL' && (!this.target || this.reachedTarget())) this.setNewPatrolPoint(rooms);
        if (this.state === 'INVESTIGATE' && this.reachedTarget()) {
            if (this.searchTimer > 0) {
                this.searchTimer--;
                this.angle += 0.1;
            } else {
                this.state = 'PATROL';
            }
        }
    }

    updatePlayerVisits(player, rooms) {
        const gx = Math.floor(player.x / 40);
        const gy = Math.floor(player.y / 40);
        rooms.forEach((room, index) => {
            if (gx >= room.x && gx < room.x + room.w && gy >= room.y && gy < room.y + room.h) {
                this.memory.playerVisits[index] = (this.memory.playerVisits[index] || 0) + 1;
            }
        });
    }

    setNewPatrolPoint(rooms) {
        let totalVisits = Object.values(this.memory.playerVisits).reduce((a, b) => a + b, 0);
        let selectedRoom;
        if (totalVisits > 0 && Math.random() < 0.7) {
            let rand = Math.random() * totalVisits;
            let current = 0;
            for (let roomIdx in this.memory.playerVisits) {
                current += this.memory.playerVisits[roomIdx];
                if (rand <= current) {
                    selectedRoom = rooms[roomIdx];
                    break;
                }
            }
        }
        if (!selectedRoom) selectedRoom = rooms[Math.floor(Math.random() * rooms.length)];
        this.target = { x: (selectedRoom.x + Math.random() * selectedRoom.w) * 40, y: (selectedRoom.y + Math.random() * selectedRoom.h) * 40 };
    }

    move(map) {
        if (!this.target) return;
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        this.angle = Math.atan2(dy, dx);
        const vx = Math.cos(this.angle) * this.speed;
        const vy = Math.sin(this.angle) * this.speed;
        if (!this.checkCollision(this.x + vx, this.y, map)) this.x += vx;
        if (!this.checkCollision(this.x, this.y + vy, map)) this.y += vy;
    }

    reachedTarget() { return this.getDistance(this.x, this.y, this.target.x, this.target.y) < 20; }
    getDistance(x1, y1, x2, y2) { return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2); }

    checkLineOfSight(player, map) {
        const dist = this.getDistance(this.x, this.y, player.x, player.y);
        if (dist > 400) return false;
        const steps = 10;
        for (let i = 1; i < steps; i++) {
            const px = this.x + (player.x - this.x) * (i / steps);
            const py = this.y + (player.y - this.y) * (i / steps);
            const gx = Math.floor(px / 40);
            const gy = Math.floor(py / 40);
            if (map[gy] && map[gy][gx] === 1) return false;
        }
        return true;
    }

    checkCollision(nx, ny, map) {
        const gx = Math.floor(nx / 40);
        const gy = Math.floor(ny / 40);
        return !map[gy] || map[gy][gx] === 1;
    }

    draw(ctx, camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius, -this.radius);
        ctx.lineTo(-this.radius, this.radius);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(5, -5, 2, 0, Math.PI * 2);
        ctx.arc(5, 5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// --- LIGHTING ---
class Lighting {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.lightCanvas = document.createElement('canvas');
        this.lightCtx = this.lightCanvas.getContext('2d');
    }

    resize(w, h) { this.lightCanvas.width = w; this.lightCanvas.height = h; }

    draw(player, monster, camera, walls) {
        this.lightCtx.clearRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);
        this.lightCtx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.lightCtx.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);
        this.lightCtx.save();
        this.lightCtx.translate(-camera.x, -camera.y);
        if (player.isFlashlightOn && (!player.isFlickering || Math.random() > 0.3)) this.drawFlashlight(player, walls);
        this.drawPointLight(player.x, player.y, 120);
        this.lightCtx.restore();
        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.drawImage(this.lightCanvas, 0, 0);
        this.ctx.globalCompositeOperation = 'source-over';
    }

    drawFlashlight(player, walls) {
        const range = player.flashlightRange;
        const angle = player.flashlightAngle;
        this.lightCtx.save();
        this.lightCtx.beginPath();
        this.lightCtx.moveTo(player.x, player.y);
        const segments = 30;
        const startAngle = player.angle - angle / 2;
        for (let i = 0; i <= segments; i++) {
            const currentAngle = startAngle + (angle * i / segments);
            const tx = player.x + Math.cos(currentAngle) * range;
            const ty = player.y + Math.sin(currentAngle) * range;
            const hit = this.castRay(player.x, player.y, tx, ty, walls);
            this.lightCtx.lineTo(hit.x, hit.y);
        }
        this.lightCtx.closePath();
        this.lightCtx.globalCompositeOperation = 'destination-out';
        this.lightCtx.fillStyle = 'white';
        this.lightCtx.fill();
        this.lightCtx.restore();
    }

    drawPointLight(x, y, radius) {
        this.lightCtx.save();
        const grad = this.lightCtx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, 'white');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.lightCtx.globalCompositeOperation = 'destination-out';
        this.lightCtx.fillStyle = grad;
        this.lightCtx.beginPath();
        this.lightCtx.arc(x, y, radius, 0, Math.PI * 2);
        this.lightCtx.fill();
        this.lightCtx.restore();
    }

    castRay(x1, y1, x2, y2, walls) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const steps = 20;
        for (let i = 1; i <= steps; i++) {
            const px = x1 + (dx * i / steps);
            const py = y1 + (dy * i / steps);
            const gx = Math.floor(px / 40);
            const gy = Math.floor(py / 40);
            if (gy >= 0 && gy < walls.length && gx >= 0 && gx < walls[0].length && walls[gy][gx] === 1) return { x: px, y: py };
        }
        return { x: x2, y: y2 };
    }
}

// --- AUDIO MANAGER ---
class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
    }

    playProceduralSound(type, volume = 0.5) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain);
        const now = this.ctx.currentTime;
        if (type === 'step') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(60, now);
            osc.frequency.exponentialRampToValueAtTime(10, now + 0.1);
            gain.gain.setValueAtTime(volume * 0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'heartbeat') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(50, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(volume, now + 0.05);
            gain.gain.linearRampToValueAtTime(0, now + 0.2);
            osc.start(now); osc.stop(now + 0.2);
        } else if (type === 'scare') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);
            gain.gain.setValueAtTime(volume, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now); osc.stop(now + 0.5);
        }
    }
}

// --- MAIN GAME ---
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.camera = { x: 0, y: 0 };
        this.tileSize = 40;
        this.difficulty = 'normal';
        this.isGameOver = false;
        this.gameStarted = false;
        this.initEventListeners();
        this.menuOverlay = document.getElementById('menu-overlay');
        this.deathScreen = document.getElementById('death-screen');
        this.batteryDisplay = document.getElementById('battery-level');
        this.objectiveDisplay = document.getElementById('current-objective');
        
        document.getElementById('start-btn').addEventListener('click', () => {
            console.log("Kliknięto START");
            this.start();
        });
        document.getElementById('retry-btn').addEventListener('click', () => location.reload());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.lighting) this.lighting.resize(this.canvas.width, this.canvas.height);
    }

    initEventListeners() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX + this.camera.x;
            this.mouse.y = e.clientY + this.camera.y;
        });
        window.addEventListener('mousedown', () => {
            if (this.player) this.player.isFlashlightOn = !this.player.isFlashlightOn;
        });
    }

    start() {
        const diffInput = document.querySelector('input[name="difficulty"]:checked');
        this.difficulty = diffInput ? diffInput.value : 'normal';
        this.menuOverlay.classList.add('hidden');
        this.gameStarted = true;
        this.mapGen = new MapGenerator(50, 50);
        const mapData = this.mapGen.generate();
        this.map = mapData.grid;
        this.rooms = mapData.rooms;
        const startRoom = this.rooms[0];
        this.player = new Player(startRoom.centerX * this.tileSize, startRoom.centerY * this.tileSize);
        const monsterRoom = this.rooms[this.rooms.length - 1];
        this.monster = new Monster(monsterRoom.centerX * this.tileSize, monsterRoom.centerY * this.tileSize, this.difficulty);
        this.lighting = new Lighting(this.canvas, this.ctx);
        this.lighting.resize(this.canvas.width, this.canvas.height);
        this.audio = new AudioManager();
        this.stepTimer = 0;
        this.heartbeatTimer = 0;
        this.gameLoop();
    }

    update() {
        if (this.isGameOver || !this.gameStarted) return;
        this.player.update(this.keys, this.mouse, this.map);
        this.monster.update(this.player, this.map, this.rooms);
        if (this.player.noise > 0) {
            this.stepTimer--;
            if (this.stepTimer <= 0) {
                this.audio.playProceduralSound('step', this.player.isRunning ? 0.4 : 0.2);
                this.stepTimer = this.player.isRunning ? 15 : 30;
            }
        }
        if (this.player.fear > 30) {
            this.heartbeatTimer--;
            if (this.heartbeatTimer <= 0) {
                this.audio.playProceduralSound('heartbeat', this.player.fear / 100);
                this.heartbeatTimer = 60 - (this.player.fear / 2);
            }
        }
        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;
        this.batteryDisplay.innerText = Math.floor(this.player.battery);
        const dist = Math.sqrt((this.player.x - this.monster.x)**2 + (this.player.y - this.monster.y)**2);
        if (dist < this.player.radius + this.monster.radius) this.gameOver("Potwór Cię dopadł.");
        this.updateFear(dist);
    }

    updateFear(distToMonster) {
        if (distToMonster < 200) {
            this.player.fear += 0.5;
            if (Math.random() < 0.01) this.audio.playProceduralSound('scare', 0.3);
        } else {
            this.player.fear -= 0.1;
        }
        this.player.fear = Math.max(0, Math.min(100, this.player.fear));
        const fearOverlay = document.getElementById('fear-overlay');
        fearOverlay.style.opacity = this.player.fear / 100;
        if (this.player.fear > 70) document.getElementById('game-container').classList.add('shaking');
        else document.getElementById('game-container').classList.remove('shaking');
    }

    draw() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                this.ctx.fillStyle = this.map[y][x] === 1 ? '#2c3e50' : '#1a1a1a';
                this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
            }
        }
        this.monster.draw(this.ctx, { x: 0, y: 0 });
        this.player.draw(this.ctx, { x: 0, y: 0 });
        this.ctx.restore();
        this.lighting.draw(this.player, this.monster, this.camera, this.map);
    }

    gameOver(reason) {
        this.isGameOver = true;
        this.deathScreen.classList.remove('hidden');
        document.getElementById('death-cause').innerText = reason;
    }

    gameLoop() {
        this.update();
        this.draw();
        if (!this.isGameOver) requestAnimationFrame(() => this.gameLoop());
    }
}

// Inicjalizacja gry po załadowaniu okna
window.onload = () => {
    new Game();
};
