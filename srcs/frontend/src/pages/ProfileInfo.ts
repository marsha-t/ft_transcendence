import { IComponent } from "../components/IComponent";
import { apiServices } from '../services/ApiServices.js';
import { ProfileData, ApiResponse } from '../services/profile/types';
import { getAvatarUrl } from "../utils/profileUtils.js";
import { createButtonStyle } from "../utils";
import { t } from "../services/i18n/i18nService.js";
import { changeLanguage } from "../services/i18n/i18nService.js";
import { showConfirmation } from "../utils/uiUtils";

export class ProfileInfo implements IComponent {
    private messageContainer: HTMLDivElement | null = null;
    private popupAvatarEl: HTMLElement | null = null;
    private avatar: string = "";
    private username: string = "";
    private email: string = "";
    private hasPassword: boolean = false;
    private isGoogleUser: boolean = false;
    private container: HTMLElement | null = null;
    private onProfileUpdate?: () => void;

    constructor(onProfileUpdate?: () => void) {
        this.onProfileUpdate = onProfileUpdate;
    }

    render(): HTMLElement {
        const profileInfo = document.createElement("div");
        profileInfo.className = `profile-card rounded-2xl bg-[#21447E] opacity-100 text-color_white
            p-4 relative flex flex-col items-center`;

        const editProfileBtn = document.createElement("div");
        editProfileBtn.textContent = t("profile.editProfile") as string;
        editProfileBtn.className =  createButtonStyle("absolute top-2 right-2 w-fit h-[32px] font-pixel", 'green');
  
        editProfileBtn.addEventListener("click", () => this.openSettingsPopup());
        
        const avatar = document.createElement("div");
        avatar.className = `profile-avatar w-[132px] h-[132px]
            rounded-full border-[7px] border-white
            bg-[#21447E] mt-6`;
        
        if (this.avatar) {
            avatar.style.backgroundImage = `url(${getAvatarUrl(this.avatar)})`;
            avatar.style.backgroundSize = "cover";
            avatar.style.backgroundPosition = "center";
            avatar.textContent = "";
        } else {
            avatar.style.backgroundImage = "";
            avatar.textContent = (this.username ? this.username.charAt(0).toUpperCase() : "");
        }

        const name = document.createElement("h2");
        name.className = `profile-name text-[20px] leading-[24px] tracking-[-0.01em]
            font-pixel font-[500]
            w-[125px] h-[24px]
            flex justify-center items-center
            rounded-md mt-3`;
        name.style.color = "white"; // Explicitly set the text color to white
        name.textContent = this.username || "username";

        profileInfo.appendChild(editProfileBtn);
        profileInfo.appendChild(avatar);
        profileInfo.appendChild(name);

        this.container = profileInfo;
        return profileInfo;
    }

    public async fetchProfileData(): Promise<void> {
        try {
            const profileResponse: ApiResponse<ProfileData> = await apiServices.profile.getProfile();
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
        } catch (error: any) {
            console.error('Error fetching profile data:', error);
        }
    }
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
      
        if (this.avatar) {
            avatarEl.style.backgroundImage = `url(${getAvatarUrl(this.avatar)})`;
            avatarEl.style.backgroundSize = "cover";
            avatarEl.style.backgroundPosition = "center";
            avatarEl.textContent = "";
        } else {
            avatarEl.style.backgroundImage = "";
            avatarEl.textContent = this.username ? this.username.charAt(0).toUpperCase() : "";
        }
    }

    private async updatePopupAvatar(): Promise<void> {
        if (!this.popupAvatarEl) return;

        if (this.avatar) {
            this.popupAvatarEl.style.backgroundImage = `url(${getAvatarUrl(this.avatar)})`;
            this.popupAvatarEl.style.backgroundSize = "cover";
            this.popupAvatarEl.style.backgroundPosition = "center";
            this.popupAvatarEl.textContent = "";
        } else {
            this.popupAvatarEl.style.backgroundImage = "";
            this.popupAvatarEl.textContent = this.username.charAt(0).toUpperCase() || "";
        }
    }

    private openSettingsPopup(): void {
        const overlay = document.createElement("div");
        overlay.className = `fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`;
        
        const modal = document.createElement("div");
        modal.className = `w-[520px] max-w-[95%] rounded-[16px] bg-[#21447E] text-white p-6 relative opacity-100`;
        
        const header = document.createElement("div");
        header.className = `flex items-start justify-between w-full mb-4`;
        
        const closeBtn = document.createElement("button");
        closeBtn.className = `absolute top-3 right-3 w-[48px] h-[48px] flex items-center justify-center text-white bg-transparent hover:brightness-90 font-pixel text-[36px]`;
        closeBtn.innerHTML = "&times;";
        closeBtn.addEventListener("click", () => overlay.remove());
        
        this.messageContainer = document.createElement('div');
        this.messageContainer.className = 'message_container w-full p-3 rounded-md mb-3 text-sm';
        this.messageContainer.style.display = 'none';
        modal.appendChild(this.messageContainer);
        
        // Avatar section
        const avatarSection = document.createElement("div");
        avatarSection.className = `flex items-center gap-4 mb-4`;
        
        const avatarPlaceholder = document.createElement("div");
        avatarPlaceholder.className = `avatar-placeholder w-[132px] h-[132px] rounded-full border-[9.95px] border-white bg-[#21447E] flex items-center justify-center text-3xl font-pixel`;
        
        if (this.avatar) {
            avatarPlaceholder.style.backgroundImage = `url(${getAvatarUrl(this.avatar)})`;
            avatarPlaceholder.style.backgroundSize = "cover";
            avatarPlaceholder.style.backgroundPosition = "center";
        } else {
            avatarPlaceholder.textContent = this.username.charAt(0).toUpperCase() || "";
        }

        this.popupAvatarEl = avatarPlaceholder;

        // Avatar actions
        const avatarActions = document.createElement('div');
        avatarActions.className = 'flex flex-col gap-2 ml-4';

        const smallRow = document.createElement('div');
        smallRow.className = 'flex items-center gap-2';
        
        const avatarPaths = [
            'http://localhost:5001/uploads/avatars/user_avatar-1.jpg',
            'http://localhost:5001/uploads/avatars/user_avatar-2.jpg',
            'http://localhost:5001/uploads/avatars/user_avatar-3.png',
            'http://localhost:5001/uploads/avatars/user_avatar-4.jpg'
        ];
        
        for (let i = 0; i < 4; i++) {
            const small = document.createElement('button');
            small.type = 'button';
            small.className = `w-[40px] h-[40px] rounded-full border-2 border-white bg-background-yellow flex items-center justify-center text-sm font-pixel text-color_white focus:outline-none focus:ring-2 focus:ring-[#297138]`;
            small.style.backgroundImage = `url('${avatarPaths[i]}')`;
            small.style.backgroundSize = 'cover';
            small.style.backgroundPosition = 'center';
            small.title = `Select avatar ${i+1}`;
            
            small.addEventListener('click', async () => {
                const presetFilename = avatarPaths[i].split('/').pop() || '';
                if (presetFilename) {
                    this.handleAvatarEdit('preset', presetFilename);
                }
            });
            smallRow.appendChild(small);
        }

        const btnRow = document.createElement('div');
        btnRow.className = 'flex gap-2 mt-2';

        const changeBtn = document.createElement('button');
        changeBtn.type = 'button';
        changeBtn.textContent = t("profile.avatarUpload") as string;
        changeBtn.className =  createButtonStyle("w-[100px] h-[36px] font-pixel",  'green');
        changeBtn.classList.remove("mt-5");
        changeBtn.addEventListener('click', () => this.handleAvatarEdit('external', ""));

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = t("profile.avatarRemove") as string;
        removeBtn.className = createButtonStyle("w-[100px] h-[36px] font-pixel",  'blue');
        removeBtn.addEventListener('click', () => this.handleAvatarDelete());

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
        twoFactorGroup.className = `mt-6 flex flex-col gap-2 p-4 rounded-[8px] bg-[#183B76]`;

        // Label
        const twoFactorLabel = document.createElement("div");
        twoFactorLabel.className = "flex flex-col";

        const twoFactorTitle = document.createElement("span");
        twoFactorTitle.className = "text-sm font-semibold";
        twoFactorTitle.textContent = t("profile.twoFactorAuth") as string;

        const twoFactorDesc = document.createElement("span");
        twoFactorDesc.className = "text-xs text-gray-400";
        twoFactorDesc.textContent = t("profile.twoFactorAuthDesc") as string;

        twoFactorLabel.appendChild(twoFactorTitle);
        twoFactorLabel.appendChild(twoFactorDesc);

        // Toggle switch
        const toggleSwitch = document.createElement("div");
        toggleSwitch.className = `
            w-12 h-6 rounded-full relative
            bg-[#183B76] border-2 border-[#77AB55] cursor-pointer
            transition-all duration-200 ease-in-out
        `;
        const toggleCircle = document.createElement("div");
        toggleCircle.className = `
            absolute w-4 h-4 bg-[#77AB55] rounded-full
            top-1/2 -translate-y-1/2 left-1
            transition-all duration-200 ease-in-out
        `;
        toggleSwitch.appendChild(toggleCircle);

        const otpContainer = document.createElement("div");
        otpContainer.className = "flex items-center gap-2 mt-3 hidden";

        const otpInput = document.createElement("input");
        otpInput.type = "text";
        otpInput.placeholder = "Enter OTP";
        otpInput.className = `w-1/2 rounded-[8px] px-3 py-2 bg-[#183B76] border border-gray-500 text-white placeholder-gray-400 focus:outline-none`;

        const otpButton = document.createElement("button");
        otpButton.textContent = t("common.confirm") as string;
        otpButton.className = `px-4 py-2 rounded-[8px] bg-[#77AB55] text-white font-semibold hover:bg-green-500 transition-colors`;

        otpButton.addEventListener("click", async () => {
            const code = otpInput.value.trim();
            if (!code) return alert("Enter OTP");

            const verifyRes = await apiServices.profile.verify2FA(code);
            if (verifyRes.success) {
            alert("2FA enabled successfully!");
            otpContainer.classList.add("hidden");
            } else {
            alert(`Error: ${verifyRes.message}`);
            }
        });

        otpContainer.appendChild(otpInput);
        otpContainer.appendChild(otpButton);

        // Initialize toggle based on backend status
        const init2FAStatus = async () => {
            const res = await apiServices.profile.get2FAStatus();
            if (res.success && res.enabled) {
            toggleSwitch.classList.add("enabled", "bg-[#77AB55]");
            toggleCircle.style.transform = "translate(100%, -50%)";
            toggleCircle.style.left = "16px";
            otpContainer.classList.add("hidden"); // OTP only shows when enabling
            } else {
            toggleSwitch.classList.remove("enabled", "bg-[#77AB55]");
            toggleCircle.style.transform = "translate(-0%, -50%)";
            toggleCircle.style.left = "4px";
            otpContainer.classList.add("hidden");
            }
        };

        // Call it when modal opens
        init2FAStatus();

        // Toggle click logic
        toggleSwitch.addEventListener("click", async () => {
            const isEnabled = toggleSwitch.classList.contains("enabled");

            if (isEnabled) {
            const res = await apiServices.profile.disable2FA();
            if (res.success) {
                toggleSwitch.classList.remove("enabled", "bg-[#77AB55]");
                toggleCircle.style.transform = "translate(-0%, -50%)";
                toggleCircle.style.left = "4px";
                alert(res.message);
            } else {
                alert(res.message);
            }
            } else {
            // Show OTP input immediately
            otpContainer.classList.remove("hidden");

            // Send OTP email asynchronously
            apiServices.profile.enable2FA().then(res => {
                if (res.success) alert(res.message);
                else alert(res.message);
            }).catch(err => {
                console.error(err);
                alert("Failed to send OTP email");
            });

            toggleSwitch.classList.add("enabled", "bg-[#77AB55]");
            toggleCircle.style.transform = "translate(100%, -50%)";
            toggleCircle.style.left = "16px";
            }
        });

        twoFactorGroup.appendChild(twoFactorLabel);
        twoFactorGroup.appendChild(toggleSwitch);
        twoFactorGroup.appendChild(otpContainer);
        modal.appendChild(twoFactorGroup);

        // Action buttons
        const actions = this.createActionButtons(form, overlay);
        modal.appendChild(actions);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
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
        usernameInput.className = `w-full rounded-[8px] px-3 py-2 bg-[#183B76] border border-gray-500 text-white placeholder-gray-400 focus:outline-none`;
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
        emailInput.className = `w-full rounded-[8px] px-3 py-2 bg-[#183B76] border border-gray-500 text-white placeholder-gray-400 focus:outline-none`;
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
        oldPasswordInput.className = `w-full rounded-[8px] px-3 py-2 bg-[#183B76] border border-gray-500 text-white placeholder-gray-400 focus:outline-none`;
        const newPasswordInput = document.createElement("input");
        newPasswordInput.type = "password";
        newPasswordInput.placeholder = "New Password";
        newPasswordInput.id = "newPassword"; // <- added id to be able to call it when google user has a new placeholder
        newPasswordInput.className = `w-full rounded-[8px] px-3 py-2 bg-[#183B76] border border-gray-500 text-white placeholder-gray-400 focus:outline-none`;
        passwordGroup.appendChild(passwordLabel);
        passwordGroup.appendChild(oldPasswordInput);
        passwordGroup.appendChild(newPasswordInput);

        // Language
        const languageGroup = document.createElement("div");
        languageGroup.className = `flex flex-col gap-1`;

        const languageLabel = document.createElement("label");
        languageLabel.className = `text-sm font-semibold`;
        languageLabel.textContent = t("settings.language") as string;

        const languageSelect = document.createElement("select");
        languageSelect.className = `
        w-full rounded-[8px] px-3 py-2
        bg-[#183B76] border border-gray-500
        text-white focus:outline-none
        `;

        const languages = [
        { code: "en", label: "English" },
        { code: "sp", label: "Spanish" },
        { code: "ru", label: "Russian" },
        ];

        languages.forEach(lang => {
        const option = document.createElement("option");
        option.value = lang.code;
        option.textContent = lang.label;
        languageSelect.appendChild(option);
        });

        // Set current language (from backend)
        languageSelect.value = localStorage.getItem("i18nextLng") || "en";
        
        // Add change handler to persist language to backend
        languageSelect.addEventListener('change', async (e) => {
            const selectedLanguage = (e.target as HTMLSelectElement).value;
            try {
                // Update language locally first for immediate UI response
                await changeLanguage(selectedLanguage);
                
                // Show success message
                this.showMessage("Language updated successfully!", 'success');
            } catch (error) {
                console.error('Failed to update language:', error);
                this.showMessage("Failed to update language", 'error');
            }
        });

        languageGroup.appendChild(languageLabel);
        languageGroup.appendChild(languageSelect);

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
        saveBtn.className =  createButtonStyle("w-[100px] h-[36px]  font-pixel",  'green');
        saveBtn.classList.remove("mt-5");
        saveBtn.textContent = t("common.save") as string;

        const cancelBtn = document.createElement("button");
        cancelBtn.className = createButtonStyle("w-[100px] h-[36px]  font-pixel",  'blue');
        cancelBtn.textContent = t("common.cancel") as string;

        saveBtn.addEventListener("click", async () => {
            if (await showConfirmation(t("profile.saveChanges") as string, t("profile.updateProfile") as string, true) ===true)  
            {
                const usernameInput = form.querySelector<HTMLInputElement>("input[type='text']");
                const emailInput = form.querySelector<HTMLInputElement>("input[type='email']");
                const oldPasswordInput = form.querySelector<HTMLInputElement>("input[placeholder='Old Password']");
                const newPasswordInput = form.querySelector<HTMLInputElement>("#newPassword");
    
                const data: any = {
                    username: usernameInput?.value || undefined,
                    newEmail: emailInput?.value || undefined,
                    oldPassword: oldPasswordInput?.value || undefined,
                    newPassword: newPasswordInput?.value || undefined,
                };
    
                const response = await apiServices.profile.updateProfile(data);
    
                if (!response.success) {
                    this.showMessage((response.message || "Failed to update profile"), 'error');
                    return;
                }
    
                if (response.data.username) this.username = response.data.username;
                if (response.data.email) this.email = response.data.email;
    
                this.showMessage("Profile updated successfully!", 'success');
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
        try {
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
                    alert(response.message || 'Failed to set avatar');
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
                            alert(response.message || 'Failed to set avatar');
                        }
                    }
                });

                input.click();
            }
    } catch (error) {
        console.error("Error updating avatar:", error);
        alert("An error occurred while updating your avatar.");
    }
    }

    private async handleAvatarDelete(): Promise<void> {
        const confirmed = await showConfirmation(t("profile.removeAvatarConfirmation") as string, t("profile.removeAvatarLabel") as string, false);
        if (!confirmed) return;

        try {
            const result = await apiServices.profile.deleteAvatar();
            if (!result.success) return;

            this.avatar = result.data?.avatar || "";
            await this.updatePopupAvatar();
            await this.updateProfileUI();
            // Notify other UI about avatar deletion
            window.dispatchEvent(new CustomEvent('avatarChanged', { detail: { avatar: this.avatar } }));
            window.dispatchEvent(new CustomEvent('authChange'));
            if (this.onProfileUpdate) this.onProfileUpdate();
        } catch (error) {
            console.error("Network error:", error);
            alert("Network error while removing avatar.");
        }
    }

    private showMessage(message: string, type: 'success' | 'error'): void {
        if (!this.messageContainer) return;
        
        this.messageContainer.style.display = 'block';
        const baseClass = `
            mt-6 px-4 py-3 position:absolute top-2 right-2
            w-[360px] h-[54px] px-4 rounded-[16px]
            text-color_white font-mono text-[20px]
            text-center          
            flex items-center justify-center 
            transition-opacity duration-300
        `;

        const typeClasses = type === 'error' 
            ? 'border-2 border-red-600 bg-red-900 bg-opacity-20' 
            : 'border-2 border-green-600 bg-green-900 bg-opacity-20';
        
        this.messageContainer.className = `${baseClass} ${typeClasses}`;
        this.messageContainer.textContent = message;
        
        setTimeout(() => {
            if (this.messageContainer) {
                this.messageContainer.style.opacity = '0';
                setTimeout(() => {
                    if (this.messageContainer) {
                        this.messageContainer.style.display = 'none';
                        this.messageContainer.style.opacity = '1';
                    }
                }, 300);
            }
        }, 1000);
    }

    public getUsername(): string {
        return this.username;
    }

    public getAvatar(): string {
        return this.avatar;
    }
}