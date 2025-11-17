import { IComponent } from "../components/IComponent";
import { apiServices } from "../services/ApiServices.js";
import {showConfirmation} from "../utils/profileUtils";
import { GameDashboard } from "../services/dashboard/types";
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

    const page = document.createElement("div");
    page.className = `bg-[var(--color-background)] flex justify-center items-center
      flex-col min-h-[80vh] rounded-[16px] p-5 text-[var(--color-text-white)]
      font-pixel text-center`;
    this.container = document.createElement("div");
    this.container.className = `flex flex-col items-center  w-full min-h-[80vh] p-10 px-8
      bg-background rounded-[30px]`;

    // Results container
    const resultsContainer = document.createElement("div");
    resultsContainer.className = "flex justify-center gap-[10px] m-8 w-[75%]  mx-auto grid grid-cols-[0.3fr_0.7fr] gap-8 h-full flex-grow";

    // Left: leaderboard summary
    const leftDiv = document.createElement("div");
    leftDiv.className = "flex-1 flex flex-col bg-[#21447E] rounded-xl shadow-[inset_0_0_10px_rgba(255,255,0,0.15)] p-8 self-stretch";
    
    const summaryDiv = document.createElement("div");
    summaryDiv.className = "text-center text-white w-full";
    leftDiv.appendChild(summaryDiv);

    // Right: chart + player stats
    const rightDiv = document.createElement("div");
    rightDiv.className = "flex-2 flex items-center bg-[var(--color-background)]  grid grid-rows-2  gap-8 rounded-xl";
    
    const chartDiv = document.createElement("div");
    chartDiv.className = `
      rounded-xl 
      bg-[#21447E] 
      p-5 
      shadow-[inset_0_0_6px_rgba(255,255,255,0.1)]
      w-full
      h-full
      mb-8
    `;
  
    chartDiv.id = "scoreChart";

    const playersDiv = document.createElement("div");
    playersDiv.className = "grid grid-cols-2 gap-8 w-full";

    rightDiv.appendChild(chartDiv);
    rightDiv.appendChild(playersDiv);

    resultsContainer.appendChild(leftDiv);
    resultsContainer.appendChild(rightDiv);
    this.container.appendChild(resultsContainer);

    // Button section
    const btnContainer = document.createElement("div");
    btnContainer.className = "flex gap-4 text-center mt-4";
  
    if (this.isTournament && this.onMatchEnd) {
      const nextBtn = document.createElement("button");
      nextBtn.textContent = "Next";
      nextBtn.className = "bg-[#74d882] text-black border-none rounded-lg px-10 py-3.5 font-bold cursor-pointer transition-all duration-200 font-['Press_Start_2P'] text-sm hover:scale-105";
      nextBtn.onclick = () => {
        TournamentStore.isNavigatingToNextMatch = true;
        this.onMatchEnd!();
      };
      btnContainer.appendChild(nextBtn);
    }
    this.container.appendChild(btnContainer);

    // Fetch data
    this.fetchAndRender();

    page.appendChild(this.container);
    return page;
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

    const summaryDiv = this.container.querySelector("div.text-center.text-white.w-full");
    if (!summaryDiv) return;

    const { summary } = this.dashboardData;

    // Clear existing content
    summaryDiv.innerHTML = '';

    // Winner card container
    const winnerCard = document.createElement("div");
    winnerCard.className = "flex flex-col items-center";

    // Avatar
    const avatar = document.createElement("img");
    avatar.src = this.getAvatarUrl(summary.winner?.avatar ?? "/uploads/avatars/default.png");
    avatar.alt = "";
    avatar.className = "w-[110px] h-[110px] rounded-full border-[3px] border-[#fdd835] object-cover mb-4 bg-[#00000040] shadow-[0_0_8px_rgba(255,255,0,0.5)]";
    winnerCard.appendChild(avatar);

    // Trophy icon
    const trophyIcon = document.createElement("div");
    trophyIcon.className = "text-[10rem] text-[#fdd835] mb-4";
    trophyIcon.textContent = "🏆";
    winnerCard.appendChild(trophyIcon);

    // Winner label
    const winnerLabel = document.createElement("div");
    winnerLabel.className = "text-sm text-[#b0b6e6] uppercase mb-1.5";
    winnerLabel.textContent = "winner";
    winnerCard.appendChild(winnerLabel);

    // Winner name
    const winnerName = document.createElement("div");
    winnerName.className = "text-4xl font-bold mb-5 text-[#fdd835]";
    winnerName.textContent = summary.winner?.displayName ?? "No Winner";
    winnerCard.appendChild(winnerName);

    summaryDiv.appendChild(winnerCard);

    // Score box
    const scoreBox = document.createElement("div");
    scoreBox.className = "bg-[#0c1e4a] rounded-xl p-4 my-2 mb-4 border-2 border-[#fdd835] w-[90%] mx-auto";
    const scoreText = document.createElement("p");
    scoreText.className = "text-base text-white font-semibold mt-4 tracking-wide";
    scoreText.textContent = `Final Score: ${summary.finalScore.left} - ${summary.finalScore.right}`;
    scoreBox.appendChild(scoreText);
    summaryDiv.appendChild(scoreBox);

    // Duration box
    const durationBox = document.createElement("div");
    durationBox.className = "bg-[#0c1e4a] rounded-xl p-4 my-2 mb-4 border-2 border-[#fdd835] w-[90%] mx-auto";
    const durationText = document.createElement("p");
    durationText.className = "text-base text-white font-semibold mt-4 tracking-wide";
    durationText.textContent = `Total Duration: ${summary.totalDurationSec.toFixed(1)}s`;
    durationBox.appendChild(durationText);
    summaryDiv.appendChild(durationBox);
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

  const playersDiv = this.container.querySelector(
    "div.grid.grid-cols-2.gap-8.w-full"
  );

  if (!playersDiv) return;

  playersDiv.innerHTML = "";

    // Create player stats container
    const playerStatsContainer = document.createElement("div");
    playerStatsContainer.className = "grid grid-cols-2 gap-8 w-full";

    // Create player cards
    this.dashboardData.players.forEach((player) => {
      const playerCard = document.createElement("div");
      playerCard.className = `
      bg-[#21447E]  rounded-xl  border-2 border-[#fdd835]  p-6
      text-center  text-white  shadow-[0_0_10px_rgba(255,255,0,0.15)]
      font-pixel text-lg  tracking-wide  transition-all h-full`;
      // Avatar
      const avatar = document.createElement("img");
      avatar.src = this.getAvatarUrl(player.avatar);
      avatar.alt = player.displayName;
      avatar.className = "w-[100px] h-[100px] rounded-full object-cover block mx-auto mb-3 shadow-[0_2px_5px_rgba(0,0,0,0.08)] border-2 border-[vsar(--color-border-green)] bg-[var(--color-background)]";
      playerCard.appendChild(avatar);

      // Player name
      const playerName = document.createElement("h3");
      playerName.className = "mb-4 text-xl font-semibold text-white font-['Press_Start_2P']";
      playerName.textContent = player.displayName;
      playerCard.appendChild(playerName);

      // Stats list
      const statsList = document.createElement("ul");
      statsList.className = "list-none p-0 m-0 text-left font-['VT323'] text-lg text-[#d0d0ff] leading-relaxed";

      const stats = [
        { label: "Score", value: player.score.toString() },
        { label: "Time to 1st Point", value: player.timeToFirstPointSec ? `${player.timeToFirstPointSec.toFixed(1)}s` : "-" },
        { label: "Avg Time per Point", value: player.avgTimePerPointSec ? `${player.avgTimePerPointSec.toFixed(1)}s` : "-" },
        { label: "Total Matches", value: player.totalMatches.toString() },
        { label: "Wins", value: player.totalWins.toString() },
        { label: "Win Rate", value: `${player.winRate.toFixed(1)}%` }
      ];

      stats.forEach((stat) => {
        const li = document.createElement("li");
        li.className = "my-1 flex justify-between";
        
        const span = document.createElement("span");
        
        const strong = document.createElement("strong");
        strong.className = "text-[#fdd835] font-semibold";
        strong.textContent = `${stat.label}:`;
        
        span.appendChild(strong);
        span.appendChild(document.createTextNode(` ${stat.value}`));
        li.appendChild(span);
        statsList.appendChild(li);
      });

      playerCard.appendChild(statsList);
      playerStatsContainer.appendChild(playerCard);
    });

    playersDiv.appendChild(playerStatsContainer);
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
    // Only enforce warning during tournament flow
    if (!this.isTournament) return true;

    if (TournamentStore.isNavigatingToNextMatch) {
      TournamentStore.isNavigatingToNextMatch = false;
      return true;
    }
    const confirmLeave = showConfirmation("A tournament is in progress. Leaving will abort it.", "Please Confirm", true);

    if (!confirmLeave) return false;

    // If user confirms, abort the tournament
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
