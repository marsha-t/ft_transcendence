import { IComponent } from "../components/IComponent";
import { navigate, createButtonStyle } from "../utils.js";
import { apiServices } from "../services/ApiServices.js";
import { TournamentStore } from "../services/tournament/TournamentStore.js";
import mermaid from "mermaid";

export class TournamentResults implements IComponent {
  private container!: HTMLElement;
  private tournamentId: number;

  constructor(tournamentId: number) {
    this.tournamentId = tournamentId;

    mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  themeVariables: {
    fontFamily: '"Press Start 2P", monospace',
    primaryColor: "#0f172a",
    primaryTextColor: "#ffffff",
  },
});
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

    // Add bracket placeholder
    const bracketContainer = document.createElement("div");
    bracketContainer.id = "mermaid-bracket";
    bracketContainer.className = "w-full flex justify-center mt-8 mb-12";
    this.container.appendChild(bracketContainer);

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

  // ----- MERMAID INTEGRATION -----
  private renderBracket(bracket: any[]) {
    const container = document.getElementById("mermaid-bracket");
    if (!container) return;

    const rounds = this.organizeRounds(bracket);
    const mermaidText = this.buildMermaidBracket(rounds);

    mermaid
      .render("tournamentDiagram", mermaidText)
      .then(({ svg }) => {
        container.innerHTML = svg;
      })
      .catch((err) => {
        console.error("Mermaid rendering error:", err);
        container.textContent = "Failed to render bracket.";
      });
  }

private buildMermaidBracket(rounds: any[][]): string {
  let diagram = `graph TB\n\n`;

  const sanitize = (name: any): string => {
    if (!name || name === "null" || name.trim?.() === "") return "-";
    return String(name).replace(/"/g, "'");
  };

  // Maps
  const playerNodeMap = new Map<string, string>();
  let playerIdCounter = 1;

  const getPlayerNode = (name: string) => {
    const clean = sanitize(name);
    if (!playerNodeMap.has(clean)) {
      playerNodeMap.set(clean, `P${playerIdCounter++}`);
    }
    return playerNodeMap.get(clean)!;
  };

  // Storage
  const playerNodes: string[] = [];
  const winnerNodesByRound: Record<number, string[]> = {};
  const fakeMatchById: Record<string, boolean> = {};

  // -----------------------------------------
  // ROUND 1 (players → winners)
  // -----------------------------------------
  winnerNodesByRound[1] = [];

  rounds[0].forEach((match, idx) => {
    const p1 = sanitize(match.player1);
    const p2 = sanitize(match.player2);
    const w = sanitize(match.winner);

    const p1Id = getPlayerNode(p1);
    const p2Id = getPlayerNode(p2);

    const winnerId = `R1W${idx + 1}`;

    const isFake = (p1 === "-" && p2 === "-");
    fakeMatchById[winnerId] = isFake;

    // Only draw edges if player is real
    if (p1 !== "-") {
      diagram += `    ${p1Id}["${p1}"] --> ${winnerId}["${w}"]\n`;
    }
    if (p2 !== "-") {
      diagram += `    ${p2Id}["${p2}"] --> ${winnerId}\n`;
    }
    diagram += "\n";

    // Track players and round winners
    if (p1 !== "-") playerNodes.push(p1Id);
    if (p2 !== "-") playerNodes.push(p2Id);

    winnerNodesByRound[1].push(winnerId);
  });

  // -----------------------------------------
  // HIGHER ROUNDS
  // -----------------------------------------
  for (let r = 1; r < rounds.length; r++) {
    const nextRound = r + 1;
    winnerNodesByRound[nextRound] = [];

    rounds[r].forEach((match, idx) => {
      const prev1 = `R${r}W${idx * 2 + 1}`;
      const prev2 = `R${r}W${idx * 2 + 2}`;

      const w = sanitize(match.winner);
      const winnerId = `R${nextRound}W${idx + 1}`;

      // Fake if both parents are fake
      const parent1Fake = fakeMatchById[prev1];
      const parent2Fake = fakeMatchById[prev2];
      const isFake = parent1Fake && parent2Fake;

      fakeMatchById[winnerId] = isFake;

      // Draw only real edges
      if (!parent1Fake) {
        diagram += `    ${prev1} --> ${winnerId}["${w}"]\n`;
      }
      if (!parent2Fake) {
        diagram += `    ${prev2} --> ${winnerId}\n`;
      }
      diagram += "\n";

      winnerNodesByRound[nextRound].push(winnerId);
    });
  }

  // -----------------------------------------
  // FINAL WINNER
  // -----------------------------------------
  const maxRound = rounds.length;
  const finalWinnerId =
    winnerNodesByRound[maxRound][winnerNodesByRound[maxRound].length - 1];

  // -----------------------------------------
  // STYLING
  // -----------------------------------------
  diagram += `
%% Arrow style
linkStyle default stroke:#d1d5db,stroke-width:2px,curve:0.3;

%% Player nodes
classDef player fill:#0f172a,stroke-width:0,color:white;

%% Round winners (light → dark green outlines)
classDef r1 fill:#0f172a,stroke:#5BAA6B,stroke-width:2px,color:white;
classDef r2 fill:#0f172a,stroke:#4ECA6C,stroke-width:2px,color:white;
classDef r3 fill:#0f172a,stroke:#85EAA0,stroke-width:3px,color:white;
classDef r4 fill:#0f172a,stroke:#a8ffbf,stroke-width:3.5px,color:white;

%% Final winner
classDef winner fill:#059669,stroke:#34d399,stroke-width:3px,color:white;
`;

  // Players → class 'player'
  for (const id of playerNodes) {
    diagram += `class ${id} player;\n`;
  }

  // Round winners → class r1, r2, r3...
  for (let r = 1; r <= maxRound; r++) {
    const className = `r${Math.min(r, 4)}`;
    for (const id of winnerNodesByRound[r]) {
      diagram += `class ${id} ${className};\n`;
    }
  }

  // Final winner class
  diagram += `class ${finalWinnerId} winner;\n`;

  return diagram;
}



  private organizeRounds(bracket: any[]) {
    const totalMatches = bracket.length;
    if (totalMatches === 0) return [];

    const numPlayers = totalMatches + 1;
    const round1Size = Math.ceil(numPlayers / 2);

    const rounds: any[][] = [];

    rounds.push(bracket.slice(0, round1Size));

    let index = round1Size;
    let currentRoundSize = Math.ceil(round1Size / 2);

    while (index < totalMatches) {
      const nextRound = bracket.slice(index, index + currentRoundSize);
      rounds.push(nextRound);

      index += currentRoundSize;
      currentRoundSize = Math.ceil(currentRoundSize / 2);
    }

    return rounds;
  }

  // ----- END MERMAID INTEGRATION -----

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
    newBtn.textContent = "Start New Tournament";
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
