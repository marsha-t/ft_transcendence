import { IComponent } from "./IComponent";

export class Header implements IComponent{
    
    public render(): HTMLElement {
        const header = document.createElement('header');
        header.className = 'header';

        const nav = document.createElement('nav');
        nav.className = 'navbar';

        //logo
        const logo = document.createElement('a');
        logo.href = 'main';
        logo.className = 'logo';

        //logo has two elements 1) text
        const logoText = document.createElement('a');
        logoText.className = 'logo_text';
        logoText.textContent = 'PONG';

        //logo icon
        const logoIcon = document.createElement('img');
        logoIcon.src = '/assets/logo.png'; 
        logoIcon.alt = 'Pong Logo';
        logoIcon.className = 'logo_icon';


        //Navigation links
        const navLinks = document.createElement('ul');
        navLinks.className = 'nav_links';

        const links = [
            {text: 'Home', href: '/main'},
            {text: 'Creators', href: '/about'},
            {text: 'Login', href: '/login'},
            {text: 'Register', href: '/register'},
        ];

        links.forEach(link => {
            const li = document.createElement('li');
            const a = document.createElement('a');

            a.href = link.href;
            a.textContent = link.text;
            li.appendChild(a);
            navLinks.appendChild(li);
        });

        logo.appendChild(logoIcon);
        logo.appendChild(logoText);

        nav.appendChild(logo);
        nav.appendChild(navLinks);
        header.appendChild(nav);
        return header;
    }
}
