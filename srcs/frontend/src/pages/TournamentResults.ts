import { IComponent } from "../components/IComponent";
import { navigate, createButtonStyle } from "../utils.js";
import { apiServices } from "../services/ApiServices.js";
import { TournamentStore } from "../services/tournament/TournamentStore.js";
import { t } from "../services/i18n/i18nService.js";

export class TournamentResults implements IComponent {
  private container!: HTMLElement;
  private tournamentId: number;

  constructor(tournamentId: number) {
    this.tournamentId = tournamentId;
  }

  public render(): HTMLElement {
    const page = document.createElement("div");
    page.className =
      "min-h-screen flex justify-center items-start pt-12 font-['Press_Start_2P'] text-[var(--color-text-yellow)] bg-[var(--color-background)]";

    this.container = document.createElement("div");
    this.container.className =
      "bg-[var(--color-background)] rounded-xl px-16 py-8 max-w-[900px] w-full flex flex-col items-center text-center";

    const h2 = document.createElement("h2");
    h2.textContent = "Tournament Results";
    h2.className = "text-[1.5rem] text-[var(--color-text-white)] mb-10";
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

      const { champion, bracket, stats } = response.data.results;

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
    championDiv.className = "mb-12";

    championDiv.innerHTML = `
      <div class="flex flex-col items-center">
        <span class="text-[1.8rem] mb-2">🏆</span>
        <div class="bg-[var(--color-button)] text-[var(--color-text-white)] px-4 py-2 rounded-lg text-[1rem] font-bold">
          ${champion ?? "-"}
        </div>
      </div>
    `;

    this.container.appendChild(championDiv);
  }

  private renderBracket(bracket: any[]) {
    const bracketDiv = document.createElement("div");
    bracketDiv.className =
      "flex flex-row justify-center items-center gap-24 relative my-8 mb-12 w-full";

    const rounds = this.organizeRounds(bracket);

    rounds.forEach((round) => {
      const roundDiv = document.createElement("div");
      roundDiv.className = "flex flex-col items-start justify-center gap-12";

      round.forEach((match) => {
        const matchDiv = document.createElement("div");
        matchDiv.className =
          "relative flex flex-col items-start justify-center gap-4";

        // curved connector (Tailwind arbitrary pseudo-element)
        matchDiv.classList.add(
          "after:content-['']",
          "after:absolute",
          "after:-right-12",
          "after:top-[25%]",
          "after:w-12",
          "after:h-1/2",
          "after:border-r-2",
          "after:border-t-2",
          "after:border-b-2",
          "after:border-[var(--color-border-green)]",
          "after:rounded-tr-xl",
          "after:rounded-br-xl"
        );

        matchDiv.innerHTML = `
          <div class="min-w-[140px] border-2 border-[var(--color-border-green)] bg-[var(--color-background)] text-[var(--color-text-white)] rounded-md px-4 py-2 ${
            match.winner === match.player1
              ? "bg-[var(--color-button)] font-bold"
              : ""
          }">${match.player1 ?? "-"}</div>

          <div class="min-w-[140px] border-2 border-[var(--color-border-green)] bg-[var(--color-background)] text-[var(--color-text-white)] rounded-md px-4 py-2 ${
            match.winner === match.player2
              ? "bg-[var(--color-button)] font-bold"
              : ""
          }">${match.player2 ?? "-"}</div>
        `;

        roundDiv.appendChild(matchDiv);
      });

      bracketDiv.appendChild(roundDiv);
    });

    // Final winner column
    const last = rounds[rounds.length - 1];
    if (last && last.length > 0) {
      const finalWinner = last[0].winner;

      if (finalWinner) {
        const winnerRound = document.createElement("div");
        winnerRound.className = "flex items-center justify-center relative";

        // left connector line
        winnerRound.classList.add(
          "before:content-['']",
          "before:absolute",
          "before:-left-12",
          "before:w-12",
          "before:h-[2px]",
          "before:bg-[var(--color-border-green)]"
        );

        const winnerBox = document.createElement("div");
        winnerBox.className = "flex items-center";

        winnerBox.innerHTML = `
          <div class="min-w-[140px] bg-[var(--color-button)] text-[var(--color-text-white)] font-bold rounded-md px-4 py-2">
            ${finalWinner}
          </div>
        `;

        winnerRound.appendChild(winnerBox);
        bracketDiv.appendChild(winnerRound);
      }
    }

    this.container.appendChild(bracketDiv);
  }

  private organizeRounds(bracket: any[]) {
    if (bracket.length <= 2) return [bracket];
    const half = Math.ceil(bracket.length / 2);
    return [bracket.slice(0, half), bracket.slice(half)];
  }

  private renderStats(stats: any) {
    const statsDiv = document.createElement("div");
    statsDiv.className = "text-[var(--color-text-white)] mb-10";

    statsDiv.innerHTML = `
      <h3 class="text-[1rem] mb-4">Stats</h3>
      <p>Total Matches: ${stats.totalMatches}</p>
      <p>Played Matches: ${stats.playedMatches}</p>
    `;

    this.container.appendChild(statsDiv);
  }

  private renderActions() {
    const btnContainer = document.createElement("div");
    btnContainer.className = "flex justify-center mt-8";

    const newBtn = document.createElement("button");
    newBtn.textContent = t("tournament.startNewTournamentBtn") as string;
    newBtn.className = createButtonStyle(
      "w-auto h-[50px] text-[16px]",
      "green"
    );
    newBtn.addEventListener("click", () => navigate("/tournament/setup"));

    btnContainer.appendChild(newBtn);
    this.container.appendChild(btnContainer);
  }
  
  public async canDeactivate() {
    TournamentStore.tournamentId = null;
    TournamentStore.onMatchEnd = null;
    TournamentStore.isInternalTournamentNavigation = false;
    localStorage.removeItem("activeTournament");

    return true;
  }
}
