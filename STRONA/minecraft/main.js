import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Constants
const BLOCK_SIZE = 1;
const WORLD_SIZE = 40;

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue
scene.fog = new THREE.Fog(0x87ceeb, 10, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// Controls
const controls = new PointerLockControls(camera, document.body);
const instructions = document.getElementById('instructions');
const crosshair = document.getElementById('crosshair');

instructions.addEventListener('click', () => {
    controls.lock();
});

controls.addEventListener('lock', () => {
    instructions.style.display = 'none';
    crosshair.style.display = 'block';
});

controls.addEventListener('unlock', () => {
    instructions.style.display = 'block';
    crosshair.style.display = 'none';
});

// Movement variables
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const onKeyDown = (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            if (canJump === true) velocity.y += 5;
            canJump = false;
            break;
        case 'Digit1':
            selectedMaterial = 'grass';
            break;
        case 'Digit2':
            selectedMaterial = 'dirt';
            break;
        case 'Digit3':
            selectedMaterial = 'stone';
            break;
    }
};

const onKeyUp = (event) => {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
};

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

// World Generation
const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

const materials = {
    grass: new THREE.MeshLambertMaterial({ color: 0x228b22 }),
    dirt: new THREE.MeshLambertMaterial({ color: 0x8b4513 }),
    stone: new THREE.MeshLambertMaterial({ color: 0x808080 }),
    wood: new THREE.MeshLambertMaterial({ color: 0x5d4037 }),
    leaves: new THREE.MeshLambertMaterial({ color: 0x2e7d32 })
};

let selectedMaterial = 'grass';
const slots = document.querySelectorAll('.slot');

function updateInventoryUI() {
    slots.forEach(slot => {
        if (slot.getAttribute('data-type') === selectedMaterial) {
            slot.classList.add('selected');
        } else {
            slot.classList.remove('selected');
        }
    });
}
const blocks = [];

function createBlock(x, y, z, materialType) {
    const mesh = new THREE.Mesh(geometry, materials[materialType]);
    mesh.position.set(x * BLOCK_SIZE, y * BLOCK_SIZE, z * BLOCK_SIZE);
    scene.add(mesh);
    blocks.push(mesh);
    return mesh;
}

// Simple Terrain Generation
for (let x = -WORLD_SIZE / 2; x < WORLD_SIZE / 2; x++) {
    for (let z = -WORLD_SIZE / 2; z < WORLD_SIZE / 2; z++) {
        // Height based on sine waves for a rolling hills effect
        const height = Math.floor((Math.sin(x * 0.2) + Math.sin(z * 0.2)) * 2) + 2;
        
        for (let y = 0; y <= height; y++) {
            let type = 'dirt';
            if (y === height) type = 'grass';
            if (y < height - 2) type = 'stone';
            createBlock(x, y, z, type);
        }

        // Randomly place trees
        if (x % 7 === 0 && z % 7 === 0 && Math.random() > 0.5) {
            const treeHeight = 3 + Math.floor(Math.random() * 2);
            for (let ty = 1; ty <= treeHeight; ty++) {
                createBlock(x, height + ty, z, 'wood');
            }
            // Leaves
            for (let lx = -1; lx <= 1; lx++) {
                for (let lz = -1; lz <= 1; lz++) {
                    for (let ly = 0; ly <= 1; ly++) {
                        createBlock(x + lx, height + treeHeight + ly, z + lz, 'leaves');
                    }
                }
            }
        }
    }
}

camera.position.set(0, 10, 0);

// Raycaster for block interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

document.addEventListener('mousedown', (event) => {
    if (!controls.isLocked) return;

    // Raycast from the center of the screen
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(blocks);

    if (intersects.length > 0) {
        const intersect = intersects[0];

        if (event.button === 0) {
            // Left click: Remove block
            scene.remove(intersect.object);
            blocks.splice(blocks.indexOf(intersect.object), 1);
        } else if (event.button === 2) {
            // Right click: Add block
            const pos = intersect.object.position.clone().add(intersect.face.normal);
            const mesh = new THREE.Mesh(geometry, materials[selectedMaterial]);
            mesh.position.copy(pos);
            scene.add(mesh);
            blocks.push(mesh);
        }
    }
});

// Prevent context menu on right click
document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

// Raycaster for collision
const groundRaycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 1.7);

// Animation Loop
let prevTime = performance.now();
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    if (controls.isLocked === true) {
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * 2.0 * delta; // Gravity

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 100.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 100.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        camera.position.y += (velocity.y * delta);

        // Ground collision
        groundRaycaster.ray.origin.copy(camera.position);
        const intersections = groundRaycaster.intersectObjects(blocks);
        const onObject = intersections.length > 0;

        if (onObject === true) {
            velocity.y = Math.max(0, velocity.y);
            canJump = true;
            
            // Adjust height to be exactly on top of the block
            const hit = intersections[0];
            camera.position.y = hit.point.y + 1.6; 
        }

        // Prevent falling through the world bottom
        if (camera.position.y < -10) {
            camera.position.set(0, 10, 0);
            velocity.y = 0;
        }
    }

    prevTime = time;
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
