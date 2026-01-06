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
    overlay.className = `fixed inset-0 w-screen h-screen bg-black/50
      flex items-center justify-center z-[2000]
    `;

    const modal = document.createElement("div");
    modal.className = ` bg-[var(--color-background-secondary,#fff)] p-6 rounded-2xl w-[320px]
      shadow-[0_4px_12px_rgba(0,0,0,0.15)] text-center transition-[transform,opacity]
      duration-200 ease-in-out scale-100 opacity-100`;

    const titleEl = document.createElement("h3");
    titleEl.textContent = title;
    titleEl.className = `mt-0 mb-2 text-[24px] font-bold`;
    titleEl.style.color = "#dc2626";

    const messageEl = document.createElement("p");
    messageEl.textContent = message;
    messageEl.className = `my-4 text-[18px] font-medium`;

    const buttons = document.createElement("div");
    buttons.className = `flex justify-center gap-4`;

    const yesBtn = document.createElement("button");
    yesBtn.textContent = t("game-result.checkResults") as string;
    yesBtn.className = createButtonStyle("w-fit h-[42px]", "green");

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
    overlay.className = `fixed inset-0 w-screen h-screen bg-black/50
      flex items-center justify-center z-[2000]
    `;

    const modal = document.createElement("div");
    modal.className = ` bg-[var(--color-background-secondary,#fff)] p-6 rounded-2xl w-[320px]
      shadow-[0_4px_12px_rgba(0,0,0,0.15)] text-center transition-[transform,opacity]
      duration-200 ease-in-out scale-100 opacity-100`;

    const titleEl = document.createElement("h3");
    titleEl.textContent = title;
    titleEl.className = `mt-0 mb-2 text-[24px] font-bold`;
    titleEl.style.color = "#dc2626";

    const messageEl = document.createElement("p");
    messageEl.textContent = message;
    messageEl.className = `my-4 text-[18px] font-medium`;

    const buttons = document.createElement("div");
    buttons.className = `flex justify-center gap-4`;

    const okBtn = document.createElement("button");
    okBtn.textContent = "OK";
    okBtn.className = createButtonStyle("w-fit h-[42px]", "green");

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
