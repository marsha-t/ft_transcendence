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
import { AuthUtils } from './utils/authUtils.js';
import { AI } from './pages/AI.js';
import { closeAnyOpenCustomizationUI } from './utils/gameCustom.js';

export class Router {
  private currentPage: any = null;
  private container: HTMLElement;

  private readonly PROTECTED_ROUTES: readonly string[] = [
    '/game',
    '/game/results',
    '/profile',
    '/dashboard',
    '/tournament',
    '/tournament/setup',
    '/tournament/match',
    '/tournament/results',
    '/ai',
  ];


  constructor(container: HTMLElement) {
    this.container = container;

    window.addEventListener('languageChanged', () => this.renderRoute()); // Listen for language changes and re-render current page
    window.addEventListener('popstate', () => this.renderRoute()); // Listen for navigation event and re-render current page
  }
  /*
    - Check that user is logged in when accessing protected routes
      - If not logged in, navigate to Login page
    - Check if page allows navigation using canDeactivate
    - Clean up current page
    - Clear container
    - Instantiate and render page
  */
  private async renderRoute() {
      const path = window.location.pathname;
      const state = history.state;

      if (this.PROTECTED_ROUTES.includes(path) && !AuthUtils.isLoggedIn()) {
        history.pushState({}, "", "/login");
        this.currentPage = new Login();
        this.container.innerHTML = ''; // Clear container
        this.container.appendChild(this.currentPage.render());
        return;
      }

      if (this.currentPage && typeof this.currentPage.canDeactivate === "function") {
        const canLeave = await this.currentPage.canDeactivate();
        if (!canLeave) {
          return;
        }
      }

      //cleanup gameCustomUI
      closeAnyOpenCustomizationUI();

      // Clean up previous page
      if (this.currentPage && typeof this.currentPage.cleanup === "function") {
        try {
          this.currentPage.cleanup();
        } catch (err) {
          console.log("Error during page cleanup: ", err);
        }
      }

      this.container.innerHTML = ''; // Clear container
      switch (path) {
        case '/register':
          this.currentPage = new Register();
          this.container.appendChild(this.currentPage.render());
          break;
        case '/login':
          this.currentPage = new Login();
          this.container.appendChild(this.currentPage.render());
          break;
        case '/creators':
          this.currentPage = new Creators();
          this.container.appendChild(this.currentPage.render());
          break;
        case '/game':
          this.currentPage = new Game();
          this.container.appendChild(this.currentPage.render());
          break;
        case '/game/results':
          const sessionId = state?.sessionId;
          if (!sessionId) {
            history.pushState({}, "", "/main");
            this.currentPage = new Main();
            this.container.appendChild(this.currentPage.render());
            return;
          }
          this.currentPage = new GameResults(state);
          this.container.appendChild(this.currentPage.render());
          break; 
        case '/':
        case '/main':
          this.currentPage = new Main();
          this.container.appendChild(this.currentPage.render());
          break;
        case '/profile':
          this.currentPage = new Profile();
          this.container.appendChild(this.currentPage.render());
          break;
        case '/dashboard':
          this.currentPage = new ProfileDashboard();
          this.container.appendChild(this.currentPage.render());
          break ;
        case '/tournament':
        case '/tournament/setup':
          this.currentPage = new TournamentSetup();
          this.container.appendChild(this.currentPage.render());
          break;
        case '/tournament/match': {
          const tournamentId = state?.tournamentId;
          if (!tournamentId) {
            history.pushState({}, "", "/tournament");
            this.currentPage = new TournamentSetup();
            this.container.appendChild(this.currentPage.render());
            return;
          }
          this.currentPage = new TournamentMatch(tournamentId);
          this.container.appendChild(this.currentPage.render());
          break;
        }
        case '/tournament/results': {
          const tournamentId = state?.tournamentId;
          if (!tournamentId) {
            history.pushState({}, "", "/tournament");
            this.currentPage = new TournamentSetup();
            this.container.appendChild(this.currentPage.render());
            return;
          }
          this.currentPage = new TournamentResults(tournamentId);
          this.container.appendChild(this.currentPage.render());
          break;
        }
        case '/ai':
          this.currentPage = new AI();
          this.container.appendChild(this.currentPage.render());
          break;
        default:
          this.container.textContent = '404 - Page Not Found';
          this.currentPage = null;
      }
    };
}