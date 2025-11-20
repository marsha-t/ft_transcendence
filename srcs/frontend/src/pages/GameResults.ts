
import { IComponent } from "../components/IComponent";
import { apiServices } from "../services/ApiServices.js";
import { GameDashboard } from "../services/dashboard/types";
import {  navigate, createButtonStyle } from "../utils.js"
import { TournamentStore } from "../services/tournament/TournamentStore.js";

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
      this.onMatchEnd = TournamentStore.onMatchEnd;
    }
  }

  public render(): HTMLElement {
    this.container = document.createElement("div");
    this.container.className = `min-h-screen flex flex-col items-center gap-8 p-8 bg-[var(--color-background)] rounded-[16px] text-[var(--color-text-yellow)] font-pixel`;

    const summaryDiv = document.createElement("div");
    summaryDiv.id = "summaryDiv";
    summaryDiv.className = "w-full text-center text-[var(--color-text-white)]";

    const chartDiv = document.createElement("div");
    chartDiv.className = "rounded-lg bg-[#21447E] p-5 shadow-inner w-full max-w-[850px]";
    chartDiv.id = "scoreChart";
    chartDiv.style.width = "700px";
    chartDiv.style.height = "400px";

    const playersDiv = document.createElement("div");
    playersDiv.id = "playersDiv";
    playersDiv.className = "w-full grid grid-cols-2 gap-8 justify-between items-stretch";


    const resultsContainer = document.createElement("div");
    resultsContainer.className = "grid [grid-template-columns:0.3fr_0.6fr] gap-8 w-[90%] max-w-[1200px]  items-stretch";

    const leftDiv = document.createElement("div");
    leftDiv.className = "flex flex-col bg-[#21447E] rounded-[16px] shadow-inner p-8 flex-1 overflow-y-auto";
      leftDiv.appendChild(summaryDiv);

    const rightDiv = document.createElement("div");
    rightDiv.className ="flex flex-col bg-[var(--color-background)] gap-8 rounded-xl shadow-inner flex-1";
      rightDiv.appendChild(chartDiv);
    rightDiv.appendChild(playersDiv);

    resultsContainer.appendChild(leftDiv);
    resultsContainer.appendChild(rightDiv);
    this.container.appendChild(resultsContainer);

    const btnContainer = document.createElement("div");
    btnContainer.className = "flex gap-4 text-center mt-4";

    if (this.isTournament && this.onMatchEnd) {
      const nextBtn = document.createElement("button");
      nextBtn.textContent = "Next";
      nextBtn.className = createButtonStyle("w-[160px] h[56px]", 'green');
      nextBtn.onclick = () => {
        TournamentStore.isInternalTournamentNavigation = true;
        navigate("/tournament/match", {tournamentId: this.tournamentId});
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
      const response = await apiServices.dashboard.getGameDashboard(Number(this.sessionId));
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
        <div class="uppercase text-[18px] text-[#b0b6e6] mb-1">winner</div>
        <div class="text-[74px] font-bold mb-5 text-[#fdd835]">${summary.winner?.displayName ?? "No Winner"}</div>
      </div>
      <div class="bg-[transparent] border-2 border-[#b0b6e6] rounded-lg p-4 w-[90%] mx-auto mb-4">
        <p class="text-lg text-white font-semibold tracking-wider">Final Score: ${summary.finalScore.left} - ${summary.finalScore.right}</p>
      </div>
      <div class="bg-[transparent] border-2 border-[#b0b6e6] rounded-lg p-4 w-[90%] mx-auto">
        <p class="text-lg text-white font-semibold tracking-wider">Total Duration: ${summary.totalDurationSec.toFixed(1)}s</p>
      </div>
    `;
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
      name: "Left Player",
      line: { color: "#82D64B", width: 3 },
      marker: { size: 6 },
    };

    const traceRight = {
      x: timeline.map((p) => p.elapsedSec),
      y: timeline.map((p) => p.scoreRight),
      mode: "lines+markers",
      name: "Right Player",
      line: { color: "#E43E64", width: 3 },
      marker: { size: 6 },
    };

    const layout = {
      title: { text: "Score Progression Over Time", font: { color: "#fff", family: "'Press Start 2P'", size: 22 } },
      xaxis: { title: { text: "Elapsed Time (Seconds)", font: { color: "#fff" } }, tickfont: { color: "#fff" }, gridcolor: "#24325f" },
      yaxis: { title: { text: "Score", font: { color: "#fff" } }, tickfont: { color: "#fff" }, gridcolor: "#24325f", dtick: 1 },
      legend: { x: 0.1, y: 1.1, orientation: "h", font: { color: "#fff" } },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
    };

    Plotly.newPlot(chartDiv, [traceLeft, traceRight], layout, { responsive: true });
  }

  private renderPlayerStats() {
    if (!this.dashboardData) return;

    const playersDiv = document.getElementById("playersDiv");
    if (!playersDiv) return;


    const playerCards = this.dashboardData.players
      .map(
        (p) => `
        <div class="bg-[#21447E] rounded-[16px] p-6 w-full text-center text-white shadow-xl font-pixel text-lg tracking-wide hover:-translate-y-1 transition-transform">
          <img src="${this.getAvatarUrl(p.avatar)}" class="w-[100px] h-[100px] rounded-full object-cover mx-auto mb-3 shadow-md border-2 border-[#fdd835]" />
          <h3 class="mb-4 text-xl font-bold font-['Press_Start_2P']">${p.displayName}</h3>
          <ul class="list-none p-0 text-left text-[#d0d0ff] leading-relaxed">
            <li class="flex justify-between"><strong class="text-[#fdd835]">Score:</strong> ${p.score}</li>
            <li class="flex justify-between"><strong class="text-[#fdd835]">Time to 1st Point:</strong> ${p.timeToFirstPointSec?.toFixed(1) ?? "-"}s</li>
            <li class="flex justify-between"><strong class="text-[#fdd835]">Avg Time:</strong> ${p.avgTimePerPointSec?.toFixed(1) ?? "-"}s</li>
            <li class="flex justify-between"><strong class="text-[#fdd835]">Matches:</strong> ${p.totalMatches}</li>
            <li class="flex justify-between"><strong class="text-[#fdd835]">Wins:</strong> ${p.totalWins}</li>
            <li class="flex justify-between"><strong class="text-[#fdd835]">Win Rate:</strong> ${p.winRate.toFixed(1)}%</li>
          </ul>
        </div>`
      )
      .join("");

    playersDiv.innerHTML = playerCards;
  }

  private getAvatarUrl(path?: string): string {
    if (!path) return "";
    const backendUrl = "http://localhost:5001";

    const full = path.startsWith("http://") || path.startsWith("https://");
    const base = full ? path : `${backendUrl}${path}`;

    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}t=${Date.now()}`;
  }

  public async canDeactivate(): Promise<boolean> {
    if (!this.isTournament) return true;

    if (TournamentStore.isInternalTournamentNavigation) {
      TournamentStore.isInternalTournamentNavigation = false;
      return true;
    }

    const confirmLeave = confirm("A tournament is in progress. Leaving will abort it.");
    if (!confirmLeave) return false;

    try {
      const tournamentId = this.tournamentId;
      if (tournamentId) {
        await apiServices.tournament.updateTournamentStatus(tournamentId, "ABORTED");
      }
    } catch (err) {
      console.error("Failed to abort tournament:", err);
    }

    return true;
  }
}
