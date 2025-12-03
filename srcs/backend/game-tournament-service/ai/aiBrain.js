import predictBallIntercept from "./predictBallIntercept.js";
import decideMovement from "./decideMovement.js";

export default class AIBrain {
    constructor() {
        this.lastUpdateTime = 0;
        this.lastPrediction = null;
    }

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

        // If the ball won't reach → drift to center
        // if (!this.lastPrediction.willReach || 
        //     this.lastPrediction.zIntercept === undefined) {

        //     const z = snapshot.aiPaddle.z;

        //     if (z > 0.2) return "UP";
        //     if (z < -0.2) return "DOWN";
        //     return "NONE";
        // }
        if (!this.lastPrediction.willReach || 
            this.lastPrediction.zIntercept === undefined) {
            return 0;
        }

        // Normal predicted movement
        // return decideMovement({
        //     aiPaddleZ: snapshot.aiPaddle.z,
        //     zIntercept: this.lastPrediction.zIntercept,
        //     arena: snapshot.arena,
        // });
        return this.lastPrediction.zIntercept;
    }
}