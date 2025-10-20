import { IComponent } from "../components/IComponent";
import { navigate } from '../utils.js';
import { TournamentDraftStore } from "../services/tournament/TournamentDraftStore.js";
import { apiServices } from "../services/ApiServices.js";

export class TournamentLineup implements IComponent {
  private container!: HTMLElement;

  public render(): HTMLElement {
	this.loadStyles();

	const page = document.createElement("div");
    page.className = "tournament-page";

	this.container = document.createElement('div');
	this.container.className = 'lineup-container';

	const h2 = document.createElement('h2');
	h2.textContent = 'Confirm Tournament Lineup';
	this.container.appendChild(h2);

	const ul = document.createElement("ul");
	TournamentDraftStore.players.forEach((p, i) => {
		const li = document.createElement("li");
		li.textContent = `${i + 1}. ${p.displayName}`;
		ul.appendChild(li);
	});
	this.container.appendChild(ul);

	const controls = document.createElement('div');
    controls.className = "lineup-controls";

	const confirm = document.createElement("button");
    confirm.textContent = "Confirm & Create Tournament";
    confirm.className = "confirm-btn";
    confirm.addEventListener("click", async () => {
		confirm.disabled = true;
		confirm.textContent = "Creating...";

		const numPlayers = TournamentDraftStore.numberOfPlayers!;
		const playerData = TournamentDraftStore.players.map(p => ({
			displayName: p.displayName,
			userId: p.userId ?? null,
			isGuest: p.isGuest,
		}));

		try {
			const response = await apiServices.tournament.finalizeTournament(numPlayers, playerData);
			if (!response.success) {
				alert(response.message);
				confirm.disabled = false;
				confirm.textContent = "Confirm & Create Tournament";
				return ;
			}
			const tournamentId = response.data.id;
			const start = await apiServices.tournament.updateTournamentStatus(tournamentId, "STARTED");
			if (!start.success) {
				alert(start.message || "Failed to start tournament");
				return ;
			}
			TournamentDraftStore.clear();
			navigate("/tournament/match", { tournamentId });
		} catch (err) {
			console.error("Error finalizing tournament: ", err);
			confirm.disabled = false;
			confirm.textContent = "Confirm & Create Tournament";
		}
	});

	controls.appendChild(confirm);
	this.container.appendChild(controls);
	page.appendChild(this.container);
	return page
  }
  
  private loadStyles() {
    if (document.getElementById("tournament-styles")) return;
    const link = document.createElement("link");
    link.id = "tournament-styles";
    link.rel = "stylesheet";
    link.href = "/styles/tournament.css";
    document.head.appendChild(link);
  }
}
