

export function getAvatarUrl(avatarPath: string): string {
  const backendUrl = "http://localhost:5001";

  if (!avatarPath) return `${backendUrl}/uploads/default-avatar.png`;
  if (avatarPath.startsWith("http")) return avatarPath;

  return `${backendUrl}${avatarPath.startsWith("/") ? avatarPath : "/" + avatarPath}`;
}

export function showMessage(
  message: string,
  type: "success" | "error" = "success"
): void {
  const msg = document.createElement("div");
  msg.textContent = message;
  msg.className = `
    fixed bottom-4 left-1/2 transform -translate-x-1/2
    px-6 py-3 rounded-xl text-white z-50
    ${type === "success" ? "bg-green-600" : "bg-red-600"}
  `;
  document.body.appendChild(msg);

  setTimeout(() => msg.remove(), 2500);
}

export async function showConfirmation(message: string, title = "Please Confirm", action: boolean): Promise<boolean> {
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
      yesBtn.textContent = "Yes";
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
  
      const noBtn = document.createElement("button");
      noBtn.textContent = "Cancel";
      noBtn.style.padding = "0.5rem 1.2rem";
      noBtn.style.border = "none";
      noBtn.style.borderRadius = "8px";
      noBtn.style.backgroundColor = "#ddd";
      noBtn.style.cursor = "pointer";
      noBtn.style.fontSize = "0.9rem";
  
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

