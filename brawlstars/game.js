const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 1000;
canvas.height = 600;

// Game States: 'home', 'brawlers', 'shop', 'playing'
let currentState = 'home';
let trophies = 0;
let gems = 0;
let score = 0;
let lastTime = 0;
let gameActive = false;
let matchesPlayed = 0;
let pendingDrops = 0;
let selectedMapKey = 'meadows';

const maps = {
    meadows: {
        name: 'Green Meadows',
        bgColor: '#5d9b5d',
        bushColor: '#27ae60',
        wallColor: '#95a5a6',
        gridColor: 'rgba(0,0,0,0.05)'
    },
    desert: {
        name: 'Desert Canyon',
        bgColor: '#edc9af',
        bushColor: '#d35400',
        wallColor: '#a67c52',
        gridColor: 'rgba(0,0,0,0.1)'
    },
    night: {
        name: 'Night Grave',
        bgColor: '#2c3e50',
        bushColor: '#8e44ad',
        wallColor: '#34495e',
        gridColor: 'rgba(255,255,255,0.05)'
    }
};

// --- Persistence ---
function saveData() {
    const gameData = {
        trophies,
        gems,
        matchesPlayed,
        pendingDrops,
        selectedBrawlerKey,
        selectedMapKey,
        unlockedBrawlers: {}
    };
    for (let key in brawlers) {
        gameData.unlockedBrawlers[key] = {
            unlocked: brawlers[key].unlocked,
            skin: brawlers[key].skin,
            color: brawlers[key].color
        };
    }
    localStorage.setItem('brawlStarsCloneData', JSON.stringify(gameData));
}

function loadData() {
    const saved = localStorage.getItem('brawlStarsCloneData');
    if (saved) {
        const data = JSON.parse(saved);
        trophies = data.trophies || 0;
        gems = data.gems || 0;
        matchesPlayed = data.matchesPlayed || 0;
        pendingDrops = data.pendingDrops || 0;
        selectedBrawlerKey = data.selectedBrawlerKey || 'shelly';
        selectedMapKey = data.selectedMapKey || 'meadows';
        
        if (data.unlockedBrawlers) {
            for (let key in data.unlockedBrawlers) {
                if (brawlers[key]) {
                    brawlers[key].unlocked = data.unlockedBrawlers[key].unlocked;
                    brawlers[key].skin = data.unlockedBrawlers[key].skin;
                    if (data.unlockedBrawlers[key].color) {
                        brawlers[key].color = data.unlockedBrawlers[key].color;
                    }
                }
            }
        }
    }
}

// Brawler Definitions
const brawlers = {
    shelly: {
        name: 'Borys',
        color: '#3498db',
        speed: 4,
        health: 150, // Increased for easier win
        reloadRate: 1200, // Faster reload
        superType: 'circle_burst',
        projectileColor: '#f1c40f',
        cost: 0,
        unlocked: true,
        skin: 'Default'
    },
    colt: {
        name: 'Leon',
        color: '#e67e22',
        speed: 5,
        health: 120, // Increased
        reloadRate: 800, // Faster
        superType: 'long_shot',
        projectileColor: '#ecf0f1',
        cost: 50,
        unlocked: false
    },
    el_primo: {
        name: 'Tytan',
        color: '#9b59b6',
        speed: 4, // Faster
        health: 300, // Tankier
        reloadRate: 600, // Faster
        superType: 'leap',
        projectileColor: '#e74c3c',
        cost: 100,
        unlocked: false
    }
};

let selectedBrawlerKey = 'shelly';
let player = null;

const keys = {};
const projectiles = [];
const enemies = [];
const obstacles = [];

// --- Map Features ---
function initMap() {
    obstacles.length = 0;
    // Add some bushes
    for (let i = 0; i < 8; i++) {
        obstacles.push({
            x: Math.random() * (canvas.width - 100) + 50,
            y: Math.random() * (canvas.height - 100) + 50,
            width: 80,
            height: 80,
            type: 'bush'
        });
    }
    // Add some walls
    for (let i = 0; i < 4; i++) {
        obstacles.push({
            x: Math.random() * (canvas.width - 150) + 75,
            y: Math.random() * (canvas.height - 150) + 75,
            width: 100,
            height: 30,
            type: 'wall'
        });
    }
}

// --- State Management ---
function changeState(newState) {
    // Hide all screens
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('brawlers-screen').style.display = 'none';
    document.getElementById('maps-screen').style.display = 'none';
    document.getElementById('shop-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'none';

    // Show notice on mobile if not in game
    const isMobile = window.innerWidth < 800;
    const notice = document.getElementById('mobile-notice');
    if (notice) notice.style.display = (isMobile && newState !== 'playing') ? 'block' : 'none';

    currentState = newState;

    if (newState === 'home') {
        document.getElementById('home-screen').style.display = 'flex';
        document.getElementById('trophy-count').innerText = trophies;
        document.getElementById('gem-count').innerText = gems;
        
        // Update Match Counter & Drops
        const matchProgress = matchesPlayed % 3;
        document.getElementById('match-counter').innerText = `${matchProgress}/3 Matches`;
        
        const dropBtn = document.getElementById('open-drop-btn');
        if (pendingDrops > 0) {
            dropBtn.style.display = 'block';
            dropBtn.innerText = `OPEN STARR DROP (${pendingDrops})`;
        } else {
            dropBtn.style.display = 'none';
        }

        const b = brawlers[selectedBrawlerKey];
        document.getElementById('selected-brawler-name').innerText = b.skin && b.skin !== 'Default' ? b.skin : b.name;
        document.getElementById('selected-brawler-img').style.backgroundColor = b.color;
        gameActive = false;
    } else if (newState === 'brawlers') {
        renderBrawlerList();
        document.getElementById('brawlers-screen').style.display = 'flex';
    } else if (newState === 'maps') {
        renderMapList();
        document.getElementById('maps-screen').style.display = 'flex';
    } else if (newState === 'shop') {
        document.getElementById('shop-screen').style.display = 'flex';
    } else if (newState === 'playing') {
        document.getElementById('game-container').style.display = 'flex';
        initGame();
    }
}

function renderMapList() {
    const list = document.querySelector('.map-list');
    list.innerHTML = '';
    for (let key in maps) {
        const m = maps[key];
        const card = document.createElement('div');
        card.className = 'map-card' + (selectedMapKey === key ? ' selected' : '');
        card.innerHTML = `
            <h3>${m.name}</h3>
            <div class="map-preview" style="background-color: ${m.bgColor}; width: 100px; height: 60px; border-radius: 8px; margin: 10px auto; border: 2px solid #fff;"></div>
        `;
        card.onclick = () => selectMap(key);
        list.appendChild(card);
    }
}

function selectMap(key) {
    selectedMapKey = key;
    saveData();
    changeState('home');
}

function renderBrawlerList() {
    const list = document.querySelector('.brawler-list');
    list.innerHTML = '';
    for (let key in brawlers) {
        const b = brawlers[key];
        const card = document.createElement('div');
        card.className = 'brawler-card' + (b.unlocked ? '' : ' locked');
        card.innerHTML = `
            <h3>${b.name}</h3>
            <div class="brawler-avatar" style="background-color: ${b.color}; width: 60px; height: 60px; border-radius: 50%; margin: 10px auto;"></div>
            <p>${b.unlocked ? 'Unlocked' : 'Cost: 💎 ' + b.cost}</p>
        `;
        card.onclick = () => selectBrawler(key);
        list.appendChild(card);
    }
}

function selectBrawler(key) {
    const b = brawlers[key];
    if (b.unlocked) {
        selectedBrawlerKey = key;
        saveData();
        changeState('home');
    } else {
        if (gems >= b.cost) {
            gems -= b.cost;
            b.unlocked = true;
            saveData();
            alert(`You unlocked ${b.name}!`);
            renderBrawlerList();
            document.getElementById('gem-count').innerText = gems;
        } else {
            alert('Not enough gems!');
        }
    }
}

function exitGame() {
    gameActive = false;
    matchesPlayed++;
    
    // Trophies logic: win some if score high, lose some if score low
    if (score > 30) { // Easier win threshold
        const gain = Math.floor(score / 15) + 5; // More trophies
        trophies += gain;
        alert(`You won! +${gain} Trophies`);
    } else {
        const loss = 2; // Less loss
        trophies = Math.max(0, trophies - loss);
        alert(`Good try! -${loss} Trophies`);
    }

    if (matchesPlayed % 3 === 0) {
        pendingDrops++;
        alert("3 Matches played! You earned a STARR DROP! Go to Home to open it.");
    }

    saveData();
    changeState('home');
}

function tryOpenPendingDrop() {
    if (pendingDrops > 0) {
        pendingDrops--;
        openBox('starr_drop');
        changeState('home'); // Refresh UI
    }
}

function openBox(type) {
    let rewardGems = 0;
    let rewardTrophies = 0;
    let message = "";

    if (type === 'starr_drop') {
        rewardGems = Math.floor(Math.random() * 8) + 3; // Better rewards
        rewardTrophies = Math.floor(Math.random() * 15) + 10;
        message = `STARR DROP: You found ${rewardGems} Gems and ${rewardTrophies} Trophies!`;
    } else if (type === 'mega_box') {
        rewardGems = Math.floor(Math.random() * 30) + 20; // Better rewards
        rewardTrophies = Math.floor(Math.random() * 80) + 50;
        message = `MEGA BOX: You found ${rewardGems} Gems and ${rewardTrophies} Trophies!`;
    }

    gems += rewardGems;
    trophies += rewardTrophies;
    saveData();
    alert(message);
    document.getElementById('gem-count').innerText = gems;
    document.getElementById('trophy-count').innerText = trophies;
}

function buyShopItem(item) {
    if (item === 'starr_drop') {
        if (gems >= 7) {
            gems -= 7;
            openBox('starr_drop');
        } else {
            alert("Not enough gems for Starr Drop!");
        }
    } else if (item === 'mega_box') {
        if (gems >= 15) {
            gems -= 15;
            openBox('mega_box');
        } else {
            alert("Not enough gems for Mega Box!");
        }
    } else if (item === 'star_shelly') {
        if (brawlers.shelly.skin !== 'Star Borys') {
            brawlers.shelly.skin = 'Star Borys';
            brawlers.shelly.color = '#f1c40f'; // Golden color for skin
            saveData();
            alert("Skin 'Star Borys' claimed for Borys!");
            changeState('home'); // Refresh display
        } else {
            alert("You already have this skin!");
        }
    }
    document.getElementById('gem-count').innerText = gems;
}

// --- Game Logic ---
function initGame() {
    initMap();
    const b = brawlers[selectedBrawlerKey];
    player = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 20,
        ...b,
        maxHealth: b.health,
        ammo: 3,
        maxAmmo: 3,
        superCharge: 0,
        maxSuperCharge: 100,
        lastShot: 0,
        lastReload: 0
    };
    
    enemies.length = 0;
    projectiles.length = 0;
    score = 0;
    gameActive = true;
    updateUI();
    requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    if (gameActive && e.key === ' ' && player.superCharge >= player.maxSuperCharge) {
        useSuper();
    }
});
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

window.addEventListener('mousedown', (e) => {
    if (gameActive && player.ammo > 0) {
        const rect = canvas.getBoundingClientRect();
        shoot(e.clientX - rect.left, e.clientY - rect.top);
    }
});

function shoot(targetX, targetY) {
    const angle = Math.atan2(targetY - player.y, targetX - player.x);
    
    projectiles.push({
        x: player.x,
        y: player.y,
        radius: 5,
        color: player.projectileColor,
        velocity: {
            x: Math.cos(angle) * 8,
            y: Math.sin(angle) * 8
        },
        type: 'normal'
    });

    player.ammo--;
    player.lastShot = Date.now();
    updateUI();
}

function useSuper() {
    player.superCharge = 0;
    if (player.superType === 'circle_burst') {
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 / 12) * i;
            projectiles.push({
                x: player.x, y: player.y, radius: 8, color: '#9b59b6',
                velocity: { x: Math.cos(angle) * 10, y: Math.sin(angle) * 10 },
                type: 'super'
            });
        }
    } else if (player.superType === 'long_shot') {
        // Multi-shot forward
        const rect = canvas.getBoundingClientRect(); // Simplified: shooting forward
        for(let i=-2; i<=2; i++) {
             projectiles.push({
                x: player.x, y: player.y, radius: 6, color: '#f1c40f',
                velocity: { x: 12, y: i * 2 },
                type: 'super'
            });
        }
    } else if (player.superType === 'leap') {
        // Simple area damage
        enemies.forEach(enemy => {
            const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
            if (dist < 150) enemy.health = 0; // Instant kill in radius
        });
        score += 50;
    }
    updateUI();
}

function spawnEnemy() {
    if (!gameActive) return;
    const radius = 20;
    let x, y;
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? -radius : canvas.width + radius;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? -radius : canvas.height + radius;
    }
    enemies.push({ x, y, radius, color: '#e74c3c', speed: 1.0 + Math.random() * 0.5, health: 40, angle: 0 }); // Slower and weaker
}

function update() {
    if (!gameActive) return;

    if (keys['w'] || keys['arrowup']) player.y -= player.speed;
    if (keys['s'] || keys['arrowdown']) player.y += player.speed;
    if (keys['a'] || keys['arrowleft']) player.x -= player.speed;
    if (keys['d'] || keys['arrowright']) player.x += player.speed;

    // Wall collision for player
    obstacles.forEach(obs => {
        if (obs.type === 'wall') {
            if (player.x + player.radius > obs.x && player.x - player.radius < obs.x + obs.width &&
                player.y + player.radius > obs.y && player.y - player.radius < obs.y + obs.height) {
                // Very simple collision response
                if (keys['w'] || keys['arrowup']) player.y += player.speed;
                if (keys['s'] || keys['arrowdown']) player.y -= player.speed;
                if (keys['a'] || keys['arrowleft']) player.x += player.speed;
                if (keys['d'] || keys['arrowright']) player.x -= player.speed;
            }
        }
    });

    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    if (player.ammo < player.maxAmmo && Date.now() - player.lastShot > player.reloadRate && Date.now() - player.lastReload > 400) {
        player.ammo++;
        player.lastReload = Date.now();
        updateUI();
    }

    projectiles.forEach((p, i) => {
        p.x += p.velocity.x; p.y += p.velocity.y;
        if (p.x < -50 || p.x > canvas.width + 50 || p.y < -50 || p.y > canvas.height + 50) projectiles.splice(i, 1);
    });

    enemies.forEach((enemy, eIndex) => {
        // Find closest target (player or another enemy)
        let target = player;
        let minDist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

        enemies.forEach((other, oIndex) => {
            if (eIndex === oIndex) return;
            const dist = Math.hypot(other.x - enemy.x, other.y - enemy.y);
            if (dist < minDist) {
                minDist = dist;
                target = other;
            }
        });

        const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
        enemy.angle = angle;
        enemy.x += Math.cos(angle) * enemy.speed;
        enemy.y += Math.sin(angle) * enemy.speed;

        // Wall collision for enemies
        obstacles.forEach(obs => {
            if (obs.type === 'wall') {
                if (enemy.x > obs.x && enemy.x < obs.x + obs.width && enemy.y > obs.y && enemy.y < obs.y + obs.height) {
                    enemy.x -= Math.cos(angle) * enemy.speed;
                    enemy.y -= Math.sin(angle) * enemy.speed;
                }
            }
        });

        if (target === player && minDist < player.radius + enemy.radius) {
            player.health -= 0.5; // Less damage to player
            updateUI();
            if (player.health <= 0) exitGame();
        } else if (target !== player && minDist < enemy.radius + target.radius) {
            // Bots fight each other
            target.health -= 1;
            if (target.health <= 0) {
                const tIndex = enemies.indexOf(target);
                if (tIndex > -1) enemies.splice(tIndex, 1);
            }
        }

        projectiles.forEach((p, pIndex) => {
            if (Math.hypot(p.x - enemy.x, p.y - enemy.y) < p.radius + enemy.radius) {
                enemies.splice(eIndex, 1);
                if (p.type !== 'super') projectiles.splice(pIndex, 1);
                score += 10;
                gems += 2; // More gems!
                player.superCharge = Math.min(player.maxSuperCharge, player.superCharge + 15); // Faster super charge
                updateUI();
            }
        });
    });

    while (enemies.length < 8 && gameActive) { // Fewer enemies at once
        spawnEnemy();
    }
}

function draw() {
    // Clear background with a grass color
    ctx.fillStyle = '#5d9b5d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw simple grid pattern for better sense of movement
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    for(let x=0; x<canvas.width; x+=50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for(let y=0; y<canvas.height; y+=50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Draw bushes
    obstacles.forEach(obs => {
        if (obs.type === 'bush') {
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.fillRect(obs.x + 5, obs.y + 5, obs.width, obs.height);
            
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            // Detail
            ctx.strokeStyle = '#1e8449';
            ctx.lineWidth = 3;
            ctx.strokeRect(obs.x + 5, obs.y + 5, obs.width - 10, obs.height - 10);
            
            // Texture
            ctx.fillStyle = '#2ecc71';
            for(let i=0; i<3; i++) {
                ctx.beginPath();
                ctx.arc(obs.x + 20 + i*20, obs.y + 20 + (i%2)*20, 10, 0, Math.PI*2);
                ctx.fill();
            }
        }
    });

    // Player
    ctx.save();
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.arc(player.x + 4, player.y + 4, player.radius, 0, Math.PI * 2); ctx.fill();

    ctx.translate(player.x, player.y);
    // Check if in bush
    let inBush = false;
    obstacles.forEach(obs => {
        if (obs.type === 'bush' && player.x > obs.x && player.x < obs.x + obs.width && player.y > obs.y && player.y < obs.y + obs.height) {
            inBush = true;
        }
    });
    ctx.globalAlpha = inBush ? 0.5 : 1;

    ctx.beginPath(); ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.color; ctx.fill();
    ctx.strokeStyle = 'white'; ctx.lineWidth = 3; ctx.stroke();
    
    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(8, -5, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, 5, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath(); ctx.arc(11, -5, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(11, 5, 3, 0, Math.PI * 2); ctx.fill();
    
    ctx.restore();
    ctx.globalAlpha = 1;

    enemies.forEach(enemy => {
        let eInBush = false;
        obstacles.forEach(obs => {
            if (obs.type === 'bush' && enemy.x > obs.x && enemy.x < obs.x + obs.width && enemy.y > obs.y && enemy.y < obs.y + obs.height) {
                eInBush = true;
            }
        });
        if (eInBush) ctx.globalAlpha = 0.3;
        
        // Enemy shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath(); ctx.arc(enemy.x + 3, enemy.y + 3, enemy.radius, 0, Math.PI * 2); ctx.fill();

        ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fillStyle = enemy.color; ctx.fill();
        ctx.strokeStyle = 'black'; ctx.lineWidth = 2; ctx.stroke();
        
        // Enemy eyes
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(enemy.x + Math.cos(enemy.angle)*8, enemy.y + Math.sin(enemy.angle)*8 - 5, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(enemy.x + Math.cos(enemy.angle)*8, enemy.y + Math.sin(enemy.angle)*8 + 5, 4, 0, Math.PI * 2); ctx.fill();

        ctx.globalAlpha = 1;
        
        // Health bar for bots
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(enemy.x - 20, enemy.y - 35, 40, 6);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(enemy.x - 20, enemy.y - 35, (enemy.health / 40) * 40, 6);
    });

    // Draw walls
    obstacles.forEach(obs => {
        if (obs.type === 'wall') {
            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(obs.x + 5, obs.y + 5, obs.width, obs.height);

            ctx.fillStyle = '#95a5a6';
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            
            // Stone texture
            ctx.strokeStyle = '#7f8c8d';
            ctx.lineWidth = 2;
            ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
            ctx.beginPath();
            ctx.moveTo(obs.x + obs.width/2, obs.y);
            ctx.lineTo(obs.x + obs.width/2, obs.y + obs.height);
            ctx.stroke();
        }
    });

    projectiles.forEach(p => {
        // Glow effect for projectiles
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color; ctx.fill();
        ctx.shadowBlur = 0;
    });
}

function updateUI() {
    if (!player) return;
    document.getElementById('health-bar').style.width = (player.health / player.maxHealth * 100) + '%';
    document.getElementById('super-bar').style.width = (player.superCharge / player.maxSuperCharge * 100) + '%';
    document.getElementById('score').innerText = 'Score: ' + score;
    const slots = document.querySelectorAll('.ammo-slot');
    slots.forEach((s, i) => s.style.opacity = i < player.ammo ? '1' : '0.2');
}

function gameLoop(timestamp) {
    if (!gameActive) return;
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start in home state
loadData();
changeState('home');
