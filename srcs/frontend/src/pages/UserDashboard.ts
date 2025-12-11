import { IComponent } from "../components/IComponent";
import { apiServices } from "../services/ApiServices.js";
import { UserDashboard } from "../services/dashboard/types";
import { t } from "../services/i18n/i18nService.js";

declare const Plotly: any;

export class ProfileDashboard implements IComponent {
  private container!: HTMLElement;
  private dashboardData: UserDashboard | null = null;

  public render(): HTMLElement {
    const page = document.createElement('div');
    page.className = `
        flex flex-col items-center justify-start
        bg-background rounded-[16px] shadow-lg
        mx-[23px] w-[calc(100%-46px)]
        h-full py-6 px-10 `;

    this.container = document.createElement("div");
    this.container.className = "p-8 flex flex-col items-center gap-8 h-auto w-full font-pixel text-yellow-300";


    // Title
    const isRtl = document.documentElement.dir === 'rtl';
    const alignClass = isRtl ? 'text-right' : 'text-left';

    const title = document.createElement("h1");
    title.textContent = t("dashboard.title") as string;
    title.className = `text-[1.8rem] font-bold text-yellow-300 ${alignClass} mb-4 drop-shadow-[2px_2px_0_#000]`;
  
    this.container.appendChild(title);

    // Grid
    const grid = document.createElement("div");
    grid.className = "grid grid-rows-2  gap-2 w-[90%] max-w-[1400px] place-items-stretch";
    this.container.appendChild(grid);

    const topRow = document.createElement("div");
    topRow.className = "grid grid-cols-3 gap-8 w-full";
  
    // Overview container
    const overviewDiv = document.createElement("div");
    overviewDiv.id = "overviewCard";
    overviewDiv.className = "bg-[#21447E] rounded-[16px] p-8 text-left text-white h-[360px] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_0_#000]";

    const winRateChartDiv = document.createElement("div");
    winRateChartDiv.id = "winRateChart";
    winRateChartDiv.className ="bg-[#21447E] rounded-[16px] p-2  h-[360px] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_0_#000]";

    const scoreHistogramDiv = document.createElement("div");
    scoreHistogramDiv.id = "scoreHistogram";
    scoreHistogramDiv.className = "bg-[#21447E] rounded-[16px] p-2 h-[360px] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_0_#000]";

    topRow.appendChild(overviewDiv);
    topRow.appendChild(winRateChartDiv);
    topRow.appendChild(scoreHistogramDiv);
    
    const bottomRow = document.createElement("div");
    bottomRow.className = "grid grid-cols-[0.33fr_0.67fr]  gap-8 w-full h-[400px]"; 
    // Wins per Opponent
    const winsPerOpponentDiv = document.createElement("div");
    winsPerOpponentDiv.id = "winsPerOpponent";
    winsPerOpponentDiv.className = "bg-[#21447E] rounded-[16px] p-2 h-[400px] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_0_#000]";
    
    // Leaderboard
    const leaderboardDiv = document.createElement("div");
    leaderboardDiv.id = "leaderboard";
    leaderboardDiv.className ="bg-[#21447E] rounded-[16px] p-8 text-left text-yellow-300 h-fulltransition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_0_#000]";
    bottomRow.appendChild(winsPerOpponentDiv);
    bottomRow.appendChild(leaderboardDiv);

    grid.appendChild(topRow);
    grid.appendChild(bottomRow);

    this.container.appendChild(grid);
    page.appendChild(this.container);

    this.fetchAndRender();
    return page;
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
        setTimeout(() => {
          this.renderWinRateChart();
          this.renderScoreHistogram();
          this.renderOpponentBarChart();
        }, 0);
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
    const isRtl = document.documentElement.dir === 'rtl';
    const alignClass = isRtl ? 'text-right' : 'text-left';
  
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
      <h2 class="text-yellow-300 mb-4 text-xl font-bold ${alignClass}">${t("dashboard.overview")}</h2>
      <div class="flex flex-col gap-2">
        ${metricsHTML}
      </div>
    `;
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
        title: t("dashboard.date"),
        color: "#FFD400",
        gridcolor: "rgba(255, 212, 0, 0.2)",
      },
      yaxis: {
        title: "%",
        color: "#FFD400",
        gridcolor: "rgba(255, 212, 0, 0.2)",
      },
      margin: { t: 70, b: 80, l: 60, r: 40 },
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
        color: "#FFD400",
        gridcolor: "rgba(255, 212, 0, 0.2)",
      },
      autosize: true,
      margin: { t: 70, b: 100, l: 80, r: 100 },
    };
    Plotly.newPlot(winsPerOpponentDiv, [trace], layout, { responsive: true });
  }

  private renderLeaderboard() {
    if (!this.dashboardData) return;
  
    const leaderboardDiv = document.getElementById("leaderboard");
    if (!leaderboardDiv) return;

    const isRtl = document.documentElement.dir === 'rtl';
    const alignClass = isRtl ? 'text-right' : 'text-left';
  
    const { leaderboard } = this.dashboardData;
  
    // Generate table rows with dynamic Tailwind classes
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
      <h2 class="text-yellow-300 mb-4 ${alignClass}">${t("dashboard.leaderboard")}</h2>
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
  

  private renderNoDataMessages() {
    const placeholders = [
      { id: "winRateChart", title: t('dashboard.winRateOverTime') as string },
      { id: "scoreHistogram", title: t('dashboard.scoreDistribution') as string },
      { id: "winsPerOpponent", title: t('dashboard.winsPerOpponent') as string },
      { id: "leaderboard", title: t('dashboard.leaderboard') as string },
    ];
    const isRtl = document.documentElement.dir === 'rtl';
    const alignClass = isRtl ? 'text-right' : 'text-left';
    placeholders.forEach(({ id, title }) => {
      const div = document.getElementById(id);
      if (div) {
        div.innerHTML = `
          <h2 class="${alignClass}">${title}</h2>
          <p class="no-data">${t('dashboard.noDataMessage') || 'Not enough matches yet — play a few games to unlock insights!'}</p>
        `;
      }
    });
  }
}



