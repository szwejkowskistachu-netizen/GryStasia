class Unit {
    constructor(x, y, faction, type = 'SOLDIER') {
        const stats = CONFIG.UNIT_TYPES[type];
        this.id = Math.random().toString(36).substr(2, 9);
        this.x = x;
        this.y = y;
        this.faction = faction;
        this.type = type;
        
        this.maxHp = stats.hp;
        this.hp = stats.hp;
        this.atk = stats.atk;
        this.def = stats.def;
        this.spd = stats.spd;
        this.rng = stats.rng;
        this.sight = stats.sight;
        this.maxCooldown = stats.cooldown;
        this.cooldown = 0;
        
        this.target = null;
        this.state = 'IDLE'; // IDLE, MOVE, ATTACK, RETREAT
        this.angle = Math.random() * Math.PI * 2;
    }

    update(world) {
        if (this.cooldown > 0) this.cooldown--;
        
        const perception = this.perceive(world);
        const decision = this.decide(perception, world.factions[this.faction.id].strategy);
        this.execute(decision, world);
    }

    perceive(world) {
        const enemies = [];
        const allies = [];
        
        for (const unit of world.units) {
            if (unit === this) continue;
            const d = Utils.dist(this.x, this.y, unit.x, unit.y);
            if (d <= this.sight) {
                if (unit.faction.id === this.faction.id) {
                    allies.push({ unit, dist: d });
                } else {
                    enemies.push({ unit, dist: d });
                }
            }
        }
        return { enemies, allies };
    }

    decide(perception, strategy) {
        const { enemies, allies } = perception;

        if (this.hp < this.maxHp * strategy.retreatHP) {
            const danger = enemies.length > 0 ? enemies[0].unit : null;
            return { action: 'RETREAT', target: danger };
        }

        if (enemies.length > 0) {
            // Rank enemies based on strategy
            enemies.forEach(e => {
                let score = 0;
                // Distance factor (lower dist = higher score)
                score += (this.sight - e.dist) / this.sight * 10;
                
                // Strategy: Attack Priority
                if (strategy.attackPriority === 'weakest') {
                    score += (1 - e.unit.hp / e.unit.maxHp) * 20;
                } else if (strategy.attackPriority === 'strongest') {
                    score += (e.unit.hp / e.unit.maxHp) * 20;
                }

                e.score = score;
            });

            enemies.sort((a, b) => b.score - a.score);
            const bestTarget = enemies[0];

            if (bestTarget.dist <= this.rng) {
                return { action: 'ATTACK', target: bestTarget.unit };
            } else {
                return { action: 'MOVE_TO', target: bestTarget.unit };
            }
        }

        // Group behavior
        if (strategy.groupBehavior === 'stayTogether' && allies.length > 0) {
            const nearestAlly = allies.sort((a, b) => a.dist - b.dist)[0];
            if (nearestAlly.dist > 50) {
                return { action: 'MOVE_TO', target: nearestAlly.unit };
            }
        }

        return { action: 'WANDER' };
    }

    execute(decision, world) {
        switch (decision.action) {
            case 'ATTACK':
                this.attack(decision.target);
                break;
            case 'MOVE_TO':
                this.moveTowards(decision.target.x, decision.target.y);
                break;
            case 'RETREAT':
                if (decision.target) {
                    this.moveAwayFrom(decision.target.x, decision.target.y);
                } else {
                    this.wander();
                }
                break;
            case 'WANDER':
                this.wander();
                break;
        }
        
        this.x = Utils.clamp(this.x, 0, CONFIG.MAP_WIDTH);
        this.y = Utils.clamp(this.y, 0, CONFIG.MAP_HEIGHT);
    }

    moveTowards(tx, ty) {
        const dx = tx - this.x;
        const dy = ty - this.y;
        const angle = Math.atan2(dy, dx);
        this.angle = angle;
        this.x += Math.cos(angle) * this.spd;
        this.y += Math.sin(angle) * this.spd;
    }

    moveAwayFrom(tx, ty) {
        const dx = this.x - tx;
        const dy = this.y - ty;
        const angle = Math.atan2(dy, dx);
        this.angle = angle;
        this.x += Math.cos(angle) * this.spd;
        this.y += Math.sin(angle) * this.spd;
    }

    wander() {
        this.angle += (Math.random() - 0.5) * 0.2;
        this.x += Math.cos(this.angle) * (this.spd * 0.5);
        this.y += Math.sin(this.angle) * (this.spd * 0.5);
    }

    attack(target) {
        if (this.cooldown <= 0) {
            const damage = Math.max(1, this.atk - target.def);
            target.takeDamage(damage, this.faction);
            this.cooldown = this.maxCooldown;
        }
    }

    takeDamage(amount, attackerFaction = null) {
        this.hp -= amount;
        if (attackerFaction) {
            this.lastAttackerFaction = attackerFaction;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.faction.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // HP bar
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 5, this.y - 8, 10, 2);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - 5, this.y - 8, 10 * (this.hp / this.maxHp), 2);
    }
}
