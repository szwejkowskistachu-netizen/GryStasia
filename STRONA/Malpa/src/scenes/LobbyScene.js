export class LobbyScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LobbyScene' });
    }

    create() {
        this.add.text(400, 100, 'Lobby', { fontSize: '48px', fill: '#fff' }).setOrigin(0.5);

        const playButton = this.add.text(400, 250, 'Graj', { fontSize: '32px', fill: '#0f0' }).setInteractive();
        playButton.on('pointerdown', () => this.scene.start('GameScene'));

        const shopButton = this.add.text(400, 350, 'Sklep', { fontSize: '32px', fill: '#ff0' }).setInteractive();
        shopButton.on('pointerdown', () => this.scene.start('ShopScene'));

        const menuButton = this.add.text(400, 450, 'Menu', { fontSize: '32px', fill: '#fff' }).setInteractive();
        menuButton.on('pointerdown', () => this.scene.start('MenuScene'));
    }
}
