import { IComponent } from "../components/IComponent";
import { AuthUtils } from "../utils/authUtils.js"; // Import auth utility
import { apiServices } from "../services/ApiServices";
import { createButtonStyle, applyAvatar, showConfirmation } from "../utils/uiUtils";
import { t, changeLanguage, getCurrentLanguage, SUPPORTED_LANGUAGES } from "../services/i18n/i18nService.js";
import { NavigationState } from "../utils/commonUtils";
import { navigate } from "../utils/commonUtils";

/*
    * - Display navigation links (Home, Creators)
    * - Show different buttons based on authentication state
         (Login/Register OR Play/Logout/Avatar)
    * - Handle SPA navigation using history.pushState
    * - React to global app events:
    *   - languageChanged → re-translate UI
    *   - authChange → update buttons
    *   - avatarChanged → update avatar immediately
*/ 
export class Header implements IComponent {
    private buttonsGroup!: HTMLElement; // Container for login/register OR play/logout/avatar
    private linksGroup!: HTMLElement; // Container for navigation links (home, creators)
    private languageSwitcher!: HTMLElement; // Language switcher UI element
    private static languageDocClickAttached: boolean = false;  // Static flag to avoid attaching multiple document click listeners

    constructor() {
        // Listen for language changes and re-render
        window.addEventListener('languageChanged', async () => { await this.updateContent(); });

        // Listen for avatar changes to update header immediately
        window.addEventListener('avatarChanged', (e: any) => {
        const avatarPath = e?.detail?.avatar;
        if (this.buttonsGroup)
        {
            const avatarDiv = this.buttonsGroup.querySelector('.header-avatar-link > div') as HTMLElement;
            if (avatarDiv) {
                applyAvatar(avatarDiv, avatarPath, "");
            }
        }
        });
    }

    // * Main render method required by IComponent.
    public render(): HTMLElement {
        const header = document.createElement('header');
        header.className = `bg-yellow pb-3`;

        const subHeader = document.createElement('div');
        subHeader.className = `bg-background-primary py-6 rounded-[16px]
            shadow-[0_4px_4px_rgba(0,0,0,0.50)]`;
        // Navigation bar
        const nav = document.createElement('nav');
        nav.className = `flex justify-between items-center px-[20px] ml-0`;
        // Left (logo) and right (links + buttons)
        const logo = this.createLogo();
        const rightNav = this.createRightNav();

        nav.appendChild(logo);
        nav.appendChild(rightNav);
        subHeader.appendChild(nav);
        header.appendChild(subHeader);

        return header;
    }

    // * Creates the clickable logo.
    private createLogo(): HTMLElement {
        const logo = document.createElement('a');
        logo.href = '/main';
        logo.className = `flex items-center gap-[6px] no-underline`;
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            navigate('/main');
        });

        const logoText = document.createElement('span');
        logoText.className = `text-[24px] font-sans text-white`;
        logoText.textContent = 'PONG';

        const logoIcon = document.createElement('img');
        logoIcon.src = '/logo.png'; 
        logoIcon.alt = 'Pong Logo';
        logoIcon.className = 'w-[40px] h-[40px]';

        logo.appendChild(logoIcon);
        logo.appendChild(logoText);

        return logo;
    }

     /**
     * Creates the right side of the header:
     * - Navigation links
     * - Buttons (auth dependent)
     * - Language switcher
     */
    private createRightNav(): HTMLElement {
        const rightNav = document.createElement('div');
        rightNav.className = 'flex items-center h-[45px]';

        // links and buttons containers
        this.linksGroup = document.createElement('div');
        this.linksGroup.className = 'flex items-center gap-[24px] w-[158px] h-[18px] font-nunito text-[800] text-[18px]';
        this.buttonsGroup = document.createElement('div');
        this.buttonsGroup.className = 'flex items-center gap-[17px] w-[500px] h-[42px] text-[900] text-[18px]';

        // Create language switcher
        this.languageSwitcher = this.createLanguageSwitcher();

        // Populate navigation links
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
        // Setup event listener BEFORE initial update - Listen for authentication changes ( login/logout from anywhere in the app)
        window.addEventListener('authChange', async () => { await this.updateAuthButtons(); });

        // Initial update - use setTimeout to ensure it runs after render
        setTimeout(() => {
            this.updateAuthButtons();
        }, 0);

        return rightNav;
    }

    //  * Updates translated content when language changes.
    private async updateContent(): Promise<void> {
        // Update links text
        const links = this.linksGroup.querySelectorAll('a');
        const linkKeys = ['header.home', 'header.creators'];
        links.forEach((link, index) => {
            link.textContent = String(t(linkKeys[index]));
        });

        // Update buttons (wait for async update to finish to avoid race conditions)
        await this.updateAuthButtons();
    }

    //  * Updates the authentication-related buttons based on login state.
    private async updateAuthButtons(): Promise<void> {
        this.buttonsGroup.innerHTML = '';
        const isLoggedIn = AuthUtils.isLoggedIn();

        // Create a fresh language switcher instance for this render
        this.languageSwitcher = this.createLanguageSwitcher();
    
        // Hide or show Profile link based on login status
        const profileLinkNav = this.linksGroup.querySelector('a[href="/profile"]') as HTMLElement;
        if (profileLinkNav) {
            profileLinkNav.style.display = isLoggedIn ? "inline-flex" : "none";
        }
    
        if (!isLoggedIn) { // Show Login & Register buttons
            const loginLink = this.createLink({ text: t('header.login') as string, href: '/login', type: 'button' });
            const registerLink = this.createLink({ text: t('header.register') as string, href: '/register', type: 'button' });
            this.buttonsGroup.appendChild(loginLink);
            this.buttonsGroup.appendChild(registerLink);

            const existingLang = this.buttonsGroup.querySelector('.header-language-switcher');
            if (existingLang) existingLang.remove(); // avoid rerendering issues
            this.buttonsGroup.appendChild(this.languageSwitcher);
            return;
        }
    
        // Logged in → Play button + logout + avatar
        // Play button with dropdown
        const playBtnWrapper = document.createElement('div');
        playBtnWrapper.className = 'relative inline-block';

        const playBtn = document.createElement('div');
        playBtn.textContent = t('header.play') as string;
        playBtn.className = createButtonStyle(` w-[110px] h-[42px]`, 'blue');

        playBtnWrapper.appendChild(playBtn);
        // Dropdown items
        const dropdownItems: { label: string; href: string }[] = [
            { label: t("header.play-AI") as string, href: '/ai' }, 
            { label: t("header.play-friend") as string, href: '/game' },
            { label: t("header.play-tournament") as string, href: '/tournament' },
        ];
        // play Dropdown menu
        const dropdown = this.createDropdown(dropdownItems, playBtn);
        playBtnWrapper.appendChild(dropdown);
        
        this.buttonsGroup.appendChild(playBtnWrapper);
    
        // Logout button
        const logoutBtn = document.createElement('div');
        logoutBtn.textContent = t('header.logout') as string;
        logoutBtn.className = createButtonStyle(` w-fit h-[42px]`, 'blue');
        logoutBtn.addEventListener("click", async () => {
            const confirmed = await showConfirmation(t("auth.logoutConfirm") as string, t("auth.logout") as string, true);
            if (!confirmed) return;
            NavigationState.forceNavigate = true;
            if (NavigationState.activeGameSessionId) {
                await apiServices.game.abortGame(
                    NavigationState.activeGameSessionId
                ).catch(() => {});
            }
            if (NavigationState.activeTournamentId) {
                await apiServices.tournament.updateTournamentStatus(
                    NavigationState.activeTournamentId,
                    "ABORTED"
                ).catch(() => {});
            }
            const res = await apiServices.auth.logout();
            if (res.success) {
                AuthUtils.setLoggedOut();
                navigate('/main');
            } else {
                alert(res.message || "Logout failed");
            }
        });
        this.buttonsGroup.appendChild(logoutBtn);
    
        // Fetch user info and add avatar
        const userInfo = await apiServices.profile.getCurrentUser();
        
        const existingAvatar = this.buttonsGroup.querySelector('.header-avatar-link');
        if (existingAvatar) existingAvatar.remove();

        const avatarLink = this.createAvatarLink(userInfo.data || {});
        this.buttonsGroup.appendChild(avatarLink);
        // Append language switcher once (created at start of this method)
        this.buttonsGroup.appendChild(this.languageSwitcher);

    }
    
    // * Creates a link or button element based on type.
    private createLink(link: {text: string, href: string, type: string}): HTMLElement {
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.text;
        // Decide styling based on explicit `type`/`href`, not on localized text
        if (link.type === 'button') {
                a.className = createButtonStyle('w-fit h-[42px] text-[16px]', 'blue');
        } else {
            a.className = this.getNavLinkClasses(link.href);
        }
        a.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(link.href);
        });
        return a;
    }

    private createAvatarLink(user: { avatar?: string, username?: string }): HTMLElement {
        const avatarLink = document.createElement("a");
        avatarLink.href = "/profile";
        avatarLink.className = `header-avatar-link
            w-[40px] h-[40px]
            rounded-full overflow-hidden
            border border-[3px] border-green
            inline-flex justify-center items-center cursor-pointer`;

        const avatarDiv = document.createElement("div");
        avatarDiv.className = "w-full h-full rounded-full bg-center bg-cover";
        applyAvatar(avatarDiv, user.avatar, user.username);
        avatarLink.appendChild(avatarDiv);

        avatarLink.addEventListener('click', (e) => {
            e.preventDefault();
            navigate('/profile')
        });

        return avatarLink;
    }

    private createDropdown(items: {label: string, href: string}[], button: HTMLElement): HTMLElement {
        const dropdown = document.createElement('div');
        dropdown.className = `absolute left-0 mt-[5px] w-[180px] rounded-lg bg-[none] shadow-lg z-50 hidden flex flex-col space-y-[10px]`;

        items.forEach(item => {
            const option = document.createElement('a');
            option.href = item.href;
            option.textContent = item.label;
            option.className = createButtonStyle(" w-fit h-[32px] text-[18px] mt-5", 'green');
            option.addEventListener('click', (e) => {
                e.preventDefault();
                navigate(item.href);
                dropdown.classList.add('hidden');
            });
            dropdown.appendChild(option);
        });

        // Toggle dropdown visibility
        button.addEventListener('click', (e) => {
            e.preventDefault();
            dropdown.classList.toggle('hidden');
            button.classList.toggle('bg-green', !dropdown.classList.contains('hidden'));
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target as Node) && !button.contains(e.target as Node)) {
                dropdown.classList.add('hidden');
                button.classList.remove('bg-green');
            }
        });

        return dropdown;
    }


    // * Determines the CSS classes for navigation links based on active state.
    private getNavLinkClasses(href: string): string {
        const currentPath = window.location.pathname;
        const baseClass = `
            text-[14px] font-nunito no-underline whitespace-nowrap
            underline-offset-[3px] transition-all duration-200 decoration-2`;

        if (href === currentPath) {
            return `${baseClass} text-yellow underline`;
        } else {
            return `${baseClass} text-white hover:underline hover:text-yellow`;
        }
    }
    
    private createLanguageSwitcher(): HTMLElement {
        const container = document.createElement('div');
        container.className = 'relative inline-block header-language-switcher';

        const currentLang = getCurrentLanguage();

        /* ---------- BUTTON (TOP) ---------- */
        const button = document.createElement('button');
        button.className = createButtonStyle('lang-button w-[50px] h-[42px] text-[20px] flex items-center justify-center', 'blue');
        button.setAttribute('aria-label', String(t('settings.selectLanguage')));

        // Simplified multi-language symbol using letters
        const langSymbol = document.createElement('span');
        langSymbol.textContent = 'Aあ';
        langSymbol.className = 'text-[18px] font-bold';
        // Add to button
        button.appendChild(langSymbol);

        /* ---------- DROPDOWN ---------- */
        const dropdown = document.createElement('div');
        dropdown.className =
            'lang-dropdown hidden absolute right-0 mt-0 w-30 bg-background rounded-lg shadow-xl z-50'; 

        Object.entries(SUPPORTED_LANGUAGES).forEach(([code, info]) => {
            const option = document.createElement('button');
            option.className = createButtonStyle('lang-option w-full text-left px-4 py-3 flex items-center justify-between text-[14px]', code === currentLang ? 'green' : 'blue');
            if (code === currentLang) {
                option.classList.remove('mt-5');
            }
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

 //  * Attaches click handlers to the language switcher.
    private attachLanguageSwitcherListeners(container: HTMLElement): void {
        const button = container.querySelector('.lang-button') as HTMLButtonElement;
        const dropdown = container.querySelector('.lang-dropdown') as HTMLElement;

        // Toggle dropdown for this instance
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });

        // Attach a single document-level click handler once to close any open dropdowns
        if (!Header.languageDocClickAttached) {
            document.addEventListener('click', () => {
                document.querySelectorAll('.lang-dropdown').forEach(el => el.classList.add('hidden'));
            });
            Header.languageDocClickAttached = true;
        }

        // Language option selection
        container.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const selectedLang = (e.currentTarget as HTMLElement).dataset.lang!;
                changeLanguage(selectedLang);
                dropdown.classList.add('hidden');
            });
        });
    }
}
