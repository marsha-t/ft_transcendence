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