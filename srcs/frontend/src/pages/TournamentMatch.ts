import { IComponent } from "../components/IComponent";
import { navigate } from "../utils.js";
import { apiServices } from "../services/ApiServices.js";
import { Game } from "./Game.js";
import { enableLeaveWarning } from "../utils.js";

export class TournamentMatch implements IComponent {
	private container!: HTMLElement;
	private tournamentId: number;
	private cleanupWarning?: () => void;

	constructor(tournamentId: number) {
		this.tournamentId = tournamentId;
	}

	public render(): HTMLElement {
		this.loadStyles();

		const page = document.createElement("div");
		page.className = "tournament-page";

		this.container = document.createElement('div');
		this.container.className = 'tournament-match';

		// Warning message if click 'back' or navigate away
		this.cleanupWarning = enableLeaveWarning("A tournament is in progress. Leaving will abort it");
		
		this.loadNextMatch();
		page.appendChild(this.container);
		return page;
	}

	private async loadNextMatch() {
		try {
		this.container.innerHTML = `<div class="loading-text">Loading next match...</div>`;

		const response = await apiServices.tournament.getNextMatch(this.tournamentId);
		if (!response.success) {
			this.container.textContent =response.message || "Failed to load match";
			return;
		}
		const data = response.data;
		if (!data?.nextMatch) {
      		this.cleanup();
			navigate("/tournament/results", { tournamentId: this.tournamentId });
			return ;
		}
		const { matchIndex, player1, player2, gameSessionId } = data.nextMatch;
		this.renderMatch(matchIndex, player1, player2, gameSessionId);

		} catch (err) {
		console.error("Error loading match:", err);
		this.container.textContent = "Error loading match.";
		}
	}
	private renderMatch(matchIndex: number, p1: any, p2: any, gameSessionId: number) {
		this.container.innerHTML = "";
		
		const matchInfo = document.createElement("div");
		matchInfo.className = "match-info";

		const h3 = document.createElement("h3");
		h3.textContent = `Match ${matchIndex}`;
		matchInfo.appendChild(h3);

		const playersInfo = document.createElement("p");
		playersInfo.textContent = `${p1?.displayName ?? "?"} vs ${p2?.displayName ?? "?"}`;
		matchInfo.appendChild(playersInfo);

		this.container.appendChild(matchInfo);
		
		const readyContainer = document.createElement("div");
		readyContainer.className = "ready-container";

		const startBtn = document.createElement("button");
		startBtn.textContent = "Start Match";
		startBtn.className = "ready-btn";
		startBtn.addEventListener("click", () =>
			this.startGame(gameSessionId, p1, p2)
		);
		readyContainer.appendChild(startBtn);
		this.container.appendChild(readyContainer);
	}
	
	private startGame(gameSessionId: number, p1: any, p2: any) {
		this.container.innerHTML = "";

		const game = new Game({
			sessionId: String(gameSessionId),
			isTournament: true,
			displayNames: {
				leftName: p1?.displayName ?? "Player 1",
				rightName: p2?.displayName ?? "Player 2",
			},
			onMatchEnd: () => this.loadNextMatch(), // reload next match
		});
		this.container.appendChild(game.render());
	}
	private loadStyles() {
		if (document.getElementById("tournament-styles")) return;
		const link = document.createElement("link");
		link.id = "tournament-styles";
		link.rel = "stylesheet";
		link.href = "/styles/Tournament.css";
		document.head.appendChild(link);
	}

	public cleanup() {
		if (this.cleanupWarning) {
			this.cleanupWarning();
			this.cleanupWarning = undefined;
		}
	}
}
