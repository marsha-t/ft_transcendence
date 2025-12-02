
export interface GameState{
    ball: {
        x: number;
        z: number;
        vx: number;
        vz: number;
    },
    arena: {
        zMin: number;
        zMax: number;
    },
    aiPaddle: {
        x: number;
        z: number;
    },
    oppPaddle: {
        x: number;
        z: number;
        vz: number;
    },
    constants?: any;
}

export interface AIMove {
    paddleZ: number;
    timestamp: number;
}
