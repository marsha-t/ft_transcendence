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
        registerLink.innerHTML = 'Don\'t have an account? <a href="/register">Register</a>';
        
        // Form - Initialize the form property here
        this.form = document.createElement('form');
        this.form.className = 'login_form';
        
        // const emailGroup = document.createElement('div');
        const usernameGroup = document.createElement('div');
       
        const usernameLabel = document.createElement('label');
        usernameLabel.textContent = 'Username';
        usernameLabel.htmlFor = 'username';

        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.id = 'username';
        usernameInput.name = 'username';
        usernameInput.placeholder = 'username';
        usernameGroup.appendChild(usernameLabel);
        usernameGroup.appendChild(usernameInput);
        
        const passwordGroup = document.createElement('div');
        const passwordLabel = document.createElement('label');
        passwordLabel.textContent = 'Password';
        passwordLabel.htmlFor = 'password';
        
        //PAssword
        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.id = 'password';
        passwordInput.name = 'password'
        passwordInput.placeholder = '••••••••';
        passwordGroup.appendChild(passwordLabel);
        passwordGroup.appendChild(passwordInput);
        
        this.submitButton = document.createElement('button');
        this.submitButton.type = 'submit';
        this.submitButton.textContent = 'Login';
        this.submitButton.className = 'login_button';
        
        this.form.appendChild(usernameGroup);
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
                this.showMessage(response.message || ' Login!',  'success');

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
                this.showMessage(response.message || 'Login failed.ts: ', 'error');
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
        this.messageContainer.className = `message_container ${type}`;
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