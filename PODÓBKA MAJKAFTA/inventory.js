import { BLOCK_TYPES } from './world.js';

export class Inventory {
    constructor() {
        this.slots = [
            BLOCK_TYPES.GRASS,
            BLOCK_TYPES.DIRT,
            BLOCK_TYPES.STONE
        ];
        this.selectedIndex = 0;
        this.initUI();
    }

    initUI() {
        const bar = document.getElementById('inventory-bar');
        bar.innerHTML = '';
        
        this.slots.forEach((block, index) => {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot' + (index === this.selectedIndex ? ' active' : '');
            slot.innerHTML = block.name[0]; // Pierwsza litera nazwy
            slot.style.color = 'white';
            slot.title = block.name;
            bar.appendChild(slot);
        });
    }

    selectSlot(index) {
        if (index >= 0 && index < this.slots.length) {
            this.selectedIndex = index;
            this.updateUI();
        }
    }

    updateUI() {
        const slots = document.querySelectorAll('.inventory-slot');
        slots.forEach((slot, index) => {
            if (index === this.selectedIndex) {
                slot.classList.add('active');
            } else {
                slot.classList.remove('active');
            }
        });
    }

    getSelectedBlockId() {
        return this.slots[this.selectedIndex].id;
    }
}
