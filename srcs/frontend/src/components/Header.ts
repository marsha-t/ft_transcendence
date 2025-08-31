import { IComponent } from "./IComponent";

export class Header implements IComponent {
    
    public render(): HTMLElement {
        const header = document.createElement('header');
        header.className = 'header';

        const nav = document.createElement('nav');
        nav.className = 'navbar';

        // Logo
        const logo = document.createElement('a');
        logo.href = 'main';
        logo.className = 'logo';

        const logoText = document.createElement('span');
        logoText.className = 'logo_text';
        logoText.textContent = 'PONG';

        const logoIcon = document.createElement('img');
        logoIcon.src = '/assets/logo.png'; 
        logoIcon.alt = 'Pong Logo';
        logoIcon.className = 'logo_icon';

        logo.appendChild(logoIcon);
        logo.appendChild(logoText);

        // Right-side navigation container
        const rightNav = document.createElement('div');
        rightNav.className = 'nav_links';

        const linksGroup = document.createElement('div');
        linksGroup.className = 'nav_links_group';

        const buttonsGroup = document.createElement('div');
        buttonsGroup.className = 'nav_links_buttons';

        const links = [
            {text: 'Home', href: '/main', type: 'link'},
            {text: 'Creators', href: '/about', type: 'link'},
            {text: 'Login', href: '/login', type: 'button', className: 'login_btn'},
            {text: 'Register', href: '/register', type: 'button', className: 'register_btn'},
        ];

        links.forEach(link => {
            if (link.type === 'button') {
                const btn = document.createElement('button');
                btn.textContent = link.text;
                btn.className = link.className || '';
                btn.addEventListener('click', () => window.location.href = link.href);
                buttonsGroup.appendChild(btn);
            } else {
                const a = document.createElement('a');
                a.href = link.href;
                a.textContent = link.text;
                linksGroup.appendChild(a);
            }
        });

        rightNav.appendChild(linksGroup);
        rightNav.appendChild(buttonsGroup);

        nav.appendChild(logo);
        nav.appendChild(rightNav);
        header.appendChild(nav); // ← THIS WAS MISSING

        return header;
    }
}
