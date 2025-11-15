// InputHandler.ts
import { GameConfig } from "./GameConfig";
import { Paddle } from "./Paddle";

export class InputHandler {
    private leftPaddle: Paddle;
    private rightPaddle: Paddle;
    private paddleSpeed = GameConfig.paddle.speed;

    // ---- key-state tracking -------------------------------------------------
    private keys: { [key: string]: boolean } = {
        w: false,
        s: false,
        ArrowUp: false,
        ArrowDown: false,
    };

    constructor(leftPaddle: Paddle, rightPaddle: Paddle) {
        this.leftPaddle = leftPaddle;
        this.rightPaddle = rightPaddle;
        this.paddleSpeed = GameConfig.paddle.speed;

        this.registerKeyboardEvents();
    }

    /** Register keydown/keyup – we only need the state, not the move amount */
    private registerKeyboardEvents(): void {
        const onKeyDown = (ev: KeyboardEvent) => {
            switch (ev.key) {
                case "w":
                case "W":
                    this.keys.w = true;
                    break;
                case "s":
                case "S":
                    this.keys.s = true;
                    break;
                case "ArrowUp":
                    this.keys.ArrowUp = true;
                    ev.preventDefault();          // keep the page from scrolling
                    break;
                case "ArrowDown":
                    this.keys.ArrowDown = true;
                    ev.preventDefault();
                    break;
            }
        };

        const onKeyUp = (ev: KeyboardEvent) => {
            switch (ev.key) {
                case "w":
                case "W":
                    this.keys.w = false;
                    break;
                case "s":
                case "S":
                    this.keys.s = false;
                    break;
                case "ArrowUp":
                    this.keys.ArrowUp = false;
                    break;
                case "ArrowDown":
                    this.keys.ArrowDown = false;
                    break;
            }
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
    }

    /** Called **every frame** from PongGame with delta-time in seconds */
    public update(dt: number): void {
        // ----- left paddle ----------------------------------------------------
        let leftVel = 0;
        if (this.keys.w) leftVel = this.paddleSpeed;
        else if (this.keys.s) leftVel = -this.paddleSpeed;

        this.leftPaddle.velocity = leftVel;   // used by bounce physics
        this.leftPaddle.move(dt);             // applies velocity * dt

        // ----- right paddle ---------------------------------------------------
        let rightVel = 0;
        if (this.keys.ArrowUp) rightVel = this.paddleSpeed;
        else if (this.keys.ArrowDown) rightVel = -this.paddleSpeed;

        this.rightPaddle.velocity = rightVel;
        this.rightPaddle.move(dt);
    }

    // -------------------------------------------------------------------------
    // OPTIONAL: keep the old per-keydown behaviour for quick testing
    // (you can delete these two methods if you never need them)
    // -------------------------------------------------------------------------
    private handleLeftKey(dz: number): void {
        this.leftPaddle.move(dz);
    }

    private handleRightKey(dz: number): void {
        this.rightPaddle.move(dz);
    }

    // If you still want the old keydown to move the paddle instantly,
    // uncomment the lines in registerKeyboardEvents() below:
    // -------------------------------------------------------------------------
    // private registerKeyboardEvents(): void {
    //     window.addEventListener("keydown", (ev) => {
    //         switch (ev.key) {
    //             case "w": case "W": this.handleLeftKey(this.paddleSpeed); break;
    //             case "s": case "S": this.handleLeftKey(-this.paddleSpeed); break;
    //             case "ArrowUp":   ev.preventDefault(); this.handleRightKey(this.paddleSpeed); break;
    //             case "ArrowDown": ev.preventDefault(); this.handleRightKey(-this.paddleSpeed); break;
    //         }
    //     });
    // }
}