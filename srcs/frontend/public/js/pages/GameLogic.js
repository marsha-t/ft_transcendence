export class GameLogic {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.context = context;
        this.handleInputBound = (e) => this.handleInput(e);
    }
    initGame() {
        if (!this.context)
            return;
        document.addEventListener('keydown', this.handleInputBound);
        this.gameLoop();
    }
    handleInput(event) {
        if (event.key === 'w') {
            this.movePaddle1('up');
        }
        else if (event.key === 's') {
            this.movePaddle1('down');
        }
        if (event.key === 'ArrowUp') {
            this.movePaddle2('up');
        }
        else if (event.key === 'ArrowDown') {
            this.movePaddle2('down');
        }
    }
    movePaddle1(direction) {
    }
    movePaddle2(direction) {
    }
    startGame() {
    }
    updateGame() {
    }
    renderGame() {
        if (!this.context || !this.canvas)
            return;
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    gameLoop() {
        this.updateGame();
        this.renderGame();
        requestAnimationFrame(() => this.gameLoop());
    }
    destroy() {
        document.removeEventListener('keydown', this.handleInputBound);
    }
}
