/**
 * System zarządzający przedmiotami i inwentarzem gracza.
 */
window.GameEngine.InventorySystem = class {
    constructor() {
        this.items = {
            wood: 5,
            sword: 0,
            gold: 10
        };
    }

    addItem(name, amount) {
        if (this.items[name] !== undefined) {
            this.items[name] += amount;
            return true;
        }
        return false;
    }

    removeItem(name, amount) {
        if (this.items[name] !== undefined && this.items[name] >= amount) {
            this.items[name] -= amount;
            return true;
        }
        return false;
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, window.innerHeight - 100, 250, 90);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, window.innerHeight - 100, 250, 90);

        ctx.fillStyle = 'white';
        ctx.font = '16px monospace';
        ctx.fillText(`Drewno: ${this.items.wood}`, 20, window.innerHeight - 75);
        ctx.fillText(`Miecze: ${this.items.sword}`, 20, window.innerHeight - 55);
        ctx.fillText(`Złoto: ${this.items.gold}`, 20, window.innerHeight - 35);
    }
};

/**
 * System Dialogów i Handlu.
 */
window.GameEngine.TradeSystem = class {
    constructor(world, inventory) {
        this.world = world;
        this.inventory = inventory;
        this.currentPartner = null;
        this.message = "";
        this.messageTimer = 0;
    }

    showMessage(msg) {
        this.message = msg;
        this.messageTimer = 3; // 3 sekundy
    }

    interact(playerPos) {
        const creatures = this.world.query('dna', 'position', 'emotions');
        let closest = null;
        let minDist = 60;

        for (let id of creatures) {
            const pos = this.world.getComponent(id, 'position');
            const dist = Math.sqrt((pos.x - playerPos.x)**2 + (pos.y - playerPos.y)**2);
            if (dist < minDist) {
                minDist = dist;
                closest = id;
            }
        }

        if (closest !== null) {
            const emotions = this.world.getComponent(closest, 'emotions');
            const dna = this.world.getComponent(closest, 'dna');
            
            const leash = this.world.getComponent(closest, 'leash');

            if (emotions.happiness > 0.6) {
                // Jeśli stworek jest uwiązany, może pomagać w zbieraniu
                if (leash.isAttached) {
                    this.inventory.addItem('wood', 2);
                    this.showMessage("Uwiązany stworek pomógł Ci zebrać drewno!");
                }
                
                if (!leash.isAttached) {
                    leash.isAttached = true;
                    this.showMessage("Przywiązałeś radosnego stworka! Teraz za Tobą chodzi.");
                } else {
                    // Handel: 5 drewna za 1 miecz
                    if (this.inventory.items.wood >= 5) {
                        this.inventory.removeItem('wood', 5);
                        this.inventory.addItem('sword', 1);
                        this.showMessage("Stworek wymienił Twoje drewno na miecz!");
                        emotions.happiness = 1.0;
                    } else {
                        this.showMessage("Stworek chce 5 drewna za miecz. Masz za mało!");
                    }
                }
            } else if (dna.aggression > 0.7) {
                if (this.inventory.items.sword > 0) {
                    const health = this.world.getComponent(closest, 'health');
                    health.current -= 40;
                    this.showMessage(`WALKA! Zadałeś obrażenia! (HP: ${Math.floor(health.current)})`);
                    
                    if (health.current <= 0) {
                        this.showMessage("ZWYCIĘSTWO! Potwór pokonany!");
                        this.inventory.addItem('gold', 15);
                        this.world.destroyEntity(closest);
                    }
                } else {
                    const playerHealth = this.world.getComponent(window.game.playerSystem.playerEntity, 'health');
                    playerHealth.current -= 10;
                    this.showMessage("AŁA! Potwór Cię ugryzł! Potrzebujesz miecza!");
                }
            } else {
                this.showMessage("Stworek patrzy na Ciebie niepewnie.");
            }
        }
    }

    draw(ctx) {
        if (this.messageTimer > 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.fillRect(window.innerWidth/2 - 200, 50, 400, 40);
            ctx.strokeStyle = 'black';
            ctx.strokeRect(window.innerWidth/2 - 200, 50, 400, 40);
            
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.font = '14px Segoe UI';
            ctx.fillText(this.message, window.innerWidth/2, 75);
            ctx.textAlign = 'start';
        }
    }

    update(dt) {
        if (this.messageTimer > 0) this.messageTimer -= dt;
    }
};
