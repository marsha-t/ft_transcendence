import { IComponent } from "../components/IComponent";
import { LoginData } from "../services/auth/types";

export class Login implements IComponent {
    private container!: HTMLElement;
    private messageContainer!: HTMLElement;
    private form!: HTMLFormElement;
    private submitButton!: HTMLButtonElement;
    private isLoading: boolean = false;
    
    public render(): HTMLElement {
        this.container = document.createElement('div');
        this.container.className = 'login_page';
        
        //Load css
        this.loadPageStyles();
        
        // Heading stays above the card
        const heading = document.createElement('h2');
        heading.className = 'login_title';
        heading.textContent = 'Welcome Back!';
        this.container.appendChild(heading);
        
        // Create message container for success/error messages
        this.messageContainer = document.createElement('div');
        this.messageContainer.className = 'message_container';
        this.messageContainer.style.display = 'none';
        this.container.appendChild(this.messageContainer);
                
        // Card containing form and register link
        const loginCard = document.createElement('div');
        loginCard.className = 'login_block';
        
        // Register link
        const registerLink = document.createElement('p');
        registerLink.className = 'register_text';
        registerLink.innerHTML = 'Don\'t have an account? <a href="register">Register</a>';
        
        // Form - Initialize the form property here
        this.form = document.createElement('form');
        this.form.className = 'login_form';
        
        const emailGroup = document.createElement('div');
        const emailLabel = document.createElement('label');
        emailLabel.textContent = 'Nickname';
        emailLabel.htmlFor = 'email';
        const emailInput = document.createElement('input');
        emailInput.type = 'text';
        emailInput.id = 'email';
        emailInput.placeholder = 'nickname';
        emailGroup.appendChild(emailLabel);
        emailGroup.appendChild(emailInput);
        
        const passwordGroup = document.createElement('div');
        const passwordLabel = document.createElement('label');
        passwordLabel.textContent = 'Password';
        passwordLabel.htmlFor = 'password';
        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.id = 'password';
        passwordInput.placeholder = '••••••••';
        passwordGroup.appendChild(passwordLabel);
        passwordGroup.appendChild(passwordInput);
        
        this.submitButton = document.createElement('button');
        this.submitButton.type = 'submit';
        this.submitButton.textContent = 'Login';
        this.submitButton.className = 'login_button';
        
        this.form.appendChild(emailGroup);
        this.form.appendChild(passwordGroup);
        this.form.appendChild(this.submitButton);
                
        // Append form and register link inside the card
        loginCard.appendChild(registerLink);
        loginCard.appendChild(this.form);
        
        // Append heading and card to main container        
        this.container.appendChild(loginCard);
        
        this.attachEventListener();
        
        return this.container;
    }
    
    private loadPageStyles(): void {
        if (document.getElementById('login-styles')) return;
                
        const link = document.createElement('link');
        link.id = 'login-styles';
        link.rel = 'stylesheet';
        link.href = '/styles/Login.css';
        document.head.appendChild(link);
    }
    
    private attachEventListener(): void { 
        this.form.addEventListener('submit', this.handleLogin.bind(this));
    }
    
    private async handleLogin(event: Event): Promise<void> {
        event.preventDefault();

        //here collecting data from user;
        const formData = new FormData(this.form);

        const userData: LoginData = {
            username: formData.get('username') as string,
            password: formData.get('password') as string
        };

        this.setLoadingState(true);
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
        console.log("here test");
    }
}