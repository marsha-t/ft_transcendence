import { IComponent } from "../components/IComponent";
import { apiServices } from "../services/ApiServices.js";
import { GameDashboard } from "../services/dashboard/types";
import { navigate, NavigationState } from "../utils/commonUtils.js";
import { TournamentStore } from "../services/tournament/TournamentStore.js";
import { createButtonStyle, getAvatarUrl, showConfirmation, showMessage } from "../utils/uiUtils";
import { t } from "../services/i18n/i18nService.js";

declare const Plotly: any;

export class GameResults implements IComponent {
  private sessionId: number;
  private isTournament: boolean;
  private onMatchEnd?: () => void;
  private dashboardData: GameDashboard | null = null;
  private container!: HTMLElement;
  private messageContainer!: HTMLDivElement;
  private resultsContainer!: HTMLDivElement;
  private tournamentId: number | null = null;
  private destroyed = false;

  /*
    - Initialize GameResults with navigation state
      - sessionId is always needed but the rest are only needed for tournaments
      - 'Save' the onMatchEnd function that is in TournamentStore when GameResults is constructed
        in case onMatchEnd in TournamentStore has changed between construction and calling of onMatchEnd
  */
  constructor(state?: any) {
    this.sessionId = state?.sessionId;
    this.isTournament = state?.isTournament ?? false;
    this.tournamentId = state?.tournamentId ?? null;

    if (this.isTournament) {
      const original = TournamentStore.onMatchEnd; 
      this.onMatchEnd = async () => {
        await original?.();
      };
    }
  }
  /*
    - Render page layout
      - Summary panel
      - Score progression chart
      - Player statistics chart (for both players)
      - Tournament navigation button if tournament
    - Trigger async data fetch and rendering
  */
  public render(): HTMLElement {
    this.container = document.createElement("div");
    this.container.className = ` bg-background-primary min-h-screen flex flex-col items-center gap-8 p-4 mx-[20px] rounded-[16px] font-nunito`;

    this.messageContainer = document.createElement("div");
    this.messageContainer.className = "w-full flex justify-center";
    this.messageContainer.style.display = "none";
    this.container.appendChild(this.messageContainer);

    const summaryDiv = document.createElement("div");
    summaryDiv.id = "summaryDiv";
    summaryDiv.className = "w-full text-center text-text-primary";

    const chartDiv = document.createElement("div");
    chartDiv.className =
      "rounded-lg bg-background-tertiary p-5 shadow-inner w-full max-w-[850px]";
    chartDiv.id = "scoreChart";
    chartDiv.style.width = "700px";
    chartDiv.style.height = "400px";

    const playersDiv = document.createElement("div");
    playersDiv.id = "playersDiv";
    playersDiv.className =
      "w-full grid grid-cols-2 gap-8 justify-between items-stretch";

    this.resultsContainer = document.createElement("div");
    this.resultsContainer.className =
      "grid [grid-template-columns:0.3fr_0.6fr] gap-8 w-[90%] max-w-[1200px]  items-stretch";

    const leftDiv = document.createElement("div");
    leftDiv.className =
      "flex flex-col bg-background-tertiary rounded-[16px] shadow-inner p-8 flex-1 overflow-y-auto";
    leftDiv.appendChild(summaryDiv);

    const rightDiv = document.createElement("div");
    rightDiv.className =
      "flex flex-col bg-transparent gap-8 rounded-xl shadow-inner flex-1";
    rightDiv.appendChild(chartDiv);
    rightDiv.appendChild(playersDiv);

    this.resultsContainer.appendChild(leftDiv);
    this.resultsContainer.appendChild(rightDiv);
    this.container.appendChild(this.resultsContainer);

    const btnContainer = document.createElement("div");
    btnContainer.className = "flex gap-4 text-center mt-4";

    if (this.isTournament && this.onMatchEnd) {
      const nextBtn = document.createElement("button");
      nextBtn.textContent = t("common.next") as string;
      nextBtn.className = createButtonStyle("w-[160px] h[56px]", 'green');
      nextBtn.onclick = async () => {
          await this.onMatchEnd?.(); 
            // TypeScript warning because onMatchEnd returns Promise<void> so the type before and after await is void
            // but await is needed here to wait for TournamentStore updates to complete before navigation

        TournamentStore.isInternalTournamentNavigation = true;
        if (TournamentStore.nextIsFinal) {
          navigate("/tournament/results", { tournamentId: this.tournamentId });
          TournamentStore.nextIsFinal = false;
        } else {
          navigate("/tournament/match", { tournamentId: this.tournamentId });
        }
      };
      btnContainer.appendChild(nextBtn);
    }

    this.container.appendChild(btnContainer);
    this.fetchAndRender();

    return this.container;
  }

  /*
    - Fetch game dashboard data from backend
    - Trigger rendering of summary, chart and player stats
  */
  private async fetchAndRender() {
    if (this.isTournament && NavigationState.activeTournamentId === null) {
      NavigationState.forceNavigate = true;
      navigate("/tournament/setup", { replace: true });
    }
    
    const response = await apiServices.dashboard.getGameDashboard(
      Number(this.sessionId)
    );
    if (this.destroyed) return;
    if (!response.success || !response.data) {
      showMessage(this.container, this.messageContainer, "Statistics could not be loaded. You can still continue.", "error");
      this.resultsContainer.style.display = "none";
      return;
    } 

    this.dashboardData = response.data;
    this.renderSummary();
    this.renderChart();
    this.renderPlayerStats();
  }
  
  /*
    - Render winner summary section
      - Winner avatar and name
      - Final score
      - Game duration
    - Adjusts winner name font size for long names
  */
  private renderSummary() {
    if (!this.dashboardData) return;
    const summaryDiv = this.container.querySelector("#summaryDiv")
    if (!summaryDiv) return;

    const { summary } = this.dashboardData;

    summaryDiv.innerHTML = `
        <div class="flex flex-col items-center">
        <img src="${getAvatarUrl(summary.winner?.avatar ?? "/uploads/avatars/default.png")}" class="w-[150px] h-[150px] rounded-full border-4 border-border-yellow object-cover mb-3 bg-black/25 shadow-[0_0_8px_rgba(255,255,0,0.5)]" />
        <div class="text-[150px] leading-none m-[10px] h-[200px] overflow-hidden flex items-center justify-center">🏆</div>
        <div class="uppercase text-[18px] text-purple_gray mb-1">${t("game-result.winner") as string}</div>
        <div id="winnerName" class="text-[74px] font-bold mb-5 text-text-yellow">${summary.winner?.displayName ?? "No Winner"}</div>
      </div>
      <div class="bg-[transparent] border-2 border-purple_gray rounded-lg p-4 w-[90%] mx-auto mb-4">
        <p class="text-lg text-text-primary font-semibold tracking-wider">${t("game-result.finalScore") as string}: ${summary.finalScore.left} - ${summary.finalScore.right}</p>
      </div>
      <div class="bg-[transparent] border-2 border-purple_gray rounded-lg p-4 w-[90%] mx-auto">
        <p class="text-lg text-text-primary font-semibold tracking-wider">${t("game-result.totalDuration") as string}: ${summary.totalDurationSec.toFixed(1)}s</p>
      </div>
    `;
    const nameEl = this.container.querySelector<HTMLElement>("#winnerName")
    // querySelector returns Element (Generic DOM Element) by default 
    // but innerText and style only available in HTMLElement 
    // Typed querySelector to return HTMLElement so that TypeScript allows innerText and style access
    if (nameEl) {
      const name = nameEl.innerText.trim();
      let size = 40;

      if (name.length > 10) size = 32;
      if (name.length > 16) size = 28;
      nameEl.style.fontSize = `${size}px`;
    }
  }

  /*
    - Render score progression chart using Plotly
    - Lines for left/right player score over elapsed time
  */
  private renderChart() {
    if (!this.dashboardData) return;

    const chartDiv = this.container.querySelector("#scoreChart")
    if (!chartDiv) return;

    const timeline = this.dashboardData.timeline;

    const traceLeft = {
      x: timeline.map((p) => p.elapsedSec),
      y: timeline.map((p) => p.scoreLeft),
      mode: "lines+markers",
      name: t("game-result.leftPlayer") as string,
      line: { color: "#82D64B", width: 3 },
      marker: { size: 6 },
    };

    const traceRight = {
      x: timeline.map((p) => p.elapsedSec),
      y: timeline.map((p) => p.scoreRight),
      mode: "lines+markers",
      name: t("game-result.rightPlayer") as string,
      line: { color: "#E43E64", width: 3 },
      marker: { size: 6 },
    };

    const layout = {
      title: { text: t("game-result.scoreProgress") as string, font: { color: "#fff", family: "'Press Start 2P'", size: 22 } },
      xaxis: { title: { text: t("game-result.elapsedTime") as string, font: { color: "#fff" } }, tickfont: { color: "#fff" }, gridcolor: "#24325f" },
      yaxis: { title: { text: t("game-result.score") as string, font: { color: "#fff" } }, tickfont: { color: "#fff" }, gridcolor: "#24325f", dtick: 1 },
      legend: { x: 0.1, y: 1.1, orientation: "h", font: { color: "#fff" } },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
    };

    Plotly.newPlot(chartDiv, [traceLeft, traceRight], layout, {
      responsive: true,
    });
  }

  /*
    - Render per player statistics cards
      - Avatar, display name, score, timing metrics and lifetime stats
    - Dynamically adjust font size to name length
  */
  private renderPlayerStats() {
    if (!this.dashboardData) return;

    const playersDiv = this.container.querySelector("#playersDiv")
    if (!playersDiv) return;

    const playerCards = this.dashboardData.players
      .map(
        (p) => `
        <div class=" bg-background-tertiary rounded-[16px] p-6 w-full text-center text-text-primary shadow-xl font-pixel text-base tracking-wide hover:-translate-y-1 transition-transform">
          <img src="${getAvatarUrl(
            p.avatar
          )}" class="w-[100px] h-[100px] rounded-full object-cover mx-auto mb-3 shadow-md border-2 border-border-yellow" />
          <h3 class="player-name mb-4 font-bold font-['Press_Start_2P'] text-center break-words leading-tight max-w-full">
            ${p.displayName}
          </h3>
          <ul class="list-none p-0 text-left text-purple_gray leading-relaxed">
            <li class="flex justify-between"><strong class="text-text-yellow">${t("game-result.score") as string}:</strong> ${p.score}</li>
            <li class="flex justify-between"><strong class="text-text-yellow">${t("game-result.timeTo1stPoint") as string}:</strong> ${typeof p.timeToFirstPointSec === "number" ? `${p.timeToFirstPointSec.toFixed(1)}s` :"-"}</li>
            <li class="flex justify-between"><strong class="text-text-yellow">${t("game-result.avgTime") as string}:</strong> ${typeof p.avgTimePerPointSec === "number" ? `${p.avgTimePerPointSec.toFixed(1)}s` :"-"}
            <li class="flex justify-between"><strong class="text-text-yellow">${t("game-result.matches") as string}:</strong> ${p.totalMatches}</li>
            <li class="flex justify-between"><strong class="text-text-yellow">${t("game-result.wins") as string}:</strong> ${p.totalWins}</li>
            <li class="flex justify-between"><strong class="text-text-yellow">${t("game-result.winRate") as string}:</strong> ${p.winRate.toFixed(1)}%</li>
          </ul>
        </div>`
      )
      .join("");

    playersDiv.innerHTML = playerCards;

    const nameEls = playersDiv.querySelectorAll<HTMLElement>(".player-name");
    // Note: querySelectorAll returns NodeListOf<Element>;
    // Specified return type here to be able to use .innerText and .style

    nameEls.forEach((el) => {
      const name = el.innerText.trim();
      let size = 20;

      if (name.length > 10) size = 18;
      if (name.length > 16) size = 16;

      el.style.fontSize = `${size}px`;
    });
  }

  // Prompt user for confirmation when navigating away in tournament flow
  /* 
    - No need to prompt if:
      - game is not part of a tournament
      - if navigation is part of the tournament flow (i.e., to next match or tournament results)
    - If navigation happens when tournament is finished (i.e., the last match has been played), 
      an invalid transition is expected when updating tournament status 
  */
  public async canDeactivate(): Promise<boolean> {
    if (NavigationState.forceNavigate) {
      return true;
    }
    
    if (!this.isTournament) return true;

    if (TournamentStore.isInternalTournamentNavigation) {
      TournamentStore.isInternalTournamentNavigation = false;
      return true;
    }

    const confirmLeave = await showConfirmation(
      t("tournament.tournamentInProgress") as string,
      t("common.pleaseConfirm") as string,
      true
    );

    if (!confirmLeave) return false;
    
    const tournamentId = this.tournamentId;
    if (tournamentId) {
      NavigationState.activeGameSessionId = null;
      NavigationState.activeTournamentId = null;
      apiServices.tournament.updateTournamentStatus(
        tournamentId,
        "ABORTED"
      ); // backend abort is best-effort; don't block navigation regardless of success
    } 

    return true;
  }

  public cleanup() {
    this.destroyed = true;

    const chartDiv = this.container?.querySelector("#scoreChart");
    if (chartDiv && typeof Plotly !== "undefined") {
      Plotly.purge(chartDiv);
    }
  }
}
