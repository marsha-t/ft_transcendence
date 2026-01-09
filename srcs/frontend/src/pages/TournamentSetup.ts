import { IComponent } from "../components/IComponent";
import { navigate } from "../utils/commonUtils.js";
import { TournamentDraftStore } from "../services/tournament/TournamentDraftStore.js";
import { resetTournamentStore, TournamentStore } from "../services/tournament/TournamentStore.js";
import { apiServices } from "../services/ApiServices.js";
import { t } from "../services/i18n/i18nService.js";
import { openGameCustomization } from "../utils/gameCustom";
import { gameConfigManager } from "../graphics/GameConfigManager";
import { CustomGameSettings } from "../graphics/types";
import { createButtonStyle, showConfirmation, showMessage } from "../utils/uiUtils";

export class TournamentSetup implements IComponent {
  private container!: HTMLElement;
  private isPlayerCountValid = true;
  private nextBtn!: HTMLButtonElement;
  private pageMessageContainer!: HTMLDivElement;
  private modal: HTMLElement | null = null;
  private isModalOpen = false;
  private creatorUsername: string = "Creator";
  private creatorId: number | null = null;
  private customizationSection!: HTMLElement;
  private destroyed = false;
  private activeMode: "guest" | "user" = "guest";
  private modalMessageContainer!: HTMLDivElement;


  /*
    - Reset any existing tournament store so that TournamentSetup starts from clean baseline
    - Clears TournamentDraftStore for fresh draft
      - Initialized to number of players = 2
  */
  constructor() {
    resetTournamentStore();
    TournamentDraftStore.clear();
    TournamentDraftStore.setNumberOfPlayers(2);
  }

  /*
    - Render:
      - Game customisation entry point to modal
      - Number of players input (min = 2, max = 16, default to 2)
      - Error message box 
  */
  public render(): HTMLElement {
    const page = document.createElement("div");
    page.className = `bg-[var(--color-background)] flex justify-center items-center
      flex-col h-full py-5 text-[var(--color-text-white)]
      font-pixel text-center`;

    this.container = document.createElement("div");
    this.container.className =
      "flex flex-col items-center p-20 bg-background rounded-[30px] ml-6 mr-6 ";

    const title = document.createElement("h2");
    title.className = "text-[1.8rem] font-pixel font-normal mb-10";
    title.textContent = t("tournament.tournamentSetup") as string;
    this.container.appendChild(title);

    // Input Container
    const counterContainer = document.createElement("div");
    counterContainer.className = `flex items-center justify-center flex-col gap-6
      border-2 border-[var(--color-border-green)] p-[10px] rounded-[16px] w-[500px] min-h-[320px]
      bg-transparent box-border`;

    // Input: Game customisation 
    this.customizationSection = document.createElement("div");
    this.customizationSection.className = `
      flex flex-col items-center gap-3
    `;
    const customizeBtn = document.createElement("button");
    customizeBtn.textContent = t("game.customizeGame") as string;
    customizeBtn.className = createButtonStyle(
      "w-[390px] h-[60px] text-[24px]",
      "blue"
    );
    customizeBtn.addEventListener("click", () => {
      openGameCustomization(
        document.body,
        (settings: CustomGameSettings) => {
          TournamentStore.gameSettings = settings;
          gameConfigManager.applyCustomizations(settings);
          this.updateCustomizationIndicator(); // Update UI after custom game is set
        },
        () => {}
      );
    });
    this.customizationSection.appendChild(customizeBtn);
    counterContainer.appendChild(this.customizationSection);

    // Input: Number of players
    const counter = document.createElement("div");
    counter.className = "flex items-center justify-center gap-4 w-full";

    const label = document.createElement("label");
    label.textContent = t("tournament.numberOfPlayers") as string;
    label.className = `text-[var(--color-text-white)] text-[24px] font-pixel font-[400]  whitespace-nowrap`;
    counter.appendChild(label);

    const input = document.createElement("input");
    input.className = `w-[120px] h-[40px] text-center rounded-[16px]
      border-2 border-white bg-white text-black text-[18px] font-pixel font-[400] outline-none
      transition-colors duration-200 focus:border-[var(--color-border-green)] [&::-webkit-inner-spin-button]:opacity-100
      [&::-webkit-outer-spin-button]:opacity-100`;

    input.type = "number";
    input.min = "2";
    input.max = "16";
    input.value = "2";
    
    input.addEventListener("change", () => {
      const newNum = parseInt(input.value, 10);

      if (isNaN(newNum))
      {
        this.isPlayerCountValid = false;
        this.nextBtn.disabled = true;
        showMessage(counterContainer, this.pageMessageContainer, "Please enter a value between 2 and 16", 'error'); 
        return;
      }
      if (newNum < 2) {
        this.isPlayerCountValid = false;
        this.nextBtn.disabled = true;
        showMessage(counterContainer, this.pageMessageContainer, "Minimum 2 players required", 'error'); 
        return;
      }
      if (newNum > 16) {
        this.isPlayerCountValid = false;
        this.nextBtn.disabled = true;
        showMessage(counterContainer, this.pageMessageContainer, "Maximum 16 players allowed", 'error'); 
        return ;
      }
      this.isPlayerCountValid = true;
      this.nextBtn.disabled = false;
      this.pageMessageContainer.style.display = "none";
      this.pageMessageContainer.textContent = "";
      TournamentDraftStore.setNumberOfPlayers(newNum);
    });
    counter.appendChild(input);
    counterContainer.appendChild(counter);

    // Buttons 
    const actions = document.createElement("div");
    const nextBtn = document.createElement("button");
    this.nextBtn = nextBtn;
    nextBtn.textContent = t("common.next") as string;
    nextBtn.className = createButtonStyle("w-[390px] h-[60px] text-[1.6rem] text-[24px]", 'green');
    nextBtn.addEventListener("click", () => {
      if (!this.isPlayerCountValid) return;
      this.openAddPlayersPopup();
    });
    actions.appendChild(nextBtn);
    counterContainer.appendChild(actions);
    
    // Message container
    this.pageMessageContainer = document.createElement('div');
    this.pageMessageContainer.className = 'message_container w-full p-3 rounded-md mb-3 text-sm';
    this.pageMessageContainer.style.display = 'none';
    counterContainer.appendChild(this.pageMessageContainer);

    this.container.appendChild(counterContainer);
    page.appendChild(this.container);

    return page;
  }

  /*
    - Display indicator when custom game is active
    - Remove old indicator if it exists - ensure only one indicator exists at any time
  */
  private updateCustomizationIndicator(): void {
    const oldIndicator = document.getElementById("tournament-custom-indicator");
    if (oldIndicator) oldIndicator.remove();

    const settings = TournamentStore.gameSettings;
    if (!settings || !this.customizationSection) return;

    const indicator = document.createElement("div");
    indicator.id = "tournament-custom-indicator";
    indicator.className = `
      text-white bg-purple-600
      px-4 py-2 rounded-lg
      font-semibold text-sm
    `;

    indicator.textContent = `${settings.preset} Mode Active`;
    this.customizationSection.appendChild(indicator);
  }

  // Pop up window to add players
  /*
    - Prevent multiple modal instances via isModalOpen guard
    - Modal has:
      - Header
      - Close button (calls closeModal())
      - Container for error messages
      - Left side: Add player form
      - Right side: Lineup preview
    - destroyed guard used here to prevent async DOM attachment if page is already 'destroyed'
  */
  private async openAddPlayersPopup() {
    if (this.isModalOpen) return;
    this.isModalOpen = true;
    this.clearModalMessage();

    this.modal = document.createElement("div");
    this.modal.className = `fixed top-0 left-0 w-full h-full bg-black/50 flex
      justify-center items-center backdrop-blur-sm`;

    const modalContent = document.createElement("div");
    modalContent.className = `bg-[var(--color-background)] rounded-xl w-4/5 max-w-[1100px]
      relative p-[30px_40px] shadow-[0_6px_20px_rgba(0,0,0,0.5)]`;

    const header = document.createElement("div");
    header.className = "relative mb-6";

    const h2 = document.createElement("h2");
    h2.className = "font-['Press_Start_2P',monospace] text-base uppercase text-[var(--color-text-white)] m-0";
    h2.textContent = t("tournament.addPlayers") as string;
    
    const modalMessageWrapper = document.createElement("div");
    modalMessageWrapper.className = "flex justify-center w-full mb-4"; // To center modalMessageContainer
    this.modalMessageContainer = document.createElement('div');
    this.modalMessageContainer.className = 'message_container w-full p-3 rounded-md mb-3 text-sm';
    this.modalMessageContainer.style.display = 'none';
    modalMessageWrapper.appendChild(this.modalMessageContainer);
  
    const closeBtn = document.createElement("button");
    closeBtn.className = `bg-transparent border-none text-[var(--color-text-white)] text-[2rem]
      cursor-pointer leading-none absolute top-0 right-0 transition-transform hover:scale-110`;
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", () => this.closeModal());
    header.append(h2, closeBtn);
    
    // overlay body split: Left to add player; Right to show lineup
    const body = document.createElement("div");
    body.className = "grid grid-cols-2 gap-[30px]";

    const left = this.createAddPlayerForm();
    const right = await this.createLineupSection();

    if (this.destroyed) {
      this.isModalOpen = false;
      this.modal?.remove();
      this.modal = null;
      return 
    };

    body.append(left, right);
    modalContent.append(header, modalMessageWrapper, body);
    this.modal.appendChild(modalContent);
    document.body.appendChild(this.modal);
  }

  // Build left-side modal UI for adding players
  /*
    - UI
      - Toggle buttons to allow guest player and registered user
        - Toggling between the two modes resets input for the 'hidden' mode
      - Input form for guestName or username/password
      - Add button
    - Add button event listener calls handleAddPlayer() and then updateLineup()
      - updateLineup called regardless of success (harmless if nothing changed)
  */
  private createAddPlayerForm(): HTMLElement {
    const form = document.createElement("div");
    form.className = `flex-1 border border-white/30 rounded-xl p-[30px]
      bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.06)_0%,transparent_70%)]
      min-h-[480px] max-h-[480px] flex flex-col justify-start box-border`;

    // Toggle buttons
    const toggleContainer = document.createElement("div");
    toggleContainer.className = "flex justify-between mb-6 gap-5";

    const guestBtn = document.createElement("button");
    guestBtn.textContent = t("tournament.guest") as string;
    guestBtn.className =
      "flex-1 flex items-center justify-center text-center rounded-lg cursor-pointer " +
      "uppercase transition-all font-['VT323'] text-[1.6rem] py-3.5 px-2.5 " +
      "bg-[#3b5f9c] text-white shadow-[0_6px_0_#1e3263] hover:brightness-110 " +
      "data-[active=true]:bg-[var(--color-button)] data-[active=true]:border-2 " +
      "data-[active=true]:border-[#7ab96f] data-[active=true]:shadow-[0_6px_0_#4e7245]";
    guestBtn.dataset.active = "true";

    const userBtn = document.createElement("button");
    userBtn.textContent = t("tournament.registeredUser") as string;
    userBtn.className =
      "flex-1 flex items-center justify-center text-center rounded-lg cursor-pointer " +
      "uppercase transition-all font-['VT323'] text-[1.6rem] py-3.5 px-2.5 " +
      "bg-[#3b5f9c] text-white shadow-[0_6px_0_#1e3263] hover:brightness-110 " +
      "data-[active=true]:bg-[var(--color-button)] data-[active=true]:border-2 " +
      "data-[active=true]:border-[#7ab96f] data-[active=true]:shadow-[0_6px_0_#4e7245]";
    userBtn.dataset.active = "false";

    toggleContainer.append(guestBtn, userBtn);
    form.appendChild(toggleContainer);

    // Guest form 
    const guestForm = document.createElement("div");
    guestForm.className = "";
    guestForm.innerHTML = `
      <p class="text-[var(--color-text-white)]">${t("tournament.guestInstruction") as string}</p>
      <label class="text-[var(--color-text-white)] block font-['VT323'] tracking-[2px] mt-2 mb-1">${t("game.guestNameLabel") as string}</label>
      <input id="guest-input" placeholder= "${t("tournament.guestName") as string}"
      class="w-full h-10 rounded-[10px] border-none mb-2 px-2.5 text-base text-[#0f2b66]"/>
    `;

    // Registered form 
    const userForm = document.createElement("div");
    userForm.className = "hidden";
    userForm.innerHTML = `
      <p class="text-[var(--color-text-white)]">${t("tournament.registeredInstruction") as string}</p>
      <label class="text-[var(--color-text-white)] block font-['VT323'] tracking-[2px] mt-2 mb-1">${t("auth.username") as string}</label>
      <input placeholder= "${t("auth.username") as string}" class="w-full h-10 rounded-[10px] border-none mb-2.5 px-2.5 text-base text-[#0f2b66]" />
      <label class="text-[var(--color-text-white)] block font-['VT323'] tracking-[2px] mt-2 mb-1">${t("auth.password") as string}</label>
      <input type="password" placeholder="${t("auth.password") as string}" class="w-full h-10 rounded-[10px] border-none mb-2.5 px-2.5 text-base text-[#0f2b66]" />
    `;

    const guestNameInput = guestForm.querySelector("input") as HTMLInputElement;
    const userInputs = userForm.querySelectorAll("input");
    const usernameInput = userInputs[0] as HTMLInputElement;
    const passwordInput = userInputs[1] as HTMLInputElement;

    const toggleForm = (type: "guest" | "user") => {
      this.activeMode = type;

      this.clearModalMessage();

      guestBtn.dataset.active = (type === "guest").toString();
      userBtn.dataset.active = (type === "user").toString();

      guestForm.classList.toggle("hidden", type !== "guest");
      userForm.classList.toggle("hidden", type !== "user");


      if (type === "guest") {
        usernameInput.value = "";
        passwordInput.value = "";
      } else {
        guestNameInput.value = "";
      }
    };
    guestBtn.addEventListener("click", () => toggleForm("guest"));
    userBtn.addEventListener("click", () => toggleForm("user"));

    // Add player button
    const addBtn = document.createElement("button");
    addBtn.textContent = t("tournament.addPlayerBtn") as string;
    addBtn.id = "add-player-btn";
    addBtn.className = `w-full bg-[#3b5f9c] text-[var(--color-text-white)] border-none rounded-[10px]
      py-4 px-0 font-bold tracking-wider font-['VT323'] text-[1.6rem] mt-auto cursor-pointer
      shadow-[0_6px_0_#1e3263] hover:bg-[#4c73b8]`;
    addBtn.addEventListener("click", async () => {
      this.clearModalMessage();
      await this.handleAddPlayer(usernameInput, passwordInput, guestNameInput);
      usernameInput.value = passwordInput.value = guestNameInput.value = "";
      const warning = guestForm.querySelector("#guest-warning") as HTMLElement;
      if (warning) warning.classList.add("hidden");
      this.updateLineup();
    });

    form.append(guestForm, userForm, addBtn);
    return form;
  }

  // Handler when add button is clicked
  /*
    - Validate input completeness 
    - Validate player credentials or guest alias via backend
    - Check for uniqueness
    - Add player
  */
  private async handleAddPlayer(
    username: HTMLInputElement,
    password: HTMLInputElement,
    guestName: HTMLInputElement,
  ) {
    const user = username.value.trim();
    const pass = password.value.trim();
    const guest = guestName.value.trim();
    if (this.activeMode === "guest")
    {
      if (!guest) {
        showMessage(this.modal!, this.modalMessageContainer, "Please enter a guest name", 'error');
        return ;
      }
    }
    if (this.activeMode === "user") {
      if (!user || !pass) {
        showMessage(this.modal!, this.modalMessageContainer, "Please enter username and password", 'error');
        return ;
      }
    }

    const res = await apiServices.tournament.validatePlayer(
      guest
        ? { guestName: guest }
        : { username: user, password: pass }
    );
    if (!res.success || !res.data?.valid) {
      showMessage(this.modal!, this.modalMessageContainer, res.message, 'error');
      return;
    }
  
    const { valid, displayName, userId } = res.data;

    const existingNames = [
      this.creatorUsername.toLowerCase(), 
      ...TournamentDraftStore.players.map((p) => p.displayName.toLowerCase())
    ];
    if (existingNames.includes(displayName!.toLowerCase())) {
      showMessage(this.modal!, this.modalMessageContainer, `${displayName} already added`, 'error');
      return;
    }

    TournamentDraftStore.addPlayer({
      displayName, 
      userId: userId ?? undefined,
      isGuest: userId == null,
    });
  }
  
  // Re-render function for adjusting lineup (right-side modal UI) adding and deleting players
  /*
    - Ensures that creator is included (and cannot be deleted)
    - Adds each player in draft to lineup 
      - These players can be deleted via 'X' button
        - If deleted, the draft is updated and updateLineup called to trigger re-render
  */
  private updateLineup() {
    const ul = document.getElementById("lineup-list");
    if (!ul) return;
    ul.innerHTML = "";

    const creator = document.createElement("li");
    creator.className = `bg-white text-[#0f2b66] rounded-[10px] py-2.5 px-3.5 mb-3 
      font-['VT323'] text-[1.6rem] flex justify-between items-center`;
    const creatorNameSpan = document.createElement("span");
    creatorNameSpan.textContent = `1. ${this.creatorUsername} (${t("tournament.tournamentCreator") as string})`;
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
      const isCreator = (() => {
        // If both have numeric userId, compare by id
        if (p.userId != null && this.creatorId != null) {
          return p.userId === this.creatorId;
        }
        // Fallback to comparing displayName (case-insensitive)
        if (p.displayName && this.creatorUsername) {
          return p.displayName.toLowerCase() === this.creatorUsername.toLowerCase();
        }
        return false;
      })();

      if (!isCreator) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "×";
        delBtn.className = `bg-transparent border-none text-[#0f2b66] text-xl font-bold 
          cursor-pointer ml-2 transition-transform hover:text-[#ff5c5c] hover:scale-110`;
        delBtn.addEventListener("click", () => {
          this.clearModalMessage();
          TournamentDraftStore.removePlayer(i);
          this.updateLineup();
        });
        li.appendChild(delBtn);
      }
      ul.appendChild(li);
    });

    const totalNeeded = TournamentDraftStore.numberOfPlayers ?? 2;
    const isComplete = TournamentDraftStore.players.length >= totalNeeded - 1;
    this.updateButtons(isComplete);
  }

  // Build right-side modal UI for showing player lineup
  /*
  - This does the initial lineup; updateLineup does the updating thereafter
    - UI rendered
      - Always include tournament creator as player 1 (fetch username from BE) - cannot be removed
      - Confirm button (which calls finalizeTournament())
  */
  private async createLineupSection(): Promise<HTMLElement> {
    const section = document.createElement("div");
    section.className = `border border-white/30 rounded-xl p-[30px] 
      bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.06)_0%,transparent_70%)] 
      min-h-[480px] max-h-[480px] flex flex-col box-border`;

    const h3 = document.createElement("h3");
    h3.className = `text-center font-['Press_Start_2P',monospace] text-xs mb-5 
      text-[var(--color-text-white)] uppercase`;
    h3.textContent = t("tournament.currentLineup") as string;
    section.appendChild(h3);

    const ul = document.createElement("ul");
    ul.id = "lineup-list";
    ul.className = `list-none p-0 m-0 mb-5 flex-1 overflow-y-auto 
      [scrollbar-width:thin] [scrollbar-color:#3b5f9c_#1e3263]`;
    const li = document.createElement("li");
    li.className = `bg-white text-[#0f2b66] rounded-[10px] py-2.5 px-3.5 mb-3 
      font-['VT323'] text-[1.6rem] flex justify-between items-center`;
    await this.fetchCreatorUsername();
    li.textContent = `1. ${this.creatorUsername} (${t("tournament.tournamentCreator") as string})`;
    ul.appendChild(li);
    section.appendChild(ul);

    const confirmBtn = document.createElement("button");
    confirmBtn.id = "confirm-btn";
    confirmBtn.className = `w-full bg-[#3b5f9c] text-white border-none rounded-[10px] 
      py-4 px-0 font-['VT323'] text-[1.6rem] font-bold tracking-wider cursor-pointer 
      shadow-[0_3px_0_#1e3263] uppercase mt-2.5 hover:bg-[#4c73b8] transition-colors`;
    confirmBtn.textContent = t("tournament.confirmStart") as string;
    confirmBtn.style.display = "none";
    confirmBtn.addEventListener(
      "click",
      async () => await this.finalizeTournament()
    );
    section.appendChild(confirmBtn);

    return section;
  }

  // Fetch current logged in user's username for lineup section
  private async fetchCreatorUsername() {
    const response = await apiServices.profile.getCurrentUser();
    if (!response.success || !response.data) return;
    const { username, id } = response.data;
    if (username) {
      this.creatorUsername = username;
      this.creatorId = id ?? null;
    }
  }

  // Toggle visibility of 'add player' and 'confirm' button depending on whether draft is complete
  /*
    - draft complete based on whether number of players added is correct (number of draft players + creator = total players)
  */
  private updateButtons(isDraftComplete: boolean) {
    const addBtn = document.getElementById("add-player-btn");
    const confirmBtn = document.getElementById("confirm-btn");

    if (isDraftComplete) {
      addBtn && (addBtn.style.display = "none");
      confirmBtn && (confirmBtn.style.display = "block");
    } else {
      addBtn && (addBtn.style.display = "block");
      confirmBtn && (confirmBtn.style.display = "none");
    }
  }

  // Event handler when confirm button is clicked
  /* 
    - Sends finalized data in draft to backend (finalize tournament)
    - Change tournament status from CREATED to STARTED in backend (updateTournamentStatus)
    - Clears draft and closes modal before navigating to tournament match
  */
  private async finalizeTournament() {
    const numPlayers = TournamentDraftStore.numberOfPlayers!;
    const playerData = TournamentDraftStore.players.map((p) => ({
      displayName: p.displayName,
      userId: p.userId ?? null,
      isGuest: p.isGuest,
    }));

    const response = await apiServices.tournament.finalizeTournament(
      numPlayers,
      playerData
    );
    if (!response.success) {
      showMessage(this.modal!, this.modalMessageContainer, response.message, 'error');
      return;
    }
    const tournamentId = response.data.id;
    const start = await apiServices.tournament.updateTournamentStatus(
      tournamentId,
      "STARTED"
    );
    if (!start.success) {
      showMessage(this.modal!, this.modalMessageContainer, start.message, 'error');
      return;
    }
    TournamentDraftStore.clear();
    this.closeModal();
    navigate("/tournament/match", { tournamentId });
  }
  
  // Helper to clear error message in modal
  private clearModalMessage() {
    if (!this.modalMessageContainer) return;
    this.modalMessageContainer.style.display = "none";
    this.modalMessageContainer.textContent = "";
  }

  // Handle closing of modal
  /*
    - Prompt for confirmation if draft lineup already exists 
    - If confirmed, clear draft players and remove modal
  */
  private async closeModal() {
    if (!this.isModalOpen) return ;
    const hasDraft = TournamentDraftStore.players.length > 0;
    if (hasDraft) {
      const confirmClose = await showConfirmation(t("tournament.closeTournamentAlert") as string, t("common.pleaseConfirm") as string, true);
      if (!confirmClose) return ;
    }
    TournamentDraftStore.clearPlayers();
    this.modal?.remove();
    this.modal = null;
    this.isModalOpen = false;
  }

  public cleanup() {
    this.destroyed = true;
    TournamentDraftStore.clearPlayers();
    this.modal?.remove();
    this.modal = null;
    this.isModalOpen = false;
  }
}