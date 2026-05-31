const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let player;
let bananas;
let cursors;

console.log("Initializing game...");
const game = new Phaser.Game(config);
console.log("Game initialized.");

function preload() {
    console.log("Preload started.");
    this.load.image('monkey', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
    this.load.image('banana', 'https://labs.phaser.io/assets/sprites/yellow_ball.png');
}

function create() {
    console.log("Create started.");
    player = this.physics.add.sprite(400, 300, 'monkey');
    player.setCollideWorldBounds(true);

    bananas = this.physics.add.group();

    for (let i = 0; i < 5; i++) {
        let b = bananas.create(
            Phaser.Math.Between(50, 750),
            Phaser.Math.Between(50, 550),
            'banana'
        );
    }

    cursors = this.input.keyboard.createCursorKeys();

    this.physics.add.overlap(player, bananas, collectBanana, null, this);
}

function update() {
    // console.log("Update running."); // Too spammy, commented out
    if (!player) return;
    
    player.setVelocity(0);

    if (cursors.left.isDown) player.setVelocityX(-200);
    if (cursors.right.isDown) player.setVelocityX(200);
    if (cursors.up.isDown) player.setVelocityY(-200);
    if (cursors.down.isDown) player.setVelocityY(200);
}

function collectBanana(player, banana) {
    console.log("Banana collected.");
    banana.disableBody(true, true);
}
