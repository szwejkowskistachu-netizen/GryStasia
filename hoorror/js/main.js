import { MapGenerator } from './map.js';
import { Player } from './player.js';
import { Monster } from './monster.js';
import { Lighting } from './lighting.js';
import { AudioManager } from './audio.js';

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
        
        // UI elements
        this.menuOverlay = document.getElementById('menu-overlay');
        this.deathScreen = document.getElementById('death-screen');
        this.batteryDisplay = document.getElementById('battery-level');
        this.objectiveDisplay = document.getElementById('current-objective');
        
        document.getElementById('start-btn').addEventListener('click', () => this.start());
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
        const diff = document.querySelector('input[name="difficulty"]:checked').value;
        this.difficulty = diff;
        
        this.menuOverlay.classList.add('hidden');
        this.gameStarted = true;
        
        this.mapGen = new MapGenerator(50, 50);
        const mapData = this.mapGen.generate();
        this.map = mapData.grid;
        this.rooms = mapData.rooms;

        const startRoom = this.rooms[0];
        this.player = new Player(
            startRoom.centerX * this.tileSize, 
            startRoom.centerY * this.tileSize
        );

        const monsterRoom = this.rooms[this.rooms.length - 1];
        this.monster = new Monster(
            monsterRoom.centerX * this.tileSize,
            monsterRoom.centerY * this.tileSize,
            this.difficulty
        );

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

        // Dźwięki kroków
        if (this.player.noise > 0) {
            this.stepTimer--;
            if (this.stepTimer <= 0) {
                this.audio.playProceduralSound('step', this.player.isRunning ? 0.4 : 0.2);
                this.stepTimer = this.player.isRunning ? 15 : 30;
            }
        }

        // Dźwięk bicia serca przy strachu
        if (this.player.fear > 30) {
            this.heartbeatTimer--;
            if (this.heartbeatTimer <= 0) {
                this.audio.playProceduralSound('heartbeat', this.player.fear / 100);
                this.heartbeatTimer = 60 - (this.player.fear / 2);
            }
        }

        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;

        // Aktualizacja UI
        this.batteryDisplay.innerText = Math.floor(this.player.battery);
        
        // Sprawdzanie kolizji z potworem (Game Over)
        const dist = Math.sqrt((this.player.x - this.monster.x)**2 + (this.player.y - this.monster.y)**2);
        if (dist < this.player.radius + this.monster.radius) {
            this.gameOver("Potwór Cię dopadł.");
        }

        // System strachu
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

        if (this.player.fear > 70) {
            document.getElementById('game-container').classList.add('shaking');
        } else {
            document.getElementById('game-container').classList.remove('shaking');
        }
    }

    draw() {
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // Rysowanie mapy
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                if (this.map[y][x] === 1) {
                    this.ctx.fillStyle = '#2c3e50';
                    this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                } else {
                    this.ctx.fillStyle = '#1a1a1a';
                    this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                }
            }
        }

        this.monster.draw(this.ctx, { x: 0, y: 0 });
        this.player.draw(this.ctx, { x: 0, y: 0 });

        this.ctx.restore();

        // Oświetlenie
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
        if (!this.isGameOver) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

new Game();
