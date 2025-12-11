export interface TournamentStoreType {
  onMatchEnd: (() => Promise<void>) | null;
  tournamentId: number | null;
  
    /**
   * TRUE when navigation happens as part of the internal tournament flow
   * (e.g., Game, GameResults).  
   * When TRUE, TournamentMatch.canDeactivate() allows navigation
   * without showing the "abort tournament" confirmation popup.
   */
  isInternalTournamentNavigation: boolean; 

  /**
   * TRUE when the last match of the tournament has been played.
   * Used so the TournamentMatch page knows when to transition to the Results page.
   */
  nextIsFinal: boolean;
}

export const TournamentStore: TournamentStoreType = {
  onMatchEnd: null,
  tournamentId: null,
  isInternalTournamentNavigation: false,
  nextIsFinal: false,
};

export function resetTournamentStore(): void {
  TournamentStore.onMatchEnd = null;
  TournamentStore.tournamentId = null;
  TournamentStore.isInternalTournamentNavigation = false;
  TournamentStore.nextIsFinal = false;
}
