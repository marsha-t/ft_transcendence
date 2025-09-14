import { IComponent } from "../components/IComponent.js";
import { PongGame } from "./game/PongGame.js";

export class Game implements IComponent {
    private pongGame: PongGame | null = null;
    private canvas: HTMLCanvasElement;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 800;
        this.canvas.height = 500;
    }

    public render(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'game_page';

        // Game title
        const title = document.createElement('h1');
        title.textContent = 'Pong Game';
        title.className = 'game_title';
        container.appendChild(title);

        // Canvas container
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas_container';
        this.canvas.className = 'game_canvas';
        canvasContainer.appendChild(this.canvas);
        container.appendChild(canvasContainer);

        // Controls container
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'controls_container';

        // Start/Pause button
        const startBtn = document.createElement('button');
        startBtn.className = 'start_btn';
        startBtn.textContent = 'Start Game';
        startBtn.addEventListener('click', () => this.toggleGame(startBtn));
        controlsContainer.appendChild(startBtn);

        // Reset button
        const resetBtn = document.createElement('button');
        resetBtn.className = 'reset_btn';
        resetBtn.textContent = 'Reset';
        resetBtn.addEventListener('click', () => this.resetGame(startBtn));
        controlsContainer.appendChild(resetBtn);

        container.appendChild(controlsContainer);

        // Instructions
        const instructions = document.createElement('div');
        instructions.className = 'instructions';
        instructions.innerHTML = `
            <h3>How to Play:</h3>
            <p><strong>Player 1:</strong> Use W (up) and S (down)</p>
            <p><strong>Player 2:</strong> Use Arrow Up and Arrow Down</p>
            <p><strong>Goal:</strong> First to 5 points wins!</p>
        `;
        container.appendChild(instructions);

        // Initialize the game
        this.initGame();

        return container;
    }

    private initGame(): void {
        this.pongGame = new PongGame(this.canvas);
    }

    private toggleGame(button: HTMLButtonElement): void {
        if (!this.pongGame) return;

        if (button.textContent === 'Start Game') {
            this.pongGame.start();
            button.textContent = 'Pause Game';
        } else {
            this.pongGame.pause();
            button.textContent = 'Start Game';
        }
    }

    private resetGame(startButton: HTMLButtonElement): void {
        if (!this.pongGame) return;

        this.pongGame.reset();
        startButton.textContent = 'Start Game';
    }

    public destroy(): void {
        if (this.pongGame) {
            this.pongGame.destroy();
            this.pongGame = null;
        }
    }
}