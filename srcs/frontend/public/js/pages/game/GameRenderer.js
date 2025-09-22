export class GameRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('Could not get 2D context');
        this.context = ctx;
    }
    render(gameState) {
        this.clearCanvas();
        this.drawBackground();
        this.drawNet();
        this.drawPaddles(gameState);
        this.drawBall(gameState);
        this.drawScores(gameState);
        this.drawStatusMessage(gameState);
    }
    clearCanvas() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    drawBackground() {
        this.context.fillStyle = '#000';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    drawNet() {
        this.context.setLineDash([5, 15]);
        this.context.strokeStyle = '#fff';
        this.context.lineWidth = 2;
        this.context.beginPath();
        this.context.moveTo(this.canvas.width / 2, 0);
        this.context.lineTo(this.canvas.width / 2, this.canvas.height);
        this.context.stroke();
        this.context.setLineDash([]);
    }
    drawPaddles(gameState) {
        this.context.fillStyle = '#fff';
        this.context.fillRect(gameState.paddle1.x, gameState.paddle1.y, gameState.paddle1.width, gameState.paddle1.height);
        this.context.fillRect(gameState.paddle2.x, gameState.paddle2.y, gameState.paddle2.width, gameState.paddle2.height);
    }
    drawBall(gameState) {
        this.context.fillStyle = '#fff';
        this.context.beginPath();
        this.context.arc(gameState.ball.x, gameState.ball.y, gameState.ball.radius, 0, Math.PI * 2);
        this.context.fill();
    }
    drawScores(gameState) {
        this.context.font = '24px Arial';
        this.context.fillStyle = '#fff';
        this.context.textAlign = 'left';
        this.context.fillText(`Player 1: ${gameState.score.left}`, 50, 50);
        this.context.textAlign = 'right';
        this.context.fillText(`Player 2: ${gameState.score.right}`, this.canvas.width - 50, 50);
    }
    drawStatusMessage(gameState) {
        this.context.font = '18px Arial';
        this.context.textAlign = 'center';
        this.context.fillStyle = '#fff';
        this.context.fillText(gameState.statusMessage, this.canvas.width / 2, this.canvas.height - 50);
    }
}
