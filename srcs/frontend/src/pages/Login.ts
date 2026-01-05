import { IComponent } from "../components/IComponent";
import { apiServices } from "../services/auth/AuthServices.js";
import { LoginData, Login2FAData } from "../services/auth/types";
import { createButtonStyle, navigate } from "../utils.js";
import { AuthUtils } from "../utils/authUtils.js";
import { t } from "../services/i18n/i18nService.js";

export class Login implements IComponent {
    private container!: HTMLElement;
    private loginCard!: HTMLElement;
    private messageContainer!: HTMLElement;
    private form!: HTMLFormElement;
    private submitButton!: HTMLButtonElement;
    private isLoading: boolean = false;

    // 2FA elements
    private otpGroup!: HTMLDivElement;
    private otpInput!: HTMLInputElement;
    private otpSubmitButton!: HTMLButtonElement;
    private otpResendButton!: HTMLButtonElement;
    private is2FAActive: boolean = false;
    private currentUsername: string = '';

    public render(): HTMLElement {
        // === Main container ===
        this.container = document.createElement('div');
        this.container.className = `
            flex justify-center bg-yellow
            h-full py-[23px]`;
    
        const subContainer = document.createElement('div');
        subContainer.className = `
            flex flex-col items-center justify-start
            bg-background-primary rounded-[16px] shadow-lg
            mx-[23px] w-[calc(100%-46px)]
            h-auto py-6 px-10`;
    
        // === Heading ===
        const heading = document.createElement('h2');
        heading.className =
            'w-[596px] text-center mb-6 text-[28px] font-press text-white';
        heading.textContent = t('auth.welcomeBack') as string;
        
        // === Login card (form wrapper) ===
        this.loginCard = document.createElement('div');
        this.loginCard.className =
            `flex flex-col items-center justify-center 
             bg-background-primary border-2 border-border-green 
             rounded-[16px] p-8`;
    
        // === Register link ===
        const registerLink = document.createElement('p');
        registerLink.className =
            'font-nunito text-white text-left mb-4';
        registerLink.innerHTML = `
            ${t('auth.noAccount')}
            <a href="/register"
            class="font-mono text-color-green underline ml-40 hover:opacity-80">
            ${t('auth.register-btn')}
            </a>`;
        
        // Form
        this.form = document.createElement('form');
        this.form.className =
            'flex flex-col gap-[26px] items-center w-full leading-normal';
    
        // Username & Password inputs
        const usernameGroup = this.createInput('username', 'USERNAME', 'text', 'username');
        const passwordGroup = this.createInput('password', 'Password', 'password', '••••••••');
    
        // === Submit button ===
        this.submitButton = document.createElement('button');
        this.submitButton.type = 'submit';
        this.submitButton.textContent = t('auth.login-btn') as string;
        this.submitButton.className = createButtonStyle("w-[360px] h-[54px] mb-4 mt-5", 'green');
    
        // === Build the form ===
        this.form.appendChild(usernameGroup);
        this.form.appendChild(passwordGroup);
        this.form.appendChild(this.submitButton);
    
        // === Google button container ===
        const googleButtonContainer = document.createElement('div');
        googleButtonContainer.id = 'google-login-button';
        googleButtonContainer.className = 'mt-4';
    
        // === Assemble login card ===
        this.loginCard.appendChild(registerLink);
        this.loginCard.appendChild(this.form);
        this.loginCard.appendChild(googleButtonContainer);
    
        // === OTP group (hidden initially) ===
        this.otpGroup = document.createElement('div');
        this.otpGroup.className = `flex flex-col items-center justify-center 
            bg-background-primary border-2 border-border-green 
            rounded-[16px] p-8 hidden`;
    
        const otpLabel = document.createElement('label');
        otpLabel.textContent = t("auth.enter2FA") as string;
        otpLabel.htmlFor = 'otp';
        otpLabel.className = 'text-lg font-nunito text-white';
    
        this.otpInput = document.createElement('input');
        this.otpInput.type = 'text';
        this.otpInput.id = 'otp';
        this.otpInput.placeholder = '123456';
        this.otpInput.className = 'w-[360px] h-[54px] px-4 rounded-[16px] bg-white text-background-primary text-opacity-60 font-mono focus:outline-none focus:border-border-green';
    
        this.otpSubmitButton = document.createElement('button');
        this.otpSubmitButton.type = 'button';
        this.otpSubmitButton.textContent = t("auth.verify") as string;
        this.otpSubmitButton.className = this.submitButton.className;
    
        this.otpResendButton = document.createElement('button');
        this.otpResendButton.type = 'button';
        this.otpResendButton.textContent = t("auth.resendOTP") as string;
        this.otpResendButton.className = this.submitButton.className + ' mt-2 bg-yellow hover:bg-button-active';
    
        this.otpGroup.appendChild(otpLabel);
        this.otpGroup.appendChild(this.otpInput);
        this.otpGroup.appendChild(this.otpSubmitButton);
        this.otpGroup.appendChild(this.otpResendButton);
    
        // === Message container ===
        this.messageContainer = document.createElement('div');
    
        // === Build page ===
        subContainer.appendChild(heading);
        subContainer.appendChild(this.loginCard);
        subContainer.appendChild(this.otpGroup);
        subContainer.appendChild(this.messageContainer);
        this.container.appendChild(subContainer);
    
        // === Attach event listeners ===
        this.attachEventListeners();
    
        // === Load Google login dynamically ===
        this.loadGoogleScript()
            .then(() => this.initGoogleLogin())
            .catch(err => console.error(err));
    
        return this.container;
    }

    // ------------------ Helper methods ------------------
    private createInput(id: string, labelText: string, type: string, placeholder: string): HTMLDivElement {
        const group = document.createElement('div');
        group.className = 'flex flex-col gap-2';

        const label = document.createElement('label');
        label.textContent = labelText;
        label.htmlFor = id;
        label.className = 'text-lg font-mono text-white';

        const input = document.createElement('input');
        input.type = type;
        input.id = id;
        input.name = id;
        input.placeholder = placeholder;
        input.className = 'w-[360px] h-[54px] px-4 rounded-[16px] bg-white text-background-primary text-opacity-60 font-mono focus:outline-none focus:border-border-green';

        group.appendChild(label);
        group.appendChild(input);

        return group;
    }

    private attachEventListeners() {
        this.form.addEventListener('submit', this.handleLogin.bind(this));
        this.otpSubmitButton.addEventListener('click', this.handle2FA.bind(this));
        this.otpResendButton.addEventListener('click', this.handleResendOTP.bind(this));
    }

    private async handleLogin(event: Event) {
        event.preventDefault();
        if (this.is2FAActive) return;

        const formData = new FormData(this.form);
        const userData: LoginData = {
            username: formData.get('username') as string,
            password: formData.get('password') as string
        };

        this.setLoadingState(true);
        try {
            const response = await apiServices.login(userData);
            const data = response?.data || response;

            if (data.twoFactorRequired) {
                this.currentUsername = userData.username;
                this.is2FAActive = true;

                // Hide the entire login card
                this.loginCard.classList.add('hidden');

                // Hide Google login button
                document.getElementById('google-login-button')?.classList.add('hidden');

                this.otpGroup.classList.remove('hidden');
                this.otpInput.value = '';
                this.otpInput.focus();

                this.showMessage(data.message || '2FA code sent', 'success');
                return;
            }

            if (response.success) {
                this.showMessage(response.message || 'Login successful', 'success');

                // Reset UI && Set user as logged-in
                AuthUtils.setLoggedIn({ username: userData.username });

                this.form.reset();
                this.loginCard.classList.remove('hidden');
                this.otpGroup.classList.add('hidden');
                this.is2FAActive = false;
                this.currentUsername = '';

                setTimeout(() => navigate("/profile"), 2000);

            } else {
                this.showMessage(response.message || 'Login failed', 'error');
            }
        } catch (err) {
            console.error(err);
            this.showMessage('API error', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    private async handle2FA() {
        const code = this.otpInput.value.trim();
        if (!code) return this.showMessage('Enter 2FA code', 'error');

        const payload: Login2FAData = {
            username: this.currentUsername,
            code
        };

        this.setLoadingState(true);
        try {
            const response = await apiServices.login2FA(payload);
            if (response.success) {
                this.showMessage(response.message || 'Login successful', 'success');
                AuthUtils.setLoggedIn({ username: payload.username });
                this.form.reset();
                setTimeout(() => navigate("/profile"), 2000);
            } else {
                this.showMessage(response.message || 'Login failed', 'error');
            }
        } catch (err) {
            console.error(err);
            this.showMessage('2FA verification failed', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    private async handleResendOTP() {
        if (!this.currentUsername) return this.showMessage('No user to resend OTP for', 'error');

        this.setLoadingState(true);
        try {
            const response = await apiServices.resendOTP({ username: this.currentUsername });
            if (response.success) {
                this.showMessage(response.message || 'OTP resent successfully', 'success');
                this.otpInput.value = '';
                this.otpInput.focus();
            } else {
                this.showMessage(response.message || 'Failed to resend OTP', 'error');
            }
        } catch (err) {
            console.error(err);
            this.showMessage('Resend OTP failed', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    private setLoadingState(loading: boolean): void {
        this.isLoading = loading;
        this.submitButton.disabled = loading;
        this.otpSubmitButton.disabled = loading;
        this.otpResendButton.disabled = loading;
        this.form.querySelectorAll('input').forEach(input => (input as HTMLInputElement).disabled = loading);
        this.submitButton.textContent = loading ? t("auth.loggingIn") : t("auth.login-btn");

        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            (input as HTMLInputElement).disabled = loading;
        });
    }
    
    private showMessage(message: string, type: 'success' | 'error'): void {
        this.messageContainer.style.display = 'block';
        const baseClass = `
            mt-6 px-4 py-3    
            w-[360px] h-[54px] px-4 rounded-[16px]
            text-white font-mono text-[20px]
            text-center          
            flex items-center justify-center 
            transition-opacity duration-300
        `;

        const typeClasses = type === 'error' 
            ? 'border-2 border-red-600 bg-red-900 bg-opacity-20' 
            : 'border-2 border-green-600 bg-green-900 bg-opacity-20';
        
        this.messageContainer.className = `${baseClass} ${typeClasses}`;
        this.messageContainer.textContent = message;
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.messageContainer.style.display = 'none';
            }, 5001);
        }
        // Scroll to top to show message
        this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    }

    // ------------------ Google Login ------------------
    private loadGoogleScript(): Promise<void> {
        return new Promise((resolve, reject) => {
            if ((window as any).google?.accounts?.id) return resolve();

            const script = document.createElement('script');
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("Failed to load Google Identity script"));
            document.head.appendChild(script);
        });
    }

    private initGoogleLogin() {
        if (!(window as any).google?.accounts?.id) return;

        (window as any).google.accounts.id.initialize({
            client_id: '664010514832-jrr53943l8tvr54pths5ugpnkfs9aim5.apps.googleusercontent.com', // chnage to ENV GOOGLE_CLIENT_ID
            callback: (response: any) => {
                const idToken = response.credential;
                if (!idToken) return this.showMessage('Google login failed', 'error');
                this.handleGoogleToken(idToken);
            }
        });

        (window as any).google.accounts.id.renderButton(
            document.getElementById('google-login-button')!,
            { theme: 'outline', size: 'large', width: 360 }
        );

        (window as any).google.accounts.id.prompt();
    }

    private async handleGoogleToken(idToken: string) {
        this.setLoadingState(true);
        try {
            const response = await apiServices.googleLogin({ idToken });
            if (response.success) {
                this.showMessage(response.data?.message || 'Login successful', 'success');
                AuthUtils.setLoggedIn({ username: response.data.username });
                this.form.reset();
                setTimeout(() => navigate("/profile"), 1500);
            } else {
                this.showMessage(response.data?.message || 'Login failed', 'error');
            }
        } catch (err) {
            console.error(err);
            this.showMessage('Google login failed', 'error');
        } finally {
            this.setLoadingState(false);
        }
    }
}
