export class Robot {
    constructor(map) {
        this.map = map;
        this.reset(0, 0, 100);
    }

    reset(x, y, energy) {
        this.x = x;
        this.y = y;
        this.direction = 'RIGHT'; // UP, RIGHT, DOWN, LEFT
        this.inventory = [];
        this.energy = energy;
        this.moves = 0;
    }

    move() {
        if (this.energy <= 0) throw new Error("Brak energii!");
        
        let targetX = this.x;
        let targetY = this.y;

        if (this.direction === 'UP') targetY--;
        if (this.direction === 'DOWN') targetY++;
        if (this.direction === 'LEFT') targetX--;
        if (this.direction === 'RIGHT') targetX++;

        const cell = this.map.getAt(targetX, targetY);
        if (cell === '#' || cell === 'D') {
            throw new Error("Przeszkoda na drodze!");
        }

        this.x = targetX;
        this.y = targetY;
        this.energy--;
        this.moves++;
    }

    turnLeft() {
        const dirs = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
        let idx = dirs.indexOf(this.direction);
        idx = (idx - 1 + 4) % 4;
        this.direction = dirs[idx];
        this.energy--;
    }

    turnRight() {
        const dirs = ['UP', 'RIGHT', 'DOWN', 'LEFT'];
        let idx = dirs.indexOf(this.direction);
        idx = (idx + 1) % 4;
        this.direction = dirs[idx];
        this.energy--;
    }

    pick() {
        const cell = this.map.getAt(this.x, this.y);
        if (cell === 'K' || cell === 'C') {
            this.inventory.push(cell);
            this.map.setAt(this.x, this.y, '.');
            this.energy--;
        } else {
            throw new Error("Brak przedmiotu do podniesienia.");
        }
    }

    drop() {
        if (this.inventory.length === 0) throw new Error("Ekwipunek jest pusty.");
        const item = this.inventory.pop();
        this.map.setAt(this.x, this.y, item);
        this.energy--;
    }

    open() {
        let targetX = this.x;
        let targetY = this.y;
        if (this.direction === 'UP') targetY--;
        if (this.direction === 'DOWN') targetY++;
        if (this.direction === 'LEFT') targetX--;
        if (this.direction === 'RIGHT') targetX++;

        const cell = this.map.getAt(targetX, targetY);
        if (cell === 'D') {
            if (this.inventory.includes('K')) {
                this.map.setAt(targetX, targetY, '.');
                this.energy--;
            } else {
                throw new Error("Potrzebujesz klucza (K), aby otworzyć drzwi!");
            }
        } else {
            throw new Error("Tu nie ma drzwi.");
        }
    }

    wait() {
        this.energy--;
    }

    getFrontCell() {
        let tx = this.x;
        let ty = this.y;
        if (this.direction === 'UP') ty--;
        if (this.direction === 'DOWN') ty++;
        if (this.direction === 'LEFT') tx--;
        if (this.direction === 'RIGHT') tx++;
        return this.map.getAt(tx, ty);
    }
}
