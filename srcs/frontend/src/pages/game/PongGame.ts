import { GameRenderer, GameState } from './GameRenderer.js';

export class PongGame {
    private canvas: HTMLCanvasElement;
    private renderer: GameRenderer;
    private gameState: GameState = {} as GameState;
    private gameRunning: boolean = false;
    private gameLoopRunning: boolean = false;
    private handleInputBound: (event: KeyboardEvent) => void;

    // Game constants
    private readonly PADDLE_SPEED = 15;
    private readonly BALL_SPEED = 4;
    private readonly WINNING_SCORE = 5;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.renderer = new GameRenderer(canvas);
        this.handleInputBound = (e: KeyboardEvent) => this.handleInput(e);
        
        this.initializeGameState();
        this.setupControls();
        this.startRenderLoop();
    }

    private createInitialGameState(): GameState {
        return {
            ball: {
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                radius: 10
            },
            paddle1: {
                x: 20,
                y: this.canvas.height / 2 - 50,
                width: 15,
                height: 100
            },
            paddle2: {
                x: this.canvas.width - 35,
                y: this.canvas.height / 2 - 50,
                width: 15,
                height: 100
            },
            score: { left: 0, right: 0 },
            statusMessage: 'Press Start to play'
        };
    }

    private initializeGameState(): void {
        this.gameState = this.createInitialGameState();
    }

    private setupControls(): void {
        document.addEventListener('keydown', this.handleInputBound);
    }

    private handleInput(event: KeyboardEvent): void {
        if (!this.gameRunning) return;

        // Player 1: W (up), S (down)
        if (event.key === 'w' || event.key === 'W') {
            this.movePaddle1('up');
        } else if (event.key === 's' || event.key === 'S') {
            this.movePaddle1('down');
        }
        
        // Player 2: ArrowUp (up), ArrowDown (down)
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.movePaddle2('up');
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.movePaddle2('down');
        }
    }

    private movePaddle1(direction: 'up' | 'down'): void {
        if (direction === 'up' && this.gameState.paddle1.y > 0) {
            this.gameState.paddle1.y -= this.PADDLE_SPEED;
        } else if (direction === 'down' && this.gameState.paddle1.y < this.canvas.height - this.gameState.paddle1.height) {
            this.gameState.paddle1.y += this.PADDLE_SPEED;
        }
    }

    private movePaddle2(direction: 'up' | 'down'): void {
        if (direction === 'up' && this.gameState.paddle2.y > 0) {
            this.gameState.paddle2.y -= this.PADDLE_SPEED;
        } else if (direction === 'down' && this.gameState.paddle2.y < this.canvas.height - this.gameState.paddle2.height) {
            this.gameState.paddle2.y += this.PADDLE_SPEED;
        }
    }

    public start(): void {
        this.gameRunning = true;
        this.resetBall();
        this.gameState.statusMessage = 'Game Started! Use W/S and Arrow Keys';
    }

    public pause(): void {
        this.gameRunning = false;
        this.gameState.statusMessage = 'Game Paused - Press Start to continue';
    }

    public reset(): void {
        this.gameRunning = false;
        this.initializeGameState();
    }

    private resetBall(): void {
        this.gameState.ball.x = this.canvas.width / 2;
        this.gameState.ball.y = this.canvas.height / 2;
        
        // Random direction
        const direction = Math.random() > 0.5 ? 1 : -1;
        this.gameState.ball = {
            ...this.gameState.ball,
            dx: direction * this.BALL_SPEED,
            dy: (Math.random() - 0.5) * this.BALL_SPEED
        } as any;
    }

    private updateGame(): void {
        if (!this.gameRunning) return;

        this.updateBall();
        this.checkCollisions();
        this.checkScore();
    }

    private updateBall(): void {
        const ball = this.gameState.ball as any;
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Ball collision with top and bottom walls
        if (ball.y <= ball.radius || ball.y >= this.canvas.height - ball.radius) {
            ball.dy = -ball.dy;
        }
    }

    private checkCollisions(): void {
        const ball = this.gameState.ball as any;
        const { paddle1, paddle2 } = this.gameState;

        // Paddle 1 collision
        if (ball.x - ball.radius <= paddle1.x + paddle1.width &&
            ball.y >= paddle1.y &&
            ball.y <= paddle1.y + paddle1.height &&
            ball.dx < 0) {
            ball.dx = -ball.dx;
        }

        // Paddle 2 collision
        if (ball.x + ball.radius >= paddle2.x &&
            ball.y >= paddle2.y &&
            ball.y <= paddle2.y + paddle2.height &&
            ball.dx > 0) {
            ball.dx = -ball.dx;
        }
    }

    private checkScore(): void {
        const ball = this.gameState.ball as any;

        // Ball went off left side - Player 2 scores
        if (ball.x < 0) {
            this.gameState.score.right++;
            this.resetBall();
            if (this.gameState.score.right >= this.WINNING_SCORE) {
                this.endGame('Player 2 Wins!');
            }
        }

        // Ball went off right side - Player 1 scores
        if (ball.x > this.canvas.width) {
            this.gameState.score.left++;
            this.resetBall();
            if (this.gameState.score.left >= this.WINNING_SCORE) {
                this.endGame('Player 1 Wins!');
            }
        }
    }

    private endGame(message: string): void {
        this.gameRunning = false;
        this.gameState.statusMessage = message + ' - Press Start for new game';
        this.gameState.score = { left: 0, right: 0 };
    }

    private startRenderLoop(): void {
        if (this.gameLoopRunning) return;
        this.gameLoopRunning = true;
        this.gameLoop();
    }

    private gameLoop(): void {
        this.updateGame();
        this.renderer.render(this.gameState);
        requestAnimationFrame(() => this.gameLoop());
    }

    public destroy(): void {
        this.gameLoopRunning = false;
        document.removeEventListener('keydown', this.handleInputBound);
    }
}