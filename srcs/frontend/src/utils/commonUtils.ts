import { Router } from '../Router.js';

//--------------------------
// Routing
//--------------------------

let routerInstance: Router | null = null;

// Create one Router only if it has not been created before
export function getRouter(container: HTMLElement): Router {
  if (!routerInstance) {
    routerInstance = new Router(container);
  }
  return routerInstance;
}

/*
  - Return if path is the same
  - Update URL and trigger popstate event
*/
export function navigate(path: string, state: any = {}) {
  if (window.location.pathname === path) return;
  
  window.history.pushState(state, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// Navigation Store - used for logging out 
export const NavigationState = {
  // To suppress canDeactivate's page-level confirmation popup when logout is confirmed 
  forceNavigate: false, 

  // To abort game/tournament (in Header) when logout is confirmed 
  activeGameSessionId: null as number | null, 
  activeTournamentId: null as number | null,
};