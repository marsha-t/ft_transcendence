import { IComponent } from "../../components/IComponent";

export class Login implements IComponent {
    public render(): HTMLElement {
        const container = document.createElement('div');
        const loginCard = document.createElement('div');
        const heading = document.createElement('h2');
        heading.textContent = 'Sign In';

        const form = document.createElement('form');
        const emailGroup = document.createElement('div');
        const emailLabel = document.createElement('label');
        emailLabel.textContent = 'Email or Username';
        emailLabel.htmlFor = 'email';
        const emailInput = document.createElement('input');
        emailInput.type = 'text';
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
        submitButton.textContent = 'Sign In';
        
        form.appendChild(emailGroup);
        form.appendChild(passwordGroup);
        form.appendChild(submitButton);

        const registerLink = document.createElement('p');
        registerLink.innerHTML = 'Don\'t have an account? <a href="#register">Sign up here</a>';
        
        loginCard.appendChild(heading);
        loginCard.appendChild(form);
        loginCard.appendChild(registerLink);

        container.appendChild(loginCard);

        return container;
    }
}
