import { IComponent } from "../components/IComponent";
import { apiServices } from "../services/ApiServices";
import { showMessage } from "../utils/uiUtils";
import { RegisterData } from "../services/auth/types";
import { t } from "../services/i18n/i18nService.js";
import { navigate } from "../utils/commonUtils";

export class Register implements IComponent {
    private container!: HTMLElement;
    private form!: HTMLFormElement;
    private submitButton!: HTMLButtonElement;
    private messageContainer!: HTMLDivElement;
    private destroyed = false;
    /*
        - Render Registration page layout
            - Title
            - Registration form
            - Submit button
            - Link to Login page
    */
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
        const heading = document.createElement('h2');
        heading.className = `
            w-[596px] text-center mb-8 
            text-[28px] font-nunito text-white`;
        heading.textContent = t('auth.noAccount') as string;

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

        // Password field
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

        // Submit button 
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
        this.form.addEventListener('submit', this.handleRegister.bind(this));

        // Login link 
        const loginLink = document.createElement('p');
        loginLink.className =
            'font-nunito text-white text-left mt-2';
        loginLink.innerHTML = `
            ${t('auth.hasAccount')} 
            <a href="#"
            class="font-nunito text-green underline mt-4
            ml-40 hover:opacity-80">${t('auth.login-btn')}</a>`;
        const loginAnchor = loginLink.querySelector('a') as HTMLAnchorElement;
        loginAnchor.addEventListener('click', (event) => {
            event.preventDefault();
            navigate('/login');
        });

        // Message container (for success/error msg)
        this.messageContainer = document.createElement('div');
        this.messageContainer.className = 'none';
        
        this.form.appendChild(usernameGroup);
        this.form.appendChild(emailGroup);
        this.form.appendChild(passwordGroup);
        this.form.appendChild(this.submitButton);
        registerCard.appendChild(this.form);
        registerCard.appendChild(loginLink);
        subContainer.appendChild(heading);
        subContainer.appendChild(registerCard);
        subContainer.appendChild(this.messageContainer);
        this.container.appendChild(subContainer);

        return this.container;
    }

    // Handle registration when submit button is clicked
    /*
        - Retrieve form data
        - Set loading state while sending credentials to backend for registration
        - Redirect to login page after successful registration
            - After a 600ms delay, so user can see success message before redirect
    */
    private async handleRegister(event: Event): Promise<void>{
        event.preventDefault(); // Needed since input is set up as a form
            // Default form submission behaviour is form submission and reloaded page
        
        const formData = new FormData(this.form); // Built-in JS object to capture data from form elements
        const userData: RegisterData = {
            username: formData.get('username') as string,
            email: formData.get('email') as string,
            password: formData.get('password') as string
        };
        this.setLoadingState(true);
        const response = await apiServices.auth.register(userData);
        if(response.success){
            await showMessage(this.container, this.messageContainer, response.message, 'success');
            if (this.destroyed) return ; // prevent subsequent code from running if page unmounts while showing message
            this.form.reset();
            setTimeout(() => {
                if (this.destroyed) return ;
                navigate('/login');
            }, 600);
        } else {
            showMessage(this.container, this.messageContainer, response.message, 'error'); // Handle non-successful responses
        }
        this.setLoadingState(false);
    }
   

    // Set loading state for buttons and input
    /*
        When loading is true (submitting register data):
        - Disable submit button
        - Change text of submit button
        - Disable form input
     */
    private setLoadingState(loading: boolean): void {
        this.submitButton.disabled = loading;
        this.submitButton.textContent = loading ? t("auth.creatingAccount") as string : t("auth.register-btn") as string;
        const inputs = this.form.querySelectorAll('input'); 
        inputs.forEach(input => {
            (input as HTMLInputElement).disabled = loading;
            // querySelectorAll returns Nodelist of Element type
            // Need to cast to HTMLInputElement to access disabled
        });
    }
    
    // Flag to guard await showMessage from changing DOM after 
    public cleanup(): void {
        this.destroyed = true;
    }
}