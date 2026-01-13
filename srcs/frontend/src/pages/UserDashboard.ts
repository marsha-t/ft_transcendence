import { IComponent } from "../components/IComponent";
import { apiServices } from "../services/ApiServices.js";
import { UserDashboard } from "../services/dashboard/types";
import { t } from "../services/i18n/i18nService.js";
import { showMessage } from "../utils/uiUtils";

declare const Plotly: any;

export class ProfileDashboard implements IComponent {
  private container!: HTMLElement;
  private messageContainer!: HTMLDivElement;
  private gridContainer!: HTMLDivElement;
  private dashboardData: UserDashboard | null = null;
  private destroyed = false;

  /*
    - Render profile dashboard layout
      - Overview metrics card
      - Win rate over time chart
      - Score histogram
      - Wins per opponent bar chart
      - Global leaderboard table
    - Trigger async data fetch and rendering
  */
  public render(): HTMLElement {
    const page = document.createElement('div');
    page.className = `
        flex flex-col items-center justify-start
        bg-background rounded-[16px] shadow-lg
        mx-[23px] w-[calc(100%-46px)]
        h-full py-6 px-10 `;
    page.style.backgroundColor = 'var(--color-background-primary)';

    this.container = document.createElement("div");
    this.container.className = "p-8 flex flex-col items-center gap-4 h-full w-full font-pixel text-yellow-300 overflow-y-auto";

    // Title
    const title = document.createElement("h1");
    title.textContent = t("dashboard.title") as string;
    title.className = `text-[1.8rem] font-bold text-yellow-300 mb-4 drop-shadow-[2px_2px_0_#000]`;
    this.container.appendChild(title);

    // Error message 
    this.messageContainer = document.createElement("div");
    this.messageContainer.className = "w-full flex justify-center";
    this.messageContainer.style.display = "none";
    this.container.appendChild(this.messageContainer);

    // Grid
    this.gridContainer = document.createElement("div");
    this.gridContainer.className = "grid grid-rows-2  gap-4 w-[90%] max-w-[1400px] place-items-stretch";
    this.container.appendChild(this.gridContainer);

    const topRow = document.createElement("div");
    topRow.className = "grid grid-cols-3 gap-4 w-full";
  
    // Overview container
    const overviewDiv = document.createElement("div");
    overviewDiv.id = "overviewCard";
    overviewDiv.className = "bg-[#21447E] rounded-[16px] p-8 text-left text-white h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_0_#000]";

    // Win rate over time container
    const winRateChartDiv = document.createElement("div");
    winRateChartDiv.id = "winRateChart";
    winRateChartDiv.className ="bg-[#21447E] rounded-[16px] p-2  h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_0_#000]";

    // Score histogram container
    const scoreHistogramDiv = document.createElement("div");
    scoreHistogramDiv.id = "scoreHistogram";
    scoreHistogramDiv.className = "bg-[#21447E] rounded-[16px] p-2 h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_0_#000]";
    topRow.appendChild(overviewDiv);
    topRow.appendChild(winRateChartDiv);
    topRow.appendChild(scoreHistogramDiv);
    
    const bottomRow = document.createElement("div");
    bottomRow.className = "grid grid-cols-[0.33fr_0.67fr]  gap-4 w-full h-full"; 
    // Wins per Opponent
    const winsPerOpponentDiv = document.createElement("div");
    winsPerOpponentDiv.id = "winsPerOpponent";
    winsPerOpponentDiv.className = "bg-[#21447E] rounded-[16px] p-2 h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_0_#000]";
    
    // Leaderboard
    const leaderboardDiv = document.createElement("div");
    leaderboardDiv.id = "leaderboard";
    leaderboardDiv.className ="bg-[#21447E] rounded-[16px] p-8 text-left text-yellow-300 h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_0_#000]";
    bottomRow.appendChild(winsPerOpponentDiv);
    bottomRow.appendChild(leaderboardDiv);
    this.gridContainer.appendChild(topRow);
    this.gridContainer.appendChild(bottomRow);
    this.container.appendChild(this.gridContainer);
    page.appendChild(this.container);

    this.fetchAndRender();
    return page;
  }

  /*
    - Fetch aggregated stats from backend and store locally
    - Overview metrics are rendered immediately
    - Charts and leaderboard rendered only if there are matches and data is available
      - requestAnimationFrame ensures browser completed layout and sizing before Plotly renders charts
    - Use destroyed flag to guard against DOM mutation if page is unmounted during async flow
  */
  private async fetchAndRender() {
    const response = await apiServices.dashboard.getUserDashboard();
    if (this.destroyed) return;
    if (!response.success || !response.data) {
      showMessage(this.container, this.messageContainer, "Dashboard data could not be loaded. Please try again later.", "error");
      this.gridContainer.style.display = "none";
      return ;
    }
    
    this.dashboardData = response.data;
    
    this.renderOverview();
    const totalMatches = this.dashboardData.overview?.totalMatches ?? 0;

    if (totalMatches === 0) {
      this.renderNoDataMessages();
      return;
    }
    requestAnimationFrame(() => {
      if (this.destroyed) return;
      this.renderWinRateChart();
      this.renderScoreHistogram();
      this.renderOpponentBarChart();
    });
    this.renderLeaderboard();
  }

  /*
    - Render high-level user metrics: total matches, wins, win rate, avg score, win streaks
  */
  private renderOverview() {
    if (this.destroyed || !this.dashboardData?.overview) return;
    const { overview } = this.dashboardData;
  
    const overviewDiv = this.container.querySelector("#overviewCard");
    if (!overviewDiv) return;
  
    const metrics = [
      { label: t("dashboard.totalMatches") as string, value: overview.totalMatches },
      { label: t("dashboard.totalWins") as string, value: overview.totalWins },
      { label: t("dashboard.winRate") as string, value: overview.winRate + "%" },
      { label: t("dashboard.averageScore") as string, value: overview.avgScore },
      { label: t("dashboard.currentStreak") as string, value: overview.currentWinStreak },
      { label: t("dashboard.longestStreak") as string, value: overview.longestWinStreak },
    ];
  
    const metricsHTML = metrics
      .map(
        (m) => `
        <div class="flex justify-between items-center py-1 border-b border-white">
          <span class="text-yellow-300 font-semibold">${m.label}</span>
          <span class="text-white font-medium">${m.value}</span>
        </div>
      `
      )
      .join("");
  
    overviewDiv.innerHTML = `
      <h2 class="text-yellow-300 mb-4 text-xl font-bold">${t("dashboard.overview")}</h2>
      <div class="flex flex-col gap-2">
        ${metricsHTML}
      </div>
    `;
  }
  
  // Render win rate over time using Plotly
  private renderWinRateChart() {
    if (this.destroyed || !this.dashboardData?.dailyStats?.length) return;
    const { dailyStats } = this.dashboardData;

    const winRateChartDiv = this.container.querySelector("#winRateChart");
    if (!winRateChartDiv) return;

    const trace = {
      x: dailyStats.map((p) => new Date(p.date).toISOString().split("T")[0]),
      y: dailyStats.map((p) => p.winRate * 100),
      type: "scatter",
      mode: "lines+markers",
      line: { color: "#E43E64", width: 3 },
    };
    const layout = {
      title: t("dashboard.winRateOverTime"),
      font: {
        family: "'DM Sans', sans-serif",
        color: "#FFD400",
        size: 12,
      },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      xaxis: {
        type: "date",
        title: t("dashboard.date"),
        color: "#FFD400",
        gridcolor: "rgba(255, 212, 0, 0.2)",
        tickformat: "%b %d",
        tickangle: -30,
        dtick: "D1",
      },
      yaxis: {
        title: "%",
        range: [0, 100],
        color: "#FFD400",
        gridcolor: "rgba(255, 212, 0, 0.2)",
      },
      margin: { t: 70, b: 80, l: 60, r: 40 },
    };
    Plotly.newPlot(winRateChartDiv, [trace], layout, { responsive: true });
  }

  // Render score distribution histogram using Plotly
  private renderScoreHistogram() {
    if (this.destroyed || !this.dashboardData?.scoreDistribution?.length) return;
    const { scoreDistribution } = this.dashboardData;

    const scoreHistogramDiv = this.container.querySelector("#scoreHistogram");
    if (!scoreHistogramDiv) return;

    const trace = {
      x: scoreDistribution,
      type: "histogram",
      marker: { color: "#E43E64" },
      xbins: { start: -0.5, end: 5.5, size: 1 },
    };
    const layout = {
      title: t("dashboard.scoreDistribution"),
      font: {
        family: "'DM Sans', sans-serif",
        color: "#FFD400",
        size: 12,
      },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      xaxis: {
        title: t("dashboard.score"),
        color: "#FFD400",
        gridcolor: "rgba(255, 212, 0, 0.2)",
        dtick: 1,
        range: [-0.5, 5.5],
        tickvals: [0, 1, 2, 3, 4, 5],
      },
      yaxis: {
        title: t("dashboard.numberOfGames"),
        color: "#FFD400",
        gridcolor: "rgba(255, 212, 0, 0.2)",
      },
      autosize: true,
      margin: { t: 70, b: 80, l: 60, r: 40 },
    };
    Plotly.newPlot(scoreHistogramDiv, [trace], layout, { responsive: true });
  }

  // Render win rate by opponent (registered user) using bar chart
  private renderOpponentBarChart() {
    if (this.destroyed) return;

    const winsPerOpponentDiv = this.container.querySelector("#winsPerOpponent");
    if (!winsPerOpponentDiv) return;

    const { winsPerOpponent } = this.dashboardData!;

    if (!winsPerOpponent.length) {
      winsPerOpponentDiv.innerHTML = `
        <h2 class="text-yellow-300 mb-2 font-bold">${t('dashboard.winsPerOpponent') as string}</h2>
        <p class="no-data">${t('dashboard.noOppDataMessage')}</p>
      `;
      return;
    }
    const trace = {
      x: winsPerOpponent.map((p) => p.opponent),
      y: winsPerOpponent.map((p) => p.winRate),
      type: "bar",
      marker: { color: "#6B5B95" },
      text: winsPerOpponent.map(p => `${p.winRate}%`),
      textposition: "outside",
      cliponaxis: false
    };
    const layout = {
      title: t("dashboard.winsPerOpponent"),
      font: {
        family: "'DM Sans', sans-serif",
        color: "#FFD400",
        size: 12,
      },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      xaxis: {
        color: "#FFD400",
        gridcolor: "rgba(255, 212, 0, 0.2)",
      },
      yaxis: {
        title: "%",
        range: [0, 100],
        color: "#FFD400",
        gridcolor: "rgba(255, 212, 0, 0.2)",
      },
      autosize: true,
      margin: { t: 70, b: 100, l: 80, r: 100 },
    };
    Plotly.newPlot(winsPerOpponentDiv, [trace], layout, { responsive: true });
  }

  // Render global leaderboard table
  /*
    - Highlights current user row
    - Alternates row styling 
  */
  private renderLeaderboard() {
    if (this.destroyed || !this.dashboardData?.leaderboard?.length) return;
    const { leaderboard } = this.dashboardData;

    const leaderboardDiv = this.container.querySelector("#leaderboard");
    if (!leaderboardDiv) return;
  
    const rows = leaderboard
      .map((p, index) => {
        // Determine row background based on odd/even 
        const rowColor = p.isCurrentUser
          ? "bg-yellow-400 text-black"
          : index % 2 === 0
          ? "bg-[#7EA2DD]"
          : "bg-[none]";
  
        return `
          <tr class="${rowColor}">
            <td class="py-2 px-3">${p.rank}</td>
            <td class="py-2 px-3">${p.username}</td>
            <td class="py-2 px-3">${p.totalMatches}</td>
            <td class="py-2 px-3">${p.winRate}%</td>
            <td class="py-2 px-3">${p.avgScore}</td>
            <td class="py-2 px-3">${p.leaderboardScore}</td>
          </tr>
        `;
      })
      .join("");
  
    leaderboardDiv.innerHTML = `
      <h2 class="text-yellow-300 mb-4">${t("dashboard.leaderboard")}</h2>
      <table class="w-full text-white text-[1rem] border-collapse">
        <thead>
          <tr class="bg-yellow-300/10 text-yellow-300">
            <th class="py-2 px-3">#</th>
            <th class="py-2 px-3">${t("dashboard.player")}</th>
            <th class="py-2 px-3">${t("dashboard.matches")}</th>
            <th class="py-2 px-3">${t("dashboard.winRate")}</th>
            <th class="py-2 px-3">${t("dashboard.averageScore")}</th>
            <th class="py-2 px-3">${t("dashboard.leaderboardScore")}</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }
  
  // Placeholder messages when no match data exists to avoid empty/misleading charts
  private renderNoDataMessages() {
    if (this.destroyed) return;

    const placeholders = [
      { id: "winRateChart", title: t('dashboard.winRateOverTime') as string },
      { id: "scoreHistogram", title: t('dashboard.scoreDistribution') as string },
      { id: "winsPerOpponent", title: t('dashboard.winsPerOpponent') as string },
      { id: "leaderboard", title: t('dashboard.leaderboard') as string },
    ];
    placeholders.forEach(({ id, title }) => {
      const div = this.container.querySelector<HTMLElement>(`#${id}`);
      if (!div) return;
        div.innerHTML = `
            <h2 class="text-yellow-300 mb-2 font-bold">${title}</h2>
          <p class="no-data">${t('dashboard.noDataMessage')}</p>
        `;
    });
  }
  
  /*
    - Set destroyed flag to true
    - Destroy each Plotly chart 
  */
  public cleanup() {
    this.destroyed = true;

    const plotIds = ["winRateChart", "scoreHistogram", "winsPerOpponent",];

    plotIds.forEach((id) => {
      const el = this.container?.querySelector<HTMLElement>(`#${id}`);
      if (el && typeof Plotly !== "undefined") {
        Plotly.purge(el);
      }
    });
  }
}

