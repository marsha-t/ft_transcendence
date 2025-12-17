import { IComponent } from "../components/IComponent";
import { apiServices } from '../services/auth/AuthServices.js';
import { RegisterData } from "../services/auth/types";
import { t } from "../services/i18n/i18nService.js";

export class Register implements IComponent {
    private container!: HTMLElement;
    private form!: HTMLFormElement;
    private submitButton!: HTMLButtonElement;
    private messageContainer!: HTMLDivElement;
    private isLoading: boolean = false;

    public render(): HTMLElement {
        this.container = document.createElement('div');
        this.container.className = `
        flex justify-center bg-color-yellow
        h-full py-[23px]`;

        const subContainer = document.createElement('div');
        subContainer.className = `
            flex flex-col items-center justify-start
            bg-background-primary rounded-[16px] shadow-lg
            mx-[23px] w-[calc(100%-46px)]
            h-auto py-6 px-10`;

        // Heading stays above the card
        const heading = document.createElement('h2');
        heading.className = `
            w-[596px] text-center mb-8 
            text-[28px] font-nunito text-white`;
        heading.textContent = t('auth.noAccount') as string;

        // === Login card (form wrapper) ===
        const registerCard = document.createElement('div');
        registerCard.className =
            `flex flex-col items-center justify-center 
            bg-background-primary border-2 border-border-green 
            rounded-[16px] p-8` ;
    


        this.form = document.createElement('form');
        this.form.className = `
            flex flex-col gap-[16px] 
            items-center w-full leading-normal`;

        // Username field
        const usernameGroup = document.createElement('div');
        usernameGroup.className = 'flex flex-col gap-2';

        const usernameLabel = document.createElement('label');
        usernameLabel.className = 'text-lg font-nunito text-white';
        usernameLabel.textContent = t('auth.username') as string;
        usernameLabel.htmlFor = 'username';

        const usernameInput = document.createElement('input');
        usernameInput.className = `
            w-[360px] h-[54px] px-4 rounded-[16px]
            bg-white text-background-primary text-opacity-60 font-nunito
            focus:text-opacity-100
            box-border placeholder:text-color-secondary 
            placeholder:font-nunito placeholder:text-mono
            focus:outline-none focus:border-border-green 
            transition-colors`;
        usernameInput.type = 'text';
        usernameInput.id = 'username';
        usernameInput.name = 'username';
        usernameInput.placeholder = t('auth.yourUsername') as string;
        usernameInput.required = true;

        usernameGroup.appendChild(usernameLabel);
        usernameGroup.appendChild(usernameInput);

        // Email field
        const emailGroup = document.createElement('div');
        emailGroup.className = 'flex flex-col gap-2';

        const emailLabel = document.createElement('label');
        emailLabel.className = 'text-lg font-nunito text-white';
        emailLabel.textContent = t('auth.email') as string;
        emailLabel.htmlFor = 'email';

        const emailInput = document.createElement('input');
        emailInput.className = `
            w-[360px] h-[54px] px-4 rounded-[16px]
            bg-white text-background-primary text-opacity-60 font-nunito
            focus:text-opacity-100
            box-border placeholder:text-color-secondary 
            placeholder:font-nunito placeholder:text-mono
            focus:outline-none focus:border-border-green 
            transition-colors`;
        emailInput.type = 'email';
        emailInput.id = 'email';
        emailInput.name = 'email';
        emailInput.placeholder = 'you@example.com';
        emailInput.required = true;
        emailGroup.appendChild(emailLabel);
        emailGroup.appendChild(emailInput);

        // === Password group ===
        const passwordGroup = document.createElement('div');
        passwordGroup.className = 'flex flex-col gap-2';
    
        const passwordLabel = document.createElement('label');
        passwordLabel.className = 'text-lg font-nunito text-white';
        passwordLabel.textContent = t('auth.password') as string;
        passwordLabel.htmlFor = 'password';
    
        const passwordInput = document.createElement('input');
        passwordInput.className = `
            w-[360px] h-[54px] px-4 rounded-[16px]
            bg-white text-background-primary text-opacity-60 font-nunito
            focus:text-opacity-100
            box-border placeholder:text-color-secondary 
            placeholder:font-nunito placeholder:text-nunito
            focus:outline-none focus:border-border-green 
            transition-colors`;
        passwordInput.type = 'password';
        passwordInput.id = 'password';
        passwordInput.name = 'password';
        passwordInput.placeholder = '••••••••';
    
        passwordGroup.appendChild(passwordLabel);
        passwordGroup.appendChild(passwordInput);

        // === Submit button ===
        this.submitButton = document.createElement('button');
        this.submitButton.className = `
               w-[360px] h-[54px]
            inline-flex items-center justify-center
            px-8 py-3
            bg-[var(--color-button-active)]
            text-[var(--color-button-text)]
            font-bold tracking-widest
            rounded-lg
            no-underline text-center
            shadow-[0_5px_0_var(--color-button-shadow)]
            hover:shadow-[0_2px_0_var(--color-button-shadow)]
            active:shadow-none
            hover:translate-y-1
            active:translate-y-2
            transition-all duration-150
            mb-4 mt-5
        `;

        this.submitButton.type = 'submit';
        this.submitButton.textContent = t('auth.register-btn') as string;

        // === Register link ===
        const loginLink = document.createElement('p');
        loginLink.className =
            'font-nunito text-white text-left mt-2';
            loginLink.innerHTML = `
            Already have an account? 
            <a href="/login"
            class="font-nunito text-green underline mt-4
            ml-40 hover:opacity-80">Login</a>`;

        // === Message container ===
        this.messageContainer = document.createElement('div');
        this.messageContainer.className = 'none';
        
        // === Build the form ===
        this.form.appendChild(usernameGroup);
        this.form.appendChild(emailGroup);
        this.form.appendChild(passwordGroup);
        this.form.appendChild(this.submitButton);

        // === Assemble card ===
        registerCard.appendChild(this.form);
        registerCard.appendChild(loginLink);

        // === Add to main container ===
        subContainer.appendChild(heading);
        subContainer.appendChild(registerCard);
        subContainer.appendChild(this.messageContainer);

        // === Add to main container ===
        this.container.appendChild(subContainer);

        this.attachEventListener();
        return this.container;
    }

    private attachEventListener(): void{
        this.form.addEventListener('submit', this.handleRegister.bind(this));
    }
    private async handleRegister(event: Event): Promise<void>{
        event.preventDefault();
        
        //Get form data
        const formData = new FormData(this.form);
        const userData: RegisterData = {
            username: formData.get('username') as string,
            email: formData.get('email') as string,
            password: formData.get('password') as string
        };
        //set loading state
        this.setLoadingState(true);
        //send data to API
        try{
            const response = await apiServices.register(userData);
            if(response.success){
                this.showMessage(response.message, 'success');
                
                this.form.reset();// Clear form

                // Redirect to login page after successful registration
                setTimeout(() => {

                    console.log("Current URL before navigation:", window.location.href);
                    console.log("Current pathname:", window.location.pathname);
                    console.log("Current hash:", window.location.hash);
                    
                    //i need to check and clear the path first
                    if(window.location.hash)
                        history.replaceState(null, '', window.location.pathname);
                    
                    //then navigate to destination
                    history.pushState(null, '', '/login');
                    // Trigger router update
                    window.dispatchEvent(new PopStateEvent('popstate'));

                    console.log("PopState event dispatched");

                }, 2000);
            } else{
                    this.showMessage(response.message, 'error');
            }
    } catch (error: any){
            // console.error('Registration error:', error);
            // this.showMessage('Network error. Please check your connection and try again.', 'error');
            console.error('Registration error:', error);
            // Try to extract message from error response
            let errorMessage = 'Network error. Please check your connection and try again.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            this.showMessage(errorMessage, 'error');
        } finally {
                this.setLoadingState(false);
            }
    }
   
    private showMessage(message: string, type: 'success' | 'error'): void {
        this.messageContainer.style.display = 'block';
        const baseClass = `
            mt-6 px-4 py-3    
            w-[360px] h-[54px] px-4 rounded-[16px]
            text-white font-nunito text-[20px]
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

    private setLoadingState(loading: boolean): void {
        this.isLoading = loading;
        this.submitButton.disabled = loading;
        this.submitButton.textContent = loading ? t("auth.creatingAccount") as string : t("auth.register-btn") as string;
        // Optionally disable form inputs during loading
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            (input as HTMLInputElement).disabled = loading;
        });
    }
    // Optional: Clean up method if needed
    // public destroy(): void {
    //     // Remove event listeners if component is destroyed
    //     if (this.form) {
    //         this.form.removeEventListener('submit', this.handleRegister.bind(this));
    //     }
    // }
}