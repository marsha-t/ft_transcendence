// // InputHandler.ts
import { GameConfig } from "./GameConfig";
import { Paddle } from "./Paddle";

// export class InputHandler {
//     private leftPaddle: Paddle;
//     private rightPaddle: Paddle;
//     private paddleSpeed = GameConfig.paddle.speed;

//     // ---- key-state tracking -------------------------------------------------
//     private keys: { [key: string]: boolean } = {
//         w: false,
//         s: false,
//         ArrowUp: false,
//         ArrowDown: false,
//     };

//     constructor(leftPaddle: Paddle, rightPaddle: Paddle) {
//         this.leftPaddle = leftPaddle;
//         this.rightPaddle = rightPaddle;
//         this.paddleSpeed = GameConfig.paddle.speed;

//         this.registerKeyboardEvents();
//     }

//     /** Register keydown/keyup – we only need the state, not the move amount */
//     private registerKeyboardEvents(): void {
//         const onKeyDown = (ev: KeyboardEvent) => {
//             switch (ev.key) {
//                 case "w":
//                 case "W":
//                     this.keys.w = true;
//                     break;
//                 case "s":
//                 case "S":
//                     this.keys.s = true;
//                     break;
//                 case "ArrowUp":
//                     this.keys.ArrowUp = true;
//                     ev.preventDefault();          // keep the page from scrolling
//                     break;
//                 case "ArrowDown":
//                     this.keys.ArrowDown = true;
//                     ev.preventDefault();
//                     break;
//             }
//         };

//         const onKeyUp = (ev: KeyboardEvent) => {
//             switch (ev.key) {
//                 case "w":
//                 case "W":
//                     this.keys.w = false;
//                     break;
//                 case "s":
//                 case "S":
//                     this.keys.s = false;
//                     break;
//                 case "ArrowUp":
//                     this.keys.ArrowUp = false;
//                     break;
//                 case "ArrowDown":
//                     this.keys.ArrowDown = false;
//                     break;
//             }
//         };

//         window.addEventListener("keydown", onKeyDown);
//         window.addEventListener("keyup", onKeyUp);
//     }

//     /** Called **every frame** from PongGame with delta-time in seconds */
//     public update(dt: number): void {
//         // ----- left paddle ----------------------------------------------------
//         let leftVel = 0;
//         if (this.keys.w) leftVel = this.paddleSpeed;
//         else if (this.keys.s) leftVel = -this.paddleSpeed;

//         this.leftPaddle.velocity = leftVel;   // used by bounce physics
//         this.leftPaddle.move(dt);             // applies velocity * dt

//         // ----- right paddle ---------------------------------------------------
//         let rightVel = 0;
//         if (this.keys.ArrowUp) rightVel = this.paddleSpeed;
//         else if (this.keys.ArrowDown) rightVel = -this.paddleSpeed;

//         this.rightPaddle.velocity = rightVel;
//         this.rightPaddle.move(dt);
//     }

//     // -------------------------------------------------------------------------
//     // OPTIONAL: keep the old per-keydown behaviour for quick testing
//     // (you can delete these two methods if you never need them)
//     // -------------------------------------------------------------------------
//     private handleLeftKey(dz: number): void {
//         this.leftPaddle.move(dz);
//     }

//     private handleRightKey(dz: number): void {
//         this.rightPaddle.move(dz);
//     }

//     // If you still want the old keydown to move the paddle instantly,
//     // uncomment the lines in registerKeyboardEvents() below:
//     // -------------------------------------------------------------------------
//     // private registerKeyboardEvents(): void {
//     //     window.addEventListener("keydown", (ev) => {
//     //         switch (ev.key) {
//     //             case "w": case "W": this.handleLeftKey(this.paddleSpeed); break;
//     //             case "s": case "S": this.handleLeftKey(-this.paddleSpeed); break;
//     //             case "ArrowUp":   ev.preventDefault(); this.handleRightKey(this.paddleSpeed); break;
//     //             case "ArrowDown": ev.preventDefault(); this.handleRightKey(-this.paddleSpeed); break;
//     //         }
//     //     });
//     // }
// }


// Add these modifications to your existing InputHandler.ts

// Modifications for your existing InputHandler.ts
// Your Paddle class uses velocity, not moveUp/moveDown methods

export class InputHandler {
  private leftPaddle: Paddle;
  private rightPaddle: Paddle;
  private keysPressed: Set<string> = new Set();
  
  // ADD THESE TWO PROPERTIES:
  private aiControlledPaddle: Paddle | null = null;
  private currentAIMove: 'UP' | 'DOWN' | 'NONE' = 'NONE';

  constructor(leftPaddle: Paddle, rightPaddle: Paddle) {
    this.leftPaddle = leftPaddle;
    this.rightPaddle = rightPaddle;

    window.addEventListener("keydown", (e) => this.keysPressed.add(e.key));
    window.addEventListener("keyup", (e) => this.keysPressed.delete(e.key));
  }

  // ADD THIS METHOD:
  public setAIControlled(paddle: Paddle | null): void {
    this.aiControlledPaddle = paddle;
  }

  // ADD THIS METHOD:
  public setAIMove(move: 'UP' | 'DOWN' | 'NONE'): void {
    this.currentAIMove = move;
  }

  // MODIFY YOUR EXISTING update() METHOD:
  public update(dt: number): void {
    const speed = 5; // units per second

    // Reset velocities
    this.leftPaddle.velocity = 0;
    this.rightPaddle.velocity = 0;

    // Left paddle
    if (this.leftPaddle === this.aiControlledPaddle) {
      // AI controls left paddle
      if (this.currentAIMove === 'UP') {
        this.leftPaddle.velocity = -speed; // negative Z is UP
      } else if (this.currentAIMove === 'DOWN') {
        this.leftPaddle.velocity = speed;  // positive Z is DOWN
      }
    } else {
      // Human controls left paddle
      if (this.keysPressed.has("w") || this.keysPressed.has("W")) {
        this.leftPaddle.velocity = -speed;
      }
      if (this.keysPressed.has("s") || this.keysPressed.has("S")) {
        this.leftPaddle.velocity = speed;
      }
    }

    // Right paddle
    if (this.rightPaddle === this.aiControlledPaddle) {
      // AI controls right paddle
      if (this.currentAIMove === 'UP') {
        this.rightPaddle.velocity = -speed;
      } else if (this.currentAIMove === 'DOWN') {
        this.rightPaddle.velocity = speed;
      }
    } else {
      // Human controls right paddle
      if (this.keysPressed.has("ArrowUp")) {
        this.rightPaddle.velocity = -speed;
      }
      if (this.keysPressed.has("ArrowDown")) {
        this.rightPaddle.velocity = speed;
      }
    }

    // Apply movement (your Paddle.move() handles bounds checking)
    this.leftPaddle.move(dt);
    this.rightPaddle.move(dt);
  }

  // Rest of your existing InputHandler code...
}