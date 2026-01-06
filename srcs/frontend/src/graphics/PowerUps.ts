import * as BABYLON from '@babylonjs/core';
import { gameConfigManager } from "./GameConfigManager";

export type PowerUpTypes =  'SPEED_BOOST' | 'ENLARGE_PADDLE' | 'SLOW_MOTION';

//PowerUp - Internal representation of an active power-up on the table
interface PowerUp {
    mesh: BABYLON.Mesh;
    type: PowerUpTypes;
    position: {x: number; z: number};
    glowLayer?: BABYLON.GlowLayer;
}

/**
 * PowerUpManager - Manages spawning, visuals, collision, and cleanup of power-ups
 *
 * Responsibilities:
 * - Spawns power-ups at regular intervals when enabled
 * - Animates active power-ups (rotation + pulsing scale)
 * - Detects ball collision and triggers collection effect
 * - Applies visual feedback on collection (expanding colored ring)
 * - Provides full cleanup for PongGame.dispose()
 *
 * Ownership:
 * - Owns: All power-up meshes, materials, and glow layer
 * - Owns: Temporary collection effect meshes and intervals
 * - Does NOT own: Scene (reference only)
 *
 * Lifecycle:
 * - Created once per PongGame instance (only if powerUps.enabled = true)
 * - updatePowerUp() called every frame from PongGame
 * - checkCollisionPowerUp() called every physics step
 * - cleanPowerUp() called during PongGame.dispose()
 */
export class PowerUpManager{
    private powerUps: PowerUp[]= [];
    private scene: BABYLON.Scene;
    private lastSpawnTime: number = 0;
    private glowLayer: BABYLON.GlowLayer | null = null;


    constructor(scene: BABYLON.Scene){
        this.scene = scene;
        //Create glow layer for power-ups
        this.glowLayer = new BABYLON.GlowLayer('powerUpGlow', this.scene);
        this.glowLayer.intensity = 1.5;
    }


     // Called every frame from PongGame update()
    public updatePowerUp(currentTime: number): void {
        const config = gameConfigManager.current.powerUps;
        if(!config.enabled)
            return;

        if(currentTime - this.lastSpawnTime > config.spawnInterval){
            this.spawnPowerUp();
            this.lastSpawnTime = currentTime;
        }
        

        this.powerUps.forEach(powerUp => {
            powerUp.mesh.rotation.y += 0.05;
            
            // Pulsing scale effect
            const time = Date.now() * 0.003;
            const scale = 1 + Math.sin(time) * 0.2;
            powerUp.mesh.scaling.setAll(scale);
        });
    }

    private spawnPowerUp(): void {
        const config = gameConfigManager.current.powerUps;
        const types = config.types as PowerUpTypes[];

        if(types.length === 0)
            return;

        // Pick random type
        const type = types[Math.floor(Math.random() * types.length)];

        //Random position
        const x = (Math.random() - 0.5) * 12;
        const z = (Math.random() - 0.5) * 6;

        const tableTopY = -1 +(gameConfigManager.current.table.height / 2); // = -0.75
        const powerUpHeight = 0.5;
        const y = tableTopY+ powerUpHeight / 2; // = -0.75 + 0.25 = -0.5

        //Create a sphere
        const mesh = BABYLON.MeshBuilder.CreateBox(
            `powerup_${Date.now()}`,
            {
                width: 1,
                height: 0.5,
                depth: 0.5
            },
            this.scene
        );
        mesh.position = new BABYLON.Vector3(x, y, z);

        const material = new BABYLON.StandardMaterial('powerUpMat', this.scene);
        material.emissiveColor = this.getColorForType(type);
        material.diffuseColor = this.getColorForType(type);
        material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
        mesh.material = material;

        // Add to glow layer
        if (this.glowLayer) {
            this.glowLayer.addIncludedOnlyMesh(mesh);
        }

        this.powerUps.push({ mesh, type, position: { x, z } });
        console.log(`Spawned ${type} at (${x.toFixed(1)}, ${z.toFixed(1)})`);

    }

    //Helper method for consistent colors
    private getColorForType(type: PowerUpTypes): BABYLON.Color3 {
        switch (type) {
            case 'SPEED_BOOST':
                return new BABYLON.Color3(1, 0, 0); // Bright Red
            case 'ENLARGE_PADDLE':
                return new BABYLON.Color3(0, 1, 0); // Bright Green
            case 'SLOW_MOTION':
                return new BABYLON.Color3(0, 0.5, 1); // Bright Blue
        }
    }

    // Called from PongGame when ball moves
    public checkCollisionPowerUp(ballX: number, ballZ: number, ballR: number): PowerUpTypes | null {
        for(let i = this.powerUps.length -1; i >= 0; i--){
            const powerUp = this.powerUps[i];

            const dx = ballX - powerUp.position.x;
            const dz = ballZ - powerUp.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            const collisionRadius = 1.0;
            // Collision! Remove power-up and return type
            if (distance < ballR + 0.4) {
                const type = powerUp.type;
                this.createCollectionEffect(powerUp.position.x, powerUp.position.z, type);
                
                powerUp.mesh.dispose();

                this.powerUps.splice(i, 1);
                return type;
            }
        }
        return null;
    }

    private createCollectionEffect(x: number, z: number, type: PowerUpTypes): void {
        // Create expanding ring effect
        const ring = BABYLON.MeshBuilder.CreateTorus(
            'collectEffect',
            { diameter: 0.5, thickness: 0.1 },
            this.scene
        );
        ring.position = new BABYLON.Vector3(x, 0.8, z);
        ring.rotation.x = Math.PI / 2;

        const material = new BABYLON.StandardMaterial('effectMat', this.scene);
        material.emissiveColor = this.getColorForType(type);
        material.alpha = 0.8;
        ring.material = material;

        // Animate and dispose
        let scale = 1;
        const interval = setInterval(() => {
            scale += 0.2;
            ring.scaling.setAll(scale);
            material.alpha -= 0.1;

            if (material.alpha <= 0) {
                clearInterval(interval);
                ring.dispose();
            }
        }, 50);
    }
    
    public cleanPowerUp(): void {
        // Dispose all active power-ups
        this.powerUps.forEach(p => {
            if (this.glowLayer) {
                this.glowLayer.removeIncludedOnlyMesh(p.mesh);
            }
            p.mesh.dispose();
        });
        this.powerUps = [];

        // Clear all collection effect intervals
        // this.collectionIntervals.forEach(clearInterval);
        // this.collectionIntervals = [];

        // Dispose shared glow layer
        if (this.glowLayer) {
            this.glowLayer.dispose();
            this.glowLayer = null;
        }

        // console.log("PowerUpManager fully cleaned");
    }
    

}