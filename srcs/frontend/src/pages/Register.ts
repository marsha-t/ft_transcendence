import { IComponent } from "../components/IComponent";
import { apiServices, RegisterData } from "../services/ApiServices.js";

export class Register implements IComponent {

    private container!: HTMLElement;
    private form!: HTMLFormElement;
    private submitButton!: HTMLButtonElement;
    private messageContainer!: HTMLDivElement;
    private isLoading: boolean = false;

    public render(): HTMLElement {
        this.container = document.createElement('div');
        this.container.className = 'register_page'; 
        
        const heading = document.createElement('h2');
        heading.className = 'register_title';
        heading.textContent = 'Create an Account';
        this.container.appendChild(heading);
        
        // Create message container for success/error messages
        this.messageContainer = document.createElement('div');
        this.messageContainer.className = 'message_container';
        this.messageContainer.style.display = 'none';
        this.container.appendChild(this.messageContainer);


        const registerCard = document.createElement('div');
        registerCard.className = 'register_block';

        this.form = document.createElement('form');
        this.form.className = 'register_form';
        
        // Username field
        const usernameGroup = document.createElement('div');
        const usernameLabel = document.createElement('label');
        usernameLabel.textContent = 'Username';
        usernameLabel.htmlFor = 'username';

        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.id = 'username';
        usernameInput.name = 'username';
        usernameInput.placeholder = 'Your Username';
        usernameInput.required = true;
        usernameGroup.appendChild(usernameLabel);
        usernameGroup.appendChild(usernameInput);

        // Email field
        const emailGroup = document.createElement('div');
        const emailLabel = document.createElement('label');
        emailLabel.textContent = 'Email';
        emailLabel.htmlFor = 'email';
        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.id = 'email';
        emailInput.name = 'email';
        emailInput.placeholder = 'you@example.com';
        emailInput.required = true;
        emailGroup.appendChild(emailLabel);
        emailGroup.appendChild(emailInput);

        // Password field
        const passwordGroup = document.createElement('div');
        const passwordLabel = document.createElement('label');
        passwordLabel.textContent = 'Password';
        passwordLabel.htmlFor = 'password';
        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.id = 'password';
        passwordInput.name = 'password';
        passwordInput.placeholder = '••••••••';
        passwordInput.minLength = 6;
        passwordInput.required = true;
        passwordGroup.appendChild(passwordLabel);
        passwordGroup.appendChild(passwordInput);

        // Submit button
        this.submitButton = document.createElement('button');
        this.submitButton.type = 'submit';
        this.submitButton.textContent = 'Register';
        this.submitButton.className = 'register_button';
        
        this.form.appendChild(usernameGroup);
        this.form.appendChild(emailGroup);
        this.form.appendChild(passwordGroup);
        this.form.appendChild(this.submitButton);

        // Login link
        const loginLink = document.createElement('p');
        loginLink.className = 'login_text'; 
        loginLink.innerHTML = 'Already have an account? <a href="login">Login</a>';
        
        registerCard.appendChild(this.form);
        registerCard.appendChild(loginLink);

        this.container.appendChild(registerCard);

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

        // Client-side validation
        // const validationError = this.validateForm(userData);
        // if(validationError){
        //     this.showMessage(validationError, 'error');
        //     return;
        // }

        //set loading state
        this.setLoadingState(true);
        try{
            console.log('Sending registration data', userData);
            const response = await apiServices.register(userData);

            if(response.success){
                this.showMessage(response.message || 'Registration successful!', 'success');

                this.form.reset();// Clear form

                // Redirect to login page after successful registration
                setTimeout(() => {
                    // You can use your router here instead
                    window.location.hash = 'login';
                    // or if you have a router: this.router.navigate('/login');
                }, 2000);
            } else{
                const errorMessage = response.errors && response.errors.length > 0
                        ? response.errors.join(', ')
                        : response.message || 'Registration failed';
                
                this.showMessage(errorMessage, 'error');
            }
        } catch (error){
            console.error('Registration error:', error);
            this.showMessage('Network error. Please check your connection and try again.', 'error');
            } finally {
            // Reset loading state
            this.setLoadingState(false);
            }
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

    private setLoadingState(loading: boolean): void {
        this.isLoading = loading;
        this.submitButton.disabled = loading;
        this.submitButton.textContent = loading ? 'Creating Account...' : 'Register';
        
        // Optionally disable form inputs during loading
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            (input as HTMLInputElement).disabled = loading;
        });
    }

    // Optional: Clean up method if needed
    public destroy(): void {
        // Remove event listeners if component is destroyed
        if (this.form) {
            this.form.removeEventListener('submit', this.handleRegister.bind(this));
        }
    }
}
