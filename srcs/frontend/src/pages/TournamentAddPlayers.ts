import { IComponent } from "../components/IComponent";
import { navigate } from "../utils.js";
import { TournamentDraftStore } from "../services/tournament/TournamentDraftStore.js";
import { apiServices } from "../services/ApiServices.js";

export class TournamentAddPlayers implements IComponent {
	private container!: HTMLElement;
	private addBtn!: HTMLButtonElement;

	public render(): HTMLElement {
		this.loadStyles();

		const page = document.createElement("div");
    	page.className = "tournament-page";

		this.container = document.createElement('div');
		this.container.className = 'add-player';

		const h2 = document.createElement('h2');
		h2.textContent = 'Add Players';
		this.container.appendChild(h2);

		// --- Registered user section ---
		const userHead = document.createElement("h3");
		userHead.className = "user-head";
		userHead.textContent = "Registered User";
		this.container.appendChild(userHead);

		const userForm = document.createElement("div");
		userForm.className = "user-info";

		const usernameLabel = document.createElement("label");
		usernameLabel.textContent = "Username";
		const username = document.createElement("input");
		username.className = "form-input";
		username.placeholder = "Username";

		const passwordLabel = document.createElement("label");
		passwordLabel.textContent = "Password";
		const password = document.createElement("input");
		password.className = "form-input";
		password.placeholder = "Password";
		password.type = "password";

		userForm.append(usernameLabel, username, passwordLabel, password);
    	this.container.appendChild(userForm);

		// --- Guest section ---
		const guestHead = document.createElement("h3");
		guestHead.className = "guest-head";
		guestHead.textContent = "Play as a Guest";
		this.container.appendChild(guestHead);

		const guestForm = document.createElement("div");
		guestForm.className = "guest-info";
		const guestLabel = document.createElement("label");
		guestLabel.textContent = "Guest Name";
		const guestName = document.createElement("input");
		guestName.className = "form-input";
		guestName.placeholder = "Guest Name";

		guestForm.append(guestLabel, guestName);
		this.container.appendChild(guestForm);

		// --- Add player button ---
		this.addBtn = document.createElement("button");
	    this.addBtn.className = "add-btn";
		this.addBtn.textContent = "Add Player";
		this.addBtn.addEventListener("click", async () => {
			await this.handleAddPlayer(username, password, guestName);
			username.value = password.value = guestName.value = "";
		});
		this.container.appendChild(this.addBtn);

		page.appendChild(this.container);
		return page;
	}

	private async handleAddPlayer(username: HTMLInputElement, password: HTMLInputElement, guestName: HTMLInputElement) {

		const user = username.value.trim();
		const pass = password.value.trim();
		const guest = guestName.value.trim();
		
		const totalNeeded = TournamentDraftStore.numberOfPlayers ?? 2;

		let newPlayerDisplayName: string | undefined;
		let newPlayer: { displayName: string; userId?: number; isGuest: boolean; } | null = null;	
		if (user && pass) {
			const res = await apiServices.tournament.validatePlayer({ username: user, password: pass });
			if (!res.success || !res.data.valid) {
				alert(res.message || res.data.error);
				return ;
			}
			newPlayerDisplayName = res.data.displayName;
			newPlayer = {
				displayName: res.data.displayName,
				userId: res.data.userId, 
				isGuest: false,
			};
		} else if (guest) {
			if (!guest.trim()) return alert("Guest name cannot be empty");
			newPlayerDisplayName = guest;
			newPlayer = { displayName: guest, isGuest: true };
		} else {
			alert("Enter username/password or guest name");
			return ;
		}
		const existingDisplayNames = TournamentDraftStore.players.map(p => p.displayName );
		if (existingDisplayNames.some(d => d.toLowerCase() === newPlayerDisplayName!.toLowerCase())) {
			alert(`Display name ${newPlayerDisplayName} is already taken in this tournament.`);
			return ;
		}

		TournamentDraftStore.addPlayer(newPlayer!);
		// --- Update info message ---
		const added = TournamentDraftStore.players.length;
		const remaining = totalNeeded - added;
		if (remaining === 0) {
			navigate("/tournament/lineup");
		}
	}

	//-----------------------
	// Setup Functions
	// - load styles & set up window listeners 
	//-----------------------
	private loadStyles() {
		if (document.getElementById("tournament-styles")) return;
		const link = document.createElement("link");
		link.id = "tournament-styles";
		link.rel = "stylesheet";
		link.href = "/styles/tournament.css";
		document.head.appendChild(link);
	}
}
