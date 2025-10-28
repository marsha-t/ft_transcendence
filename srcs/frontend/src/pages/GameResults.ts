import { IComponent } from "../components/IComponent";
import { apiServices } from "../services/ApiServices.js";
import { GameDashboard } from "../services/dashboard/types";
import { navigate } from "../utils";

declare const Plotly: any;

export class GameResults implements IComponent {
  private sessionId: number;
  private isTournament: boolean;
  private onMatchEnd?: () => void;
  private dashboardData: GameDashboard | null = null;
  private container!: HTMLElement;

  constructor(state?: any) {
    this.sessionId = state?.sessionId;
    this.isTournament = state?.isTournament ?? false;
    this.onMatchEnd = state?.onMatchEnd;
  }

  public render(): HTMLElement {
    this.container = document.createElement("div");
    this.container.className = "game-dashboard";

    // Title
    const title = document.createElement("h1");
    title.textContent = "Game Results";
    title.className = "dashboard-title";
    this.container.appendChild(title);

    // Summary container
    const summaryDiv = document.createElement("div");
    summaryDiv.className = "dashboard-summary";
    this.container.appendChild(summaryDiv);

    // Chart container
    const chartDiv = document.createElement("div");
    chartDiv.id = "scoreChart";
    chartDiv.style.width = "700px";
    chartDiv.style.height = "400px";
    this.container.appendChild(chartDiv);

    // Player stats container
    const playersDiv = document.createElement("div");
    playersDiv.className = "dashboard-players";
    this.container.appendChild(playersDiv);

    // Button section
    const btnContainer = document.createElement("div");
    btnContainer.className = "results-buttons";

    if (this.isTournament && this.onMatchEnd) {
      const nextBtn = document.createElement("button");
      nextBtn.textContent = "Next";
      nextBtn.onclick = () => {
        this.onMatchEnd!();
      };
      btnContainer.appendChild(nextBtn);
    }
    this.container.appendChild(btnContainer);

    // Fetch data
    this.fetchAndRender();

    return this.container;
  }

  // Fetch dashboard data
  private async fetchAndRender() {
    try {
      const response = await apiServices.dashboard.getGameDashboard(
        Number(this.sessionId)
      );

      const chartDiv = document.getElementById("scoreChart");
      if (!chartDiv) return;

      if (!response.success || !response.data) {
        chartDiv.textContent = response.message || "Failed to load chart data.";
        return;
      }

      this.dashboardData = response.data;
      this.renderSummary();
      this.renderChart();
      this.renderPlayerStats();
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      const chartDiv = document.getElementById("scoreChart");
      if (chartDiv) chartDiv.textContent = "Error loading chart data.";
    }
  }

  // Render summary section of dashboard
  private renderSummary() {
    if (!this.dashboardData) return;
    
    const summaryDiv = this.container.querySelector(".dashboard-summary");
    if (!summaryDiv) return;

    const { summary } = this.dashboardData;

    summaryDiv.innerHTML = `
      <div class="winner-card">
        <img src="${summary.winner?.avatar ?? "/uploads/avatars/default.png"}" 
             alt="Winner Avatar" class="winner-avatar" />
        <h2>🏆 Winner: ${summary.winner?.displayName ?? "No Winner"}</h2>
      </div>
      <p class="score-line">Final Score: ${summary.finalScore.left} - ${summary.finalScore.right}</p>
      <p>Total Duration: ${summary.totalDurationSec.toFixed(1)}s (Active: ${summary.activeDurationSec.toFixed(1)}s)</p>
    `;
  }

  // Render line chart of score progression 
  private renderChart () {
    if (!this.dashboardData) return;
    
    const chartDiv = document.getElementById("scoreChart");
    if (!chartDiv) return;

    // Dummy timeline data
    const timeline = this.dashboardData!.timeline;

    const traceLeft = {
      x: timeline.map((p) => p.elapsedSec),
      y: timeline.map((p) => p.scoreLeft),
      mode: "lines+markers",
      name: "Left Player",
      line: { color: "#423f6a", width: 3 },
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
      title: "Score Progression Over Time",
      xaxis: {
        title: "Elapsed Time (seconds)",
        showgrid: true,
        zeroline: false,
      },
      yaxis: {
        title: "Score",
        dtick: 1,
        rangemode: "tozero",
      },
      legend: { x: 0.05, y: 1.1, orientation: "h" },
      plot_bgcolor: "#F2F1FA",
      paper_bgcolor: "#F2F1FA",
    };

    Plotly.newPlot(chartDiv, [traceLeft, traceRight], layout, {
      responsive: true,
    });
  }

  // Render player statistics 
  private renderPlayerStats() {
    if (!this.dashboardData) return;
    
    const playersDiv = this.container.querySelector(".dashboard-players");
    if (!playersDiv) return;

    const playerCards = this.dashboardData.players
      .map(
        (p) => `
        <div class="player-card ${p.side.toLowerCase()}">
          <img src="${p.avatar}" alt="${p.displayName}" class="player-avatar" />
          <h3>${p.displayName} (${p.side})</h3>
          <ul>
            <li><strong>Score:</strong> ${p.score}</li>
            <li><strong>Time to 1st Point:</strong> ${p.timeToFirstPointSec?.toFixed(1) ?? "-"}s</li>
            <li><strong>Avg Time per Point:</strong> ${p.avgTimePerPointSec?.toFixed(1) ?? "-"}s</li>
            <li><strong>Total Matches:</strong> ${p.totalMatches}</li>
            <li><strong>Wins:</strong> ${p.totalWins}</li>
            <li><strong>Win Rate:</strong> ${p.winRate.toFixed(1)}%</li>
          </ul>
        </div>
      `
      )
      .join("");

    playersDiv.innerHTML = `
      <h2>Player Stats</h2>
      <div class="player-stats-container">${playerCards}</div>
    `;
  }
}
