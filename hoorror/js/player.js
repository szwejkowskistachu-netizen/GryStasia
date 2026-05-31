export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.speed = 2;
        this.angle = 0;
        this.battery = 100;
        this.isFlashlightOn = true;
        this.flashlightRange = 250;
        this.flashlightAngle = Math.PI / 4; // 45 stopni
        this.inventory = [];
        this.fear = 0;
        this.isRunning = false;
        this.noise = 0;
        this.isHiding = false;
    }

    update(keys, mouse, map) {
        if (this.isHiding) return;

        let dx = 0;
        let dy = 0;
        
        this.isRunning = keys['ShiftLeft'] || keys['ShiftRight'];
        const currentSpeed = this.isRunning ? this.speed * 1.8 : this.speed;

        if (keys['KeyW'] || keys['ArrowUp']) dy -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) dy += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) dx -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx = (dx / length) * currentSpeed;
            dy = (dy / length) * currentSpeed;

            // Prosta kolizja
            if (!this.checkCollision(this.x + dx, this.y, map)) this.x += dx;
            if (!this.checkCollision(this.x, this.y + dy, map)) this.y += dy;

            this.noise = this.isRunning ? 100 : 40;
        } else {
            this.noise = 0;
        }

        // Obracanie w stronę myszy
        this.angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);

        // Zarządzanie latarką
        if (this.isFlashlightOn && this.battery > 0) {
            this.battery -= 0.01;
            if (this.battery < 10 && Math.random() < 0.1) {
                // Migotanie przy niskiej baterii
                this.isFlickering = true;
            } else {
                this.isFlickering = false;
            }
        } else {
            this.isFlashlightOn = false;
        }
    }

    checkCollision(nx, ny, map) {
        const tileSize = 40; // Stała rozmiaru kafelka
        const gridX = Math.floor(nx / tileSize);
        const gridY = Math.floor(ny / tileSize);

        // Sprawdzanie krawędzi gracza (promień)
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
            const cx = nx + Math.cos(angle) * this.radius;
            const cy = ny + Math.sin(angle) * this.radius;
            const gx = Math.floor(cx / tileSize);
            const gy = Math.floor(cy / tileSize);

            if (gy < 0 || gy >= map.length || gx < 0 || gx >= map[0].length || map[gy][gx] === 1) {
                return true;
            }
        }
        return false;
    }

    draw(ctx, camera) {
        if (this.isHiding) return;

        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);

        // Gracz (uproszczony widok z góry)
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Kierunek latarki
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.radius + 5, 0);
        ctx.stroke();

        ctx.restore();
    }
}
