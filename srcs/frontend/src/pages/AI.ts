// src/pages/AI.ts

import { IComponent } from "../components/IComponent.js";
import { PongGame } from "../graphics/PongGame.js";
import { PlayerSide } from "../services/game/types.js";
import { GameConfig } from "../graphics/GameConfig.js";
import { navigate } from "../utils";

export class AI implements IComponent {
  private container!: HTMLElement;
  private canvas: HTMLCanvasElement;
  
  private username: string = 'Player';

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 900;
    this.canvas.height = 500;
  }

  public render(): HTMLElement {
    this.container = document.createElement("div");
    this.container.className =
      "flex flex-col items-center min-h-[80vh] p-20 bg-background rounded-[30px] ml-6 mr-6";

    this.createTitleContainer();
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

  }

  private createControlsContainer(): void {
    const controlsContainer = document.createElement("div");
    controlsContainer.className =
      "flex flex-row gap-4 items-center justify-center pt-10";

    // const startBtn = this.makeButton("Start Game", "start-btn", () =>
    //   this.startGame()
    // );
    // startBtn.style.display = "block";

    // const pauseBtn = this.makeButton("Pause", "pause-btn", () =>
    //   this.pauseGame() 
    // );

    // const quitBtn = this.makeButton("Quit Game", "quit-btn", () =>
    //   this.quitGame()
    // );

    // controlsContainer.appendChild(startBtn);
    // controlsContainer.appendChild(pauseBtn);
    // controlsContainer.appendChild(quitBtn);

    this.container.appendChild(controlsContainer);
  }

  private makeButton(label: string, id: string, handler: () => void
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

 
  

}