import { Router } from './Router.js';
import { t } from './services/i18n/i18nService.js';
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

export async function confirmationPopup(message: string, title = t("common.pleaseConfirm") as string, action: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "2000";

    const modal = document.createElement("div");
    modal.style.background = "var(--color-background-secondary, #fff)";
    modal.style.padding = "1.5rem";
    modal.style.borderRadius = "16px";
    modal.style.width = "320px";
    modal.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    modal.style.textAlign = "center";
    modal.style.transition = "transform 0.2s ease, opacity 0.2s ease";
    modal.style.transform = "scale(1)";
    modal.style.opacity = "1";

    const titleEl = document.createElement("h3");
    titleEl.textContent = title;
    titleEl.style.marginTop = "0";
    titleEl.style.marginBottom = "0.5rem";
    titleEl.style.fontSize = "1.1rem";

    const messageEl = document.createElement("p");
    messageEl.textContent = message;
    messageEl.style.margin = "1rem 0";
    messageEl.style.fontSize = "0.95rem";

    const buttons = document.createElement("div");
    buttons.style.display = "flex";
    buttons.style.justifyContent = "center";
    buttons.style.gap = "1rem";

    const yesBtn = document.createElement("button");
    yesBtn.textContent = t("game-result.checkResults") as string;
    yesBtn.style.padding = "0.5rem 1.2rem";
    yesBtn.style.border = "none";
    yesBtn.style.borderRadius = "8px";
    if (action)
      yesBtn.style.backgroundColor = "#4caf50";
    else
      yesBtn.style.backgroundColor = "red";

    yesBtn.style.color = "white";
    yesBtn.style.cursor = "pointer";
    yesBtn.style.fontSize = "0.9rem";

    buttons.appendChild(yesBtn);
    modal.appendChild(titleEl);
    modal.appendChild(messageEl);
    modal.appendChild(buttons);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const cleanup = (confirmed: boolean) => {
      modal.style.opacity = "0";
      modal.style.transform = "scale(0.95)";
      setTimeout(() => overlay.remove(), 200);
      resolve(confirmed);
    };

    yesBtn.addEventListener("click", () => cleanup(true));
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape") cleanup(false);
      },
      { once: true }
    );
  });
}

export async function alertPopup(message: string, title = "Alert"): Promise<void> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "2000";

    const modal = document.createElement("div");
    modal.style.background = "var(--color-background-secondary, #fff)";
    modal.style.padding = "1.5rem";
    modal.style.borderRadius = "16px";
    modal.style.width = "320px";
    modal.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    modal.style.textAlign = "center";
    modal.style.transition = "transform 0.2s ease, opacity 0.2s ease";
    modal.style.transform = "scale(1)";
    modal.style.opacity = "1";

    const titleEl = document.createElement("h3");
    titleEl.textContent = title;
    titleEl.style.marginTop = "0";
    titleEl.style.marginBottom = "0.5rem";
    titleEl.style.fontSize = "1.1rem";

    const messageEl = document.createElement("p");
    messageEl.textContent = message;
    messageEl.style.margin = "1rem 0";
    messageEl.style.fontSize = "0.95rem";

    const buttons = document.createElement("div");
    buttons.style.display = "flex";
    buttons.style.justifyContent = "center";
    buttons.style.gap = "1rem";

    const okBtn = document.createElement("button");
    okBtn.textContent = "OK";
    okBtn.style.padding = "0.5rem 1.2rem";
    okBtn.style.border = "none";
    okBtn.style.borderRadius = "8px";
    okBtn.style.backgroundColor = "#4caf50";
    okBtn.style.color = "white";
    okBtn.style.cursor = "pointer";
    okBtn.style.fontSize = "0.9rem";

    buttons.appendChild(okBtn);
    modal.appendChild(titleEl);
    modal.appendChild(messageEl);
    modal.appendChild(buttons);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const cleanup = () => {
      modal.style.opacity = "0";
      modal.style.transform = "scale(0.95)";
      setTimeout(() => overlay.remove(), 200);
      resolve();
    };

    okBtn.addEventListener("click", () => cleanup());
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape" || e.key === "Enter") cleanup();
      },
      { once: true }
    );
  });
}

export function createButtonStyle(customization: string = "", color: 'blue' | 'green'): string {
  const mainGreenStyle = ` inline-flex items-center justify-center px-8 py-3 bg-button-active text-white
    font-bold rounded-lg tracking-widest 
    shadow-[0_5px_0_var(--color-button-shadow)]
    hover:shadow-[0_2px_0_var(--color-button-shadow)] active:shadow-none
    hover:translate-y-1 active:translate-y-2
    transition-all duration-150 mt-5 text-center no-underline whitespace-nowrap`;

    const mainBlueStyle = `
      inline-flex items-center justify-center px-8 py-3
      bg-[#1F4D9A] text-white font-bold rounded-lg tracking-widest 
      shadow-[0px_-2px_2px_0px_#0000001A_inset,0px_2px_2px_0px_#00000040]
        transition-all duration-150 text-center no-underline whitespace-nowrap
      hover:translate-y-1 active:translate-y-2
      `;
  
   const greenHoverActive = `hover:bg-green active:bg-green hover:text-white`;

  if (color === 'blue') {
    return `${mainBlueStyle} ${greenHoverActive} ${customization}`;
  }
  

  return `${mainGreenStyle} ${greenHoverActive} ${customization}`;
  
}
//--------------------------
// UI Helpers
//--------------------------
//showMessage()
