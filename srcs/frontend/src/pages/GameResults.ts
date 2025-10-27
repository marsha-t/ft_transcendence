import { IComponent } from "../components/IComponent";
import { apiServices } from "../services/ApiServices";
import { navigate } from "../utils";

declare const Plotly: any;

export class GameResults implements IComponent {
  private sessionId: number;
  private isTournament: boolean;
  private onMatchEnd?: () => void;

  constructor(state?: any) {
    this.sessionId = state?.sessionId;
    this.isTournament = state?.isTournament ?? false;
    this.onMatchEnd = state?.onMatchEnd;
  }

  public render(): HTMLElement {
    const container = document.createElement("div");
    container.className = "game-dashboard";

    // Title
    const title = document.createElement("h1");
    title.textContent = "Game Results";
    title.className = "dashboard-title";
    container.appendChild(title);

    // Chart container
    const chartDiv = document.createElement("div");
    chartDiv.id = "scoreChart";
    chartDiv.style.width = "700px";
    chartDiv.style.height = "400px";
    container.appendChild(chartDiv);

    // Button section
    const btnContainer = document.createElement("div");
    btnContainer.className = "results-buttons";

    if (this.isTournament && this.onMatchEnd) {
      const nextBtn = document.createElement("button");
      nextBtn.textContent = "Next";
      nextBtn.onclick = () => {
        this.onMatchEnd!();
      }
      btnContainer.appendChild(nextBtn);
    }
    container.appendChild(btnContainer);

    // Draw chart after elements are in DOM
    requestAnimationFrame(() => this.renderChart());

    return container;
  }

  private renderChart(): void {
    const chartDiv = document.getElementById("scoreChart");
    if (!chartDiv) return;

    // Dummy timeline data
    const timeline = [
      { elapsedSec: 0, left: 0, right: 0 },
      { elapsedSec: 10, left: 1, right: 0 },
      { elapsedSec: 25, left: 1, right: 1 },
      { elapsedSec: 40, left: 2, right: 1 },
      { elapsedSec: 60, left: 2, right: 2 },
      { elapsedSec: 75, left: 3, right: 2 },
      { elapsedSec: 90, left: 4, right: 2 },
      { elapsedSec: 100, left: 5, right: 2 },
    ];

	const traceLeft = {
		x: timeline.map(p => p.elapsedSec),
		y: timeline.map(p => p.left),
		mode: "lines+markers",
		name: "Left Player",
		line: { color: "#423f6a", width: 3 },
      marker: { size: 6 },
    };
	const traceRight = {
      x: timeline.map(p => p.elapsedSec),
      y: timeline.map(p => p.right),
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

	Plotly.newPlot(chartDiv, [traceLeft, traceRight], layout, { responsive: true });
  }
}
