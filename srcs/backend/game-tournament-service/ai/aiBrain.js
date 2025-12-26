import predictBallIntercept from   "./predictBallIntercept.js"
import decideMovement from "./decideMovement.js";

export default class AIBrain {
    /*
        - lastUpdateTime: to enforce 'thinking' once per second
        - lastUpdateTime: to cache predictions in between 'thoughts'
        - predictionReadyAt: to add reaction delay for AI to decide movement after prediction
    */
    constructor() {
        this.lastUpdateTime = 0;
        this.lastPrediction = null;
        this.predictionReadyAt = 0;
    }

    // Orchestrate how AI decides
    /*
        - Check at least 1 second has passed since last prediction
        - If so, 
            - call predictBallIntercept (intersection between ball and AI paddle) and cache prediction in lastPrediction
            - add 250 milliseconds (reaction delay) before AI is allowed to act on prediction
        On every frame: 
            - call decideMovement to generate AI's move
                - If reaction delay has elapsed, pass cached prediction to decideMovement
                - If not, withold prediction so AI hesitates
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
            this.predictionReadyAt = now + 250;
        }
        const canAct = Date.now() >= this.predictionReadyAt;

        return decideMovement({
            aiPaddleZ: snapshot.aiPaddle.z,
            zIntercept: canAct ? this.lastPrediction.zIntercept : null,
            arena: snapshot.arena,
            hasIntercept: canAct && this.lastPrediction.willReach,
        });
    }
}