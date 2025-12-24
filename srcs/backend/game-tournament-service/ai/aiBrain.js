import predictBallIntercept from   "./predictBallIntercept.js"
import decideMovement from "./decideMovement.js";

export default class AIBrain {
    /*
        - lastUpdateTime: to enforce 'thinking' once per second
        - lastUpdateTime: to cache predictions in between 'thoughts'
    */
    constructor() {
        this.lastUpdateTime = 0;
        this.lastPrediction = null;
    }

    // Orchestrate how AI decides
    /*
        - Check at least 1 second has passed since last prediction
        - If so, 
            - call predictBallIntercept (intersection between ball and AI paddle) and cache prediction in lastPrediction
            - call decideMovement to generate AI's move
    */
    decide(snapshot) {
        const now = Date.now();

        const shouldRecalculate = 
            !this.lastPrediction || (now - this.lastUpdateTime >= 1000);

        if (shouldRecalculate) {
            this.lastPrediction = predictBallIntercept({
                ball: snapshot.ball,
                arena: snapshot.arena,
                aiPaddle: snapshot.aiPaddle,
                oppPaddle: snapshot.oppPaddle,
                constants: snapshot.constants,
            });
            this.lastUpdateTime = now;
        }

        return decideMovement({
            aiPaddleZ: snapshot.aiPaddle.z,
            zIntercept: this.lastPrediction.zIntercept,
            arena: snapshot.arena,
            hasIntercept: this.lastPrediction.willReach,
        });
    }
}