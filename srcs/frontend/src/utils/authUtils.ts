import {AuthServices} from "../services/auth/AuthServices"

export class AuthUtils {
    // In-memory authentication state
    private static isLoggedIn_flag: boolean = false;
    private static currentUser: any = null;
    private static initPromise: Promise<void> | null = null;

    static async initialize(): Promise<void> {
        // If already initializing, return the existing promise
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            try {
                const response = await fetch("/api/auth/loginStatus", {
                    credentials: "include",
                })

                if (response.ok) {
                    const status = await response.json();
                    let userData = null;
                    if (status.loggedIn === true) {
                        const authService = new AuthServices();
                        userData = await authService.getCurrentUser();
                        this.isLoggedIn_flag = true;
                        this.currentUser = userData;
                        window.dispatchEvent(new CustomEvent('authChange', { 
                            detail: { isLoggedIn: true, userData } 
                        }));
                    } else {
                        this.isLoggedIn_flag = false;
                        this.currentUser = null;
                    }
                } else {
                    this.isLoggedIn_flag = false;
                    this.currentUser = null;
                }
            } catch (error) {
                console.error('Auth initialization failed:', error);
                this.isLoggedIn_flag = false;
                this.currentUser = null;
            } finally {
                this.initPromise = null;
            }
        })();

        return this.initPromise;
    }

    /**
     * Set user as logged in (called by login component after successful login)
     */
    static setLoggedIn(userData?: any): void {
        this.isLoggedIn_flag = true;
        if (userData) {
            this.currentUser = userData;
        }
        window.dispatchEvent(new CustomEvent('authChange', { 
            detail: { isLoggedIn: true, userData } 
        }));
    }

    /**
     * Check if user is logged in
     */
    static isLoggedIn(): boolean {
        return this.isLoggedIn_flag;
    }

    /**
     * Get current user data
     */
    static getUserData(): any {
        return this.currentUser;
    }

    /**
     * Set logout state (called by logout handler after successful logout)
     */
    static setLoggedOut(): void {
        this.isLoggedIn_flag = false;
        this.currentUser = null;
        window.dispatchEvent(new CustomEvent('authChange', { 
            detail: { isLoggedIn: false } 
        }));
    }

    static async showConfirmation(message: string, title = "Please Confirm", action: boolean): Promise<boolean> {
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

    static getAvUrl(path?: string): string {
        if (!path) return "";
        const backendUrl = "http://localhost:5001";
        const full = path.startsWith("http://") || path.startsWith("https://");
        const base = full ? path : `${backendUrl}${path}`;
        const sep = base.includes("?") ? "&" : "?";
        return `${base}${sep}t=${Date.now()}`;
    }
}