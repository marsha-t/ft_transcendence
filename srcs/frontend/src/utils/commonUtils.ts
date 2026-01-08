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
