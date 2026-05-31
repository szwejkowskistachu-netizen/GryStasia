/**
 * Geometry Dash - Geometry and Object Structure
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

    // Helper for collision detection with rect
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
    }

    get bounds() {
        return new Rect(this.pos.x, this.pos.y, this.size.width, this.size.height);
    }
}

class Player extends GameObject {
    constructor(x, y) {
        super(x, y, 30, 30, 'player');
        this.color = '#00ff00';
        this.velocity = { x: 5, y: 0 };
        this.gravity = 0.6;
        this.jumpForce = -12;
        this.onGround = false;
        // Save spawn position for resets
        this.spawnPos = new Point(x, y);
    }

    reset() {
        this.pos.x = this.spawnPos.x;
        this.pos.y = this.spawnPos.y;
        this.velocity.y = 0;
    }

    update() {
        // Apply gravity
        this.velocity.y += this.gravity;
        
        // Move
        this.pos.x += this.velocity.x;
        this.pos.y += this.velocity.y;
    }

    jump() {
        if (this.onGround) {
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
        // Simple horizontal tracking
        this.pos.x = player.pos.x - this.viewportSize.width / 4;
        // Keep some vertical context, but can be adjusted
        this.pos.y = 0; 
    }

    worldToScreen(point) {
        return new Point(point.x - this.pos.x, point.y - this.pos.y);
    }
}

class World {
    constructor(gridSize = 30) {
        this.gridSize = gridSize;
        this.objects = [];
        this.platforms = [];
        this.obstacles = [];
        this.player = null;
        this.goal = null;
    }

    addObject(obj) {
        this.objects.push(obj);
        if (obj instanceof Platform) this.platforms.push(obj);
        if (obj instanceof Obstacle) this.obstacles.push(obj);
        if (obj instanceof Player) this.player = obj;
        if (obj instanceof Goal) this.goal = obj;
    }

    // Grid coordinate conversion
    gridToWorld(gx, gy) {
        return new Point(gx * this.gridSize, gy * this.gridSize);
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

    render(world, camera) {
        this.clear();

        // 1. Background (could be handled separately)
        
        // 2. Platforms
        world.platforms.forEach(p => this.drawRect(p.bounds, p.color, camera));

        // 3. Obstacles
        world.obstacles.forEach(o => {
            if (o.shape === 'triangle') {
                this.drawTriangle(o.triangle, o.color, camera);
            } else {
                this.drawRect(o.bounds, o.color, camera);
            }
        });

        // 4. Player
        if (world.player) {
            this.drawRect(world.player.bounds, world.player.color, camera);
        }

        // 5. Interface (placeholders)
    }
}

// --- Physics & Logic ---

function resolveCollisions(player, world) {
    player.onGround = false;
    const playerRect = player.bounds;

    // 1. Reset if fell off
    if (player.pos.y > 1000) {
        player.reset();
        return;
    }

    for (const platform of world.platforms) {
        const platRect = platform.bounds;
        if (playerRect.intersects(platRect)) {
            // Collision from top
            if (player.velocity.y > 0 && playerRect.bottom > platRect.top && playerRect.centerY < platRect.top) {
                player.pos.y = platRect.top - player.size.height;
                player.velocity.y = 0;
                player.onGround = true;
            }
            // Side collision (death in Geometry Dash)
            else if (playerRect.right > platRect.left && playerRect.left < platRect.left && playerRect.bottom > platRect.top + 5) {
                player.reset();
                return;
            }
        }
    }

    // 2. Check obstacles (death)
    for (const obstacle of world.obstacles) {
        if (playerRect.intersects(obstacle.bounds)) {
            player.reset();
            return;
        }
    }

    // 3. Check goal
    if (world.goal && playerRect.intersects(world.goal.bounds)) {
        alert("Level Complete!");
        player.reset();
    }
}

// --- Initialization ---

const gameWorld = new World(40);
const gameCamera = new Camera(window.innerWidth, window.innerHeight);
const gameRenderer = new Renderer('gameCanvas');

// --- Level Design (Larger Map) ---

// Spawn player first to have a reference
const plPos = gameWorld.gridToWorld(2, 10);
const player = new Player(plPos.x, plPos.y - 40);
gameWorld.addObject(player);

const levelData = [
    // [type, gx, gy, gw, gh, extra]
    // Ciągła podłoga na całym poziomie
    ['platform', 0, 10, 150, 1],
    
    // Przeszkody na podłodze
    ['obstacle', 12, 9, 1, 1, 'triangle'], 
    ['obstacle', 20, 9, 1, 1, 'triangle'], 
    ['obstacle', 21, 9, 1, 1, 'triangle'], 
    
    ['obstacle', 30, 9, 1, 1, 'rect'], 
    ['obstacle', 38, 9, 1, 1, 'triangle'],
    ['obstacle', 45, 9, 1, 1, 'rect'],
    
    // Platformy wiszące (dodatkowe wyzwanie, ale pod spodem jest ziemia)
    ['platform', 60, 7, 10, 1],
    ['obstacle', 64, 6, 1, 1, 'triangle'],
    
    // Schody
    ['platform', 75, 9, 5, 1],
    ['platform', 80, 8, 5, 1],
    ['platform', 85, 7, 5, 1],
    
    // Rytmiczne przeszkody na końcu
    ['obstacle', 100, 9, 1, 1, 'triangle'],
    ['obstacle', 105, 9, 1, 1, 'triangle'],
    ['obstacle', 110, 9, 1, 1, 'triangle'],
    ['obstacle', 115, 9, 1, 1, 'triangle'],
    ['obstacle', 120, 9, 1, 1, 'triangle'],
    
    ['obstacle', 130, 9, 2, 1, 'rect'],
    
    // Meta
    ['goal', 145, 8, 2, 2]
];

levelData.forEach(data => {
    const [type, gx, gy, gw, gh, extra] = data;
    const pos = gameWorld.gridToWorld(gx, gy);
    const size = { w: gw * gameWorld.gridSize, h: gh * gameWorld.gridSize };
    
    if (type === 'platform') {
        gameWorld.addObject(new Platform(pos.x, pos.y, size.w, size.h));
    } else if (type === 'obstacle') {
        gameWorld.addObject(new Obstacle(pos.x, pos.y, size.w, size.h, extra || 'triangle'));
    } else if (type === 'goal') {
        gameWorld.addObject(new Goal(pos.x, pos.y, size.w, size.h));
    }
});

// Input handling
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        player.jump();
    }
});
window.addEventListener('mousedown', () => player.jump());
window.addEventListener('touchstart', () => player.jump());

// Start loop
function loop() {
    // 1. Update logic
    player.update();
    resolveCollisions(player, gameWorld);
    
    // 2. Camera follow
    gameCamera.follow(player);
    
    // 3. Draw
    gameRenderer.render(gameWorld, gameCamera);
    
    requestAnimationFrame(loop);
}

loop();
