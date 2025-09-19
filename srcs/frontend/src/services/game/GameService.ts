import { GameSession, PlayerSide } from "./types";

export class GameService{
    private baseUrl: string;

    constructor(){
        this.baseUrl = 'http://localhost:5001/api';
    }
}