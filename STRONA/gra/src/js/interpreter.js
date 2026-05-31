export class Interpreter {
    constructor(game) {
        this.game = game;
        this.shouldStop = false;
        this.variables = new Map();
        this.functions = new Map();
        this.stepDelay = 300;
    }

    stop() {
        this.shouldStop = true;
    }

    async execute(code) {
        this.shouldStop = false;
        this.variables.clear();
        this.functions.clear();
        
        const lines = code.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const tokens = this.tokenize(lines);
        
        // Pass 1: Find functions
        this.preProcessFunctions(tokens);

        // Pass 2: Execute
        await this.runBlock(tokens);
    }

    tokenize(lines) {
        return lines.map((line, index) => {
            const parts = line.split(/\s+/);
            return {
                command: parts[0].toUpperCase(),
                args: parts.slice(1),
                lineIndex: index
            };
        });
    }

    preProcessFunctions(tokens) {
        let inFunc = false;
        let currentFuncName = null;
        let funcTokens = [];

        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i];
            if (t.command === 'FUNCTION') {
                inFunc = true;
                currentFuncName = t.args[0];
                funcTokens = [];
                continue;
            }
            if (t.command === 'END' && inFunc) {
                this.functions.set(currentFuncName, funcTokens);
                inFunc = false;
                continue;
            }
            if (inFunc) {
                funcTokens.push(t);
            }
        }
    }

    async runBlock(tokens) {
        let i = 0;
        while (i < tokens.length && !this.shouldStop) {
            const t = tokens[i];
            
            // Skip function definitions during execution
            if (t.command === 'FUNCTION') {
                while (i < tokens.length && tokens[i].command !== 'END') i++;
                i++;
                continue;
            }

            const jump = await this.executeToken(t, tokens, i);
            if (jump !== undefined) {
                i = jump;
            } else {
                i++;
            }
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
            
            case 'SET':
                this.variables.set(t.args[0], this.parseValue(t.args[1]));
                break;

            case 'REPEAT':
                const count = this.parseValue(t.args[0]);
                const repeatBlock = [];
                let j = currentIndex + 1;
                let nested = 0;
                while (j < allTokens.length) {
                    if (allTokens[j].command === 'REPEAT' || allTokens[j].command === 'IF') nested++;
                    if (allTokens[j].command === 'END') {
                        if (nested === 0) break;
                        nested--;
                    }
                    repeatBlock.push(allTokens[j]);
                    j++;
                }
                for (let c = 0; c < count; c++) {
                    if (this.shouldStop) break;
                    await this.runBlock(repeatBlock);
                }
                return j + 1;

            case 'IF':
                const condition = t.args[0].toUpperCase();
                const ifBlock = [];
                let k = currentIndex + 1;
                let ifNested = 0;
                while (k < allTokens.length) {
                    if (allTokens[k].command === 'REPEAT' || allTokens[k].command === 'IF') ifNested++;
                    if (allTokens[k].command === 'END') {
                        if (ifNested === 0) break;
                        ifNested--;
                    }
                    ifBlock.push(allTokens[k]);
                    k++;
                }
                
                if (this.checkCondition(condition)) {
                    await this.runBlock(ifBlock);
                }
                return k + 1;

            case 'CALL':
                const funcName = t.args[0];
                if (this.functions.has(funcName)) {
                    await this.runBlock(this.functions.get(funcName));
                } else {
                    throw new Error(`Nieznana funkcja: ${funcName}`);
                }
                break;
        }

        this.game.ui.updateStats(robot);
    }

    parseValue(val) {
        if (this.variables.has(val)) return this.variables.get(val);
        const n = parseInt(val);
        return isNaN(n) ? val : n;
    }

    checkCondition(cond) {
        const front = this.game.robot.getFrontCell();
        const current = this.game.map.getAt(this.game.robot.x, this.game.robot.y);
        
        switch (cond) {
            case 'WALL': return front === '#';
            case 'ITEM': return front === 'K' || front === 'C' || current === 'K' || current === 'C';
            case 'DOOR': return front === 'D';
            case 'ENEMY': return front === 'X';
            default: return false;
        }
    }
}
