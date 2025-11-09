import { Paddle }  from "./Paddle";

export class InputHandler {
    private leftPaddle: Paddle;
    private rightPaddle: Paddle;
    private paddleSpeed = 0.55;

    constructor (leftPaddle: Paddle, rightPaddle: Paddle){
        this.leftPaddle = leftPaddle;
        this.rightPaddle = rightPaddle;

        this.registerKeyboardEvents();
    }

    private registerKeyboardEvents(): void {
        window.addEventListener("keydown", (ev) => {
            switch (ev.key) {
                case "w":
                case "W":
                    this.leftPaddle.move(this.paddleSpeed);
                    break;
                case "s":
                case "S":
                    this.leftPaddle.move(-this.paddleSpeed);
                    break;

                case "ArrowUp":
                    ev.preventDefault();
                    this.rightPaddle.move(this.paddleSpeed);
                    break;
                case "ArrowDown":
                    ev.preventDefault();
                    this.rightPaddle.move(-this.paddleSpeed);
                    break;
            }
        });
    }
}