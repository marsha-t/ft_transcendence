import { IComponent } from "../components/IComponent";
import { navigate } from "../utils.js";
import { apiServices } from "../services/ApiServices.js";

export class TournamentResults implements IComponent {
  private container!: HTMLElement;
  private tournamentId: number;

  constructor(tournamentId: number) {
    this.tournamentId = tournamentId;
  }

  public render(): HTMLElement {
    this.loadStyles();
    localStorage.removeItem("activeTournament");

    const page = document.createElement("div");
    page.className = "tournament-page";

    this.container = document.createElement("div");
    this.container.className = "tournament-results";

    const h2 = document.createElement("h2");
    h2.textContent = "Tournament Results";
    this.container.appendChild(h2);

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

      this.renderChampion(champion);
      this.renderBracket(bracket);
      this.renderStats(stats);
      this.renderActions();
    } catch (err) {
      console.error("Error loading results:", err);
      this.container.textContent = "Error loading results.";
    }
  }

  private renderChampion(champion: string | null) {
    const championDiv = document.createElement("div");
    championDiv.className = "champion-section";
    championDiv.innerHTML = `
		<div class="champion-wrapper">
		<span class="trophy-icon">🏆</span>
		<div class="champion-name">${champion ?? "-"}</div>
		</div>
  	`;

    this.container.appendChild(championDiv);
  }


  private renderBracket(bracket: any[]) {
  const bracketDiv = document.createElement("div");
  bracketDiv.className = "bracket-tree";

  const rounds = this.organizeRounds(bracket);

  rounds.forEach((round, i) => {
    const roundDiv = document.createElement("div");
    roundDiv.className = "round";

    round.forEach((match) => {
      const matchDiv = document.createElement("div");
      matchDiv.className = "match";
      matchDiv.innerHTML = `
        <div class="player ${match.winner === match.player1 ? "winner" : ""}">
          ${match.player1 ?? "-"}
        </div>
        <div class="player ${match.winner === match.player2 ? "winner" : ""}">
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
      winnerRound.className = "round final-round";

      const winnerBox = document.createElement("div");
      winnerBox.className = "winner-box";
      winnerBox.innerHTML = `
        <div class="player winner">${finalWinner}</div>
      `;

      winnerRound.appendChild(winnerBox);
      bracketDiv.appendChild(winnerRound);
    }
  }

  this.container.appendChild(bracketDiv);
}


/**
 * Group matches by round — this depends on your backend structure.
 * If each match has `round` info, just group by that.
 * Otherwise, this is a simple mock to create one or two rounds visually.
 */
private organizeRounds(bracket: any[]) {
  // Example: if you have 4 players, this creates two rounds
  if (bracket.length <= 2) return [bracket];
  const half = Math.ceil(bracket.length / 2);
  return [bracket.slice(0, half), bracket.slice(half)];
}

  private renderStats(stats: any) {
    const statsDiv = document.createElement("div");
    statsDiv.className = "stats-section";
    statsDiv.innerHTML = `
				<h3>Stats</h3>
				<p>Total Matches: ${stats.totalMatches}</p>
				<p>Played Matches: ${stats.playedMatches}</p>
			`;
    this.container.appendChild(statsDiv);
  }
  private renderActions() {
    const btnContainer = document.createElement("div");
    btnContainer.className = "results-actions";

    const newBtn = document.createElement("button");
    newBtn.textContent = "Start New Tournament";
    newBtn.className = "new-tournament-btn";
    newBtn.addEventListener("click", () => navigate("/tournament/setup"));

    btnContainer.appendChild(newBtn);
    this.container.appendChild(btnContainer);
  }

  private loadStyles() {
    if (document.getElementById("tournament-results-styles")) return;
    const link = document.createElement("link");
    link.id = "tournament-results-styles";
    link.rel = "stylesheet";
    link.href = "/styles/TournamentResults.css";
    document.head.appendChild(link);
  }
}
