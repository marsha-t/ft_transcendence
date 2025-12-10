import { Register } from './pages/Register.js';
import { Login } from './pages/Login.js';
import { Creators } from './pages/Creators.js';
import { Game } from './pages/Game.js';
import { Main } from './pages/Main.js';
import { Profile } from './pages/Profile.js';
import { TournamentSetup } from './pages/TournamentSetup.js';
import { TournamentMatch } from './pages/TournamentMatch.js';
import { TournamentResults } from './pages/TournamentResults.js';
import { GameResults } from './pages/GameResults.js';
import { ProfileDashboard } from './pages/UserDashboard.js';

export class Router {
  private currentPage: any = null;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    const renderRoute = async () => {
      // Check if current page allows navigation
      if (this.currentPage && typeof this.currentPage.canDeactivate === "function") {
        const canLeave = await this.currentPage.canDeactivate();
        if (!canLeave) {
          history.pushState({}, "", window.location.pathname);
          return;
        }
      }

      // Clean up previous page
      if (this.currentPage && typeof this.currentPage.cleanup === "function") {
        try {
          this.currentPage.cleanup();
        } catch (err) {
          console.log("Error during page cleanup: ", err);
        }
      }

      container.innerHTML = ''; // Clear container
      const path = window.location.pathname;
      // console.log("Path:", window.location.pathname);
      const state = history.state;

      switch (path) {
        case '/register':
          this.currentPage = new Register();
          container.appendChild(this.currentPage.render());
          break;
        case '/login':
          this.currentPage = new Login();
          container.appendChild(this.currentPage.render());
          break;
        case '/creators':
          this.currentPage = new Creators();
          container.appendChild(this.currentPage.render());
          break;
        case '/game':
          this.currentPage = new Game();
          container.appendChild(this.currentPage.render());
          break;
        case '/game/results':
          this.currentPage = new GameResults(state);
          container.appendChild(this.currentPage.render());
          break; 
        case '/':
        case '/main':
          this.currentPage = new Main();
          container.appendChild(this.currentPage.render());
          break;
        case '/profile':
          this.currentPage = new Profile();
          container.appendChild(this.currentPage.render());
          break;
        case '/dashboard':
          this.currentPage = new ProfileDashboard();
          container.appendChild(this.currentPage.render());
          break ;
        case '/tournament':
        case '/tournament/setup':
          this.currentPage = new TournamentSetup();
          container.appendChild(this.currentPage.render());
          break;
        case '/tournament/match': {
          const tournamentId = state?.tournamentId;
          if (!tournamentId) {
            container.textContent = 'Error: Missing tournament ID';
            break;
          }
          this.currentPage = new TournamentMatch(tournamentId);
          container.appendChild(await this.currentPage.render());
          break;
        }
        case '/tournament/results': {
          const tournamentId = state?.tournamentId;
          this.currentPage = new TournamentResults(tournamentId);
          container.appendChild(await this.currentPage.render());
          break;
        }
        default:
          container.textContent = '404 - Page Not Found';
          this.currentPage = null;
      }
    };

    // Listen for language changes and re-render the current page
    window.addEventListener('languageChanged', renderRoute);

    // renderRoute();
    window.removeEventListener('popstate', renderRoute);
    window.addEventListener('popstate', renderRoute);
  }
}