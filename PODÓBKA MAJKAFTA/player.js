import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

export class Player {
    constructor(camera, domElement, world, inventory) {
        this.camera = camera;
        this.world = world;
        this.inventory = inventory;
        this.controls = new PointerLockControls(camera, domElement);
        
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        
        this.height = 1.8;
        this.camera.position.y = 5; // Startowa pozycja

        this.raycaster = new THREE.Raycaster();
        
        this.initListeners();
    }

    initListeners() {
        const onKeyDown = (event) => {
            switch (event.code) {
                case 'KeyW': this.moveForward = true; break;
                case 'KeyA': this.moveLeft = true; break;
                case 'KeyS': this.moveBackward = true; break;
                case 'KeyD': this.moveRight = true; break;
                case 'Space':
                    if (this.canJump === true) this.velocity.y += 10;
                    this.canJump = false;
                    break;
                case 'Digit1': this.inventory.selectSlot(0); break;
                case 'Digit2': this.inventory.selectSlot(1); break;
                case 'Digit3': this.inventory.selectSlot(2); break;
            }
        };

        const onKeyUp = (event) => {
            switch (event.code) {
                case 'KeyW': this.moveForward = false; break;
                case 'KeyA': this.moveLeft = false; break;
                case 'KeyS': this.moveBackward = false; break;
                case 'KeyD': this.moveRight = false; break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        
        document.addEventListener('mousedown', (e) => {
            if (!this.controls.isLocked) return;
            
            if (e.button === 0) this.performAction('remove');
            if (e.button === 2) this.performAction('add');
        });
    }

    performAction(action) {
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = this.raycaster.intersectObjects(Array.from(this.world.blocks.values()));

        if (intersects.length > 0) {
            const intersect = intersects[0];
            if (intersect.distance < 5) {
                const pos = intersect.object.position;
                if (action === 'remove') {
                    this.world.removeBlock(pos.x, pos.y, pos.z);
                } else if (action === 'add') {
                    const normal = intersect.face.normal;
                    const newX = Math.round(pos.x + normal.x);
                    const newY = Math.round(pos.y + normal.y);
                    const newZ = Math.round(pos.z + normal.z);
                    
                    // Zapobieganie stawianiu bloku w miejscu gracza
                    const playerX = Math.round(this.camera.position.x);
                    const playerZ = Math.round(this.camera.position.z);
                    if (newX === playerX && newZ === playerZ && (newY === Math.floor(this.camera.position.y) || newY === Math.floor(this.camera.position.y - 1))) {
                        return;
                    }

                    this.world.addBlock(newX, newY, newZ, this.inventory.getSelectedBlockId());
                }
            }
        }
    }

    update(delta) {
        // Grawitacja i tarcie
        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;
        this.velocity.y -= 9.8 * 3.0 * delta; // Grawitacja

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * 400.0 * delta;
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * 400.0 * delta;

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);

        this.camera.position.y += (this.velocity.y * delta);

        // Prosta kolizja z podłożem (y=0 jako podłoga świata lub góra bloków)
        const feetY = this.camera.position.y - this.height;
        const blockBelow = this.world.getBlock(
            Math.round(this.camera.position.x),
            Math.floor(feetY),
            Math.round(this.camera.position.z)
        );

        if (feetY < (blockBelow ? blockBelow.position.y + 0.5 : -10)) {
            this.velocity.y = 0;
            this.camera.position.y = (blockBelow ? blockBelow.position.y + 0.5 : -10) + this.height;
            this.canJump = true;
        }
    }
}
