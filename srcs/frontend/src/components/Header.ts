import { IComponent } from "../components/IComponent";
import { AuthUtils } from "../utils/authUtils.js"; // Import auth utility
import { createButtonStyle } from "../utils";
import { ProfileServices } from "../services/profile/ProfileServices.js";
import { AuthServices } from "../services/auth/AuthServices.js";
import { apiServices } from "../services/ApiServices";
import { t, changeLanguage, getCurrentLanguage, SUPPORTED_LANGUAGES } from "../services/i18n/i18nService.js";

export class Header implements IComponent {
    private buttonsGroup!: HTMLElement;
    private linksGroup!: HTMLElement;
    private languageSwitcher!: HTMLElement;

    constructor() {
        // Listen for language changes and re-render
        window.addEventListener('languageChanged', () => {
            this.updateContent();
        });
    }
    public render(): HTMLElement {
        const header = document.createElement('header');
        header.className = `bg-yellow pb-3`;

        const subHeader = document.createElement('div');
        subHeader.className = `bg-background-primary py-6 rounded-[16px]
            shadow-[0_4px_4px_rgba(0,0,0,0.50)]`;

        const nav = this.createNav();
        subHeader.appendChild(nav);
        header.appendChild(subHeader);

        return header;
    }

    private createNav(): HTMLElement {
        const nav = document.createElement('nav');
        nav.className = `flex justify-between items-center px-[20px] ml-0 mr-[60px]`;

        const logo = this.createLogo();
        const rightNav = this.createRightNav();

        nav.appendChild(logo);
        nav.appendChild(rightNav);

        return nav;
    }

    private createLogo(): HTMLElement {
        const logo = document.createElement('a');
        logo.href = '/main';
        logo.className = `flex items-center gap-[6px] no-underline`;
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            history.pushState(null, '', '/main');
            window.dispatchEvent(new PopStateEvent('popstate'));
        });

        const logoText = document.createElement('span');
        logoText.className = `text-[24px] font-press text-white`;
        logoText.textContent = 'PONG';

        const logoIcon = document.createElement('img');
        logoIcon.src = '/logo.png'; 
        logoIcon.alt = 'Pong Logo';
        logoIcon.className = 'w-[40px] h-[40px]';

        logo.appendChild(logoIcon);
        logo.appendChild(logoText);

        return logo;
    }

    private createRightNav(): HTMLElement {
        const rightNav = document.createElement('div');
        rightNav.className = 'flex items-center gap-[32px] w-[800px] h-[45px]';

        this.linksGroup = document.createElement('div');
        this.linksGroup.className = 'flex items-center gap-[24px] w-[158px] h-[18px] font-pixel text-[800] text-[18px]';

        this.buttonsGroup = document.createElement('div');
        this.buttonsGroup.className = 'flex items-center gap-[17px] w-[500px] h-[42px] text-[900] text-[18px]';

        // Create language switcher
        this.languageSwitcher = this.createLanguageSwitcher();

        const links = [
            {text: t('header.home'), href: '/main', type: 'link'},
            {text: t('header.creators'), href: '/creators', type: 'link'},
        ];

        links.forEach(link => {
            const a = this.createLink(link as any);
            this.linksGroup.appendChild(a);
        });

        rightNav.appendChild(this.linksGroup);
        rightNav.appendChild(this.buttonsGroup);
        // Setup event listener BEFORE initial update
        window.addEventListener('authChange', async () => {
            await this.updateAuthButtons();
        });

        // Initial update - use setTimeout to ensure it runs after render
        setTimeout(() => {
            this.updateAuthButtons();
        }, 0);
        
        // Setup active link updating
        this.setupActiveLinks(this.linksGroup, this.buttonsGroup);

        return rightNav;
    }

    private attachLanguageSwitcherListeners(container: HTMLElement): void {
        const button = container.querySelector('.lang-button') as HTMLButtonElement;
        const dropdown = container.querySelector('.lang-dropdown') as HTMLElement;
    
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });
    
        document.addEventListener('click', () => {
            dropdown.classList.add('hidden');
        });
    
        container.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const selectedLang = (e.currentTarget as HTMLElement).dataset.lang!;
                changeLanguage(selectedLang);
                dropdown.classList.add('hidden');
            });
        });
    }
    

    private updateContent(): void {
        // Update links text
        const links = this.linksGroup.querySelectorAll('a');
        const linkKeys = ['header.home', 'header.creators'];
        links.forEach((link, index) => {
            link.textContent = String(t(linkKeys[index]));
        });

        // Update buttons
        this.updateAuthButtons();

        // Recreate language switcher with new translations
        const newSwitcher = this.createLanguageSwitcher();
        this.languageSwitcher.replaceWith(newSwitcher);
        this.languageSwitcher = newSwitcher;
    }

    private async updateAuthButtons(): Promise<void> {
        this.buttonsGroup.innerHTML = '';
        const isLoggedIn = AuthUtils.isLoggedIn();
    
        // Hide or show Profile link based on login status
        const profileLinkNav = this.linksGroup.querySelector('a[href="/profile"]') as HTMLElement;
        if (profileLinkNav) {
            profileLinkNav.style.display = isLoggedIn ? "inline-flex" : "none";
        }
    
        if (!isLoggedIn) {
            // Show Login & Register buttons
            const loginLink = this.createLink({ text: t('header.login') as string, href: '/login', type: 'button' });
            const registerLink = this.createLink({ text: t('header.register') as string, href: '/register', type: 'button' });
            this.buttonsGroup.appendChild(loginLink);
            this.buttonsGroup.appendChild(registerLink);
            this.buttonsGroup.appendChild(this.languageSwitcher);
            return;
        }
    
       // Logged in → Play button
        const playBtnWrapper = document.createElement('div');
        playBtnWrapper.className = 'relative inline-block';

        const playBtn = document.createElement('a');
        playBtn.textContent = t('header.play') as string;
        playBtn.href = '#';
        playBtn.className = createButtonStyle(` w-[110px] h-[42px]`, 'blue');


        playBtnWrapper.appendChild(playBtn);

        // Dropdown menu
        const dropdown: HTMLDivElement = document.createElement('div');
        dropdown.className = `
            absolute left-0 mt-[5px] w-[180px] rounded-lg bg-[none]
             shadow-lg z-50 hidden flex flex-col space-y-[10px]
        `;

        // Define dropdown items (with text + href)
        interface DropdownItem {
            label: string;
            href: string;
        }

        const dropdownItems: DropdownItem[] = [
            { label: t("header.play-AI"), href: '/ai' }, 
            { label: t("header.play-friend"), href: '/game' },
            { label: t("header.play-tournament"), href: '/tournament' },
        ];

        // Populate dropdown
        dropdownItems.forEach((item: DropdownItem): void => {
            const option: HTMLAnchorElement = document.createElement('a');
            option.href = item.href;
            option.textContent = item.label;
            option.className = createButtonStyle(" w-fit h-[32px] text-[18px]", 'green');
            option.addEventListener('click', (e: MouseEvent) => {
                e.preventDefault();
                history.pushState(null, '', item.href);
                window.dispatchEvent(new PopStateEvent('popstate'));
                dropdown.classList.add('hidden');
            });
            dropdown.appendChild(option);
        });

        playBtnWrapper.appendChild(dropdown);

        // Toggle dropdown on click
        playBtn.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.classList.toggle('hidden');
            if (!dropdown.classList.contains("hidden")) {
                playBtn.classList.add("bg-green");
            } else {
                playBtn.classList.remove("bg-green");
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!playBtnWrapper.contains(e.target as Node)) {
                dropdown.classList.add('hidden');
                playBtn.classList.remove("bg-green");
            }
        });

        this.buttonsGroup.appendChild(playBtnWrapper);

    
        const profileService = new ProfileServices();
    
        // Logout button
        const logoutBtn = document.createElement('a');
        logoutBtn.textContent = t('header.logout') as string;
        logoutBtn.href = '#';
        logoutBtn.className = createButtonStyle(` w-fit h-[42px]`, 'blue');
        logoutBtn.addEventListener("click", async () => {
            const confirmed = await AuthUtils.showConfirmation("Are you sure you want to logout?", "LOGOUT?", true);
            if (!confirmed) return;
    
            const res = await apiServices.auth.logout();
            if (res.success) {
                AuthUtils.setLoggedOut();
                history.pushState(null, '', '/main');
                window.dispatchEvent(new PopStateEvent('popstate'));
            } else {
                alert(res.message || "Logout failed");
            }
        });
        this.buttonsGroup.appendChild(logoutBtn);
    
        // Fetch user info and add avatar
        try {
            const authService = new AuthServices();
            const userInfo = await authService.getCurrentUser();
            
            let avatarUrl = "/uploads/avatars/default.png";
            if (userInfo.success && userInfo.data?.avatar) {
                avatarUrl = AuthUtils.getAvUrl(userInfo.data.avatar);
            }
            
            const avatarLink = document.createElement("a");
            avatarLink.href = "/profile";
            avatarLink.className = `
                w-[40px] h-[40px]
                rounded-full overflow-hidden
                border border-[3px] border-green
                inline-flex justify-center items-center cursor-pointer
            `;
            
            const avatarDiv = document.createElement("div");
            avatarDiv.className = "w-full h-full rounded-full bg-center bg-cover";
            avatarDiv.style.backgroundImage = `url('${avatarUrl}')`;
            
            avatarLink.appendChild(avatarDiv);
            
            avatarLink.addEventListener('click', (e) => {
                e.preventDefault();
                history.pushState(null, '', '/profile');
                window.dispatchEvent(new PopStateEvent('popstate'));
            });
            
            this.buttonsGroup.appendChild(avatarLink);
            // Recreate language switcher to ensure it has the latest icon format
            const newSwitcher = this.createLanguageSwitcher();
            this.languageSwitcher = newSwitcher;
            this.buttonsGroup.appendChild(this.languageSwitcher);

        } catch (error) {
            console.error("Error loading avatar:", error);
        }
    }
    

    private createLink(link: {text: string, href: string, type: string}): HTMLElement {
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.text;
        // Decide styling based on explicit `type`/`href`, not on localized text
        if (link.type === 'button') {
            if (link.href === '/register') {
                a.className = createButtonStyle('w-fit h-[42px] text-[16px]', 'blue');
            } else if (link.href === '/login') {
                a.className = createButtonStyle('w-fit h-[42px] text-[16px]', 'blue');
            } else {
                a.className = createButtonStyle('w-fit h-[42px] text-[16px]', 'blue');
            }
        } else {
            a.className = this.getNavLinkClasses(link.href);
        }
        if (link.type === 'link') {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                history.pushState(null, '', link.href);
                window.dispatchEvent(new PopStateEvent('popstate'));
            });
        }
        return a;
    }

    private getNavLinkClasses(href: string): string {
        const currentPath = window.location.pathname;
        const baseClass = `
            text-[14px] font-pixel no-underline whitespace-nowrap
            underline-offset-[3px] transition-all duration-200 decoration-2`;

        if (href === currentPath) {
            return `${baseClass} text-yellow underline`;
        } else {
            return `${baseClass} text-white hover:underline hover:text-yellow`;
        }
    }

    private setupActiveLinks(linksGroup: HTMLElement, buttonsGroup: HTMLElement): void {
        const updateActiveLink = () => {
            const currentPath = window.location.pathname;
            
            // Update header links
            linksGroup.querySelectorAll('a').forEach(navLink => {
                const href = navLink.getAttribute('href');
                const baseClass = `
                    text-[14px] font-pixel no-underline whitespace-nowrap
                    underline-offset-[3px] transition-all duration-200 decoration-2`;
                
                if (href === currentPath) {
                    navLink.style.textDecoration = 'underline';
                    navLink.style.textDecorationColor = 'var(yellow)';
                    navLink.className = `${baseClass} text-yellow`;
                } else {
                    navLink.style.textDecoration = 'none';
                    navLink.className = `${baseClass} text-white hover:underline hover:text-yellow`;
                }
            });

            // Update buttons
            buttonsGroup.querySelectorAll('a').forEach(btn => {
                this.updateButtonState(btn, currentPath);
            });
        };

        window.addEventListener('popstate', updateActiveLink);
        updateActiveLink();
    }

    private updateButtonState(btn: Element, currentPath: string): void {
        const href = btn.getAttribute('href');
        const isLogin = href === '/login';
        const isRegister = href === '/register';

        if (isLogin) {
            btn.className = this.getLoginButtonClasses(href === currentPath);
        }

        if (isRegister) {
            btn.className = this.getRegisterButtonClasses(href === currentPath);
        }
    }

    private getLoginButtonClasses(isActive: boolean): string {
        const baseClasses = `
            w-[138px] h-[36px] px-4 rounded-[8px] tracking-[0.4em]
            text-[16px] font-pixel text-white
            border border-[1px] border-green
            inline-flex justify-center items-center
            no-underline cursor-pointer transition-colors duration-200 ease-in-out`;
        
        return isActive ? `${baseClasses} bg-green`
            : `${baseClasses} hover:bg-green hover:text-white`;
    }

    private getRegisterButtonClasses(isActive: boolean): string {
        const baseClasses = `
            w-[188px] h-[36px] px-4 rounded-[8px] tracking-[0.4em]
            text-[16px] font-pixel text-white
            border border-[1px] border-green
            inline-flex justify-center items-center
            no-underline cursor-pointer transition-colors duration-200 ease-in-out`;
        
        return isActive ? `${baseClasses} bg-green`
        : `${baseClasses} hover:bg-green hover:text-white`;
    }
    
    private createLanguageSwitcher(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'relative inline-block';

        const currentLang = getCurrentLanguage();

        /* ---------- BUTTON (TOP) ---------- */
        const button = document.createElement('button');
        button.className = createButtonStyle('lang-button w-[50px] h-[42px] text-[20px] flex items-center justify-center', 'blue');
        button.setAttribute('aria-label', String(t('settings.selectLanguage')));

        // Simplified multi-language symbol using letters
        const langSymbol = document.createElement('span');
        langSymbol.textContent = 'Aあ'; // Letters representing multiple languages
        langSymbol.className = 'text-[18px] font-bold'; // Adjust size and style as needed

        // Add to button
        button.appendChild(langSymbol);

        /* ---------- DROPDOWN ---------- */
        const dropdown = document.createElement('div');
        dropdown.className =
            'lang-dropdown hidden absolute right-0 mt-2 w-48 bg-background rounded-lg shadow-xl border border-border-green z-50';

        Object.entries(SUPPORTED_LANGUAGES).forEach(([code, info]) => {
            const option = document.createElement('button');
            option.className =
                `lang-option w-full text-left px-4 py-3 hover:bg-color-green transition-colors ` +
                `flex items-center justify-between text-color_white font-pixel text-[14px] ` +
                (code === currentLang ? 'bg-color-green bg-opacity-30' : '');
            option.dataset.lang = code;

            const span = document.createElement('span');
            span.className = 'font-medium';
            span.textContent = info.nativeName;

            option.appendChild(span);

            // Checkmark if selected
            if (code === currentLang) {
                const check = document.createElement('span');
                check.textContent = '✔'; // Unicode checkmark
                check.className = 'text-color-yellow';
                option.appendChild(check);
            }

            dropdown.appendChild(option);
        });

        /* ---------- Assemble Container ---------- */
        container.appendChild(button);
        container.appendChild(dropdown);

        /* ---------- Attach Events ---------- */
        this.attachLanguageSwitcherListeners(container);

        return container;
    }
}
