export class Login {
    render() {
        const container = document.createElement('div');
        container.className = 'login_page';
        this.loadPageStyles();
        const heading = document.createElement('h2');
        heading.className = 'login_title';
        heading.textContent = 'Welcome Back!';
        const loginCard = document.createElement('div');
        loginCard.className = 'login_block';
        const registerLink = document.createElement('p');
        registerLink.className = 'register_text';
        registerLink.innerHTML = 'Don\'t have an account? <a href="register">Register</a>';
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
        loginCard.appendChild(registerLink);
        loginCard.appendChild(form);
        container.appendChild(heading);
        container.appendChild(loginCard);
        return container;
    }
    loadPageStyles() {
        if (document.getElementById('login-styles'))
            return;
        const link = document.createElement('link');
        link.id = 'login-styles';
        link.rel = 'stylesheet';
        link.href = '/styles/Login.css';
        document.head.appendChild(link);
    }
}
