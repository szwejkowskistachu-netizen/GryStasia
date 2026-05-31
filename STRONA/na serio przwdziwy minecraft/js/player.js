/**
 * Player class handling movement and camera
 */
class Player {
    constructor(world, input) {
        this.world = world;
        this.input = input;

        this.position = { x: 8, y: 20, z: 8 };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0 }; // x = pitch, y = yaw

        this.camera = {
            position: { ...this.position },
            forward: { x: 0, y: 0, z: -1 },
            up: { x: 0, y: 1, z: 0 },
            right: { x: 1, y: 0, z: 0 }
        };

        this.speed = 5;
        this.mouseSensitivity = 0.002;
    }

    update(dt) {
        // Rotation
        const mouse = this.input.getMouseDelta();
        this.rotation.y -= mouse.x * this.mouseSensitivity;
        this.rotation.x -= mouse.y * this.mouseSensitivity;

        // Clamp pitch
        const limit = Math.PI / 2 - 0.1;
        if (this.rotation.x > limit) this.rotation.x = limit;
        if (this.rotation.x < -limit) this.rotation.x = -limit;

        // Update camera vectors
        this.camera.forward.x = Math.sin(this.rotation.y) * Math.cos(this.rotation.x);
        this.camera.forward.y = Math.sin(this.rotation.x);
        this.camera.forward.z = Math.cos(this.rotation.y) * Math.cos(this.rotation.x);

        this.camera.right.x = Math.sin(this.rotation.y - Math.PI / 2);
        this.camera.right.z = Math.cos(this.rotation.y - Math.PI / 2);

        // Movement
        let moveX = 0;
        let moveZ = 0;

        if (this.input.isKeyPressed('KeyW')) moveZ += 1;
        if (this.input.isKeyPressed('KeyS')) moveZ -= 1;
        if (this.input.isKeyPressed('KeyA')) moveX -= 1;
        if (this.input.isKeyPressed('KeyD')) moveX += 1;

        const moveDir = {
            x: this.camera.forward.x * moveZ + this.camera.right.x * moveX,
            z: this.camera.forward.z * moveZ + this.camera.right.z * moveX
        };

        // Normalize move dir
        const len = Math.sqrt(moveDir.x * moveDir.x + moveDir.z * moveDir.z);
        if (len > 0) {
            this.position.x += (moveDir.x / len) * this.speed * dt;
            this.position.z += (moveDir.z / len) * this.speed * dt;
        }

        // Gravity placeholder
        this.position.y -= 0.1 * dt; 
        if (this.position.y < 5) this.position.y = 5;

        // Sync camera position (eye height)
        this.camera.position.x = this.position.x;
        this.camera.position.y = this.position.y + 1.7; // Height of eyes
        this.camera.position.z = this.position.z;

        document.getElementById('pos').innerText = `${this.position.x.toFixed(1)}, ${this.position.y.toFixed(1)}, ${this.position.z.toFixed(1)}`;
    }
}
