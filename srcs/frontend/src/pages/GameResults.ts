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
    this.loadStyles();

    this.container = document.createElement("div");
    this.container.className = "game-dashboard";

    // Title
    // const title = document.createElement("h1");
    // title.textContent = "Game Results";
    // title.className = "dashboard-title";
    // this.container.appendChild(title);

    // Summary container
    const summaryDiv = document.createElement("div");
    summaryDiv.className = "dashboard-summary";
    // this.container.appendChild(summaryDiv);

    // Chart container
    const chartDiv = document.createElement("div");
    chartDiv.className = "dashboard-chart";
    chartDiv.id = "scoreChart";
    chartDiv.style.width = "700px";
    chartDiv.style.height = "400px";
    // this.container.appendChild(chartDiv);

    // Player stats container
    const playersDiv = document.createElement("div");
    playersDiv.className = "dashboard-players";
    // this.container.appendChild(playersDiv);

    const resultsContainer = document.createElement("div");
    resultsContainer.className = "results-container";

    // Left: leaderboard summary
    const leftDiv = document.createElement("div");
    leftDiv.className = "results-left";
    leftDiv.appendChild(summaryDiv);

    // Right: chart + player stats
    const rightDiv = document.createElement("div");
    rightDiv.className = "results-right";
    rightDiv.appendChild(chartDiv);
    rightDiv.appendChild(playersDiv);

    resultsContainer.appendChild(leftDiv);
    resultsContainer.appendChild(rightDiv);
    this.container.appendChild(resultsContainer);

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

      if (!response.success || !response.data) {
        console.log("Dashboard data not available:", response.message);
        return;
      }

      this.dashboardData = response.data;
      this.renderSummary();
      this.renderChart();
      this.renderPlayerStats();
    } catch (err) {
      console.error("Error fetching dashboard:", err);
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
        <img src="${this.getAvatarUrl(
          summary.winner?.avatar ?? "/uploads/avatars/default.png"
        )}" 
             alt="Winner Avatar" class="winner-avatar" />
        <div class="trophy-icon">🏆</div>
        <div class="winner-label">winner</div>
        <div class="winner-name">${
          summary.winner?.displayName ?? "No Winner"
        }</div>
      </div>
      <div class="score-box">
        <p>Final Score: ${summary.finalScore.left} - ${
      summary.finalScore.right
    }</p>
      </div>
      <div class="duration-box">
        <p>Total Duration: ${summary.totalDurationSec.toFixed(
          1
        )}s</p>
      </div>
    `;
  }

  // Render line chart of score progression
  private renderChart() {
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
      title: {
        text: "Score Progression Over Time",
        font: {
          color: "#ffffff",
          family: "'Press Start 2P', monospace",
          size: 12,
        },
      },
      xaxis: {
        title: { text: "Elapsed Time (Seconds)", font: { color: "#ffffff" } },
        tickfont: { color: "#ffffff" },
        gridcolor: "#24325f",
      },
      yaxis: {
        title: { text: "Score", font: { color: "#ffffff" } },
        tickfont: { color: "#ffffff" },
        gridcolor: "#24325f",
        dtick: 1,
      },
      legend: { x: 0.1, y: 1.1, orientation: "h", font: { color: "#ffffff" } },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
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
          <img src="${this.getAvatarUrl(p.avatar)}" alt="${
          p.displayName
        }" class="player-avatar" />
          <h3>${p.displayName}</h3>
          <ul>
            <li><strong>Score:</strong> ${p.score}</li>
            <li><strong>Time to 1st Point:</strong> ${
              p.timeToFirstPointSec?.toFixed(1) ?? "-"
            }s</li>
            <li><strong>Avg Time per Point:</strong> ${
              p.avgTimePerPointSec?.toFixed(1) ?? "-"
            }s</li>
            <li><strong>Total Matches:</strong> ${p.totalMatches}</li>
            <li><strong>Wins:</strong> ${p.totalWins}</li>
            <li><strong>Win Rate:</strong> ${p.winRate.toFixed(1)}%</li>
          </ul>
        </div>
      `
      )
      .join("");

    playersDiv.innerHTML = `
      <div class="player-stats-container">${playerCards}</div>
    `;
  }
  private loadStyles() {
    if (document.getElementById("game-result-styles")) return;

    const link = document.createElement("link");
    link.id = "game-result-styles";
    link.rel = "stylesheet";
    link.href = "/styles/GameResults.css";
    document.head.appendChild(link);
  }

  private getAvatarUrl(path?: string): string {
    if (!path) return "";
    const backendUrl = "http://localhost:5001";

    const full = path.startsWith("http://") || path.startsWith("https://");
    const base = full ? path : `${backendUrl}${path}`;

    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}t=${Date.now()}`;
  }
}
