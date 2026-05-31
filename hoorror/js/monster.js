export class Monster {
    constructor(x, y, difficulty) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.speed = difficulty === 'easy' ? 1 : (difficulty === 'nightmare' ? 2.2 : 1.6);
        this.angle = 0;
        this.state = 'PATROL'; // PATROL, CHASE, INVESTIGATE, SEARCH_HIDING
        this.target = null;
        this.patrolPoints = [];
        this.memory = {
            playerVisits: {}, // Pomieszczenia odwiedzane przez gracza
            hidingSpotsChecked: [],
            lastPlayerPos: null
        };
        this.searchTimer = 0;
        this.noiseThreshold = 50;
    }

    update(player, map, rooms) {
        const distToPlayer = this.getDistance(this.x, this.y, player.x, player.y);
        
        // Czy potwór widzi gracza?
        const canSeePlayer = this.checkLineOfSight(player, map) && !player.isHiding;
        
        // Czy potwór słyszy gracza?
        const canHearPlayer = player.noise > 0 && distToPlayer < (player.noise * 3);

        if (canSeePlayer) {
            this.state = 'CHASE';
            this.target = { x: player.x, y: player.y };
            this.memory.lastPlayerPos = { x: player.x, y: player.y };
            this.updatePlayerVisits(player, rooms);
        } else if (canHearPlayer && this.state !== 'CHASE') {
            this.state = 'INVESTIGATE';
            this.target = { x: player.x, y: player.y };
        } else if (this.state === 'CHASE' && !canSeePlayer) {
            this.state = 'INVESTIGATE';
            this.searchTimer = 300; // Czas szukania w ostatnim miejscu
        }

        this.move(map);
        
        if (this.state === 'PATROL' && (!this.target || this.reachedTarget())) {
            this.setNewPatrolPoint(rooms);
        }

        if (this.state === 'INVESTIGATE' && this.reachedTarget()) {
            if (this.searchTimer > 0) {
                this.searchTimer--;
                this.lookAround();
            } else {
                this.state = 'PATROL';
            }
        }
    }

    updatePlayerVisits(player, rooms) {
        const tileSize = 40;
        const gx = Math.floor(player.x / tileSize);
        const gy = Math.floor(player.y / tileSize);
        
        rooms.forEach((room, index) => {
            if (gx >= room.x && gx < room.x + room.w && gy >= room.y && gy < room.y + room.h) {
                this.memory.playerVisits[index] = (this.memory.playerVisits[index] || 0) + 1;
            }
        });
    }

    setNewPatrolPoint(rooms) {
        // AI: Potwór częściej patroluje tam, gdzie był gracz
        let totalVisits = Object.values(this.memory.playerVisits).reduce((a, b) => a + b, 0);
        let selectedRoom;

        if (totalVisits > 0 && Math.random() < 0.7) {
            // Wybierz pokój na podstawie wag (częstotliwości odwiedzin)
            let rand = Math.random() * totalVisits;
            let current = 0;
            for (let roomIdx in this.memory.playerVisits) {
                current += this.memory.playerVisits[roomIdx];
                if (rand <= current) {
                    selectedRoom = rooms[roomIdx];
                    break;
                }
            }
        }

        if (!selectedRoom) {
            selectedRoom = rooms[Math.floor(Math.random() * rooms.length)];
        }

        const tileSize = 40;
        this.target = {
            x: (selectedRoom.x + Math.random() * selectedRoom.w) * tileSize,
            y: (selectedRoom.y + Math.random() * selectedRoom.h) * tileSize
        };
    }

    move(map) {
        if (!this.target) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const angle = Math.atan2(dy, dx);
        this.angle = angle;

        const vx = Math.cos(angle) * this.speed;
        const vy = Math.sin(angle) * this.speed;

        if (!this.checkCollision(this.x + vx, this.y, map)) this.x += vx;
        if (!this.checkCollision(this.x, this.y + vy, map)) this.y += vy;
    }

    reachedTarget() {
        return this.getDistance(this.x, this.y, this.target.x, this.target.y) < 20;
    }

    getDistance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    checkLineOfSight(player, map) {
        const tileSize = 40;
        const dist = this.getDistance(this.x, this.y, player.x, player.y);
        if (dist > 400) return false;

        // Uproszczony raycast w stronę gracza
        const steps = 10;
        for (let i = 1; i < steps; i++) {
            const px = this.x + (player.x - this.x) * (i / steps);
            const py = this.y + (player.y - this.y) * (i / steps);
            const gx = Math.floor(px / tileSize);
            const gy = Math.floor(py / tileSize);
            if (map[gy] && map[gy][gx] === 1) return false;
        }
        return true;
    }

    checkCollision(nx, ny, map) {
        const tileSize = 40;
        const gx = Math.floor(nx / tileSize);
        const gy = Math.floor(ny / tileSize);
        return !map[gy] || map[gy][gx] === 1;
    }

    lookAround() {
        this.angle += 0.1;
    }

    draw(ctx, camera) {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);

        // Potwór (mroczny kształt)
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.moveTo(this.radius, 0);
        ctx.lineTo(-this.radius, -this.radius);
        ctx.lineTo(-this.radius, this.radius);
        ctx.closePath();
        ctx.fill();

        // Oczy
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(5, -5, 2, 0, Math.PI * 2);
        ctx.arc(5, 5, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
