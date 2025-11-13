import { IComponent } from "../components/IComponent";
import { navigate } from "../utils.js";
import { TournamentDraftStore } from "../services/tournament/TournamentDraftStore.js";
import { TournamentStore } from "../services/tournament/TournamentStore.js";
import { apiServices } from "../services/ApiServices.js";

export class TournamentSetup implements IComponent {
  private container!: HTMLElement;
  private modal!: HTMLElement;
  private creatorUsername: string = "Creator";

  public render(): HTMLElement {
    TournamentStore.tournamentId = null;
    TournamentStore.onMatchEnd = null;
    TournamentStore.isInternalTournamentNavigation = false;
    
    TournamentDraftStore.clear();
    TournamentDraftStore.setNumberOfPlayers(2);

    this.loadStyles();

    const page = document.createElement("div");
    page.className = "tournament-page";

    this.container = document.createElement("div");
    this.container.className = "tournament-setup";

    const title = document.createElement("h2");
    title.textContent = "Tournament Setup";
    this.container.appendChild(title);

    // --- Input section ---
    const counterContainer = document.createElement("div");
    counterContainer.className = "counter-container";

    const counter = document.createElement("div");
    counter.className = "counter";

    const label = document.createElement("label");
    label.textContent = "NUMBER OF PLAYERS";
    counter.appendChild(label);

    const input = document.createElement("input");
    input.type = "number";
    input.min = "2";
    input.max = "64";
    input.value = "2";

    input.addEventListener("change", () => {
      const newNum = parseInt(input.value, 10);

      if (isNaN(newNum) || newNum < 2) {
        alert("Minimum 2 players required");
        input.value = "2";
        TournamentDraftStore.setNumberOfPlayers(2);
        return;
      }
      TournamentDraftStore.setNumberOfPlayers(newNum);
    });

    counter.appendChild(input);
    counterContainer.appendChild(counter);
    // --- Buttons actions ---
    const actions = document.createElement("div");
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "NEXT";
    nextBtn.addEventListener("click", () => this.openAddPlayersPopup());

    actions.appendChild(nextBtn);
    counterContainer.appendChild(actions);
    this.container.appendChild(counterContainer);
    page.appendChild(this.container);

    return page;
  }

  //----------------------------------------
  // Pop up window functions
  //----------------------------------------
  private async openAddPlayersPopup() {
    const n = TournamentDraftStore.numberOfPlayers;
    if (!n || n < 2) return alert("Please set at least 2 players");

    // overlay
    this.modal = document.createElement("div");
    this.modal.className = "tournament-modal";

    // overlay header
    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";
    const header = document.createElement("div");
    header.className = "modal-header";
    const h2 = document.createElement("h2");
    h2.textContent = "Add Players";
    const closeBtn = document.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", () => this.closeModal());
    header.append(h2, closeBtn);

    // overlay body split
    const body = document.createElement("div");
    body.className = "modal-body";

    const left = this.createAddPlayerForm();
    const right = await this.createLineupSection();

    body.append(left, right);
    modalContent.append(header, body);
    this.modal.appendChild(modalContent);
    console.log("Modal appended: ", this.modal);
    document.body.appendChild(this.modal);
  }

  private closeModal() {
    const hasDraft = TournamentDraftStore.players.length > 1;

    if (hasDraft) {
      const confirmClose = confirm(
        "Closing this window will discard your current tournament setup. Continue?"
      );
      if (!confirmClose) return;

      TournamentDraftStore.clear();
      TournamentDraftStore.setNumberOfPlayers(2);
      const input = this.container.querySelector(
        'input[type="number"]'
      ) as HTMLInputElement;
      if (input) input.value = "2";
    } else {
      TournamentDraftStore.clear();
      // resave number of players to preserve it in memory
      const currentVal = (
        this.container.querySelector('input[type="number"]') as HTMLInputElement
      )?.value;
      if (currentVal)
        TournamentDraftStore.setNumberOfPlayers(parseInt(currentVal, 10));
    }

    if (this.modal && document.body.contains(this.modal)) {
      document.body.removeChild(this.modal);
    }
  }

  private createAddPlayerForm(): HTMLElement {
    const form = document.createElement("div");
    form.className = "add-player-form";

    // Toggle buttons
    const toggleContainer = document.createElement("div");
    toggleContainer.className = "toggle-container";

    const guestBtn = document.createElement("button");
    guestBtn.textContent = "GUEST";
    guestBtn.className = "toggle-btn active";

    const userBtn = document.createElement("div");
    userBtn.textContent = "REGISTERED USER";
    userBtn.className = "toggle-btn";

    toggleContainer.append(guestBtn, userBtn);
    form.appendChild(toggleContainer);

    // --- Guest form ---
    const guestForm = document.createElement("div");
    guestForm.className = "guest-form";
    guestForm.innerHTML = `
    <p>If you don’t have an account, enter a guest name to join temporarily.</p>
    <label>GUEST NAME</label>
    <input placeholder="Guest Name" />
    `;

    // --- Registered form ---
    const userForm = document.createElement("div");
    userForm.className = "user-form hidden";
    userForm.innerHTML = `
    <p>Enter your username and password if you already have an account.</p>
    <label>USERNAME</label>
    <input placeholder="Username" />
    <label>PASSWORD</label>
    <input type="password" placeholder="Password" />
    `;

    const addBtn = document.createElement("button");
    addBtn.textContent = "ADD PLAYER";
    addBtn.className = "add-player-btn";
    addBtn.addEventListener("click", async () => {
      const isGuest = guestBtn.classList.contains("active");
      const guestName = guestForm.querySelector("input") as HTMLInputElement;
      const username = userForm.querySelectorAll(
        "input"
      )[0] as HTMLInputElement;
      const password = userForm.querySelectorAll(
        "input"
      )[1] as HTMLInputElement;
      await this.handleAddPlayer(username, password, guestName);
      username.value = password.value = guestName.value = "";
      this.updateLineup();
    });

    form.append(
      addBtn
    );
    guestBtn.addEventListener("click", () => {
      guestBtn.classList.add("active");
      userBtn.classList.remove("active");
      guestForm.classList.remove("hidden");
      userForm.classList.add("hidden");
    });
    userBtn.addEventListener("click", () => {
      userBtn.classList.add("active");
      guestBtn.classList.remove("active");
      userForm.classList.remove("hidden");
      guestForm.classList.add("hidden");
    });
    form.append(guestForm, userForm, addBtn);

    return form;
  }
  private async handleAddPlayer(
    username: HTMLInputElement,
    password: HTMLInputElement,
    guestName: HTMLInputElement
  ) {
    const user = username.value.trim();
    const pass = password.value.trim();
    const guest = guestName.value.trim();

    if (user && pass && guest) {
      alert(
        "Please fill in EITHER username/password OR guest name — not both."
      );
      return;
    }

    const totalNeeded = TournamentDraftStore.numberOfPlayers ?? 2;
    const currentCount = TournamentDraftStore.players.length + 1; // +1 includes the creator
    if (currentCount >= totalNeeded) {
      alert(`You already have ${totalNeeded} players.`);
      return;
    }

    let newPlayerDisplayName: string | undefined;
    let newPlayer: {
      displayName: string;
      userId?: number;
      isGuest: boolean;
    } | null = null;

    if (user && pass) {
      const res = await apiServices.tournament.validatePlayer({
        username: user,
        password: pass,
      });
      if (!res.success || !res.data.valid) {
        alert(res.message || res.data.error);
        return;
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
      return;
    }

    const existingNames = TournamentDraftStore.players.map((p) =>
      p.displayName.toLowerCase()
    );
    if (existingNames.includes(newPlayerDisplayName!.toLowerCase())) {
      alert(`${newPlayerDisplayName} already added`);
      return;
    }

    TournamentDraftStore.addPlayer(newPlayer!);

    // Check if full
    const added = TournamentDraftStore.players.length;
    const remaining = totalNeeded - added - 1;
    if (remaining <= 0) this.showConfirmButton();
  }

  private async createLineupSection(): Promise<HTMLElement> {
    const section = document.createElement("div");
    section.className = "lineup-section";

    const h3 = document.createElement("h3");
    h3.textContent = "Current Lineup";
    section.appendChild(h3);

    const ul = document.createElement("ul");
    ul.id = "lineup-list";

    const li = document.createElement("li");
    await this.fetchCreatorUsername();
    li.textContent = `1. ${this.creatorUsername} (Creator)`;
    ul.appendChild(li);

    section.appendChild(ul);

    const confirmBtn = document.createElement("button");
    confirmBtn.id = "confirm-btn";
    confirmBtn.textContent = "Confirm & Start Game";
    confirmBtn.style.display = "none";
    confirmBtn.addEventListener(
      "click",
      async () => await this.finalizeTournament()
    );
    section.appendChild(confirmBtn);

    return section;
  }

  private updateLineup() {
    const ul = document.getElementById("lineup-list");
    if (!ul) return;
    ul.innerHTML = "";
    const creator = document.createElement("li");
    const creatorNameSpan = document.createElement("span");
    creatorNameSpan.textContent = `1. ${this.creatorUsername} (Creator)`;
    creator.appendChild(creatorNameSpan);
    ul.appendChild(creator);

    TournamentDraftStore.players.forEach((p, i) => {
      const li = document.createElement("li");
      const nameSpan = document.createElement("span");

      nameSpan.textContent = `${i + 2}. ${p.displayName}`;
      li.appendChild(nameSpan);

      // Add delete button for non-creator players
      if (p.userId !== 1) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "×";
        delBtn.className = "delete-btn";
        delBtn.addEventListener("click", () => {
          TournamentDraftStore.removePlayer(i);
          this.updateLineup();
        });
        li.appendChild(delBtn);
      }
      ul.appendChild(li);
    });

    const totalNeeded = TournamentDraftStore.numberOfPlayers ?? 2;
    if (TournamentDraftStore.players.length >= totalNeeded - 1)
      this.showConfirmButton();
    else this.hideConfirmButton();
  }

  private async fetchCreatorUsername() {
    try {
      const response = await apiServices.profile.getProfile();
      const username = response.data?.username;
      if (response.success && username) {
        this.creatorUsername = username;
      }
    } catch (err) {
      console.log("Failed to fetch creator username: ", err);
    }
  }

  private showConfirmButton() {
    const confirmBtn = document.getElementById("confirm-btn");
    if (confirmBtn) confirmBtn.style.display = "block";
  }

  private hideConfirmButton() {
    const confirmBtn = document.getElementById("confirm-btn");
    if (confirmBtn) confirmBtn.style.display = "none";
  }

  private async finalizeTournament() {
    const numPlayers = TournamentDraftStore.numberOfPlayers!;
    const playerData = TournamentDraftStore.players.map((p) => ({
      displayName: p.displayName,
      userId: p.userId ?? null,
      isGuest: p.isGuest,
    }));

    try {
      const response = await apiServices.tournament.finalizeTournament(
        numPlayers,
        playerData
      );
      if (!response.success) {
        alert(response.message);
        return;
      }
      const tournamentId = response.data.id;
      const start = await apiServices.tournament.updateTournamentStatus(
        tournamentId,
        "STARTED"
      );
      if (!start.success) {
        alert(start.message || "Failed to start tournament");
        return;
      }
      TournamentDraftStore.clear();
      this.closeModal();
      navigate("/tournament/match", { tournamentId });
    } catch (err) {
      console.error("Error finalizing tournament:", err);
    }
  }

  //--------------------------------------
  // Styles
  //--------------------------------------
  private loadStyles() {
    if (document.getElementById("tournament-setup-styles")) return;

    const link = document.createElement("link");
    link.id = "tournament-setup-styles";
    link.rel = "stylesheet";
    link.href = "/styles/TournamentSetup.css";
    document.head.appendChild(link);
  }
}
