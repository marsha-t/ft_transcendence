import { getRouter } from './utils.js';
import { AuthUtils } from './utils/authUtils.js';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { i18nReady } from './services/i18n/i18nService.js';

// Prepare environment for SPA
/*
    - Wait for DOM to exist
    - Check that root containers exist
    - Initialise global services: Authentication and i18n
    - Mount header and footer
    - Create Router instance (once)
    - Trigger first render by dispatching popstate event
*/
window.addEventListener('DOMContentLoaded', async () => {
    const headerContainer = document.getElementById('header-container');
    const contentContainer = document.getElementById('content-container');
    const footerContainer = document.getElementById('footer-container');
    if (!headerContainer || !contentContainer || !footerContainer) {
        console.error('One or more required container elements not found in the DOM.');
        return;
    }

    await Promise.all([AuthUtils.initialize(), i18nReady]);
    
    const headerComponent = new Header();
    headerContainer.appendChild(headerComponent.render());
    const footerComponent = new Footer();
    footerContainer.appendChild(footerComponent.render());

    getRouter(contentContainer); 
    window.dispatchEvent(new PopStateEvent('popstate'));
});