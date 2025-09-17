import { IComponent } from "./IComponent";

export class Header implements IComponent {
    
    public render(): HTMLElement {
        const header = document.createElement('header');
        header.className = 'header';

        const nav = document.createElement('nav');
        nav.className = 'navbar';

        // Logo
        const logo = document.createElement('a');
        logo.href = '/main';
        logo.className = 'logo';
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            history.pushState(null, '', '/main');
            window.dispatchEvent(new PopStateEvent('popstate'));
        })

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
            {text: 'Creators', href: '/creators', type: 'link'},
            {text: 'Profile', href: '/profile', type: 'link'},
            {text: 'Login', href: '/login', type: 'link', className: 'login_btn'},
            {text: 'Register', href: '/register', type: 'link', className: 'register_btn'},
        ];

        links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = link.text;
            a.className = link.className || '';
            (link.type === 'link' ? linksGroup : buttonsGroup).appendChild(a);
        });

        rightNav.appendChild(linksGroup);
        rightNav.appendChild(buttonsGroup);

        nav.appendChild(logo);
        nav.appendChild(rightNav);
        header.appendChild(nav);

        return header;
    }
}
