import * as BABYLON from "babylonjs";
import { GameConfig } from "./GameConfig";

export class Ball {
    public mesh: BABYLON.Mesh;
    private scene: BABYLON.Scene;
    public speed: BABYLON.Vector3;

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, diameter?: number) {
        this.scene = scene;
        const ballDiameter = diameter ?? GameConfig.ball.diameter;

        this.mesh = BABYLON.MeshBuilder.CreateSphere("pongBall", { diameter: ballDiameter }, this.scene);
        this.mesh.position.copyFrom(position);

        const mat = new BABYLON.StandardMaterial("ballMat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.95, 0.6, 0.2);
        mat.emissiveColor = new BABYLON.Color3(0.35, 0.15, 0);
        this.mesh.material = mat;

        this.speed = new BABYLON.Vector3(GameConfig.ball.speed.x, 0, GameConfig.ball.speed.z);
    }

    public update(dt: number): void {  // Now takes dt in seconds
        const deltaV = this.speed.clone().scale(dt);
        this.mesh.position.addInPlace(deltaV);

        // Cap speed magnitude (total, not components) for balanced rallies
        const maxSpeed = GameConfig.ball.maxSpeed;
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

    public applySpeedIncrement(): void {
        const increment = GameConfig.ball.speedIncrement;
        const currentMag = this.speed.length();
        this.speed.scaleInPlace(increment);
    }

    public dispose(): void {
        try {
            this.mesh.dispose();
        } catch { }
    }
}