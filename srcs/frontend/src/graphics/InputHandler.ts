import { Paddle } from "./Paddle";
import { gameConfigManager } from "./GameConfigManager";

/**
 * InputHandler - Keyboard input management for paddle control
 * 
 * Responsibilities:
 * - Registering keyboard event listeners on window
 * - Tracking key press state (W/S for left, Arrow Up/Down for right)
 * - Updating paddle velocities based on input
 * - Supporting AI control by simulating key presses
 * 
 * CRITICAL - CLEANUP REQUIRED:
 * - Attaches event listeners to window (global scope)
 * - Must remove listeners via dispose() to prevent memory leaks in SPA
 * - Each PongGame instance creates new InputHandler with new listeners
 * - Without cleanup, listeners accumulate on every game page visit
 * 
 * Lifecycle:
 * - Created by PongGame constructor
 * - Updated every physics step (120Hz)
 * - MUST be disposed when PongGame is disposed
 */
export class InputHandler {
    private leftPaddle: Paddle;
    private rightPaddle: Paddle;
    private paddleSpeed = gameConfigManager.current.paddle.speed;

    private keys: { [key: string]: boolean } = {
        w: false,
        s: false,
        ArrowUp: false,
        ArrowDown: false,
    };

    private onKeyDown: (ev: KeyboardEvent) => void;
    private onKeyUp: (ev: KeyboardEvent) => void;

    constructor(leftPaddle: Paddle, rightPaddle: Paddle) {
        this.leftPaddle = leftPaddle;
        this.rightPaddle = rightPaddle;
        this.paddleSpeed = gameConfigManager.current.paddle.speed;

        this.onKeyDown = this.handleKeyDown.bind(this);
        this.onKeyUp = this.handleKeyUp.bind(this);

        this.registerKeyboardEvents();
    }

    // ===========================
    // KEYBOARD EVENT REGISTRATION
    // ===========================
    private registerKeyboardEvents(): void {
        window.addEventListener("keydown", this.onKeyDown);
        window.addEventListener("keyup", this.onKeyUp);
    }

    private handleKeyDown(ev: KeyboardEvent): void {
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
                ev.preventDefault();
                break;
            case "ArrowDown":
                this.keys.ArrowDown = true;
                ev.preventDefault();
                break;
        }
    }

    private handleKeyUp(ev: KeyboardEvent): void {
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
    }

    // Update paddle velocities and positions based on current input state
    // Called every physics step (120Hz) by PongGame render loop
    public update(dt: number): void {
        let leftVel = 0;
        if (this.keys.w) leftVel = this.paddleSpeed;
        else if (this.keys.s) leftVel = -this.paddleSpeed;

        this.leftPaddle.velocity = leftVel;   // used by bounce physics
        this.leftPaddle.move(dt);             // applies velocity * dt

        let rightVel = 0;
        if (this.keys.ArrowUp) rightVel = this.paddleSpeed;
        else if (this.keys.ArrowDown) rightVel = -this.paddleSpeed;

        this.rightPaddle.velocity = rightVel;
        this.rightPaddle.move(dt);
    }

    public applyAIDirection(direction: "UP" | "DOWN" | "NONE") {
        // Reset both keys first
        this.keys.w = false;
        this.keys.s = false;

        if (direction === "UP") {
            this.keys.w = true;
        } else if (direction === "DOWN") {
            this.keys.s = true;
        }
    }

    //Remove keyboard event listeners from window
    public disposeInputHandler(): void {
        window.removeEventListener("keydown", this.onKeyDown);
        window.removeEventListener("keyup", this.onKeyUp);

        this.keys.w = false;
        this.keys.s = false;
        this.keys.ArrowDown = false;
        this.keys.ArrowUp = false;
    }
}