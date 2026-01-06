import { apiServices } from '../services/ApiServices.js';
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
                        // const profileService = new ProfileServices();
                        const userResponse = await apiServices.profile.getCurrentUser();
                        const userData = userResponse.data;
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


    static getAvUrl(path?: string): string {
        const defaultAvatar = "/uploads/avatars/default.png";

        if (!path) path = defaultAvatar;
        
        // If path is already a full URL, use it directly
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return `${path}${path.includes("?") ? "&" : "?"}t=${Date.now()}`;
        }

        // Use relative URL for frontend (avoids exposing backend)
        return `${path}${path.includes("?") ? "&" : "?"}t=${Date.now()}`;
    }
}