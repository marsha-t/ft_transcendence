import { GameRenderer } from './GameRenderer.js';
export class PongGame {
    constructor(canvas) {
        this.gameState = {};
        this.gameRunning = false;
        this.gameLoopRunning = false;
        this.PADDLE_SPEED = 15;
        this.BALL_SPEED = 4;
        this.WINNING_SCORE = 5;
        this.canvas = canvas;
        this.renderer = new GameRenderer(canvas);
        this.handleInputBound = (e) => this.handleInput(e);
        this.initializeGameState();
        this.setupControls();
        this.startRenderLoop();
    }
    createInitialGameState() {
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
    initializeGameState() {
        this.gameState = this.createInitialGameState();
    }
    setupControls() {
        document.addEventListener('keydown', this.handleInputBound);
    }
    handleInput(event) {
        if (!this.gameRunning)
            return;
        if (event.key === 'w' || event.key === 'W') {
            this.movePaddle1('up');
        }
        else if (event.key === 's' || event.key === 'S') {
            this.movePaddle1('down');
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.movePaddle2('up');
        }
        else if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.movePaddle2('down');
        }
    }
    movePaddle1(direction) {
        if (direction === 'up' && this.gameState.paddle1.y > 0) {
            this.gameState.paddle1.y -= this.PADDLE_SPEED;
        }
        else if (direction === 'down' && this.gameState.paddle1.y < this.canvas.height - this.gameState.paddle1.height) {
            this.gameState.paddle1.y += this.PADDLE_SPEED;
        }
    }
    movePaddle2(direction) {
        if (direction === 'up' && this.gameState.paddle2.y > 0) {
            this.gameState.paddle2.y -= this.PADDLE_SPEED;
        }
        else if (direction === 'down' && this.gameState.paddle2.y < this.canvas.height - this.gameState.paddle2.height) {
            this.gameState.paddle2.y += this.PADDLE_SPEED;
        }
    }
    start() {
        this.gameRunning = true;
        this.resetBall();
        this.gameState.statusMessage = 'Game Started! Use W/S and Arrow Keys';
    }
    pause() {
        this.gameRunning = false;
        this.gameState.statusMessage = 'Game Paused - Press Start to continue';
    }
    reset() {
        this.gameRunning = false;
        this.initializeGameState();
    }
    resetBall() {
        this.gameState.ball.x = this.canvas.width / 2;
        this.gameState.ball.y = this.canvas.height / 2;
        const direction = Math.random() > 0.5 ? 1 : -1;
        this.gameState.ball = {
            ...this.gameState.ball,
            dx: direction * this.BALL_SPEED,
            dy: (Math.random() - 0.5) * this.BALL_SPEED
        };
    }
    updateGame() {
        if (!this.gameRunning)
            return;
        this.updateBall();
        this.checkCollisions();
        this.checkScore();
    }
    updateBall() {
        const ball = this.gameState.ball;
        ball.x += ball.dx;
        ball.y += ball.dy;
        if (ball.y <= ball.radius || ball.y >= this.canvas.height - ball.radius) {
            ball.dy = -ball.dy;
        }
    }
    checkCollisions() {
        const ball = this.gameState.ball;
        const { paddle1, paddle2 } = this.gameState;
        if (ball.x - ball.radius <= paddle1.x + paddle1.width &&
            ball.y >= paddle1.y &&
            ball.y <= paddle1.y + paddle1.height &&
            ball.dx < 0) {
            ball.dx = -ball.dx;
        }
        if (ball.x + ball.radius >= paddle2.x &&
            ball.y >= paddle2.y &&
            ball.y <= paddle2.y + paddle2.height &&
            ball.dx > 0) {
            ball.dx = -ball.dx;
        }
    }
    checkScore() {
        const ball = this.gameState.ball;
        if (ball.x < 0) {
            this.gameState.score.right++;
            this.resetBall();
            if (this.gameState.score.right >= this.WINNING_SCORE) {
                this.endGame('Player 2 Wins!');
            }
        }
        if (ball.x > this.canvas.width) {
            this.gameState.score.left++;
            this.resetBall();
            if (this.gameState.score.left >= this.WINNING_SCORE) {
                this.endGame('Player 1 Wins!');
            }
        }
    }
    endGame(message) {
        this.gameRunning = false;
        this.gameState.statusMessage = message + ' - Press Start for new game';
        this.gameState.score = { left: 0, right: 0 };
    }
    startRenderLoop() {
        if (this.gameLoopRunning)
            return;
        this.gameLoopRunning = true;
        this.gameLoop();
    }
    gameLoop() {
        this.updateGame();
        this.renderer.render(this.gameState);
        requestAnimationFrame(() => this.gameLoop());
    }
    destroy() {
        this.gameLoopRunning = false;
        document.removeEventListener('keydown', this.handleInputBound);
    }
}
