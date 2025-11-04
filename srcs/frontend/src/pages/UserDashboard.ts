import { IComponent } from "../components/IComponent";
import { apiServices } from "../services/ApiServices.js";
import { UserDashboard } from "../services/dashboard/types";

declare const Plotly: any;

export class ProfileDashboard implements IComponent {
  private container!: HTMLElement;
  private dashboardData: UserDashboard | null = null;

  public render(): HTMLElement {
    this.loadStyles();

    this.container = document.createElement("div");
    this.container.className = "user-dashboard";

    // Title
    const title = document.createElement("h1");
    title.textContent = "Your Performance Dashboard";
    title.className = "dashboard-title";
    this.container.appendChild(title);

    // Grid
    const grid = document.createElement("div");
    grid.className = "dashboard-grid";
    this.container.appendChild(grid);

    // Overview container
    const overviewDiv = document.createElement("div");
    overviewDiv.id = "overviewCard";
    overviewDiv.className = "dashboard-card";
    grid.appendChild(overviewDiv);

    // Win rate chart
    const winRateChartDiv = document.createElement("div");
    winRateChartDiv.id = "winRateChart";
    winRateChartDiv.className = "dashboard-card";
    grid.appendChild(winRateChartDiv);

    // Score histogram
    const scoreHistogramDiv = document.createElement("div");
    scoreHistogramDiv.id = "scoreHistogram";
    scoreHistogramDiv.className = "dashboard-card";
    grid.appendChild(scoreHistogramDiv);

    // Wins per Opponent
    const winsPerOpponentDiv = document.createElement("div");
    winsPerOpponentDiv.id = "winsPerOpponent";
    winsPerOpponentDiv.className = "dashboard-card";
    grid.appendChild(winsPerOpponentDiv);

    // Leaderboard
    const leaderboardDiv = document.createElement("div");
    leaderboardDiv.id = "leaderboard";
    leaderboardDiv.className = "dashboard-card";
    grid.appendChild(leaderboardDiv);

    this.fetchAndRender();
    return this.container;
  }

  private async fetchAndRender() {
    try {
      const response = await apiServices.dashboard.getUserDashboard();
      if (!response.success || !response.data) {
        console.log("Dashboard data not available: ", response.message);
        return;
      }
      this.dashboardData = response.data;
      const totalMatches = this.dashboardData.overview?.totalMatches ?? 0;

      this.renderOverview();
      if (totalMatches > 0) {
        this.renderWinRateChart();
        this.renderScoreHistogram();
        this.renderOpponentBarChart();
        this.renderLeaderboard();
      } else {
        this.renderNoDataMessages();
      }
    } catch (err) {
      console.error("Error fetching dashboard: ", err);
    }
  }

  private renderOverview() {
    if (!this.dashboardData) return;

    const overviewDiv = document.getElementById("overviewCard");
    if (!overviewDiv) return;

    const { overview } = this.dashboardData;
    overviewDiv.innerHTML = `
		<h2>Overview</h2>
		<ul>
			<li>Total Matches: ${overview.totalMatches}</li>
			<li>Total Wins: ${overview.totalWins}</li>
			<li>Win Rate: ${overview.winRate}%</li>
			<li>Average Score: ${overview.avgScore}</li>
			<li>Current Streak: ${overview.currentWinStreak}</li>
			<li>Longest Streak: ${overview.longestWinStreak}</li>
		</ul>`;
  }

  private renderWinRateChart() {
    if (!this.dashboardData) return;

    const winRateChartDiv = document.getElementById("winRateChart");
    if (!winRateChartDiv) return;

    const { dailyStats } = this.dashboardData;
    const trace = {
      x: dailyStats.map((p) => p.date),
      y: dailyStats.map((p) => p.winRate * 100),
      type: "scatter",
      mode: "lines+markers",
      line: { color: "#423f6a" },
    };
    const layout = {
      title: "Win Rate Over Time",
      yaxis: { title: "%" },
      xaxis: { title: "Date", type: "date", tickformat: "%b %d" },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      autosize: true,
      margin: { t: 70, b: 100, l: 80, r: 100 },
    };
    Plotly.newPlot(winRateChartDiv, [trace], layout, { responsive: true });
  }

  private renderScoreHistogram() {
    if (!this.dashboardData) return;

    const scoreHistogramDiv = document.getElementById("scoreHistogram");
    if (!scoreHistogramDiv) return;

    const { scoreDistribution } = this.dashboardData;
    const trace = {
      x: scoreDistribution,
      type: "histogram",
      marker: { color: "#E43E64" },
      xbins: { start: -0.5, end: 5.5, size: 1 },
    };
    const layout = {
      title: "Score Distribution",
      xaxis: {
        title: "Score",
        dtick: 1,
        range: [-0.5, 5.5],
        tickvals: [0, 1, 2, 3, 4, 5],
      },
      yaxis: { title: "Frequency" },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      autosize: true,
      margin: { t: 70, b: 100, l: 80, r: 100 },
    };
    Plotly.newPlot(scoreHistogramDiv, [trace], layout, { responsive: true });
  }

  private renderOpponentBarChart() {
    if (!this.dashboardData) return;

    const winsPerOpponentDiv = document.getElementById("winsPerOpponent");
    if (!winsPerOpponentDiv) return;

    const { winsPerOpponent } = this.dashboardData;
    const trace = {
      x: winsPerOpponent.map((p) => p.opponent),
      y: winsPerOpponent.map((p) => p.winRate),
      type: "bar",
      marker: { color: "#6B5B95" },
    };
    const layout = {
      title: "% Wins per Opponent",
      yaxis: { title: "%" },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      autosize: true,
      margin: { t: 70, b: 100, l: 80, r: 100 },
    };
    Plotly.newPlot(winsPerOpponentDiv, [trace], layout, { responsive: true });
  }

  private renderLeaderboard() {
    if (!this.dashboardData) return;

    const leaderboardDiv = document.getElementById("leaderboard");
    if (!leaderboardDiv) return;

    const { leaderboard } = this.dashboardData;
    const rows = leaderboard
      .map(
        (p) => `
        <tr class="${p.isCurrentUser ? "highlight-user" : ""}">
          <td>${p.rank}</td>
          <td>${p.username}</td>
          <td>${p.totalMatches}</td>
          <td>${p.winRate}</td>
          <td>${p.avgScore}</td>
          <td>${p.leaderboardScore}</td>
        </tr>
      `
      )
      .join("");
    leaderboardDiv.innerHTML = `
		<h2>Leaderboard</h2>
		<table>
			<thead><tr>
				<th>#</th>
				<th>Player</th>
				<th>Matches</th>
				<th>Win Rate</th>
				<th>Average Score</th>
				<th>Leaderboard Score</th>
			</tr></thead>
			<tbody>${rows}</tbody>
		</table>
	`;
  }

  private renderNoDataMessages() {
    const placeholders = [
      { id: "winRateChart", title: "Win Rate Over Time" },
      { id: "scoreHistogram", title: "Score Distribution" },
      { id: "winsPerOpponent", title: "Wins per Opponent" },
      { id: "leaderboard", title: "Leaderboard" },
    ];
    placeholders.forEach(({ id, title }) => {
      const div = document.getElementById(id);
      if (div) {
        div.innerHTML = `
          <h2>${title}</h2>
          <p class="no-data">Not enough matches yet — play a few games to unlock insights!</p>
        `;
      }
    });
  }
  private loadStyles() {
    if (document.getElementById("user-dashboard-styles")) return;

    const link = document.createElement("link");
    link.id = "user-dashboard-styles";
    link.rel = "stylesheet";
    link.href = "/styles/UserDashboard.css";
    document.head.appendChild(link);
  }
}
