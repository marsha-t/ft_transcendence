import { IComponent } from "../components/IComponent";
import { navigate } from "../utils.js";
import { apiServices } from "../services/ApiServices.js";
import { Game } from "./Game.js";
import {showConfirmation} from "../utils/profileUtils";
import { TournamentStore } from "../services/tournament/TournamentStore.js";

export class TournamentMatch implements IComponent {
  private container!: HTMLElement;
  private tournamentId: number;
  private gameInstance: Game | null = null;
  private hasEnded: boolean = false;

  constructor(tournamentId: number) {
    this.tournamentId = tournamentId;
  }

  public render(): HTMLElement {
    this.loadStyles();

    const page = document.createElement("div");
    page.className = "tournament-page";

    this.container = document.createElement("div");
    this.container.className = "tournament-match";

    this.loadNextMatch();
    page.appendChild(this.container);
    return page;
  }

  private async loadNextMatch() {
    try {
      this.container.innerHTML = `<div class="loading-text">Loading next match...</div>`;

      const response = await apiServices.tournament.getNextMatch(
        this.tournamentId
      );
      if (!response.success) {
        this.container.textContent = response.message || "Failed to load match";
        return;
      }
      const data = response.data;
      if (!data?.nextMatch) {
        this.hasEnded = true;
        this.cleanup();
        navigate("/tournament/results", { tournamentId: this.tournamentId });
        return;
      }
      const { matchIndex, player1, player2, gameSessionId } = data.nextMatch;
      this.renderMatch(matchIndex, player1, player2, gameSessionId);
    } catch (err) {
      console.error("Error loading match:", err);
      this.container.textContent = "Error loading match.";
    }
  }
  private renderMatch(
    matchIndex: number,
    p1: any,
    p2: any,
    gameSessionId: number
  ) {
    this.container.innerHTML = "";

    const matchInfo = document.createElement("div");
    matchInfo.className = "match-info";

    const h3 = document.createElement("h3");
    h3.textContent = `Match ${matchIndex}`;
    matchInfo.appendChild(h3);

    const playerContainer = document.createElement('div');
    playerContainer.className = 'player-container';

    const p1Box = document.createElement('div');
    p1Box.className = 'player-box';
    p1Box.textContent = p1?.displayName ?? "Player 1";

    const vs = document.createElement('div');
    vs.className = 'vs-text';
    vs.textContent = "VS";

    const p2Box = document.createElement('div');
    p2Box.className = 'player-box';
    p2Box.textContent = p2?.displayName ?? "Player 2";

    playerContainer.append(p1Box, vs, p2Box);
    matchInfo.appendChild(playerContainer);

    this.container.appendChild(matchInfo);

    const readyContainer = document.createElement("div");
    readyContainer.className = "ready-container";

    const startBtn = document.createElement("button");
    startBtn.textContent = "Start Match";
    startBtn.className = "ready-btn";
    startBtn.addEventListener("click", () =>
      this.startGame(gameSessionId, p1, p2)
    );
    readyContainer.appendChild(startBtn);
    this.container.appendChild(readyContainer);
  }

  private startGame(gameSessionId: number, p1: any, p2: any) {
    
    TournamentStore.onMatchEnd = () => this.loadNextMatch();
    TournamentStore.tournamentId = this.tournamentId;
    
    this.container.innerHTML = "";
    
    this.gameInstance = new Game({
      sessionId: Number(gameSessionId),
      isTournament: true,
      tournamentId: this.tournamentId, 
      displayNames: {
        leftName: p1?.displayName ?? "Player 1",
        rightName: p2?.displayName ?? "Player 2",
      },
      onMatchEnd: () => this.loadNextMatch(),
    });
    this.container.appendChild(this.gameInstance.render());
  }
  private loadStyles() {
    if (document.getElementById("tournament-match-styles")) return;
    const link = document.createElement("link");
    link.id = "tournament-match-styles";
    link.rel = "stylesheet";
    link.href = "/styles/TournamentMatch.css";
    document.head.appendChild(link);
  }

  public cleanup() {
    if (this.gameInstance) {
      this.gameInstance.terminate?.();
      this.gameInstance = null;
    }
  }
  public async canDeactivate(): Promise<boolean> {
     if (TournamentStore.isInternalTournamentNavigation) {
        TournamentStore.isInternalTournamentNavigation = false;
        return true;
    }
    if (this.hasEnded) return true;
     const confirmLeave = showConfirmation("A tournament is in progress. Leaving will abort it.", "Please Confirm", true);
    if (!confirmLeave) return false;
    try {
      if (this.gameInstance) {
        this.gameInstance.terminate?.();
      }

      await apiServices.tournament.updateTournamentStatus(
        this.tournamentId,
        "ABORTED"
      );
    } catch (err) {
      console.error("Failed to abort tournament:", err);
    }
    return true;
  }
}
