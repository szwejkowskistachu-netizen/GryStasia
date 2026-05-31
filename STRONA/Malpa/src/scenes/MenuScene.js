export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        // Assume assets are in 'assets' folder
        this.load.spritesheet('monkey', 'assets/monkey.png', { frameWidth: 64, frameHeight: 64 });
    }

    create() {
        // Animation
        this.anims.create({
            key: 'eat',
            frames: this.anims.generateFrameNumbers('monkey', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });
        this.add.sprite(400, 300, 'monkey').play('eat');

        // Buttons
        const playButton = this.add.text(400, 400, 'Graj', { fontSize: '32px', fill: '#0f0' }).setInteractive();
        playButton.on('pointerdown', () => this.scene.start('GameScene'));

        const skinButton = this.add.text(400, 500, 'Skórka', { fontSize: '32px', fill: '#ff0' }).setInteractive();
        skinButton.on('pointerdown', () => this.scene.start('ShopScene'));
    }
}