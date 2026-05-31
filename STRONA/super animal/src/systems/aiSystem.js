/**
 * System zarządzający zachowaniem i ruchem stworzeń.
 */
window.GameEngine.AISystem = class {
    constructor(world) {
        this.world = world;
        this.spawnRate = 0.1; // Szansa na spawn w nowym chunku
    }

    spawnCreature(x, y) {
        const id = this.world.createEntity();
        const dna = window.GameEngine.CreatureGenerator.generateDNA();
        
        this.world.addComponent(id, 'position', { x, y });
        this.world.addComponent(id, 'velocity', { x: (Math.random() - 0.5) * 20, y: (Math.random() - 0.5) * 20 });
        this.world.addComponent(id, 'dna', dna);
        this.world.addComponent(id, 'ai', {
            state: 'idle',
            timer: Math.random() * 5,
            target: null,
            personality: Math.random() > 0.5 ? 'curious' : 'shy'
        });
        this.world.addComponent(id, 'emotions', {
            happiness: 0.5,
            fear: 0,
            anger: 0,
            trust: 0
        });
        this.world.addComponent(id, 'health', {
            current: 50 + Math.random() * 50,
            max: 100
        });
        this.world.addComponent(id, 'leash', {
            isAttached: false
        });
        this.world.addComponent(id, 'needs', {
            hunger: 0,
            thirst: 0,
            sleep: 0
        });
        
        return id;
    }

    update(dt) {
        const creatures = this.world.query('dna', 'position', 'ai');
        
        for (let id of creatures) {
            const pos = this.world.getComponent(id, 'position');
            const vel = this.world.getComponent(id, 'velocity');
            const ai = this.world.getComponent(id, 'ai');
            const dna = this.world.getComponent(id, 'dna');
            
            ai.timer -= dt;

            // Maszyna stanów AI
            if (ai.timer <= 0) {
                if (ai.state === 'idle') {
                    ai.state = 'moving';
                    ai.timer = 2 + Math.random() * 3;
                    const angle = Math.random() * Math.PI * 2;
                    vel.x = Math.cos(angle) * (dna.speed * 0.5);
                    vel.y = Math.sin(angle) * (dna.speed * 0.5);
                } else {
                    ai.state = 'idle';
                    ai.timer = 1 + Math.random() * 2;
                    vel.x = 0;
                    vel.y = 0;
                }
            }

            // Aktualizacja pozycji
            pos.x += vel.x * dt;
            pos.y += vel.y * dt;
            
            // Reakcja na gracza (emocjonalna)
            const playerPos = this.world.getComponent(window.game.playerSystem.playerEntity, 'position');
            const dist = Math.sqrt((pos.x - playerPos.x)**2 + (pos.y - playerPos.y)**2);
            
            const emotions = this.world.getComponent(id, 'emotions');
            const leash = this.world.getComponent(id, 'leash');

            if (leash && leash.isAttached) {
                const playerPos = window.game.world.getComponent(window.game.playerSystem.playerEntity, 'position');
                const distToPlayer = Math.sqrt((pos.x - playerPos.x)**2 + (pos.y - playerPos.y)**2);
                if (distToPlayer > 80) {
                    const angle = Math.atan2(playerPos.y - pos.y, playerPos.x - pos.x);
                    pos.x += Math.cos(angle) * dna.speed * dt;
                    pos.y += Math.sin(angle) * dna.speed * dt;
                    ai.state = 'following';
                }
            } else if (dist < 150) {
                if (ai.personality === 'shy') {
                    emotions.fear = Math.min(1, emotions.fear + dt);
                    // Ucieczka
                    const angle = Math.atan2(pos.y - playerPos.y, pos.x - playerPos.x);
                    vel.x = Math.cos(angle) * dna.speed;
                    vel.y = Math.sin(angle) * dna.speed;
                    ai.state = 'fleeing';
                    ai.timer = 1;
                } else {
                    emotions.happiness = Math.min(1, emotions.happiness + dt * 0.1);
                }
            } else {
                emotions.fear = Math.max(0, emotions.fear - dt * 0.2);
            }
        }
    }

    draw(ctx, camera) {
        const creatures = this.world.query('dna', 'position', 'emotions');
        const playerPos = this.world.getComponent(window.game.playerSystem.playerEntity, 'position');

        for (let id of creatures) {
            const pos = this.world.getComponent(id, 'position');
            const dna = this.world.getComponent(id, 'dna');
            const emotions = this.world.getComponent(id, 'emotions');
            const leash = this.world.getComponent(id, 'leash');

            // Rysuj linię jeśli jest uwiązany
            if (leash && leash.isAttached) {
                ctx.strokeStyle = 'brown';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(pos.x - camera.x, pos.y - camera.y);
                ctx.lineTo(playerPos.x - camera.x, playerPos.y - camera.y);
                ctx.stroke();
            }
            
            let emotionState = 'neutral';
            if (emotions.happiness > 0.7) emotionState = 'happy';
            if (emotions.fear > 0.4) emotionState = 'angry'; // angry as placeholder for scared look

            window.GameEngine.CreatureGenerator.drawCreature(
                ctx, 
                pos.x - camera.x, 
                pos.y - camera.y, 
                dna, 
                emotionState
            );

            // Pasek HP nad stworzeniem
            const health = this.world.getComponent(id, 'health');
            if (health) {
                const s = dna.size || 20;
                const barW = s * 2;
                const barH = 4;
                ctx.fillStyle = 'red';
                ctx.fillRect(pos.x - camera.x - barW/2, pos.y - camera.y - s - 10, barW, barH);
                ctx.fillStyle = 'lime';
                ctx.fillRect(pos.x - camera.x - barW/2, pos.y - camera.y - s - 10, barW * (health.current / health.max), barH);
            }
        }
    }
};
