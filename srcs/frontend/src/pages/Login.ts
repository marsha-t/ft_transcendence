import { IComponent } from "../components/IComponent";

export class Login implements IComponent {
    public render(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'login_page';

        // Heading stays above the card
        const heading = document.createElement('h2');
        heading.className = 'login_title';
        heading.textContent = 'Welcome Back!';

        
        // Card containing form and register link
        const loginCard = document.createElement('div');
        loginCard.className = 'login_block';

        // Register link
        const registerLink = document.createElement('p');
        registerLink.className = 'register_text';
        registerLink.innerHTML = 'Don\'t have an account? <a href="register">Register</a>';

        // Form
        const form = document.createElement('form');
        form.className = 'login_form';

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

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = 'Login';

        form.appendChild(emailGroup);
        form.appendChild(passwordGroup);
        form.appendChild(submitButton);

        
        // Append form and register link inside the card
        loginCard.appendChild(registerLink);
        loginCard.appendChild(form);

        // Append heading and card to main container
        container.appendChild(heading);
        container.appendChild(loginCard);

        return container;
    }
}
