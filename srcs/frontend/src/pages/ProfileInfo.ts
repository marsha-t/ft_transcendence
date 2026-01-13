import { IComponent } from "../components/IComponent";
import { apiServices } from '../services/ApiServices.js';
import { t, translateApiError } from "../services/i18n/i18nService.js";
import { showMessage, createButtonStyle, applyAvatar, getAvatarUrl, showConfirmation} from "../utils/uiUtils";

/**
 * This class implements the profile information card for the user.
 * Responsibilities:
 *  - Fetch and display user profile data (username, email, avatar)
 *  - Provide an editable popup modal for updating profile info
 *  - Handle avatar changes (preset, upload, delete)
 *  - Manage 2FA toggle and related UI
 *  - Notify parent components of profile changes via callback
 *  - Provide public getters for username and avatar
 */
export class ProfileInfo implements IComponent {
    private messageContainer!: HTMLDivElement;
    private popupAvatarEl: HTMLElement | null = null;
    private avatar: string = "";
    private username: string = "";
    private email: string = "";
    private hasPassword: boolean = false;
    private isGoogleUser: boolean = false;
    private container: HTMLElement | null = null;
    private onProfileUpdate?: () => void;
    // DOM refs + handlers we need for cleanup
    private editProfileBtn: HTMLElement | null = null;
    private editProfileHandler: (() => void) | null = null;
    private modalOverlay: HTMLElement | null = null;
    // more modal internals for explicit cleanup
    private closeBtnEl: HTMLElement | null = null;
    private closeBtnHandler: (() => void) | null = null;
    private smallPresetButtons: HTMLElement[] = [];
    private smallPresetHandlers: Array<(() => void)> = [];
    private changeBtnEl: HTMLElement | null = null;
    private changeBtnHandler: (() => void) | null = null;
    private removeBtnEl: HTMLElement | null = null;
    private removeBtnHandler: (() => void) | null = null;
    private otpButtonEl: HTMLElement | null = null;
    private otpButtonHandler: (() => void) | null = null;
    private toggleSwitchEl: HTMLElement | null = null;
    private toggleSwitchHandler: (() => void) | null = null;
    private saveBtnEl: HTMLElement | null = null;
    private saveBtnHandler: (() => void) | null = null;
    private cancelBtnEl: HTMLElement | null = null;
    private cancelBtnHandler: (() => void) | null = null;
    private fileInputEl: HTMLInputElement | null = null;
    private fileInputHandler: ((e: Event) => void) | null = null;
    private _messageTimeoutId: number | null = null;
    private _isDestroyed: boolean = false;

     // ---- Constructor ----
    // Stores optional callback for parent notification (mainly for profile updates)
    constructor(onProfileUpdate?: () => void) {
        this.onProfileUpdate = onProfileUpdate;
    }

     // ---- Render the profile card ----
    render(): HTMLElement {
        const profileInfo = document.createElement("div");
        profileInfo.className = `profile-card rounded-2xl bg-background-tertiary opacity-100 text-text-primary
            px-4 py-4 relative flex flex-col items-center`;

        // Edit button
        const editProfileBtn = document.createElement("div");
        editProfileBtn.textContent = t("profile.editProfile") as string;
        editProfileBtn.className =  createButtonStyle("absolute top-2 right-2 text-[20px] w-fit h-[32px] font-nunito mt-5", 'green');

        // store handler so it can be removed during cleanup
        this.editProfileHandler = () => this.openSettingsPopup();
        editProfileBtn.addEventListener("click", this.editProfileHandler);
        this.editProfileBtn = editProfileBtn;
        
        // Avatar
        const avatar = document.createElement("div");
        avatar.className = `profile-avatar w-[132px] h-[132px]
            rounded-full border-[7px] border-white
            bg-background-tertiary mt-6`;
        applyAvatar(avatar, this.avatar, this.username);

        // Username
        const name = document.createElement("h2");
        name.className = `profile-name text-[20px] leading-[24px] tracking-[-0.01em]
            text-text-primary font-[700]
            w-fit h-fit text-[24px] uppercase font-sans
            flex justify-center items-center
            rounded-md mt-3`;
        name.textContent = this.username || "";

        profileInfo.appendChild(editProfileBtn);
        profileInfo.appendChild(avatar);
        profileInfo.appendChild(name);

        this.container = profileInfo;
        return profileInfo;
    }


    // ---- Fetch profile data from backend ----
    public async fetchProfileData(): Promise<void> {
        const profileResponse = await apiServices.profile.getProfile();
        if (profileResponse.success && profileResponse.data) {
            this.username = profileResponse.data.username;
            this.email = profileResponse.data.email;
            this.avatar = profileResponse.data.avatar || "";
            this.hasPassword = profileResponse.data.hasPassword;
            this.isGoogleUser = profileResponse.data.isGoogleUser;
            await this.updateProfileUI();
        } else {
            console.error('Failed to fetch profile data:', profileResponse.message);
        }
    }

    // ---- Update profile UI elements (username, avatar) ----
    private async fetchUsername(): Promise<string> {
        // Return current username immediately (no artificial delay)
        return Promise.resolve(this.username || "");
    }
    
    private async fetchAvatarUrl(): Promise<string | null> {
        // Return avatar URL immediately (use profile utils for consistent URL)
        if (this.avatar) return Promise.resolve(getAvatarUrl(this.avatar));
        return Promise.resolve(null);
    }
    private async updateProfileUI(): Promise<void> {
        if (!this.container) return;

        const nameEl = this.container.querySelector(".profile-name") as HTMLElement;
        const avatarEl = this.container.querySelector(".profile-avatar") as HTMLElement;
      
        if (!nameEl || !avatarEl) return;
           // Simulate an async call to fetch username from an API or load data asynchronously
        const username = await this.fetchUsername();

        // If you are fetching the avatar asynchronously (e.g., an API call to get the avatar URL)
        const avatarUrl = await this.fetchAvatarUrl();
      
        nameEl.textContent = this.username || "";
      
        applyAvatar(avatarEl, this.avatar, this.username);
    }

    // ---- update avatar in popup modal ----
    private async updatePopupAvatar(): Promise<void> {
        if (!this.popupAvatarEl) return;

        applyAvatar(this.popupAvatarEl, this.avatar, this.username);
    }

    // ---- profile settings popup modal ----

    private openSettingsPopup(): void {
        const overlay = document.createElement("div");
        overlay.className = `fixed inset-0 bg-opacity-50  bg-black flex items-center justify-center z-50`;
        // apply backdrop blur so page behind modal appears blurred
        overlay.style.setProperty('backdrop-filter', 'blur(6px)');
        overlay.style.setProperty('-webkit-backdrop-filter', 'blur(6px)');
        
        const modal = document.createElement("div");
        modal.className = `w-[520px] max-w-[95%] rounded-[30px] bg-background-tertiary text-text-primary p-6 relative opacity-100`;
        
        const header = document.createElement("div");
        header.className = `flex items-start justify-between w-full mb-4`;
        
        const closeBtn = document.createElement("button");
        closeBtn.className = `absolute top-3 right-3 w-[48px] h-[48px] flex items-center justify-center text-text-primary bg-transparent hover:brightness-90 font-nunito text-[36px]`;
        closeBtn.innerHTML = "&times;";
        // store close handler for cleanup
        this.closeBtnHandler = () => {
            if (this.modalOverlay) {
                this.modalOverlay.remove();
                this.modalOverlay = null;
            }
        };
        closeBtn.addEventListener("click", this.closeBtnHandler);
        this.closeBtnEl = closeBtn;
        
        this.messageContainer = document.createElement('div');
        modal.appendChild(this.messageContainer);
        
        // Avatar section
        const avatarSection = document.createElement("div");
        avatarSection.className = `flex items-center gap-4 mb-4`;
        
        const avatarPlaceholder = document.createElement("div");
        avatarPlaceholder.className = `avatar-placeholder w-[132px] h-[132px] rounded-full border-[9.95px] border-white bg-background-tertiary flex items-center justify-center text-3xl `;
        applyAvatar(avatarPlaceholder, this.avatar, this.username);

        this.popupAvatarEl = avatarPlaceholder;

        // Avatar actions
        const avatarActions = document.createElement('div');
        avatarActions.className = 'flex flex-col gap-2 ml-4';

        const smallRow = document.createElement('div');
        smallRow.className = 'flex items-center gap-2';
        
        const avatarPaths = [
            '/uploads/avatars/user_avatar-1.jpg',
            '/uploads/avatars/user_avatar-2.jpg',
            '/uploads/avatars/user_avatar-3.png',
            '/uploads/avatars/user_avatar-4.jpg'
        ];
        
        for (let i = 0; i < 4; i++) {
            const small = document.createElement('button');
            small.type = 'button';
            small.className = `w-[40px] h-[40px] rounded-full border-2 border-white bg-background-secondary flex items-center justify-center text-sm font-nunito text-text-primary focus:outline-none focus:ring-2`;
            small.title = `Select avatar ${i+1}`;
            applyAvatar(small, avatarPaths[i], "");
            
            // store handler so we can remove it later
            const smallHandler = async () => {
                const presetFilename = avatarPaths[i].split('/').pop() || '';
                if (presetFilename) {
                    await this.handleAvatarEdit('preset', presetFilename);
                }
            };
            small.addEventListener('click', smallHandler);
            this.smallPresetButtons.push(small);
            this.smallPresetHandlers.push(smallHandler);
            smallRow.appendChild(small);
        }

        const btnRow = document.createElement('div');
        btnRow.className = 'flex gap-2 mt-2';

        const changeBtn = document.createElement('button');
        changeBtn.type = 'button';
        changeBtn.textContent = t("profile.avatarUpload") as string;
        changeBtn.className =  createButtonStyle("w-[100px] h-[36px] font-nunito",  'green');
        // store change handler
        this.changeBtnHandler = () => this.handleAvatarEdit('external', "");
        changeBtn.addEventListener('click', this.changeBtnHandler);
        this.changeBtnEl = changeBtn;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = t("profile.avatarRemove") as string;
        removeBtn.className = createButtonStyle("w-[100px] h-[36px] font-nunito",  'blue');
        // store remove handler
        this.removeBtnHandler = () => this.handleAvatarDelete();
        removeBtn.addEventListener('click', this.removeBtnHandler);
        this.removeBtnEl = removeBtn;

        btnRow.appendChild(changeBtn);
        btnRow.appendChild(removeBtn);
        avatarActions.appendChild(smallRow);
        avatarActions.appendChild(btnRow);
        avatarSection.appendChild(avatarPlaceholder);
        avatarSection.appendChild(avatarActions);

        header.appendChild(closeBtn);
        header.appendChild(avatarSection);
        modal.appendChild(header);

        // Form fields
        const form = this.createSettingsForm();
        modal.appendChild(form);
        
        // --- Disable old password input for Google users without a password + Disable email change ---
        if (this.isGoogleUser) {

            // Hide old password ONLY if the user has no password
            if (!this.hasPassword) {
                const oldPasswordInput = form.querySelector<HTMLInputElement>("input[placeholder='Old Password']");
                if (oldPasswordInput) {
                    oldPasswordInput.style.display = "none";
                    oldPasswordInput.value = "";
                }
        
                const newPasswordInput = form.querySelector<HTMLInputElement>("#newPassword");
                if (newPasswordInput) {
                    newPasswordInput.placeholder = "Set password for this Google account";
                }
            }
        
            // Hide email input and label regardless
            const emailInput = form.querySelector<HTMLInputElement>("input[type='email']");
            if (emailInput) {
                emailInput.style.display = "none";
                emailInput.value = "";
            }
        
            // Fix for label selection (select by localized text content)
            // Use the i18n key(t) to find the email label so it works for all languages
            const emailLabel = Array.from(form.querySelectorAll("label"))
                .find(label => label.textContent === (t("auth.email") as string));
            if (emailLabel) {
                emailLabel.style.display = "none";
            }
        }

        // === 2FA Toggle ===
        const twoFactorGroup = document.createElement("div");
        twoFactorGroup.className = `mt-6 flex flex-col gap-2 p-4 rounded-[8px] bg-background-primary`;

        // Label
        const twoFactorLabel = document.createElement("div");
        twoFactorLabel.className = "flex flex-col";

        const twoFactorTitle = document.createElement("span");
        twoFactorTitle.className = "text-sm font-semibold";
        twoFactorTitle.textContent = t("profile.twoFactorAuth") as string;

        const twoFactorDesc = document.createElement("span");
        twoFactorDesc.className = "text-xs text-text-primary";
        twoFactorDesc.textContent = t("profile.twoFactorAuthDesc") as string;

        twoFactorLabel.appendChild(twoFactorTitle);
        twoFactorLabel.appendChild(twoFactorDesc);

        // Toggle switch
        const toggleSwitch = document.createElement("div");
        toggleSwitch.className = `w-12 h-5 rounded-full relative bg-background-primary border-2 border-border-green
            cursor-pointer transition-all duration-200 ease-in-out py-2`;
        const toggleCircle = document.createElement("div");
        toggleCircle.className = `absolute w-4 h-4 bg-button-active rounded-full
            top-1/2 -translate-y-1/2
            transition-all duration-200 ease-in-out`;
        toggleSwitch.appendChild(toggleCircle);

        const otpContainer = document.createElement("div");
        otpContainer.className = "flex items-center gap-2 mt-3 hidden";

        const otpInput = document.createElement("input");
        otpInput.type = "text";
        otpInput.placeholder = "Enter OTP";
        otpInput.className = `w-1/2 rounded-[8px] px-3 py-2 bg-background-primary border border-gray-500 text-text-primary placeholder-gray-400 focus:outline-none`;

        const otpButton = document.createElement("button");
        otpButton.textContent = t("common.confirm") as string;
        otpButton.className = `px-4 py-2 rounded-[8px] bg-button-active text-text-primary font-semibold hover:bg-button-active transition-colors`;

        this.otpButtonHandler = async () => {
            const code = otpInput.value.trim();
            if (!code) return showMessage(overlay, this.messageContainer, 'Please enter the OTP code', 'error');
            if (this._isDestroyed) return;
            const verifyRes = await apiServices.auth.verify2FA(code);
            if (this._isDestroyed) return;
            if (verifyRes.success) {
                showMessage(overlay, this.messageContainer, "2FA enabled successfully!", 'success');
                otpContainer.classList.add("hidden");
            } else {
                showMessage(overlay, this.messageContainer, translateApiError(verifyRes) || 'Failed to verify OTP', 'error');
            }
        };
        otpButton.addEventListener("click", this.otpButtonHandler);
        this.otpButtonEl = otpButton;

        otpContainer.appendChild(otpInput);
        otpContainer.appendChild(otpButton);

        // Initialize toggle based on backend status
        const init2FAStatus = async () => {
            const res = await apiServices.auth.get2FAStatus();
            if (this._isDestroyed) return;
            if (res.success && res.data?.enabled) {
                toggleSwitch.classList.add("enabled", "bg-button-active");
                toggleCircle.style.transform = "translate(0%, -50%)";
                toggleCircle.style.left = "32px";
                toggleCircle.style.backgroundColor = "var(--color-button-text)";
                otpContainer.classList.add("hidden"); // OTP only shows when enabling
            } else {
                toggleSwitch.classList.remove("enabled", "bg-button-active");
                toggleCircle.style.transform = "translate(0%, -50%)";
                toggleCircle.style.left = "4px";
                toggleCircle.style.backgroundColor = "var(--color-button-active)";
                otpContainer.classList.add("hidden");
            }
        };

        // Call it when modal opens
        init2FAStatus();

        // Toggle click logic
        this.toggleSwitchHandler = async () => {
            const isEnabled = toggleSwitch.classList.contains("enabled");
            if (this._isDestroyed) return;
            if (isEnabled) {
                const res = await apiServices.auth.disable2FA();
                if (this._isDestroyed) return;
                if (res.success) {
                    toggleSwitch.classList.remove("enabled", "bg-button-active");
                    toggleCircle.style.transform = "translate(0%, -50%)";
                    toggleCircle.style.left = "4px";
                    toggleCircle.style.backgroundColor = "var(--color-button-active)";
                    showMessage(overlay, this.messageContainer, res.message, 'success');
                } else {
                    showMessage(overlay, this.messageContainer, translateApiError(res), 'error');
                }
            } else {
                // Show OTP input immediately
                otpContainer.classList.remove("hidden");

                // Send OTP email asynchronously
                apiServices.auth.enable2FA().then(res => {
                    if (this._isDestroyed) return;
                    if (res.success) showMessage(overlay, this.messageContainer, res.message, 'success');
                    else showMessage(overlay, this.messageContainer, translateApiError(res), 'error');
                }).catch(err => {
                    console.error(err);
                    if (!this._isDestroyed) showMessage(overlay, this.messageContainer, 'Failed to send OTP', 'error');
                });

                toggleSwitch.classList.add("enabled", "bg-button-active");
                toggleCircle.style.transform = "translate(0%, -50%)";
                toggleCircle.style.left = "32px";
                toggleCircle.style.backgroundColor = "var(--color-button-text)";
            }
        };
        toggleSwitch.addEventListener("click", this.toggleSwitchHandler);
        this.toggleSwitchEl = toggleSwitch;

        twoFactorGroup.appendChild(twoFactorLabel);
        twoFactorGroup.appendChild(toggleSwitch);
        twoFactorGroup.appendChild(otpContainer);
        modal.appendChild(twoFactorGroup);

        // Action buttons
        const actions = this.createActionButtons(form, overlay);
        modal.appendChild(actions);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Keep a reference to the modal overlay so Router/page cleanup can remove it.
        this.modalOverlay = overlay;
    }

    // Called by Router before the page is discarded. Remove persistent listeners/resources.
    public cleanup(): void {
        // Mark destroyed so any pending async callbacks bail out
        this._isDestroyed = true;

        // Remove the edit button listener
        try {
            if (this.editProfileBtn && this.editProfileHandler) {
                this.editProfileBtn.removeEventListener("click", this.editProfileHandler as EventListener);
            }
        } catch (err) {
            console.warn("Error removing editProfileBtn listener:", err);
        }
        this.editProfileBtn = null;
        this.editProfileHandler = null;

        // If a modal overlay is still present, remove it from DOM to tear down modal listeners
        try {
            if (this.modalOverlay && this.modalOverlay.parentNode) {
                this.modalOverlay.remove();
            }
        } catch (err) {
            console.warn("Error removing modal overlay:", err);
        }
        this.modalOverlay = null;

        // Explicitly remove modal-internal listeners if present
        try {
            if (this.closeBtnEl && this.closeBtnHandler) this.closeBtnEl.removeEventListener('click', this.closeBtnHandler as EventListener);
            this.closeBtnEl = null; this.closeBtnHandler = null;

            this.smallPresetButtons.forEach((btn, idx) => {
                const h = this.smallPresetHandlers[idx];
                if (h) btn.removeEventListener('click', h as EventListener);
            });
            this.smallPresetButtons = [];
            this.smallPresetHandlers = [];

            if (this.changeBtnEl && this.changeBtnHandler) this.changeBtnEl.removeEventListener('click', this.changeBtnHandler as EventListener);
            this.changeBtnEl = null; this.changeBtnHandler = null;

            if (this.removeBtnEl && this.removeBtnHandler) this.removeBtnEl.removeEventListener('click', this.removeBtnHandler as EventListener);
            this.removeBtnEl = null; this.removeBtnHandler = null;

            if (this.otpButtonEl && this.otpButtonHandler) this.otpButtonEl.removeEventListener('click', this.otpButtonHandler as EventListener);
            this.otpButtonEl = null; this.otpButtonHandler = null;

            if (this.toggleSwitchEl && this.toggleSwitchHandler) this.toggleSwitchEl.removeEventListener('click', this.toggleSwitchHandler as EventListener);
            this.toggleSwitchEl = null; this.toggleSwitchHandler = null;

            if (this.saveBtnEl && this.saveBtnHandler) this.saveBtnEl.removeEventListener('click', this.saveBtnHandler as EventListener);
            this.saveBtnEl = null; this.saveBtnHandler = null;

            if (this.cancelBtnEl && this.cancelBtnHandler) this.cancelBtnEl.removeEventListener('click', this.cancelBtnHandler as EventListener);
            this.cancelBtnEl = null; this.cancelBtnHandler = null;
        } catch (err) {
            console.warn('Error removing modal internal listeners:', err);
        }

        // Clear file input listener if one was created
        try {
            if (this.fileInputEl && this.fileInputHandler) {
                this.fileInputEl.removeEventListener('change', this.fileInputHandler as EventListener);
            }
        } catch (err) {
            // ignore
        }
        this.fileInputEl = null;
        this.fileInputHandler = null;

        // Clear message timeout
        try {
            if (this._messageTimeoutId) {
                clearTimeout(this._messageTimeoutId);
                this._messageTimeoutId = null;
            }
        } catch (err) { /* ignore */ }

        // Clear cached DOM refs so GC can reclaim them
        this.container = null;
        this.popupAvatarEl = null;
    }

    private createSettingsForm(): HTMLElement {
        const form = document.createElement("div");
        form.className = `flex flex-col gap-3`;

        // Username
        const usernameGroup = document.createElement("div");
        usernameGroup.className = `flex flex-col gap-1`;
        const usernameLabel = document.createElement("label");
        usernameLabel.className = `text-sm font-semibold`;
        usernameLabel.textContent = t("auth.username") as string;
        const usernameInput = document.createElement("input");
        usernameInput.type = "text";
        usernameInput.className = `w-full rounded-[8px] px-3 py-2 bg-background-primary border border-gray-500 text-text-primary placeholder-gray-400 focus:outline-none`;
        usernameInput.placeholder = this.username || "";
        usernameGroup.appendChild(usernameLabel);
        usernameGroup.appendChild(usernameInput);

        // Email
        const emailGroup = document.createElement("div");
        emailGroup.className = `flex flex-col gap-1`;
        const emailLabel = document.createElement("label");
        emailLabel.className = `text-sm font-semibold`;
        emailLabel.textContent = t("auth.email") as string;
        const emailInput = document.createElement("input");
        emailInput.type = "email";
        emailInput.className = `w-full rounded-[8px] px-3 py-2 bg-background-primary border border-gray-500 text-text-primary placeholder-gray-400 focus:outline-none`;
        emailInput.placeholder = this.email || "";
        emailGroup.appendChild(emailLabel);
        emailGroup.appendChild(emailInput);

        // Password
        const passwordGroup = document.createElement("div");
        passwordGroup.className = `flex flex-col gap-1`;
        const passwordLabel = document.createElement("label");
        passwordLabel.className = `text-sm font-semibold`;
        passwordLabel.textContent = t("auth.password") as string;
        const oldPasswordInput = document.createElement("input");
        oldPasswordInput.type = "password";
        oldPasswordInput.placeholder = "Old Password";
        oldPasswordInput.className = `w-full rounded-[8px] px-3 py-2 bg-background-primary border border-gray-500 text-text-primary placeholder-gray-400 focus:outline-none`;
        const newPasswordInput = document.createElement("input");
        newPasswordInput.type = "password";
        newPasswordInput.placeholder = "New Password";
        newPasswordInput.id = "newPassword"; // <- added id to be able to call it when google user has a new placeholder
        newPasswordInput.className = `w-full rounded-[8px] px-3 py-2 bg-background-primary border border-gray-500 text-text-primary placeholder-gray-400 focus:outline-none`;
        passwordGroup.appendChild(passwordLabel);
        passwordGroup.appendChild(oldPasswordInput);
        passwordGroup.appendChild(newPasswordInput);

        form.appendChild(usernameGroup);
        form.appendChild(emailGroup);
        form.appendChild(passwordGroup);
        // form.appendChild(languageGroup);

        return form;
    }

    private createActionButtons(form: HTMLElement, overlay: HTMLElement): HTMLElement {
        const actions = document.createElement("div");
        actions.className = `flex items-center justify-end gap-3 mt-4`;

        const saveBtn = document.createElement("button");
        saveBtn.className =  createButtonStyle("w-[100px] h-[36px]  font-nunito",  'green');
        saveBtn.classList.remove("mt-5");
        saveBtn.textContent = t("common.save") as string;

        const cancelBtn = document.createElement("button");
        cancelBtn.className = createButtonStyle("w-[100px] h-[36px]  font-nunito",  'blue');
        cancelBtn.textContent = t("common.cancel") as string;

        saveBtn.addEventListener("click", async () => {
            if (await showConfirmation(t("profile.saveChanges") as string, t("profile.updateProfile") as string, true) ===true)  
            {
                const usernameInput = form.querySelector<HTMLInputElement>("input[type='text']");
                const emailInput = form.querySelector<HTMLInputElement>("input[type='email']");
                const oldPasswordInput = form.querySelector<HTMLInputElement>("input[placeholder='Old Password']");
                const newPasswordInput = form.querySelector<HTMLInputElement>("#newPassword");
    
                const data: any = {};

                if (usernameInput?.value.trim()) {
                    data.username = usernameInput.value.trim();
                }

                // Only include email if user is NOT Google user
                if (!this.isGoogleUser && emailInput?.value.trim()) {
                    data.newEmail = emailInput.value.trim();
                }

                // Only include old password if the user has a password
                if (this.hasPassword && oldPasswordInput?.value.trim()) {
                    data.oldPassword = oldPasswordInput.value.trim();
                }

                if (newPasswordInput?.value.trim()) {
                    data.newPassword = newPasswordInput.value.trim();
                }
    
                const response = await apiServices.profile.updateProfile(data);
    
                if (!response.success) {
                    await showMessage(overlay, this.messageContainer, translateApiError(response) || "Failed to update profile", 'error');
                    return;
                }
    
                if (response.data.username) this.username = response.data.username;
                if (response.data.email) this.email = response.data.email;

                await showMessage(overlay, this.messageContainer, "Profile updated successfully!", 'success');
                await this.fetchProfileData();
                if (this.onProfileUpdate) this.onProfileUpdate();
                overlay.remove();
            }
            else
            {
                overlay.remove();
                return ;
            }
            
        });

        cancelBtn.addEventListener("click", () => overlay.remove());

        actions.appendChild(saveBtn);
        actions.appendChild(cancelBtn);
        return actions;
    }

    private async handleAvatarEdit(avPath: 'preset' | 'external', avatarPath : string): Promise<void> {
        if (avPath === 'preset') {
            const confirmed = await showConfirmation(t("profile.changeAvatarConfirmation") as string, t("profile.changeAvatarLabel") as string, true);
            if (!confirmed) return;
            const response = await apiServices.profile.uploadAvatarFromPreset(avatarPath);
            if (response.success && response.data) {
                this.avatar = response.data.avatar;
                await this.updatePopupAvatar();
                await this.updateProfileUI();
                // Notify other UI (header, profile page) about avatar change immediately
                window.dispatchEvent(new CustomEvent('avatarChanged', { detail: { avatar: this.avatar } }));
                window.dispatchEvent(new CustomEvent('authChange'));
                if (this.onProfileUpdate) this.onProfileUpdate();
            } else {
                showMessage(this.modalOverlay as HTMLElement, this.messageContainer, translateApiError(response) || 'Failed to set avatar', 'error');
            }
            return ;
        }
        else {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";

            input.addEventListener("change", async (e: Event) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    const confirmed = await showConfirmation(t("profile.changeAvatarConfirmation") as string, t("profile.changeAvatarLabel") as string, true);
                    if (!confirmed) return;

                    const response = await apiServices.profile.uploadAvatar(file);

                    if (response.success && response.data) {
                        this.avatar = response.data.avatar;
                        await this.updatePopupAvatar();
                        await this.updateProfileUI();
                        // Notify other UI (header, profile page) about avatar change immediately
                        window.dispatchEvent(new CustomEvent('avatarChanged', { detail: { avatar: this.avatar } }));
                        window.dispatchEvent(new CustomEvent('authChange'));
                        if (this.onProfileUpdate) this.onProfileUpdate();
                    } else {
                        showMessage(this.modalOverlay as HTMLElement, this.messageContainer, translateApiError(response) || 'Failed to set avatar', 'error');
                    }
                }
            });

            input.click();
        }
    }

    private async handleAvatarDelete(): Promise<void> {
        const confirmed = await showConfirmation(t("profile.removeAvatarConfirmation") as string, t("profile.removeAvatarLabel") as string, false);
        if (!confirmed) return;

        const result = await apiServices.profile.deleteAvatar();
        if (!result.success) return;

        this.avatar = result.data?.avatar || "";
        await this.updatePopupAvatar();
        await this.updateProfileUI();
        // Notify other UI about avatar deletion
        window.dispatchEvent(new CustomEvent('avatarChanged', { detail: { avatar: this.avatar } }));
        window.dispatchEvent(new CustomEvent('authChange'));
        if (this.onProfileUpdate) this.onProfileUpdate();
    }

}