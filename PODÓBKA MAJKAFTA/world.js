import * as THREE from 'three';

export const BLOCK_TYPES = {
    GRASS: { id: 1, color: 0x4d9030, name: 'Trawa' },
    DIRT: { id: 2, color: 0x5d4037, name: 'Ziemia' },
    STONE: { id: 3, color: 0x757575, name: 'Kamień' }
};

export class World {
    constructor(scene) {
        this.scene = scene;
        this.blocks = new Map(); // Klucz: "x,y,z", Wartość: Mesh
        this.chunkSize = 16;
        this.worldHeight = 5;
        
        this.geometry = new THREE.BoxGeometry(1, 1, 1);
        
        this.generate();
    }

    generate() {
        for (let x = -this.chunkSize/2; x < this.chunkSize/2; x++) {
            for (let z = -this.chunkSize/2; z < this.chunkSize/2; z++) {
                // Warstwa kamienia
                for (let y = 0; y < 2; y++) {
                    this.addBlock(x, y, z, BLOCK_TYPES.STONE.id);
                }
                // Warstwa ziemi
                this.addBlock(x, 2, z, BLOCK_TYPES.DIRT.id);
                // Warstwa trawy
                this.addBlock(x, 3, z, BLOCK_TYPES.GRASS.id);
            }
        }
    }

    addBlock(x, y, z, typeId) {
        const key = `${x},${y},${z}`;
        if (this.blocks.has(key)) return;

        let color;
        switch(typeId) {
            case BLOCK_TYPES.GRASS.id: color = BLOCK_TYPES.GRASS.color; break;
            case BLOCK_TYPES.DIRT.id: color = BLOCK_TYPES.DIRT.color; break;
            case BLOCK_TYPES.STONE.id: color = BLOCK_TYPES.STONE.color; break;
            default: color = 0xffffff;
        }

        const material = new THREE.MeshStandardMaterial({ color: color });
        const mesh = new THREE.Mesh(this.geometry, material);
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.typeId = typeId;

        this.scene.add(mesh);
        this.blocks.set(key, mesh);
    }

    removeBlock(x, y, z) {
        const key = `${x},${y},${z}`;
        const mesh = this.blocks.get(key);
        if (mesh) {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
            this.blocks.delete(key);
        }
    }

    getBlock(x, y, z) {
        return this.blocks.get(`${x},${y},${z}`);
    }

    save() {
        const data = [];
        this.blocks.forEach((mesh, key) => {
            const [x, y, z] = key.split(',').map(Number);
            data.push({ x, y, z, typeId: mesh.userData.typeId });
        });
        localStorage.setItem('minecraft_world', JSON.stringify(data));
        alert('Świat zapisany!');
    }

    load() {
        const dataStr = localStorage.getItem('minecraft_world');
        if (!dataStr) {
            alert('Brak zapisanego świata!');
            return;
        }

        // Czyścimy obecny świat
        this.blocks.forEach((mesh, key) => {
            const [x, y, z] = key.split(',').map(Number);
            this.removeBlock(x, y, z);
        });

        const data = JSON.parse(dataStr);
        data.forEach(b => {
            this.addBlock(b.x, b.y, b.z, b.typeId);
        });
        alert('Świat wczytany!');
    }
}
