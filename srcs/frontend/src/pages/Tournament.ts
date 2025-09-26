import { IComponent } from "../components/IComponent";
import { apiServices } from "../services/ApiServices.js";
import { Player } from "../services/tournament/types";
import { Game } from "./Game.js";

export class Tournament implements IComponent {
	private container!: HTMLElement;
	private tournamentId: number | null = null;
	private numberOfPlayers: number | null = null;
	private currentStep: "setup" | "addPlayers" | "lineup" | "match" | "results" = "setup";
	private players: Player[] = [];
    private isLoading = false;
	private playerIndex = 0;

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
			case "addPlayers":
				this.showAddPlayerPage();
				break;
			case "lineup":
				this.showLineupPage();
				break;
			case "match":
				this.showMatchPage();
				break;
			// case "result":
			// 	this.showResultsPage();
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

			const userId = 1; // TO DO: hardcoded userId; 
			const response  = await apiServices.tournament.createTournament(userId, this.numberOfPlayers);
			
			// Reset form so user can try again 
			this.isLoading = false;
			submitButton.disabled = false;
			submitButton.textContent = "Create Tournament";
			
			if (response.success && response.data) {
				this.tournamentId = response.data.id;
				this.currentStep = "addPlayers";
				this.playerIndex = 1;
				this.players.push({ id: 0, displayName: response.data.displayName });
				this.renderStep();
			} else {
				console.error(response.message || "Failed to create tournament: ");
			}
		});
		this.container.appendChild(form);
	}

	private showAddPlayerPage() {
		// this.container.innerHTML = "";
		const heading = document.createElement("h3");
		heading.textContent = `Add Player ${this.playerIndex + 1} of ${this.numberOfPlayers} `

		const form = document.createElement("form");
		
		const choiceLabel = document.createElement("p");
		choiceLabel.textContent = "Add existing user or guest";
		form.appendChild(choiceLabel);

		// Username / Password
		const usernameInput = document.createElement("input");
		usernameInput.type = "text";
		usernameInput.name = "username";
		usernameInput.placeholder = "Username";
		form.appendChild(usernameInput);

		const passwordInput = document.createElement("input");
		passwordInput.type = "text";
		passwordInput.name = "password";
		passwordInput.placeholder = "Password";
		form.appendChild(passwordInput);

		// Guest Name
		const guestInput = document.createElement("input");
		guestInput.type = "text";
		guestInput.name = "guestName";
		guestInput.placeholder = "Guest Display Name";
		form.appendChild(guestInput);

		// Submit button
		const submitButton = document.createElement("button");
		submitButton.type = "submit";
		submitButton.textContent = "Add Player";
		form.appendChild(submitButton);
	
		this.container.appendChild(form);

		form.addEventListener("submit", async (event) => {
			event.preventDefault();
			const username = usernameInput.value.trim();
    		const password = passwordInput.value.trim();
    		const guestName = guestInput.value.trim();

			let body: any = {};
			if (username && password) {
				body = { username, password };
			} else if (guestName) {
				body = { guestName };
			} else {
				alert("Please provide login credentials OR a guest display name");
				return ;
			}

			const response = await apiServices.tournament.addTournamentPlayer(this.tournamentId!, body);
			if (!response.success) {
				alert(response.message);
				return ;
			}
			if (response.data) {
				this.players.push(response.data);
			}
			this.playerIndex++;
			if (this.playerIndex < this.numberOfPlayers!) {
				this.renderStep();
			} else {
				this.currentStep = "lineup";
				this.renderStep();
			}
		});
	}

	private showLineupPage() {
		// this.container.innerHTML = "";
		
		const heading = document.createElement("h3");
		heading.textContent = "Tournament Players";
		this.container.appendChild(heading);

		// List players
		const list = document.createElement("ul");
		this.players.forEach((p, index) => {
			const li = document.createElement("li");
			li.textContent = `${index + 1}. ${p.displayName}`;
			list.appendChild(li);
		});
		this.container.appendChild(list);

		// Start button
		const startButton = document.createElement("button");
		startButton.textContent = "Start Tournament";
		this.container.appendChild(startButton);

		startButton.addEventListener("click", async() => {
			startButton.disabled = true;
			startButton.textContent = "Starting...";
			const response = await apiServices.tournament.updateTournamentStatus(this.tournamentId!, 'STARTED');
			if (!response.success) {
				alert(response.message || "Failed to start tournament");
				return ;
			}
			this.currentStep = "match";
			this.renderStep();
		});

	}
	private async showMatchPage() {
		
		try {
			const response = await apiServices.tournament.getNextMatch(this.tournamentId!);
			if (!response.success) {
				alert(response.message || "Failed to fetch next match");
				return ;
			}
			
			const data = response.data;
			if (!data?.nextMatch){
				this.currentStep = "results";
				this.renderStep();
				return ;
			}

			const heading = document.createElement("h3");
			heading.textContent = "Next Match";
			this.container.appendChild(heading);

			const { matchIndex, player1, player2, gameSessionId } = data.nextMatch;
			const matchInfo = document.createElement("p");
			matchInfo.textContent = `Match ${matchIndex}`;
			this.container.appendChild(matchInfo);

			const players = document.createElement("p");
			players.textContent = `${player1?.displayName} vs ${player2?.displayName}`;
			this.container.appendChild(players);

			const readyButton = document.createElement("button");
			readyButton.textContent = "Ready";
			this.container.appendChild(readyButton);

			readyButton.addEventListener("click", async () => {
				readyButton.disabled = true;
				readyButton.textContent = "Starting...";

				await apiServices.game.updateGameStatus(String(gameSessionId), "PLAYING");
				
				this.container.innerHTML = "";
				const game = new Game();
				this.container.appendChild(game.render());

				const nextButton = document.createElement("button");
				nextButton.textContent = "Next Match";
				this.container.appendChild(nextButton);
				nextButton.addEventListener("click", () => {
					this.showMatchPage();
				});
			});

		} catch (err) {
			console.error(err);
    		alert("Error loading match");
		}
	}
	
	// private showResultsPage() {
		
	// }

	// private goBack() {
	// 	if (this.currentStep === "addPlayers")
	// 		this.currentStep = "setup";
	// 	else if (this.currentStep === "lineup")
	// 		this.currentStep = "addPlayers";
	// 	else if (this.currentStep === "match")
	// 		this.currentStep = "lineup";
	// 	this.renderStep();
	// }
}