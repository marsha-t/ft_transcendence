import { Router } from './Router.js';
//--------------------------
// Routing
//--------------------------

let routerInstance: Router | null = null;

export function getRouter(container: HTMLElement): Router {
  if (!routerInstance) {
    routerInstance = new Router(container);
  }
  return routerInstance;
}

export function navigate(path: string, state: any = {}) {
  if (window.location.pathname === path) return;
  
  const event = new PopStateEvent("popstate");
  (event as any).isSynthetic = true;
  
  window.history.pushState(state, "", path);
  window.dispatchEvent(event);
}

//--------------------------
// UI Helpers
//--------------------------
//showMessage()
