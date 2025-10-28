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

    // Chart container
    const chartDiv = document.createElement("div");
    chartDiv.id = "scoreChart";
    chartDiv.style.width = "700px";
    chartDiv.style.height = "400px";
    this.container.appendChild(chartDiv);

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

    // Draw chart after elements are in DOM
    // requestAnimationFrame(() => this.renderChart());

    return this.container;
  }

 
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
      this.renderChart();
    } catch (err) {
      console.error("Error fetching dashboard:", err);
      const chartDiv = document.getElementById("scoreChart");
      if (chartDiv) chartDiv.textContent = "Error loading chart data.";
    }
  }

  private renderChart(): void {
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
}
