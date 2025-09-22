import { apiServices } from '../services/auth/AuthServices.js';
export class Register {
    constructor() {
        this.isLoading = false;
    }
    render() {
        this.container = document.createElement('div');
        this.container.className = 'register_page';
        this.loadPageStyles();
        const heading = document.createElement('h2');
        heading.className = 'register_title';
        heading.textContent = 'Create an Account';
        this.container.appendChild(heading);
        this.messageContainer = document.createElement('div');
        this.messageContainer.className = 'message_container';
        this.messageContainer.style.display = 'none';
        this.container.appendChild(this.messageContainer);
        const registerCard = document.createElement('div');
        registerCard.className = 'register_block';
        this.form = document.createElement('form');
        this.form.className = 'register_form';
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
        this.submitButton = document.createElement('button');
        this.submitButton.type = 'submit';
        this.submitButton.textContent = 'Register';
        this.submitButton.className = 'register_button';
        this.form.appendChild(usernameGroup);
        this.form.appendChild(emailGroup);
        this.form.appendChild(passwordGroup);
        this.form.appendChild(this.submitButton);
        const loginLink = document.createElement('p');
        loginLink.className = 'login_text';
        loginLink.innerHTML = 'Already have an account? <a href="login">Login</a>';
        registerCard.appendChild(this.form);
        registerCard.appendChild(loginLink);
        this.container.appendChild(registerCard);
        this.attachEventListener();
        return this.container;
    }
    loadPageStyles() {
        if (document.getElementById('register-styles'))
            return;
        const link = document.createElement('link');
        link.id = 'register-styles';
        link.rel = 'stylesheet';
        link.href = '/styles/Register.css';
        document.head.appendChild(link);
    }
    attachEventListener() {
        this.form.addEventListener('submit', this.handleRegister.bind(this));
    }
    async handleRegister(event) {
        event.preventDefault();
        const formData = new FormData(this.form);
        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password')
        };
        this.setLoadingState(true);
        try {
            console.log('Sending registration data', userData);
            const response = await apiServices.register(userData);
            if (response.success) {
                this.showMessage(response.message || 'Registration successful!', 'success');
                this.form.reset();
                setTimeout(() => {
                    window.location.hash = '/login';
                }, 2000);
            }
            else {
                const statusCode = response.status;
                if (statusCode === 400) {
                    this.showMessage('Password is invalid or does not meet requirements.', 'error');
                }
                else if (statusCode === 409) {
                    this.showMessage('User already exists. Please choose a different username or email.', 'error');
                }
                else {
                    this.showMessage(response.message || 'Registration failed', 'error');
                }
            }
        }
        catch (error) {
            console.error('Registration error:', error);
            this.showMessage('Network error. Please check your connection and try again.', 'error');
        }
        finally {
            this.setLoadingState(false);
        }
    }
    showMessage(message, type) {
        this.messageContainer.style.display = 'block';
        this.messageContainer.className = `message_container ${type}`;
        this.messageContainer.textContent = message;
        if (type === 'success') {
            setTimeout(() => {
                this.messageContainer.style.display = 'none';
            }, 5001);
        }
        this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setLoadingState(loading) {
        this.isLoading = loading;
        this.submitButton.disabled = loading;
        this.submitButton.textContent = loading ? 'Creating Account...' : 'Register';
        const inputs = this.form.querySelectorAll('input');
        inputs.forEach(input => {
            input.disabled = loading;
        });
    }
    destroy() {
        if (this.form) {
            this.form.removeEventListener('submit', this.handleRegister.bind(this));
        }
    }
}
