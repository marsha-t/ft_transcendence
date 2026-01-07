
import { AuthUtils } from './authUtils.js';

export function getAvatarUrl(avatarPath: string): string {
  // Use AuthUtils.getAvUrl to add cache-busting timestamp and consistent backend base URL
  return AuthUtils.getAvUrl(avatarPath);
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
