const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Constants
const BLOCK_SIZE = 40;
const GRAVITY = 0.8;
const JUMP_FORCE = -12;
const SPEED = 5;

// Game State
let gameState = {
    mode: 'menu', // menu, play, editor, levelSelect, profile
    player: {
        x: 100, y: 0, velX: SPEED, velY: 0,
        width: BLOCK_SIZE, height: BLOCK_SIZE,
        rotation: 0, isGrounded: false, mode: 'cube', trail: [],
        color: '#ffdf00', icon: 'cube'
    },
    camera: { x: 0, y: 0 },
    level: null,
    levels: [],
    currentLevelIndex: 0,
    activeTriggers: [],
    editor: {
        selectedType: 'block',
        gridSnap: true,
        cameraX: 0
    },
    attempts: 1,
    isGameOver: false,
    deathTimer: 0,
    stats: {
        totalJumps: 0,
        stars: 0,
        diamonds: 0,
        coins: 0
    },
    colors: {
        bg: '#0074D9',
        ground: '#005bb7'
    }
};

// --- Initialization ---

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// --- Input Handling ---
let isKeyPressed = false;
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') isKeyPressed = true;
    
    // Editor Camera Movement
    if (gameState.mode === 'editor') {
        if (e.code === 'ArrowRight') gameState.editor.cameraX += 200;
        if (e.code === 'ArrowLeft') gameState.editor.cameraX = Math.max(0, gameState.editor.cameraX - 200);
    }
});
window.addEventListener('keyup', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') isKeyPressed = false;
});
canvas.addEventListener('mousedown', (e) => {
    if (gameState.mode === 'play') isKeyPressed = true;
    else if (gameState.mode === 'editor') handleEditorClick(e);
});
window.addEventListener('mouseup', () => isKeyPressed = false);

// --- Level Logic ---

class Level {
    constructor(name, author, difficulty) {
        this.name = name;
        this.author = author;
        this.difficulty = difficulty; // Easy, Normal, Hard, Demon, etc.
        this.objects = [];
        this.width = 15000;
        this.bg = '#0074D9';
        this.groundColor = '#005bb7';
    }
}

function addObject(type, gridX, gridY, extra = {}) {
    const obj = {
        type,
        x: gridX * BLOCK_SIZE,
        y: canvas.height * 0.75 - (gridY + 1) * BLOCK_SIZE,
        gridX, gridY,
        width: BLOCK_SIZE,
        height: BLOCK_SIZE,
        id: Date.now() + Math.random(),
        ...extra
    };
    gameState.level.objects.push(obj);
}

function addTrigger(type, gridX, gridY, targetId, properties) {
    addObject('trigger', gridX, gridY, {
        triggerType: type, // 'move', 'color'
        targetId: targetId,
        properties: properties, // {x: 100, y: 0, duration: 30}
        triggered: false
    });
}

function createDefaultLevels() {
    const l1 = new Level("Stereo Madness", "System", "Easy");
    // Add persistent floor blocks
    for (let i = 0; i < 300; i++) {
        l1.objects.push({type: 'block', x: i * BLOCK_SIZE, y: canvas.height * 0.75, gridX: i, gridY: -1});
    }
    // Obstacles
    l1.objects.push({type: 'spike', x: 20 * BLOCK_SIZE, y: canvas.height * 0.75 - BLOCK_SIZE, gridX: 20, gridY: 0});
    l1.objects.push({type: 'portal_ship', x: 40 * BLOCK_SIZE, y: canvas.height * 0.75 - BLOCK_SIZE * 2, gridX: 40, gridY: 0});
    l1.objects.push({type: 'portal_cube', x: 80 * BLOCK_SIZE, y: canvas.height * 0.75 - BLOCK_SIZE * 2, gridX: 80, gridY: 0});
    
    gameState.levels.push(l1);
    
    const l2 = new Level("Back on Track", "System", "Easy");
    for (let i = 0; i < 300; i++) {
        l2.objects.push({type: 'block', x: i * BLOCK_SIZE, y: canvas.height * 0.75, gridX: i, gridY: -1});
    }
    gameState.levels.push(l2);
    
    gameState.level = gameState.levels[0];
}

createDefaultLevels();

// --- Game Loop ---

function startGame() {
    gameState.mode = 'play';
    hideAllUI();
    resetPlayer();
}

function openEditor() {
    gameState.mode = 'editor';
    hideAllUI();
    document.getElementById('editor-ui').classList.remove('hidden');
}

function openLevelSelect() {
    gameState.mode = 'levelSelect';
    hideAllUI();
    document.getElementById('level-select').classList.remove('hidden');
    renderLevelList();
}

function hideAllUI() {
    ['menu-layer', 'editor-ui', 'level-select'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
}

function renderLevelList() {
    const list = document.getElementById('level-list');
    if (!list) return;
    list.innerHTML = '';
    
    // Default levels
    gameState.levels.forEach((lv, i) => {
        const btn = document.createElement('button');
        btn.className = 'menu-button';
        btn.style.width = '300px';
        btn.innerHTML = `<div>${lv.name}</div><div style="font-size:12px">by ${lv.author} - ${lv.difficulty}</div>`;
        btn.onclick = () => {
            gameState.currentLevelIndex = i;
            gameState.level = gameState.levels[i];
            startGame();
        };
        list.appendChild(btn);
    });

    // Custom level from storage
    const customData = localStorage.getItem('gd_clone_custom_level');
    if (customData) {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '5px';

        const btn = document.createElement('button');
        btn.className = 'menu-button';
        btn.style.background = '#FF851B';
        btn.style.width = '240px';
        btn.innerHTML = `<div>MY CUSTOM LEVEL</div>`;
        btn.onclick = () => {
            gameState.level = JSON.parse(customData);
            startGame();
        };

        const editBtn = document.createElement('button');
        editBtn.className = 'menu-button';
        editBtn.style.background = '#39CCCC';
        editBtn.style.width = '60px';
        editBtn.innerHTML = `EDIT`;
        editBtn.onclick = (e) => {
            e.stopPropagation();
            gameState.level = JSON.parse(customData);
            openEditor();
        };

        row.appendChild(btn);
        row.appendChild(editBtn);
        list.appendChild(row);
    }
}

function handleEditorClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left + gameState.editor.cameraX;
    const mouseY = e.clientY - rect.top;
    
    const gridX = Math.floor(mouseX / BLOCK_SIZE);
    const gridY = Math.floor((canvas.height * 0.75 - mouseY) / BLOCK_SIZE);

    if (e.button === 0) { // Left click: Add or Delete
        if (gameState.editor.selectedType === 'delete') {
            gameState.level.objects = gameState.level.objects.filter(obj => 
                !(obj.gridX === gridX && obj.gridY === gridY)
            );
        } else {
            addObject(gameState.editor.selectedType, gridX, gridY);
        }
    }
}

function selectType(type) {
    gameState.editor.selectedType = type;
    document.querySelectorAll('.editor-item').forEach(el => {
        el.classList.toggle('selected', el.dataset.type === type);
    });
}

function resetPlayer() {
    gameState.player.x = 100;
    gameState.player.y = canvas.height * 0.75 - BLOCK_SIZE;
    gameState.player.velY = 0;
    gameState.player.rotation = 0;
    gameState.player.mode = 'cube';
    gameState.player.trail = [];
    gameState.isGameOver = false;
    gameState.deathTimer = 0;
    document.getElementById('attempt-count').innerText = `Attempt ${gameState.attempts}`;
}

function update() {
    if (gameState.mode === 'play') {
        if (gameState.isGameOver) {
            gameState.deathTimer++;
            if (gameState.deathTimer > 30) {
                gameState.attempts++;
                resetPlayer();
            }
            return;
        }

        const p = gameState.player;

        // Process Triggers
        gameState.level.objects.forEach(obj => {
            if (obj.type === 'trigger' && !obj.triggered && p.x >= obj.x) {
                obj.triggered = true;
                if (obj.triggerType === 'color') {
                    if (obj.properties.target === 'bg') gameState.level.bg = obj.properties.color;
                    if (obj.properties.target === 'ground') gameState.level.groundColor = obj.properties.color;
                } else if (obj.triggerType === 'move') {
                    // Start move animation for target objects
                    gameState.activeTriggers.push({
                        type: 'move',
                        targetId: obj.targetId,
                        dx: obj.properties.x,
                        dy: obj.properties.y,
                        duration: obj.properties.duration,
                        elapsed: 0
                    });
                }
            }
        });

        // Apply Active Triggers
        gameState.activeTriggers = gameState.activeTriggers.filter(t => {
            t.elapsed++;
            const ratio = 1 / t.duration;
            const moveX = t.dx * ratio;
            const moveY = t.dy * ratio;
            
            gameState.level.objects.forEach(obj => {
                if (obj.id === t.targetId || (obj.groupId && obj.groupId === t.targetId)) {
                    obj.x += moveX;
                    obj.y += moveY;
                }
            });

            return t.elapsed < t.duration;
        });

        p.trail.push({x: p.x, y: p.y});
        if (p.trail.length > 20) p.trail.shift();

        // Horizontal
        p.x += p.velX;

        // Vertical Physics
        if (p.mode === 'cube') {
            p.velY += GRAVITY;
        } else if (p.mode === 'ship') {
            p.velY += isKeyPressed ? -0.5 : 0.5;
            p.velY = Math.max(-8, Math.min(8, p.velY));
            p.rotation = p.velY * 3;
        }
        p.y += p.velY;
        p.isGrounded = false;

        // Collisions
        gameState.level.objects.forEach(obj => {
            if (checkCollision(p, obj)) {
                if (obj.type === 'block') {
                    const prevY = p.y - p.velY;
                    if (p.velY >= 0 && prevY + p.height <= obj.y + 10) {
                        p.y = obj.y - p.height; p.velY = 0; p.isGrounded = true;
                        if (p.mode === 'cube') p.rotation = Math.round(p.rotation / 90) * 90;
                    } else if (p.velY < 0 && prevY >= obj.y + BLOCK_SIZE - 10) {
                        p.y = obj.y + BLOCK_SIZE; p.velY = 0;
                    } else {
                        gameState.isGameOver = true;
                    }
                } else if (obj.type === 'spike') {
                    gameState.isGameOver = true;
                } else if (obj.type === 'portal_ship') {
                    p.mode = 'ship';
                } else if (obj.type === 'portal_cube') {
                    p.mode = 'cube'; p.rotation = 0;
                } else if (obj.type === 'pad') {
                    p.velY = JUMP_FORCE * 1.5;
                } else if (obj.type === 'orb' && isKeyPressed) {
                    p.velY = JUMP_FORCE * 1.2;
                }
            }
        });

        if (p.mode === 'cube' && !p.isGrounded) p.rotation += 5;
        if (p.mode === 'cube' && p.isGrounded && isKeyPressed) {
            p.velY = JUMP_FORCE; p.isGrounded = false;
        }

        if (p.y > canvas.height + 100 || p.y < -1000) gameState.isGameOver = true;

        gameState.camera.x = p.x - 200;
        
        const prog = Math.min(100, Math.floor((p.x / gameState.level.width) * 100));
        document.getElementById('percent-complete').innerText = prog + '%';
        document.getElementById('progress-bar').style.width = prog + '%';
    } else if (gameState.mode === 'editor') {
        gameState.camera.x = gameState.editor.cameraX;
    }
}

function checkCollision(r1, r2) {
    const p = 5;
    const r2w = BLOCK_SIZE;
    const r2h = r2.type.startsWith('portal') ? BLOCK_SIZE * 2 : BLOCK_SIZE;
    const r2y = r2.type.startsWith('portal') ? r2.y - BLOCK_SIZE : r2.y;
    return r1.x < r2.x + r2w - p && r1.x + r1.width > r2.x + p &&
           r1.y < r2y + r2h - p && r1.y + r1.height > r2y + p;
}

function draw() {
    ctx.fillStyle = gameState.level ? gameState.level.bg : '#0074D9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(-gameState.camera.x, -gameState.camera.y);

    // Objects
    gameState.level.objects.forEach(obj => {
        if (obj.type === 'block') {
            ctx.fillStyle = gameState.level.groundColor; ctx.fillRect(obj.x, obj.y, BLOCK_SIZE, BLOCK_SIZE);
            ctx.strokeStyle = 'white'; ctx.strokeRect(obj.x, obj.y, BLOCK_SIZE, BLOCK_SIZE);
        } else if (obj.type === 'spike') {
            ctx.fillStyle = '#ff4136'; ctx.beginPath();
            ctx.moveTo(obj.x, obj.y + BLOCK_SIZE); ctx.lineTo(obj.x + BLOCK_SIZE / 2, obj.y);
            ctx.lineTo(obj.x + BLOCK_SIZE, obj.y + BLOCK_SIZE); ctx.fill();
        } else if (obj.type.startsWith('portal')) {
            ctx.fillStyle = obj.type === 'portal_ship' ? '#00ff00' : '#ff00ff';
            ctx.globalAlpha = 0.5; ctx.fillRect(obj.x, obj.y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE * 2);
            ctx.globalAlpha = 1.0; ctx.strokeRect(obj.x, obj.y - BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE * 2);
        } else if (obj.type === 'orb') {
            ctx.fillStyle = 'yellow'; ctx.beginPath();
            ctx.arc(obj.x + 20, obj.y + 20, 15, 0, Math.PI * 2); ctx.fill();
        } else if (obj.type === 'pad') {
            ctx.fillStyle = 'yellow'; ctx.fillRect(obj.x, obj.y + 30, BLOCK_SIZE, 10);
        }
    });

    // Player
    if (gameState.mode === 'play') {
        const p = gameState.player;
        if (!gameState.isGameOver) {
            ctx.strokeStyle = 'rgba(255, 223, 0, 0.3)'; ctx.beginPath();
            p.trail.forEach((t, i) => { if (i === 0) ctx.moveTo(t.x + 20, t.y + 20); else ctx.lineTo(t.x + 20, t.y + 20); });
            ctx.stroke();

            ctx.save();
            ctx.translate(p.x + 20, p.y + 20); ctx.rotate(p.rotation * Math.PI / 180);
            ctx.fillStyle = p.color; ctx.fillRect(-20, -20, 40, 40);
            ctx.strokeStyle = 'black'; ctx.lineWidth = 2; ctx.strokeRect(-20, -20, 40, 40);
            ctx.restore();
        } else {
            ctx.fillStyle = 'orange';
            for(let i=0; i<10; i++) ctx.fillRect(p.x + Math.random()*40, p.y + Math.random()*40, 5, 5);
        }
    }

    ctx.restore();
    update();
    requestAnimationFrame(draw);
}

draw();
