import { IComponent } from "../components/IComponent";
import { AuthUtils } from "../utils/authUtils.js"; // Import auth utility
import { createButtonStyle } from "../utils";
import { ProfileServices } from "../services/profile/ProfileServices.js";
import { AuthServices } from "../services/auth/AuthServices.js";
import { apiServices } from "../services/ApiServices";
export class Header implements IComponent {
    private buttonsGroup!: HTMLElement;
    private linksGroup!: HTMLElement;
    public render(): HTMLElement {
        const header = document.createElement('header');
        header.className = `bg-color-yellow pb-3`;

        const subHeader = document.createElement('div');
        subHeader.className = `bg-background py-6 rounded-[16px]
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
        logoText.className = `text-[24px] font-press text-color_white`;
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
        rightNav.className = 'flex items-center gap-[32px] w-[500px] h-[45px]';

        this.linksGroup = document.createElement('div');
        this.linksGroup.className = 'flex items-center gap-[24px] w-[158px] h-[18px] font-pixel text-[800] text-[18px]';

        this.buttonsGroup = document.createElement('div');
        this.buttonsGroup.className = 'flex items-center gap-[17px] w-[312px] h-[42px] text-[900] text-[18px]';

        const links = [
            {text: 'Home', href: '/main', type: 'link'},
            {text: 'Creators', href: '/creators', type: 'link'},
        ];

        links.forEach(link => {
            const a = this.createLink(link);
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
            const loginLink = this.createLink({ text: 'Login', href: '/login', type: 'button' });
            const registerLink = this.createLink({ text: 'Register', href: '/register', type: 'button' });
            this.buttonsGroup.appendChild(loginLink);
            this.buttonsGroup.appendChild(registerLink);
            return;
        }
    
       // Logged in → Play button
        const playBtnWrapper = document.createElement('div');
        playBtnWrapper.className = 'relative inline-block';

        const playBtn = document.createElement('a');
        playBtn.textContent = 'Play';
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
            { label: 'AI', href: '/game' }, //put ai link
            { label: 'Friend', href: '/game' },
            { label: 'Tournament', href: '/tournament' },
        ];

        // Populate dropdown
        dropdownItems.forEach((item: DropdownItem): void => {
            const option: HTMLAnchorElement = document.createElement('a');
            option.href = item.href;
            option.textContent = item.label;
            option.className = createButtonStyle(" w-[fit-content] h-[32px] text-[20px]", 'green');
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
                playBtn.classList.add("bg-color-green");
            } else {
                playBtn.classList.remove("bg-color-green");
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!playBtnWrapper.contains(e.target as Node)) {
                dropdown.classList.add('hidden');
                playBtn.classList.remove("bg-color-green");
            }
        });

        this.buttonsGroup.appendChild(playBtnWrapper);

    
        const profileService = new ProfileServices();
    
        // Logout button
        const logoutBtn = document.createElement('a');
        logoutBtn.textContent = 'Logout';
        logoutBtn.href = '#';
        logoutBtn.className = createButtonStyle(` w-[128px] h-[42px]`, 'blue');
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
                border border-[3px] border-border-green
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
        } catch (error) {
            console.error("Error loading avatar:", error);
        }
    }
    

    private createLink(link: {text: string, href: string, type: string}): HTMLElement {
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.text;

        if (link.text === 'Login') {
            a.className = `
                w-[138px] h-[36px]
                px-4 rounded-[8px] tracking-[0.4em]
                text-[16px] font-pixel
                text-color_white
                border border-[1px] border-border-green
                inline-flex justify-center items-center
                no-underline cursor-pointer
                transition-colors duration-200 ease-in-out
                hover:bg-color-green
                hover:text-color_white`;
        } else if (link.text === 'Register') {
            a.className = `
                w-[188px] h-[36px]
                px-4 rounded-[8px] tracking-[0.4em]
                text-[16px] font-pixel
                text-color_white
                border border-[1px] border-border-green
                inline-flex justify-center items-center
                no-underline cursor-pointer
                transition-colors duration-200 ease-in-out
                hover:bg-color-green
                hover:text-color_white`;
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
            text-[14px] font-pixel no-underline
            underline-offset-[3px] transition-all duration-200 decoration-2`;

        if (href === currentPath) {
            return `${baseClass} text-color-yellow underline`;
        } else {
            return `${baseClass} text-color_white hover:underline hover:text-color-yellow`;
        }
    }

    private setupActiveLinks(linksGroup: HTMLElement, buttonsGroup: HTMLElement): void {
        const updateActiveLink = () => {
            const currentPath = window.location.pathname;
            
            // Update navigation links
            linksGroup.querySelectorAll('a').forEach(navLink => {
                const href = navLink.getAttribute('href');
                const baseClass = `
                    text-[14px] font-pixel no-underline
                    underline-offset-[3px] transition-all duration-200 decoration-2`;
                
                if (href === currentPath) {
                    navLink.style.textDecoration = 'underline';
                    navLink.style.textDecorationColor = 'var(--color-yellow)';
                    navLink.className = `${baseClass} text-color-yellow`;
                } else {
                    navLink.style.textDecoration = 'none';
                    navLink.className = `${baseClass} text-color_white hover:underline hover:text-color-yellow`;
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
        const isLogin = btn.textContent === 'Login';
        const isRegister = btn.textContent === 'Register';
        
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
            text-[16px] font-pixel text-color_white
            border border-[1px] border-border-green
            inline-flex justify-center items-center
            no-underline cursor-pointer transition-colors duration-200 ease-in-out`;
        
        return isActive ? `${baseClasses} bg-color-green`
            : `${baseClasses} hover:bg-color-green hover:text-color_white`;
    }

    private getRegisterButtonClasses(isActive: boolean): string {
        const baseClasses = `
            w-[188px] h-[36px] px-4 rounded-[8px] tracking-[0.4em]
            text-[16px] font-pixel text-color_white
            border border-[1px] border-border-green
            inline-flex justify-center items-center
            no-underline cursor-pointer transition-colors duration-200 ease-in-out`;
        
        return isActive ? `${baseClasses} bg-color-green`
            : `${baseClasses} hover:bg-color-green hover:text-color_white`;
    }
}