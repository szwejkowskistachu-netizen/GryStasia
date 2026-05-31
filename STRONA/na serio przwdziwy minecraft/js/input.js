/**
 * Handle user input
 */
class Input {
    constructor() {
        this.keys = {};
        this.mouseDelta = { x: 0, y: 0 };
        this.mouseButtons = {};

        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        window.addEventListener('mousedown', (e) => {
            this.mouseButtons[e.button] = true;
            // Lock pointer on first click
            if (document.pointerLockElement === null) {
                document.body.requestPointerLock();
            }
        });
        window.addEventListener('mouseup', (e) => this.mouseButtons[e.button] = false);

        window.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === document.body) {
                this.mouseDelta.x += e.movementX;
                this.mouseDelta.y += e.movementY;
            }
        });
    }

    isKeyPressed(code) {
        return !!this.keys[code];
    }

    getMouseDelta() {
        const delta = { ...this.mouseDelta };
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
        return delta;
    }
}
