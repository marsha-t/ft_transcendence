import { IComponent } from "../components/IComponent";
import { navigate, NavigationState } from "../utils/commonUtils.js";
import { createButtonStyle } from "../utils/uiUtils.js";
import { apiServices } from "../services/ApiServices.js";
import { resetTournamentStore } from "../services/tournament/TournamentStore.js";
import mermaid from "mermaid";
import { t } from "../services/i18n/i18nService.js";

let mermaidInitialized = false;

export class TournamentResults implements IComponent {
  private container!: HTMLElement;
  private tournamentId: number;
  private destroyed = false; // Guards async callbacks from changing DOM if router navigates away before they resolve

  /*
  - Mermaid is initialized here since this is the only page that uses it
    - Initialization is global and will affect all Mermaid renders
    - mermaidInitialized guards against repeated initialization across multiple visits to TournamentResults
  */
  constructor(tournamentId: number) {
    this.tournamentId = tournamentId;

    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          fontFamily: '"Nunito Sans", sans-serif',
          primaryColor: "#0f172a",
          primaryTextColor: "#ffffff",
        },
      });
      mermaidInitialized = true;
    }
  }
  
  /*
    - Render page wrapper, main container, 
      page title and mermaid bracket placeholder
    - Load results asynchronously after initialisation
  */
  public render(): HTMLElement {
    const page = document.createElement("div");
    page.className = `bg-background-primary justify-center items-center
      flex flex-col w-[calc(100%-46px)] h-[calc(100%-46px)] rounded-[16px] shadow-lg
      text-center mx-[23px] my-[23px] py-6 px-10 overflow-auto`;

    this.container = document.createElement("div");
    this.container.className =
      "bg-transparent rounded-xl px-16 py-8 max-w-[900px] h-full w-full flex flex-col items-center text-center";

    // Header
    const h2 = document.createElement("h2");
    h2.textContent = t("tournament.tournamentResults") as string;
    h2.className = "text-[1.5rem] text-text-primary mb-2";
    this.container.appendChild(h2);

    // Bracket placeholder
    const bracketContainer = document.createElement("div");
    bracketContainer.id = "mermaid-bracket";
    bracketContainer.className = "w-full flex justify-center mt-4 mb-4";
    this.container.appendChild(bracketContainer);

    this.loadResults();

    page.appendChild(this.container);
    return page;
  }

  /*
    - Fetch results from backend
    - Render champion, brackets, stats and actions (buttons)
  */
  private async loadResults() {
    if (NavigationState.activeTournamentId === null) {
      NavigationState.forceNavigate = true;
      navigate("/tournament/setup");
    }
    const response = await apiServices.tournament.getNextMatch(
      this.tournamentId
    );
    if (this.destroyed) return ;
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
  }

  /*
    - Name champion (if there aren't none, it is simply "-")
  */
  private renderChampion(champion: string | null) {
    const championDiv = document.createElement("div");
    championDiv.className = "m-4";

    championDiv.innerHTML = `
      <div class="flex flex-col items-center">
        <span class="text-[1.8rem] mb-2">🏆</span>
        <div class="bg-[var(--color-button)] text-text-primary px-4 py-2 rounded-lg text-[1rem] font-bold">
          ${champion ?? "-"}
        </div>
      </div>
    `;
    this.container.appendChild(championDiv);
  }

  /*
    - Render bracket using mermaid
    - Mermaid renders asynchronously and injects SVG into DOM
    - Errors during rendering are caught and displayed to user
  */
  private renderBracket(bracket: any[]) {
    const container = document.getElementById("mermaid-bracket");
    if (!container) return;

    const rounds = this.organizeRounds(bracket);
    const mermaidText = this.buildMermaidBracket(rounds);

    mermaid
      .render("tournamentDiagram", mermaidText)
      .then(({ svg }: { svg: string }) => {
        if (this.destroyed) return ;
        container.innerHTML = svg;
      })
      .catch((err: unknown) => {
        if (this.destroyed) return;
        console.error("Mermaid rendering error:", err);
        container.textContent = "Failed to render bracket.";
      });
  }

// Build Mermaid graph string that can be rendered into SVG bracket
/*
  - Map player names to Mermaid node (P1, P2, ...) in playerNodeMap
  - Organize matches into rounds
  - Render bracket in 3 parts: Round 1, middle rounds & final winner
  - Add styling for different classes of nodes and assign nodes to classes
*/
  private buildMermaidBracket(rounds: any[][]): string {
    let diagram = `graph TB\n\n`; // Mermaid syntax starts with this (TB: top-bottom)

    // Used to clean names - all possible 'missing' values set to "-"; 
    // Also remove possible quotes (can break Mermaid)
    const sanitize = (name: any): string => {
      if (!name || name === "null" || name.trim?.() === "") return "-";
      return String(name).replace(/"/g, "'");
    };

    const playerNodeMap = new Map<string, string>(); // player name: mermaid node ID
    let playerIdCounter = 1;

    // Used to get node ID for player
    const getPlayerNode = (name: string) => {
      const clean = sanitize(name);
      if (!playerNodeMap.has(clean)) {
        playerNodeMap.set(clean, `P${playerIdCounter++}`);
      }
      return playerNodeMap.get(clean)!;
    };

    // Storage
    const playerNodes: string[] = []; // all player node IDs for styling later
    const winnerNodesByRound: Record<number, string[]> = {}; // winners in each round
    const fakeMatchById: Record<string, boolean> = {}; // fake matches with both players missing

    // 1. Round 1: players enter directly
    winnerNodesByRound[1] = [];

    rounds[0].forEach((match, idx) => {
      const p1 = sanitize(match.player1);
      const p2 = sanitize(match.player2);
      const w = sanitize(match.winner);
      const p1Id = getPlayerNode(p1);
      const p2Id = getPlayerNode(p2);
      const winnerId = `R1W${idx + 1}`;

      // Edges are drawn from real players to winner node (unless fake match)
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

      // Update storage: track players and round winners
      if (p1 !== "-") playerNodes.push(p1Id);
      if (p2 !== "-") playerNodes.push(p2Id);
      winnerNodesByRound[1].push(winnerId);
    });

    // 2. Middle Rounds: connect previous rounds' winners to new winner nodes
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

    // 3. Final winner
    const maxRound = rounds.length;
    const finalWinnerId =
      winnerNodesByRound[maxRound][winnerNodesByRound[maxRound].length - 1];

    // 4. Styling by class (defined below)
    diagram += `
      %% Arrow style
      linkStyle default stroke:#d1d5db,stroke-width:2px,curve:0.3;

      %% Player nodes
      classDef player fill:#21447E,stroke-width:0,color:white;

      %% Round winners (light → dark green outlines)
      classDef r1 fill:#21447E,stroke:#5BAA6B,stroke-width:2px,color:white;
      classDef r2 fill:#21447E,stroke:#4ECA6C,stroke-width:2px,color:white;
      classDef r3 fill:#21447E,stroke:#85EAA0,stroke-width:3px,color:white;
      classDef r4 fill:#21447E,stroke:#a8ffbf,stroke-width:3.5px,color:white;

      %% Final winner
      classDef winner fill:#059669,stroke:#34d399,stroke-width:3px,color:white;
    `;

    // Nodes assigned to classes so different rounds have different colours
    for (const id of playerNodes) {
      diagram += `class ${id} player;\n`;
    }
    for (let r = 1; r <= maxRound; r++) {
      const className = `r${Math.min(r, 4)}`;
      for (const id of winnerNodesByRound[r]) {
        diagram += `class ${id} ${className};\n`;
      }
    }
    diagram += `class ${finalWinnerId} winner;\n`;

    return diagram;
  }

  /*
    - Organize flat list of matches into tournament rounds
    - rounds = array of arrays: e.g., [ [match, match], [match] ]
  */
  private organizeRounds(bracket: any[]) {
    const totalMatches = bracket.length;
    if (totalMatches === 0) return [];

    const numPlayers = totalMatches + 1;
    const round1Size = Math.ceil(numPlayers / 2);
    const rounds: any[][] = [];
    rounds.push(bracket.slice(0, round1Size)); // extract first 'round1Size' matches and assign them to Round 1

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

  // Render stats
  private renderStats(stats: any) {
    const statsDiv = document.createElement("div");
    statsDiv.className = "text-text-primary text-[1rem] font-bold  mb-4";

    statsDiv.innerHTML = `
      <h3 class="text-[1rem] mb-4">${t("tournament.stats") as string}</h3>
      <p>${t("tournament.totalMatches") as string}: ${stats.totalMatches}</p>
      <p>${t("tournament.playedMatches") as string}: ${stats.playedMatches}</p>
    `;
    this.container.appendChild(statsDiv);
  }

  // Render button for new tournament
  private renderActions() {
    const btnContainer = document.createElement("div");
    btnContainer.className = "flex justify-center";

    const newBtn = document.createElement("button");
    newBtn.textContent = t("tournament.startNewTournamentBtn") as string;
    newBtn.className = createButtonStyle(
      "w-auto h-[50px] text-[16px] mt-5",
      "green"
    );
    
    newBtn.addEventListener("click", () => navigate("/tournament/setup"));

    btnContainer.appendChild(newBtn);
    this.container.appendChild(btnContainer);
  }

  public async canDeactivate() {
    resetTournamentStore();
    return true;
  }

  // Note: Mermaid does not need to be cleaned up
  public cleanup() {
    this.destroyed = true;
    NavigationState.activeGameSessionId = null;
    NavigationState.activeTournamentId = null;
  }
}
