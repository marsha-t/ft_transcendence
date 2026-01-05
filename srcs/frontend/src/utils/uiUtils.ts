import { createButtonStyle } from "../utils";
import { t } from "../services/i18n/i18nService.js";
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
                  yesBtn.className = createButtonStyle("w-fit h-[42px]", 'green');
                  if (action)
                      yesBtn.style.backgroundColor = "#4caf50";
                  else
                      yesBtn.style.backgroundColor = "red";
      
                  const noBtn = document.createElement("button");
                  noBtn.textContent = t("common.no") as string;
      
                  noBtn.className = createButtonStyle("w-fit h-[42px] mt-5", 'blue');
                  noBtn.classList.remove("bg-[#1F4D9A]");
                  noBtn.classList.add("bg-red");
      
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