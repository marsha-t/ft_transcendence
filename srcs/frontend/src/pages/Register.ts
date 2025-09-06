import { IComponent } from "../components/IComponent";

export class Register implements IComponent {
    public render(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'register_page'; 
        
        const heading = document.createElement('h2');
        heading.className = 'register_title';
        heading.textContent = 'Create an Account';
        container.appendChild(heading);
        
        const registerCard = document.createElement('div');
        registerCard.className = 'register_block';

        const form = document.createElement('form');
        form.className = 'register_form';
        
        const usernameGroup = document.createElement('div');
        const usernameLabel = document.createElement('label');
        usernameLabel.textContent = 'Username';
        usernameLabel.htmlFor = 'username';
        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.id = 'username';
        usernameInput.placeholder = 'Your Username';
        usernameGroup.appendChild(usernameLabel);
        usernameGroup.appendChild(usernameInput);

        const emailGroup = document.createElement('div');
        const emailLabel = document.createElement('label');
        emailLabel.textContent = 'Email';
        emailLabel.htmlFor = 'email';
        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.id = 'email';
        emailInput.placeholder = 'you@example.com';
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

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = 'Register';
        
        form.appendChild(usernameGroup);
        form.appendChild(emailGroup);
        form.appendChild(passwordGroup);
        form.appendChild(submitButton);

        const loginLink = document.createElement('p');
        loginLink.className = 'login_text'; 
        loginLink.innerHTML = 'Already have an account? <a href="login">Login</a>';
        
        registerCard.appendChild(form);
        registerCard.appendChild(loginLink);

        container.appendChild(registerCard);

        return container;
    }
}
