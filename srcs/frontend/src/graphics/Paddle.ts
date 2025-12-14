import * as BABYLON from "babylonjs";
// import { GameConfig } from "./GameConfig";
import { gameConfigManager } from "./GameConfigManager";
import { GameConfig } from "./GameConfig";


export class Paddle {
    public mesh: BABYLON.Mesh;
    private scene: BABYLON.Scene;
    public velocity: number = 0; 
    private readonly defaultDepth: number = GameConfig.paddle.depth; // Store original default


    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, name: string) {
        this.scene = scene;

        this.mesh = BABYLON.MeshBuilder.CreateBox(
            name, 
            { 
                width: GameConfig.paddle.width, 
                height: GameConfig.paddle.height, 
                depth: GameConfig.paddle.depth 
            }, this.scene);
        this.mesh.position = position;

        const mat = new BABYLON.StandardMaterial(name + "Mat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(0, 0, 0.4);
        this.mesh.material = mat;
    }

    public updateScale(): void {
        const configDepth = gameConfigManager.current.paddle.depth;
        const scakeFactor = configDepth / this.defaultDepth;
        this.mesh.scaling.z = scakeFactor;

        console.log(`[Paddle] Updated scale - Current: ${configDepth}, Default: ${this.defaultDepth}, Factor: ${scaleFactor}`);

    }

    public move(dt: number): void {  // dt in seconds; moves based on current velocity
        const dz = this.velocity * dt;
        this.mesh.position.z += dz;

        const bounds = gameConfigManager.current.tableBounds;
        // const halfDepth = gameConfigManager.current.paddle.depth / 2;

        // Clamp to bounds
        // mesh.scaling.z affects the effective size
        const effectiveDepth = gameConfigManager.current.paddle.depth * this.mesh.scaling.z;
        const halfDepth = effectiveDepth / 2;

        // Clamp to bounds
        if (this.mesh.position.z - halfDepth < bounds.zMin) {
            this.mesh.position.z = bounds.zMin + halfDepth;
        }
        if (this.mesh.position.z + halfDepth > bounds.zMax) {
            this.mesh.position.z = bounds.zMax - halfDepth;
        }
    }
}