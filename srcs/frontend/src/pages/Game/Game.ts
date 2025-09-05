import { IComponent } from '../../components/IComponent';

export class Game implements IComponent {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D | null;
    private leftScore: number = 0;
    private rightScore: number = 0;
    private statusMessage: string = 'Press Start to play';
    private handleInputBound: (event: KeyboardEvent) => void;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = 800;
        this.canvas.height = 500;
        this.context = this.canvas.getContext('2d');
        this.handleInputBound = (e: KeyboardEvent) => this.handleInput(e);
    }

    public render(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'game_page';

        // Canvas
        this.canvas.className = 'game_canvas';
        container.appendChild(this.canvas);

        // Start button
        const startBtn = document.createElement('button');
        startBtn.className = 'start_btn';
        startBtn.textContent = 'Start Game';
        startBtn.addEventListener('click', () => this.startGame());
        container.appendChild(startBtn);

        // Initialize game
        this.initGame();
        this.renderCanvas();

        return container;
    }

    private initGame() {
        if (!this.context) return;

        // Setup keyboard input for two players
        document.addEventListener('keydown', this.handleInputBound);

        // Start rendering loop
        this.gameLoop();
    }

    private handleInput(event: KeyboardEvent) {
        // Player 1: W (up), S (down)
        if (event.key === 'w') {
            this.movePaddle1('up');
        } else if (event.key === 's') {
            this.movePaddle1('down');
        }
        // Player 2: ArrowUp (up), ArrowDown (down)
        if (event.key === 'ArrowUp') {
            this.movePaddle2('up');
        } else if (event.key === 'ArrowDown') {
            this.movePaddle2('down');
        }
    }

    private movePaddle1(direction: 'up' | 'down') {
        // Stub: Move Player 1 paddle
    }

    private movePaddle2(direction: 'up' | 'down') {
        // Stub: Move Player 2 paddle
    }

    private startGame() {
        this.statusMessage = 'Game Started!';
        this.renderCanvas();
    }

    private updateGame() {
        // Stub: Update game state (ball, collisions, score)
    }

    private renderGame() {
        // Stub: Render paddles, ball, net
        if (!this.context || !this.canvas) return;
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Add rendering logic later
    }

    private gameLoop() {
        this.updateGame();
        this.renderGame();
        requestAnimationFrame(() => this.gameLoop());
    }

    private renderCanvas() {
        if (!this.context || !this.canvas) return;

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw scores
        this.context.font = '24px Arial';
        this.context.fillStyle = '#fff';
        this.context.textAlign = 'left';
        this.context.fillText(`Player 1: ${this.leftScore}`, 50, 50);
        this.context.textAlign = 'right';
        this.context.fillText(`Player 2: ${this.rightScore}`, this.canvas.width - 50, 50);

        // Draw status message
        this.context.font = '18px Arial';
        this.context.textAlign = 'center';
        this.context.fillText(this.statusMessage, this.canvas.width / 2, this.canvas.height - 50);
    }

    public destroy() {
        // Cleanup event listeners
        document.removeEventListener('keydown', this.handleInputBound);
    }
}