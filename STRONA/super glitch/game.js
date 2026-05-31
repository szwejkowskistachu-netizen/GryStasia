const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const stabilityValueLabel = document.getElementById('stability-value');
const stabilityBarFill = document.getElementById('stability-bar-fill');
const gameOverScreen = document.getElementById('game-over');
const restartBtn = document.getElementById('restart-btn');

// Game Constants
const TILE_SIZE = 40;
const COLS = 20;
const ROWS = 15;
const GLITCH_INTERVAL = 1000; // 1 second

canvas.width = COLS * TILE_SIZE;
canvas.height = ROWS * TILE_SIZE;

// Game State
let stability = 100;
let lastGlitchTime = 0;
let lastMoveTime = 0;
const MOVE_COOLDOWN = 150; 
let gameActive = true;
let keys = {};
let blocks = [];
let player = {
    x: 1,
    y: 1,
    color: '#00ff00'
};

// Colors for glitches
const glitchColors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#ffffff', '#333333', '#444444', '#111111'];

function initWorld() {
    blocks = [];
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            // Border walls
            if (x === 0 || x === COLS - 1 || y === 0 || y === ROWS - 1) {
                blocks.push({ x, y, type: 'wall', color: '#444' });
            } else if (Math.random() < 0.15) {
                // Random internal walls, avoiding player start
                if (!(x === 1 && y === 1)) {
                    blocks.push({ x, y, type: 'wall', color: '#444' });
                }
            }
        }
    }
}

function updateStability(amount) {
    stability = Math.max(0, stability - amount);
    stabilityValueLabel.textContent = Math.round(stability);
    stabilityBarFill.style.width = `${stability}%`;

    // Visual feedback for low stability
    if (stability < 30) {
        stabilityValueLabel.parentElement.style.color = '#ff0000';
        stabilityBarFill.style.backgroundColor = '#ff0000';
    } else {
        stabilityValueLabel.parentElement.style.color = '#00ff00';
        stabilityBarFill.style.backgroundColor = '#00ff00';
    }

    if (stability <= 0) {
        endGame();
    }
}

function triggerGlitch() {
    // 1. Move some blocks
    // 2. Change some colors
    // 3. Add/Remove some blocks
    
    blocks.forEach((block, index) => {
        // Change color
        if (Math.random() < 0.15) {
            block.color = glitchColors[Math.floor(Math.random() * glitchColors.length)];
        }
        
        // Move wall
        if (Math.random() < 0.08 && block.type === 'wall') {
            const dx = Math.floor(Math.random() * 3) - 1;
            const dy = Math.floor(Math.random() * 3) - 1;
            const newX = block.x + dx;
            const newY = block.y + dy;
            
            // Keep walls inside borders roughly
            if (newX >= 0 && newX < COLS && newY >= 0 && newY < ROWS) {
                // Don't move wall onto player
                if (!(newX === player.x && newY === player.y)) {
                    block.x = newX;
                    block.y = newY;
                }
            }
        }

        // Randomly remove blocks (entropy)
        if (Math.random() < 0.02 && block.type === 'wall' && 
            !(block.x === 0 || block.x === COLS-1 || block.y === 0 || block.y === ROWS-1)) {
            blocks.splice(index, 1);
        }
    });

    // Randomly add new glitches
    if (Math.random() < 0.4) {
        const rx = Math.floor(Math.random() * COLS);
        const ry = Math.floor(Math.random() * ROWS);
        if (!isWallAt(rx, ry) && !(player.x === rx && player.y === ry)) {
            blocks.push({ 
                x: rx, 
                y: ry, 
                type: 'wall', 
                color: glitchColors[Math.floor(Math.random() * glitchColors.length)] 
            });
        }
    }

    // Teleport player if they get stuck or just for fun
    if (Math.random() < 0.05) {
        const rx = Math.floor(Math.random() * (COLS - 2)) + 1;
        const ry = Math.floor(Math.random() * (ROWS - 2)) + 1;
        if (!isWallAt(rx, ry)) {
            player.x = rx;
            player.y = ry;
        }
    }

    updateStability(1 + Math.random() * 4);
}

function isWallAt(x, y) {
    return blocks.some(b => b.x === x && b.y === y);
}

function movePlayer(dx, dy) {
    const nextX = player.x + dx;
    const nextY = player.y + dy;

    if (nextX >= 0 && nextX < COLS && nextY >= 0 && nextY < ROWS) {
        if (!isWallAt(nextX, nextY)) {
            player.x = nextX;
            player.y = nextY;
        }
    }
}

function handleInput(timestamp) {
    if (!gameActive) return;
    if (timestamp - lastMoveTime < MOVE_COOLDOWN) return;

    let dx = 0;
    let dy = 0;

    if (keys['w'] || keys['W']) dy = -1;
    else if (keys['s'] || keys['S']) dy = 1;
    else if (keys['a'] || keys['A']) dx = -1;
    else if (keys['d'] || keys['D']) dx = 1;

    if (dx !== 0 || dy !== 0) {
        movePlayer(dx, dy);
        lastMoveTime = timestamp;
    }
}

function endGame() {
    gameActive = false;
    gameOverScreen.classList.remove('hidden');
}

function restartGame() {
    stability = 100;
    gameActive = true;
    player.x = 1;
    player.y = 1;
    initWorld();
    updateStability(0);
    gameOverScreen.classList.add('hidden');
    lastGlitchTime = performance.now();
    lastMoveTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function draw() {
    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Glitch effect on rendering
    let offsetX = 0;
    let offsetY = 0;
    if (Math.random() < 0.05 * (1 - stability / 100)) {
        offsetX = (Math.random() - 0.5) * 10;
        offsetY = (Math.random() - 0.5) * 10;
    }

    ctx.save();
    ctx.translate(offsetX, offsetY);

    // Draw Blocks
    blocks.forEach(block => {
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x * TILE_SIZE, block.y * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
    });

    // Draw Player
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x * TILE_SIZE, player.y * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
    
    // Add a simple glow to player
    ctx.shadowBlur = 10;
    ctx.shadowColor = player.color;
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(player.x * TILE_SIZE, player.y * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
    
    ctx.restore();
}

function gameLoop(timestamp) {
    if (!gameActive) return;

    if (timestamp - lastGlitchTime > GLITCH_INTERVAL) {
        triggerGlitch();
        lastGlitchTime = timestamp;
    }

    handleInput(timestamp);
    draw();

    requestAnimationFrame(gameLoop);
}

// Event Listeners
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

// Since we want grid movement, keyup isn't strictly necessary for the way I implemented handleInput 
// but good for completeness if I change logic later.
window.addEventListener('keyup', (e) => {
    delete keys[e.key];
});

restartBtn.addEventListener('click', () => {
    restartGame();
});

// Start
initWorld();
lastGlitchTime = performance.now();
requestAnimationFrame(gameLoop);
