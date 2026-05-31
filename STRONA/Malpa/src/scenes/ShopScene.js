import { StorageManager } from '../utils/StorageManager.js';

export class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }

    create() {
        this.add.text(400, 50, 'Sklep', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);

        const bananas = StorageManager.get('bananas') || 0;
        this.add.text(400, 100, `Banany: ${bananas}`, { fontSize: '24px', fill: '#ff0' }).setOrigin(0.5);

        const skins = [
            { name: 'monkey', cost: 0 },
            { name: 'Ballerina', cost: 30 },
            { name: 'Desek', cost: 50 },
            { name: 'Nauk', cost: 60 }
        ];

        skins.forEach((skin, index) => {
            const y = 200 + index * 80;
            this.add.text(300, y, `${skin.name} (${skin.cost} bananów)`, { fontSize: '24px', fill: '#fff' });

            const ownedSkins = StorageManager.get('ownedSkins') || ['monkey'];
            if (ownedSkins.includes(skin.name)) {
                const isSelected = StorageManager.get('selectedSkin') === skin.name;
                const text = isSelected ? 'Wybrano' : 'Wybierz';
                const selectButton = this.add.text(600, y, text, { fontSize: '24px', fill: isSelected ? '#aaa' : '#0ff' }).setInteractive();
                if (!isSelected) {
                    selectButton.on('pointerdown', () => {
                        StorageManager.set('selectedSkin', skin.name);
                        this.scene.restart();
                    });
                }
            } else {
                const buyButton = this.add.text(600, y, 'Kup', { fontSize: '24px', fill: '#0f0' }).setInteractive();
                buyButton.on('pointerdown', () => this.purchaseSkin(skin));
            }
        });

        const exitButton = this.add.text(400, 550, 'Wyjdź', { fontSize: '32px', fill: '#f00' }).setInteractive();
        exitButton.on('pointerdown', () => this.scene.start('MenuScene'));
    }

    purchaseSkin(skin) {
        let bananas = StorageManager.get('bananas') || 0;
        let ownedSkins = StorageManager.get('ownedSkins') || ['monkey'];

        if (bananas >= skin.cost && !ownedSkins.includes(skin.name)) {
            bananas -= skin.cost;
            ownedSkins.push(skin.name);
            StorageManager.set('bananas', bananas);
            StorageManager.set('ownedSkins', ownedSkins);
            this.scene.restart();
        }
    }
}
