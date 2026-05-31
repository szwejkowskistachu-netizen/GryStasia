import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import * as TWEEN from 'tween';

console.log("Main script loaded");

// --- DŹWIĘKI (Web Audio API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    if (type === 'shoot') {
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'coin') {
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'hit') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    }
}

// --- STAN GRY ---
const gameState = {
    coins: 0,
    hp: 100,
    ownedSkins: ['default'],
    currentSkin: 'default',
    ownedWeapons: ['pistol'],
    currentWeapon: 'pistol',
    currentMap: null,
    inGame: false,
    bots: [],
    items: [],
    bullets: []
};

const SKINS = [
    { id: 'default', name: 'Zwykły Człowiek', price: 0, color: 0xcccccc }, // Szary człowiek
    { id: 'chicken', name: 'Kurczak', price: 10, color: 0xffff00 },
    { id: 'dog', name: 'Pies', price: 15, color: 0x8b4513 },
    { id: 'demogorgon', name: 'Demogorgon', price: 20, color: 0x4b0082 }
];

const WEAPONS_DATA = {
    pistol: { name: 'Pistol', damage: 5, price: 0, color: 0x555555 },
    sniper: { name: 'Snajpa', damage: [5, 40], price: 10, color: 0x222222 },
    shooter: { name: 'Strzelacz', damage: 10, price: 15, color: 0x0000ff }
};

// --- KLASY ---
class Bot {
    constructor(position) {
        this.hp = 100;
        this.alive = true;
        // Użyj domyślnego skina dla botów
        const skin = SKINS.find(s => s.id === 'default');
        
        // Model bota
        this.mesh = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.4), new THREE.MeshPhongMaterial({ color: skin.color }));
        body.position.y = 0.6;
        body.userData = { bot: this }; // Dodano
        this.mesh.add(body);
        
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshPhongMaterial({ color: 0xffdbac }));
        head.position.y = 1.4;
        head.userData = { bot: this }; // Dodano
        this.mesh.add(head);

        this.mesh.position.copy(position);
        scene.add(this.mesh);

        this.lastShot = 0;
        this.targetPos = new THREE.Vector3().copy(position);
        this.changeDirAt = 0;
        
        // HP Bar
        this.hpBar = document.createElement('div');
        this.hpBar.style.position = 'absolute';
        this.hpBar.style.width = '40px';
        this.hpBar.style.height = '5px';
        this.hpBar.style.backgroundColor = 'red';
        this.hpBar.style.border = '1px solid black';
        document.body.appendChild(this.hpBar);
        
        // HP Value
        this.hpValue = document.createElement('div');
        this.hpValue.style.position = 'absolute';
        this.hpValue.style.fontSize = '8px';
        this.hpValue.style.color = 'white';
        document.body.appendChild(this.hpValue);
        
        // Weapon Label
        this.weaponLabel = document.createElement('div');
        this.weaponLabel.style.position = 'absolute';
        this.weaponLabel.style.fontSize = '10px';
        this.weaponLabel.style.color = 'white';
        this.weaponLabel.textContent = 'Pistol'; // Bot weapon
        document.body.appendChild(this.weaponLabel);
    }

    update(delta, playerPos) {
        if (!this.alive) return;
        
        // Aktualizacja paska HP, wartości HP i etykiety broni
        const screenPos = this.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)).project(camera);
        screenPos.x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
        screenPos.y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;
        
        this.hpBar.style.left = `${screenPos.x - 20}px`;
        this.hpBar.style.top = `${screenPos.y - 50}px`;
        this.hpBar.style.width = `${Math.max(0, (this.hp / 100) * 40)}px`;
        
        this.hpValue.style.left = `${screenPos.x - 20}px`;
        this.hpValue.style.top = `${screenPos.y - 60}px`;
        this.hpValue.textContent = Math.round(this.hp);
        
        this.weaponLabel.style.left = `${screenPos.x - 20}px`;
        this.weaponLabel.style.top = `${screenPos.y - 75}px`;

        // Proste AI: Chodzenie losowe
        if (performance.now() > this.changeDirAt) {
            this.targetPos.set(
                this.mesh.position.x + (Math.random() - 0.5) * 10,
                0,
                this.mesh.position.z + (Math.random() - 0.5) * 10
            );
            this.changeDirAt = performance.now() + 2000 + Math.random() * 3000;
        }

        const moveDir = new THREE.Vector3().subVectors(this.targetPos, this.mesh.position).normalize();
        this.mesh.position.addScaledVector(moveDir, 2 * delta);

        // Strzelanie do gracza jeśli blisko
        const dist = this.mesh.position.distanceTo(playerPos);
        if (dist < 15 && performance.now() - this.lastShot > 2000) {
            this.shootAtPlayer();
            this.lastShot = performance.now();
        }
    }

    shootAtTarget(target) {
        console.log("Bot strzela!");
        if (Math.random() > 0.7) { // 30% szans na trafienie
            if (target.type === 'player') takeDamage(5);
            else target.bot.takeDamage(5);
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0 && this.alive) {
            this.die();
        }
    }

    die() {
        this.alive = false;
        // Usuń pasek HP, wartość HP i etykietę broni
        if (this.hpBar) document.body.removeChild(this.hpBar);
        if (this.hpValue) document.body.removeChild(this.hpValue);
        if (this.weaponLabel) document.body.removeChild(this.weaponLabel);
        // Animacja śmierci: upadek
        new TWEEN.Tween(this.mesh.rotation)
            .to({ x: -Math.PI / 2 }, 500)
            .start();
        
        setTimeout(() => {
            scene.remove(this.mesh);
            gameState.bots = gameState.bots.filter(b => b !== this);
            checkWin();
        }, 2000);
    }
}

// Musimy dodać TWEEN.js do index.html lub użyć prostego delta
function takeDamage(amount) {
    gameState.hp -= amount;
    updateStatsUI();
    if (gameState.hp <= 0) {
        gameOver();
    }
}

function gameOver() {
    gameState.inGame = false;
    controls.unlock();
    alert("ZGINĄŁEŚ!");
    showScreen('main');
}

function checkWin() {
    if (gameState.bots.length === 0) {
        gameState.inGame = false;
        controls.unlock();
        gameState.coins += 5;
        alert("WYGRAŁEŚ! Otrzymujesz 5 monet.");
        showScreen('main');
        updateStatsUI();
    }
}

// --- ELEMENTY UI ---
const screens = {
    main: document.getElementById('main-menu'),
    skins: document.getElementById('skin-menu'),
    weapons: document.getElementById('weapon-menu'),
    map: document.getElementById('map-menu'),
    loading: document.getElementById('loading-screen'),
    hud: document.getElementById('game-hud')
};

function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    screens[screenName].classList.remove('hidden');
    if (screenName === 'main') updateCharacterPreview();
}

function startGame() {
    showScreen('loading');
    
    // Upewnij się, że silnik jest zainicjowany
    if (!scene) initEngine();
    
    setTimeout(() => {
        buildMap(gameState.currentMap);
        gameState.inGame = true;
        controls.lock();
        showScreen('hud');
    }, 2000); // 2 sekundy ekranu ładowania
}

// --- LOGIKA SKLEPU I POSTACI ---
function updateCharacterPreview() {
    const preview = document.getElementById('character-preview');
    const skin = SKINS.find(s => s.id === gameState.currentSkin);
    preview.style.backgroundColor = `#${skin.color.toString(16).padStart(6, '0')}`;
}

// --- LOGIKA SKLEPU BRONI ---
function updateWeaponsUI() {
    const list = document.getElementById('weapons-list');
    list.innerHTML = '';
    Object.keys(WEAPONS_DATA).forEach(id => {
        const weapon = WEAPONS_DATA[id];
        const isOwned = gameState.ownedWeapons.includes(id);
        
        const card = document.createElement('div');
        card.className = `skin-card`;
        card.innerHTML = `
            <div style="background: #${weapon.color.toString(16).padStart(6, '0')}; height: 80px; margin-bottom: 10px;"></div>
            <h4>${weapon.name}</h4>
            <p>Obrażenia: ${Array.isArray(weapon.damage) ? weapon.damage[0]+"-"+weapon.damage[1] : weapon.damage}</p>
            <p>${isOwned ? 'POSIADANE' : weapon.price + ' Monety'}</p>
        `;
        if (!isOwned) {
            const btn = document.createElement('button');
            btn.textContent = 'KUP';
            btn.onclick = () => buyWeapon(id);
            card.appendChild(btn);
        } else {
            const span = document.createElement('span');
            span.textContent = 'ODBLOKOWANE';
            card.appendChild(span);
        }
        list.appendChild(card);
    });
}

window.buyWeapon = (id) => {
    const weapon = WEAPONS_DATA[id];
    if (gameState.coins >= weapon.price) {
        gameState.coins -= weapon.price;
        gameState.ownedWeapons.push(id);
        updateWeaponsUI();
        updateStatsUI();
    } else {
        alert('Za mało monet!');
    }
};

function updateSkinsUI() {
    const list = document.getElementById('skins-list');
    list.innerHTML = '';
    SKINS.forEach(skin => {
        const isOwned = gameState.ownedSkins.includes(skin.id);
        const isSelected = gameState.currentSkin === skin.id;
        
        const card = document.createElement('div');
        card.className = `skin-card ${isSelected ? 'selected' : ''}`;
        card.innerHTML = `
            <div style="background: #${skin.color.toString(16).padStart(6, '0')}; height: 100px; margin-bottom: 10px;"></div>
            <h4>${skin.name}</h4>
            <p>${isOwned ? (isSelected ? 'WYBRANO' : 'POSIADANE') : skin.price + ' Monety'}</p>
        `;
        const btn = document.createElement('button');
        if (!isOwned) {
            btn.textContent = 'KUP';
            btn.onclick = () => buySkin(skin.id);
        } else if (!isSelected) {
            btn.textContent = 'WYBIERZ';
            btn.onclick = () => selectSkin(skin.id);
        }
        if (btn.textContent) card.appendChild(btn);
        list.appendChild(card);
    });
}

function buySkin(id) {
    const skin = SKINS.find(s => s.id === id);
    if (gameState.coins >= skin.price) {
        gameState.coins -= skin.price;
        gameState.ownedSkins.push(id);
        updateSkinsUI();
        updateStatsUI();
    } else {
        alert('Za mało monet!');
    }
}

function selectSkin(id) {
    gameState.currentSkin = id;
    updateSkinsUI();
}

function updateStatsUI() {
    document.getElementById('menu-coins').textContent = gameState.coins;
    document.getElementById('coins-display').textContent = `Monety: ${gameState.coins}`;
    document.getElementById('hp-display').textContent = `HP: ${gameState.hp}`;
}

// --- OBSŁUGA PRZYCISKÓW ---
document.getElementById('btn-play').onclick = () => showScreen('map');
document.getElementById('btn-skins').onclick = () => {
    updateSkinsUI();
    showScreen('skins');
};
document.getElementById('btn-weapons').onclick = () => {
    updateWeaponsUI();
    showScreen('weapons');
};
document.querySelectorAll('.back-btn').forEach(btn => {
    btn.onclick = () => showScreen('main');
});

document.querySelectorAll('.map-card').forEach(card => {
    card.onclick = () => {
        gameState.currentMap = card.dataset.map;
        startGame();
    };
});

// --- THREE.JS ENGINE ---
let scene, camera, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

function initEngine() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    controls = new PointerLockControls(camera, document.body);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);

    scene.add(controls.getObject());

    animate();
}

function onKeyDown(event) {
    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyD': moveRight = true; break;
        case 'Digit1': switchWeapon('pistol'); break;
        case 'Digit2': switchWeapon('sniper'); break;
        case 'Digit3': switchWeapon('shooter'); break;
        case 'KeyE': collectMedkit(); break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyD': moveRight = false; break;
    }
}

function switchWeapon(id) {
    if (gameState.ownedWeapons.includes(id)) {
        gameState.currentWeapon = id;
        document.getElementById('weapon-info').textContent = `Broń: ${WEAPONS_DATA[id].name}`;
    } else {
        console.log("Nie masz tej broni!");
    }
}

function collectMedkit() {
    const playerPos = controls.getObject().position;
    gameState.items.forEach((item, index) => {
        if (item.userData.type === 'medkit' && item.position.distanceTo(playerPos) < 2) {
            gameState.hp = Math.min(100, gameState.hp + 10);
            scene.remove(item);
            gameState.items.splice(index, 1);
            updateStatsUI();
        }
    });
}

function onMouseDown() {
    if (gameState.inGame && controls.isLocked) {
        shoot();
    }
}

function shoot() {
    playSound('shoot');
    const weapon = WEAPONS_DATA[gameState.currentWeapon];
    let damage = Array.isArray(weapon.damage) 
        ? Math.floor(Math.random() * (weapon.damage[1] - weapon.damage[0] + 1)) + weapon.damage[0]
        : weapon.damage;

    // Raycasting for hits
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    
    // Wizualizacja strzału (Muzzle flash)
    const flash = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial({color: 0xffff00}));
    flash.position.set(0, -0.2, -0.5); // Przed kamerą
    camera.add(flash);
    setTimeout(() => camera.remove(flash), 100);

    const botMeshes = gameState.bots.map(b => b.mesh);
    const intersects = raycaster.intersectObjects(botMeshes, true);

    if (intersects.length > 0) {
        playSound('hit');
        const bot = intersects[0].object.userData.bot;
        if (bot) {
            bot.takeDamage(damage);
        }
    }
}

function buildMap(mapType) {
    // Czyścimy scenę
    gameState.bots.forEach(b => {
        if(b.hpBar) document.body.removeChild(b.hpBar);
    });
    gameState.bots = [];
    gameState.items = [];
    
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
    
    scene.add(controls.getObject());
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(10, 20, 10);
    scene.add(sunLight);

    if (mapType === 'city') {
        scene.background = new THREE.Color(0x333333);
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshPhongMaterial({ color: 0x444444 }));
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);
        
        // Budynki
        for(let i=0; i<30; i++) {
            const h = Math.random() * 20 + 5;
            const b = new THREE.Mesh(new THREE.BoxGeometry(10, h, 10), new THREE.MeshPhongMaterial({color: 0x777777}));
            b.position.set(Math.random() * 150 - 75, h/2, Math.random() * 150 - 75);
            scene.add(b);
        }
    } else {
        scene.background = new THREE.Color(0x87ceeb); // Niebo
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshPhongMaterial({ color: 0x114411 }));
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);

        // Teren dżungli
        for(let i=0; i<100; i++) {
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 4), new THREE.MeshPhongMaterial({color: 0x4d2926}));
            const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.5), new THREE.MeshPhongMaterial({color: 0x0b5345}));
            leaves.position.y = 3;
            tree.add(trunk);
            tree.add(leaves);
            tree.position.set(Math.random() * 180 - 90, 2, Math.random() * 180 - 90);
            scene.add(tree);
        }
    }

    // Dodaj 9 botów
    for(let i=0; i<9; i++) {
        const bot = new Bot(new THREE.Vector3(Math.random() * 80 - 40, 0, Math.random() * 80 - 40));
        gameState.bots.push(bot);
    }

    // Dodaj monety (artefakty)
    for(let i=0; i<20; i++) {
        const coin = new THREE.Mesh(new THREE.SphereGeometry(0.3), new THREE.MeshPhongMaterial({color: 0xffff00}));
        coin.position.set(Math.random() * 80 - 40, 0.5, Math.random() * 80 - 40);
        coin.userData = { type: 'coin' };
        scene.add(coin);
        gameState.items.push(coin);
    }

    // Dodaj apteczki
    for(let i=0; i<5; i++) {
        const medkit = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.5), new THREE.MeshPhongMaterial({color: 0xffffff}));
        const cross = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.6), new THREE.MeshPhongMaterial({color: 0xff0000}));
        medkit.add(cross);
        medkit.position.set(Math.random() * 80 - 40, 0.2, Math.random() * 80 - 40);
        medkit.userData = { type: 'medkit' };
        scene.add(medkit);
        gameState.items.push(medkit);
    }

    camera.position.set(0, 1.7, 0);
}

function animate() {
    requestAnimationFrame(animate);
    TWEEN.update();

    if (gameState.inGame && controls.isLocked) {
        const time = performance.now();
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        // Zmniejszenie prędkości ruchu
        if (moveForward || moveBackward) velocity.z -= direction.z * 150.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 150.0 * delta;

        // Proste sprawdzanie kolizji ze ścianami (tylko dla mapy miasta)
        const nextPos = controls.getObject().position.clone();
        nextPos.x -= velocity.x * delta;
        nextPos.z -= velocity.z * delta;

        let canMove = true;
        // Sprawdź tylko jeśli inGame
        if (gameState.currentMap === 'city') {
             // Tutaj moglibyśmy dodać bardziej zaawansowaną kolizję
             // Na teraz: nie wychodź poza 100
             if (Math.abs(nextPos.x) > 99 || Math.abs(nextPos.z) > 99) canMove = false;
        }

        if (canMove) {
            controls.moveRight(-velocity.x * delta);
            controls.moveForward(-velocity.z * delta);
        } else {
            velocity.set(0,0,0); // Zatrzymaj przy ścianie
        }

        // Update botów
        const playerPos = controls.getObject().position;
        gameState.bots.forEach(bot => bot.update(delta, playerPos));

        // Sprawdzanie kolizji z przedmiotami
        gameState.items.forEach((item, index) => {
            if (item.position.distanceTo(playerPos) < 1.5) {
                if (item.userData.type === 'coin') {
                    playSound('coin');
                    gameState.coins++;
                    scene.remove(item);
                    gameState.items.splice(index, 1);
                    updateStatsUI();
                }
            }
        });

        prevTime = time;
    }

    renderer.render(scene, camera);
}

// Obsługa zmiany rozmiaru okna
window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

updateStatsUI();
showScreen('main');
