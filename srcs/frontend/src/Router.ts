import { Register } from './pages/Register/Register.js';
import { Login } from './pages/Login/Login.js';
import { About } from './pages/About/About.js';
import { Game } from './pages/Game/Game.js';
import { Main } from './pages/Main/Main.js';
import { IComponent } from './components/IComponent.js';

export class Router {
  constructor(container: HTMLElement) {
    const renderRoute = () => {
      container.innerHTML = ''; // Clear container
      const path = window.location.pathname;
      switch (path) {
        case '/register':
          const register = new Register();
          container.appendChild(register.render());
          break;
        case '/login':
          const login = new Login();
          container.appendChild(login.render());
          break;
        case '/about':
          const about = new About();
          container.appendChild(about.render());
          break;
        case '/game':
          const game = new Game();
          container.appendChild(game.render());
          break;
        case '/':
        case '/main':
          const main = new Main();
          container.appendChild(main.render());
          break;
        default:
          container.textContent = '404 - Page Not Found';
      }
    };

    renderRoute();
    window.addEventListener('popstate', renderRoute);
  }
}