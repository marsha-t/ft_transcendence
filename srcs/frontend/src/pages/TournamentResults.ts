import { IComponent } from "../components/IComponent";
import { navigate } from "../utils.js";
import { apiServices } from "../services/ApiServices.js";

export class TournamentResults implements IComponent {
	private container!: HTMLElement;
	private tournamentId: number;

	constructor(tournamentId: number) {
		this.tournamentId = tournamentId;
	}

	public render(): HTMLElement {
		this.loadStyles();
		localStorage.removeItem("activeTournament");

		const page = document.createElement("div");
		page.className = "tournament-page";

		this.container = document.createElement('div');
		this.container.className = 'tournament-results';

		const h2 = document.createElement('h2');
		h2.textContent = 'Tournament Results';
		this.container.appendChild(h2);

		this.loadResults();
		page.appendChild(this.container);
		return page;
	}

	private async loadResults() {
		try {
			const response = await apiServices.tournament.getNextMatch(this.tournamentId);
			if (!response.success || !response.data || !response.data.results) {
				this.container.textContent = response.message || "Failed to load results";
				return;
			}
			const results = response.data.results;
				const { champion , bracket, stats} = results;

			this.renderChampion(champion);
			this.renderBracket(bracket);
			this.renderStats(stats);
			this.renderActions();
		} catch (err) {
			console.error("Error loading results:", err);
			this.container.textContent = "Error loading results.";
		}
	}

	private renderChampion(champion: string | null) {
		const championDiv = document.createElement("div");
			championDiv.className = "champion-section";
			championDiv.innerHTML = `
				<h3>Champion</h3>
				<p class="champion-name">${champion ?? "-"}</p>`;
			this.container.appendChild(championDiv);
	}

	private renderBracket(bracket: any[]) {
		const bracketDiv = document.createElement("div");
			bracketDiv.className = "bracket-section";
			bracketDiv.innerHTML = `<h3>Matches</h3>`;
		const table = document.createElement("table");
			table.className = "bracket-table";
			table.innerHTML = `
				<tr>
					<th>Match</th>
					<th>Player 1</th>
					<th>Player 2</th>
					<th>Winner</th>
				</tr>
				${bracket.map((m) => `<tr>
					<td>${m.matchIndex}</td>
					<td>${m.player1 ?? "-"}</td>
					<td>${m.player2 ?? "-"}</td>
					<td>${m.winner ?? "-"} </td>
				</tr>`).join("")}
			`;
			bracketDiv.appendChild(table);
			this.container.appendChild(bracketDiv);
	}

	private renderStats(stats: any) {
		const statsDiv = document.createElement("div");
			statsDiv.className = "stats-section";
			statsDiv.innerHTML = `
				<h3>Stats</h3>
				<p>Total Matches: ${stats.totalMatches}</p>
				<p>Played Matches: ${stats.playedMatches}</p>
			`;
			this.container.appendChild(statsDiv);

	}
	private renderActions() {
		const btnContainer = document.createElement("div");
		btnContainer.className = "results-actions";

		const newBtn = document.createElement("button");
		newBtn.textContent = "Start New Tournament";
		newBtn.className = "new-tournament-btn";
		newBtn.addEventListener("click", () => navigate("/tournament/setup"));

		btnContainer.appendChild(newBtn);
		this.container.appendChild(btnContainer);
	}
	
	private loadStyles() {
		if (document.getElementById("tournament-styles")) return;
		const link = document.createElement("link");
		link.id = "tournament-styles";
		link.rel = "stylesheet";
		link.href = "/styles/Tournament.css";
		document.head.appendChild(link);
	}
}
