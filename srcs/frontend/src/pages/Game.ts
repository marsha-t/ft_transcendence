import { IComponent } from "../components/IComponent.js";
import { GameService } from "../services/game/GameService.js";
import { GameSession, PlayerSide, GameOptions } from "../services/game/types.js";
import { apiServices } from "../services/ApiServices.js";
import { GameResults } from "./GameResults.js";
import { PongGame } from "../graphics/PongGame.js";

export class Game implements IComponent {
    private container!: HTMLElement;
    private canvas: HTMLCanvasElement;
    private pongGame!: PongGame;
    
    private gameService: GameService;
    private currentSession: GameSession | null = null;
    private opts?: GameOptions;
    private cleanupWarning?: () => void;
    private isScoring: boolean = false;
    private isGameRunning: boolean = false;

    constructor(opts?: GameOptions) {
        this.opts = opts;
        this.canvas = document.createElement("canvas");
        this.canvas.width = 900;
        this.canvas.height = 600;
        this.gameService = new GameService();
    }

    public render(): HTMLElement {
        this.container = document.createElement('div');
        this.container.className = "flex flex-col items-center min-h-[80vh] p-20 bg-background rounded-[30px] ";

        this.createTitleContainer();
        this.createCanvas();
        this.createControlsContainer();
        
        // Initialize
        if (this.opts?.isTournament && this.opts.sessionId) {
            this.initializeTournament();
        } else {
            this.initializeStandalone();
        }
        
        return this.container;
    }

    private createTitleContainer(): void {
        const titleContainer = document.createElement("div");
        // titleContainer.className = "title_container";
        titleContainer.className = "flex flex-row items-center justify-between w-[800px]";

        const userLeft = document.createElement("h2");
        userLeft.textContent = this.opts?.displayNames?.leftName ?? "User 1";
        userLeft.className = "user";
        userLeft.id = "left-player";

        const VS = document.createElement("h1");
        VS.textContent = "VS";
        VS.className = "VS";

        const userRight = document.createElement("h2");
        userRight.textContent = this.opts?.displayNames?.rightName ?? "User 2";
        userRight.className = "user";
        userRight.id = "right-player";

        titleContainer.appendChild(userLeft);
        titleContainer.appendChild(VS);
        titleContainer.appendChild(userRight);
        this.container.appendChild(titleContainer);
    }

    private createCanvas(): void {
        const canvasContainer = document.createElement('div');
        // canvasContainer.className = "canvas_container";
        this.canvas.className = "border-2 border-[var(--color-secondary)] max-w-full h-auto rounded-[30px] max-[800px]:w-full max-[800px]:aspect-[8/5]";

        // this.canvas.className = "border-2 border-[var(--color-secondary)] max-w-full h-auto rounded-[30px]";
        canvasContainer.appendChild(this.canvas);

        this.container.appendChild(canvasContainer);
        
        // Initialize 3D game with scoring callback
        this.pongGame = new PongGame(this.canvas, (side: 'LEFT' | 'RIGHT') => {
            if (!this.isScoring) {
                this.isScoring = true;
                this.scorePoint(side).then(() => {
                    setTimeout(() => this.isScoring = false, 1000);
                });
            }
        });
    }

    private createControlsContainer(): void {
        const controlsContainer = document.createElement("div");
        controlsContainer.className = "controls_container";

        const startBtn = this.makeButton("Start Game", "start-btn", () => this.toggleGame());
        const pauseBtn = this.makeButton("Pause", "pause-btn", () => this.pauseGame());
        const quitBtn = this.makeButton("Quit Game", "quit-btn", () => this.quitGame());

        if (this.opts?.isTournament) {
            startBtn.style.display = "block";
            controlsContainer.appendChild(startBtn);
            controlsContainer.appendChild(pauseBtn);
        } else {
            controlsContainer.appendChild(startBtn);
            controlsContainer.appendChild(pauseBtn);
            controlsContainer.appendChild(quitBtn);

            // Add guest player setup
            const setupSection = document.createElement("div");
            setupSection.className = "setup_section";
            setupSection.id = "setup-section";

            const guestInput = document.createElement("input");
            guestInput.type = "text";
            guestInput.placeholder = "Enter guest name";
            guestInput.className = "guest_input";
            guestInput.id = "guest-input";

            const addGuestBtn = this.makeButton("Add Guest Player", "add-guest-btn", () => this.addGuestPlayer());
            addGuestBtn.style.display = "block";

            setupSection.appendChild(guestInput);
            setupSection.appendChild(addGuestBtn);
            controlsContainer.prepend(setupSection);
        }

        this.container.appendChild(controlsContainer);
    }

    // For all buttons - update makeButton method
    private makeButton(label: string, id: string, handler: () => void): HTMLButtonElement {
        const btn = document.createElement("button");
        btn.textContent = label;
        btn.id = id;
        btn.className = "px-6 py-3 rounded-[50px] bg-[var(--color-secondary)] text-white text-base border-none cursor-pointer transition-colors duration-300 ease-in-out hover:bg-[var(--color-secondary-hover)] mt-5";
        btn.style.display = "none";
        btn.addEventListener("click", handler);
        return btn;
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    
    private async initializeStandalone(): Promise<void> {
        try {
            const userId = 1; // TODO: Replace with actual user ID from backend
            this.currentSession = await this.gameService.createGameSession(userId, "RIGHT");

            console.log(`Current Session:`, this.currentSession);

            // Show user on the right
            const rightPlayerElement = document.getElementById("right-player");
            if (rightPlayerElement && this.currentSession?.players[0]) {
                rightPlayerElement.textContent = this.currentSession.players[0].displayName;
            }
        } catch (error) {
            console.error("Failed to initialize game:", error);
            alert("Failed to initialize game");
        }
    }

    private async initializeTournament(): Promise<void> {
        const left = this.opts?.displayNames?.leftName ?? "Player 1";
        const right = this.opts?.displayNames?.rightName ?? "Player 2";

        this.currentSession = {
            sessionId: this.opts!.sessionId!,
            status: "PLAYING",
            players: [
                { side: "LEFT", displayName: left, score: 0 },
                { side: "RIGHT", displayName: right, score: 0 },
            ],
        } as GameSession;
    }

    private async addGuestPlayer(): Promise<void> {
        const guestInput = document.getElementById("guest-input") as HTMLInputElement;
        const guestName = guestInput.value.trim();

        if (!guestName) {
            alert("Please enter a guest name");
            return;
        }
        if (!this.currentSession) {
            alert("Game session not initialized");
            return;
        }

        try {
            await this.gameService.addGuestPlayer(
                this.currentSession.sessionId,
                guestName,
                null,
                "LEFT"
            );

            // Update UI
            const leftPlayerElement = document.getElementById("left-player");
            if (leftPlayerElement) {
                leftPlayerElement.textContent = guestName;
            }

            // Hide setup, show game controls
            const setupSection = document.getElementById("setup-section");
            const startBtn = document.getElementById("start-btn");
            const quitBtn = document.getElementById("quit-btn");

            if (setupSection) setupSection.style.display = "none";
            if (startBtn) startBtn.style.display = "block";
            if (quitBtn) quitBtn.style.display = "block";

            guestInput.value = "";
        } catch (error: any) {
            console.error("Error adding guest player:", error);
            if (error.status === 409) {
                alert(error.message);
            } else {
                alert("Error adding guest player");
            }
        }
    }

    // ============================================
    // GAME LOOP CONTROLS
    // ============================================

    private startGameLoop(): void {
        this.isGameRunning = true;
        // The Babylon engine is already running in PongGame
        // We just need to track the state
    }

    private stopGameLoop(): void {
        this.isGameRunning = false;
        // Babylon engine keeps running but we stop processing scores
    }

    private async toggleGame(): Promise<void> {
        if (!this.currentSession) {
            alert("Game session not initialized");
            return;
        }

        try {
            if (!this.isGameRunning) {
                await this.gameService.startGame(this.currentSession.sessionId);
                this.startGameLoop();
                this.updateGameButtons(true);
            }
        } catch (error) {
            console.error("Failed to start game:", error);
            alert("Failed to start game. Please try again.");
        }
    }

    private async pauseGame(): Promise<void> {
        if (!this.currentSession) return;

        try {
            if (this.isGameRunning) {
                await this.gameService.pauseGame(this.currentSession.sessionId);
                this.stopGameLoop();
                this.updateGameButtons(false);
            } else {
                await this.gameService.startGame(this.currentSession.sessionId);
                this.startGameLoop();
                this.updateGameButtons(true);
            }
        } catch (error) {
            console.error("Failed to pause/resume game:", error);
        }
    }

    private async quitGame(): Promise<void> {
        if (!this.currentSession) return;

        const confirmed = confirm("Are you sure you want to quit the game?");
        if (!confirmed) return;

        try {
            await this.gameService.abortGame(this.currentSession.sessionId);
            this.stopGameLoop();
            this.resetGame();
        } catch (error) {
            console.error("Failed to quit game:", error);
        }
    }

    private updateGameButtons(isPlaying: boolean): void {
        const startBtn = document.getElementById("start-btn") as HTMLButtonElement;
        const pauseBtn = document.getElementById("pause-btn") as HTMLButtonElement;
        const quitBtn = document.getElementById("quit-btn") as HTMLButtonElement;

        if (isPlaying) {
            if (startBtn) startBtn.style.display = "none";
            if (pauseBtn) {
                pauseBtn.style.display = "block";
                pauseBtn.textContent = "Pause";
            }
            if (quitBtn) quitBtn.style.display = "block";
        } else {
            if (startBtn) startBtn.style.display = "none";
            if (pauseBtn) {
                pauseBtn.style.display = "block";
                pauseBtn.textContent = "Resume";
            }
            if (quitBtn) quitBtn.style.display = "block";
        }
    }

    // ============================================
    // SCORING & GAME END
    // ============================================

    private async scorePoint(scoringSide: PlayerSide): Promise<void> {
        if (!this.isGameRunning) return; // Don't score if game not running

        try {
            if (this.currentSession) {
                this.currentSession = await this.gameService.updatePlayerScore(
                    this.currentSession.sessionId,
                    scoringSide
                );
                
                this.updateScoreDisplay();
                
                if (this.currentSession.status === "FINISHED") {
                    setTimeout(() => this.endGame(), 500);
                } else if (this.currentSession.status === "ABORTED") {
                    this.stopGameLoop();
                }
            }
        } catch (error) {
            console.error("Failed to update score:", error);
        }
    }

    private updateScoreDisplay(): void {
        const leftPlayer = this.currentSession?.players.find(p => p.side === "LEFT");
        const rightPlayer = this.currentSession?.players.find(p => p.side === "RIGHT");
        
        const leftScore = leftPlayer?.score ?? 0;
        const rightScore = rightPlayer?.score ?? 0;
        
        console.log(`Score - Left: ${leftScore}, Right: ${rightScore}`);
        
        // TODO: Create score display elements on screen
        // You can add score overlays above the canvas here
    }

    private async endGame(): Promise<void> {
        try {
            if (this.currentSession) {
                this.stopGameLoop();
                
                const winnerName = this.currentSession.winnerName ?? "Unknown";
                alert(`Game Over! ${winnerName} wins!`);

                this.container.innerHTML = "";

                const results = new GameResults({
                    sessionId: this.currentSession.sessionId,
                    isTournament: this.opts?.isTournament,
                    onMatchEnd: this.opts?.onMatchEnd,
                });

                const resultsElement = results.render();
                this.container.appendChild(resultsElement);
            }
        } catch (error) {
            console.error("Failed to finish game:", error);
        }
    }

    private resetGame(): void {
        // Reset session
        this.currentSession = null;
        
        // Reset UI
        const setupSection = document.getElementById("setup-section");
        const startBtn = document.getElementById("start-btn");
        const pauseBtn = document.getElementById("pause-btn");
        const quitBtn = document.getElementById("quit-btn");

        if (setupSection) setupSection.style.display = "block";
        if (startBtn) startBtn.style.display = "none";
        if (pauseBtn) pauseBtn.style.display = "none";
        if (quitBtn) quitBtn.style.display = "none";

        // Reset player names
        const leftPlayerElement = document.getElementById("left-player");
        const rightPlayerElement = document.getElementById("right-player");
        if (leftPlayerElement) leftPlayerElement.textContent = "Player 1";
        if (rightPlayerElement) rightPlayerElement.textContent = "Player 2";

        // Reinitialize
        this.initializeStandalone();
    }

    // ============================================
    // CLEANUP
    // ============================================

    public async canDeactivate(): Promise<boolean> {
        const confirmLeave = confirm("Leaving will stop the current match.");
        if (confirmLeave) {
            const sessionId = this.currentSession?.sessionId || this.opts?.sessionId;
            if (sessionId) {
                try {
                    await apiServices.game.updateGameStatus(sessionId, "ABORTED");
                } catch (err) {
                    console.error("Error aborting game:", err);
                }
            }
            this.stopGameLoop();
        }
        return confirmLeave;
    }

    public terminate(): void {
        this.stopGameLoop();
        if (this.cleanupWarning) {
            this.cleanupWarning();
            this.cleanupWarning = undefined;
        }
    }
}

// export class Game implements IComponent {
//     private container!: HTMLElement;
//     private canvas: HTMLCanvasElement;

//     private currentSession: GameSession | null = null;
//     private opts?: GameOptions;
//     private gameService: GameService | undefined;


//     constructor (){
//       this.canvas = document.createElement("canvas");
//       this.canvas.width = 900;
//       this.canvas.height = 600;
//     }

//     public render():HTMLElement {
//       this.container = document.createElement('div');
//       this.container.className = "flex flex-col min-h-screen bg-gray-100 p-6";

//       this.createCanvas();
//       return this.container;
//   }


  // private createCanvas():void {
  //   const canvasContainer = document.createElement('div');
  //   canvasContainer.className = "flex justify-center items-center w-full p-4";

  //   this.canvas.className = "rounded-lg shadow-2xl";
  //   canvasContainer.appendChild(this.canvas);

  //   this.container.appendChild(canvasContainer);
  //   new PongGame(this.canvas);
  // }


// }


// type GameOptions = {
//   sessionId?: string;
//   isTournament?: boolean;
//   displayNames?: { leftName: string; rightName: string };
//   onMatchEnd?: () => void;
// };

// export class Game implements IComponent {
//   private container!: HTMLElement;
//   private canvas: HTMLCanvasElement;
//   private context: CanvasRenderingContext2D;
//   private gameService: GameService;
//   private currentSession: GameSession | null = null;
//   private opts?: GameOptions;
//   private cleanupWarning?: () => void;

//   private isGameRunning: boolean = false;
//   private isScoring: boolean = false;
//   private animationId: number | null = null;

//   private ball = { x: 450, y: 300, dx: 5, dy: 3, radius: 12 };
//   private leftPaddle = { x: 20, y: 250, width: 10, height: 100, speed: 6 };
//   private rightPaddle = { x: 870, y: 250, width: 10, height: 100, speed: 6 };
//   private key: { [key: string]: boolean } = {};

//   constructor(opts?: GameOptions) {
//     this.opts = opts;
//     this.canvas = document.createElement("canvas");
//     this.canvas.width = 900;
//     this.canvas.height = 600;

//     const ctx = this.canvas.getContext("2d");
//     if (!ctx) throw new Error("Failed to get canvas context");
//     this.context = ctx;

//     this.gameService = new GameService();

//     this.setupKeyboardControls();
//   }

//   public render(): HTMLElement {
//     this.container = document.createElement("div");
//     this.container.className = "game_page";

//     //Load css
//     this.loadPageStyles();

//     //Title container
//     const titleContainer = document.createElement("div");
//     titleContainer.className = "title_container";

//     const userLeft = document.createElement("h2");
//     userLeft.textContent = this.opts?.displayNames?.leftName ?? "User 1";
//     userLeft.className = "user";
//     userLeft.id = "left-player";

//     const VS = document.createElement("h1");
//     VS.textContent = "VS";
//     VS.className = "VS";

//     const userRight = document.createElement("h2");
//     userRight.textContent = this.opts?.displayNames?.rightName ?? "User 2";
//     userRight.className = "user";
//     userRight.id = "right-player";

//     titleContainer.appendChild(userLeft);
//     titleContainer.appendChild(VS);
//     titleContainer.appendChild(userRight);
//     this.container.appendChild(titleContainer);

//     // Canvas container
//     this.canvas.className = "game_canvas";
//     const canvasContainer = document.createElement("div");
//     canvasContainer.className = "canvas_container";
//     canvasContainer.appendChild(this.canvas);
//     this.container.appendChild(canvasContainer);

//     // Controls container
//     const controlsContainer = document.createElement("div");
//     controlsContainer.className = "controls_container";

//     const startBtn = this.makeButton("Start Game", "start-btn", () =>
//       this.toggleGame()
//     );
//     const pauseBtn = this.makeButton("Pause", "pause-btn", () =>
//       this.pauseGame()
//     );
//     const quitBtn = this.makeButton("Quit Game", "quit-btn", () =>
//       this.quitGame()
//     );

//     // --- Tournament ---
//     if (this.opts?.isTournament) {
//       startBtn.style.display = "block";
//       controlsContainer.appendChild(startBtn);
//       controlsContainer.appendChild(pauseBtn);
//     }
//     // --- Standalone ---
//     else {
//       controlsContainer.appendChild(startBtn);
//       controlsContainer.appendChild(pauseBtn);
//       controlsContainer.appendChild(quitBtn);

//       // Player setup section
//       const setupSection = document.createElement("div");
//       setupSection.className = "setup_section";
//       setupSection.id = "setup-section";

//       const guestInput = document.createElement("input");
//       guestInput.type = "text";
//       guestInput.placeholder = "Enter guest name";
//       guestInput.className = "guest_input";
//       guestInput.id = "guest-input";

//       const addGuestBtn = this.makeButton(
//         "Add Guest Player",
//         "add-guest-btn",
//         () => this.addGuestPlayer()
//       );
//       addGuestBtn.style.display = "block";

//       setupSection.appendChild(guestInput);
//       setupSection.appendChild(addGuestBtn);
//       controlsContainer.prepend(setupSection);
//     }

//     this.container.appendChild(controlsContainer);

//     this.drawInitialScreen();

//     // Initialise logic
//     if (this.opts?.isTournament && this.opts.sessionId) {
//       this.initializeTournament();
//     } else {
//       this.initializeStandalone();
//     }
//     return this.container;
//   }

//   // -------------------------------------------------
//   // SETUP HELPERS
//   // - sets up UI scaffolding, drawing primitives
//   // - don't depend on backend session or game logic
//   // -------------------------------------------------
//   private loadPageStyles(): void {
//     if (document.getElementById("game-styles")) return;

//     const link = document.createElement("link");
//     link.id = "game-styles";
//     link.rel = "stylesheet";
//     link.href = "/styles/Game.css";
//     document.head.appendChild(link);
//   }

//   private setupKeyboardControls(): void {
//     document.addEventListener("keydown", (event) => {
//       this.key[event.key.toLowerCase()] = true;
//       this.key[event.key] = true;
//     });

//     document.addEventListener("keyup", (event) => {
//       this.key[event.key.toLowerCase()] = false;
//       this.key[event.key] = false;
//     });
//   }

//   private makeButton(
//     label: string,
//     id: string,
//     handler: () => void
//   ): HTMLButtonElement {
//     const btn = document.createElement("button");
//     btn.textContent = label;
//     btn.id = id;
//     btn.className = id.replace("-", "_");
//     btn.style.display = "none";
//     btn.addEventListener("click", handler);
//     return btn;
//   }

//   private drawInitialScreen() {
//     if (!this.context) return;

//     //background
//     this.context.fillStyle = "#F2F1FA";
//     this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

//     //ball
//     this.context.fillStyle = "#423f6a";
//     this.context.beginPath();
//     this.context.arc(
//       this.canvas.width / 2,
//       this.canvas.height / 2,
//       12,
//       0,
//       Math.PI * 2
//     );
//     this.context.fill();

//     /// Left paddle
//     this.drawRoundedRect(
//       20,
//       this.canvas.height / 2 - 40,
//       10,
//       100,
//       5,
//       "#423f6a"
//     );

//     // Right paddle
//     this.drawRoundedRect(
//       this.canvas.width - 30,
//       this.canvas.height / 2 - 40,
//       10,
//       100,
//       5,
//       "#423f6a"
//     );

//     //divider
//     this.context.beginPath();
//     this.context.setLineDash([10, 15]);
//     this.context.strokeStyle = "#423f6a";
//     this.context.lineWidth = 4;
//     this.context.moveTo(this.canvas.width / 2, 0);
//     this.context.lineTo(this.canvas.width / 2, this.canvas.height);
//     this.context.stroke();
//     this.context.setLineDash([]); // reset dashes
//   }

//   private drawRoundedRect(
//     x: number,
//     y: number,
//     width: number,
//     height: number,
//     radius: number,
//     fillColor: string
//     // strokeColor?: string
//   ) {
//     if (!this.context) return;
//     const ctx = this.context;

//     ctx.beginPath();
//     ctx.moveTo(x + radius, y);
//     ctx.lineTo(x + width - radius, y);
//     ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
//     ctx.lineTo(x + width, y + height - radius);
//     ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
//     ctx.lineTo(x + radius, y + height);
//     ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
//     ctx.lineTo(x, y + radius);
//     ctx.quadraticCurveTo(x, y, x + radius, y);
//     ctx.closePath();

//     ctx.fillStyle = fillColor;
//     ctx.fill();
//   }

//   // -------------------------------------------------
//   // INITIALISATION
//   // - prepare game session before gameplay begins
//   // - configures UI according to whether standalone or tournament game
//   // -------------------------------------------------
//   private async initializeStandalone(): Promise<void> {
//     try {
//       const userId = 1; // TODO For test case only, later i need to replace with actual id from backend;
//       this.currentSession = await this.gameService.createGameSession(
//         userId,
//         "RIGHT"
//       );

//       console.log(`Current Session: ${this.currentSession}`);

//       //show the user one the right
//       const rightPlayerElement = document.getElementById("right-player");
//       if (rightPlayerElement && this.currentSession?.players[0])
//         rightPlayerElement.textContent =
//           this.currentSession?.players[0].displayName;
//     } catch (error) {
//       console.error("Failed to initialize game:", error);
//       alert("Failed to initialize game from: initializeStandalone()");
//     }
//   }

//   private async initializeTournament() {
//     const left = this.opts?.displayNames?.leftName ?? "User 1c";
//     const right = this.opts?.displayNames?.rightName ?? "User 2d";

//     this.currentSession = {
//       sessionId: this.opts!.sessionId!,
//       status: "PLAYING",
//       players: [
//         { side: "LEFT", displayName: left, score: 0 },
//         { side: "RIGHT", displayName: right, score: 0 },
//       ],
//     } as GameSession;
//   }

//   private async addGuestPlayer(): Promise<void> {
//     const guestInput = document.getElementById(
//       "guest-input"
//     ) as HTMLInputElement;
//     const guestName = guestInput.value.trim();

//     if (!guestName) {
//       alert("Please, enter a guest name");
//       return;
//     }
//     if (!this.currentSession) {
//       alert("Game session not initialized");
//       return;
//     }
//     try {
//       await this.gameService.addGuestPlayer(
//         this.currentSession.sessionId,
//         guestName,
//         null,
//         "LEFT"
//       );

//       //ui
//       const leftPlayerElement = document.getElementById("left-player");
//       if (leftPlayerElement) {
//         leftPlayerElement.textContent = guestName;
//       }

//       //hide setup
//       const setupSection = document.getElementById("setup-section");
//       const startBtn = document.getElementById("start-btn");
//       const quitBtn = document.getElementById("quit-btn");

//       if (setupSection) setupSection.style.display = "none";
//       if (startBtn) startBtn.style.display = "block";
//       if (quitBtn) quitBtn.style.display = "block";

//       guestInput.value = "";
//     } catch (error: any) {
//       console.log("Error adding guest player", error);
//       if (error.status === 409) {
//         // Custom handling for duplicate display name
//         alert(error.message);
//       } else {
//         alert("Error adding guest player");
//       }
//     }
//   }

//   // -------------------------------------------------
//   // GAME LOOP + CONTROLS
//   // - controls how game runs frame-by-frame
//   // - manages runtime flow
//   // -------------------------------------------------
//   private startGameLoop(): void {
//     this.isGameRunning = true;
//     this.gameLoop();
//   }

//   private stopGameLoop(): void {
//     this.isGameRunning = false;
//     if (this.animationId) {
//       cancelAnimationFrame(this.animationId);
//       this.animationId = null;
//     }
//   }

//   private async gameLoop(): Promise<void> {
//     if (!this.isGameRunning) return;
//     await this.updateGame();
//     this.drawGame();

//     this.animationId = requestAnimationFrame(() => this.gameLoop());
//   }

  // private async toggleGame(): Promise<void> {
  //   if (!this.currentSession) {
  //     alert("Game session not initialized, toggleGame()");
  //     return;
  //   }

  //   try {
  //     if (!this.isGameRunning) {
  //       // Start the game
  //       await this.gameService.startGame(this.currentSession.sessionId);
  //       this.startGameLoop();
  //       this.updateGameButtons(true);
  //     }
  //   } catch (error) {
  //     console.error("Failed to start game:", error);
  //     alert("Failed to start game. Please try again.");
  //   }
  // }

  // private async pauseGame(): Promise<void> {
  //   if (!this.currentSession) return;

  //   try {
  //     if (this.isGameRunning) {
  //       await this.gameService.pauseGame(this.currentSession.sessionId);
  //       this.stopGameLoop();
  //       this.updateGameButtons(false);
  //     } else {
  //       await this.gameService.startGame(this.currentSession.sessionId);
  //       this.startGameLoop();
  //       this.updateGameButtons(true);
  //     }
  //   } catch (error) {
  //     console.log("failed to pause/resume the game");
  //   }
  // }

//   private async quitGame(): Promise<void> {
//     if (!this.currentSession) return;

//     const confirmed = confirm("Are you sure you want to quit the game?");

//     if (!confirmed) return;
//     try {
//       await this.gameService.abortGame(this.currentSession.sessionId);
//       this.stopGameLoop();
//       this.resetGame();
//     } catch (error) {
//       console.error("Failed to quit game:", error);
//     }
//   }

//   private resetGame(): void {
//     this.ball.x = this.canvas.width / 2;
//     this.ball.y = this.canvas.height / 2;
//     this.ball.dx = 5;
//     this.ball.dy = 3;

//     this.drawInitialScreen();

//     // Reset UI
//     const setupSection = document.getElementById("setup-section");
//     const startBtn = document.getElementById("start-btn");
//     const pauseBtn = document.getElementById("pause-btn");
//     const quitBtn = document.getElementById("quit-btn");

//     if (setupSection) setupSection.style.display = "block";
//     if (startBtn) startBtn.style.display = "none";
//     if (pauseBtn) pauseBtn.style.display = "none";
//     if (quitBtn) quitBtn.style.display = "none";

//     // Reset player names
//     const leftPlayerElement = document.getElementById("left-player");
//     const rightPlayerElement = document.getElementById("right-player");
//     if (leftPlayerElement) leftPlayerElement.textContent = "Player 1";
//     if (rightPlayerElement) rightPlayerElement.textContent = "Player 2";

//     // Reset session
//     this.currentSession = null;
//     this.initializeStandalone();
//   }

//   private updateGameButtons(isPlaying: boolean): void {
//     const startBtn = document.getElementById("start-btn") as HTMLButtonElement;
//     const pauseBtn = document.getElementById("pause-btn") as HTMLButtonElement;
//     const quitBtn = document.getElementById("quit-btn") as HTMLButtonElement;

//     if (isPlaying) {
//       startBtn.style.display = "none";
//       pauseBtn.style.display = "block";
//       if (quitBtn) quitBtn.style.display = "block";
//       pauseBtn.textContent = "Pause";
//     } else {
//       startBtn.style.display = "none";
//       pauseBtn.style.display = "block";
//       if (quitBtn) quitBtn.style.display = "block";
//       pauseBtn.textContent = "Resume";
//     }
//   }

//   // -------------------------------------------------
//   // GAME STATE UPDATES
//   // - defines what happens each frame in gameplay
//   // - handles physics, scoring, drawing and determining winners
//   // -------------------------------------------------
//   private updatePaddleMovement(): void {
//     if (this.key["w"] && this.leftPaddle.y > 0) {
//       this.leftPaddle.y -= this.leftPaddle.speed;
//     }
//     if (
//       this.key["s"] &&
//       this.leftPaddle.y < this.canvas.height - this.leftPaddle.height
//     ) {
//       this.leftPaddle.y += this.leftPaddle.speed;
//     }

//     // Right paddle controls (Arrow keys)
//     if (this.key["ArrowUp"] && this.rightPaddle.y > 0) {
//       this.rightPaddle.y -= this.rightPaddle.speed;
//     }
//     if (
//       this.key["ArrowDown"] &&
//       this.rightPaddle.y < this.canvas.height - this.rightPaddle.height
//     ) {
//       this.rightPaddle.y += this.rightPaddle.speed;
//     }

//     // Keep paddles within bounds
//     this.leftPaddle.y = Math.max(
//       0,
//       Math.min(this.leftPaddle.y, this.canvas.height - this.leftPaddle.height)
//     );
//     this.rightPaddle.y = Math.max(
//       0,
//       Math.min(this.rightPaddle.y, this.canvas.height - this.rightPaddle.height)
//     );
//   }

//   private drawGame(): void {
//     // Clear canvas
//     this.context.fillStyle = "#F2F1FA";
//     this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

//     //  ball
//     this.context.fillStyle = "#423f6a";
//     this.context.beginPath();
//     this.context.arc(
//       this.ball.x,
//       this.ball.y,
//       this.ball.radius,
//       0,
//       Math.PI * 2
//     );
//     this.context.fill();

//     //  paddles
//     this.drawRoundedRect(
//       this.leftPaddle.x,
//       this.leftPaddle.y,
//       this.leftPaddle.width,
//       this.leftPaddle.height,
//       5,
//       "#423f6a"
//     );
//     this.drawRoundedRect(
//       this.rightPaddle.x,
//       this.rightPaddle.y,
//       this.rightPaddle.width,
//       this.rightPaddle.height,
//       5,
//       "#423f6a"
//     );

//     //  divider
//     this.context.beginPath();
//     this.context.setLineDash([10, 15]);
//     this.context.strokeStyle = "#423f6a";
//     this.context.lineWidth = 4;
//     this.context.moveTo(this.canvas.width / 2, 0);
//     this.context.lineTo(this.canvas.width / 2, this.canvas.height);
//     this.context.stroke();
//     this.context.setLineDash([]);

//     // Draw scores
//     this.drawScores();
//   }

//   private drawScores(): void {
//     if (!this.currentSession) return;

//     this.context.fillStyle = "#423f6a";
//     this.context.font = "48px Arial";
//     this.context.textAlign = "center";

//     const leftPlayer = this.currentSession.players.find(
//       (p) => p.side === "LEFT"
//     );
//     const rightPlayer = this.currentSession.players.find(
//       (p) => p.side === "RIGHT"
//     );

//     const rightScore = rightPlayer ? rightPlayer.score : 0;
//     const leftScore = leftPlayer ? leftPlayer.score : 0;

//     this.context.fillText(leftScore.toString(), this.canvas.width / 4, 80);
//     this.context.fillText(
//       rightScore.toString(),
//       (3 * this.canvas.width) / 4,
//       80
//     );
//   }

//   private async updateGame(): Promise<void> {
//     this.updatePaddleMovement();

//     this.ball.x += this.ball.dx;
//     this.ball.y += this.ball.dy;

//     // Ball collision with top and bottom walls
//     if (
//       this.ball.y <= this.ball.radius ||
//       this.ball.y >= this.canvas.height - this.ball.radius
//     ) {
//       this.ball.dy = -this.ball.dy;
//     }

//     // Ball collision with paddles
//     if (
//       this.ball.x <=
//         this.leftPaddle.x + this.leftPaddle.width + this.ball.radius &&
//       this.ball.y >= this.leftPaddle.y &&
//       this.ball.y <= this.leftPaddle.y + this.leftPaddle.height
//     ) {
//       this.ball.dx = -this.ball.dx;
//     }

//     if (
//       this.ball.x >= this.rightPaddle.x - this.ball.radius &&
//       this.ball.y >= this.rightPaddle.y &&
//       this.ball.y <= this.rightPaddle.y + this.rightPaddle.height
//     ) {
//       this.ball.dx = -this.ball.dx;
//     }

//     // Scoring (with lock to prevent double calls)
//     if (!this.isScoring) {
//       if (this.ball.x < 0) {
//         this.isScoring = true;
//         await this.scorePoint("RIGHT");
//         return;
//       } else if (this.ball.x > this.canvas.width) {
//         this.isScoring = true;
//         await this.scorePoint("LEFT");
//         return;
//       }
//     }
//     const safeZone = this.canvas.width / 4; // 25% away from center
//     if (this.isScoring) {
//       const centerX = this.canvas.width / 2;
//       if (Math.abs(this.ball.x - centerX) > safeZone) {
//         this.isScoring = false;
//       }
//     }
//   }

//   private async scorePoint(scoringSide: PlayerSide): Promise<void> {
//     try {
//       if (this.currentSession) {
//         this.currentSession = await this.gameService.updatePlayerScore(
//           this.currentSession.sessionId,
//           scoringSide
//         );
//         if (this.currentSession.status === "FINISHED") {
//           setTimeout(() => {
//             this.endGame();
//           }, 500); // adding 0,5 sec delay to update the ui to show score 5
//         } else if (this.currentSession.status === "ABORTED") {
//           this.stopGameLoop();
//           return;
//         }
//       }
//     } catch (error) {
//       console.error("Failed to update score:", error);
//     }
//     // Reset ball position
//     this.ball.x = this.canvas.width / 2;
//     this.ball.y = this.canvas.height / 2;
//     this.ball.dx = -this.ball.dx; // Change direction
//   }

//   private async endGame(): Promise<void> {
//     try {
//       if (this.currentSession) {
//         this.cleanup();
//         this.stopGameLoop();

//         const winnerName = this.currentSession.winnerName ?? "Unknown";
//         alert(`Game Over! ${winnerName} wins!`);

//         this.container.innerHTML = "";

//         const results = new GameResults({
//           sessionId: this.currentSession.sessionId,
//           isTournament: this.opts?.isTournament,
//           onMatchEnd: this.opts?.onMatchEnd,
//         });

//         const resultsElement = results.render();
//         this.container.appendChild(resultsElement);
//       }
//     } catch (error) {
//       console.error("Failed to finish game:", error);
//     }
//   }

//   private cleanup() {
//     if (this.cleanupWarning) {
//       this.cleanupWarning();
//       this.cleanupWarning = undefined;
//     }
//   }

//   public async canDeactivate(): Promise<boolean> {
//     const confirmLeave = confirm("Leaving will stop the current match.");
//     if (confirmLeave) {
//       const sessionId = this.currentSession?.sessionId || this.opts?.sessionId;
//       if (sessionId) {
//         try {
//           await apiServices.game.updateGameStatus(sessionId, "ABORTED");
//         } catch (err) {
//           console.error("Error aborting game:", err);
//         }
//       }
//       this.stopGameLoop();
//     }
//     return confirmLeave;
//   }

//   public terminate(): void {
//     this.stopGameLoop();
//     this.cleanup();
//   }
// }