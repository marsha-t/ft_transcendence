import { IComponent } from "../components/IComponent";
import { navigate } from "../utils.js";
import { apiServices } from "../services/ApiServices.js";
import { TournamentStore } from "../services/tournament/TournamentStore.js";

export class TournamentResults implements IComponent {
  private container!: HTMLElement;
  private tournamentId: number;

  constructor(tournamentId: number) {
    this.tournamentId = tournamentId;
  }

  public render(): HTMLElement {
    localStorage.removeItem("activeTournament");

    TournamentStore.tournamentId = null;
    TournamentStore.onMatchEnd = null;
    TournamentStore.tournamentId = null;

    const page = document.createElement("div");
    page.className = "bg-[var(--color-background)] min-h-screen w-full font-pixel text-[var(--color-text-yellow)]";

    // Main container - 2 columns (30% / 70%)
    this.container = document.createElement("div");
    this.container.className = "grid grid-cols-[0.3fr_0.7fr] gap-8 h-full";

    this.loadResults();
    page.appendChild(this.container);
    return page;
  }

  private async loadResults() {
    try {
      const response = await apiServices.tournament.getNextMatch(
        this.tournamentId
      );
      if (!response.success || !response.data || !response.data.results) {
        this.container.textContent =
          response.message || "Failed to load results";
        return;
      }
      const results = response.data.results;
      const { champion, bracket, stats } = results;

      // LEFT COLUMN (30%) - Champion + Stats + Button
      const leftColumn = document.createElement("div");
      leftColumn.className = "flex flex-col items-center justify-start bg-[var(--color-background)] rounded-xl p-8 gap-8";
      
      const h2 = document.createElement("h2");
      h2.className = "text-2xl text-[var(--color-text-white)] mb-4";
      h2.textContent = "Tournament Results";
      leftColumn.appendChild(h2);
      
      this.renderChampion(champion, leftColumn);
      this.renderStats(stats, leftColumn);
      this.renderActions(leftColumn);
      
      this.container.appendChild(leftColumn);

      // RIGHT COLUMN (70%) - Grid with 2 rows
      const rightColumn = document.createElement("div");
      rightColumn.className = "grid grid-rows-[0.6fr_0.4fr] gap-8 h-full";
      
      // TOP ROW - Bracket/Graph
      const topRow = document.createElement("div");
      topRow.className = "bg-[var(--color-background)] rounded-xl p-8 flex items-center justify-center";
      this.renderBracket(bracket, topRow);
      rightColumn.appendChild(topRow);
      
      // BOTTOM ROW - 2 columns for players
      const bottomRow = document.createElement("div");
      bottomRow.className = "grid grid-cols-2 gap-8";
      
      const player1Box = document.createElement("div");
      player1Box.className = "bg-[var(--color-background)] rounded-xl p-8 flex flex-col items-center justify-center border-2 border-[var(--color-border-green)]";
      player1Box.innerHTML = `
        <h3 class="text-xl text-[var(--color-text-white)] mb-4">Player 1</h3>
        <p class="text-[var(--color-text-white)]">Stats coming soon...</p>
      `;
      
      const player2Box = document.createElement("div");
      player2Box.className = "bg-[var(--color-background)] rounded-xl p-8 flex flex-col items-center justify-center border-2 border-[var(--color-border-green)]";
      player2Box.innerHTML = `
        <h3 class="text-xl text-[var(--color-text-white)] mb-4">Player 2</h3>
        <p class="text-[var(--color-text-white)]">Stats coming soon...</p>
      `;
      
      bottomRow.appendChild(player1Box);
      bottomRow.appendChild(player2Box);
      rightColumn.appendChild(bottomRow);
      
      this.container.appendChild(rightColumn);
    } catch (err) {
      console.error("Error loading results:", err);
      this.container.textContent = "Error loading results.";
    }
  }

  private renderChampion(champion: string | null, parent: HTMLElement) {
    const championDiv = document.createElement("div");
    championDiv.innerHTML = `
      <div class="flex flex-col items-center">
        <span class="text-[1.8rem] mb-2.5">🏆</span>
        <div class="w-[200px] h[300px] inline-block bg-[var(--color-button)] text-[var(--color-text-white)] px-4 py-2 rounded-lg text-base font-bold">${champion ?? "-"}</div>
      </div>
    `;

    parent.appendChild(championDiv);
  }

  private renderBracket(bracket: any[], parent: HTMLElement) {
    const bracketDiv = document.createElement("div");
    bracketDiv.className = "flex flex-row justify-center items-center gap-24 relative w-full";

    const rounds = this.organizeRounds(bracket);

    rounds.forEach((round, i) => {
      const roundDiv = document.createElement("div");
      roundDiv.className = "flex flex-col items-start justify-center gap-12";

      round.forEach((match) => {
        const matchDiv = document.createElement("div");
        matchDiv.className = "relative flex flex-col items-start justify-center gap-4 after:content-[''] after:absolute after:right-[-3rem] after:top-[25%] after:w-12 after:h-[50%] after:border-r-2 after:border-t-2 after:border-b-2 after:border-[var(--color-border-green)] after:rounded-tr-[12px] after:rounded-br-[12px]";
        
        const player1Class = match.winner === match.player1 
          ? "border-2 border-[var(--color-border-green)] rounded-md px-4 py-2 text-[var(--color-text-white)] bg-[var(--color-button)] min-w-[140px] text-left font-bold"
          : "border-2 border-[var(--color-border-green)] rounded-md px-4 py-2 text-[var(--color-text-white)] bg-[var(--color-background)] min-w-[140px] text-left";
        
        const player2Class = match.winner === match.player2 
          ? "border-2 border-[var(--color-border-green)] rounded-md px-4 py-2 text-[var(--color-text-white)] bg-[var(--color-button)] min-w-[140px] text-left font-bold"
          : "border-2 border-[var(--color-border-green)] rounded-md px-4 py-2 text-[var(--color-text-white)] bg-[var(--color-background)] min-w-[140px] text-left";
        
        matchDiv.innerHTML = `
          <div class="${player1Class}">
            ${match.player1 ?? "-"}
          </div>
          <div class="${player2Class}">
            ${match.player2 ?? "-"}
          </div>
        `;
        roundDiv.appendChild(matchDiv);
      });

      bracketDiv.appendChild(roundDiv);
    });

    // Add final winner box to the rightmost end
    const lastRound = rounds[rounds.length - 1];
    if (lastRound && lastRound.length > 0) {
      const finalWinner = lastRound[0].winner;
      if (finalWinner) {
        const winnerRound = document.createElement("div");
        winnerRound.className = "flex items-center justify-center relative before:content-[''] before:absolute before:left-[-3rem] before:w-12 before:h-0.5 before:bg-[var(--color-border-green)]";

        const winnerBox = document.createElement("div");
        winnerBox.className = "relative flex items-center";
        winnerBox.innerHTML = `
          <div class="bg-[var(--color-button)] text-[var(--color-text-white)] font-bold min-w-[140px] border-2 border-[var(--color-border-green)] rounded-md px-4 py-2 text-left">${finalWinner}</div>
        `;

        winnerRound.appendChild(winnerBox);
        bracketDiv.appendChild(winnerRound);
      }
    }

    parent.appendChild(bracketDiv);
  }

  /**
   * Group matches by round — this depends on your backend structure.
   * If each match has `round` info, just group by that.
   * Otherwise, this is a simple mock to create one or two rounds visually.
   */
  private organizeRounds(bracket: any[]) {
    if (bracket.length <= 2) return [bracket];
    const half = Math.ceil(bracket.length / 2);
    return [bracket.slice(0, half), bracket.slice(half)];
  }

  private renderStats(stats: any, parent: HTMLElement) {
    const statsDiv = document.createElement("div");
    statsDiv.className = "text-[var(--color-text-white)] mb-8 w-full";
    statsDiv.innerHTML = `
      <h3 class="mb-4 text-base">Stats</h3>
      <p>Total Matches: ${stats.totalMatches}</p>
      <p>Played Matches: ${stats.playedMatches}</p>
    `;
    parent.appendChild(statsDiv);
  }

  private renderActions(parent: HTMLElement) {
    const btnContainer = document.createElement("div");
    btnContainer.className = "flex justify-center mt-auto w-full";

    const newBtn = document.createElement("button");
    newBtn.textContent = "Start New Tournament";
    newBtn.className = "bg-[var(--color-button)] text-[var(--color-text-white)] border-none rounded-lg font-['Press_Start_2P',monospace] text-[0.7rem] px-6 py-3 cursor-pointer transition-all duration-150 hover:scale-105 hover:bg-[#6bc66f]";
    newBtn.addEventListener("click", () => navigate("/tournament/setup"));

    btnContainer.appendChild(newBtn);
    parent.appendChild(btnContainer);
  }
}