import { IComponent } from "../components/IComponent";
import { apiServices } from "../services/ApiServices";
import { LoginData, Login2FAData } from "../services/auth/types";
import { navigate } from "../utils/commonUtils.js";
import { showMessage, createButtonStyle} from "../utils/uiUtils.js";
import { AuthUtils } from "../utils/authUtils.js";
import { t, translateApiError } from "../services/i18n/i18nService.js";

/*
- Render login UI (username/password)
- Handle authentication via backend API
- Handle optional 2FA (OTP) flow
- Handle Google OAuth login
- Manage loading and error states
- Navigate user after successful login

// Note:
    Try/Catch clauses are kept here not because AuthService throws error but to guard login transaction as a whole
    Login flow spans multiple UI updates and async operations that can fail independently of service layer. E.g., 
    - DOM access assumptions: elements may be missing or stale during rapid navigation/UI mode switches
    - Multiple async UI paths (eg, normal login, 2FA flow, resend OTP) which aren´t tied to Router lifecycle 
    Async operations may continue running after Router has unmounted this page
    Try/Catch provides safety net against crashes caused by async code running after unmount
*/
export class Login implements IComponent {
    private container!: HTMLElement;
    private loginCard!: HTMLElement;
    private messageContainer!: HTMLDivElement;
    private form!: HTMLFormElement;
    private submitButton!: HTMLButtonElement;
    private otpGroup!: HTMLDivElement;
    private otpInput!: HTMLInputElement;
    private otpSubmitButton!: HTMLButtonElement;
    private otpResendButton!: HTMLButtonElement;
    private is2FAActive: boolean = false;
    private currentUsername: string = '';
    private destroyed = false;

    public render(): HTMLElement {
        // Main container
        this.container = document.createElement('div');
        this.container.className = `flex justify-center bg-yellow
            h-full py-[23px]`;
    
        const subContainer = document.createElement('div');
        subContainer.className = `
            flex flex-col items-center justify-start
            bg-background-primary rounded-[16px] shadow-lg
            mx-[23px] w-[calc(100%-46px)]
            h-auto py-6 px-10`;
    
        // Heading
        const heading = document.createElement('h2');
        heading.className ='w-[596px] text-center mb-6 text-[28px] font-sans text-white';
        heading.textContent = t('auth.welcomeBack') as string;
        
        //Login card (form wrapper)
        this.loginCard = document.createElement('div');
        this.loginCard.className =
            `flex flex-col items-center justify-center 
             bg-background-primary border-2 border-border-green 
             rounded-[16px] p-8`;
    
        // Register link
        const registerLink = document.createElement('p');
        registerLink.className = 'font-nunito text-white text-left mb-4';
        registerLink.innerHTML = `
            ${t('auth.noAccount')}
            <a href="#"
            class="font-nunito text-green underline mt-4
            ml-40 hover:opacity-80">${t('auth.register-btn')}</a>`;
        const getLink = registerLink.querySelector('a') as HTMLAnchorElement;  
        getLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigate('/register');
        });
        
        // Form
        this.form = document.createElement('form');
        this.form.className =
            'flex flex-col gap-[26px] items-center w-full leading-normal';
    
        // Username & Password inputs
        const usernameGroup = this.createInput('username', 'USERNAME', 'text', 'username');
        const passwordGroup = this.createInput('password', 'Password', 'password', '••••••••');
    
        // Submit button
        this.submitButton = document.createElement('button');
        this.submitButton.type = 'submit';
        this.submitButton.textContent = t('auth.login-btn') as string;
        this.submitButton.className = createButtonStyle("w-[360px] h-[54px] mb-4 mt-5", 'green');
    
        // Build the form
        this.form.appendChild(usernameGroup);
        this.form.appendChild(passwordGroup);
        this.form.appendChild(this.submitButton);
    
        // Google button container
        const googleButtonContainer = document.createElement('div');
        googleButtonContainer.id = 'google-login-button';
        googleButtonContainer.className = 'mt-4';
    
        // Assemble login card 
        this.loginCard.appendChild(registerLink);
        this.loginCard.appendChild(this.form);
        this.loginCard.appendChild(googleButtonContainer);
    
        // OTP group (hidden initially)
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
        this.otpInput.className = `w-[360px] h-[54px] px-4 rounded-[16px] bg-white 
            text-background-primary text-opacity-60 font-mono focus:outline-none 
            focus:border-border-green`;
    
        this.otpSubmitButton = document.createElement('button');
        this.otpSubmitButton.type = 'button';
        this.otpSubmitButton.textContent = t("auth.verify") as string;
        this.otpSubmitButton.className = this.submitButton.className;
    
        this.otpResendButton = document.createElement('button');
        this.otpResendButton.type = 'button';
        this.otpResendButton.textContent = t("auth.resendOTP") as string;
        this.otpResendButton.className = this.submitButton.className + ' mt-2 hover:bg-button-active';
    
        this.otpGroup.appendChild(otpLabel);
        this.otpGroup.appendChild(this.otpInput);
        this.otpGroup.appendChild(this.otpSubmitButton);
        this.otpGroup.appendChild(this.otpResendButton);
    
        //  Message container
        this.messageContainer = document.createElement('div');
    
        // Build page 
        subContainer.appendChild(heading);
        subContainer.appendChild(this.loginCard);
        subContainer.appendChild(this.otpGroup);
        subContainer.appendChild(this.messageContainer);
        this.container.appendChild(subContainer);
    
        // Attach event listeners 
        this.attachEventListeners();
    
        // Load Google login dynamically
        this.loadGoogleScript()
            .then(() => this.initGoogleLogin())
            .catch(err => console.error(err));
    
        return this.container;
    }

    // Helper methods
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
        input.className = `w-[360px] h-[54px] px-4 rounded-[16px] bg-white 
            text-background-primary text-opacity-60 font-mono focus:outline-none 
            focus:border-border-green`;

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
            const response = await apiServices.auth.login(userData);
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
                await showMessage(this.container, this.messageContainer, t("auth.2FANeeded"), 'success');
                if (this.destroyed) return;
                return;
            }

            if (response.success) {
                await showMessage(this.container, this.messageContainer, t("auth.loginSuccess"), 'success');
                if (this.destroyed) return;

                // Reset UI && Set user as logged-in
                AuthUtils.setLoggedIn({ username: userData.username });

                this.form.reset();
                this.loginCard.classList.remove('hidden');
                this.otpGroup.classList.add('hidden');
                this.is2FAActive = false;
                this.currentUsername = '';

                navigate("/profile");

            } else {
                showMessage(this.container, this.messageContainer, translateApiError(response), 'error');
            }
        } catch (err) {
            console.error(err);
            showMessage(this.container, this.messageContainer, t("errors.GENERIC"), 'error');
    
        } finally {
            this.setLoadingState(false);
        }
    }

    private async handle2FA() {
        const code = this.otpInput.value.trim();
        if (!code) return showMessage(this.container, this.messageContainer, t("auth.enter2FA"), 'error');

        const payload: Login2FAData = {
            username: this.currentUsername,
            code
        };

        this.setLoadingState(true);
        try {
            const response = await apiServices.auth.login2FA(payload);
            if (response.success) {
                await showMessage(this.container, this.messageContainer, t("auth.loginSuccess"), 'success');
                if (this.destroyed) return;
                AuthUtils.setLoggedIn({ username: payload.username });
                this.form.reset();
                setTimeout(() => navigate("/profile"), 2000);
            } else {
                showMessage(this.container, this.messageContainer, translateApiError(response) || 'Login failed', 'error');
            }
        } catch (err) {
            console.error(err);
            showMessage(this.container, this.messageContainer, t("auth.2FAFailed"), 'error');
        } finally {
            this.setLoadingState(false);
        }
    }

    private async handleResendOTP() {

        if (!this.currentUsername) return showMessage(this.container, this.messageContainer, t("auth.2FANoUser"), 'error');

        this.setLoadingState(true);
        try {
            const response = await apiServices.auth.resendOTP({ username: this.currentUsername });
            if (response.success) {
                await showMessage(this.container, this.messageContainer, t("auth.2FAOTPResentSuccess"), 'success');
                if (this.destroyed) return;
                this.otpInput.value = '';
                this.otpInput.focus();
            } else {
                showMessage(this.container, this.messageContainer, translateApiError(response)  || 'Failed to resend OTP', 'error');
            }
        } catch (err) {
            console.error(err);
            showMessage(this.container, this.messageContainer, t("auth.2FAOTPResentFailed"), 'error');
    
        } finally {
            this.setLoadingState(false);
        }
    }

    // UI state management
    private setLoadingState(loading: boolean): void {
        this.submitButton.disabled = loading;
        this.otpSubmitButton.disabled = loading;
        this.otpResendButton.disabled = loading;
        this.form.querySelectorAll('input').forEach(input => (input as HTMLInputElement).disabled = loading);
        this.submitButton.textContent = loading ? t("auth.loggingIn") as string: t("auth.login-btn") as string;

        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            (input as HTMLInputElement).disabled = loading;
        });
    }
    
    // Google OAuth login
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
            callback: async (response: any) => {
                const idToken = response.credential;
                if (!idToken) return showMessage(this.container, this.messageContainer, t("auth.GoogleLoginFailed"), 'error');
        
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
            const response = await apiServices.auth.googleLogin({ idToken });
            if (response.success) {
                await showMessage(this.container, this.messageContainer, t("auth.loginSuccess"), 'success');
                if (this.destroyed) return;

                AuthUtils.setLoggedIn({ username: response.data.username });
                this.form.reset();
                setTimeout(() => navigate("/profile"), 1500);
            } else {
                showMessage(this.container, this.messageContainer, translateApiError(response) || 'Login failed', 'error');
        
            }
        } catch (err) {
            console.error(err);
            showMessage(this.container, this.messageContainer, t("auth.GoogleLoginFailed"), 'error');
    
        } finally {
            this.setLoadingState(false);
        }
    }
    public cleanup() {
        this.destroyed = true;
    }
}
