import * as BABYLON from "babylonjs";
import { gameConfigManager } from "./GameConfigManager";

/**
 * Ball - Represents the pong ball in the 3D scene
 *
 * Responsibilities:
 * - Owns and manages the Babylon.js sphere mesh
 * - Handles position updates based on velocity and delta time
 * - Applies bounce logic (direction reversal on X or Z axis)
 * - Gradually increases speed after each paddle hit
 * - Enforces maximum speed cap to prevent uncontrollable rallies
 * - Provides safe disposal of mesh resources
 *
 * Ownership:
 * - Owns: BABYLON.Mesh (sphere), BABYLON.StandardMaterial
 * - Does NOT own: Scene (reference only)
 *
 * Lifecycle:
 * - Created once per PongGame instance
 * - Updated every physics sub-step (120Hz)
 * - Disposed when PongGame.dispose() is called (via scene cleanup or explicit call)
 */
export class Ball {
    public mesh: BABYLON.Mesh;
    private scene: BABYLON.Scene;
    public speed: BABYLON.Vector3;

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, diameter?: number) {
        this.scene = scene;
        const ballDiameter = diameter ?? gameConfigManager.current.ball.diameter;

        this.mesh = BABYLON.MeshBuilder.CreateSphere("pongBall", { diameter: ballDiameter }, this.scene);
        this.mesh.position.copyFrom(position);

        const mat = new BABYLON.StandardMaterial("ballMat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.95, 0.6, 0.2);
        mat.emissiveColor = new BABYLON.Color3(0.35, 0.15, 0);
        this.mesh.material = mat;

        this.speed = new BABYLON.Vector3(gameConfigManager.current.ball.speed.x, 0, gameConfigManager.current.ball.speed.z);
    }

    // Updates ball position based on current speed and delta time
    // Called every fixed physics sub-step (120Hz target)
    public update(dt: number): void {  // Now takes dt in seconds
        const deltaV = this.speed.clone().scale(dt);
        this.mesh.position.addInPlace(deltaV);

        // Cap speed magnitude (total, not components) for balanced rallies
        const maxSpeed = gameConfigManager.current.ball.maxSpeed;
        const currentSpeed = this.speed.length();
        if (currentSpeed > maxSpeed) {
            this.speed.normalize().scaleInPlace(maxSpeed);
        }
    }

    public bounceX(): void {
        this.speed.x *= -1;
    }

    public bounceZ(): void {
        this.speed.z *= -1;
    }

    // Increases ball speed after successful paddle hit
    // Uses multiplicative increment from config for gradual ramp-up
    public applySpeedIncrement(): void {
        const increment = gameConfigManager.current.ball.speedIncrement;
        this.speed.scaleInPlace(increment);
    }

    public dispose(): void {
        try {
            this.mesh.dispose();
        } catch (er){ 
            console.log("Ball mesh already disposed or error during cleanup:", er)
        }

        this.mesh = null as any;
        this.scene = null as any;
        this.speed = null as any;
    }
}