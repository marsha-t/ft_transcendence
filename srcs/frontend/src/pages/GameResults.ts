import { IComponent } from "../components/IComponent";
import { apiServices } from "../services/ApiServices.js";
import { GameDashboard } from "../services/dashboard/types";
import { navigate, createButtonStyle } from "../utils.js";
import { TournamentStore } from "../services/tournament/TournamentStore.js";
import { showConfirmation } from "../utils/uiUtils";
import { t } from "../services/i18n/i18nService.js";

declare const Plotly: any;

export class GameResults implements IComponent {
  private sessionId: number;
  private isTournament: boolean;
  private onMatchEnd?: () => void;
  private dashboardData: GameDashboard | null = null;
  private container!: HTMLElement;
  private tournamentId: number | null = null;

  constructor(state?: any) {
    this.sessionId = state?.sessionId;
    this.isTournament = state?.isTournament ?? false;
    this.tournamentId = state?.tournamentId ?? null;

    if (this.isTournament) {
      const original = TournamentStore.onMatchEnd; // this is read the moment GameResults is constructed
      this.onMatchEnd = async () => {
        // this.onMatchEnd waits for the callback so that GameResults receives correct, updated callback for match
        await original?.();
      };
    }
  }

  public render(): HTMLElement {
    this.container = document.createElement("div");
    this.container.className = `min-h-screen flex flex-col items-center gap-8 p-8  rounded-[16px] text-[var(--color-text-yellow)] font-pixel`;
    this.container.style.backgroundColor = 'var(--color-background-primary)';

    const summaryDiv = document.createElement("div");
    summaryDiv.id = "summaryDiv";
    summaryDiv.className = "w-full text-center text-[var(--color-text-white)]";

    const chartDiv = document.createElement("div");
    chartDiv.className =
      "rounded-lg bg-[#21447E] p-5 shadow-inner w-full max-w-[850px]";
    chartDiv.id = "scoreChart";
    chartDiv.style.width = "700px";
    chartDiv.style.height = "400px";

    const playersDiv = document.createElement("div");
    playersDiv.id = "playersDiv";
    playersDiv.className =
      "w-full grid grid-cols-2 gap-8 justify-between items-stretch";

    const resultsContainer = document.createElement("div");
    resultsContainer.className =
      "grid [grid-template-columns:0.3fr_0.6fr] gap-8 w-[90%] max-w-[1200px]  items-stretch";

    const leftDiv = document.createElement("div");
    leftDiv.className =
      "flex flex-col bg-[#21447E] rounded-[16px] shadow-inner p-8 flex-1 overflow-y-auto";
    leftDiv.appendChild(summaryDiv);

    const rightDiv = document.createElement("div");
    rightDiv.className =
      "flex flex-col bg-[var(--color-background)] gap-8 rounded-xl shadow-inner flex-1";
    rightDiv.appendChild(chartDiv);
    rightDiv.appendChild(playersDiv);

    resultsContainer.appendChild(leftDiv);
    resultsContainer.appendChild(rightDiv);
    this.container.appendChild(resultsContainer);

    const btnContainer = document.createElement("div");
    btnContainer.className = "flex gap-4 text-center mt-4";

    if (this.isTournament && this.onMatchEnd) {
      const nextBtn = document.createElement("button");
      nextBtn.textContent = t("common.next") as string;
      nextBtn.className = createButtonStyle("w-[160px] h[56px]", 'green');
      nextBtn.onclick = async () => {
        await this.onMatchEnd?.();

        TournamentStore.isInternalTournamentNavigation = true;
        if (TournamentStore.nextIsFinal) {
          navigate("/tournament/results", { tournamentId: this.tournamentId });
          TournamentStore.nextIsFinal = false;
        } else {
          navigate("/tournament/match", { tournamentId: this.tournamentId });
        }
        this.onMatchEnd!();
      };
      btnContainer.appendChild(nextBtn);
    }

    this.container.appendChild(btnContainer);
    this.fetchAndRender();

    return this.container;
  }

  private async fetchAndRender() {
    try {
      const response = await apiServices.dashboard.getGameDashboard(
        Number(this.sessionId)
      );
      if (!response.success || !response.data) return;

      this.dashboardData = response.data;
      this.renderSummary();
      this.renderChart();
      this.renderPlayerStats();
    } catch (err) {
      console.error("Error fetching dashboard:", err);
    }
  }

  private renderSummary() {
    if (!this.dashboardData) return;
    const summaryDiv = document.getElementById("summaryDiv");
    if (!summaryDiv) return;

    const { summary } = this.dashboardData;

    summaryDiv.innerHTML = `
        <div class="flex flex-col items-center">
        <img src="${this.getAvatarUrl(summary.winner?.avatar ?? "/uploads/avatars/default.png")}" class="w-[150px] h-[150px] rounded-full border-4 border-[#fdd835] object-cover mb-3 bg-black/25 shadow-[0_0_8px_rgba(255,255,0,0.5)]" />
        <div class="text-[150px] leading-none m-[10px] h-[200px] overflow-hidden flex items-center justify-center">🏆</div>
        <div class="uppercase text-[18px] text-[#b0b6e6] mb-1">${t("game-result.winner") as string}</div>
        <div class="text-[74px] font-bold mb-5 text-[#fdd835]">${summary.winner?.displayName ?? "No Winner"}</div>
      </div>
      <div class="bg-[transparent] border-2 border-[#b0b6e6] rounded-lg p-4 w-[90%] mx-auto mb-4">
        <p class="text-lg text-white font-semibold tracking-wider">${t("game-result.finalScore") as string}: ${summary.finalScore.left} - ${summary.finalScore.right}</p>
      </div>
      <div class="bg-[transparent] border-2 border-[#b0b6e6] rounded-lg p-4 w-[90%] mx-auto">
        <p class="text-lg text-white font-semibold tracking-wider">${t("game-result.totalDuration") as string}: ${summary.totalDurationSec.toFixed(1)}s</p>
      </div>
    `;
    const nameEl = document.getElementById("winnerName");
    if (nameEl) {
      const name = nameEl.innerText.trim();
      let size = 40;

      if (name.length > 12) size = 34;
      if (name.length > 16) size = 28;
      nameEl.style.fontSize = `${size}px`;
    }
  }

  private renderChart() {
    if (!this.dashboardData) return;

    const chartDiv = document.getElementById("scoreChart");
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

  private renderPlayerStats() {
    if (!this.dashboardData) return;

    const playersDiv = document.getElementById("playersDiv");
    if (!playersDiv) return;

    const playerCards = this.dashboardData.players
      .map(
        (p) => `
        <div class="bg-[#21447E] rounded-[16px] p-6 w-full text-center text-white shadow-xl font-pixel text-base tracking-wide hover:-translate-y-1 transition-transform">
          <img src="${this.getAvatarUrl(
            p.avatar
          )}" class="w-[100px] h-[100px] rounded-full object-cover mx-auto mb-3 shadow-md border-2 border-[#fdd835]" />
          <h3 class="player-name mb-4 font-bold font-['Press_Start_2P'] text-center break-words leading-tight max-w-full">
            ${p.displayName}
          </h3>
          <ul class="list-none p-0 text-left text-[#d0d0ff] leading-relaxed">
            <li class="flex justify-between"><strong class="text-[#fdd835]">${t("game-result.score") as string}:</strong> ${p.score}</li>
            <li class="flex justify-between"><strong class="text-[#fdd835]">${t("game-result.timeTo1stPoint") as string}:</strong> ${p.timeToFirstPointSec?.toFixed(1) ?? "-"}s</li>
            <li class="flex justify-between"><strong class="text-[#fdd835]">${t("game-result.avgTime") as string}:</strong> ${p.avgTimePerPointSec?.toFixed(1) ?? "-"}s</li>
            <li class="flex justify-between"><strong class="text-[#fdd835]">${t("game-result.matches") as string}:</strong> ${p.totalMatches}</li>
            <li class="flex justify-between"><strong class="text-[#fdd835]">${t("game-result.wins") as string}:</strong> ${p.totalWins}</li>
            <li class="flex justify-between"><strong class="text-[#fdd835]">${t("game-result.winRate") as string}:</strong> ${p.winRate.toFixed(1)}%</li>
          </ul>
        </div>`
      )
      .join("");

    // Dynamically adjust display name size
    const nameEls = document.querySelectorAll<HTMLElement>(".player-name");
    // Note: querySelectorAll returns NodeListOf<Element>;
    // Specified return type here to be able to use .innerText and .style

    nameEls.forEach((el) => {
      const name = el.innerText.trim();
      let size = 20; // base size

      if (name.length > 12) size = 18;
      if (name.length > 16) size = 16;

      el.style.fontSize = `${size}px`;
    });

    playersDiv.innerHTML = playerCards;
  }

  private getAvatarUrl(path?: string): string {
    const defaultAvatar = "/uploads/avatars/default.png";

    if (!path) path = defaultAvatar;

    // If path is already a full URL, use it as-is
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return `${path}${path.includes("?") ? "&" : "?"}t=${Date.now()}`;
    }

    // Otherwise, use relative path
    return `${path}${path.includes("?") ? "&" : "?"}t=${Date.now()}`;
  }

  public async canDeactivate(): Promise<boolean> {
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
    
    try {
      const tournamentId = this.tournamentId;
      if (tournamentId) {
        await apiServices.tournament.updateTournamentStatus(
          tournamentId,
          "ABORTED"
        );
      }
    } catch (err) {
      console.error("Failed to abort tournament:", err);
    }

    return true;
  }
}
