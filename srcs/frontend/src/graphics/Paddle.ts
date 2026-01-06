import * as BABYLON from "babylonjs";
import { gameConfigManager } from "./GameConfigManager";


/**
 * Paddle - Player-controlled paddle for Pong game
 * 
 * Responsibilities:
 * - Rendering paddle mesh in Babylon.js scene
 * - Handling paddle movement with wall collision
 * - Tracking current depth (can change with power-ups)
 * 
 * Ownership:
 * - Mesh is owned by Babylon.js scene
 * - Parent PongGame class handles disposal
 * 
 * Lifecycle:
 * - Created by PongGame constructor
 * - Updated every physics step via move()
 * - Disposed automatically when PongGame.dispose() is called
 */
export class Paddle {
    public mesh: BABYLON.Mesh;
    private scene: BABYLON.Scene;
    public velocity: number = 0; 

    private currentMeshDepth: number;

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, name: string) {
        this.scene = scene;

        const config = gameConfigManager.current.paddle;

        this.mesh = BABYLON.MeshBuilder.CreateBox(
            name, 
            { 
                width: config.width, 
                height: config.height, 
                depth: config.depth 
            }, this.scene);
        this.mesh.position = position;

        this.currentMeshDepth = config.depth;
        
        const mat = new BABYLON.StandardMaterial(name + "Mat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(0, 0, 0.4);
        this.mesh.material = mat;
    }

    //- Updates internal depth tracking when paddle is enlarged/restored
    // - Called by PongGame during power-up activation/deactivation
    public updateMeshDepth(newDepth: number): void {
        this.currentMeshDepth = newDepth;
    }

    // - Updates paddle position based on velocity
    // - Prevents paddle from going through walls
    // - Called every physics frame by InputHandler
    public move(dt: number): void {
        const dz = this.velocity * dt;
        this.mesh.position.z += dz;

        const t = gameConfigManager.current.table;
        const wallThickness = gameConfigManager.current.wall.thickness;
        
        // Calculate wall inner surface positions
        const wallInnerZ = (t.depth / 2) - (wallThickness / 2);
        
        // ACTUAL mesh depth, not config depth
        const halfDepth = this.currentMeshDepth / 2;

        // Calculate bounds for paddle movement
        const minZ = -wallInnerZ + halfDepth;
        const maxZ = wallInnerZ - halfDepth;

        // Clamp paddle position to prevent wall tunneling
        if (this.mesh.position.z < minZ) {
            this.mesh.position.z = minZ;
        }
        if (this.mesh.position.z > maxZ) {
            this.mesh.position.z = maxZ;
        }
    
    }
}