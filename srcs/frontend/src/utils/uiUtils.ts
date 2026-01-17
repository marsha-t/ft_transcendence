import { t } from "../services/i18n/i18nService.js";

// Utility function to create a styled button with specified label, id, display style, and click handler
export function makeButton(label: string, id: string, display: string, handler: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.id = id;

  btn.className =
    "w-48 h-12 bg-button-active text-button-text font-sans rounded-lg " +
    "shadow-[0_5px_0_var(--color-button-shadow)] " +
    "hover:shadow-[0_2px_0_var(--color-button-shadow)] active:shadow-none " +
    "hover:translate-y-1 active:translate-y-2 " +
    "transition-all duration-150 mt-5";
  btn.style.display = display;
  btn.textContent = label;
  btn.addEventListener("click", handler);

  return btn;
}

export function makeCircular3DButton(
  label: string,
  id: string,
  href: string,
  icon?: string
): HTMLAnchorElement {
  const link = document.createElement("a");
  link.id = id;
  link.href = href;

  link.className =
    "flex flex-col items-center justify-center no-underline " +
    "w-40 h-40 rounded-full " +
    "bg-button-active text-button-text font-sans " +
    "shadow-[0_8px_0_var(--color-button-shadow)] " +
    "hover:shadow-[0_4px_0_var(--color-button-shadow)] active:shadow-none " +
    "hover:translate-y-1 active:translate-y-2 " +
    "transition-all duration-150";

  // Icon container if icon provided
  if (icon) {
    const iconContainer = document.createElement("div");
    iconContainer.className = "text-4xl mb-1";
    iconContainer.textContent = icon;
    link.appendChild(iconContainer);
  }

  // Label text
  const labelText = document.createElement("span");
  labelText.className = "text-xs font-bold uppercase tracking-wide text-center px-2";
  labelText.textContent = label;
  link.appendChild(labelText);

  return link;
}

export function createButtonStyle(customization: string = "", color: 'blue' | 'green' | 'red'): string {
  const mainGreenStyle = ` inline-flex items-center justify-center px-8 py-3 bg-button-active text-white
    font-bold rounded-lg tracking-widest 
    shadow-[0_5px_0_var(--color-button-shadow)]
    hover:shadow-[0_2px_0_var(--color-button-shadow)] active:shadow-none
    hover:translate-y-1 active:translate-y-2
    transition-all duration-150 text-center no-underline whitespace-nowrap`;

    const mainBlueStyle = `
      inline-flex items-center justify-center px-8 py-3
      bg-button-inactive text-white font-bold rounded-lg tracking-widest
      shadow-[0_5px_0_var(--color-button-shadow-blue)]
      hover:shadow-[0_2px_0_var(--color-button-shadow-blue)]
      active:shadow-none
      transition-all duration-150 text-center no-underline whitespace-nowrap
      hover:translate-y-1 active:translate-y-2
      `;
  const mainRedStyle = `
      inline-flex items-center justify-center px-8 py-3
      bg-red text-white font-bold rounded-lg tracking-widest
      shadow-[0_5px_0_var(--color-button-shadow-red)]
      hover:shadow-[0_2px_0_var(--color-button-shadow-red)]
      active:shadow-none
      transition-all duration-150 text-center no-underline whitespace-nowrap
      hover:translate-y-1 active:translate-y-2
      `;
  
   const greenHoverActive = `hover:bg-green active:bg-green hover:text-white`;

  if (color === 'blue') {
    return `${mainBlueStyle} ${greenHoverActive} ${customization}`;
  }
  if (color === 'red') {
    return `${mainRedStyle} ${customization}`;
  }

  return `${mainGreenStyle} ${greenHoverActive} ${customization}`;
  
}


export async function gameCompletionPopup(message: string, title = t("common.pleaseConfirm") as string, action: boolean): Promise<boolean> {
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


export async function showConfirmation(message: string, title = t("common.pleaseConfirm") as string, action: boolean): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className =
    "fixed inset-0 z-[2000] flex items-center justify-center bg-black/50";

    const modal = document.createElement("div");
    modal.className =
    "w-[320px] rounded-2xl bg-[var(--color-background-secondary,#fff)] p-6 text-center shadow-lg transition-transform transition-opacity duration-200 ease-out scale-100 opacity-100";

    const titleEl = document.createElement("h3");
    titleEl.className = "mt-0 mb-2 text-[1.1rem] font-medium";
    titleEl.textContent = title;

    const messageEl = document.createElement("p");
    messageEl.className = "my-4 text-[0.95rem]";
    messageEl.textContent = message;

    const buttons = document.createElement("div");
    buttons.style.display = "flex";
    buttons.style.justifyContent = "center";
    buttons.style.gap = "1rem";

    const yesBtn = document.createElement("button");
    yesBtn.textContent = t("common.yes") as string;
    yesBtn.className = createButtonStyle("w-fit h-[42px] mt-5", 'green');
    if (action)
        yesBtn.style.backgroundColor = "#4caf50";
    else
        yesBtn.style.backgroundColor = "#4caf50";

    const noBtn = document.createElement("button");
    noBtn.textContent = t("common.no") as string;

    noBtn.className = createButtonStyle("w-fit h-[42px] mt-5", 'red');

    buttons.appendChild(yesBtn);
    buttons.appendChild(noBtn);
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
    noBtn.addEventListener("click", () => cleanup(false));
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) cleanup(false);
    });
    document.addEventListener(
      "keydown",
      (e) => {
          if (e.key === "Escape") cleanup(false);
      },
                  { once: true }
              );
          });
}

export type MessageType = 'success' | 'error';
export async function showMessage( container: HTMLElement, messageContainer: HTMLElement, message: string, type: MessageType): Promise<void> { 
  if (!container || !messageContainer) return;

  messageContainer.style.display = 'block';
  const baseClass = `
    mt-6 p-4 mx-auto
    w-fit h-fit rounded-[16px]
    font-nunito text-[18px] text-center          
    flex items-center justify-center 
    transition-opacity duration-300
  `;

  const typeClasses = type === 'success'? 'text-[#225326] border-2 border-[#4AB553] bg-[#CCEACF]' : 'text-[#950F0F] border-2 border-[#E31717] bg-[#F9BEBE]';

  messageContainer.className = `${baseClass} ${typeClasses}`;
  
  // Ensure message is a string for display . convert objects to string
  let displayMessage: string;
  if (typeof message === 'string') {
    displayMessage = message;           
  } else if (typeof message === 'object' && message !== null && 'message' in message) {
    displayMessage = String((message as any).message);
  } else {
    displayMessage = JSON.stringify(message);
  }
  messageContainer.textContent = displayMessage;

  // Scroll to top to show message
  container.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // For success messages, wait for the display duration before resolving
  if (type === 'success') {
    await new Promise(resolve => {
      setTimeout(() => {
        messageContainer.style.display = 'none';
        resolve(void 0);
      }, 700);
    });
  }
}

  export function applyAvatar(element: HTMLElement, avatarUrl?: string, username?: string) {
  if (!element) return;

  if (avatarUrl) {
    element.style.backgroundImage = `url(${getAvatarUrl(avatarUrl)})`;
    element.style.backgroundSize = "cover";
    element.style.backgroundPosition = "center";
    element.textContent = "";
  } else {
    element.style.backgroundImage = "";
    element.textContent = username ? username.charAt(0).toUpperCase() : "";
  }
}

export function getAvatarUrl(avatarPath: string): string {
  
  const defaultAvatar = "/uploads/avatars/default.png";
  if (!avatarPath) avatarPath = defaultAvatar;
  return `${avatarPath}${avatarPath.includes("?") ? "&" : "?"}t=${Date.now()}`;
}