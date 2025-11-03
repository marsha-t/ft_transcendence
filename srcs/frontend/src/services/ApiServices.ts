import { AuthServices } from './auth/AuthServices.js';
import { ProfileServices } from './profile/ProfileServices.js';
// import { UserService } from './user/UserService';
import { GameService } from './game/GameService.js';
import { TournamentService } from './tournament/TournamentService.js';
import { DashboardService } from './dashboard/DashboardService.js';

export const apiServices = {
    auth: new AuthServices(),
    // user: new UserService(),
    profile : new ProfileServices(),
    game: new GameService(),
    tournament: new TournamentService(),
    dashboard: new DashboardService(),
};
