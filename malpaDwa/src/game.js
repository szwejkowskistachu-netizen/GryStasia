export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.level = data.level || 1;
        this.isMobile = !this.sys.game.device.os.desktop;
    }

    preload() {
        let graphics = this.make.graphics({ x: 0, y: 0, add: false });

        const drawMonkey = (g, skin) => {
            g.clear();
            
            // Shading/Shadow
            g.fillStyle(0x000000, 0.2);
            g.fillEllipse(18, 37, 24, 32); 

            // Body
            g.fillStyle(0x8B4513, 1);
            g.fillEllipse(16, 35, 24, 32); 
            
            if (skin === 'nauk') {
                g.fillStyle(0xFFFFFF, 1);
                g.fillEllipse(16, 35, 26, 32);
            } else if (skin === 'hiper_malpa') {
                // Glow effect for Hiper Malpa
                g.lineStyle(3, 0x00ffff, 0.8);
                g.strokeCircle(16, 24, 22);
                g.lineStyle(2, 0xffffff, 0.5);
                g.strokeCircle(16, 24, 26);
            }
            
            // Belly
            g.fillStyle(0xD2B48C, 1);
            g.fillEllipse(16, 38, 14, 20);
            
            // Head
            g.fillStyle(0x8B4513, 1);
            g.fillCircle(16, 18, 12);
            
            // Face area
            g.fillStyle(0xD2B48C, 1);
            g.fillEllipse(16, 20, 10, 8);
            
            // Ears
            g.fillStyle(0x8B4513, 1);
            g.fillCircle(6, 18, 4);
            g.fillCircle(26, 18, 4);
            g.fillStyle(0xD2B48C, 1);
            g.fillCircle(6, 18, 2);
            g.fillCircle(26, 18, 2);

            // Eyes
            g.fillStyle(0xffffff, 1);
            g.fillCircle(13, 17, 2.5);
            g.fillCircle(19, 17, 2.5);
            g.fillStyle(0x000000, 1);
            g.fillCircle(13, 17, 1.2);
            g.fillCircle(19, 17, 1.2);

            if (skin === 'desek') {
                // Skateboard detail
                g.fillStyle(0x228B22, 1);
                g.fillRect(6, 6, 20, 6);
                g.fillStyle(0x000000, 1);
                g.fillRect(8, 15, 16, 4);
            } else if (skin === 'ballerina') {
                g.fillStyle(0xFF69B4, 1);
                g.fillEllipse(16, 42, 32, 10);
                g.fillStyle(0xFFB6C1, 0.5);
                g.fillEllipse(16, 42, 36, 12);
            } else if (skin === 'nauk') {
                g.fillStyle(0x0000FF, 1);
                g.fillRect(20, 32, 2, 6);
                g.lineStyle(1, 0x000000, 1);
                g.strokeCircle(13, 17, 4);
                g.strokeCircle(19, 17, 4);
                g.lineBetween(13, 17, 19, 17);
            } else if (skin === 'hiper_malpa') {
                // Cyan energy eyes
                g.fillStyle(0x00ffff, 1);
                g.fillCircle(13, 17, 3);
                g.fillCircle(19, 17, 3);
                g.fillStyle(0xffffff, 0.8);
                g.fillCircle(13, 17, 1);
                g.fillCircle(19, 17, 1);
            }
        };

        drawMonkey(graphics, 'default');
        graphics.generateTexture('player_default', 32, 48);
        drawMonkey(graphics, 'desek');
        graphics.generateTexture('player_desek', 32, 48);
        drawMonkey(graphics, 'ballerina');
        graphics.generateTexture('player_ballerina', 32, 48);
        drawMonkey(graphics, 'nauk');
        graphics.generateTexture('player_nauk', 32, 48);
        drawMonkey(graphics, 'hiper_malpa');
        graphics.generateTexture('player_hiper_malpa', 32, 48);

        // Bat/Pałka texture
        graphics.clear();
        graphics.fillStyle(0x8D6E63, 1);
        graphics.fillRect(2, 0, 4, 30); // handle
        graphics.fillStyle(0xA1887F, 1);
        graphics.fillEllipse(4, 5, 8, 15); // club head
        graphics.generateTexture('bat', 8, 30);

        let suffix = '_normal';
        if (this.level === 2) suffix = '_jungle';
        else if (this.level === 3) suffix = '_lava';
        else if (this.level === 4) suffix = '_city';
        else if (this.level === 5) suffix = '_water';
        else if (this.level === 5) suffix = '_water';
        
        let platformColor = 0xA0522D;
        let groundColor = 0x5D4037;
        if (this.level === 2) {
            platformColor = 0x228B22;
            groundColor = 0x004400;
        } else if (this.level === 3) {
            platformColor = 0x444444;
            groundColor = 0xFF4500;
        } else if (this.level === 4) {
            platformColor = 0x555555;
            groundColor = 0x222222;
        } else if (this.level === 5) {
            platformColor = 0xFF7F50; // Coral
            groundColor = 0xEDC9AF; // Sand
        }

        graphics.clear();
        graphics.fillStyle(platformColor, 1);
        graphics.fillRect(0, 0, 200, 32);
        
        // Better texture for platforms
        graphics.fillStyle(0x000000, 0.15);
        if (this.level === 5) {
            // Coral patterns
            for(let i=0; i<15; i++) graphics.fillCircle(Math.random()*200, Math.random()*32, 4);
        } else {
            for(let i=0; i<10; i++) {
                graphics.fillRect(Math.random()*180, Math.random()*28, 20, 2);
            }
        }
        graphics.lineStyle(2, 0xffffff, 0.1);
        graphics.strokeRect(0, 0, 200, 32);

        if (this.level === 4) {
            graphics.fillStyle(0xffff00, 0.3); 
            for(let i=0; i<4; i++) graphics.fillRect(10 + (i*50), 8, 30, 16);
        }
        graphics.generateTexture('platform' + suffix, 200, 32);

        graphics.clear();
        graphics.fillStyle(groundColor, 1);
        graphics.fillRect(0, 0, 800, 32);
        
        // Texture for ground
        graphics.fillStyle(0x000000, 0.2);
        for(let i=0; i<40; i++) {
            graphics.fillCircle(Math.random()*800, Math.random()*32, 2);
        }

        if (this.level === 4) {
            graphics.fillStyle(0xffffff, 0.5);
            for(let i=0; i<10; i++) graphics.fillRect(10 + (i*80), 14, 40, 4);
        } else if (this.level === 5) {
            graphics.fillStyle(0xFFD700, 0.3); // Shiny sand
            for(let i=0; i<30; i++) graphics.fillCircle(Math.random()*800, Math.random()*32, 3);
        } else if (this.level !== 3) {
            graphics.fillStyle(0x228B22, 1);
            graphics.fillRect(0, 0, 800, 8);
            graphics.fillStyle(0x32CD32, 0.5);
            for(let i=0; i<20; i++) graphics.fillRect(i*40, 0, 10, 4);
        }
        graphics.generateTexture('ground' + suffix, 800, 32);

        graphics.clear();
        graphics.fillStyle(0xFFEB3B, 1);
        graphics.fillEllipse(10, 10, 18, 8);
        graphics.fillStyle(0xFDD835, 1);
        graphics.fillEllipse(10, 12, 14, 4); // Shading
        graphics.fillStyle(0x795548, 1);
        graphics.fillRect(18, 8, 2, 2); // Tip
        graphics.generateTexture('banana', 20, 20);

        graphics.clear();
        if (this.level === 4) {
            // Police Snake
            graphics.fillStyle(0x0000FF, 1); 
            graphics.fillCircle(20, 10, 10);
            graphics.fillStyle(0x000000, 1); 
            graphics.fillRect(10, 0, 20, 5); // Police hat
            graphics.fillStyle(0xffffff, 1);
            graphics.fillRect(10, 3, 20, 1); // Hat band
            graphics.fillStyle(0xffcc99, 1); 
            graphics.fillCircle(20, 12, 6);
            graphics.fillStyle(0x000000, 1);
            graphics.fillCircle(18, 11, 1);
            graphics.fillCircle(22, 11, 1);
            graphics.generateTexture('enemy', 44, 20);
        } else if (this.level === 3) {
            // Lava Gorilla
            graphics.fillStyle(0x330000, 1); // Dark base
            graphics.fillEllipse(25, 25, 45, 45); // Body
            graphics.fillStyle(0xff4500, 1); // Lava orange
            graphics.fillCircle(25, 15, 12); // Head
            graphics.fillStyle(0xffa500, 1);
            graphics.fillCircle(20, 12, 2); // Eyes
            graphics.fillCircle(30, 12, 2);
            graphics.fillStyle(0xff0000, 0.5);
            for(let i=0; i<10; i++) graphics.fillCircle(Math.random()*50, Math.random()*50, 3); // Lava spots
            graphics.generateTexture('enemy', 50, 50);
        } else if (this.level === 5) {
            // Shark
            graphics.fillStyle(0x808080, 1); // Gray
            graphics.fillEllipse(22, 10, 40, 15); // Body
            graphics.fillTriangle(20, 5, 30, 5, 25, -5); // Fin
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(38, 8, 2); // Eye
            graphics.fillStyle(0x000000, 1);
            graphics.fillCircle(38, 8, 1);
            graphics.generateTexture('enemy', 44, 20);
        } else {
            // Realistic Snake
            graphics.fillStyle(0x4CAF50, 1);
            graphics.fillEllipse(20, 10, 35, 12);
            // Snake patterns
            graphics.fillStyle(0x2E7D32, 1);
            for(let i=0; i<5; i++) graphics.fillCircle(10 + (i*6), 8 + (i%2)*4, 3);
            
            // Snake head
            graphics.fillStyle(0x4CAF50, 1);
            graphics.fillCircle(35, 10, 8);
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(38, 8, 2.5);
            graphics.fillStyle(0x000000, 1);
            graphics.fillCircle(38.5, 8, 1);
            // Tongue
            graphics.fillStyle(0xff0000, 1);
            graphics.fillRect(42, 10, 6, 1);
            graphics.generateTexture('enemy', 44, 20);
        }

        graphics.clear();
        if (this.level === 4) {
            graphics.fillStyle(0xCCCCCC, 1); 
            graphics.fillRect(9, 0, 2, 100);
        } else {
            graphics.fillStyle(0x5D4037, 1);
            graphics.fillRect(8, 0, 4, 100);
            graphics.fillStyle(0x2E7D32, 1);
            for(let i=0; i<5; i++) {
                graphics.fillEllipse(14, 10 + (i*20), 10, 6);
                graphics.fillEllipse(6, 20 + (i*20), 10, 6);
            }
        }
        graphics.generateTexture('climbable', 20, 100);

        graphics.clear();
        graphics.fillStyle(0x2196F3, 1);
        graphics.fillRect(0, 0, 20, 30);
        graphics.fillStyle(0xFF9800, 1);
        graphics.fillRect(5, 20, 10, 10);
        graphics.generateTexture('jetpack', 20, 30);
    }

    create() {
        this.lives = 4;
        this.collectedBananas = 0;
        this.isGameOver = false;
        const state = JSON.parse(localStorage.getItem('monkeyGame_v2')) || {};
        this.currentSkin = state.currentSkin || 'default';
        this.ownedItems = state.ownedItems || [];

        if (this.level === 2) this.cameras.main.setBackgroundColor('#1a2f1a');
        else if (this.level === 3) this.cameras.main.setBackgroundColor('#2f1a1a');
        else if (this.level === 4) this.cameras.main.setBackgroundColor('#001122');
        else if (this.level === 5) this.cameras.main.setBackgroundColor('#004466');
        else this.cameras.main.setBackgroundColor('#0d1b2a');

        this.generateMap();
        
        this.normalScale = 0.8;
        this.crouchScale = 0.4;
        this.player = this.physics.add.sprite(100, 400, 'player_' + this.currentSkin).setScale(this.normalScale);
        
        // Underwater Physics
        if (this.level === 5) {
            this.player.setGravityY(100);
            this.player.setDragX(50);
        } else {
            this.player.setGravityY(200);
        }
        
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(30, 45);
        this.physics.add.collider(this.player, this.platforms);
        if (this.level === 3) {
            this.physics.add.overlap(this.player, this.ground, this.touchLava, null, this);
        }
        
        // Oxygen Logic
        if (this.level === 5) {
            this.oxygen = 20;
            this.oxygenText = this.add.text(400, 50, 'TLEN: 20s', { fontSize: '28px', fill: '#00ffff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5, 0);
        }

        // Hiper Malpa Logic
        this.hasPowerStrike = (this.currentSkin === 'hiper_malpa');
        this.isStriking = false;
        if (this.hasPowerStrike) {
            this.bat = this.physics.add.image(0, 0, 'bat').setOrigin(0.5, 1).setVisible(false);
            this.bat.body.setAllowGravity(false);
            
            // Energy particles for Hiper Malpa
            this.energyParticles = this.add.particles(0, 0, 'banana', {
                scale: { start: 0.2, end: 0 },
                alpha: { start: 0.6, end: 0 },
                tint: 0x00ffff,
                speed: 50,
                lifespan: 600,
                blendMode: 'ADD',
                follow: this.player
            });
        }

        this.enemies = this.physics.add.group();
        this.physics.add.collider(this.enemies, this.platforms);
        
        let numEnemies = 0;
        if (this.level === 4) numEnemies = 2;
        else if (this.level === 3) numEnemies = 1; // 1 Lava Gorilla
        else numEnemies = (1 + Math.floor(this.level / 2));

        for (let i = 0; i < numEnemies; i++) {
            const enemy = this.enemies.create(Phaser.Math.Between(200, 700), Phaser.Math.Between(100, 500), 'enemy');
            enemy.setCollideWorldBounds(true);
            enemy.setGravityY(0); 
            this.physics.add.overlap(this.player, enemy, this.touchEnemy, null, this);
            const speed = (this.level === 3) ? 120 : (80 + (this.level * 10));
            enemy.setVelocity(Phaser.Math.Between(-speed, speed), Phaser.Math.Between(-speed, speed));
            enemy.setBounce(1);
            
            if (this.level === 3) {
                // Gorilla specific properties
                enemy.setScale(1.5);
                enemy.setTint(0xff4500);
            }
        }

        this.bananas = this.physics.add.group();
        const numBananas = Phaser.Math.Between(20, 40);
        for (let i = 0; i < numBananas; i++) {
            const platform = this.platformArray[Phaser.Math.Between(0, this.platformArray.length - 1)];
            const x = platform.x + Phaser.Math.Between(-80, 80);
            const y = platform.y - 64;
            const banana = this.bananas.create(x, y, 'banana');
            this.tweens.add({ targets: banana, angle: 15, duration: 500 + Math.random()*500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
        this.physics.add.collider(this.bananas, this.platforms);
        this.physics.add.overlap(this.player, this.bananas, this.collectBanana, null, this);

        this.isFlying = false;
        if (this.ownedItems.includes('jetpack')) this.activateJetpack(25);
        this.isClimbing = false;
        this.physics.add.overlap(this.player, this.vines, () => { this.isClimbing = true; }, null, this);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        
        this.setupMobileControls();

        this.scoreText = this.add.text(16, 16, '🍌 0', { fontSize: '32px', fill: '#f1c40f', stroke: '#000', strokeThickness: 4 });
        this.livesText = this.add.text(16, 55, '❤️ 4', { fontSize: '32px', fill: '#e74c3c', stroke: '#000', strokeThickness: 4 });
        this.levelText = this.add.text(784, 16, 'Poziom ' + this.level, { fontSize: '24px', fill: '#2ecc71', stroke: '#000', strokeThickness: 3 }).setOrigin(1, 0);
        this.timerText = this.add.text(400, 16, '', { fontSize: '28px', fill: '#3498db', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 0);
        
        this.emoteText = this.add.text(0, 0, '', { fontSize: '28px', fill: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
        this.emoteText.setVisible(false);

        // Hiper Malpa UI
        if (this.hasPowerStrike) {
            this.strikeText = this.add.text(400, 50, 'PAŁKA: GOTOWA (E)', { fontSize: '24px', fill: '#00ffff', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5, 0);
        }

        this.isActuallyCrouching = false;
        this.lastSpacePress = 0;
    }

    setupMobileControls() {
        this.mobileState = { left: false, right: false, up: false, down: false, crouch: false };
        this.lastTapTime = 0;
        this.lastMiddleTapTime = 0;
        if (!this.isMobile) return;
        const updateStateFromPointer = (pointer) => {
            if (!pointer.isDown) return;
            const screenWidth = this.cameras.main.width;
            const screenHeight = this.cameras.main.height;
            this.mobileState.left = pointer.x < screenWidth * 0.33;
            this.mobileState.right = pointer.x > screenWidth * 0.66;
            this.mobileState.up = pointer.y < screenHeight * 0.4;
            this.mobileState.down = pointer.y > screenHeight * 0.7;
            
            // Middle area trigger
            if (pointer.x > screenWidth * 0.33 && pointer.x < screenWidth * 0.66 && pointer.y > screenHeight * 0.4 && pointer.y < screenHeight * 0.7) {
                const now = this.time.now;
                if (now - this.lastMiddleTapTime < 300) {
                    if (this.hasPowerStrike) this.triggerStrike();
                    else this.triggerEmote('sigma');
                } else this.triggerEmote('67');
                this.lastMiddleTapTime = now;
            }
        };
        this.input.on('pointerdown', (p) => {
            const now = this.time.now;
            if (now - this.lastTapTime < 300) this.mobileState.crouch = !this.mobileState.crouch;
            this.lastTapTime = now;
            updateStateFromPointer(p);
        });
        this.input.on('pointermove', updateStateFromPointer);
        this.input.on('pointerup', () => {
            this.mobileState.left = this.mobileState.right = this.mobileState.up = this.mobileState.down = false;
        });
    }

    triggerStrike() {
        if (!this.hasPowerStrike || this.isStriking) return;
        
        this.isStriking = true;
        this.bat.setVisible(true);
        this.bat.setPosition(this.player.x, this.player.y);
        this.bat.angle = -90;
        this.bat.body.enable = true;
        this.bat.body.setSize(80, 80); // Much larger hit area for easier combat

        this.tweens.add({
            targets: this.bat,
            angle: 90,
            duration: 250,
            onUpdate: () => {
                this.bat.setPosition(this.player.x, this.player.y);
                // Center the large physics body on the player/bat origin
                this.bat.body.x = this.bat.x - this.bat.body.width / 2;
                this.bat.body.y = this.bat.y - this.bat.body.height / 2;
                
                // Check collision during swing
                this.physics.overlap(this.bat, this.enemies, (bat, enemy) => {
                    this.killEnemy(enemy);
                    // Flash effect on hit
                    this.cameras.main.flash(100, 0, 255, 255);
                });
            },
            onComplete: () => {
                this.bat.setVisible(false);
                this.bat.body.enable = false;
                this.isStriking = false;
                
                // Hiper Małpa power reset with cooldown instead of disappearing forever
                if (this.currentSkin === 'hiper_malpa') {
                    if (this.strikeText) this.strikeText.setText('ŁADOWANIE...');
                    this.time.delayedCall(5000, () => {
                        this.hasPowerStrike = true;
                        if (this.energyParticles) this.energyParticles.start();
                        if (this.strikeText) this.strikeText.setText('PAŁKA: GOTOWA (E)');
                    });
                } else {
                    this.hasPowerStrike = false;
                    if (this.energyParticles) this.energyParticles.stop();
                    if (this.strikeText) this.strikeText.setText('PAŁKA: ZUŻYTA');
                }
            }
        });
    }

    killEnemy(enemy) {
        if (!enemy || !enemy.active) return;
        
        // Disable physics immediately so it doesn't hurt the player
        enemy.disableBody(true, true);
        
        // Create death explosion particles
        const x = enemy.x;
        const y = enemy.y;
        const deathExplosion = this.add.particles(x, y, 'banana', {
            speed: { min: 100, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: 0x00ffff,
            lifespan: 500,
            gravityY: 200,
            quantity: 20
        });
        
        if (deathExplosion.explode) {
            deathExplosion.explode();
        }
        
        this.time.delayedCall(1000, () => {
            if (deathExplosion.destroy) deathExplosion.destroy();
        });

        // Ensure the enemy is definitely gone from all systems
        enemy.destroy();
    }

    triggerEmote(type) {
        let emote = null;
        if (type === 'sigma' && this.ownedItems.includes('emote_sigma')) emote = 'SIGMA';
        else if (type === '67' && this.ownedItems.includes('emote_67')) emote = '67';
        if (emote && !this.emoteText.visible) {
            this.emoteText.setText(emote);
            this.emoteText.setVisible(true);
            this.time.delayedCall(2000, () => { this.emoteText.setVisible(false); });
        }
    }

    generateMap() {
        this.platforms = this.physics.add.staticGroup();
        this.vines = this.physics.add.staticGroup();
        this.platformArray = [];
        let suffix = '_normal';
        if (this.level === 2) suffix = '_jungle';
        else if (this.level === 3) suffix = '_lava';
        else if (this.level === 4) suffix = '_city';
        else if (this.level === 5) suffix = '_water';
        if (this.level === 3) {
            this.ground = this.physics.add.staticImage(400, 568, 'ground' + suffix).setScale(2).refreshBody();
            this.platformArray.push(this.platforms.create(100, 450, 'platform' + suffix).refreshBody());
        } else {
            this.ground = this.platforms.create(400, 568, 'ground' + suffix).setScale(2).refreshBody();
            this.platformArray.push(this.ground);
        }
        let lastY = 500;
        const numPlatforms = this.level === 3 ? 10 : 7;
        for (let i = 0; i < numPlatforms; i++) {
            let x = Phaser.Math.Between(100, 700);
            let y = Phaser.Math.Between(100, 450);
            while (Math.abs(y - lastY) < 110) y = Phaser.Math.Between(100, 450);
            lastY = y;
            this.platformArray.push(this.platforms.create(x, y, 'platform' + suffix));
            if (Math.random() > 0.3) this.vines.create(x, y + 50, 'climbable').setScale(0.5).refreshBody();
        }
    }

    update(time, delta) {
        if (this.isGameOver) return;
        
        // Oxygen System for Level 5
        if (this.level === 5) {
            this.oxygen -= delta / 1000;
            if (this.player.y < 120) {
                this.oxygen = 20; // Refill oxygen near surface
                this.oxygenText.setFill('#00ff00');
            } else if (this.oxygen < 5) {
                this.oxygenText.setFill('#ff0000');
            } else {
                this.oxygenText.setFill('#00ffff');
            }
            this.oxygenText.setText('TLEN: ' + Math.ceil(this.oxygen) + 's');
            if (this.oxygen <= 0) this.gameOver(false);
        }

        // Enemy AI System
        this.enemies.getChildren().forEach(enemy => {
            if (!enemy.active) return;
            
            let chaseSpeed = 0;
            let detectionRange = 300 + (this.level * 50);

            if (this.level === 3) {
                // Gorilla is dumber: slower, smaller range, and loses focus
                chaseSpeed = 85;
                detectionRange = 350;
            } else if (this.level === 5) {
                // Sharks are smarter
                chaseSpeed = 120 + (this.level * 10);
                detectionRange = 500;
            } else {
                // Standard enemies get smarter each level
                chaseSpeed = 50 + (this.level * 15);
            }

            const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            
            if (distance < detectionRange) {
                // Level 3 Boss "loses focus" occasionally to be dumber
                if (this.level === 3 && Math.sin(time / 1000) > 0.3) {
                     // Pause chasing for a moment
                     return;
                }
                // Chase logic: move towards player
                this.physics.moveToObject(enemy, this.player, chaseSpeed);
            } else {
                // Maintain some random movement if too far
                if (enemy.body.speed < 20) {
                    enemy.setVelocity(
                        Phaser.Math.Between(-100, 100),
                        Phaser.Math.Between(-100, 100)
                    );
                }
            }
        });

        if (this.emoteText.visible) this.emoteText.setPosition(this.player.x, this.player.y - 60);

        if (Phaser.Input.Keyboard.JustDown(this.eKey)) this.triggerStrike();

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            const now = this.time.now;
            if (now - this.lastSpacePress < 300) this.triggerEmote('sigma');
            else this.triggerEmote('67');
            this.lastSpacePress = now;
        }

        this.isClimbing = false;
        this.physics.overlap(this.player, this.vines, () => { this.isClimbing = true; });
        const shouldCrouch = (this.shiftKey.isDown || this.mobileState.crouch) && !this.isFlying && !this.isClimbing;
        if (shouldCrouch && !this.isActuallyCrouching) {
            this.player.setScale(this.normalScale, this.crouchScale);
            this.player.body.setSize(30, 22);
            this.player.body.setOffset(0, 23);
            this.isActuallyCrouching = true;
        } else if (!shouldCrouch && this.isActuallyCrouching) {
            this.player.y -= 16; 
            this.player.setScale(this.normalScale);
            this.player.body.setSize(30, 45);
            this.player.body.setOffset(0, 0);
            this.isActuallyCrouching = false;
        }
        const moveUp = this.cursors.up.isDown || this.mobileState.up;
        const moveDown = this.cursors.down.isDown || this.mobileState.down;
        const moveLeft = this.cursors.left.isDown || this.mobileState.left;
        const moveRight = this.cursors.right.isDown || this.mobileState.right;
        if (this.isFlying) {
            this.player.setGravityY(0);
            if (moveUp) this.player.setVelocityY(-200);
            else if (moveDown) this.player.setVelocityY(200);
            else this.player.setVelocityY(0);
        } else if (this.isClimbing) {
            this.player.setGravityY(0);
            this.player.setVelocityY(0);
            if (moveUp) this.player.setVelocityY(-160);
            else if (moveDown) this.player.setVelocityY(160);
        } else this.player.setGravityY(200);
        if (moveLeft) this.player.setVelocityX(-160);
        else if (moveRight) this.player.setVelocityX(160);
        else this.player.setVelocityX(0);
        if (!this.isFlying && !this.isClimbing && moveUp && this.player.body.touching.down) this.player.setVelocityY(-380);
    }

    activateJetpack(duration) {
        this.isFlying = true;
        this.player.setGravityY(0);
        this.player.setTint(0x3498db);
        let timeLeft = duration;
        if (this.flyTimer) this.flyTimer.remove();
        this.flyTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                timeLeft--;
                if (timeLeft <= 0) {
                    this.isFlying = false;
                    this.player.setGravityY(200);
                    this.player.clearTint();
                    this.timerText.setText('');
                } else this.timerText.setText('🚀 ' + timeLeft + 's');
            },
            repeat: duration
        });
    }

    touchLava(p, l) {
        this.lives -= 1;
        this.livesText.setText('❤️ ' + this.lives);
        this.player.setPosition(100, 350); 
        this.player.setVelocity(0, 0);
        this.tweens.add({ targets: this.player, alpha: 0.5, duration: 100, yoyo: true, repeat: 3 });
        if (this.lives <= 0) this.gameOver(false);
    }

    touchEnemy(p, e) {
        if (this.isStriking) return;
        this.lives -= 1;
        this.livesText.setText('❤️ ' + this.lives);
        this.player.setPosition(100, 350);
        this.tweens.add({ targets: this.player, alpha: 0.5, duration: 100, yoyo: true, repeat: 3 });
        if (this.lives <= 0) this.gameOver(false);
    }

    collectBanana(p, b) {
        this.tweens.add({
            targets: b, scaleX: 0, scaleY: 0, duration: 200,
            onComplete: () => {
                b.disableBody(true, true);
                if (this.bananas.countActive(true) === 0) this.gameOver(true);
            }
        });
        this.collectedBananas += 1;
        this.scoreText.setText('🍌 ' + this.collectedBananas);
    }

    gameOver(isWin) {
        this.isGameOver = true;
        this.physics.pause();
        const center = this.cameras.main.centerX;
        const middle = this.cameras.main.centerY;
        if (isWin) {
            if (this.level === 5) {
                this.add.text(center, middle - 100, 'UKOŃCZYŁEŚ GRĘ!', { fontSize: '64px', fill: '#0f0', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
                this.add.text(center, middle - 30, 'GRATULACJE MAŁPIO MISTRZU!', { fontSize: '32px', fill: '#f1c40f', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
                const finishBtn = this.add.text(center, middle + 80, 'KONIEC', { fontSize: '32px', fill: '#fff', backgroundColor: '#e74c3c', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive();
                finishBtn.on('pointerdown', () => window.endGame(this.collectedBananas, 'exit'));
            } else {
                this.add.text(center, middle - 100, 'WYGRAŁEŚ!', { fontSize: '64px', fill: '#0f0', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
                const nextBtn = this.add.text(center, middle, 'POZIOM ' + (this.level + 1), { fontSize: '32px', fill: '#fff', backgroundColor: '#2ecc71', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive();
                const exitBtn = this.add.text(center, middle + 80, 'WYJDŹ', { fontSize: '32px', fill: '#fff', backgroundColor: '#e74c3c', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive();
                nextBtn.on('pointerdown', () => window.endGame(this.collectedBananas, 'next_level'));
                exitBtn.on('pointerdown', () => window.endGame(this.collectedBananas, 'exit'));
            }
        } else {
            const reason = (this.oxygen <= 0) ? 'BRAK TLENU!' : 'PRZEGRAŁEŚ';
            this.add.text(center, middle, reason, { fontSize: '64px', fill: '#f00', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
            setTimeout(() => window.endGame(this.collectedBananas, 'exit'), 2000);
        }
    }
}
