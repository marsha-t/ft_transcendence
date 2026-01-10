import { AuthServices } from './auth/AuthServices.js';
import { ProfileServices } from './profile/ProfileServices.js';
import { FriendsServices } from './friends/FriendsServices.js';
import { GameService } from './game/GameService.js';
import { AIService } from './game/AIService.js';
import { TournamentService } from './tournament/TournamentService.js';
import { DashboardService } from './dashboard/DashboardService.js';
import { AIWebSocketService } from './websocket/WebsocketServices.js';

export const apiServices = {
    auth: new AuthServices(),
    profile : new ProfileServices(),
    friends: new FriendsServices(),
    game: new GameService(),
    ai: new AIService(),
    tournament: new TournamentService(),
    dashboard: new DashboardService(),
    aiWebSocketService: new AIWebSocketService(),
};
