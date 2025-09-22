import { PongGame } from "./game/PongGame.js";
export class Game {
    constructor() {
        this.pongGame = null;
        this.canvas = document.createElement('canvas');
        this.canvas.width = 800;
        this.canvas.height = 500;
    }
    render() {
        const container = document.createElement('div');
        container.className = 'game_page';
        this.loadPageStyles();
        const title = document.createElement('h1');
        title.textContent = 'Pong Game';
        title.className = 'game_title';
        container.appendChild(title);
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas_container';
        this.canvas.className = 'game_canvas';
        canvasContainer.appendChild(this.canvas);
        container.appendChild(canvasContainer);
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'controls_container';
        const startBtn = document.createElement('button');
        startBtn.className = 'start_btn';
        startBtn.textContent = 'Start Game';
        startBtn.addEventListener('click', () => this.toggleGame(startBtn));
        controlsContainer.appendChild(startBtn);
        const resetBtn = document.createElement('button');
        resetBtn.className = 'reset_btn';
        resetBtn.textContent = 'Reset';
        resetBtn.addEventListener('click', () => this.resetGame(startBtn));
        controlsContainer.appendChild(resetBtn);
        container.appendChild(controlsContainer);
        const instructions = document.createElement('div');
        instructions.className = 'instructions';
        instructions.innerHTML = `
            <h3>How to Play:</h3>
            <p><strong>Player 1:</strong> Use W (up) and S (down)</p>
            <p><strong>Player 2:</strong> Use Arrow Up and Arrow Down</p>
            <p><strong>Goal:</strong> First to 5 points wins!</p>
        `;
        container.appendChild(instructions);
        this.initGame();
        return container;
    }
    loadPageStyles() {
        if (document.getElementById('game-styles'))
            return;
        const link = document.createElement('link');
        link.id = 'game-styles';
        link.rel = 'stylesheet';
        link.href = '/styles/Game.css';
        document.head.appendChild(link);
    }
    initGame() {
        this.pongGame = new PongGame(this.canvas);
    }
    toggleGame(button) {
        if (!this.pongGame)
            return;
        if (button.textContent === 'Start Game') {
            this.pongGame.start();
            button.textContent = 'Pause Game';
        }
        else {
            this.pongGame.pause();
            button.textContent = 'Start Game';
        }
    }
    resetGame(startButton) {
        if (!this.pongGame)
            return;
        this.pongGame.reset();
        startButton.textContent = 'Start Game';
    }
    destroy() {
        if (this.pongGame) {
            this.pongGame.destroy();
            this.pongGame = null;
        }
    }
}
