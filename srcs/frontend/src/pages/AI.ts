// srcs/frontend/src/pages/AI.ts
import { IComponent } from "../components/IComponent.js";
import { navigate } from "../utils.js";
import { PongGame } from "../graphics/PongGame.js";
import { aiServices } from "../services/ai/AiServices.js";

export class AI implements IComponent {
  private container!: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private pongGame!: PongGame;
  private gameId!: number;

  // We track scores ourselves (no need to touch Paddle.ts)
  private playerScore = 0;
  private aiScore = 0;

  render(): HTMLElement {
    const page = document.createElement("div");
    page.className = "flex flex-col items-center min-h-screen bg-gradient-to-b from-black to-blue-900 p-10";

    page.innerHTML = `
      <div class="bg-black/80 rounded-3xl p-16 shadow-2xl text-center">
        <h1 class="text-6xl font-bold text-green-400 mb-12">PLAY VS AI</h1>
        <div class="grid grid-cols-3 gap-8 mb-12">
          <button data-diff="easy"   class="px-12 py-8 text-4xl bg-gray-800 border-4 border-gray-600 rounded-2xl hover:border-green-500 transition">EASY</button>
          <button data-diff="medium" class="px-12 py-8 text-4xl bg-gray-800 border-4 border-yellow-600 rounded-2xl active-scale">MEDIUM</button>
          <button data-diff="hard"   class="px-12 py-8 text-4xl bg-gray-800 border-4 border-red-600 rounded-2xl hover:border-red-500 transition">HARD</button>
        </div>
        <div class="flex justify-center gap-12">
          <button id="start" class="px-20 py-10 text-5xl bg-green-500 text-black font-bold rounded-2xl hover:bg-green-400 transition">START</button>
          <button id="back"  class="px-16 py-10 text-3xl bg-gray-700 rounded-2xl hover:bg-gray-600 transition">Back</button>
        </div>
      </div>
    `;

    this.container = page;
    let difficulty: "easy" | "medium" | "hard" = "medium";

    page.querySelectorAll("[data-diff]").forEach(btn => {
      btn.addEventListener("click", () => {
        page.querySelectorAll("[data-diff]").forEach(b => b.classList.remove("border-yellow-600", "border-green-500", "border-red-600"));
        btn.classList.add(
          btn.getAttribute("data-diff") === "easy"   ? "border-green-500" :
          btn.getAttribute("data-diff") === "hard"   ? "border-red-600" : "border-yellow-600"
        );
        difficulty = btn.getAttribute("data-diff") as any;
      });
    });

    page.querySelector("#start")!.addEventListener("click", () => this.startGame(difficulty));
    page.querySelector("#back")!.addEventListener("click", () => navigate("/dashboard"));

    return page;
  }

  private async startGame(difficulty: "easy" | "medium" | "hard") {
    this.container.innerHTML = `<div class="text-6xl text-white">Loading AI...<br><span class="text-8xl text-yellow-400">${difficulty.toUpperCase()}</span></div>`;

    const res = await aiServices.startGame(difficulty, "left"); // AI on LEFT
    if (!res.success || !res.data) {
      this.container.innerHTML = `<div class="text-4xl text-red-500">Failed to start AI game<br><button id="back" class="mt-8 px-8 py-4 bg-gray-700 rounded">Back</button></div>`;
      this.container.querySelector("#back")!.addEventListener("click", () => this.render());
      return;
    }

    this.gameId = res.data.gameId;
    this.playerScore = 0;
    this.aiScore = 0;

    // Create canvas
    this.canvas = document.createElement("canvas");
    this.canvas.width = 900;
    this.canvas.height = 500;
    this.canvas.className = "rounded-3xl shadow-2xl border-8 border-green-500";

    // Create game
    this.pongGame = new PongGame(this.canvas, (side) => {
      if (side === "LEFT") this.aiScore++;
      if (side === "RIGHT") this.playerScore++;

      // Update backend
      aiServices.updateScore(this.gameId, this.playerScore, this.aiScore);

      // Check winner
      if (this.playerScore >= 10 || this.aiScore >= 10) {
        const winner = this.playerScore >= 10 ? "player" : "ai";
        aiServices.finishGame(this.gameId, winner, this.playerScore, this.aiScore);
        setTimeout(() => {
          alert(winner === "player" ? "YOU WIN!" : `AI WINS ${this.aiScore}-${this.playerScore}\nBETTER LUCK NEXT TIME`);
          navigate("/dashboard");
        }, 1500);
      }
    });

    // Start AI brain
    this.startAIBrain();

    // Show game
    this.container.innerHTML = `
      <div class="text-center mb-8">
        <h1 class="text-6xl font-bold text-white">YOU <span class="text-green-400">vs</span> AI (${difficulty.toUpperCase()})</h1>
        <div class="text-8xl mt-4 text-white"> ${this.playerScore} - ${this.aiScore} </div>
      </div>
    `;
    this.container.appendChild(this.canvas);
  }

  private startAIBrain() {
    let lastCall = 0;
    const loop = async () => {
      if (!this.pongGame) return;

      const now = Date.now();
      if (now - lastCall > 950) { // 1-second rule
        lastCall = now;

        const state = {
          gameState: {
            ball: {
              x: this.pongGame.ball.mesh.position.x,
              z: this.pongGame.ball.mesh.position.z,
              velocityX: this.pongGame.ball.speed.x,
              velocityZ: this.pongGame.ball.speed.z,
            },
            playerPaddle: { x: this.pongGame.rightPaddle.mesh.position.x, z: this.pongGame.rightPaddle.mesh.position.z },
            aiPaddle:     { x: this.pongGame.leftPaddle.mesh.position.x,  z: this.pongGame.leftPaddle.mesh.position.z  },
            tableBounds: { zMin: -10, zMax: 10 },
          }
        };

        const res = await aiServices.getMove(this.gameId, state);
        if (res.success && res.data?.move) {
          // if (res.data.move === "UP")   this.pongGame.leftPaddle.moveUp();
          // if (res.data.move === "DOWN") this.pongGame.leftPaddle.moveDown();
        }
      }

      // Update score display
      if (this.container) {
        const scoreEl = this.container.querySelector("div.text-8xl");
        if (scoreEl) scoreEl.textContent = ` ${this.playerScore} - ${this.aiScore} `;
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  cleanup() {
    this.pongGame?.pause();
  }

  async canDeactivate(): Promise<boolean> {
    return confirm("Leave AI game?");
  }
}