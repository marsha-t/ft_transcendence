import { getRouter } from './utils/commonUtils.js';
import { AuthUtils } from './utils/authUtils.js';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { i18nReady, initializeLanguageFromBackend } from './services/i18n/i18nService.js';

// Prepare environment for SPA
/*
    - Wait for DOM to exist
    - Check that root containers exist
    - Initialise global services: Authentication and i18n
    - Mount header and footer
    - Create Router instance (once)x
    - Trigger first render by dispatching popstate event
    - No cleanup needed: listener fires once and browser discards it 
*/
window.addEventListener('DOMContentLoaded', async () => {
    const headerContainer = document.getElementById('header-container');
    const contentContainer = document.getElementById('content-container');
    const footerContainer = document.getElementById('footer-container');
    if (!headerContainer || !contentContainer || !footerContainer) {
        console.error('One or more required container elements not found in the DOM.');
        return;
    }

    // Wait for i18n to be ready
    await i18nReady;
    
    // Initialize language from backend (if user is logged in) or fallback to localStorage/default
    await initializeLanguageFromBackend();
    
    // Initialize auth after language is set up
    await AuthUtils.initialize();
    
    // Listen for auth state changes to update language from backend
    // App-level auth state listener - lives for lifetime of document to sync auth to language
    // No manual cleanup needed: listener removed when browser unloads window
    window.addEventListener('authChange', async (event: any) => {
        if (event.detail?.isLoggedIn) {
            // User logged in, update language from their backend preference
            // Add a small delay to ensure auth state is fully processed
            setTimeout(async () => {
                await initializeLanguageFromBackend();
            }, 100);
        } else {
            // User logged out, reset to default language
            const defaultLang = 'en';
            const { changeLanguage } = await import('./services/i18n/i18nService.js');
            await changeLanguage(defaultLang, false); // Don't persist to backend since user is logged out
        }
    });
    
    const headerComponent = new Header();
    headerContainer.appendChild(headerComponent.render());
    const footerComponent = new Footer();
    footerContainer.appendChild(footerComponent.render());

    getRouter(contentContainer); 
    window.dispatchEvent(new PopStateEvent('popstate'));
});
