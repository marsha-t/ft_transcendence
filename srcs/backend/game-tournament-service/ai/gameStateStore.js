
/*
 * GameStateStore - Stores the current game state for each AI game session
 * Key = sessionId (example: 123)
 * Value = game state data
 */
class GameStateStore {
    constructor (){
        this.sessions = new Map();
    }

    update( sessionId, gameState) {
        const state = {
            sessionId: sessionId,
            timeStamp: Date.now(),

            ball: {
                x: gameState.ball.x,
                z: gameState.ball.z,
                vx: gameState.ball.vx, // Horizontal speed
                vz: gameState.ball.vz // Vertical speed
            },

            // Top & bottom walls
            arena: {
                zMin: gameState.arena.zMin,
                zMax: gameState.arena.zMax
            },

            aiPaddle: {
                x: gameState.aiPaddle.x,
                z: gameState.aiPaddle.z
            },

            oppPaddle: {
                x: gameState.oppPaddle.x,
                z: gameState.oppPaddle.z,
                vz: gameState.oppPaddle.vz
            },

            constants: gameState.constants || null
        };

        this.sessions.set(sessionId, state);
    }

    // Map.get() returns a reference to the object
    getState(sessionId) {
        return this.sessions.get(sessionId);
    }

    // Remove game state (garbage collector will deallocate)
    removeState(sessionId) {
        this.sessions.delete(sessionId);
    }
}

const gameStateStore = new GameStateStore();
export default gameStateStore;
