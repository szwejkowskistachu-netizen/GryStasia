import { StorageManager } from '../utils/StorageManager.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.lives = 3;
        this.bananasCollected = 0;
    }

    preload() {
        console.log("GameScene: Preloading assets...");
        this.load.image('monkey', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
        this.load.image('snake', 'https://labs.phaser.io/assets/sprites/snake.png');
        this.load.image('banana', 'https://labs.phaser.io/assets/sprites/yellow_ball.png');
    }

    create() {
        const selectedSkin = StorageManager.get('selectedSkin') || 'monkey';
        console.log(`GameScene: Creating scene with selectedSkin: ${selectedSkin}`);
        
        // Ensure texture exists, create placeholder if missing
        if (!this.textures.exists(selectedSkin)) {
            const graphics = this.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(0xff0000, 1);
            graphics.fillRect(0, 0, 32, 32);
            graphics.generateTexture(selectedSkin, 32, 32);
        }

        this.player = this.physics.add.sprite(400, 300, selectedSkin);
        this.player.setCollideWorldBounds(true);

        this.bananas = this.physics.add.group({
            key: 'banana',
            repeat: 39
        });

        this.bananas.children.iterate(child => {
            child.setX(Phaser.Math.Between(0, 800));
            child.setY(Phaser.Math.Between(0, 600));
        });

        this.snake = this.physics.add.sprite(100, 100, 'snake');
        this.snake.setCollideWorldBounds(true);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.physics.add.overlap(this.player, this.bananas, this.collectBanana, null, this);
        this.physics.add.collider(this.player, this.snake, this.hitSnake, null, this);

        this.hud = this.add.text(16, 16, '', { fontSize: '32px', fill: '#000' });
        this.updateHUD();
    }

    update() {
        if (this.player.active) {
            if (this.cursors.left.isDown) this.player.setVelocityX(-160);
            else if (this.cursors.right.isDown) this.player.setVelocityX(160);
            else this.player.setVelocityX(0);

            if (this.cursors.up.isDown) this.player.setVelocityY(-160);
            else if (this.cursors.down.isDown) this.player.setVelocityY(160);
            else this.player.setVelocityY(0);

            this.physics.moveToObject(this.snake, this.player, 50);
        }
    }

    collectBanana(player, banana) {
        banana.disableBody(true, true);
        this.bananasCollected++;
        this.updateHUD();
        StorageManager.set('bananas', this.bananasCollected);

        if (this.bananasCollected === 40) {
            this.add.text(400, 300, 'Wygrałeś!', { fontSize: '64px', fill: '#0f0' }).setOrigin(0.5);
            this.time.delayedCall(2000, () => this.scene.start('LobbyScene'));
            this.player.setActive(false);
        }
    }

    hitSnake(player, snake) {
        this.lives--;
        this.updateHUD();
        player.setTint(0xff0000);
        this.time.delayedCall(500, () => player.clearTint());
        snake.setPosition(Phaser.Math.Between(0, 800), Phaser.Math.Between(0, 600));

        if (this.lives === 0) {
            this.add.text(400, 300, 'Przegrałeś', { fontSize: '64px', fill: '#f00' }).setOrigin(0.5);
            this.time.delayedCall(2000, () => this.scene.start('LobbyScene'));
            this.player.setActive(false);
        }
    }

    updateHUD() {
        this.hud.setText(`Lives: ${this.lives} | Bananas: ${this.bananasCollected}`);
    }
}
