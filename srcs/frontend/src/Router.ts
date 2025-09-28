import { Register } from './pages/Register.js';
import { Login } from './pages/Login.js';
import { Creators } from './pages/Creators.js';
import { Game } from './pages/Game.js';
import { Main } from './pages/Main.js';
import { Profile } from './pages/Profile.js';
import { Tournament } from './pages/Tournament.js';

export class Router {

  constructor(container: HTMLElement) {
    const renderRoute = () => {
      container.innerHTML = ''; // Clear container
      const path = window.location.pathname;
      // console.log("Path:", window.location.pathname);

      switch (path) {
        case '/register':
          const register = new Register();
          container.appendChild(register.render());
          break;
        case '/login':
          const login = new Login();
          container.appendChild(login.render());
          break;
        case '/creators':
          const creators = new Creators();
          container.appendChild(creators.render());
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
        case '/profile':
          const profile = new Profile();
          container.appendChild(profile.render());
          break;
        case '/tournament':
          console.log("here");
          const tournament = new Tournament();
          console.log("done2");
          container.appendChild(tournament.render());
          console.log("done");
          break;

        default:
          container.textContent = '404 - Page Not Found';
      }
    };

    renderRoute();
    window.addEventListener('popstate', renderRoute);
  }
}