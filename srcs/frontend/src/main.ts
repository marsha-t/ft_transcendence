import { Router } from './Router.js';
import { getRouter } from './utils.js';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';

window.addEventListener('DOMContentLoaded', () => {
    const headerContainer = document.getElementById('header-container');
    const contentContainer = document.getElementById('content-container');
    const footerContainer = document.getElementById('footer-container');

    if (!headerContainer || !contentContainer || !footerContainer) {
        console.error('One or more required container elements not found in the DOM.');
        return;
    }
    
    const headerComponent = new Header();
    headerContainer.appendChild(headerComponent.render());

    const footerComponent = new Footer();
    footerContainer.appendChild(footerComponent.render());

    // new Router(contentContainer);
    getRouter(contentContainer); 
      window.dispatchEvent(new PopStateEvent('popstate'));

});