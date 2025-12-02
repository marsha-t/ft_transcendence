import { IComponent } from "../components/IComponent";
import { navigate, createButtonStyle } from "../utils.js";
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


    const page = document.createElement("div");
    page.className = `bg-[var(--color-background)] flex justify-center items-center
      flex-col min-h-[80vh] py-5 text-[var(--color-text-white)]
      font-pixel text-center`;

    this.container = document.createElement("div");
    this.container.className = "flex flex-col items-center min-h-[80vh] p-20 bg-background rounded-[30px] ml-6 mr-6 ";

    const title = document.createElement("h2");
    title.className = "text-[1.8rem] font-pixel font-normal mb-10";
    title.textContent = "Tournament Setup";
    this.container.appendChild(title);

    // --- Input section ---
    const counterContainer = document.createElement("div");
    counterContainer.className = `flex items-center justify-center flex-col gap-6
      border-2 border-[var(--color-border-green)] p-[10px] rounded-[16px] w-[500px] min-h-[320px]
      bg-transparent box-border`;

    const counter = document.createElement("div");
    counter.className = "flex items-center justify-center gap-4 w-full";

    const label = document.createElement("label");
    label.textContent = "NUMBER OF PLAYERS";
    label.className = `text-[var(--color-text-white)] text-[24px] font-pixel font-[400]  whitespace-nowrap`;
    counter.appendChild(label);

    const input = document.createElement("input");
    input.className = `w-[120px] h-[40px] text-center rounded-[16px]
      border-2 border-white bg-white text-black text-[18px] font-pixel font-[400] outline-none
      transition-colors duration-200 focus:border-[var(--color-border-green)] [&::-webkit-inner-spin-button]:opacity-100
      [&::-webkit-outer-spin-button]:opacity-100`;

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
    nextBtn.className = createButtonStyle("w-[390px] h-[60px] text-[1.6rem] text-[24px]", 'green');
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
    this.modal.className = `fixed top-0 left-0 w-full h-full bg-black/50 flex
      justify-center items-center backdrop-blur-sm`;

    // overlay header
    const modalContent = document.createElement("div");
    modalContent.className = `bg-[var(--color-background)] rounded-xl w-4/5 max-w-[1100px]
      relative p-[30px_40px] shadow-[0_6px_20px_rgba(0,0,0,0.5)]`;
    
    const header = document.createElement("div");
    header.className = "relative mb-6";
    
    const h2 = document.createElement("h2");
    h2.className = "font-['Press_Start_2P',monospace] text-base uppercase text-[var(--color-text-white)] m-0";
    h2.textContent = "Add Players";
    
    const closeBtn = document.createElement("button");
    closeBtn.className = `bg-transparent border-none text-[var(--color-text-white)] text-[2rem]
      cursor-pointer leading-none absolute top-0 right-0 transition-transform hover:scale-110`;
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", () => this.closeModal());
    header.append(h2, closeBtn);


    // overlay body split
    const body = document.createElement("div");
    body.className = "grid grid-cols-2 gap-[30px]";

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
    form.className = `flex-1 border border-white/30 rounded-xl p-[30px]
      bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.06)_0%,transparent_70%)]
      min-h-[480px] max-h-[480px] flex flex-col justify-start box-border`;

    // Toggle buttons
    const toggleContainer = document.createElement("div");
    toggleContainer.className = "flex justify-between mb-6 gap-5";

    const guestBtn = document.createElement("button");
    guestBtn.textContent = "GUEST";
    guestBtn.className = `flex-1 flex items-center justify-center text-center bg-[var(--color-button)]
      text-[var(--color-text-white)] font-['VT323'] text-[1.6rem] py-3.5 px-2.5 rounded-lg cursor-pointer
      uppercase transition-all border-2 border-[#7ab96f] shadow-[0_6px_0_#4e7245] hover:brightness-110`;

    const userBtn = document.createElement("div");
    userBtn.textContent = "REGISTERED USER";
    userBtn.className = `flex-1 flex items-center justify-center text-center bg-[#3b5f9c]
      text-[var(--color-text-white)] font-['VT323'] text-[1.6rem] py-3.5 px-2.5 rounded-lg
      cursor-pointer uppercase transition-all border-none shadow-[0_6px_0_#1e3263] hover:brightness-110`;

    toggleContainer.append(guestBtn, userBtn);
    form.appendChild(toggleContainer);

    // --- Guest form ---
    const guestForm = document.createElement("div");
    guestForm.className = "";
    guestForm.innerHTML = `
    <p class="text-[var(--color-text-white)]">If you don't have an account, enter a guest name to join temporarily.</p>
    <label class="text-[var(--color-text-white)] block font-['VT323'] tracking-[2px] mt-2 mb-1">GUEST NAME</label>
    <input id="guest-input" placeholder="Guest Name" 
      class="w-full h-10 rounded-[10px] border-none mb-2.5 px-2.5 text-base text-[#0f2b66]"
      maxlength="20" />

    <p id="guest-warning" class="text-red-400 text-sm mt-1 hidden">
      That's the limit! Try a shorter name.
    </p>

    `;
    const guestInput = guestForm.querySelector("#guest-input") as HTMLInputElement;
    const warning = guestForm.querySelector("#guest-warning") as HTMLParagraphElement;

    guestInput.addEventListener("input", () => {
      if (guestInput.value.length >= 20) {
        warning.classList.remove("hidden");
      } else {
        warning.classList.add("hidden");
      }
    });

    // --- Registered form ---
    const userForm = document.createElement("div");
    userForm.className = "hidden";
    userForm.innerHTML = `
    <p class="text-[var(--color-text-white)]">Enter your username and password if you already have an account.</p>
    <label class="text-[var(--color-text-white)] block font-['VT323'] tracking-[2px] mt-2 mb-1">USERNAME</label>
    <input placeholder="Username" class="w-full h-10 rounded-[10px] border-none mb-2.5 px-2.5 text-base text-[#0f2b66]" />
    <label class="text-[var(--color-text-white)] block font-['VT323'] tracking-[2px] mt-2 mb-1">PASSWORD</label>
    <input type="password" placeholder="Password" class="w-full h-10 rounded-[10px] border-none mb-2.5 px-2.5 text-base text-[#0f2b66]" />
    `;

    const addBtn = document.createElement("button");
    addBtn.textContent = "ADD PLAYER";
    addBtn.id = "add-player-btn";
    addBtn.className = `w-full bg-[#3b5f9c] text-[var(--color-text-white)] border-none rounded-[10px]
      py-4 px-0 font-bold tracking-wider font-['VT323'] text-[1.6rem] mt-auto cursor-pointer
      shadow-[0_6px_0_#1e3263] hover:bg-[#4c73b8`;
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
      
      const warning = guestForm.querySelector("#guest-warning") as HTMLElement;
      if (warning) warning.classList.add("hidden");
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

  private showAddPlayerButton() {
    const btn = document.getElementById("add-player-btn") as HTMLButtonElement;
    if (btn) btn.style.display = "block";
  }

  private hideAddPlayerButton() {
    const btn = document.getElementById("add-player-btn") as HTMLButtonElement;
    if (btn) btn.style.display = "none";
  }

  private async createLineupSection(): Promise<HTMLElement> {
    const section = document.createElement("div");
    section.className = `border border-white/30 rounded-xl p-[30px] 
      bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.06)_0%,transparent_70%)] 
      min-h-[480px] max-h-[480px] flex flex-col box-border`;

    const h3 = document.createElement("h3");
    h3.className = `text-center font-['Press_Start_2P',monospace] text-xs mb-5 
      text-[var(--color-text-white)] uppercase`;
    h3.textContent = "Current Lineup";
    section.appendChild(h3);

    const ul = document.createElement("ul");
    ul.id = "lineup-list";
    ul.className = `list-none p-0 m-0 mb-5 flex-1 overflow-y-auto 
      [scrollbar-width:thin] [scrollbar-color:#3b5f9c_#1e3263]`;

    const li = document.createElement("li");
    li.className = `bg-white text-[#0f2b66] rounded-[10px] py-2.5 px-3.5 mb-3 
      font-['VT323'] text-[1.6rem] flex justify-between items-center`;
    await this.fetchCreatorUsername();
    li.textContent = `1. ${this.creatorUsername} (Creator)`;
    ul.appendChild(li);

    section.appendChild(ul);

    const confirmBtn = document.createElement("button");
    confirmBtn.id = "confirm-btn";
    confirmBtn.className = `w-full bg-[#3b5f9c] text-white border-none rounded-[10px] 
      py-4 px-0 font-['VT323'] text-[1.6rem] font-bold tracking-wider cursor-pointer 
      shadow-[0_3px_0_#1e3263] uppercase mt-2.5 hover:bg-[#4c73b8] transition-colors`;
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
    creator.className = `bg-white text-[#0f2b66] rounded-[10px] py-2.5 px-3.5 mb-3 
      font-['VT323'] text-[1.6rem] flex justify-between items-center`;
    const creatorNameSpan = document.createElement("span");
    creatorNameSpan.textContent = `1. ${this.creatorUsername} (Creator)`;
    creator.appendChild(creatorNameSpan);
    ul.appendChild(creator);

    TournamentDraftStore.players.forEach((p, i) => {
      const li = document.createElement("li");
      li.className = `bg-white text-[#0f2b66] rounded-[10px] py-2.5 px-3.5 mb-3 
        font-['VT323'] text-[1.6rem] flex justify-between items-center`;
      const nameSpan = document.createElement("span");

      nameSpan.textContent = `${i + 2}. ${p.displayName}`;
      li.appendChild(nameSpan);

      // Add delete button for non-creator players
      if (p.userId !== 1) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "×";
        delBtn.className = `bg-transparent border-none text-[#0f2b66] text-xl font-bold 
          cursor-pointer ml-2 transition-transform hover:text-[#ff5c5c] hover:scale-110`;
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
    {
      this.hideAddPlayerButton();
      this.showConfirmButton();
    } else {
      this.showAddPlayerButton();
      this.hideConfirmButton();
    }
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
}
