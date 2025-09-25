import { resourceLimits } from "worker_threads";
import { IComponent } from "../components/IComponent";
import { apiServices } from "../services/ApiServices.js";
import { Player } from "../services/tournament/types";

export class Tournament implements IComponent {
	private container!: HTMLElement;
	private tournamentId: number | null = null;
	private numberOfPlayers: number | null = null;
	private currentStep: "setup" | "addPlayers" | "lineup" | "match" | "results" = "setup";
	private players: Player[] = [];
    private isLoading = false;
	private playerIndex = 1;

	public render(): HTMLElement {
		this.container = document.createElement('div');
		this.renderStep();
		return this.container;
	}
	
	private renderStep() {
		this.container.innerHTML = "";

		switch (this.currentStep) {
			case "setup":
				this.showSetupPage();
				break;
			// case "addPlayers":
			// 	break;
		}
	}

	private showSetupPage() {
		// this.container.innerHTML = "";
		
		const form = document.createElement("form");
		const label = document.createElement("label");
		label.textContent = "Number of Players:";
		form.appendChild(label);

		const input = document.createElement('input');
		input.type = 'number';
		input.min = "2";
		input.max = "64";
		input.value = this.numberOfPlayers?.toString() || "";
		input.required = true;
		input.addEventListener('input', () => {
			this.numberOfPlayers = parseInt(input.value, 10);
		});
		form.appendChild(input);

		const submitButton = document.createElement('button');
		submitButton.type = 'submit';
		submitButton.textContent = "Create Tournament";
		form.appendChild(submitButton);
		
		form.addEventListener('submit', async (event) => {
			event.preventDefault();
			if (!this.numberOfPlayers || this.numberOfPlayers < 2) {
				alert("Please enter at least 2 players");
				return ;
			}
			this.isLoading = true;
			submitButton.disabled = true;
			submitButton.textContent = "Creating...";
			const response  = await apiServices.tournament.createTournament(this.numberOfPlayers);
			
			// Reset form so user can try again 
			this.isLoading = false;
			submitButton.disabled = false;
			submitButton.textContent = "Create Tournament";
			
			if (response.success && response.data) {
				this.tournamentId = response.data.id;
				this.currentStep = "addPlayers";
				this.renderStep();
			} else {
				console.error(response.message || "Failed to create tournament: ");
			}
		});
		this.container.appendChild(form);

	}

	// private goBack() {
	// 	if (this.currentStep === "addPlayers")
	// 		this.currentStep = "setup";
	// 	else if (this.currentStep === "lineup")
	// 		this.currentStep = "addPlayers";
	// 	else if (this.currentStep === "match")
	// 		this.currentStep = "lineup";
	// 	this.renderStep();
	// }
	// private showAddPlayerPage() {
		// // this.container.innerHTML = "";
		// const heading = document.createElement("h3");
		// heading.textContent = `Add Player ${this.playerIndex + 1} of ${this.numberOfPlayers} `

		// const form = document.createElement("form");
		
		// // TODO: Add login input

		// // Guest Name
		// const label = document.createElement("label");
		// label.textContent = "Guest Display Name";
		// form.appendChild(label);
		// const input = document.createElement("input");
		// input.type = "text";
		// input.name = "guestName";
		// input.required = true;
		// form.appendChild(input);

		// const submitButton = document.createElement("button");
	

	// }
	// private showLineupPage() {
		
	// }
	// private showMatchPage() {
		
	// }
	// private showResultsPage() {
		
	// }
}