import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- CONFIGURATION ---
const BLOCK_SIZE = 1;
const WORLD_SIZE = 40; 
const VIEW_DISTANCE = 30; 
const NOISE_SCALE = 20;
const TERRAIN_HEIGHT = 15; 
const SEA_LEVEL = 5;

// --- SCENE SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); 
scene.fog = new THREE.Fog(0x87ceeb, 20, 100);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(WORLD_SIZE / 2, 15, WORLD_SIZE / 2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
sunLight.position.set(50, 100, 50);
sunLight.castShadow = true;
scene.add(sunLight);

// --- CONTROLS ---
const controls = new PointerLockControls(camera, renderer.domElement);
const instructions = document.getElementById('instructions');
const startBtn = document.getElementById('start-btn');

startBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    controls.lock();
};

instructions.onclick = () => {
    controls.lock();
};

controls.addEventListener('lock', () => {
    instructions.style.display = 'none';
});
controls.addEventListener('unlock', () => {
    instructions.style.display = 'flex';
});

// --- TERRAIN ---
function pseudoRandom(x, z) {
    const dot = x * 12.9898 + z * 78.233;
    const sn = Math.sin(dot) * 43758.5453;
    return sn - Math.floor(sn);
}

function smoothNoise(x, z) {
    const xi = Math.floor(x);
    const zi = Math.floor(z);
    const xf = x - xi;
    const zf = z - zi;
    const v1 = pseudoRandom(xi, zi);
    const v2 = pseudoRandom(xi + 1, zi);
    const v3 = pseudoRandom(xi, zi + 1);
    const v4 = pseudoRandom(xi + 1, zi + 1);
    const i1 = v1 * (1 - xf) + v2 * xf;
    const i2 = v3 * (1 - xf) + v4 * xf;
    return i1 * (1 - zf) + i2 * zf;
}

function getTerrainHeight(x, z) {
    let h = smoothNoise(x / NOISE_SCALE, z / NOISE_SCALE) * TERRAIN_HEIGHT;
    return Math.floor(h);
}

// --- MATERIALS ---
const materials = {
    grass: new THREE.MeshLambertMaterial({ color: 0x4a752c }),
    dirt: new THREE.MeshLambertMaterial({ color: 0x8b5a2b }),
    stone: new THREE.MeshLambertMaterial({ color: 0x808080 }),
    water: new THREE.MeshLambertMaterial({ color: 0x0000ff, transparent: true, opacity: 0.6 })
};

const blocks = [];
const geometry = new THREE.BoxGeometry(1, 1, 1);

function createBlock(x, y, z, material) {
    const block = new THREE.Mesh(geometry, material);
    block.position.set(x, y, z);
    scene.add(block);
    blocks.push(block);
    return block;
}

// --- WORLD GENERATION ---
for (let x = 0; x < WORLD_SIZE; x++) {
    for (let z = 0; z < WORLD_SIZE; z++) {
        const h = getTerrainHeight(x, z);
        for (let y = 0; y <= Math.max(h, SEA_LEVEL); y++) {
            let mat = null;
            if (y <= h) {
                if (y === h) mat = materials.grass;
                else if (y < h - 3) mat = materials.stone;
                else mat = materials.dirt;
            } else if (y <= SEA_LEVEL) {
                mat = materials.water;
            }
            if (mat) createBlock(x, y, z, mat);
        }
    }
}

// --- MOVEMENT ---
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const keys = {};

document.addEventListener('keydown', (e) => { keys[e.code] = true; });
document.addEventListener('keyup', (e) => { keys[e.code] = false; });

let prevTime = performance.now();
function animate() {
    requestAnimationFrame(animate);
    const time = performance.now();
    if (controls.isLocked) {
        const delta = (time - prevTime) / 1000;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 2.0 * delta;

        direction.z = Number(keys['KeyW']) - Number(keys['KeyS']);
        direction.x = Number(keys['KeyD']) - Number(keys['KeyA']);
        direction.normalize();

        if (keys['KeyW'] || keys['KeyS']) velocity.z -= direction.z * 40.0 * delta;
        if (keys['KeyA'] || keys['KeyD']) velocity.x -= direction.x * 40.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
        camera.position.y += (velocity.y * delta);

        const groundH = getTerrainHeight(camera.position.x, camera.position.z) + 2;
        if (camera.position.y < groundH) {
            velocity.y = 0;
            camera.position.y = groundH;
            if (keys['Space']) velocity.y += 5;
        }
    }
    prevTime = time;
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
