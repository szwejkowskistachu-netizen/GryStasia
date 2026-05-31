/**
 * Generator map oparty na algorytmie Binary Space Partitioning (BSP) lub prostym generatorze lochów.
 */
export class MapGenerator {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.map = [];
        this.rooms = [];
    }

    generate() {
        // Inicjalizacja pustej mapy (ściany)
        this.map = Array(this.height).fill().map(() => Array(this.width).fill(1));
        this.rooms = [];

        // Przykładowy prosty algorytm generowania pokoi i korytarzy
        const minRoomSize = 4;
        const maxRoomSize = 10;
        const maxRooms = 15;

        for (let i = 0; i < maxRooms; i++) {
            const w = Math.floor(Math.random() * (maxRoomSize - minRoomSize)) + minRoomSize;
            const h = Math.floor(Math.random() * (maxRoomSize - minRoomSize)) + minRoomSize;
            const x = Math.floor(Math.random() * (this.width - w - 1)) + 1;
            const y = Math.floor(Math.random() * (this.height - h - 1)) + 1;

            const newRoom = { x, y, w, h, centerX: Math.floor(x + w / 2), centerY: Math.floor(y + h / 2) };

            let intersects = false;
            for (let otherRoom of this.rooms) {
                if (this.roomsIntersect(newRoom, otherRoom)) {
                    intersects = true;
                    break;
                }
            }

            if (!intersects) {
                this.createRoom(newRoom);
                if (this.rooms.length > 0) {
                    const prevRoom = this.rooms[this.rooms.length - 1];
                    this.createHTunnel(prevRoom.centerX, newRoom.centerX, prevRoom.centerY);
                    this.createVTunnel(prevRoom.centerY, newRoom.centerY, newRoom.centerX);
                }
                this.rooms.push(newRoom);
            }
        }

        return {
            grid: this.map,
            rooms: this.rooms
        };
    }

    roomsIntersect(r1, r2) {
        return (r1.x <= r2.x + r2.w && r1.x + r1.w >= r2.x &&
                r1.y <= r2.y + r2.h && r1.y + r1.h >= r2.y);
    }

    createRoom(room) {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                this.map[y][x] = 0; // 0 to pusta przestrzeń (podłoga)
            }
        }
    }

    createHTunnel(x1, x2, y) {
        for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
            this.map[y][x] = 0;
        }
    }

    createVTunnel(y1, y2, x) {
        for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
            this.map[y][x] = 0;
        }
    }
}
