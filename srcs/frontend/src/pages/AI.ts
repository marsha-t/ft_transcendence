// src/pages/AI.ts

import { IComponent } from "../components/IComponent.js";
import { PongGame } from "../graphics/PongGame.js";
import { aiServices } from "../services/ai/AiServices.js";
import { PlayerSide } from "../services/game/types.js";
import { GameConfig } from "../graphics/GameConfig.js";
import { navigate } from "../utils";

export class AI implements IComponent {
  private container!: HTMLElement;
  private canvas: HTMLCanvasElement;
  private pongGame!: PongGame;

  private gameId: number | null = null;
  private difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  private aiSide: 'left' | 'right' = 'left'; // AI plays on LEFT
  
  private isScoring: boolean = false;
  private isGameRunning: boolean = false;
  private hasEndedNaturally: boolean = false;
  
  private aiUpdateInterval: number | null = null;
  private currentAIMove: 'UP' | 'DOWN' | 'NONE' = 'NONE';
  
  private playerScore: number = 0;
  private aiScore: number = 0;
  
  private username: string = 'Player';

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 900;
    this.canvas.height = 500;
    
    // Get username from localStorage or cookies
    this.username = this.getCurrentUsername();
  }

  private getCurrentUsername(): string {
    // Try to get username from your auth system
    // Adjust this based on how your app stores user info
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.username || 'Player';
      }
    } catch (e) {
      console.error('Failed to get username:', e);
    }
    return 'Player';
  }

  public render(): HTMLElement {
    this.container = document.createElement("div");
    this.container.className =
      "flex flex-col items-center min-h-[80vh] p-20 bg-background rounded-[30px] ml-6 mr-6";

    this.createTitleContainer();
    this.createDifficultySelector();
    this.createCanvas();
    this.createControlsContainer();

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

  private createDifficultySelector(): void {
    const selectorContainer = document.createElement("div");
    selectorContainer.className = "flex flex-col items-center gap-3 mb-4";
    selectorContainer.id = "difficulty-selector";

    const label = document.createElement("label");
    label.textContent = "Select Difficulty:";
    label.className = "text-white text-lg font-semibold";

    const select = document.createElement("select");
    select.id = "difficulty-select";
    select.className = "w-48 h-10 rounded-lg px-3 bg-white text-black font-medium";

    const difficulties = [
      { value: 'easy', label: 'Easy 😊' },
      { value: 'medium', label: 'Medium 🤔', selected: true },
      { value: 'hard', label: 'Hard 💀' }
    ];

    difficulties.forEach(diff => {
      const option = document.createElement("option");
      option.value = diff.value;
      option.textContent = diff.label;
      if (diff.selected) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      this.difficulty = (e.target as HTMLSelectElement).value as 'easy' | 'medium' | 'hard';
    });

    selectorContainer.appendChild(label);
    selectorContainer.appendChild(select);
    this.container.appendChild(selectorContainer);
  }

  private createCanvas(): void {
    const canvasContainer = document.createElement("div");
    canvasContainer.className = "relative";

    this.canvas.className =
      "max-w-full h-auto rounded-[30px] max-[800px]:w-full max-[800px]:aspect-[8/5]";
    canvasContainer.appendChild(this.canvas);

    // Score Display
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

    // Initialize PongGame with score callback
    this.pongGame = new PongGame(this.canvas, (side: "LEFT" | "RIGHT") => {
      if (!this.isScoring) {
        this.isScoring = true;
        this.handleScore(side).then(() => {
          setTimeout(() => (this.isScoring = false), 1000);
        });
      }
    });
  }

  private createControlsContainer(): void {
    const controlsContainer = document.createElement("div");
    controlsContainer.className =
      "flex flex-row gap-4 items-center justify-center pt-10";

    const startBtn = this.makeButton("Start Game", "start-btn", () =>
      this.startGame()
    );
    startBtn.style.display = "block";

    const pauseBtn = this.makeButton("Pause", "pause-btn", () =>
      this.pauseGame()
    );

    const quitBtn = this.makeButton("Quit Game", "quit-btn", () =>
      this.quitGame()
    );

    controlsContainer.appendChild(startBtn);
    controlsContainer.appendChild(pauseBtn);
    controlsContainer.appendChild(quitBtn);

    this.container.appendChild(controlsContainer);
  }

  private makeButton(
    label: string,
    id: string,
    handler: () => void
  ): HTMLButtonElement {
    const btn = document.createElement("button");
    btn.id = id;
    btn.className =
      "w-48 h-12 bg-color-green text-color_white font-bold rounded-lg " +
      "shadow-[0_5px_0_var(--color-button-second)] " +
      "hover:shadow-[0_2px_0_var(--color-button-second)] active:shadow-none " +
      "hover:translate-y-1 active:translate-y-2 " +
      "transition-all duration-150";
    btn.style.display = "none";
    btn.textContent = label;
    btn.addEventListener("click", handler);
    return btn;
  }

  // GAME LOGIC

  private async startGame(): Promise<void> {
    try {
      // Start AI game session on backend
      const response = await aiServices.startGame(this.difficulty, this.aiSide);
      
      if (!response.success || !response.data) {
        alert('Failed to start AI game');
        return;
      }

      this.gameId = response.data.gameId;
      console.log('✅ AI Game started:', response.data);

      // Hide difficulty selector and start button
      const diffSelector = document.getElementById('difficulty-selector');
      const startBtn = document.getElementById('start-btn');
      if (diffSelector) diffSelector.style.display = 'none';
      if (startBtn) startBtn.style.display = 'none';

      // Show game controls
      const pauseBtn = document.getElementById('pause-btn');
      const quitBtn = document.getElementById('quit-btn');
      if (pauseBtn) pauseBtn.style.display = 'block';
      if (quitBtn) quitBtn.style.display = 'block';

      // Start game loop
      this.isGameRunning = true;
      this.pongGame.resume();

      // Start AI update loop (1 request per second)
      this.startAILoop();

    } catch (error) {
      console.error('Failed to start game:', error);
      alert('Failed to start AI game');
    }
  }

  private startAILoop(): void {
    if (this.aiUpdateInterval) {
      clearInterval(this.aiUpdateInterval);
    }

    // Request AI move every 1 second
    this.aiUpdateInterval = window.setInterval(async () => {
      if (!this.isGameRunning || !this.gameId) {
        return;
      }

      await this.updateAIMove();
    }, 1000);
  }

  private async updateAIMove(): Promise<void> {
    if (!this.gameId) return;

    try {
      // Get current game state from PongGame
      const ball = this.pongGame.ball.mesh.position;
      const ballSpeed = this.pongGame.ball.speed;
      
      const leftPaddle = this.pongGame.leftPaddle.mesh.position;
      const rightPaddle = this.pongGame.rightPaddle.mesh.position;

      // Determine which paddle is AI's and which is player's
      const aiPaddle = this.aiSide === 'left' ? leftPaddle : rightPaddle;
      const playerPaddle = this.aiSide === 'left' ? rightPaddle : leftPaddle;

      // Get table bounds from GameConfig
      const tableBounds = GameConfig.tableBounds;

      // Request AI move from backend
      const response = await aiServices.getMove(this.gameId, {
        gameState: {
          ball: {
            x: ball.x,
            z: ball.z,
            velocityX: ballSpeed.x,
            velocityZ: ballSpeed.z
          },
          playerPaddle: {
            x: playerPaddle.x,
            z: playerPaddle.z
          },
          aiPaddle: {
            x: aiPaddle.x,
            z: aiPaddle.z
          },
          tableBounds: {
            zMin: tableBounds.zMin,
            zMax: tableBounds.zMax
          }
        }
      });

      if (response.success && response.data) {
        this.currentAIMove = response.data.move;
        
        // Apply AI move to paddle
        this.applyAIMove();
      }

    } catch (error) {
      console.error('Failed to get AI move:', error);
    }
  }

  private applyAIMove(): void {
    if (!this.pongGame || !this.isGameRunning) return;

    const aiPaddle = this.aiSide === 'left' 
      ? this.pongGame.leftPaddle 
      : this.pongGame.rightPaddle;

    const bounds = GameConfig.tableBounds;
    const speed = 5;
    const dt = 1 / 60; // Approximate frame time

    // Apply move (this will be called every frame by the render loop)
    // if (this.currentAIMove === 'UP') {
    //   aiPaddle.moveUp(speed, dt, bounds);
    // } else if (this.currentAIMove === 'DOWN') {
    //   aiPaddle.moveDown(speed, dt, bounds);
    // }
    // 'NONE' = no movement
  }

  // Override the PongGame's update to apply AI moves every frame
  // private overridePongGameUpdate(): void {
  //   const originalUpdate = this.pongGame.update?.bind(this.pongGame);
    
  //   this.pongGame.update = (dt: number) => {
  //     if (originalUpdate) {
  //       originalUpdate(dt);
  //     }
      
  //     // Apply AI move continuously
  //     if (this.isGameRunning) {
  //       this.applyAIMove();
  //     }
  //   };
  // }

  private async handleScore(scoringSide: PlayerSide): Promise<void> {
    if (!this.isGameRunning) return;

    // Update scores
    if (scoringSide === 'LEFT') {
      this.aiScore++;
    } else {
      this.playerScore++;
    }

    // Update display
    const leftScoreEl = document.getElementById('left-score');
    const rightScoreEl = document.getElementById('right-score');
    if (leftScoreEl) leftScoreEl.textContent = this.aiScore.toString();
    if (rightScoreEl) rightScoreEl.textContent = this.playerScore.toString();

    // Update backend
    if (this.gameId) {
      await aiServices.updateScore(this.gameId, this.playerScore, this.aiScore);
    }

    // Check for game end (assuming game ends at 5 points)
    if (this.aiScore >= 5 || this.playerScore >= 5) {
      setTimeout(() => this.endGame(), 500);
    }
  }

  private pauseGame(): void {
    if (this.isGameRunning) {
      this.isGameRunning = false;
      this.pongGame.pause();
      
      const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;
      if (pauseBtn) pauseBtn.textContent = 'Resume';
    } else {
      this.isGameRunning = true;
      this.pongGame.resume();
      
      const pauseBtn = document.getElementById('pause-btn') as HTMLButtonElement;
      if (pauseBtn) pauseBtn.textContent = 'Pause';
    }
  }

  private async quitGame(): Promise<void> {
    const confirmed = confirm("Are you sure you want to quit the game?");
    if (!confirmed) return;

    this.stopGame();
    
    // Navigate back to menu or dashboard
    navigate('/');
  }

  private async endGame(): Promise<void> {
    this.hasEndedNaturally = true;
    this.stopGame();

    const winner = this.playerScore > this.aiScore ? 'player' : 'ai';
    const winnerName = winner === 'player' ? this.username : 'AI';

    // Finish game on backend
    if (this.gameId) {
      await aiServices.finishGame(this.gameId, winner, this.playerScore, this.aiScore);
    }

    alert(`Game Over! ${winnerName} wins! Score: ${this.playerScore} - ${this.aiScore}`);

    // Navigate to results or back to menu
    navigate('/');
  }

  private stopGame(): void {
    this.isGameRunning = false;
    this.pongGame.pause();

    if (this.aiUpdateInterval) {
      clearInterval(this.aiUpdateInterval);
      this.aiUpdateInterval = null;
    }
  }

  // CLEANUP

  public async canDeactivate(): Promise<boolean> {
    if (this.hasEndedNaturally) {
      this.cleanup();
      return true;
    }

    const confirmLeave = confirm("Leaving will stop the current AI game.");
    if (confirmLeave) {
      this.cleanup();
    }
    return confirmLeave;
  }

  public terminate(): void {
    this.cleanup();
  }

  public cleanup(): void {
    this.stopGame();
    this.pongGame = null as any;
    this.gameId = null;
  }
}