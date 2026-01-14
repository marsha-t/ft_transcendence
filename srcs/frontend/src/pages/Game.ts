import { IComponent } from "../components/IComponent.js";
import { GameSession, PlayerSide, GameOptions } from "../services/game/types.js";
import { apiServices } from "../services/ApiServices.js";
import { PongGame } from "../graphics/PongGame.js";
import { navigate, NavigationState } from "../utils/commonUtils.js";
import { TournamentStore } from "../services/tournament/TournamentStore.js";
import { gameConfigManager } from "../graphics/GameConfigManager.js";
import { CustomGameSettings } from "../graphics/types.js";
import { openGameCustomization } from "../utils/gameCustom.js";
import { makeButton, showMessage, showConfirmation, gameCompletionPopup } from "../utils/uiUtils.js"
import { t, translateApiError } from "../services/i18n/i18nService.js";
/**
 * - Render and manage the Pong game UI
 * - Control game lifecycle (start, pause, score, end)
 * - Synchronize game state with backend services
 * - Handle SPA navigation safety (canDeactivate)
 * - Ensure full cleanup on route change
 *
 * Lifecycle:
 * Router -> render()
 * Router -> canDeactivate() -> cleanup()
 */

export class Game implements IComponent {
  private container!: HTMLElement;
  private messageContainer!: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private pongGame!: PongGame;

  private currentSession: GameSession | null = null;
  private opts?: GameOptions;
  private isScoring: boolean = false;
  private isGameRunning: boolean = false;
  private hasEndedNaturally: boolean = false;
  private customGameSettings: CustomGameSettings | null = null;
  private cutomizationUI: any = null;
  private abortController: AbortController = new AbortController();
  private timeoutIds: number[] = [];
  private buttonCleanups: Array<{element: HTMLElement; event: string; handler: EventListener}> = [];

  constructor(opts?: GameOptions) {
    this.opts = opts;
    this.customGameSettings = opts?.customGameSettings ?? null;
    this.canvas = document.createElement("canvas");
    this.canvas.width = 900;
    this.canvas.height = 500;
  }

  // - Called once by Router when route becomes active
  // - Builds DOM
  // - Initializes game session
  public render(): HTMLElement {
    this.container = document.createElement("div");
    this.container.className =
      "flex flex-col items-center bg-background-primary rounded-[30px] mx-6 my-6 py-8 px-4 shadow-lg h-auto gap-4";

    this.createTitleContainer();
    this.createCanvas();
    this.createControlsContainer();

    if (this.opts?.isTournament && this.opts.sessionId) {
      this.initializeTournament();
    } else {
      this.initializeStandalone();
    }
    if (this.opts?.isTournament && this.customGameSettings) {
      this.showCustomizationApplied(this.customGameSettings.preset);
    }
    this.messageContainer = document.createElement("div");
    this.messageContainer.style.display = "none";
    this.container.appendChild(this.messageContainer);
    
    return this.container;
  }

  // ===============
  // UI CONSTRUCTION
  // ===============
  private createTitleContainer(): void {
    const titleContainer = document.createElement("div");
    titleContainer.className =
      "grid grid-cols-3 items-center w-full max-w-[900px] text-3xl font-bold text-white";

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

    private createControlsContainer(): void {
    const controlsContainer = document.createElement("div");
    controlsContainer.className =
      "flex flex-row gap-4 items-center justify-between";

    const customizeBtn = this.createTrackedButton(t("game.customizeGame") as string, "customize-btn", "block", () => 
      this.openCustomizationPopUp());

    const startBtn = this.createTrackedButton(t("game.startGame") as string, "start-btn", "none", () =>
      this.toggleGame()
    );
    const pauseBtn = this.createTrackedButton(t("game.pause") as string, "pause-btn", "none", () =>
      this.pauseGame()
    );
    const quitBtn = this.createTrackedButton(t("game.quitGame") as string, "quit-btn", "none",() =>
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

      const setupSection = document.createElement("div");
      setupSection.className = "flex flex-row items-center gap-2";
      setupSection.id = "setup-section";

      const guestInput = document.createElement("input");
      guestInput.type = "text";
      guestInput.placeholder = t("game.enterGuestName") as string;
      guestInput.className = "w-48 h-12 rounded-lg mt-6 pl-4";
      guestInput.id = "guest-input";

      const addGuestBtn = this.createTrackedButton(t("game.addGuestPlayer") as string, "add-guest-btn", "block",
        () => this.addGuestPlayer()
      );
      addGuestBtn.style.display = "block";

      setupSection.appendChild(guestInput);
      setupSection.appendChild(addGuestBtn);
      controlsContainer.prepend(setupSection);
    }

    this.container.appendChild(controlsContainer);
  }

  private createTrackedButton(label: string, id: string, display: string, handler: ()=> void ): HTMLButtonElement{
    const btn = makeButton(label, id, display, handler);
    this.buttonCleanups.push({ element: btn, event: 'click', handler: handler as EventListener });
    return btn;
  }

  private showCustomizationApplied(preset: string): void {
    const indicator = document.createElement("div");
    indicator.id = "custom-indicator";
    const presetLabelMap: Record<string, string> = {
      CLASSIC: t("gameCustomization.classic"),
      FAST: t("gameCustomization.fastMode"),
      CHAOS: t("gameCustomization.chaosMode"),
      CUSTOM: t("gameCustomization.customMode"),
    };

    indicator.textContent = t("gameCustomization.modeActive", {
      mode: presetLabelMap[preset] ?? preset
    }) as string;

    indicator.className = "text-white bg-purple-600 px-4 py-2 rounded-lg " +
      "font-semibold text-sm mt-2";
    
    const controls = this.container.querySelector(".flex.flex-row.gap-4");
    if (controls) {
      const oldIndicator = document.getElementById("custom-indicator");
      if (oldIndicator) oldIndicator.remove();
      controls.parentElement?.insertBefore(indicator, controls.nextSibling);
    }
  }

  private clearMessage(): void {
    if (this.messageContainer) {
      this.messageContainer.style.display = "none";
      this.messageContainer.textContent = "";
    }
  }

  // ===========
  // GAME ENGINE
  // ===========
  private createPongGame(): void {
      if (this.customGameSettings)
        gameConfigManager.applyCustomizations(this.customGameSettings);

    this.pongGame = new PongGame(
        this.canvas,
        (side: "LEFT" | "RIGHT") => {
            if (!this.isScoring) {
                this.isScoring = true;
                this.scorePoint(side).then(() => {
                    const timeoutId = window.setTimeout(() => (this.isScoring = false), 1000);
                    this.timeoutIds.push(timeoutId);
                });
            }
        },
        {
            aiEnabled: false,
            aiSide: 'LEFT'
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

  private startGameLoop(): void {
    this.isGameRunning = true;
    this.pongGame.resume();
  }

  private stopGameLoop(): void {
    this.isGameRunning = false;
    this.pongGame.pause();
  }

  private openCustomizationPopUp(): void {
    this.clearMessage();
    this.cutomizationUI = openGameCustomization(document.body,
      (settings: CustomGameSettings) => {

        this.customGameSettings = settings;
        gameConfigManager.applyCustomizations(settings);
        this.recreatePongGame();
        this.showCustomizationApplied(settings.preset);
      }, ()=> {}
    );
  }

  // =============================
  // BACKEND & SERVICE COMMUNICATION
  // ===============================
  private async initializeStandalone(): Promise<void> {
    const res = await apiServices.game.createGameSession("RIGHT");
    if (!res.success || !res.data) {
      showMessage(this.container, this.messageContainer, translateApiError(res) || "Failed to initialize game", "error");
      return;
    }
    this.currentSession = res.data;
    NavigationState.activeGameSessionId = this.currentSession.sessionId;

    const rightPlayerElement = document.getElementById("right-player");
    if (rightPlayerElement && this.currentSession?.players[0]) {
      rightPlayerElement.textContent =
        this.currentSession.players[0].displayName;
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
    this.clearMessage();
    const guestInput = document.getElementById(
      "guest-input"
    ) as HTMLInputElement;
    const guestName = guestInput.value.trim();

    if (!guestName) {
      showMessage(this.container, this.messageContainer, "Please enter a guest name", "error");
      return;
    }
    if (!this.currentSession) {
      showMessage(this.container, this.messageContainer, "Game session not initialized", "error");
      return;
    }

    const res = await apiServices.game.addGuestPlayer(
      this.currentSession.sessionId,
      guestName,
      "LEFT"
    );
    if (!res.success) {
      showMessage(this.container, this.messageContainer, translateApiError(res) || "Failed to add guest player", "error");
      return;
    }

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
  }

  private async toggleGame(): Promise<void> {
    this.clearMessage();
    if (!this.currentSession) {
      showMessage(this.container, this.messageContainer, "Game session not initialized", "error");
      return;
    }

    if (!this.isGameRunning) {
      const res = await apiServices.game.startGame(this.currentSession.sessionId);
      if (!res.success || !res.data) {
        showMessage(this.container, this.messageContainer, translateApiError(res) || "Failed to start game", "error");
        return;
      }
      this.currentSession = res.data;
      this.startGameLoop();
      this.updateGameButtons(true);
    }
  }

  private async pauseGame(): Promise<void> {
    this.clearMessage();
    if (!this.currentSession) return;

    const res = this.isGameRunning
    ? await apiServices.game.pauseGame(this.currentSession.sessionId)
    : await apiServices.game.startGame(this.currentSession.sessionId);
    if (!res.success || !res.data) {
      showMessage(this.container, this.messageContainer, translateApiError(res), "error");
      return;
    }
    this.currentSession = res.data;
    if (this.isGameRunning) {
      this.stopGameLoop();
      this.updateGameButtons(false);
    } else {
      this.startGameLoop();
      this.updateGameButtons(true);
    }
  }

  private async quitGame(): Promise<void> {
    this.clearMessage();
    if (!this.currentSession) 
      return;

    const confirmed = await showConfirmation("Are you sure you want to quit the game?", t("common.pleaseConfirm") as string, true);
    if (!confirmed) return;

    const res = await apiServices.game.abortGame(this.currentSession.sessionId);
    if (!res.success || !res.data) {
      showMessage(this.container, this.messageContainer, translateApiError(res) || "Failed to quit game", "error");
      return ;
    }
    NavigationState.activeGameSessionId = null;
    this.currentSession = res.data;
    this.stopGameLoop();
    this.resetGame();
  }

  private async scorePoint(scoringSide: PlayerSide): Promise<void> {
    if (!this.isGameRunning) {
      return;
    }
    if (this.currentSession) {
      const res = await apiServices.game.updatePlayerScore(
        this.currentSession.sessionId,
        scoringSide
      );
      if (!res.success || !res.data) return;
      this.currentSession = res.data;
      this.updateScoreDisplay();

      if (this.currentSession.status === "FINISHED") {
        const timeoutId = window.setTimeout(() => this.endGame(), 500);
        this.timeoutIds.push(timeoutId);
        NavigationState.activeGameSessionId = null;
      } else if (this.currentSession.status === "ABORTED") {
        this.stopGameLoop();
      }
    }
  }

  // ==============================
  // GAME STATE → UI SYNCHRONIZATION
  // ===============================
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

  // =============================
  // GAME TERMINATION & NAVIGATION
  // =============================
  private async endGame(): Promise<void> {
    this.hasEndedNaturally = true;
    NavigationState.activeGameSessionId = null;

    if (this.currentSession) {
      this.stopGameLoop();

      const winnerName = this.currentSession.winnerName ?? "Unknown";
      const confirmed = await gameCompletionPopup(`${t("game-result.gameOver") as string}! 
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

  // ====================
  // SPA SAFETY & CLEANUP
  // =====================
  public async canDeactivate(): Promise<boolean> {
    if (NavigationState.forceNavigate) {
      this.stopGameLoop();
      return true;
    }
    if (this.hasEndedNaturally) {
      this.stopGameLoop();
      return true;
    }
    const confirmLeave = await showConfirmation("Leaving will stop the current match.", t("common.pleaseConfirm") as string, true);
    if (!confirmLeave) return false;
    this.stopGameLoop();
    const sessionId = this.currentSession?.sessionId || this.opts?.sessionId;
    if (sessionId && this.currentSession?.status !== "ABORTED") {
      NavigationState.activeGameSessionId = null;
      NavigationState.activeTournamentId = null;
      apiServices.game.abortGame(sessionId); // backend abort is best-effort; don't block navigation regardless of success
    }
    return confirmLeave;
  }

  public cleanup(): void {
    //clean all API requests
    this.abortController.abort();

    //clean all timeouts
    this.timeoutIds.forEach(id => clearTimeout(id));
    this.timeoutIds = [];

    //Remove all event listeners
    this.buttonCleanups.forEach(({element, event, handler}) => {
      element.removeEventListener(event, handler);
    });
    this.buttonCleanups = [];

    this.stopGameLoop();

    if(this.cutomizationUI){
      this.cutomizationUI.close();
      this.cutomizationUI = null;
    }

    if(this.pongGame){
      this.pongGame.dispose();
      this.cutomizationUI = null as any;
    }
    NavigationState.activeGameSessionId = null;
    gameConfigManager.reset();
    this.currentSession = null;
    this.customGameSettings = null;
    this.abortController = new AbortController();
  }

  public terminate(): void {
    this.cleanup();
  }
}
