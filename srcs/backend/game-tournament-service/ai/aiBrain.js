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
        - Check if ball is reset (v. low horizontal speed and near center of arena) 
            - If so, clear prediction and timer 
        - Check at least 1 second has passed since last prediction
        - If so, 
            - call predictBallIntercept (intersection between ball and AI paddle) and cache prediction in lastPrediction
            - add reaction delay before AI is allowed to act on prediction
                - Delay depends on actual ball speed and max speed so faster balls lead to quicker reaction
                - If reaction delay has elapsed, cached prediction is used; Else, prediction is withheld and AI hesitates
        On every frame: 
            - call decideMovement to generate AI's move
                - If reaction delay has elapsed, pass cached prediction to decideMovement
                - If not, withold prediction so AI hesitates
    */
    decide(snapshot) {
        const now = Date.now();
        const ball = snapshot.ball;

        const ballReset =
            Math.abs(ball.vx) < 0.001 ||
            Math.abs(ball.x) < 0.5;

        if (ballReset) {
            this.lastPrediction = null;
            this.lastUpdateTime = 0;
            this.predictionReadyAt = 0;
        }

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
            const speed = Math.sqrt(
                ball.vx * ball.vx +
                ball.vz * ball.vz
            );

            const SPEED_REF = snapshot.constants.maxSpeed;
            const BASE_SPEED =15
            const BASE_DELAY = 250;
            const SPEED_SENSITIVITY = 160;
            const deltaSpeed = speed - BASE_SPEED;
            const reactionDelay = BASE_DELAY - (deltaSpeed / SPEED_REF) * SPEED_SENSITIVITY;
            this.predictionReadyAt = now + reactionDelay;
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