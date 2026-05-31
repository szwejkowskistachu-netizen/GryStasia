export class Lighting {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.lightCanvas = document.createElement('canvas');
        this.lightCtx = this.lightCanvas.getContext('2d');
    }

    resize(w, h) {
        this.lightCanvas.width = w;
        this.lightCanvas.height = h;
    }

    draw(player, monster, camera, walls) {
        this.lightCtx.clearRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);
        
        // Ciemność podstawowa
        this.lightCtx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        this.lightCtx.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

        this.lightCtx.save();
        this.lightCtx.translate(-camera.x, -camera.y);

        // Światło latarki
        if (player.isFlashlightOn && (!player.isFlickering || Math.random() > 0.3)) {
            this.drawFlashlight(player, walls);
        }

        // Małe światło wokół gracza (widzenie w mroku)
        this.drawPointLight(player.x, player.y, 60, 'rgba(255, 255, 255, 0.1)');

        this.lightCtx.restore();

        // Nałożenie warstwy światła na główny canvas
        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.drawImage(this.lightCanvas, 0, 0);
        this.ctx.globalCompositeOperation = 'source-over';
    }

    drawFlashlight(player, walls) {
        const range = player.flashlightRange;
        const angle = player.flashlightAngle;
        
        this.lightCtx.save();
        this.lightCtx.beginPath();
        this.lightCtx.moveTo(player.x, player.y);
        
        // Uproszczone rzucanie promieni dla efektu FOV
        const segments = 30;
        const startAngle = player.angle - angle / 2;
        
        for (let i = 0; i <= segments; i++) {
            const currentAngle = startAngle + (angle * i / segments);
            const targetX = player.x + Math.cos(currentAngle) * range;
            const targetY = player.y + Math.sin(currentAngle) * range;
            
            // Raycasting (uproszczony)
            const hit = this.castRay(player.x, player.y, targetX, targetY, walls);
            this.lightCtx.lineTo(hit.x, hit.y);
        }
        
        this.lightCtx.closePath();
        
        const gradient = this.lightCtx.createRadialGradient(
            player.x, player.y, 0,
            player.x, player.y, range
        );
        gradient.addColorStop(0, 'rgba(255, 255, 240, 0.9)');
        gradient.addColorStop(1, 'rgba(255, 255, 240, 0)');
        
        this.lightCtx.globalCompositeOperation = 'destination-out';
        this.lightCtx.fillStyle = 'white';
        this.lightCtx.fill();
        this.lightCtx.restore();
    }

    drawPointLight(x, y, radius, color) {
        this.lightCtx.save();
        const grad = this.lightCtx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, 'white');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        this.lightCtx.globalCompositeOperation = 'destination-out';
        this.lightCtx.fillStyle = grad;
        this.lightCtx.beginPath();
        this.lightCtx.arc(x, y, radius, 0, Math.PI * 2);
        this.lightCtx.fill();
        this.lightCtx.restore();
    }

    castRay(x1, y1, x2, y2, walls) {
        // Uproszczony algorytm sprawdzania kolizji promienia ze ścianami
        const dx = x2 - x1;
        const dy = y2 - y1;
        const steps = 20;
        const tileSize = 40;

        for (let i = 1; i <= steps; i++) {
            const px = x1 + (dx * i / steps);
            const py = y1 + (dy * i / steps);
            const gx = Math.floor(px / tileSize);
            const gy = Math.floor(py / tileSize);

            if (gy >= 0 && gy < walls.length && gx >= 0 && gx < walls[0].length) {
                if (walls[gy][gx] === 1) {
                    return { x: px, y: py };
                }
            }
        }
        return { x: x2, y: y2 };
    }
}
