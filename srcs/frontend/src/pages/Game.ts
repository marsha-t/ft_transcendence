import { IComponent } from "../components/IComponent.js";
import {GameSession, PlayerSide, GameOptions,} from "../services/game/types.js";
import { apiServices } from "../services/ApiServices.js";
import { PongGame } from "../graphics/PongGame.js";
import { navigate, confirmationPopup } from "../utils";
import { TournamentStore } from "../services/tournament/TournamentStore.js";
import { gameConfigManager, CustomGameSettings } from "../graphics/GameConfigManager.js";
import { openGameCustomization } from "../utils/gameCustom.js";
import { makeButton } from "../utils/uiUtils.js"
import { t } from "../services/i18n/i18nService.js";

export class Game implements IComponent {
  private container!: HTMLElement;
  private canvas: HTMLCanvasElement;
  private pongGame!: PongGame;

  private currentSession: GameSession | null = null;
  private opts?: GameOptions;
  private isScoring: boolean = false;
  private isGameRunning: boolean = false;
  private hasEndedNaturally: boolean = false;

  //game custom
  private customGameSettings: CustomGameSettings | null = null;
  private cutomizationUI: any = null;

  constructor(opts?: GameOptions) {
    this.opts = opts;
    this.customGameSettings = opts?.customGameSettings ?? null;
    this.canvas = document.createElement("canvas");
    this.canvas.width = 900;
    this.canvas.height = 500;
  }

  public render(): HTMLElement {
    this.container = document.createElement("div");
    this.container.className =
      "flex flex-col items-center min-h-[80vh] p-20 bg-background-primary rounded-[30px] ml-6 mr-6 ";

    this.createTitleContainer();
    this.createCanvas();
    this.createControlsContainer();

    // Initialize
    if (this.opts?.isTournament && this.opts.sessionId) {
      this.initializeTournament();
    } else {
      this.initializeStandalone();
    }
    // After controls are created
    if (this.opts?.isTournament && this.customGameSettings) {
      this.showCustomizationApplied(this.customGameSettings.preset);
    }
    return this.container;
  }

  private createTitleContainer(): void {
    const titleContainer = document.createElement("div");
    titleContainer.className =
      "grid grid-cols-3 items-center w-full max-w-[900px] text-3xl font-bold text-white mb-6";

    const userLeft = document.createElement("h2");
    userLeft.textContent = this.opts?.displayNames?.leftName ?? "User 1";
    userLeft.className = "justify-self-start break-all max-w-[250px] text-left";
    userLeft.id = "left-player";
    
    const VS = document.createElement("h1");
    VS.textContent = t("game.VS") as string;
    VS.className = "justify-self-center";
    
    const userRight = document.createElement("h2");
    userRight.textContent = this.opts?.displayNames?.rightName ?? "User 2";
    userRight.className = "justify-self-end break-all max-w-[250px] text-right";
    userRight.id = "right-player";

    titleContainer.appendChild(userLeft);
    titleContainer.appendChild(VS);
    titleContainer.appendChild(userRight);
    this.container.appendChild(titleContainer);
  }

  private createCanvas(): void {
    const canvasContainer = document.createElement("div");
    canvasContainer.className = "relative";

    this.canvas.className =
      "max-w-full h-auto rounded-[30px] max-[800px]:w-full max-[800px]:aspect-[8/5]";
    canvasContainer.appendChild(this.canvas);

    //SCORE DISPLAY
    const scoreContainer = document.createElement("div");
    scoreContainer.className =
      "absolute top-8 left-0 right-0 flex justify-around text-6xl font-bold text-white pointer-events-none";
    scoreContainer.style.textShadow = "2px 2px 4px rgba(0,0,0,0.5)";

    const leftScore = document.createElement("div");
    leftScore.id = "left-score";
    leftScore.textContent = "0";
    leftScore.className = "ml-32";

    const rightScore = document.createElement("div");
    rightScore.id = "right-score";
    rightScore.textContent = "0";
    rightScore.className = "mr-32";

    scoreContainer.appendChild(leftScore);
    scoreContainer.appendChild(rightScore);
    canvasContainer.appendChild(scoreContainer);

    this.container.appendChild(canvasContainer);
    this.createPongGame();
  }

  private createPongGame(): void {
      if (this.customGameSettings) {
        gameConfigManager.applyCustomizations(this.customGameSettings);
    }

    this.pongGame = new PongGame(
        this.canvas,
        (side: "LEFT" | "RIGHT") => {
            if (!this.isScoring) {
                this.isScoring = true;
                this.scorePoint(side).then(() => {
                    setTimeout(() => (this.isScoring = false), 1000);
                });
            }
        },
        {
            aiEnabled: false,
            aiSide: 'LEFT'
        }
    );
  }

  private createControlsContainer(): void {
    const controlsContainer = document.createElement("div");
    controlsContainer.className =
      "flex flex-row gap-4 items-center justify-between pt-10";

    const customizeBtn = makeButton(t("game.customizeGame") as string, "customize-btn", "block", () => 
      this.openCustomizationPopUp()
    );

    const startBtn = makeButton(t("game.startGame") as string, "start-btn", "none", () =>
      this.toggleGame()
    );
    const pauseBtn = makeButton(t("game.pause") as string, "pause-btn", "none", () =>
      this.pauseGame()
    );
    const quitBtn = makeButton(t("game.quitGame") as string, "quit-btn", "none",() =>
      this.quitGame()
    );

    if (this.opts?.isTournament) {
      startBtn.style.display = "block";
      controlsContainer.appendChild(startBtn);
      controlsContainer.appendChild(pauseBtn);
    } else {
      controlsContainer.appendChild(customizeBtn);
      controlsContainer.appendChild(startBtn);
      controlsContainer.appendChild(pauseBtn);
      controlsContainer.appendChild(quitBtn);

      // Add guest player setup
      const setupSection = document.createElement("div");
      setupSection.className = "flex flex-row items-center gap-2";
      setupSection.id = "setup-section";

      const guestInput = document.createElement("input");
      guestInput.type = "text";
      guestInput.placeholder = t("game.enterGuestName") as string;
      guestInput.className = "w-48 h-12 rounded-lg mt-6 pl-4";
      guestInput.id = "guest-input";

      const addGuestBtn = makeButton(t("game.addGuestPlayer"), "add-guest-btn", "block",
        () => this.addGuestPlayer()
      );
      addGuestBtn.style.display = "block";

      setupSection.appendChild(guestInput);
      setupSection.appendChild(addGuestBtn);
      controlsContainer.prepend(setupSection);
    }

    this.container.appendChild(controlsContainer);
  }

  private openCustomizationPopUp(): void {

    this.cutomizationUI = openGameCustomization(document.body,
      (settings: CustomGameSettings) => {

        this.customGameSettings = settings;
        gameConfigManager.applyCustomizations(settings);
        this.recreatePongGame();
        this.showCustomizationApplied(settings.preset);
      }, ()=> {
        console.log("Customization cancelled.");
      }
    );
  }

  private recreatePongGame(): void {    
    // Dispose old game
    if (this.pongGame) {
        this.pongGame.dispose();
    }

    // Reset game state
    this.isGameRunning = false;
    this.isScoring = false;

    // Reset score display
    const leftScoreEl = document.getElementById("left-score");
    const rightScoreEl = document.getElementById("right-score");
    if (leftScoreEl) leftScoreEl.textContent = "0";
    if (rightScoreEl) rightScoreEl.textContent = "0";

    // Create new PongGame with updated config
    this.createPongGame();
  }

  private showCustomizationApplied(preset: string): void {

    const indicator = document.createElement("div");
    indicator.id = "custom-indicator";
    indicator.textContent = `${preset} Mode Active`;
    indicator.className = "text-white bg-purple-600 px-4 py-2 rounded-lg " +
      "font-semibold text-sm mt-2";
    
    const controls = this.container.querySelector(".flex.flex-row.gap-4");
    if (controls) {
      // Remove old indicator if exists
      const oldIndicator = document.getElementById("custom-indicator");
      if (oldIndicator) oldIndicator.remove();
      
      controls.parentElement?.insertBefore(indicator, controls.nextSibling);
    }
  }

  // INITIALIZATION

  private async initializeStandalone(): Promise<void> {
    try {
      this.currentSession = await apiServices.game.createGameSession("RIGHT");
      // Show user on the right
      const rightPlayerElement = document.getElementById("right-player");
      if (rightPlayerElement && this.currentSession?.players[0]) {
        rightPlayerElement.textContent =
          this.currentSession.players[0].displayName;
      }
    } catch (error) {
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
    const guestInput = document.getElementById(
      "guest-input"
    ) as HTMLInputElement;
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
      await apiServices.game.addGuestPlayer(
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
      if (error.status === 409) {
        alert(error.message);
      } else {
        alert("Error adding guest player");
      }
    }
  }

  // GAME LOOP CONTROLS

  private startGameLoop(): void {
    this.isGameRunning = true;
    this.pongGame.resume();
  }

  private stopGameLoop(): void {
    this.isGameRunning = false;
    this.pongGame.pause();
  }

  private async toggleGame(): Promise<void> {
    if (!this.currentSession) {
      alert("Game session not initialized");
      return;
    }

    try {
      if (!this.isGameRunning) {
        await apiServices.game.startGame(this.currentSession.sessionId);
        this.startGameLoop();
        this.updateGameButtons(true);
      }
    } catch (error) {
      alert("Failed to start game. Please try again.");
    }
  }

  private async pauseGame(): Promise<void> {
    if (!this.currentSession) return;

    try {
      if (this.isGameRunning) {
        await apiServices.game.pauseGame(this.currentSession.sessionId);
        this.stopGameLoop();
        this.updateGameButtons(false);
      } else {
        await apiServices.game.startGame(this.currentSession.sessionId);
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
      await apiServices.game.abortGame(this.currentSession.sessionId);
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
    const customizeBtn = document.getElementById("customize-btn") as HTMLButtonElement;


    if (isPlaying) {
      if (startBtn) startBtn.style.display = "none";
      if (pauseBtn) {
        pauseBtn.style.display = "block";
        pauseBtn.textContent = t("game.pause") as string;
      }
      if (quitBtn) quitBtn.style.display = "block";
      if(customizeBtn) customizeBtn.style.display = "none";
    } else {
      if (startBtn) startBtn.style.display = "none";
      if (pauseBtn) {
        pauseBtn.style.display = "block";
        pauseBtn.textContent = t("game.resume") as string;
      }
      if (quitBtn) quitBtn.style.display = "block";
      if(customizeBtn) customizeBtn.style.display = "none";
    }
  }

  private async scorePoint(scoringSide: PlayerSide): Promise<void> {
    if (!this.isGameRunning) {
      return;
    }

    try {
      if (this.currentSession) {
        this.currentSession = await apiServices.game.updatePlayerScore(
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
    const leftPlayer = this.currentSession?.players.find(
      (p) => p.side === "LEFT"
    );
    const rightPlayer = this.currentSession?.players.find(
      (p) => p.side === "RIGHT"
    );

    const leftScore = leftPlayer?.score ?? 0;
    const rightScore = rightPlayer?.score ?? 0;

    const leftScoreEl = document.getElementById("left-score");
    const rightScoreEl = document.getElementById("right-score");

    if (leftScoreEl) leftScoreEl.textContent = leftScore.toString();
    if (rightScoreEl) rightScoreEl.textContent = rightScore.toString();
  }

  private async endGame(): Promise<void> {
    this.hasEndedNaturally = true;

    if (this.currentSession) {
      this.stopGameLoop();

      const winnerName = this.currentSession.winnerName ?? "Unknown";
      const confirmed = await confirmationPopup(`${t("game-result.gameOver") as string}! 
              ${winnerName} ${t("game-result.wins") as string}!`,
             `${t("game-result.gameOver") as string}`, true);
      if (!confirmed) return;
      if (this.opts?.isTournament) {
        TournamentStore.isInternalTournamentNavigation = true;
      }
      navigate("/game/results", {
        sessionId: this.currentSession.sessionId,
        isTournament: this.opts?.isTournament,
        tournamentId: this.opts?.tournamentId,
      });
    }
  }

  private resetGame(): void {
    this.currentSession = null;

    this.customGameSettings = null;
    gameConfigManager.reset();
    const indicator = document.getElementById("custom-indicator");
    if(indicator) 
      indicator.remove();
    
    const setupSection = document.getElementById("setup-section");
    const startBtn = document.getElementById("start-btn");
    const pauseBtn = document.getElementById("pause-btn");
    const quitBtn = document.getElementById("quit-btn");
    const customizeBtn = document.getElementById("customize-btn");

    if (setupSection) setupSection.style.display = "flex";
    if (startBtn) startBtn.style.display = "none";
    if (pauseBtn) pauseBtn.style.display = "none";
    if (quitBtn) quitBtn.style.display = "none";
    if (customizeBtn) customizeBtn.style.display = "block";

    const leftPlayerElement = document.getElementById("left-player");
    const rightPlayerElement = document.getElementById("right-player");
    if (leftPlayerElement) leftPlayerElement.textContent = "Player 1";
    if (rightPlayerElement) rightPlayerElement.textContent = "Player 2";

    this.recreatePongGame();
    this.initializeStandalone();
  }

  // CLEANUP
  public async canDeactivate(): Promise<boolean> {
    if (this.hasEndedNaturally) {
      this.stopGameLoop();
      return true;
    }
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
    this.cleanup();
  }

  public cleanup(): void {
    this.stopGameLoop();

    if(this.cutomizationUI){
      this.cutomizationUI.close();
      this.cutomizationUI = null;
    }

    if(this.pongGame){
      this.pongGame.dispose();
      this.cutomizationUI = null as any;
    }

    gameConfigManager.reset();
    this.currentSession = null;
    this.customGameSettings = null;
  }
}
