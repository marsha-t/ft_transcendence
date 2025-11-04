import { IComponent } from "../components/IComponent";
import { AuthUtils } from "../utils/authUtils.js"; // Import auth utility
import { ProfileServices } from "../services/profile/ProfileServices.js";

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
        logoIcon.src = '/assets/logo.png'; 
        logoIcon.alt = 'Pong Logo';
        logoIcon.className = 'w-[40px] h-[40px]';

        logo.appendChild(logoIcon);
        logo.appendChild(logoText);

        return logo;
    }

    private createRightNav(): HTMLElement {
        const rightNav = document.createElement('div');
        rightNav.className = 'flex items-center gap-[32px]';

        this.linksGroup = document.createElement('div');
        this.linksGroup.className = 'flex items-center gap-[24px] font-pixel';

        this.buttonsGroup = document.createElement('div');
        this.buttonsGroup.className = 'flex items-center gap-[24px]';

        const links = [
            {text: 'Home', href: '/main', type: 'link'},
            {text: 'Creators', href: '/creators', type: 'link'},
            {text: 'Profile', href: '/profile', type: 'link'},
        ];

        // Add navigation links
        links.forEach(link => {
            const a = this.createLink(link);
            this.linksGroup.appendChild(a);
        });

        rightNav.appendChild(this.linksGroup);
        rightNav.appendChild(this.buttonsGroup);

        this.updateAuthButtons();
         //  Listen for login/logout changes
        window.addEventListener('authChange', (event: any) => {
            this.updateAuthButtons();
        });
        
        // Setup active link updating
        this.setupActiveLinks(this.linksGroup, this.buttonsGroup);

        return rightNav;
    }

    private updateAuthButtons(): void {
        // Clear existing buttons
        this.buttonsGroup.innerHTML = '';
        const isLoggedIn = AuthUtils.isLoggedIn();
        // Hide or show Profile link based on login status
        const profileLink = this.linksGroup.querySelector('a[href="/profile"]') as HTMLElement;
        if (profileLink) {
            profileLink.style.display = isLoggedIn ? "inline-flex" : "none";
        }
        // Only show Login/Register if user is NOT logged in
        if (!isLoggedIn) {
            const loginLink = {text: 'Login', href: '/login', type: 'button'};
            const registerLink = {text: 'Register', href: '/register', type: 'button'};
            
            const loginBtn = this.createLink(loginLink);
            const registerBtn = this.createLink(registerLink);
            
            this.buttonsGroup.appendChild(loginBtn);
            this.buttonsGroup.appendChild(registerBtn);
        }
        else {
            const profileService = new ProfileServices();
            const logoutBtn = document.createElement('a');
        logoutBtn.textContent = 'Logout';
        logoutBtn.href = '#';
        logoutBtn.className = `
            w-[138px] h-[36px]
            px-4 rounded-[8px] tracking-[0.4em]
            text-[16px] font-pixel
            text-color_white
            border border-[1px] border-border-green
            inline-flex justify-center items-center
            no-underline cursor-pointer
            transition-colors duration-200 ease-in-out
            hover:bg-color-green hover:text-color_white
        `;
        logoutBtn.addEventListener("click", async () => {
            try {
              const confirmed = await AuthUtils.showConfirmation("Are you sure you want to logout?", "LOGOUT?", true);
                  if (!confirmed) return;
              // Call your logout API
              const res = await profileService.logout();
              if (res.success) {
                // Clear localStorage / JWT
                localStorage.removeItem("jwtToken");
                localStorage.removeItem("currentUsername");
        
                 // ✅ Clear auth state and trigger header update
                 AuthUtils.logout();
                // Redirect to main page after successful logout
                setTimeout(() => {
                  console.log("Current URL before navigation:", window.location.href);
                  console.log("Current pathname:", window.location.pathname);
                  console.log("Current hash:", window.location.hash);
                  
                  //i need to check and clear the path first
                  if(window.location.hash)
                      history.replaceState(null, '', window.location.pathname);
                  
                  //then navigate to destination
                  history.pushState(null, '', '/main');
                  // Trigger router update
                  window.dispatchEvent(new PopStateEvent('popstate'));
        
                  console.log("PopState event dispatched");
              }, 100);
              } else {
                alert(res.message || "Logout failed");
              }
            } catch (err) {
              console.error("Logout error:", err);
              alert("Logout failed");
            }
          });
            this.buttonsGroup.appendChild(logoutBtn);
            console.log('[Header] User IS logged in → hiding buttons');
        }
        // If logged in, buttonsGroup stays empty (no buttons shown)
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