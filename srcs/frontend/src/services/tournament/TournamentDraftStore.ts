interface ValidatedPlayer {
  displayName: string;
  userId?: number;
  isGuest: boolean;
}

interface TournamentDraft {
	numberOfPlayers: number | null;
	players: ValidatedPlayer[];
	createdBy?: number | null;
}

class DraftStore {
	private draft: TournamentDraft = {
		numberOfPlayers: null,
		players: [],
		createdBy: null,
	};

	constructor () {
		this.load();
	}
	
	get numberOfPlayers() { return this.draft.numberOfPlayers; }
	get players() { return this.draft.players; }

	setNumberOfPlayers(n: number) {
		this.draft.numberOfPlayers = n;
		this.save();
	}

	addPlayer(player: ValidatedPlayer) {
		this.draft.players.push(player);
		this.save();
	}

	removePlayer(index: number) {
		this.draft.players.splice(index, 1);
		this.save();
	}
	
	// save into localStorage (to survive refresh)
	save() {
		localStorage.setItem("tournamentDraft", JSON.stringify(this.draft));
	}

	load() {
		const stored = localStorage.getItem("tournamentDraft");
		if (stored) {
		this.draft = JSON.parse(stored);
		}
	}

	clear() {
		this.draft = { numberOfPlayers: null, players: [], createdBy: null };
		localStorage.removeItem("tournamentDraft");
	}

	clearPlayers() {
		this.draft.players = [];
		this.save();
	}
}

export const TournamentDraftStore = new DraftStore();
