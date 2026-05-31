const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const path = [
    { x: 100, y: 100 },
    { x: 400, y: 100 },
    { x: 400, y: 300 },
    { x: 700, y: 300 },
    { x: 700, y: 600 }
];

class Enemy {
    constructor(path) {
        this.path = path;
        this.x = path[0].x;
        this.y = path[0].y;
        this.targetIndex = 1;
        this.speed = 2;
        this.health = 100;
        this.radius = 10;
        this.dead = false;
    }

    update() {
        if (this.dead) return;

        const target = this.path[this.targetIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
            this.x = target.x;
            this.y = target.y;
            this.targetIndex++;
            if (this.targetIndex >= this.path.length) {
                this.dead = true; // Reached the end
            }
        } else {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
    }

    draw() {
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Health bar
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x - 10, this.y - 15, 20, 4);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - 10, this.y - 15, (this.health / 100) * 20, 4);
    }
}

class Tower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.range = 150;
        this.damage = 1;
        this.cooldown = 0;
        this.maxCooldown = 10; // Frames between shots
    }

    update(enemies) {
        if (this.cooldown > 0) {
            this.cooldown--;
        }

        if (this.cooldown === 0) {
            // Find first enemy in range
            const target = enemies.find(enemy => {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                return dist <= this.range && !enemy.dead;
            });

            if (target) {
                target.health -= this.damage;
                if (target.health <= 0) target.dead = true;
                this.cooldown = this.maxCooldown;
                this.lastTarget = target;
            } else {
                this.lastTarget = null;
            }
        }
    }

    draw() {
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x - 15, this.y - 15, 30, 30);
        
        // Range circle
        ctx.strokeStyle = 'rgba(0, 0, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
        ctx.stroke();

        if (this.lastTarget) {
            ctx.strokeStyle = 'yellow';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.lastTarget.x, this.lastTarget.y);
            ctx.stroke();
        }
    }
}

const enemies = [];
const towers = [
    new Tower(300, 150),
    new Tower(500, 250),
    new Tower(600, 400)
];

let frameCount = 0;

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw path
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
    ctx.lineWidth = 1;

    // Spawn enemies
    if (frameCount % 60 === 0) {
        enemies.push(new Enemy(path));
    }
    frameCount++;

    // Update & Draw Towers
    towers.forEach(tower => {
        tower.update(enemies);
        tower.draw();
    });

    // Update & Draw Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.update();
        enemy.draw();

        if (enemy.dead) {
            enemies.splice(i, 1);
        }
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();
