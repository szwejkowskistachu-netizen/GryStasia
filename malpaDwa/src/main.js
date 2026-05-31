import { config, items, skins } from './config.js';

// --- GOOGLE APPS SCRIPT URL ---
const DATABASE_URL = 'https://script.google.com/macros/s/AKfycbyBBi6thMErXrz6_W8s3PfNR7JPFIggo5wfC-TMUI4njAyja6PEkaZPWVVBkZrgx_dIxw/exec'; 

const screens = {
    start: document.getElementById('start-screen'),
    shop: document.getElementById('shop-screen'),
    game: document.getElementById('game-screen'),
    ranking: document.getElementById('ranking-screen'),
    nameEntry: document.getElementById('name-entry-screen')
};

const defaultState = {
    bananas: 100,
    ownedItems: [],
    ownedSkins: ['default'],
    currentSkin: 'default',
    winsCount: 0,
    currentLevel: 1,
    userTotals: {},
    currentUsername: localStorage.getItem('monkeyGame_user_v2') || null
};

const STORAGE_KEY = 'monkeyGame_v2';
let gameState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState;
gameState = { ...defaultState, ...gameState };

// Explicitly restore skin from backup storage to prevent "disappearing"
const savedSkin = localStorage.getItem('monkeyGame_currentSkin');
if (savedSkin && gameState.ownedSkins.includes(savedSkin)) {
    gameState.currentSkin = savedSkin;
}

let currentRunScore = 0;
const botNames = ['MałpiKról', 'BananowyJoe', 'DżunglowyMistrz', 'SzybkiSzympans', 'Zbieracz2000'];

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    // Also save specific fields to ensure they are not lost on merge
    localStorage.setItem('monkeyGame_currentSkin', gameState.currentSkin);
    if (gameState.currentUsername) {
        localStorage.setItem('monkeyGame_user_v2', gameState.currentUsername);
    }
    updateStartScreen();
}

function updateStartScreen() {
    const userDisplay = document.getElementById('current-username-display');
    if (userDisplay) {
        userDisplay.innerText = gameState.currentUsername ? `Cześć, ${gameState.currentUsername}!` : 'Zaloguj się grając rundę!';
    }
    const display = document.getElementById('total-bananas-display');
    if (display) display.innerText = `Twoje Banany: ${gameState.bananas}`;
    const playerCount = document.getElementById('player-count-display');
    if (playerCount) {
        const totalPlayers = Object.keys(gameState.userTotals).length;
        playerCount.innerText = `Liczba Graczy: ${totalPlayers}`;
    }
}

async function fetchGlobalRanking() {
    if (!DATABASE_URL) return;
    try {
        const response = await fetch(DATABASE_URL);
        const data = await response.json();
        data.forEach(entry => {
            const name = entry[0];
            const total = parseInt(entry[1]);
            if (name && !isNaN(total) && !botNames.includes(name)) {
                if (!gameState.userTotals[name] || total > gameState.userTotals[name]) {
                    gameState.userTotals[name] = total;
                }
            }
        });
        renderRanking();
    } catch (e) { console.error("Database fetch error:", e); }
}

async function saveToGlobalDatabase(name, total) {
    if (!DATABASE_URL || botNames.includes(name)) return;
    try {
        await fetch(DATABASE_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({ action: 'score', name: name, bananas: total })
        });
    } catch (e) { console.error("Database save error:", e); }
}

function renderShop() {
    const shopContainer = document.getElementById('shop-screen');
    const bananaDisplay = shopContainer.querySelector('#banana-count');
    if (bananaDisplay) bananaDisplay.innerText = `Twoje Banany: ${gameState.bananas}`;

    const skinsList = document.getElementById('skins-list');
    skinsList.innerHTML = '';
    skins.forEach(skin => {
        const isOwned = gameState.ownedSkins.includes(skin.id);
        const isEquipped = gameState.currentSkin === skin.id;
        const skinEl = document.createElement('div');
        skinEl.className = 'skin-item';
        
        skinEl.innerHTML = `
            <div class="skin-info">
                <canvas id="preview-${skin.id}" class="skin-preview-canvas" width="32" height="48"></canvas>
                <div class="skin-name-container">
                    <span class="skin-name">${skin.name}</span>
                    <span style="font-size: 10px; color: #bdc3c7;">${skin.price > 0 ? `Cena: ${skin.price} 🍌` : 'Darmowa'}</span>
                </div>
            </div>
            <div class="skin-actions">
                ${isEquipped ? '<span style="color: #2ecc71; font-weight: bold;">WYBRANA</span>' : 
                  isOwned ? `<button style="width: 100px; padding: 8px;" onclick="equipSkin('${skin.id}')">WYBIERZ</button>` : 
                  gameState.bananas >= skin.price ? `<button style="width: 100px; padding: 8px;" onclick="buySkin('${skin.id}')">KUP</button>` : 
                  `<span style="color: #e74c3c;">BRAK ŚRODKÓW</span>`}
            </div>
        `;
        skinsList.appendChild(skinEl);
        
        // Draw the preview
        setTimeout(() => drawMonkeyPreview(`preview-${skin.id}`, skin.id), 0);
    });

    const itemsList = document.getElementById('items-list');
    itemsList.innerHTML = '';
    items.forEach(item => {
        const isOwned = gameState.ownedItems.includes(item.id);
        const itemEl = document.createElement('div');
        itemEl.className = 'skin-item';
        itemEl.innerHTML = `
            <span>${item.name}</span>
            ${isOwned ? '<span>(Posiadany)</span>' : 
              gameState.bananas >= item.price ? `<button onclick="buyItem('${item.id}')">KUP (${item.price})</button>` : 
              `<span>Koszt: ${item.price}</span>`}
        `;
        itemsList.appendChild(itemEl);
    });
}

function drawMonkeyPreview(canvasId, skinId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const hexToColor = (hex) => {
        const r = (hex >> 16) & 0xFF;
        const g = (hex >> 8) & 0xFF;
        const b = hex & 0xFF;
        return `rgb(${r},${g},${b})`;
    };

    // Body Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath(); ctx.ellipse(18, 37, 12, 16, 0, 0, 2 * Math.PI); ctx.fill();

    // Body
    ctx.fillStyle = skinId === 'nauk' ? '#FFFFFF' : '#8B4513';
    ctx.beginPath(); ctx.ellipse(16, 35, 12, 16, 0, 0, 2 * Math.PI); ctx.fill();

    if (skinId === 'hiper_malpa') {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(16, 24, 22, 0, 2 * Math.PI); ctx.stroke();
    }

    // Belly
    ctx.fillStyle = '#D2B48C';
    ctx.beginPath(); ctx.ellipse(16, 38, 7, 10, 0, 0, 2 * Math.PI); ctx.fill();

    // Head
    ctx.fillStyle = '#8B4513';
    ctx.beginPath(); ctx.arc(16, 18, 12, 0, 2 * Math.PI); ctx.fill();

    // Face
    ctx.fillStyle = '#D2B48C';
    ctx.beginPath(); ctx.ellipse(16, 20, 10, 8, 0, 0, 2 * Math.PI); ctx.fill();

    // Ears
    ctx.fillStyle = '#8B4513';
    ctx.beginPath(); ctx.arc(6, 18, 4, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(26, 18, 4, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#D2B48C';
    ctx.beginPath(); ctx.arc(6, 18, 2, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(26, 18, 2, 0, 2 * Math.PI); ctx.fill();

    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(13, 17, 2.5, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(19, 17, 2.5, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = skinId === 'hiper_malpa' ? '#00ffff' : '#000000';
    ctx.beginPath(); ctx.arc(13, 17, 1.2, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(19, 17, 1.2, 0, 2 * Math.PI); ctx.fill();

    if (skinId === 'desek') {
        ctx.fillStyle = '#228B22';
        ctx.fillRect(6, 6, 20, 6);
        ctx.fillStyle = '#000000';
        ctx.fillRect(8, 15, 16, 4);
    } else if (skinId === 'ballerina') {
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath(); ctx.ellipse(16, 42, 16, 5, 0, 0, 2 * Math.PI); ctx.fill();
    } else if (skinId === 'nauk') {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(13, 17, 4, 0, 2 * Math.PI); ctx.stroke();
        ctx.beginPath(); ctx.arc(19, 17, 4, 0, 2 * Math.PI); ctx.stroke();
    }
}


function renderRanking() {
    const scoresList = document.getElementById('scores-list');
    if (!scoresList) return;
    scoresList.innerHTML = '';
    const rankingArray = Object.entries(gameState.userTotals)
        .filter(([name]) => !botNames.includes(name))
        .map(([name, total]) => ({ name, total }));
    const sorted = rankingArray.sort((a, b) => b.total - a.total).slice(0, 10);
    if (sorted.length === 0) {
        scoresList.innerHTML = '<p style="color: #f1c40f;">Ranking jest pusty. Bądź pierwszy!</p>';
        return;
    }
    sorted.forEach((entry, index) => {
        const div = document.createElement('div');
        div.className = 'skin-item';
        div.style.width = '450px';
        div.style.color = 'white';
        div.innerHTML = `<span>#${index + 1} ${entry.name}</span> <span style="color: #f1c40f;">${entry.total} 🍌</span>`;
        scoresList.appendChild(div);
    });
}

window.buySkin = (skinId) => {
    const skin = skins.find(s => s.id === skinId);
    if (skin && gameState.bananas >= skin.price) {
        gameState.bananas -= skin.price;
        if (!gameState.ownedSkins.includes(skinId)) gameState.ownedSkins.push(skinId);
        saveState();
        renderShop();
    }
};

window.equipSkin = (skinId) => {
    gameState.currentSkin = skinId;
    saveState();
    renderShop();
};

window.buyItem = (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (item && gameState.bananas >= item.price) {
        gameState.bananas -= item.price;
        if (!gameState.ownedItems.includes(itemId)) gameState.ownedItems.push(itemId);
        saveState();
        renderShop();
    }
};

window.endGame = (bananasEarned, nextAction) => {
    currentRunScore = bananasEarned;
    gameState.bananas += bananasEarned;
    if (gameState.currentUsername) {
        gameState.userTotals[gameState.currentUsername] += bananasEarned;
        saveToGlobalDatabase(gameState.currentUsername, gameState.userTotals[gameState.currentUsername]);
    }
    if (window.game) {
        window.game.destroy(true);
        window.game = null;
    }
    if (nextAction === 'next_level') {
        gameState.currentLevel++;
        saveState();
        showScreen('game');
    } else {
        if (gameState.currentUsername) {
            gameState.currentLevel = 1;
            saveState();
            showScreen('start');
        } else {
            document.getElementById('final-score-display').innerText = `Zebrałeś ${bananasEarned} bananów!`;
            showScreen('nameEntry');
        }
    }
};

function submitScore() {
    const nameInput = document.getElementById('username-input');
    const name = nameInput.value.trim();
    if (!name) return;
    gameState.currentUsername = name;
    if (!gameState.userTotals[name]) gameState.userTotals[name] = gameState.bananas;
    saveToGlobalDatabase(name, gameState.userTotals[name]);
    gameState.currentLevel = 1;
    saveState();
    nameInput.value = '';
    showScreen('start');
}

function showScreen(screenId) {
    Object.values(screens).forEach(screen => screen.classList.add('hidden'));
    const target = screens[screenId];
    if (target) target.classList.remove('hidden');

    if (screenId === 'start') {
        updateStartScreen();
    } else if (screenId === 'shop') {
        renderShop();
    } else if (screenId === 'ranking') {
        fetchGlobalRanking();
        renderRanking();
    } else if (screenId === 'game') {
        // Music continues playing everywhere as requested
        if (!window.game) {
            const gameConfig = { ...config };
            gameConfig.callbacks = {
                postBoot: (game) => {
                    game.scene.start('GameScene', { level: gameState.currentLevel });
                }
            };
            window.game = new Phaser.Game(gameConfig);
        }
    }
}

// Global scope functions for easier debugging
window.showScreen = showScreen;

// Event listeners
document.getElementById('play-btn').addEventListener('click', () => {
    gameState.currentLevel = 1;
    saveState();
    showScreen('game');
});
document.getElementById('shop-btn').addEventListener('click', () => {
    showScreen('shop');
});
document.getElementById('ranking-btn').addEventListener('click', () => {
    showScreen('ranking');
});
document.getElementById('submit-score-btn').addEventListener('click', submitScore);

document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        showScreen('start');
    });
});

updateStartScreen();
