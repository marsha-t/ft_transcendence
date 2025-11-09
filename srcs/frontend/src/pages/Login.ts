import { IComponent } from "../components/IComponent";
import { apiServices } from "../services/auth/AuthServices.js";
import { LoginData, Login2FAData } from "../services/auth/types";
import { navigate } from "../utils.js";

export class Login implements IComponent {
    private container!: HTMLElement;
    private messageContainer!: HTMLElement;
    private form!: HTMLFormElement;
    private submitButton!: HTMLButtonElement;
    private isLoading: boolean = false;

    // 2FA elements
    private otpGroup!: HTMLDivElement;
    private otpInput!: HTMLInputElement;
    private otpSubmitButton!: HTMLButtonElement;
    private is2FAActive: boolean = false;
    private currentUsername: string = '';

    public render(): HTMLElement {
        this.container = document.createElement('div');
        this.container.className = 'flex justify-center bg-color-yellow h-full py-[23px]';

        const subContainer = document.createElement('div');
        subContainer.className = 'flex flex-col items-center justify-start bg-background rounded-[16px] shadow-lg mx-[23px] w-[calc(100%-46px)] py-6 px-10';

        // Heading
        const heading = document.createElement('h2');
        heading.className = 'text-center mb-4 text-[18px] font-press text-color_white';
        heading.textContent = 'Welcome Back!';

        // Form
        this.form = document.createElement('form');
        this.form.className = 'flex flex-col gap-6 items-center w-full';

        // Username
        const usernameInput = this.createInput('username', 'USERNAME', 'text', 'username');
        this.form.appendChild(usernameInput);

        // Password
        const passwordInput = this.createInput('password', 'Password', 'password', '••••••••');
        this.form.appendChild(passwordInput);

        // Submit button
        this.submitButton = document.createElement('button');
        this.submitButton.type = 'submit';
        this.submitButton.textContent = 'Login';
        this.submitButton.className = 'w-[360px] h-[54px] px-4 rounded-[16px] text-color_white font-pixel cursor-pointer bg-color_button hover:bg-color-green hover:text-background transition-all';
        this.form.appendChild(this.submitButton);

        // OTP group (hidden initially)
        this.otpGroup = document.createElement('div');
        this.otpGroup.className = 'flex flex-col gap-2 mt-4 hidden';

        const otpLabel = document.createElement('label');
        otpLabel.textContent = 'Enter 2FA Code';
        otpLabel.htmlFor = 'otp';
        otpLabel.className = 'text-lg font-mono text-color_white';

        this.otpInput = document.createElement('input');
        this.otpInput.type = 'text';
        this.otpInput.id = 'otp';
        this.otpInput.placeholder = '123456';
        this.otpInput.className = 'w-[360px] h-[54px] px-4 rounded-[16px] bg-color_white text-background text-opacity-60 font-mono focus:outline-none focus:border-border-green';

        // OTP submit button
        this.otpSubmitButton = document.createElement('button');
        this.otpSubmitButton.type = 'button';
        this.otpSubmitButton.textContent = 'Verify';
        this.otpSubmitButton.className = this.submitButton.className;

        this.otpGroup.appendChild(otpLabel);
        this.otpGroup.appendChild(this.otpInput);
        this.otpGroup.appendChild(this.otpSubmitButton);

        // Message container
        this.messageContainer = document.createElement('div');

        // Build page
        subContainer.appendChild(heading);
        subContainer.appendChild(this.form);
        subContainer.appendChild(this.otpGroup);
        subContainer.appendChild(this.messageContainer);
        this.container.appendChild(subContainer);

        // Attach listeners
        this.attachEventListeners();

        return this.container;
    }

    private createInput(id: string, labelText: string, type: string, placeholder: string): HTMLDivElement {
        const group = document.createElement('div');
        group.className = 'flex flex-col gap-2';

        const label = document.createElement('label');
        label.textContent = labelText;
        label.htmlFor = id;
        label.className = 'text-lg font-mono text-color_white';

        const input = document.createElement('input');
        input.type = type;
        input.id = id;
        input.name = id;
        input.placeholder = placeholder;
        input.className = 'w-[360px] h-[54px] px-4 rounded-[16px] bg-color_white text-background text-opacity-60 font-mono focus:outline-none focus:border-border-green';

        group.appendChild(label);
        group.appendChild(input);

        return group;
    }

    private attachEventListeners() {
        this.form.addEventListener('submit', this.handleLogin.bind(this));
        this.otpSubmitButton.addEventListener('click', this.handle2FA.bind(this));
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
                // Store username and show OTP only
                this.currentUsername = userData.username;
                this.is2FAActive = true;

                this.form.querySelectorAll('input').forEach(input => input.closest('div')?.classList.add('hidden'));
                this.submitButton.classList.add('hidden');

                this.otpGroup.classList.remove('hidden');
                this.otpInput.value = '';
                this.otpInput.focus();

                this.showMessage(data.message || '2FA code sent', 'success');
                return;
            }

            if (response.success) {
                this.showMessage(response.message || 'Login successful', 'success');
                setTimeout(() => {
                    navigate("/profile");
                }, 2000);
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
            const data = response?.data || response;

            if (response.success) {
                this.showMessage(response.message || 'Login successful', 'success');
                setTimeout(() => {
                    navigate("/profile");
                }, 2000);
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

    private setLoadingState(loading: boolean) {
        this.isLoading = loading;
        this.submitButton.disabled = loading;
        this.otpSubmitButton.disabled = loading;
        this.form.querySelectorAll('input').forEach((input) => (input as HTMLInputElement).disabled = loading);
    }

    private showMessage(message: string, type: 'success' | 'error') {
        this.messageContainer.style.display = 'block';
        this.messageContainer.textContent = message;
        this.messageContainer.className = `mt-4 text-center ${type === 'success' ? 'text-green-500' : 'text-red-500'}`;
    }
}
