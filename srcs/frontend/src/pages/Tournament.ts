import { IComponent } from "../components/IComponent";
import { apiServices } from "../services/ApiServices.js";
import { Player } from "../services/tournament/types";
import { Game } from "./Game.js";
 

export class Tournament implements IComponent {
	private container!: HTMLElement;
	private messageContainer!: HTMLElement;
	private tournamentId: number | null = null;
	private numberOfPlayers: number | null = null;
	private currentStep: "setup" | "addPlayers" | "lineup" | "match" | "results" = "setup";
	private players: Player[] = [];
    private isLoading = false;
	private playerIndex = 0;

	public render(): HTMLElement {
		this.loadStyles();
		this.container = document.createElement("div");
		this.container.className = "tournament-page";
	
		this.messageContainer = document.createElement("div");
		this.messageContainer.className = "message-container";
		this.messageContainer.style.display = "none";
		this.container.appendChild(this.messageContainer);
		this.renderStep();
		return this.container;
	}
	
	private renderStep() {
		this.container.innerHTML = "";
		this.container.appendChild(this.messageContainer);

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
			case "results":
				this.showResultsPage();
				break;
			default:
				this.showSetupPage();
		}
	}

	//----------------------------------------
	// PAGE FUNCTIONS 
	// - functions to show specific page in tournament flow
	//----------------------------------------
	private showSetupPage() {
		// Reset state
		this.tournamentId = null;
		this.numberOfPlayers = null;
		this.players = [];
		this.playerIndex = 0;
		this.isLoading = false;

		const tournamentSetup = document.createElement("div");
		tournamentSetup.className = "tournament-setup";

		const title = document.createElement("h2");
		title.textContent = "🏆 Tournament Setup";
		tournamentSetup.appendChild(title);

		const counterContainer = document.createElement("div");
		counterContainer.className = "counter-container";
		// const form = document.createElement("form");
		const label = document.createElement("label");
		label.textContent = "Number of Players:";
		counterContainer.appendChild(label);

		const input = document.createElement('input');
		input.type = 'number';
		input.min = "2";
		input.max = "64";
		this.numberOfPlayers = this.numberOfPlayers ?? 2; // default to 2
		input.value = this.numberOfPlayers.toString();

		input.required = true;
		input.addEventListener("input", () => {
			this.numberOfPlayers = parseInt(input.value, 10);
		});
		counterContainer.appendChild(input);

		const submitButton = document.createElement('button');
		submitButton.textContent = "Create Tournament";
		submitButton.type = 'submit';
		submitButton.className = 'create-btn';
		// form.appendChild(submitButton);
		

		submitButton.addEventListener("click", async () => {
			if (!this.numberOfPlayers || this.numberOfPlayers < 2) {
				// alert("Please enter at least 2 players");
				this.showMessage("Please enter at least 2 players","error");
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
		tournamentSetup.appendChild(counterContainer);
		tournamentSetup.appendChild(submitButton);
		this.container.appendChild(tournamentSetup);
	}

	private showAddPlayerPage() {
		const addPlayerSetup = document.createElement("div");
		addPlayerSetup.className = "add-player";

		const heading = document.createElement("h2");
		heading.textContent = "Add Players";
		// heading.textContent = `Add Player ${this.playerIndex + 1} of ${this.numberOfPlayers} ` ||"Enter existing user credentials or a guest display name";
		addPlayerSetup.appendChild(heading);
	
		const errorContainer = document.createElement("div");
		errorContainer.className = "error-message";
		errorContainer.style.display = "none";
	
		// User inputs
		const userHead  = document.createElement("h3");
		userHead.className = "user-head";
		userHead .textContent = "Registered User";
		addPlayerSetup.appendChild(userHead);
		const userInfo = document.createElement("form");
		userInfo.className = "user-info";
		const usernameInput = document.createElement("input");
		usernameInput.type = "text";
		usernameInput.name = "username";
		usernameInput.id = "username";
		usernameInput.placeholder = "Username";
		usernameInput.className = "form-input";
		const usernameLabel = document.createElement("label");
		usernameLabel.htmlFor = "username";
		usernameLabel.textContent = "Username";
		userInfo.appendChild(usernameLabel);
		userInfo.appendChild(usernameInput);
		
		const passwordInput = document.createElement("input");
		passwordInput.type = "password";
		passwordInput.name = "password";
		passwordInput.id = "password";
		passwordInput.placeholder = "Password";
		passwordInput.className = "form-input";
		const passwordLabel = document.createElement("label");
		passwordLabel.htmlFor = "password";
		passwordLabel.textContent = "Password";
		userInfo.appendChild(passwordLabel);
		userInfo.appendChild(passwordInput);
		addPlayerSetup.appendChild(userInfo);

		// Guest Input
		const guest = document.createElement("form");
		guest.className = "guest-info";
		const guestHead  = document.createElement("h3");
		guestHead.className = "guest-head";
		guestHead .textContent = "Play as a Guest";
		const guestInput = document.createElement("input");
		guestInput.className = "form-input";
		guestInput.type = "text";
		guestInput.name = "guestName";
		guestInput.placeholder = "Guest Name";
		const guestLabel = document.createElement("label");
		guestLabel.textContent = "Guest Name";
		addPlayerSetup.appendChild(guestHead );
		guest.appendChild(guestLabel);
		guest.appendChild(guestInput);

		// Submit button
		const submitButton = document.createElement("button");
		submitButton.type = "submit";
		submitButton.className = "add-btn";
		submitButton.textContent = "Add Player";

		
		submitButton.addEventListener("click", async (event) => {
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
		addPlayerSetup.appendChild(guest);
		addPlayerSetup.appendChild(submitButton);
		this.container.appendChild(addPlayerSetup);
	}
	private showLineupPage() {
		const lineUp = document.createElement("div");
		lineUp.classList.add("lineup-container");

		const heading = document.createElement("h2");
		heading.textContent = "Tournament Players";
		lineUp.appendChild(heading);

		const list = document.createElement("ul");
		this.players.forEach((p, index) => {
			const li = document.createElement("li");
			li.textContent = `${index + 1}. ${p.displayName}`;
			list.appendChild(li);
		});
		lineUp.appendChild(list);

		const startButton = document.createElement("button");
		startButton.textContent = "Start Tournament";
		lineUp.appendChild(startButton);

		startButton.addEventListener("click", async () => {
			startButton.disabled = true;
			startButton.textContent = "Starting...";
			const response = await apiServices.tournament.updateTournamentStatus(
				this.tournamentId!,
				"STARTED"
			);
			if (!response.success) {
				alert(response.message || "Failed to start tournament");
				return;
			}
			this.currentStep = "match";
			this.renderStep();
		});

		this.container.appendChild(lineUp);
	}

	private async showMatchPage() {
		try {
			const response = await apiServices.tournament.getNextMatch(this.tournamentId!);
			if (!response.success) return this.showMessage(response.message || "Failed to fetch next match", "error");

			const data = response.data;
			if (!data?.nextMatch) {
			this.currentStep = "results";
			this.renderStep();
			return;
			}

			const { matchIndex, player1, player2, gameSessionId } = data.nextMatch;

			// Clear container for this match
			this.container.innerHTML = "";

			// --- Main Match Container ---
			const matchWrapper = document.createElement("div");
			matchWrapper.className = "match-container";

			// --- Match Info ---
			const matchInfo = document.createElement("div");
			matchInfo.className = "match-info";
			const heading = document.createElement("h3");
			heading.textContent = `Match ${matchIndex}`;
			matchInfo.appendChild(heading);

			const playersInfo = document.createElement("p");
			playersInfo.textContent = `${player1?.displayName} vs ${player2?.displayName}`;
			matchInfo.appendChild(playersInfo);
			matchWrapper.appendChild(matchInfo);

			// --- Ready Button ---
			const readyContainer = document.createElement("div");
			readyContainer.className = "ready-container";
			const readyButton = document.createElement("button");
			readyButton.textContent = "Ready";

			readyButton.addEventListener("click", async () => {
				readyButton.disabled = true;
				readyButton.textContent = "Starting...";

				// Render game directly in matchWrapper
				matchWrapper.innerHTML = "";
				const game = new Game({ 
					sessionId: String(gameSessionId), 
					isTournament: true,
					displayNames: {
						leftName: player1?.displayName ?? "Player 1",
						rightName: player2?.displayName ?? "Player 2",
					},
					onMatchEnd: () => this.showMatchPage(),
				});
				matchWrapper.appendChild(game.render());
			});

			readyContainer.appendChild(readyButton);
			matchWrapper.appendChild(readyContainer);
			this.container.appendChild(matchWrapper);
		} catch (err) {
			console.error(err);
			this.showMessage("Error loading match", "error");
		}
	}

	
	private async showResultsPage() {
		this.container.innerHTML = "";

		const results = document.createElement("div");
		results.className = "result-container";
		const heading = document.createElement("h2");
		heading.textContent = "Tournament Results";
		results.appendChild(heading);

		// Fetch results
		const response = await apiServices.tournament.getNextMatch(this.tournamentId!);
		if (!response.success || !response.data?.results) {
			return this.showMessage(response.message || "Failed to load results", "error");
		}

		const { champion , bracket, stats} = response.data.results;

		// Champion section
		const championDiv = document.createElement("div");
		championDiv.className = "champion-section";
		championDiv.innerHTML = `
			<h3>Champion</h3>
			<p class="champion-name">${champion ?? "-"}</p>`;
		results.appendChild(championDiv);

		// Bracket section
		const bracketDiv = document.createElement("div");
		bracketDiv.className = "bracket-section";
		bracketDiv.innerHTML = `<h3>Matches</h3>`;
		const table = document.createElement("table");
		table.className = "bracket-table";
		table.innerHTML = `
			<tr><th>Match</th><th>Player 1</th><th>Player 2</th><th>Winner</th></tr>
			${bracket.map((m) => `<tr>
				<td>${m.matchIndex}</td>
				<td>${m.player1 ?? "-"}</td>
				<td>${m.player2 ?? "-"}</td>
				<td>${m.winner ?? "-"} </td>
			</tr>`).join("")}
		`;
		bracketDiv.appendChild(table);
		results.appendChild(bracketDiv);

		// Stats section
		const statsDiv = document.createElement("div");
		statsDiv.className = "stats-section";
		statsDiv.innerHTML = `
			<h3>Stats</h3>
			<p>Total Matches: ${stats.totalMatches}</p>
			<p>Played Matches: ${stats.playedMatches}</p>
		`;
		results.appendChild(statsDiv);

		// New Tournament Button
		const newBtn = document.createElement("button");
		newBtn.textContent = "Start New Tournament";
		newBtn.className = "new-tournament-btn";
		newBtn.addEventListener("click", () => {
			this.players = [];
			this.tournamentId = null;
			this.currentStep = "setup";
			this.renderStep();
		});
		results.appendChild(newBtn);

		this.container.appendChild(results);
	}

	//----------------------------------------
	// HELPER FUNCTIONS
	//----------------------------------------
	
	private loadStyles() {
		if (document.getElementById("tournament-styles")) return;

			const link = document.createElement("link");
			link.id = "tournament-styles";
			link.rel = "stylesheet";
			link.href = "/styles/tournament.css";
			document.head.appendChild(link);
	}
	
	private showMessage(message: string, type: 'success' | 'error'): void {
        this.messageContainer.style.display = 'block';
        this.messageContainer.className = `message_container ${type}`;
        this.messageContainer.textContent = message;
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.messageContainer.style.display = 'none';
            }, 5001);
        }
        // Scroll to top to show message
        this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

