import { IComponent } from "../components/IComponent";
import { apiServices } from "../services/ApiServices.js";
import { Game } from "./Game.js";
import { showConfirmation } from "../utils/uiUtils.js";
import { TournamentStore } from "../services/tournament/TournamentStore.js";
import { t } from "../services/i18n/i18nService.js";

export class TournamentMatch implements IComponent {
  private container!: HTMLElement;
  private tournamentId: number;
  private gameInstance: Game | null = null;
  private hasEnded: boolean = false;

  constructor(tournamentId: number) {
    this.tournamentId = tournamentId;
  }

  /*
    - Creates page wrapper and main container
    - Trigger asynchronous loading of next match
  */
  public render(): HTMLElement {
    const page = document.createElement("div");
    page.className = `bg-[var(--color-background)]
      h-full flex justify-center items-center
      font-['Press_Start_2P',monospace]
      text-[var(--color-text-white)] overflow-hidden`;

    this.container = document.createElement("div");
    this.container.className = `bg-transparent rounded-xl px-16 py-8
        text-center relative w-4/5 max-w-[900px] box-border`;

    this.loadNextMatch();
    page.appendChild(this.container);
    return page;
  }

  /*
    - Fetch next match from backend
      - 1) If API failure, display error message
      - 2) No next match, tournament has ended
        - Mark hasEnded, clean up running game instance, update TournamentStore
      - 3) Valid nextMatch, render match UI
  */
  private async loadNextMatch() {
    this.container.innerHTML = `<div class="text-[var(--color-text-white)]">Loading next match...</div>`;

    const response = await apiServices.tournament.getNextMatch(
      this.tournamentId
    );
    if (!response.success) {
      this.container.textContent = response.message || "Failed to load match";
      return;
    }
    const data = response.data;
    if (!data?.nextMatch) {
      this.hasEnded = true;
      this.cleanup();
      TournamentStore.nextIsFinal = true;
      return;
    }
    const { matchIndex, player1, player2, gameSessionId } = data.nextMatch;
    this.renderMatch(matchIndex, player1, player2, gameSessionId);
  }
  /*
    - Clear container
    - Render match UI: match number, player names and "Start Match" button
  */
  private renderMatch(
    matchIndex: number,
    p1: any,
    p2: any,
    gameSessionId: number
  ) {
    this.container.innerHTML = "";

    const matchInfo = document.createElement("div");
    matchInfo.className = "flex flex-col items-center justify-center";

    const h3 = document.createElement("h3");
    h3.textContent = `${t("tournament.match") as string} ${matchIndex}`;
    matchInfo.appendChild(h3);

    const playerContainer = document.createElement('div');
    playerContainer.className =
      'grid grid-cols-3 items-center justify-items-center w-full max-w-[700px] gap-4 mt-4';

    const p1Box = document.createElement('div');
    p1Box.className = `
      justify-self-start
      border-2 border-[var(--color-border-green)]
      rounded-lg px-10 py-6 min-w-[200px] md:min-w-[260px] max-w-[300px] md:max-w-[380px]
      break-all text-2xl bg-[var(--color-background)]
      shadow-[0_4px_0_#0c1c42] text-center
    `;
    p1Box.textContent = p1?.displayName ?? "Player 1";

    const vs = document.createElement('div');
    vs.className = 'text-[#ff3b3b] text-[1.8rem] font-bold';
    vs.textContent = t("tournament.vs") as string;

    const p2Box = document.createElement('div');
    p2Box.className = `
      justify-self-end
      border-2 border-[var(--color-border-green)]
      rounded-lg px-10 py-6 min-w-[200px] md:min-w-[260px] max-w-[300px] md:max-w-[380px]
      break-all text-2xl bg-[var(--color-background)]
      shadow-[0_4px_0_#0c1c42] text-center
    `;
    p2Box.textContent = p2?.displayName ?? "Player 2";

    playerContainer.append(p1Box, vs, p2Box);
    matchInfo.appendChild(playerContainer);
    this.container.appendChild(matchInfo);

    const readyContainer = document.createElement("div");
    readyContainer.className = "ready-container";

    const startBtn = document.createElement("button");
    startBtn.textContent = t("tournament.startMatchBtn") as string;
    startBtn.className = "bg-[var(--color-button)] border-2 border-[#3e8b44] rounded-lg text-[var(--color-text-white)] font-['Press_Start_2P',monospace] text-base px-8 py-4 cursor-pointer shadow-[0_6px_0_#2e6b32] transition-all duration-100 uppercase hover:bg-[#6bc66f] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-[0_6px_0_#2e6b32]";
    startBtn.addEventListener("click", () =>
      this.startGame(gameSessionId, p1, p2)
    );
    readyContainer.appendChild(startBtn);
    this.container.appendChild(readyContainer);
  }
  /*
    - Clear container and nests Game page on TournamentMatch
      - Clearing of container removes Start Match button which also removes its event listener
    - Instantiate the Game engine for the current match
    - Register TournamentStore.onMatchEnd callback which will be called by Game engine when a match finishes
      - onMatchEnd triggers loading of next match
  */
  private startGame(gameSessionId: number, p1: any, p2: any) {
    TournamentStore.onMatchEnd = async () => {
      await this.loadNextMatch(); 
    };
    
    this.container.innerHTML = "";
    this.container.className = "w-full flex justify-center";

    this.gameInstance = new Game({
      sessionId: Number(gameSessionId),
      isTournament: true,
      tournamentId: this.tournamentId, 
      displayNames: {
        leftName: p1?.displayName ?? "Player 1",
        rightName: p2?.displayName ?? "Player 2",
      },
      customGameSettings: TournamentStore.gameSettings,
    });
    this.container.appendChild(this.gameInstance.render());
  }
  
  /*
    - Prompt user for confirmation when navigating away 
    - Abort tournament on backend if user confirms
    - Allow navigation if internalTournamentNavigation is true
  */
  public async canDeactivate(): Promise<boolean> {
     if (TournamentStore.isInternalTournamentNavigation) {
        TournamentStore.isInternalTournamentNavigation = false;
        return true;
    }
    if (this.hasEnded) return true;
     const confirmLeave = await showConfirmation(t("tournament.tournamentInProgress") as string, t("common.pleaseConfirm") as string, true);
    if (!confirmLeave) return false;
    apiServices.tournament.updateTournamentStatus(
    this.tournamentId,
      "ABORTED"
    ).catch(() => {}); // backend abort is best-effort; don't block navigation regardless of success
    return true;
  }

  /*
    - Terminate active Game instance if one exists
    - Used when tournament ends (no more next match) and inside cleanup()
  */
  public cleanup() {
      if (this.gameInstance) {
        this.gameInstance.terminate?.();
        this.gameInstance = null;
      }
  }
}
