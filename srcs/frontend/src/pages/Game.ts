import { IComponent } from "../components/IComponent.js";
import { GameService } from "../services/game/GameService.js";
import { GameSession, PlayerSide } from "../services/game/types.js";
import { apiServices } from "../services/ApiServices.js";
import { GameResults } from "./GameResults.js";
import { BabylonScene } from "../graphics/BabylonScene.js";

type GameOptions = {
  sessionId?: string;
  isTournament?: boolean;
  displayNames?: { leftName: string; rightName: string };
  onMatchEnd?: () => void;
};

export class Game implements IComponent {
  private container!: HTMLElement;
  private canvas: HTMLCanvasElement;
  private babylonScene!: BabylonScene;
  private gameService: GameService;
  private currentSession: GameSession | null = null;
  private opts?: GameOptions;
  private cleanupWarning?: () => void;

  private isGameRunning: boolean = false;
  private isScoring: boolean = false;
  private animationId: number | null = null;

  private ball = { x: 450, y: 300, dx: 5, dy: 3, radius: 12 };
  private leftPaddle = { x: 20, y: 250, width: 10, height: 100, speed: 6 };
  private rightPaddle = { x: 870, y: 250, width: 10, height: 100, speed: 6 };
  private key: { [key: string]: boolean } = {};

  constructor(opts?: GameOptions) {
    this.opts = opts;
    
    // Create canvas
    this.canvas = document.createElement("canvas");
    this.canvas.width = 900;
    this.canvas.height = 600;
    
    // Initialize Babylon.js scene (replaces 2D context)
    this.babylonScene = new BabylonScene(this.canvas);
  
    this.gameService = new GameService();
  
    this.setupKeyboardControls();
  }

  public render(): HTMLElement {
    this.container = document.createElement("div");
    this.container.className = "game_page";

    //Load css
    this.loadPageStyles();

    //Title container
    const titleContainer = document.createElement("div");
    titleContainer.className = "title_container";

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

    // Canvas container
    this.canvas.className = "game_canvas";
    const canvasContainer = document.createElement("div");
    canvasContainer.className = "canvas_container";
    canvasContainer.appendChild(this.canvas);
    this.container.appendChild(canvasContainer);

    // Controls container
    const controlsContainer = document.createElement("div");
    controlsContainer.className = "controls_container";

    const startBtn = this.makeButton("Start Game", "start-btn", () =>
      this.toggleGame()
    );
    const pauseBtn = this.makeButton("Pause", "pause-btn", () =>
      this.pauseGame()
    );
    const quitBtn = this.makeButton("Quit Game", "quit-btn", () =>
      this.quitGame()
    );

    // --- Tournament ---
    if (this.opts?.isTournament) {
      startBtn.style.display = "block";
      controlsContainer.appendChild(startBtn);
      controlsContainer.appendChild(pauseBtn);
    }
    // --- Standalone ---
    else {
      controlsContainer.appendChild(startBtn);
      controlsContainer.appendChild(pauseBtn);
      controlsContainer.appendChild(quitBtn);

      // Player setup section
      const setupSection = document.createElement("div");
      setupSection.className = "setup_section";
      setupSection.id = "setup-section";

      const guestInput = document.createElement("input");
      guestInput.type = "text";
      guestInput.placeholder = "Enter guest name";
      guestInput.className = "guest_input";
      guestInput.id = "guest-input";

      const addGuestBtn = this.makeButton(
        "Add Guest Player",
        "add-guest-btn",
        () => this.addGuestPlayer()
      );
      addGuestBtn.style.display = "block";

      setupSection.appendChild(guestInput);
      setupSection.appendChild(addGuestBtn);
      controlsContainer.prepend(setupSection);
    }

    this.container.appendChild(controlsContainer);

    // Initialise logic
    if (this.opts?.isTournament && this.opts.sessionId) {
      this.initializeTournament();
    } else {
      this.initializeStandalone();
    }
    return this.container;
  }

  // -------------------------------------------------
  // SETUP HELPERS
  // -------------------------------------------------
  private loadPageStyles(): void {
    if (document.getElementById("game-styles")) return;

    const link = document.createElement("link");
    link.id = "game-styles";
    link.rel = "stylesheet";
    link.href = "/styles/Game.css";
    document.head.appendChild(link);
  }

  private setupKeyboardControls(): void {
    document.addEventListener("keydown", (event) => {
      this.key[event.key.toLowerCase()] = true;
      this.key[event.key] = true;
    });

    document.addEventListener("keyup", (event) => {
      this.key[event.key.toLowerCase()] = false;
      this.key[event.key] = false;
    });
  }

  private makeButton(
    label: string,
    id: string,
    handler: () => void
  ): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.id = id;
    btn.className = id.replace("-", "_");
    btn.style.display = "none";
    btn.addEventListener("click", handler);
    return btn;
  }

  // -------------------------------------------------
  // INITIALISATION
  // -------------------------------------------------
  private async initializeStandalone(): Promise<void> {
    try {
      const userId = 1; // TODO For test case only
      this.currentSession = await this.gameService.createGameSession(
        userId,
        "RIGHT"
      );

      console.log(`Current Session: ${this.currentSession}`);

      //show the user on the right
      const rightPlayerElement = document.getElementById("right-player");
      if (rightPlayerElement && this.currentSession?.players[0])
        rightPlayerElement.textContent =
          this.currentSession?.players[0].displayName;
    } catch (error) {
      console.error("Failed to initialize game:", error);
      alert("Failed to initialize game from: initializeStandalone()");
    }
  }

  private async initializeTournament() {
    const left = this.opts?.displayNames?.leftName ?? "User 1c";
    const right = this.opts?.displayNames?.rightName ?? "User 2d";

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
    const guestInput = document.getElementById(
      "guest-input"
    ) as HTMLInputElement;
    const guestName = guestInput.value.trim();

    if (!guestName) {
      alert("Please, enter a guest name");
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

      //ui
      const leftPlayerElement = document.getElementById("left-player");
      if (leftPlayerElement) {
        leftPlayerElement.textContent = guestName;
      }

      //hide setup
      const setupSection = document.getElementById("setup-section");
      const startBtn = document.getElementById("start-btn");
      const quitBtn = document.getElementById("quit-btn");

      if (setupSection) setupSection.style.display = "none";
      if (startBtn) startBtn.style.display = "block";
      if (quitBtn) quitBtn.style.display = "block";

      guestInput.value = "";
    } catch (error: any) {
      console.log("Error adding guest player", error);
      if (error.status === 409) {
        alert(error.message);
      } else {
        alert("Error adding guest player");
      }
    }
  }

  // -------------------------------------------------
  // GAME LOOP + CONTROLS
  // -------------------------------------------------
  private startGameLoop(): void {
    this.isGameRunning = true;
    this.gameLoop();
  }

  private stopGameLoop(): void {
    this.isGameRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private async gameLoop(): Promise<void> {
    if (!this.isGameRunning) return;
    await this.updateGame();
    // Note: Babylon.js handles rendering automatically in BabylonScene

    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  private async toggleGame(): Promise<void> {
    if (!this.currentSession) {
      alert("Game session not initialized, toggleGame()");
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
      console.log("failed to pause/resume the game");
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

  private resetGame(): void {
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    this.ball.dx = 5;
    this.ball.dy = 3;

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

    // Reset session
    this.currentSession = null;
    this.initializeStandalone();
  }

  private updateGameButtons(isPlaying: boolean): void {
    const startBtn = document.getElementById("start-btn") as HTMLButtonElement;
    const pauseBtn = document.getElementById("pause-btn") as HTMLButtonElement;
    const quitBtn = document.getElementById("quit-btn") as HTMLButtonElement;

    if (isPlaying) {
      startBtn.style.display = "none";
      pauseBtn.style.display = "block";
      if (quitBtn) quitBtn.style.display = "block";
      pauseBtn.textContent = "Pause";
    } else {
      startBtn.style.display = "none";
      pauseBtn.style.display = "block";
      if (quitBtn) quitBtn.style.display = "block";
      pauseBtn.textContent = "Resume";
    }
  }

  // -------------------------------------------------
  // GAME STATE UPDATES
  // -------------------------------------------------
  private updatePaddleMovement(): void {
    if (this.key["w"] && this.leftPaddle.y > 0) {
      this.leftPaddle.y -= this.leftPaddle.speed;
    }
    if (
      this.key["s"] &&
      this.leftPaddle.y < this.canvas.height - this.leftPaddle.height
    ) {
      this.leftPaddle.y += this.leftPaddle.speed;
    }

    // Right paddle controls (Arrow keys)
    if (this.key["ArrowUp"] && this.rightPaddle.y > 0) {
      this.rightPaddle.y -= this.rightPaddle.speed;
    }
    if (
      this.key["ArrowDown"] &&
      this.rightPaddle.y < this.canvas.height - this.rightPaddle.height
    ) {
      this.rightPaddle.y += this.rightPaddle.speed;
    }

    // Keep paddles within bounds
    this.leftPaddle.y = Math.max(
      0,
      Math.min(this.leftPaddle.y, this.canvas.height - this.leftPaddle.height)
    );
    this.rightPaddle.y = Math.max(
      0,
      Math.min(this.rightPaddle.y, this.canvas.height - this.rightPaddle.height)
    );
  }

  private async updateGame(): Promise<void> {
    this.updatePaddleMovement();

    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    // Ball collision with top and bottom walls
    if (
      this.ball.y <= this.ball.radius ||
      this.ball.y >= this.canvas.height - this.ball.radius
    ) {
      this.ball.dy = -this.ball.dy;
    }

    // Ball collision with paddles
    if (
      this.ball.x <=
        this.leftPaddle.x + this.leftPaddle.width + this.ball.radius &&
      this.ball.y >= this.leftPaddle.y &&
      this.ball.y <= this.leftPaddle.y + this.leftPaddle.height
    ) {
      this.ball.dx = -this.ball.dx;
    }

    if (
      this.ball.x >= this.rightPaddle.x - this.ball.radius &&
      this.ball.y >= this.rightPaddle.y &&
      this.ball.y <= this.rightPaddle.y + this.rightPaddle.height
    ) {
      this.ball.dx = -this.ball.dx;
    }

    // Scoring (with lock to prevent double calls)
    if (!this.isScoring) {
      if (this.ball.x < 0) {
        this.isScoring = true;
        await this.scorePoint("RIGHT");
        return;
      } else if (this.ball.x > this.canvas.width) {
        this.isScoring = true;
        await this.scorePoint("LEFT");
        return;
      }
    }
    const safeZone = this.canvas.width / 4;
    if (this.isScoring) {
      const centerX = this.canvas.width / 2;
      if (Math.abs(this.ball.x - centerX) > safeZone) {
        this.isScoring = false;
      }
    }
  }

  private async scorePoint(scoringSide: PlayerSide): Promise<void> {
    try {
      if (this.currentSession) {
        this.currentSession = await this.gameService.updatePlayerScore(
          this.currentSession.sessionId,
          scoringSide
        );
        if (this.currentSession.status === "FINISHED") {
          setTimeout(() => {
            this.endGame();
          }, 500);
        } else if (this.currentSession.status === "ABORTED") {
          this.stopGameLoop();
          return;
        }
      }
    } catch (error) {
      console.error("Failed to update score:", error);
    }
    // Reset ball position
    this.ball.x = this.canvas.width / 2;
    this.ball.y = this.canvas.height / 2;
    this.ball.dx = -this.ball.dx;
  }

  private async endGame(): Promise<void> {
    try {
      if (this.currentSession) {
        this.cleanup();
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

  private cleanup() {
    if (this.cleanupWarning) {
      this.cleanupWarning();
      this.cleanupWarning = undefined;
    }
    // Dispose Babylon.js scene
    if (this.babylonScene) {
      this.babylonScene.dispose();
    }
  }

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
    this.cleanup();
  }
}