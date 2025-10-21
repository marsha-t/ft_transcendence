//--------------------------
// Routing
//--------------------------
export function navigate(path: string, state: any = {}) {
	if (window.location.pathname === path) return;
	window.history.pushState(state, '', path);
	window.dispatchEvent(new PopStateEvent('popstate'));
}

export function isTournamentFlow(pathname: string): boolean {
  return pathname.startsWith("/tournament/");
}

//--------------------------
// UI Helpers
//--------------------------
//showMessage()