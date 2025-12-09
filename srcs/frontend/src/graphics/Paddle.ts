import * as BABYLON from "babylonjs";
// import { GameConfig } from "./GameConfig";
import { gameConfigManager } from "./GameConfigManager";


export class Paddle {
    public mesh: BABYLON.Mesh;
    private scene: BABYLON.Scene;
    public velocity: number = 0;  // Now full units/second (set by InputHandler)

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, name: string) {
        this.scene = scene;

        this.mesh = BABYLON.MeshBuilder.CreateBox(name, { width: 0.2, height: 0.5, depth: 3 }, this.scene);
        this.mesh.position = position;

        const mat = new BABYLON.StandardMaterial(name + "Mat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(0, 0, 0.4);
        this.mesh.material = mat;
    }

    public move(dt: number): void {  // dt in seconds; moves based on current velocity
        const dz = this.velocity * dt;
        this.mesh.position.z += dz;

        const bounds = gameConfigManager.current.tableBounds;
        const halfDepth = gameConfigManager.current.paddle.depth / 2;

        // Clamp to bounds
        if (this.mesh.position.z - halfDepth < bounds.zMin) {
            this.mesh.position.z = bounds.zMin + halfDepth;
        }
        if (this.mesh.position.z + halfDepth > bounds.zMax) {
            this.mesh.position.z = bounds.zMax - halfDepth;
        }
    }
}