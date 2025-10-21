import { IComponent } from "../components/IComponent";
import { navigate } from "../utils.js";
import { TournamentDraftStore } from "../services/tournament/TournamentDraftStore.js";
import { apiServices } from "../services/ApiServices";

export class TournamentSetup implements IComponent {
	private container!: HTMLElement;

	public render(): HTMLElement {
		this.loadStyles();
		const page = document.createElement("div");
		page.className = "tournament-page";
		
		this.container = document.createElement('div');
		this.container.className = 'tournament-setup';

		const title = document.createElement('h2');
		title.textContent = '🏆 Tournament Setup';
		this.container.appendChild(title);

		// --- Input section ---
		const counterContainer = document.createElement("div");
		counterContainer.className = "counter-container";

		const label = document.createElement('label');
		label.textContent = 'Number of Players:';
		counterContainer.appendChild(label);

		const input = document.createElement("input");
		input.type = "number";
		input.min = "2";
		input.max = "64";

		// If there's already a stored draft, use it; otherwise default to 2
		const savedNum = TournamentDraftStore.numberOfPlayers;
		input.value = String(savedNum ?? 2);

		// sync store if not yet initialized
		if (savedNum == null) {
			TournamentDraftStore.setNumberOfPlayers(parseInt(input.value, 10));
		}

		// Keep track of original to detect changes later
		let originalNum = TournamentDraftStore.numberOfPlayers;

		// Handle user change 
		input.addEventListener("change", () => {
			const newNum = parseInt(input.value, 10);
			if (isNaN(newNum) || newNum < 2) {
				alert("Minimum 2 players required");
				input.value = String(originalNum);
				return;
			}

			// if changing to a different number than current draft
			if (originalNum && newNum !== originalNum) {
				const hasExistingDraft = TournamentDraftStore.players.length > 0;
				if (hasExistingDraft) {
					const confirmReset = confirm(
						"Changing player count will reset your current setup. Continue?"
					);
					if (!confirmReset) {
						input.value = String(originalNum);
						return;
					}
					// wipe only if confirmed
					TournamentDraftStore.clear();
				}
				TournamentDraftStore.setNumberOfPlayers(newNum);
				originalNum = newNum;
			} else {
				// same number, just make sure it's saved
				TournamentDraftStore.setNumberOfPlayers(newNum);
			}
		});
		
		counterContainer.appendChild(input);
		this.container.appendChild(counterContainer);

		// --- Buttons actions ---
		const actions = document.createElement('div');
		const nextBtn = document.createElement('button');
		nextBtn.textContent = 'Next';
		nextBtn.addEventListener("click", () => {
			const n = TournamentDraftStore.numberOfPlayers;
			if (!n || n < 2) return alert("Please set at least 2 players");

			const currentUser = { userId: 1, displayName: "marsha", isGuest: false}; // TODO hardcoded to 1; 
			if (!currentUser) {
				alert("No logged-in user found.");
				return ;
			}
			// Reset draft (in case user clicks 'back' to return to setup page and changes number of players)
			const alreadyHas = TournamentDraftStore.players.some(p => p.userId === currentUser.userId);
			if (!alreadyHas) TournamentDraftStore.addPlayer(currentUser);
			
			navigate("/tournament/add-players");
		});

		actions.appendChild(nextBtn);
		this.container.appendChild(actions);
		page.appendChild(this.container);

		return page;
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