export class UI {
    constructor(game) {
        this.game = game;
        this.editor = document.getElementById('code-editor');
        this.console = document.getElementById('console');
        this.energyVal = document.getElementById('energy-val');
        this.movesVal = document.getElementById('moves-val');
        this.levelName = document.getElementById('current-level-name');
        this.levelDesc = document.getElementById('level-desc');
        this.inventoryList = document.getElementById('inventory-list');
        this.blocksList = document.getElementById('blocks-list');
        this.workspace = document.getElementById('program-workspace');
        
        this.runBtn = document.getElementById('run-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.clearBtn = document.getElementById('clear-btn');

        this.initListeners();
    }

    initListeners() {
        this.runBtn.addEventListener('click', () => this.game.runProgram());
        this.stopBtn.addEventListener('click', () => this.game.stopProgram());
        this.resetBtn.addEventListener('click', () => this.game.resetLevel());
        this.clearBtn.addEventListener('click', () => this.clearWorkspace());

        // Drag & Drop for Palette
        const paletteBlocks = document.querySelectorAll('#blocks-palette .block');
        paletteBlocks.forEach(block => {
            block.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('cmd', block.dataset.cmd);
                e.dataTransfer.setData('type', 'palette');
            });
        });

        // Workspace Events
        this.workspace.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.workspace.classList.add('drag-over');
        });

        this.workspace.addEventListener('dragleave', () => {
            this.workspace.classList.remove('drag-over');
        });

        this.workspace.addEventListener('drop', (e) => {
            e.preventDefault();
            this.workspace.classList.remove('drag-over');
            
            const cmd = e.dataTransfer.getData('cmd');
            const type = e.dataTransfer.getData('type');

            if (type === 'palette') {
                this.addBlockToWorkspace(cmd);
            }
        });
    }

    addBlockToWorkspace(cmd) {
        const blockDiv = document.createElement('div');
        blockDiv.className = `block workspace-block ${['REPEAT', 'IF', 'END'].includes(cmd) ? 'block-control' : ''}`;
        blockDiv.dataset.cmd = cmd;
        blockDiv.draggable = true;

        // Content
        const contentDiv = document.createElement('div');
        contentDiv.style.display = 'flex';
        contentDiv.style.alignItems = 'center';
        contentDiv.style.gap = '5px';

        if (cmd === 'REPEAT') {
            contentDiv.appendChild(document.createTextNode('REPEAT'));
            const input = document.createElement('input');
            input.type = 'number';
            input.value = '5';
            input.style.width = '40px';
            input.addEventListener('input', () => this.syncCode());
            contentDiv.appendChild(input);
        } else if (cmd === 'IF') {
            contentDiv.appendChild(document.createTextNode('IF'));
            const select = document.createElement('select');
            ['WALL', 'ITEM', 'DOOR', 'ENEMY'].forEach(opt => {
                const o = document.createElement('option');
                o.value = opt;
                o.textContent = opt;
                select.appendChild(o);
            });
            select.addEventListener('change', () => this.syncCode());
            contentDiv.appendChild(select);
        } else {
            contentDiv.textContent = cmd;
        }

        blockDiv.appendChild(contentDiv);

        // Delete button
        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            blockDiv.remove();
            this.syncCode();
        };
        blockDiv.appendChild(deleteBtn);

        // Reordering logic
        blockDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('type', 'workspace');
            blockDiv.classList.add('dragging');
        });

        blockDiv.addEventListener('dragend', () => {
            blockDiv.classList.remove('dragging');
            this.syncCode();
        });

        this.blocksList.appendChild(blockDiv);

        // Sortable logic
        this.blocksList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingBlock = document.querySelector('.dragging');
            if (!draggingBlock) return;
            const afterElement = this.getDragAfterElement(this.blocksList, e.clientY);
            if (afterElement == null) {
                this.blocksList.appendChild(draggingBlock);
            } else {
                this.blocksList.insertBefore(draggingBlock, afterElement);
            }
        });

        this.syncCode();
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.workspace-block:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    clearWorkspace() {
        this.blocksList.innerHTML = '';
        this.syncCode();
    }

    syncCode() {
        const blocks = this.blocksList.querySelectorAll('.workspace-block');
        let code = '';
        blocks.forEach(block => {
            const cmd = block.dataset.cmd;
            if (cmd === 'REPEAT') {
                const val = block.querySelector('input').value;
                code += `${cmd} ${val}\n`;
            } else if (cmd === 'IF') {
                const val = block.querySelector('select').value;
                code += `${cmd} ${val}\n`;
            } else {
                code += `${cmd}\n`;
            }
        });
        this.editor.value = code;
    }

    getCode() {
        this.syncCode();
        return this.editor.value;
    }

    updateStats(robot) {
        this.energyVal.textContent = robot.energy;
        this.movesVal.textContent = robot.moves;
        
        this.inventoryList.innerHTML = '';
        robot.inventory.forEach(item => {
            const li = document.createElement('li');
            li.className = 'inventory-item';
            li.textContent = item === 'K' ? 'Klucz' : 'Skrzynia';
            this.inventoryList.appendChild(li);
        });
    }

    setLevelName(name) {
        this.levelName.textContent = name;
    }

    setLevelDesc(desc) {
        this.levelDesc.textContent = desc;
    }

    log(message, type = 'info') {
        const div = document.createElement('div');
        div.className = `console-${type}`;
        div.textContent = `> ${message}`;
        this.console.appendChild(div);
        this.console.scrollTop = this.console.scrollHeight;
    }

    setControlsState(running) {
        this.runBtn.disabled = running;
        this.stopBtn.disabled = !running;
        this.clearBtn.disabled = running;
        this.resetBtn.disabled = running;
    }

    highlightLine(index) {
        const blocks = this.blocksList.querySelectorAll('.workspace-block');
        blocks.forEach(b => b.classList.remove('active-executing'));
        if (blocks[index]) {
            blocks[index].classList.add('active-executing');
            blocks[index].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}
