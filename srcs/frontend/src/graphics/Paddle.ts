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

        const config = gameConfigManager.current.paddle;

        this.mesh = BABYLON.MeshBuilder.CreateBox(
            name, 
            { 
                width: config.width, 
                height: config.height, 
                depth: config.depth 
            }, this.scene);
        this.mesh.position = position;

        const mat = new BABYLON.StandardMaterial(name + "Mat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(0, 0, 0.4);
        this.mesh.material = mat;
    }

    public updateScale(): void {
        // try {
        //     // Get base default depth from GameConfig (the original unmodified value)
        //     const defaultDepth = GameConfig.paddle.depth;
            
        //     // Get current configured depth (may be modified by presets/custom)
        //     const currentDepth = gameConfigManager.current.paddle.depth;
            
        //     // Calculate scale factor
        //     const scaleFactor = currentDepth / defaultDepth;
            
        //     // Only scale the Z-axis (depth/length of paddle)
        //     this.mesh.scaling.z = scaleFactor;
            
        //     console.log(`[Paddle] Updated scale - Current: ${currentDepth}, Default: ${defaultDepth}, Factor: ${scaleFactor}`);
        // } catch (error) {
        //     console.error('[Paddle] Error updating scale:', error);
        //     // Fallback to no scaling
        //     this.mesh.scaling.z = 1;
        // }

        console.log('[Paddle] updateScale() called but not needed - mesh already has correct size');

    }

    // public move(dt: number): void {  // dt in seconds; moves based on current velocity
    //     const dz = this.velocity * dt;
    //     this.mesh.position.z += dz;

    //     const bounds = gameConfigManager.current.tableBounds;
        
    //     // mesh.scaling.z affects the effective size
    //     const baseDepth = gameConfigManager.current.paddle.depth;
    //     const effectiveDepth = baseDepth * this.mesh.scaling.z;
    //     const halfDepth = effectiveDepth / 2;

    //     // Clamp to bounds
    //     if (this.mesh.position.z - halfDepth < bounds.zMin) {
    //         this.mesh.position.z = bounds.zMin + halfDepth;
    //     }
    //     if (this.mesh.position.z + halfDepth > bounds.zMax) {
    //         this.mesh.position.z = bounds.zMax - halfDepth;
    //     }
    // }

    public move(dt: number): void {
        const dz = this.velocity * dt;
        this.mesh.position.z += dz;

        const bounds = gameConfigManager.current.tableBounds;
        
        // Get the ACTUAL depth from config (mesh was created with this size)
        const currentDepth = gameConfigManager.current.paddle.depth;
        const halfDepth = currentDepth / 2;

        // Clamp to bounds
        if (this.mesh.position.z - halfDepth < bounds.zMin) {
            this.mesh.position.z = bounds.zMin + halfDepth;
        }
        if (this.mesh.position.z + halfDepth > bounds.zMax) {
            this.mesh.position.z = bounds.zMax - halfDepth;
        }
    }
}