import * as BABYLON from '@babylonjs/core';
import { gameConfigManager } from "./GameConfigManager";

export type PowerUpTypes =  'SPEED_BOOST' | 'ENLARGE_PADDLE' | 'SLOW_MOTION';


interface PowerUp {
    mesh: BABYLON.Mesh;
    type: PowerUpTypes;
    position: {x: number; z: number};
}

export class PowerUpManager{
    private powerUps: PowerUp[]= [];
    private scene: BABYLON.Scene;
    private lastSpawnTime: number = 0;


    constructor(scene: BABYLON.Scene){
        this.scene = scene;
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
            powerUp.mesh.rotation.y += 0.02;
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
        const x = (Math.random() - 0.5) * 15;
        const z = (Math.random() - 0.5) * 8;

        //Create a sphere
        const mesh = BABYLON.MeshBuilder.CreateSphere(
            `powerup_${Date.now()}`,
            {diameter: 0.8},
            this.scene
        );
        mesh.position = new BABYLON.Vector3(x, 0.5, z);

        //Color of the sphere
        const material = new BABYLON.StandardMaterial('powerUpMat', this.scene);
        switch(type){
            case 'SPEED_BOOST':
            material.emissiveColor = new BABYLON.Color3(1, 0, 0);
            break;

            case 'ENLARGE_PADDLE':
            material.emissiveColor = new BABYLON.Color3(0, 1, 0);
            break;

            case 'SLOW_MOTION':
            material.emissiveColor = new BABYLON.Color3(0, 0, 1);
            break;
        }
        mesh.material = material;
        this.powerUps.push({ mesh, type, position: { x, z } });

        console.log(`Spawned ${type} at (${x.toFixed(1)}, ${z.toFixed(1)})`);

    }

    // Called from PongGame when ball moves
    public checkCollisionPowerUp(ballX: number, ballZ: number, ballR: number): PowerUpTypes | null {
        for(let i = this.powerUps.length -1; i >= 0; i--){
            const powerUp = this.powerUps[i];

            const dx = ballX - powerUp.position.x;
            const dz = ballZ - powerUp.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // Collision! Remove power-up and return type
            if (distance < ballR + 0.4) {
                const type = powerUp.type;
                powerUp.mesh.dispose();

                this.powerUps.splice(i, 1);
                return type;
            }
        }
        return null;
    }

    public cleanPowerUp(): void {
        this.powerUps.forEach(p => p.mesh.dispose());
        this.powerUps = [];
    }
}