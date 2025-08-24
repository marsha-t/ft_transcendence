import { IComponent } from "./IComponent";

export class Header implements IComponent {
    public render(): HTMLElement {
        const header = document.createElement('header');
        const nav = document.createElement('nav');
        const logo = document.createElement('a');
        logo.href = '#main';
        logo.textContent = 'Transcendence';
        const navLinks = document.createElement('ul');

        const links = [
            { text: 'Main', href: '#main' },
            { text: 'About', href: '#about' },
            { text: 'Game', href: '#game' },
            { text: 'Login', href: '#login' },
            { text: 'Register', href: '#register' }
        ];

        links.forEach(link => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = link.text;
            li.appendChild(a);
            navLinks.appendChild(li);
        });

        nav.appendChild(logo);
        nav.appendChild(navLinks);
        header.appendChild(nav);

        return header;
    }
}
