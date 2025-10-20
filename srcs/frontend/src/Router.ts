import { Register } from './pages/Register.js';
import { Login } from './pages/Login.js';
import { Creators } from './pages/Creators.js';
import { Game } from './pages/Game.js';
import { Main } from './pages/Main.js';
import { Profile } from './pages/Profile.js';
// import { Tournament } from './pages/Tournament.js';
import { TournamentSetup } from './pages/TournamentSetup.js';
import { TournamentAddPlayers } from './pages/TournamentAddPlayers.js';
import { TournamentLineup } from './pages/TournamentLineup.js';
import { TournamentMatch } from './pages/TournamentMatch.js';
import { TournamentResults } from './pages/TournamentResults.js';

export class Router {

  constructor(container: HTMLElement) {
    const renderRoute = async () => {
      
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
        case '/tournament/setup':
          const tournamentSetup = new TournamentSetup();
          container.appendChild(tournamentSetup.render());
          break;
        case '/tournament/add-players':
          const tournamentAddPlayers = new TournamentAddPlayers();
          container.appendChild(tournamentAddPlayers.render());
          break;
        case '/tournament/lineup':
          const tournamentLineup = new TournamentLineup();
          container.appendChild(tournamentLineup.render());
          break;
        case '/tournament/match': {
          const state = history.state;
          const tournamentId = state?.tournamentId;
          if (!tournamentId) {
            container.textContent = 'Error: Missing tournament ID';
            break;
          }
          const tournamentMatch = new TournamentMatch(tournamentId);
          container.appendChild(await tournamentMatch.render());
          break;
        }
        case '/tournament/results': {
          const state = history.state;
          const tournamentId = state?.tournamentId;
          const tournamentResults = new TournamentResults(tournamentId);
          container.appendChild(await tournamentResults.render());
          break;
        }
        default:
          container.textContent = '404 - Page Not Found';
      }
    };

    renderRoute();
    window.addEventListener('popstate', renderRoute);
  }
}