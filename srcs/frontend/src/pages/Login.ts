import { IComponent } from "../components/IComponent";
import { apiServices } from "../services/auth/AuthServices.js";
import { LoginData } from "../services/auth/types";

export class Login implements IComponent {
    private container!: HTMLElement;
    private messageContainer!: HTMLElement;
    private form!: HTMLFormElement;
    private submitButton!: HTMLButtonElement;
    private isLoading: boolean = false;

    public render(): HTMLElement {
        // === Main container ===
        this.container = document.createElement('div');
        this.container.className =
            'flex justify-center bg-background-yellow min-h-[85vh] py-[23px]';

    
        // === SUBcontainer ===
        const subContainer = document.createElement('div');
        subContainer.className = `
            flex flex-col items-center justify-start
            bg-background
            rounded-[16px]
            shadow-lg
            mx-[23px]
            w-[calc(100%-46px)]
            h-auto
            p-10
            `;

            
        // === Heading ===
        const heading = document.createElement('h2');
        heading.className =
            'w-[596px] text-center mb-4 text-[28px] font-press text-color_white';
        heading.textContent = 'Welcome Back!';
    
    
        // === Login card (form wrapper) ===
        const loginCard = document.createElement('div');
        loginCard.className =
            `flex flex-col items-center justify-center 
            bg-background border-2 border-border-green 
            rounded-[16px] p-8` ;
    
        // === Register link ===
        const registerLink = document.createElement('p');
        registerLink.className =
            'font-mono text-color_white text-left mb-4';
        registerLink.innerHTML = `
            Don't have an account?
            <a href="/register"
            class="font-mono text-color-green underline ml-40 hover:opacity-80">
            Register
            </a>`;
      
        // === Form ===
        this.form = document.createElement('form');
        this.form.className =
            'flex flex-col gap-[26px] items-center w-full leading-normal';
    
        // === Username group ===
        const usernameGroup = document.createElement('div');
        usernameGroup.className = 'flex flex-col gap-2';
    
        const usernameLabel = document.createElement('label');
        usernameLabel.className = 'text-lg font-mono text-color_white';
        usernameLabel.textContent = 'USERNAME';
        usernameLabel.htmlFor = 'username';
    
        const usernameInput = document.createElement('input');
        usernameInput.className = `
            w-[360px] h-[54px] px-4 rounded-[16px]
            bg-color_white text-background text-opacity-60 font-mono
            focus:text-opacity-100
            box-border placeholder:text-color-secondary 
            placeholder:font-mono placeholder:text-mono
            focus:outline-none focus:border-border-green 
            transition-colors`;
      
        usernameInput.type = 'text';
        usernameInput.id = 'username';
        usernameInput.name = 'username';
        usernameInput.placeholder = 'username';
    
        usernameGroup.appendChild(usernameLabel);
        usernameGroup.appendChild(usernameInput);
    
        // === Password group ===
        const passwordGroup = document.createElement('div');
        passwordGroup.className = 'flex flex-col gap-2';
    
        const passwordLabel = document.createElement('label');
        passwordLabel.className = 'text-lg font-mono text-color_white';
        passwordLabel.textContent = 'Password';
        passwordLabel.htmlFor = 'password';
    
        const passwordInput = document.createElement('input');
        passwordInput.className = `
            w-[360px] h-[54px] px-4 rounded-[16px]
            bg-color_white text-background text-opacity-60 font-mono
            focus:text-opacity-100
            box-border placeholder:text-color-secondary 
            placeholder:font-mono placeholder:text-mono
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
            w-[360px] h-[54px] px-4 rounded-[16px]
            text-color_white font-pixel
            cursor-pointer bg-color_button
            hover:bg-color-green hover:text-background
            hover:ring-2 hover:ring-border-green
            transition-all duration-300
            focus:outline-none
            disabled:opacity-50 disabled:cursor-not-allowed
            `;

        this.submitButton.type = 'submit';
        this.submitButton.textContent = 'Login';
    
        // === Message container ===
        this.messageContainer = document.createElement('div');
        this.messageContainer.className = 'none';


        // === Build the form ===
        this.form.appendChild(usernameGroup);
        this.form.appendChild(passwordGroup);
        this.form.appendChild(this.submitButton);
    
        // === Assemble card ===
        loginCard.appendChild(registerLink);
        loginCard.appendChild(this.form);
    
        // === Add to main container ===
        subContainer.appendChild(heading);
        subContainer.appendChild(loginCard);
        subContainer.appendChild(this.messageContainer);
    
        // === Add to main container ===
        this.container.appendChild(subContainer);

        this.attachEventListener();
        return this.container;
    }
    
    
    private attachEventListener(): void { 
        this.form.addEventListener('submit', this.handleLogin.bind(this));
    }
    
    private async handleLogin(event: Event): Promise<void> {
        event.preventDefault();

        //here collecting data from user form;
        const formData = new FormData(this.form);

        const userData: LoginData = {
            username: formData.get('username') as string,
            password: formData.get('password') as string
        };

        this.setLoadingState(true);

        //Here send data to API
        try{
            console.log("Here sending login data", userData);

            const response = await apiServices.login(userData);
            
            //recieved successfully 
            if(response.success){
                this.showMessage(response.message,  'success');

                this.form.reset(); //I need to clean th form after getting data
                
                //here i redirect login page to userprofile
                setTimeout(() => {
                    console.log("Current URL before navigation:", window.location.href);
                    console.log("Current pathname:", window.location.pathname);
                    console.log("Current hash:", window.location.hash);
                    
                    // Clear any existing hash first
                    if (window.location.hash) {
                        history.replaceState(null, '', window.location.pathname);
                    }
                    
                    // Navigate to main
                    history.pushState(null, '', '/main');
                    console.log("URL after pushState:", window.location.href);
                    
                    // Trigger router update
                    window.dispatchEvent(new PopStateEvent('popstate'));
                    
                    console.log("PopState event dispatched");
                }, 2000);
            } else {
                this.showMessage(response.message, 'error');
            }
        }catch(error: any){
            console.log('Login failed', error);

            let errorMessage = 'API error, check your connections';
            if (error.response && error.response.data && error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            this.showMessage(errorMessage, 'error');
        }finally {
            this.setLoadingState(false);
        }
        
    }
    
    private setLoadingState(loading: boolean): void {
        this.isLoading = loading;
        this.submitButton.disabled = loading;
        this.submitButton.textContent = loading ? 'Login account' : 'Login';

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
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.messageContainer.style.display = 'none';
            }, 5001);
        }
        // Scroll to top to show message
        this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    }
}