class MapSystem {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.grid = [];
        this.tileSize = 40;
        this.colors = {
            '.': '#2b2b3b', // Empty
            '#': '#45475a', // Wall
            'C': '#f9e2af', // Chest
            'K': '#fab387', // Key
            'D': '#eba0ac', // Door
            'E': '#a6e3a1', // End
            'X': '#f38ba8', // Enemy
        };
    }

    load(grid) {
        this.grid = JSON.parse(JSON.stringify(grid));
        this.canvas.width = this.grid[0].length * this.tileSize;
        this.canvas.height = this.grid.length * this.tileSize;
    }

    getAt(x, y) {
        if (y >= 0 && y < this.grid.length && x >= 0 && x < this.grid[0].length) {
            return this.grid[y][x];
        }
        return '#';
    }

    setAt(x, y, value) {
        if (y >= 0 && y < this.grid.length && x >= 0 && x < this.grid[0].length) {
            this.grid[y][x] = value;
        }
    }

    findRobot() {
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                if (this.grid[y][x] === 'R') {
                    this.grid[y][x] = '.';
                    return { x, y };
                }
            }
        }
        return { x: 0, y: 0 };
    }

    draw(robot) {
        if (!this.grid.length) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const cell = this.grid[y][x];
                this.ctx.fillStyle = this.colors[cell] || '#000';
                this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
                this.ctx.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                if (['C', 'K', 'D', 'E', 'X'].includes(cell)) {
                    this.ctx.fillStyle = '#11111b';
                    this.ctx.font = 'bold 20px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(cell, x * this.tileSize + this.tileSize/2, y * this.tileSize + this.tileSize/2);
                }
            }
        }
        this.drawRobot(robot);
    }

    drawRobot(robot) {
        const px = robot.x * this.tileSize + this.tileSize / 2;
        const py = robot.y * this.tileSize + this.tileSize / 2;
        const size = this.tileSize * 0.8;
        this.ctx.save();
        this.ctx.translate(px, py);
        const rotations = { 'UP': 0, 'RIGHT': Math.PI / 2, 'DOWN': Math.PI, 'LEFT': -Math.PI / 2 };
        this.ctx.rotate(rotations[robot.direction]);
        this.ctx.fillStyle = '#89b4fa';
        this.ctx.fillRect(-size/2, -size/2, size, size);
        this.ctx.fillStyle = '#1e1e2e';
        this.ctx.fillRect(-size/4, -size/2, size/2, size/4);
        this.ctx.restore();
    }
}

class Robot {
    constructor(map) {
        this.map = map;
        this.reset(0, 0, 100);
    }

    reset(x, y, energy) {
        this.x = x;
        this.y = y;
        this.direction = 'RIGHT';
        this.inventory = [];
        this.energy = energy;
        this.moves = 0;
    }

    move() {
        if (this.energy <= 0) throw new Error("Brak energii!");
        let tx = this.x, ty = this.y;
        if (this.direction === 'UP') ty--;
        else if (this.direction === 'DOWN') ty++;
        else if (this.direction === 'LEFT') tx--;
        else if (this.direction === 'RIGHT') tx++;
        const cell = this.map.getAt(tx, ty);
        if (cell === '#' || cell === 'D') throw new Error("Przeszkoda!");
        this.x = tx; this.y = ty;
        this.energy--; this.moves++;
    }

    turnLeft() { this.direction = ['UP', 'RIGHT', 'DOWN', 'LEFT'][(['UP', 'RIGHT', 'DOWN', 'LEFT'].indexOf(this.direction) - 1 + 4) % 4]; this.energy--; }
    turnRight() { this.direction = ['UP', 'RIGHT', 'DOWN', 'LEFT'][(['UP', 'RIGHT', 'DOWN', 'LEFT'].indexOf(this.direction) + 1) % 4]; this.energy--; }
    pick() {
        const cell = this.map.getAt(this.x, this.y);
        if (cell === 'K' || cell === 'C') { this.inventory.push(cell); this.map.setAt(this.x, this.y, '.'); this.energy--; }
        else throw new Error("Brak przedmiotu!");
    }
    drop() {
        if (!this.inventory.length) throw new Error("Pusto!");
        this.map.setAt(this.x, this.y, this.inventory.pop()); this.energy--;
    }
    open() {
        let tx = this.x, ty = this.y;
        if (this.direction === 'UP') ty--; else if (this.direction === 'DOWN') ty++; else if (this.direction === 'LEFT') tx--; else if (this.direction === 'RIGHT') tx++;
        if (this.map.getAt(tx, ty) === 'D') {
            if (this.inventory.includes('K')) { this.map.setAt(tx, ty, '.'); this.energy--; }
            else throw new Error("Brak klucza!");
        } else throw new Error("To nie drzwi!");
    }
    wait() { this.energy--; }
    getFrontCell() {
        let tx = this.x, ty = this.y;
        if (this.direction === 'UP') ty--; else if (this.direction === 'DOWN') ty++; else if (this.direction === 'LEFT') tx--; else if (this.direction === 'RIGHT') tx++;
        return this.map.getAt(tx, ty);
    }
}

class Interpreter {
    constructor(game) {
        this.game = game;
        this.shouldStop = false;
        this.variables = new Map();
        this.functions = new Map();
        this.stepDelay = 300;
    }

    stop() { this.shouldStop = true; }

    async execute(code) {
        this.shouldStop = false;
        this.variables.clear();
        this.functions.clear();
        const tokens = code.split('\n').map(l => l.trim()).filter(l => l.length > 0).map((line, index) => {
            const parts = line.split(/\s+/);
            return { command: parts[0].toUpperCase(), args: parts.slice(1), lineIndex: index };
        });
        await this.runBlock(tokens);
    }

    async runBlock(tokens) {
        let i = 0;
        while (i < tokens.length && !this.shouldStop) {
            const t = tokens[i];
            const jump = await this.executeToken(t, tokens, i);
            i = (jump !== undefined) ? jump : i + 1;
        }
    }

    async executeToken(t, allTokens, currentIndex) {
        if (this.shouldStop) return;
        this.game.ui.highlightLine(t.lineIndex);
        await new Promise(r => setTimeout(r, this.stepDelay));
        const robot = this.game.robot;
        switch (t.command) {
            case 'MOVE': robot.move(); break;
            case 'LEFT': robot.turnLeft(); break;
            case 'RIGHT': robot.turnRight(); break;
            case 'PICK': robot.pick(); break;
            case 'DROP': robot.drop(); break;
            case 'OPEN': robot.open(); break;
            case 'WAIT': robot.wait(); break;
            case 'REPEAT':
                const count = parseInt(t.args[0]);
                const block = [];
                let j = currentIndex + 1, nested = 0;
                while (j < allTokens.length) {
                    if (allTokens[j].command === 'REPEAT' || allTokens[j].command === 'IF') nested++;
                    if (allTokens[j].command === 'END') { if (nested === 0) break; nested--; }
                    block.push(allTokens[j]); j++;
                }
                for (let c = 0; c < count; c++) { if (this.shouldStop) break; await this.runBlock(block); }
                return j + 1;
            case 'IF':
                const cond = t.args[0].toUpperCase();
                const ifBlock = [];
                let k = currentIndex + 1, ifNested = 0;
                while (k < allTokens.length) {
                    if (allTokens[k].command === 'REPEAT' || allTokens[k].command === 'IF') ifNested++;
                    if (allTokens[k].command === 'END') { if (ifNested === 0) break; ifNested--; }
                    ifBlock.push(allTokens[k]); k++;
                }
                if (this.checkCondition(cond)) await this.runBlock(ifBlock);
                return k + 1;
        }
        this.game.ui.updateStats(robot);
    }

    checkCondition(cond) {
        const f = this.game.robot.getFrontCell();
        const c = this.game.map.getAt(this.game.robot.x, this.game.robot.y);
        if (cond === 'WALL') return f === '#';
        if (cond === 'ITEM') return f === 'K' || f === 'C' || c === 'K' || c === 'C';
        if (cond === 'DOOR') return f === 'D';
        if (cond === 'ENEMY') return f === 'X';
        return false;
    }
}

class UI {
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
        this.runBtn.onclick = () => this.game.runProgram();
        this.stopBtn.onclick = () => this.game.stopProgram();
        this.resetBtn.onclick = () => this.game.resetLevel();
        this.clearBtn.onclick = () => this.clearWorkspace();

        document.querySelectorAll('#blocks-palette .block').forEach(b => {
            b.ondragstart = (e) => {
                e.dataTransfer.setData('cmd', b.dataset.cmd);
                e.dataTransfer.setData('type', 'palette');
            };
        });

        this.workspace.ondragover = (e) => { e.preventDefault(); this.workspace.classList.add('drag-over'); };
        this.workspace.ondragleave = () => this.workspace.classList.remove('drag-over');
        this.workspace.ondrop = (e) => {
            e.preventDefault();
            this.workspace.classList.remove('drag-over');
            const cmd = e.dataTransfer.getData('cmd');
            if (e.dataTransfer.getData('type') === 'palette') this.addBlockToWorkspace(cmd);
        };
    }

    addBlockToWorkspace(cmd) {
        const blockDiv = document.createElement('div');
        blockDiv.className = `block workspace-block ${['REPEAT', 'IF', 'END'].includes(cmd) ? 'block-control' : ''}`;
        blockDiv.dataset.cmd = cmd;
        blockDiv.draggable = true;

        const content = document.createElement('div');
        content.style.cssText = 'display:flex;align-items:center;gap:5px;pointer-events:none;';
        if (cmd === 'REPEAT') {
            content.textContent = 'REPEAT';
            const input = document.createElement('input');
            input.type = 'number'; input.value = '5'; input.style.cssText = 'width:40px;pointer-events:auto;';
            input.oninput = () => this.syncCode();
            content.appendChild(input);
        } else if (cmd === 'IF') {
            content.textContent = 'IF';
            const select = document.createElement('select');
            select.style.pointerEvents = 'auto';
            ['WALL', 'ITEM', 'DOOR', 'ENEMY'].forEach(o => {
                const opt = document.createElement('option'); opt.value = o; opt.textContent = o; select.appendChild(opt);
            });
            select.onchange = () => this.syncCode();
            content.appendChild(select);
        } else {
            content.textContent = cmd;
        }
        blockDiv.appendChild(content);

        const del = document.createElement('span');
        del.className = 'delete-btn'; del.innerHTML = '&times;';
        del.onclick = (e) => { e.stopPropagation(); blockDiv.remove(); this.syncCode(); };
        blockDiv.appendChild(del);

        blockDiv.ondragstart = (e) => { e.dataTransfer.setData('type', 'workspace'); blockDiv.classList.add('dragging'); };
        blockDiv.ondragend = () => { blockDiv.classList.remove('dragging'); this.syncCode(); };

        this.blocksList.appendChild(blockDiv);
        this.blocksList.ondragover = (e) => {
            e.preventDefault();
            const drag = document.querySelector('.dragging');
            if (!drag) return;
            const after = this.getDragAfterElement(this.blocksList, e.clientY);
            if (!after) this.blocksList.appendChild(drag); else this.blocksList.insertBefore(drag, after);
        };
        this.syncCode();
    }

    getDragAfterElement(container, y) {
        const draggables = [...container.querySelectorAll('.workspace-block:not(.dragging)')];
        return draggables.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
            else return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    clearWorkspace() { this.blocksList.innerHTML = ''; this.syncCode(); }
    syncCode() {
        let code = '';
        this.blocksList.querySelectorAll('.workspace-block').forEach(b => {
            const cmd = b.dataset.cmd;
            if (cmd === 'REPEAT') code += `REPEAT ${b.querySelector('input').value}\n`;
            else if (cmd === 'IF') code += `IF ${b.querySelector('select').value}\n`;
            else code += `${cmd}\n`;
        });
        this.editor.value = code;
    }

    getCode() { this.syncCode(); return this.editor.value; }
    updateStats(r) {
        this.energyVal.textContent = r.energy; this.movesVal.textContent = r.moves;
        this.inventoryList.innerHTML = '';
        r.inventory.forEach(i => {
            const li = document.createElement('li'); li.className = 'inventory-item'; li.textContent = i === 'K' ? 'Klucz' : 'Skrzynia';
            this.inventoryList.appendChild(li);
        });
    }
    setLevelName(n) { this.levelName.textContent = n; }
    setLevelDesc(d) { this.levelDesc.textContent = d; }
    log(m, t = 'info') {
        const d = document.createElement('div'); d.className = `console-${t}`; d.textContent = `> ${m}`;
        this.console.appendChild(d); this.console.scrollTop = this.console.scrollHeight;
    }
    setControlsState(r) {
        this.runBtn.disabled = r; this.stopBtn.disabled = !r; this.clearBtn.disabled = r; this.resetBtn.disabled = r;
    }
    highlightLine(idx) {
        const bs = this.blocksList.querySelectorAll('.workspace-block');
        bs.forEach(b => b.classList.remove('active-executing'));
        if (bs[idx]) { bs[idx].classList.add('active-executing'); bs[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    }
}

class Game {
    constructor() {
        this.map = new MapSystem();
        this.robot = new Robot(this.map);
        this.ui = new UI(this);
        this.interpreter = new Interpreter(this);
        this.currentLevel = 0;
        this.levels = [
            { name: "Witaj w Bazie", grid: [['.', '.', '.', '.', '.'],['.', '#', '#', '#', '.'],['.', '#', 'E', '#', '.'],['.', '#', '.', '#', '.'],['R', '.', '.', '.', '.']], energy: 100, description: "Dostań się do punktu końcowego (E)." },
            { name: "Przeszkody", grid: [['R', '.', '.', '.', '.'],['#', '#', '#', '.', '.'],['.', '.', '.', '#', '.'],['.', '#', '.', '.', '.'],['.', '.', '#', 'E', '.']], energy: 50, description: "Omiń ściany i dotrzyj do celu." },
            { name: "Klucz i Drzwi", grid: [['R', '.', '.', '.', '.'],['#', '#', '#', 'D', '#'],['K', '.', '.', '.', '.'],['#', '#', '#', '#', '#'],['.', '.', '.', '.', 'E']], energy: 100, description: "Podnieś klucz (K), aby otworzyć drzwi (D)." },
            { name: "Wielka Pętla", grid: [['R', '.', '.', '.', '.', '.', '.', '.', '.', 'E'],['#', '#', '#', '#', '#', '#', '#', '#', '#', '#']], energy: 20, description: "Użyj REPEAT, aby dotrzeć do końca." }
        ];
        this.isRunning = false;
        this.loadProgress();
        this.loadLevel(this.currentLevel);
        this.animate();
    }

    loadLevel(idx) {
        const l = this.levels[idx]; this.map.load(l.grid);
        const p = this.map.findRobot(); this.robot.reset(p.x, p.y, l.energy);
        this.ui.updateStats(this.robot); this.ui.setLevelName(l.name); this.ui.setLevelDesc(l.description);
        this.ui.log(`Poziom załadowany: ${l.name}`);
    }

    async runProgram() {
        if (this.isRunning) return;
        this.isRunning = true; this.ui.setControlsState(true);
        try { await this.interpreter.execute(this.ui.getCode()); this.checkWinCondition(); }
        catch (e) { this.ui.log(`Błąd: ${e.message}`, 'error'); }
        finally { this.isRunning = false; this.ui.setControlsState(false); }
    }

    stopProgram() { this.interpreter.stop(); this.isRunning = false; this.ui.setControlsState(false); }
    resetLevel() { this.stopProgram(); this.loadLevel(this.currentLevel); }
    checkWinCondition() {
        if (this.map.getAt(this.robot.x, this.robot.y) === 'E') {
            this.ui.log("Misja ukończona!", "success"); this.saveProgress();
            setTimeout(() => {
                if (this.currentLevel < this.levels.length - 1) { this.currentLevel++; this.loadLevel(this.currentLevel); }
                else this.ui.log("Gratulacje! Koniec gry!", "success");
            }, 1500);
        }
    }
    saveProgress() { localStorage.setItem('robotGame_progress', this.currentLevel + 1); }
    loadProgress() { const s = localStorage.getItem('robotGame_progress'); if (s) this.currentLevel = Math.min(parseInt(s), this.levels.length - 1); }
    animate() { this.map.draw(this.robot); requestAnimationFrame(() => this.animate()); }
}

window.onload = () => { window.game = new Game(); };
