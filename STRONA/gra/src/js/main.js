import { MapSystem } from './map.js';
import { Robot } from './robot.js';
import { Interpreter } from './interpreter.js';
import { UI } from './ui.js';

class Game {
    constructor() {
        this.map = new MapSystem();
        this.robot = new Robot(this.map);
        this.ui = new UI(this);
        this.interpreter = new Interpreter(this);
        this.currentLevel = 0;
        this.levels = [
            {
                name: "Witaj w Bazie",
                grid: [
                    ['.', '.', '.', '.', '.'],
                    ['.', '#', '#', '#', '.'],
                    ['.', '#', 'E', '#', '.'],
                    ['.', '#', '.', '#', '.'],
                    ['R', '.', '.', '.', '.']
                ],
                energy: 100,
                description: "Dostań się do punktu końcowego (E)."
            },
            {
                name: "Przeszkody",
                grid: [
                    ['R', '.', '.', '.', '.'],
                    ['#', '#', '#', '.', '.'],
                    ['.', '.', '.', '#', '.'],
                    ['.', '#', '.', '.', '.'],
                    ['.', '.', '#', 'E', '.']
                ],
                energy: 50,
                description: "Omiń ściany i dotrzyj do celu."
            },
            {
                name: "Klucz i Drzwi",
                grid: [
                    ['R', '.', '.', '.', '.'],
                    ['#', '#', '#', 'D', '#'],
                    ['K', '.', '.', '.', '.'],
                    ['#', '#', '#', '#', '#'],
                    ['.', '.', '.', '.', 'E']
                ],
                energy: 100,
                description: "Podnieś klucz (K), aby otworzyć drzwi (D)."
            },
            {
                name: "Wielka Pętla",
                grid: [
                    ['R', '.', '.', '.', '.', '.', '.', '.', '.', 'E'],
                    ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#']
                ],
                energy: 20,
                description: "Użyj REPEAT, aby dotrzeć do końca."
            }
        ];
        
        this.isRunning = false;
        this.init();
    }

    init() {
        this.loadProgress();
        this.loadLevel(this.currentLevel);
        this.animate();
    }

    loadLevel(index) {
        const level = this.levels[index];
        this.map.load(level.grid);
        const robotPos = this.map.findRobot();
        this.robot.reset(robotPos.x, robotPos.y, level.energy);
        this.ui.updateStats(this.robot);
        this.ui.setLevelName(level.name);
        this.ui.setLevelDesc(level.description);
        this.ui.log(`Poziom załadowany: ${level.name}`);
    }

    async runProgram() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.ui.setControlsState(true);
        
        const code = this.ui.getCode();
        try {
            await this.interpreter.execute(code);
            this.checkWinCondition();
        } catch (error) {
            this.ui.log(`Błąd: ${error.message}`, 'error');
        } finally {
            this.isRunning = false;
            this.ui.setControlsState(false);
        }
    }

    stopProgram() {
        this.interpreter.stop();
        this.isRunning = false;
        this.ui.setControlsState(false);
    }

    resetLevel() {
        this.stopProgram();
        this.loadLevel(this.currentLevel);
    }

    checkWinCondition() {
        const cell = this.map.getAt(this.robot.x, this.robot.y);
        if (cell === 'E') {
            this.ui.log("Misja ukończona!", "success");
            this.saveProgress();
            
            setTimeout(() => {
                if (this.currentLevel < this.levels.length - 1) {
                    this.currentLevel++;
                    this.loadLevel(this.currentLevel);
                } else {
                    this.ui.log("Gratulacje! Ukończyłeś wszystkie poziomy!", "success");
                }
            }, 1500);
        }
    }

    saveProgress() {
        localStorage.setItem('robotGame_progress', this.currentLevel + 1);
    }

    loadProgress() {
        const saved = localStorage.getItem('robotGame_progress');
        if (saved) {
            this.currentLevel = Math.min(parseInt(saved), this.levels.length - 1);
        }
    }

    animate() {
        this.map.draw(this.robot);
        requestAnimationFrame(() => this.animate());
    }
}

window.addEventListener('load', () => {
    window.game = new Game();
});
