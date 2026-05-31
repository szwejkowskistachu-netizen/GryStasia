/**
 * Generator i menedżer świata (chunków).
 */
window.GameEngine.WorldManager = class {
    constructor(world) {
        this.world = world;
        this.noise = new window.GameEngine.Perlin();
        this.chunkSize = 16; // w kafelkach
        this.tileSize = 32; // w pikselach
        this.chunks = new Map(); // "x,y" -> chunkData
        this.loadedChunks = new Set();
        
        this.biomes = {
            WATER: { color: '#3498db', name: 'Ocean' },
            SAND: { color: '#f1c40f', name: 'Pustynia' },
            GRASS: { color: '#2ecc71', name: 'Łąka' },
            FOREST: { color: '#27ae60', name: 'Las' },
            MOUNTAIN: { color: '#95a5a6', name: 'Góry' },
            SNOW: { color: '#ecf0f1', name: 'Zmarzlina' }
        };
    }

    getBiome(elevation) {
        if (elevation < 0.3) return this.biomes.WATER;
        if (elevation < 0.4) return this.biomes.SAND;
        if (elevation < 0.6) return this.biomes.GRASS;
        if (elevation < 0.8) return this.biomes.FOREST;
        if (elevation < 0.9) return this.biomes.MOUNTAIN;
        return this.biomes.SNOW;
    }

    generateChunk(cx, cy) {
        const key = `${cx},${cy}`;
        if (this.chunks.has(key)) return this.chunks.get(key);

        const tiles = Array(this.chunkSize * this.chunkSize).fill(null);

        // Szansa na strukturę (np. kamienny krąg/ruiny)
        if (Math.random() < 0.05) {
            const sx = (cx * this.chunkSize + 8) * this.tileSize;
            const sy = (cy * this.chunkSize + 8) * this.tileSize;
            
            // Dodajemy kafelki struktury do chunka
            const tx = 8;
            const ty = 8;
            const idx = ty * this.chunkSize + tx;
            tiles[idx] = { color: '#7f8c8d', name: 'Struktura' }; // Szary kamień
            tiles[idx+1] = { color: '#7f8c8d', name: 'Struktura' };
            tiles[idx-1] = { color: '#7f8c8d', name: 'Struktura' };
            tiles[idx+this.chunkSize] = { color: '#7f8c8d', name: 'Struktura' };
        }

        // Spawn stworzeń w nowym chunku
        if (window.game && window.game.aiSystem && Math.random() < 0.3) {
            const sx = (cx * this.chunkSize + Math.random() * this.chunkSize) * this.tileSize;
            const sy = (cy * this.chunkSize + Math.random() * this.chunkSize) * this.tileSize;
            window.game.aiSystem.spawnCreature(sx, sy);
        }

        for (let y = 0; y < this.chunkSize; y++) {
            for (let x = 0; x < this.chunkSize; x++) {
                const worldX = cx * this.chunkSize + x;
                const worldY = cy * this.chunkSize + y;
                
                // Generowanie terenu na podstawie szumu
                if (tiles[y * this.chunkSize + x] === null) {
                    const elevation = (this.noise.noise(worldX * 0.1, worldY * 0.1) + 1) / 2;
                    tiles[y * this.chunkSize + x] = this.getBiome(elevation);
                }
            }
        }

        const chunk = { cx, cy, tiles };
        this.chunks.set(key, chunk);
        return chunk;
    }

    updateLoadedChunks(playerWorldX, playerWorldY, viewWidth, viewHeight) {
        const pcx = Math.floor(playerWorldX / (this.chunkSize * this.tileSize));
        const pcy = Math.floor(playerWorldY / (this.chunkSize * this.tileSize));
        
        const range = 2; // Ile chunków wokół gracza
        const newLoaded = new Set();

        for (let dy = -range; dy <= range; dy++) {
            for (let dx = -range; dx <= range; dx++) {
                const cx = pcx + dx;
                const cy = pcy + dy;
                this.generateChunk(cx, cy);
                newLoaded.add(`${cx},${cy}`);
            }
        }
        this.loadedChunks = newLoaded;
    }

    draw(ctx, camera) {
        const fullChunkSize = this.chunkSize * this.tileSize;
        
        for (let key of this.loadedChunks) {
            const [cx, cy] = key.split(',').map(Number);
            const chunk = this.chunks.get(key);
            
            const screenX = cx * fullChunkSize - camera.x;
            const screenY = cy * fullChunkSize - camera.y;

            // Rysuj kafelki w chunku z detalami
            for (let y = 0; y < this.chunkSize; y++) {
                for (let x = 0; x < this.chunkSize; x++) {
                    const tile = chunk.tiles[y * this.chunkSize + x];
                    const tx = screenX + x * this.tileSize;
                    const ty = screenY + y * this.tileSize;

                    // Bazowy kolor
                    ctx.fillStyle = tile.color;
                    ctx.fillRect(tx, ty, this.tileSize + 0.5, this.tileSize + 0.5);

                    // Dodatkowe detale graficzne (ziarnistość/tekstura)
                    ctx.fillStyle = 'rgba(0,0,0,0.05)';
                    if ((x + y) % 2 === 0) {
                        ctx.fillRect(tx, ty, this.tileSize/2, this.tileSize/2);
                    }
                    
                    // Efekt biomu
                    if (tile.name === 'Las') {
                        ctx.fillStyle = 'rgba(0,0,0,0.2)';
                        ctx.beginPath();
                        ctx.moveTo(tx + 16, ty + 8);
                        ctx.lineTo(tx + 24, ty + 24);
                        ctx.lineTo(tx + 8, ty + 24);
                        ctx.fill();
                    }
                    if (tile.name === 'Góry') {
                        ctx.fillStyle = 'rgba(255,255,255,0.3)';
                        ctx.beginPath();
                        ctx.moveTo(tx + 16, ty + 4);
                        ctx.lineTo(tx + 28, ty + 28);
                        ctx.lineTo(tx + 4, ty + 28);
                        ctx.fill();
                    }
                    if (tile.name === 'Struktura') {
                        ctx.fillStyle = '#2c3e50';
                        ctx.fillRect(tx + 4, ty + 4, 24, 24);
                        ctx.strokeStyle = '#ecf0f1';
                        ctx.strokeRect(tx + 8, ty + 8, 16, 16);
                    }
                }
            }
        }
    }
};
