import { AuthServices } from './auth/AuthServices.js';
// import { UserService } from './user/UserService';
import { GameService } from './game/GameService.js';

export const apiServices = {
    auth: new AuthServices(),
    // user: new UserService(),
    game: new GameService(),
};
