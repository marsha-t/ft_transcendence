// src/pages/AI.ts

import { IComponent } from "../components/IComponent.js";
import { PongGame } from "../graphics/PongGame.js";
import { PlayerSide } from "../services/game/types.js";
import { GameConfig } from "../graphics/GameConfig.js";
import { navigate, confirmationPopup } from "../utils";
import {GameSession} from "../services/game/types.js";
import { GameService } from "../services/game/GameService.js";
import { apiServices } from "../services/ApiServices.js";
import {makeButton} from "../utils/uiUtils.js"

export class AI implements IComponent {
  private container!: HTMLElement;
  private canvas: HTMLCanvasElement;
  private pongGame!: PongGame;
  private isScoring: boolean = false;
  private isGameRunning: boolean = false;
  private hasEndedNaturally: boolean = false;
  private currentSession: GameSession | null = null;
  private gameService: GameService;
  private username: string = 'Loading ...';

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 900;
    this.canvas.height = 500;
    this.gameService = new GameService();
    this.username = "getting username...";
  }

  public render(): HTMLElement {
    this.container = document.createElement("div");
    this.container.className =
      "flex flex-col items-center min-h-[80vh] p-20 bg-background rounded-[30px] ml-6 mr-6";

    this.loadUserAndUpdateName().then(() => {
      this.createTitleContainer();
      this.createCanvas();
      this.createControlsContainer();
      this.initializeAIGame();
    });

    return this.container;
  }

  private createTitleContainer(): void {
    const titleContainer = document.createElement("div");
    titleContainer.className =
      "flex flex-row items-center justify-between w-[800px] text-3xl font-bold text-white pointer-events-none mb-6";

    // AI on LEFT
    const aiName = document.createElement("h2");
    aiName.textContent = "🤖 AI";
    aiName.className = "user";
    aiName.id = "left-player";

    const VS = document.createElement("h1");
    VS.textContent = "VS";
    VS.className = "VS";

    // User on RIGHT
    const userName = document.createElement("h2");
    userName.textContent = this.username;
    userName.className = "user";
    userName.id = "right-player";

    titleContainer.appendChild(aiName);
    titleContainer.appendChild(VS);
    titleContainer.appendChild(userName);
    this.container.appendChild(titleContainer);
  }


  private createCanvas(): void {
    const canvasContainer = document.createElement("div");
    canvasContainer.className = "relative";

    this.canvas.className =
      "max-w-full h-auto rounded-[30px] max-[800px]:w-full max-[800px]:aspect-[8/5]";
    canvasContainer.appendChild(this.canvas);

    // SCORE DISPLAY
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

    // Initialize PongGame with AI enabled
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
        aiEnabled: true,
        aiSide: "LEFT",
      }
    );
  }

  private createControlsContainer(): void {
    const controlsContainer = document.createElement("div");
    controlsContainer.className =
      "flex flex-row gap-4 items-center justify-between pt-10";

    const startBtn = makeButton("Start Game", "start-btn", "block", () =>
      this.toggleGame()
    );
    const pauseBtn = makeButton("Pause", "pause-btn", "none", () =>
      this.pauseGame()
    );
    const quitBtn = makeButton("Quit Game", "quit-btn", "none", () =>
      this.quitGame()
    );

    controlsContainer.appendChild(startBtn);
    controlsContainer.appendChild(pauseBtn);
    controlsContainer.appendChild(quitBtn);

    this.container.appendChild(controlsContainer);
  }


  private async loadUserAndUpdateName(): Promise<void> {
    await this.loadUser();
  
    const rightPlayerEl = document.getElementById("right-player");
    if (rightPlayerEl) {
      rightPlayerEl.textContent = this.username;
    }
  }

  async loadUser() {
    try {
      const response = await apiServices.profile.getProfile();
      const username = response.data?.username;
      if (response.success && username) {
        this.username = username;
      }
    } catch (err) {
      console.log("Failed to fetch username: ", err);
    }
  }


  private async initializeAIGame(): Promise<void> {
    try {
      const response = await fetch("/api/ai/create-game", {
        method: "POST",
        credentials: "include",
      });
  
      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Failed: ${response.status} ${err}`);
      }
  
      const data = await response.json();
  
      this.currentSession = {
        sessionId: data.id,
        status: data.status,
        players: data.players.map((p: any) => ({
          side: p.side,
          displayName: p.displayName || p.user?.username || "Player",
          score: p.score || 0,
        })),
        winnerName: data.winnerName,
      } as GameSession;
  
      console.log("AI Game Ready!", this.currentSession);
    } catch (err: any) {
      console.error("Failed to start AI game:", err);
      alert("Could not connect to game service.");
    }
  }


  private async scorePoint(scoringSide: PlayerSide): Promise<void> {
    if (!this.isGameRunning) {
      return;
    }

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
    const leftPlayer = this.currentSession?.players.find(
      (p) => p.side === "LEFT"
    );
    const rightPlayer = this.currentSession?.players.find(
      (p) => p.side === "RIGHT"
    );

    const leftScore = leftPlayer?.score ?? 0;
    const rightScore = rightPlayer?.score ?? 0;

    console.log(`Score - AI: ${leftScore}, You: ${rightScore}`);

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
      const confirmed = confirmationPopup(
        `Game Over! ${winnerName} wins!`,
        "Game Over",
        true
      );
      
      if (!confirmed) return;

      navigate("/game/results", {
        sessionId: this.currentSession.sessionId,
        isTournament: false,
      });
    }
  }

  // CLEANUP

  public async canDeactivate(): Promise<boolean> {
    if (this.hasEndedNaturally) {
      this.stopGameLoop();
      return true;
    }

    const confirmLeave = confirm("Leaving will stop the current AI match.");
    if (confirmLeave) {
      if (this.currentSession?.sessionId) {
        try {
          await apiServices.game.updateGameStatus(
            this.currentSession.sessionId,
            "ABORTED"
          );
        } catch (err) {
          console.error("Error aborting AI game:", err);
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
    this.pongGame = null as any;
    this.currentSession = null;
  }


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

    const confirmed = confirm("Are you sure you want to quit the AI game?");
    if (!confirmed) return;

    try {
      await this.gameService.abortGame(this.currentSession.sessionId);
      this.stopGameLoop();
      navigate("/");
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


 
  

}