/**
 * Geometry Dash - Enhanced with Menu, Levels, Coins, Shop and Music
 */

// --- Basic Geometry Classes ---

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Rect {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    get left() { return this.x; }
    get right() { return this.x + this.width; }
    get top() { return this.y; }
    get bottom() { return this.y + this.height; }
    get centerX() { return this.x + this.width / 2; }
    get centerY() { return this.y + this.height / 2; }

    intersects(other) {
        return (this.left < other.right &&
                this.right > other.left &&
                this.top < other.bottom &&
                this.bottom > other.top);
    }
}

class Triangle {
    constructor(p1, p2, p3) {
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    }

    getVertices() {
        return [this.p1, this.p2, this.p3];
    }
}

// --- Game Object Classes ---

class GameObject {
    constructor(x, y, width, height, type) {
        this.pos = new Point(x, y);
        this.size = { width, height };
        this.type = type;
        this.color = '#fff';
        this.active = true;
    }

    get bounds() {
        return new Rect(this.pos.x, this.pos.y, this.size.width, this.size.height);
    }
}

class Player extends GameObject {
    constructor(x, y) {
        super(x, y, 30, 30, 'player');
        this.color = localStorage.getItem('playerColor') || '#00ff00';
        this.velocity = { x: 5, y: 0 };
        this.gravity = 0.6;
        this.jumpForce = -12;
        this.onGround = false;
        this.spawnPos = new Point(x, y);
        this.dead = false;
    }

    reset() {
        this.pos.x = this.spawnPos.x;
        this.pos.y = this.spawnPos.y;
        this.velocity.y = 0;
        this.dead = false;
        if (gameState.currentMusic) {
            gameState.currentMusic.currentTime = 0;
            gameState.currentMusic.play().catch(e => console.log("Music play blocked"));
        }
    }

    update() {
        if (this.dead) return;
        this.velocity.y += this.gravity;
        this.pos.x += this.velocity.x;
        this.pos.y += this.velocity.y;
    }

    jump() {
        if (this.onGround && !this.dead) {
            this.velocity.y = this.jumpForce;
            this.onGround = false;
        }
    }
}

class Platform extends GameObject {
    constructor(x, y, width, height) {
        super(x, y, width, height, 'platform');
        this.color = '#333';
    }
}

class Obstacle extends GameObject {
    constructor(x, y, width, height, shape = 'triangle') {
        super(x, y, width, height, 'obstacle');
        this.shape = shape;
        this.color = '#ff0000';
        
        if (shape === 'triangle') {
            this.triangle = new Triangle(
                new Point(x, y + height),
                new Point(x + width / 2, y),
                new Point(x + width, y + height)
            );
        }
    }
}

class Coin extends GameObject {
    constructor(x, y) {
        super(x, y, 20, 20, 'coin');
        this.color = '#f4b400';
    }
}

class Goal extends GameObject {
    constructor(x, y, width, height) {
        super(x, y, width, height, 'goal');
        this.color = '#ffff00';
    }
}

// --- World and Camera ---

class Camera {
    constructor(width, height) {
        this.pos = new Point(0, 0);
        this.viewportSize = { width, height };
    }

    follow(player) {
        this.pos.x = player.pos.x - this.viewportSize.width / 4;
        this.pos.y = 0; 
    }

    worldToScreen(point) {
        return new Point(point.x - this.pos.x, point.y - this.pos.y);
    }
}

class World {
    constructor(gridSize = 40) {
        this.gridSize = gridSize;
        this.platforms = [];
        this.obstacles = [];
        this.coins = [];
        this.player = null;
        this.goal = null;
    }

    addObject(obj) {
        if (obj instanceof Platform) this.platforms.push(obj);
        if (obj instanceof Obstacle) this.obstacles.push(obj);
        if (obj instanceof Coin) this.coins.push(obj);
        if (obj instanceof Player) this.player = obj;
        if (obj instanceof Goal) this.goal = obj;
    }

    gridToWorld(gx, gy) {
        return new Point(gx * this.gridSize, gy * this.gridSize);
    }

    clear() {
        this.platforms = [];
        this.obstacles = [];
        this.coins = [];
        this.player = null;
        this.goal = null;
    }
}

// --- Renderer ---

class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawRect(rect, color, camera) {
        const screenPos = camera.worldToScreen(new Point(rect.x, rect.y));
        this.ctx.fillStyle = color;
        this.ctx.fillRect(screenPos.x, screenPos.y, rect.width, rect.height);
    }

    drawTriangle(triangle, color, camera) {
        const p1 = camera.worldToScreen(triangle.p1);
        const p2 = camera.worldToScreen(triangle.p2);
        const p3 = camera.worldToScreen(triangle.p3);

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.lineTo(p3.x, p3.y);
        this.ctx.closePath();
        this.ctx.fill();
    }

    drawCoin(coin, camera) {
        const screenPos = camera.worldToScreen(new Point(coin.pos.x + coin.size.width/2, coin.pos.y + coin.size.height/2));
        this.ctx.fillStyle = coin.color;
        this.ctx.beginPath();
        this.ctx.arc(screenPos.x, screenPos.y, coin.size.width/2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.stroke();
    }

    render(world, camera) {
        this.clear();
        
        // Always draw background
        this.ctx.fillStyle = '#111'; // Slightly lighter black to see if it renders
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!world.player || !gameState.inGame) return;

        world.platforms.forEach(p => this.drawRect(p.bounds, p.color, camera));
        world.obstacles.forEach(o => {
            if (o.shape === 'triangle') this.drawTriangle(o.triangle, o.color, camera);
            else this.drawRect(o.bounds, o.color, camera);
        });
        world.coins.forEach(c => { if (c.active) this.drawCoin(c, camera); });
        if (world.goal) this.drawRect(world.goal.bounds, world.goal.color, camera);
        if (world.player) this.drawRect(world.player.bounds, world.player.color, camera);
    }
}

// --- Game Logic ---

const gameState = {
    coins: parseInt(localStorage.getItem('coins')) || 0,
    ownedSkins: JSON.parse(localStorage.getItem('ownedSkins')) || ['#00ff00'],
    currentScreen: 'main-menu',
    currentMusic: null,
    inGame: false
};

const skins = [
    { name: 'Green', color: '#00ff00', price: 0 },
    { name: 'Blue', color: '#0000ff', price: 10 },
    { name: 'Red', color: '#ff0000', price: 20 },
    { name: 'Yellow', color: '#ffff00', price: 30 },
    { name: 'Purple', color: '#800080', price: 50 },
    { name: 'Cyan', color: '#00ffff', price: 100 }
];

const levels = [
    {
        name: 'Stereo Madness',
        music: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        data: [
            ['platform', 0, 10, 100, 1],
            ['obstacle', 15, 9, 1, 1],
            ['coin', 20, 8],
            ['obstacle', 30, 9, 1, 1],
            ['obstacle', 31, 9, 1, 1],
            ['coin', 40, 7],
            ['platform', 50, 7, 5, 1],
            ['obstacle', 52, 6, 1, 1],
            ['goal', 90, 8, 2, 2]
        ]
    },
    {
        name: 'Back on Track',
        music: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        data: [
            ['platform', 0, 10, 120, 1],
            ['obstacle', 10, 9, 1, 1],
            ['obstacle', 25, 9, 1, 1, 'rect'],
            ['coin', 30, 7],
            ['platform', 40, 7, 10, 1],
            ['obstacle', 45, 6, 1, 1],
            ['coin', 60, 9],
            ['obstacle', 70, 9, 2, 1, 'rect'],
            ['goal', 110, 8, 2, 2]
        ]
    },
    {
        name: 'Polargeist',
        music: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        data: [
            ['platform', 0, 10, 150, 1],
            ['platform', 10, 7, 5, 1],
            ['obstacle', 12, 6, 1, 1],
            ['coin', 12, 5],
            ['obstacle', 30, 9, 1, 1],
            ['obstacle', 32, 9, 1, 1],
            ['obstacle', 34, 9, 1, 1],
            ['platform', 50, 6, 5, 1],
            ['platform', 60, 4, 5, 1],
            ['coin', 62, 3],
            ['goal', 140, 8, 2, 2]
        ]
    }
];

function updateUI() {
    document.getElementById('coin-count').innerText = gameState.coins;
    renderShop();
}

function showScreen(screenId) {
    document.querySelectorAll('.ui-screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(screenId).classList.remove('hidden');
    gameState.currentScreen = screenId;
    
    if (screenId === 'main-menu') {
        if (gameState.currentMusic) {
            gameState.currentMusic.pause();
            gameState.currentMusic = null;
        }
        gameState.inGame = false;
    }
}

function renderShop() {
    const grid = document.getElementById('skin-grid');
    grid.innerHTML = '';
    skins.forEach(skin => {
        const isOwned = gameState.ownedSkins.includes(skin.color);
        const item = document.createElement('div');
        item.className = 'skin-item';
        item.style.backgroundColor = skin.color;
        item.innerHTML = `
            <div style="margin-top: 40px; background: rgba(0,0,0,0.5); padding: 5px;">
                ${skin.name}<br>
                ${isOwned ? 'OWNED' : skin.price + ' 🟡'}
            </div>
        `;
        item.onclick = () => {
            if (isOwned) {
                localStorage.setItem('playerColor', skin.color);
                if (gameWorld.player) gameWorld.player.color = skin.color;
                alert('Skin selected!');
            } else if (gameState.coins >= skin.price) {
                gameState.coins -= skin.price;
                gameState.ownedSkins.push(skin.color);
                localStorage.setItem('coins', gameState.coins);
                localStorage.setItem('ownedSkins', JSON.stringify(gameState.ownedSkins));
                updateUI();
                alert('Skin bought!');
            } else {
                alert('Not enough coins!');
            }
        };
        grid.appendChild(item);
    });
}

function startLevel(index) {
    const level = levels[index];
    gameWorld.clear();
    
    // Spawn player
    const plPos = gameWorld.gridToWorld(2, 10);
    const playerObj = new Player(plPos.x, plPos.y - 40);
    gameWorld.addObject(playerObj);

    level.data.forEach(data => {
        const [type, gx, gy, gw, gh, extra] = data;
        const pos = gameWorld.gridToWorld(gx, gy);
        
        if (type === 'platform') gameWorld.addObject(new Platform(pos.x, pos.y, (gw||1) * gameWorld.gridSize, (gh||1) * gameWorld.gridSize));
        else if (type === 'obstacle') gameWorld.addObject(new Obstacle(pos.x, pos.y, (gw||1) * gameWorld.gridSize, (gh||1) * gameWorld.gridSize, extra || 'triangle'));
        else if (type === 'coin') gameWorld.addObject(new Coin(pos.x, pos.y));
        else if (type === 'goal') gameWorld.addObject(new Goal(pos.x, pos.y, (gw||1) * gameWorld.gridSize, (gh||1) * gameWorld.gridSize));
    });

    // Music - handle potential file:// or CORS errors
    try {
        if (gameState.currentMusic) {
            gameState.currentMusic.pause();
            gameState.currentMusic = null;
        }
        gameState.currentMusic = new Audio();
        gameState.currentMusic.crossOrigin = "anonymous";
        gameState.currentMusic.src = level.music;
        gameState.currentMusic.loop = true;
        gameState.currentMusic.play().catch(e => {
            console.warn("Music play failed - likely a browser restriction or local file access issue.", e);
        });
    } catch (err) {
        console.error("Audio initialization error:", err);
    }

    showScreen('none'); // Hide all screens
    gameState.inGame = true;
    updateUI();
}

function resolveCollisions(player, world) {
    player.onGround = false;
    const playerRect = player.bounds;

    if (player.pos.y > 1000) {
        player.reset();
        return;
    }

    for (const platform of world.platforms) {
        const platRect = platform.bounds;
        if (playerRect.intersects(platRect)) {
            if (player.velocity.y > 0 && playerRect.bottom > platRect.top && playerRect.centerY < platRect.top) {
                player.pos.y = platRect.top - player.size.height;
                player.velocity.y = 0;
                player.onGround = true;
            } else if (playerRect.right > platRect.left && playerRect.left < platRect.left && playerRect.bottom > platRect.top + 5) {
                player.reset();
                return;
            }
        }
    }

    for (const obstacle of world.obstacles) {
        if (playerRect.intersects(obstacle.bounds)) {
            player.reset();
            return;
        }
    }

    for (const coin of world.coins) {
        if (coin.active && playerRect.intersects(coin.bounds)) {
            coin.active = false;
            gameState.coins++;
            localStorage.setItem('coins', gameState.coins);
            updateUI();
        }
    }

    if (world.goal && playerRect.intersects(world.goal.bounds)) {
        alert("Level Complete!");
        showScreen('level-select');
    }
}

// --- Initialization ---

const gameWorld = new World(40);
const gameCamera = new Camera(window.innerWidth, window.innerHeight);
const gameRenderer = new Renderer('gameCanvas');

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') playerJump();
    if (e.code === 'Escape') showScreen('main-menu');
});
window.addEventListener('mousedown', () => playerJump());
window.addEventListener('touchstart', () => playerJump());

function playerJump() {
    if (gameWorld.player) gameWorld.player.jump();
}

function loop() {
    if (gameState.inGame && gameWorld.player) {
        gameWorld.player.update();
        resolveCollisions(gameWorld.player, gameWorld);
        gameCamera.follow(gameWorld.player);
    }
    
    // Always render to avoid black screen, even if just clearing with background
    gameRenderer.render(gameWorld, gameCamera);
    
    requestAnimationFrame(loop);
}

updateUI();
loop();
