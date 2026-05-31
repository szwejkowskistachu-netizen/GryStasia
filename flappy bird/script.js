const dragon = document.getElementById('dragon');
const gameContainer = document.getElementById('game-container');
const scoreDisplay = document.getElementById('current-score');
const totalCoinsDisplay = document.getElementById('total-coins');
const gameOverScreen = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');
const coinsEarnedDisplay = document.getElementById('coins-earned');
const startScreen = document.getElementById('start-screen');
const shopScreen = document.getElementById('shop-screen');
const shopCoinsDisplay = document.getElementById('shop-coins');

const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const shopBtn = document.getElementById('shop-btn');
const startShopBtn = document.getElementById('start-shop-btn');
const closeShopBtn = document.getElementById('close-shop-btn');

// Shop elements
const buyGravityBtn = document.getElementById('buy-gravity');
const buyJumpBtn = document.getElementById('buy-jump');
const buySkinShadowBtn = document.getElementById('buy-skin-shadow');
const buySkinGoldBtn = document.getElementById('buy-skin-gold');

let gameRunning = false;
let score = 0;
let coins = parseInt(localStorage.getItem('dragonCoins')) || 0;
let dragonY = window.innerHeight / 2;
let dragonVelocity = 0;

// Base Stats
let baseGravity = 0.4;
let baseJumpStrength = -8;

// Upgrades
let upgrades = JSON.parse(localStorage.getItem('dragonUpgrades')) || {
    gravity: 0,
    jump: 0,
    skins: ['default'],
    activeSkin: 'default'
};

let obstacles = [];
let particles = [];
let lastObstacleTime = 0;
let obstacleInterval = 1500;

function init() {
    updateUI();
    applySkin();
    
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    shopBtn.addEventListener('click', openShop);
    startShopBtn.addEventListener('click', openShop);
    closeShopBtn.addEventListener('click', closeShop);

    buyGravityBtn.addEventListener('click', () => buyUpgrade('gravity', 50, buyGravityBtn));
    buyJumpBtn.addEventListener('click', () => buyUpgrade('jump', 50, buyJumpBtn));
    buySkinShadowBtn.addEventListener('click', () => buySkin('shadow', 100, buySkinShadowBtn));
    buySkinGoldBtn.addEventListener('click', () => buySkin('gold', 250, buySkinGoldBtn));

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            if (!gameRunning && !gameOverScreen.classList.contains('hidden')) {
                // Do nothing or restart?
            } else if (!gameRunning && !startScreen.classList.contains('hidden')) {
                startGame();
            } else {
                jump();
            }
        }
    });

    window.addEventListener('mousedown', (e) => {
        if (gameRunning) jump();
    });

    requestAnimationFrame(gameLoop);
}

function updateUI() {
    totalCoinsDisplay.innerText = coins;
    shopCoinsDisplay.innerText = coins;
    localStorage.setItem('dragonCoins', coins);
    localStorage.setItem('dragonUpgrades', JSON.stringify(upgrades));

    // Update shop buttons
    if (upgrades.gravity >= 5) buyGravityBtn.innerText = "MAXED";
    if (upgrades.jump >= 5) buyJumpBtn.innerText = "MAXED";
    if (upgrades.skins.includes('shadow')) {
        buySkinShadowBtn.innerText = upgrades.activeSkin === 'shadow' ? 'ACTIVE' : 'SELECT';
    }
    if (upgrades.skins.includes('gold')) {
        buySkinGoldBtn.innerText = upgrades.activeSkin === 'gold' ? 'ACTIVE' : 'SELECT';
    }
}

function applySkin() {
    dragon.className = '';
    if (upgrades.activeSkin !== 'default') {
        dragon.classList.add(`skin-${upgrades.activeSkin}`);
    }
}

function buyUpgrade(type, cost, btn) {
    if (coins >= cost && upgrades[type] < 5) {
        coins -= cost;
        upgrades[type]++;
        updateUI();
    }
}

function buySkin(skin, cost, btn) {
    if (upgrades.skins.includes(skin)) {
        upgrades.activeSkin = skin;
        applySkin();
        updateUI();
        return;
    }
    if (coins >= cost) {
        coins -= cost;
        upgrades.skins.push(skin);
        upgrades.activeSkin = skin;
        applySkin();
        updateUI();
    }
}

function openShop() {
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    shopScreen.classList.remove('hidden');
}

function closeShop() {
    shopScreen.classList.add('hidden');
    startScreen.classList.remove('hidden');
}

function startGame() {
    score = 0;
    dragonY = window.innerHeight / 2;
    dragonVelocity = 0;
    obstacles.forEach(obs => obs.element.remove());
    obstacles = [];
    particles.forEach(p => p.element.remove());
    particles = [];
    scoreDisplay.innerText = '0';
    gameOverScreen.classList.add('hidden');
    startScreen.classList.add('hidden');
    shopScreen.classList.add('hidden');
    gameRunning = true;
    lastObstacleTime = performance.now();
}

function jump() {
    if (!gameRunning) return;
    const currentJump = baseJumpStrength - (upgrades.jump * 0.5);
    dragonVelocity = currentJump;
    createParticles(100, dragonY + 22);
}

function createParticles(x, y) {
    const color = upgrades.activeSkin === 'shadow' ? '#8a2be2' : (upgrades.activeSkin === 'gold' ? '#ffd700' : '#ff4500');
    for (let i = 0; i < 5; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.backgroundColor = color;
        const size = Math.random() * 5 + 2;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        gameContainer.appendChild(p);
        
        particles.push({
            element: p,
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 1.0
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.element.style.left = `${p.x}px`;
        p.element.style.top = `${p.y}px`;
        p.element.style.opacity = p.life;
        
        if (p.life <= 0) {
            p.element.remove();
            particles.splice(i, 1);
        }
    }
}

function spawnObstacle() {
    const gapHeight = 220; // Slightly smaller for challenge
    const topHeight = Math.random() * (window.innerHeight - gapHeight - 200) + 100;
    
    const isPortal = Math.random() < 0.15;

    if (isPortal) {
        const portalY = Math.random() * (window.innerHeight - 200) + 100;
        const portal = document.createElement('div');
        portal.className = 'portal';
        portal.style.left = `${window.innerWidth}px`;
        portal.style.top = `${portalY}px`;
        gameContainer.appendChild(portal);
        obstacles.push({ element: portal, type: 'portal', x: window.innerWidth, y: portalY, width: 100, height: 100, passed: false });
    } else {
        const topPillar = document.createElement('div');
        topPillar.className = 'pillar';
        topPillar.style.height = `${topHeight}px`;
        topPillar.style.top = '0';
        topPillar.style.left = `${window.innerWidth}px`;
        gameContainer.appendChild(topPillar);
        
        const bottomPillar = document.createElement('div');
        bottomPillar.className = 'pillar';
        bottomPillar.style.height = `${window.innerHeight - topHeight - gapHeight}px`;
        bottomPillar.style.bottom = '0';
        bottomPillar.style.left = `${window.innerWidth}px`;
        gameContainer.appendChild(bottomPillar);
        
        obstacles.push({ 
            element: topPillar, 
            type: 'pillar', 
            x: window.innerWidth, 
            y: 0, 
            width: 80, 
            height: topHeight, 
            pair: bottomPillar,
            passed: false 
        });
    }
}

function updateObstacles() {
    const speed = 6;
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= speed;
        obs.element.style.left = `${obs.x}px`;
        if (obs.pair) obs.pair.style.left = `${obs.x}px`;
        
        if (!obs.passed && obs.x < 100) {
            obs.passed = true;
            score++;
            coins += 5; // Reward for passing
            scoreDisplay.innerText = score;
            totalCoinsDisplay.innerText = coins;
        }
        
        if (checkCollision(obs)) endGame();
        
        if (obs.x < -100) {
            obs.element.remove();
            if (obs.pair) obs.pair.remove();
            obstacles.splice(i, 1);
        }
    }
}

function checkCollision(obs) {
    const dragonRect = { x: 100, y: dragonY, width: 60, height: 45 };
    if (obs.type === 'pillar') {
        if (dragonRect.x < obs.x + obs.width && dragonRect.x + dragonRect.width > obs.x && dragonRect.y < obs.height) return true;
        const bottomY = obs.height + 220;
        if (dragonRect.x < obs.x + obs.width && dragonRect.x + dragonRect.width > obs.x && dragonRect.y + dragonRect.height > bottomY) return true;
    } else if (obs.type === 'portal') {
        const dx = (dragonRect.x + dragonRect.width/2) - (obs.x + obs.width/2);
        const dy = (dragonRect.y + dragonRect.height/2) - (obs.y + obs.height/2);
        if (Math.sqrt(dx * dx + dy * dy) < 55) return true;
    }
    return false;
}

function endGame() {
    gameRunning = false;
    finalScoreDisplay.innerText = score;
    coinsEarnedDisplay.innerText = score * 5;
    updateUI();
    gameOverScreen.classList.remove('hidden');
}

function gameLoop(time) {
    if (gameRunning) {
        const currentGravity = baseGravity - (upgrades.gravity * 0.05);
        dragonVelocity += currentGravity;
        dragonY += dragonVelocity;
        
        if (dragonY < 0) { dragonY = 0; dragonVelocity = 0; }
        if (dragonY + 45 > window.innerHeight) endGame();
        
        dragon.style.top = `${dragonY}px`;
        dragon.style.transform = `rotate(${dragonVelocity * 2}deg)`;
        
        if (time - lastObstacleTime > obstacleInterval) {
            spawnObstacle();
            lastObstacleTime = time;
        }
        
        updateObstacles();
        updateParticles();
    }
    requestAnimationFrame(gameLoop);
}

init();