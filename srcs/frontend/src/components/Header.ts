import { IComponent } from "./IComponent";

export class Header implements IComponent {
    
    public render(): HTMLElement {
        const header = document.createElement('header');
        header.className = `
            bg-background
            px-5 py-2.5 
            shadow-md
            `;

        const nav = document.createElement('nav');
        nav.className = `flex justify-between items-center  
            px-[20px]  ml-0 mr-[60px] `;

        // Logo
        const logo = document.createElement('a');
        logo.href = '/main';
        logo.className = `flex items-center gap-[6px] no-underline `;
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            history.pushState(null, '', '/main');
            window.dispatchEvent(new PopStateEvent('popstate'));
        })

        const logoText = document.createElement('span');
        logoText.className = logoText.className = `
            text-[24px] font-bold 
            text-[var(--color-secondary)]`;
        logoText.textContent = 'PONG';

        const logoIcon = document.createElement('img');
        logoIcon.src = '/assets/logo.png'; 
        logoIcon.alt = 'Pong Logo';
        logoIcon.className = 'w-[40px] h-[40px]';

        logo.appendChild(logoIcon);
        logo.appendChild(logoText);

        // Right-side navigation container
        const rightNav = document.createElement('div');
        rightNav.className = 'flex items-center gap-[32px]';

        const linksGroup = document.createElement('div');
        linksGroup.className = 'flex items-center gap-[24px]';

        const buttonsGroup = document.createElement('div');
        buttonsGroup.className = 'flex items-center gap-[24px]';

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
        
            // ✅ Apply Tailwind classes based on the button type
            if (link.text === 'Login') {
                a.className = `
                    w-[87px] h-[54px]
                    px-4 rounded-full 
                    text-[16px]
                    text-[var(--color-text)]
                    bg-[var(--color-background)]
                    border border-[0.2px] border-[var(--button-border-light)]
                    inline-flex justify-center items-center
                    no-underline cursor-pointer
                    transition-colors duration-200 ease-in-out
                    hover:bg-[var(--color-primary)]
                    hover:text-[var(--color-primary-dark)]
                `;
            } else if (link.text === 'Register') {
                a.className = `
                    w-[138px] h-[54px]
                    px-4 rounded-full 
                    text-[16px]
                    bg-[var(--color-text)]
                    text-color_white
                    border-0
                    inline-flex justify-center items-center
                    no-underline cursor-pointer
                    transition-colors duration-200 ease-in-out
                    hover:bg-[var(--color-primary-dark)]
                    hover:text-[var(--color-background)]
                `;
            } else {
                // Normal navigation links (Home, Creators, Profile)
                a.className = `
                    text-[var(--color-text)]
                    text-[16px]
                    no-underline hover:text-[var(--color-primary-dark)]
                    transition-colors duration-200 ease-in-out
                `;
            }
        
            // ✅ Add to the correct container
            (link.text === 'Login' || link.text === 'Register'
                ? buttonsGroup
                : linksGroup
            ).appendChild(a);
        });

        rightNav.appendChild(linksGroup);
        rightNav.appendChild(buttonsGroup);

        nav.appendChild(logo);
        nav.appendChild(rightNav);
        header.appendChild(nav);

        return header;
    }
}
