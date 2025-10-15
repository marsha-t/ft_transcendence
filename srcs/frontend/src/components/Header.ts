import { IComponent } from "./IComponent";

export class Header implements IComponent {
    
    public render(): HTMLElement {
        // === HEADER ===
        const header = document.createElement('header');
        header.className = `bg-background px-5 py-2.5 shadow-md`;

        // === NAV CONTAINER ===
        const nav = document.createElement('nav');
        nav.className = `
            flex justify-between items-center  
            px-[20px] ml-0 mr-[60px]
        `;

        // === LOGO ===
        const logo = document.createElement('a');
        logo.href = '/main';
        logo.className = `flex items-center gap-[6px] no-underline`;
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            history.pushState(null, '', '/main');
            window.dispatchEvent(new PopStateEvent('popstate'));
        });

        const logoText = document.createElement('span');
        logoText.className = `
            text-[24px] font-press 
            text-color_white
        `;
        logoText.textContent = 'PONG';

        const logoIcon = document.createElement('img');
        logoIcon.src = '/assets/logo.png'; 
        logoIcon.alt = 'Pong Logo';
        logoIcon.className = 'w-[40px] h-[40px]';

        logo.appendChild(logoIcon);
        logo.appendChild(logoText);

        // === RIGHT NAVIGATION ===
        const rightNav = document.createElement('div');
        rightNav.className = 'flex items-center gap-[32px]';

        // === LINKS GROUP (Home, Creators, Profile) ===
        const linksGroup = document.createElement('div');
        linksGroup.className = 'flex items-center gap-[24px] font-pixel';

        // === BUTTONS GROUP (Login, Register) ===
        const buttonsGroup = document.createElement('div');
        buttonsGroup.className = 'flex items-center gap-[24px]';

        // === ALL LINKS ===
        const links = [
            {text: 'Home', href: '/main', type: 'link'},
            {text: 'Creators', href: '/creators', type: 'link'},
            {text: 'Profile', href: '/profile', type: 'link'},
            {text: 'Login', href: '/login', type: 'link', className: 'login_btn'},
            {text: 'Register', href: '/register', type: 'link', className: 'register_btn'},
        ];

        // === FUNCTION TO UPDATE ACTIVE LINK ===
        const updateActiveLink = () => {
            const currentPath = window.location.pathname;
            
            // Update all navigation links
            linksGroup.querySelectorAll('a').forEach(navLink => {
                const href = navLink.getAttribute('href');
                const baseClass = `
                    text-[14px]
                    font-pixel
                    no-underline
                    underline-offset-[3px]
                    transition-all duration-200
                    decoration-2
                `;
                
                if (href === currentPath) {
                    navLink.style.textDecoration = 'underline';
                    navLink.style.textDecorationColor = 'var(--color-yellow)';
                    navLink.className = `
                        ${baseClass}
                        text-color-yellow
                    `;
                } else {
                    navLink.style.textDecoration = 'none';
                    navLink.className = `
                        ${baseClass}
                        text-color_white
                        hover:underline
                        hover:text-color-yellow
                    `;
                }
            });
        };

        // === CREATE EACH LINK ===
        links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = link.text;

            if (link.text === 'Login') {
                // LOGIN BUTTON
                a.className = `
                    w-[138px] h-[48px]
                    px-4 rounded-4px
                    text-[16px] font-pixel
                    text-color_white
                    border border-[1px] border-border-green
                    inline-flex justify-center items-center
                    no-underline cursor-pointer
                    transition-colors duration-200 ease-in-out
                    hover:bg-color-green
                    hover:text-color_white
                `;
            } else if (link.text === 'Register') {
                // REGISTER BUTTON
                a.className = `
                    w-[87px] h-[54px]
                    px-4 rounded-full 
                    text-[16px] font-pixel
                    text-color_white
                    border border-[0.2px] border-[var(--button-border-light)]
                    inline-flex justify-center items-center
                    no-underline cursor-pointer
                    transition-colors duration-200 ease-in-out
                    hover:bg-[var(--color-primary)]
                    hover:text-[var(--color-primary-dark)]
                `;
            } else {
                // NORMAL NAVIGATION LINKS (Home, Creators, Profile)
                const currentPath = window.location.pathname;

                // Base Tailwind classes
                let baseClass = `
                    text-[14px]
                    font-pixel
                    no-underline
                    underline-offset-[3px]
                    transition-all duration-200
                    decoration-2
                `;

                // If the link's href matches the current page, make it active
                if (link.href === currentPath) {
                    a.className = `
                        ${baseClass}
                        text-color-yellow
                        underline
                    `;
                } else {
                    a.className = `
                        ${baseClass}
                        text-color_white
                        hover:underline
                        hover:text-color-yellow
                    `;
                }
            }


            // Append link to the correct group
            (link.text === 'Login' || link.text === 'Register'
                ? buttonsGroup
                : linksGroup
            ).appendChild(a);
        });

        // === COMBINE EVERYTHING ===
        rightNav.appendChild(linksGroup);
        rightNav.appendChild(buttonsGroup);

        nav.appendChild(logo);
        nav.appendChild(rightNav);
        header.appendChild(nav);

        // Listen for route changes and update active link
        const popstateHandler = () => {
            updateActiveLink();
        };
        window.addEventListener('popstate', popstateHandler);
        
        // Set initial active state
        updateActiveLink();

        // Store handler reference for cleanup (optional, but good practice)
        (header as any).__popstateHandler = popstateHandler;

        return header;
    }

}