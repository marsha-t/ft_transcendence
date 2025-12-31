import * as BABYLON from "babylonjs";
import { Paddle } from "../graphics/Paddle";
import { Ball } from "../graphics/Ball";
import { InputHandler } from "../graphics/InputHandler";
import { aiWebSocketService } from "../services/websocket/WebsocketServices";
import { GameState } from "../services/websocket/types";
import { gameConfigManager } from "./GameConfigManager";
import { PowerUpManager, PowerUpTypes } from "./PowerUps";

interface AIConfig {
    aiEnabled: boolean;
    aiSide: 'LEFT' | 'RIGHT';
}

/**
 * - Initializing BabylonJS engine and scene
 * - Running the fixed-step physics loop
 * - Managing paddles, ball, collisions, and scoring
 * - Handling power-ups and temporary gameplay effects
 * - Streaming real-time game state to AI via WebSocket
 *
 * Ownership:
 * - Owns BabylonJS Engine & Scene
 * - Owns all meshes, materials, textures
 * - Owns render loop lifecycle
 *
 * Lifecycle:
 * new PongGame() -> resume() / pause() -> dispose()
 *
 * IMPORTANT:
 * - This class has NO DOM knowledge
 * - This class does NOT perform navigation
 * - Cleanup MUST be done via dispose()
 */
export class PongGame {
    private canvas: HTMLCanvasElement;
    private engine!: BABYLON.Engine;
    private scene!: BABYLON.Scene;

    private rightPaddle!: Paddle;
    private leftPaddle!: Paddle;
    private ball!: Ball;
    private input!: InputHandler;
    private onScoreCallback?: (scoringSide: 'LEFT' | 'RIGHT') => void;
    private isPaused: boolean = true;
    private aiConfig: AIConfig;
    private isAIGame: boolean = false;
    private enlargedPaddle: 'LEFT' | 'RIGHT' | null = null;
    private enlargedPaddleSize: number = 2.0; // Multiplier
    private powerUpManager: PowerUpManager | null = null;
    private activePowerUps: Map<PowerUpTypes, number> = new Map();

    // ============================================================
    // INITIALIZATION & GAME LOOP
    // ============================================================
    constructor(canvas: HTMLCanvasElement, 
                onScore?: (side: 'LEFT' | 'RIGHT') => void,
                aiConfig: AIConfig = { aiEnabled: false, aiSide: 'LEFT'}) {
        this.canvas = canvas;
        this.onScoreCallback = onScore; // Store callback

        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = new BABYLON.Scene(this.engine);
        this.aiConfig = aiConfig;
        this.isAIGame = aiConfig.aiEnabled;

        this.createCamera();
        this.createLight();
        this.createRoom();
        this.createTable();
        this.createPaddles();
        this.createBall();
        this.input = new InputHandler(this.leftPaddle, this.rightPaddle);

        //Initial power Ups
        if(gameConfigManager.current.powerUps.enabled){
            this.powerUpManager = new PowerUpManager(this.scene);
        }
        
        this.engine.runRenderLoop(() => {
            if (this.isPaused) {
                this.scene.render();
                return;
            }

            const rawDt = this.engine.getDeltaTime() / 1000;
            // Prevent huge dt when tab is inactive
            const dt = Math.min(rawDt, 1 / 30);

            const subDt = 1 / 120; // 120 Hz physics = no more tunneling
            let accumulator = 0;
            accumulator += dt;

            while (accumulator >= subDt) {
                // Physics updates (run many times per frame)
                this.input.update(subDt);
                this.ball.update(subDt);
                this.checkCollisions();

                // Power-up collection (inside physics loop!)
                if (this.powerUpManager) {
                    const collectedType = this.powerUpManager.checkCollisionPowerUp(
                        this.ball.mesh.position.x,
                        this.ball.mesh.position.z,
                        gameConfigManager.current.ball.radius
                    );
                    if (collectedType) {
                        this.activePowerUp(collectedType);
                    }
                }

                // Scoring (inside physics loop so ball can’t tunnel past the goal line)
                this.checkScoring();

                accumulator -= subDt;
            }

            this.updatePowerUpVisuals();

            if (this.isAIGame) {
                this.streamGameStateToAI();
            }

            this.scene.render();
        });
    }

    // ===================
    // FRAME-LEVEL UPDATES
    // ===================
    private updatePowerUpVisuals(): void {
        if (!this.powerUpManager) return;
    
        const currentTime = Date.now();
    
        // Visuals + spawning only (time-based, frame-rate independent)
        this.powerUpManager.updatePowerUp(currentTime);
        
        // Effects expiration (once/frame ok)
        this.updateActivePowerUpEffects(currentTime);
    }

    // ================
    // POWER-UP EFFECTS
    // ================
    private activePowerUp(type: PowerUpTypes): void {
        const config = gameConfigManager.current.powerUps;
        const endTime = Date.now() + config.duration;

        this.activePowerUps.set(type, endTime);

        switch(type){
            case 'SPEED_BOOST':
                // Increase ball speed by 50%
                const speedMultiplier = 2.0;
                this.ball.speed.x *= speedMultiplier;
                this.ball.speed.z *= speedMultiplier;

                const ballMat = this.ball.mesh.material as BABYLON.StandardMaterial;
                if (ballMat) {
                    ballMat.emissiveColor = new BABYLON.Color3(1, 0, 0); // Red
                }
                break;

            case 'ENLARGE_PADDLE':
                this.enlargePaddle();
                break;
            case 'SLOW_MOTION':
                // Slow ball by 50%
                const slowMultiplier = 0.3;
                this.ball.speed.x *= slowMultiplier;
                this.ball.speed.z *= slowMultiplier;
                
                // Change ball color to BLUE
                const ballMatSlow = this.ball.mesh.material as BABYLON.StandardMaterial;
                if (ballMatSlow) {
                    ballMatSlow.emissiveColor = new BABYLON.Color3(0, 0.5, 1); // Blue
                }
                break;
        }
    }

    private enlargePaddle(): void {
        const originalDepth = gameConfigManager.current.paddle.depth;
        const paddleScale = 2.0;

        const paddleToEnlarge = this.ball.speed.x > 0 
            ? this.rightPaddle 
            : this.leftPaddle;
        
        // which paddle is enlarged
        this.enlargedPaddle = this.ball.speed.x > 0 ? 'RIGHT' : 'LEFT';
        this.enlargedPaddleSize = paddleScale;

        // Recreate mesh with larger size
        const pos = paddleToEnlarge.mesh.position.clone();
        const name = paddleToEnlarge.mesh.name;
        paddleToEnlarge.mesh.dispose();
        
        const newDepth = originalDepth * paddleScale;  //Calculate new depth
        
        paddleToEnlarge.mesh = BABYLON.MeshBuilder.CreateBox(
            name,
            {
                width: gameConfigManager.current.paddle.width,
                height: gameConfigManager.current.paddle.height,
                depth: newDepth  // Use scaled depth
            },
            this.scene
        );
        paddleToEnlarge.mesh.position = pos;
        
        // Update the paddle's tracked depth
        paddleToEnlarge.updateMeshDepth(newDepth);
        
        const paddleMat = new BABYLON.StandardMaterial(name + "Mat", this.scene);
        paddleMat.diffuseColor = new BABYLON.Color3(0, 0, 0.4);
        paddleMat.emissiveColor = new BABYLON.Color3(0, 1, 0); // Green
        paddleToEnlarge.mesh.material = paddleMat;
        
    }

    private updateActivePowerUpEffects(currentTime: number): void {
        this.activePowerUps.forEach((endTime, type) => {
            if(currentTime >= endTime){
                this.deactivatePowerUp(type);
                this.activePowerUps.delete(type);
            }
        });
    }

    private deactivatePowerUp(type: PowerUpTypes): void {
        switch (type) {
            case 'SPEED_BOOST':
                // Restore speed
                this.ball.speed.x /= 2.0;
                this.ball.speed.z /= 2.0;   

                const ballMat = this.ball.mesh.material as BABYLON.StandardMaterial;
                if (ballMat) {
                    ballMat.emissiveColor = new BABYLON.Color3(0.95, 0.6, 0.2); // Original orange
                }
                break;

            case 'ENLARGE_PADDLE':
                this.delargePaddle();
                break;

            case 'SLOW_MOTION':
                // Restore speed (reverse the division)
                this.ball.speed.x /= 0.3;
                this.ball.speed.z /= 0.3;

                const ballMatSlow = this.ball.mesh.material as BABYLON.StandardMaterial;
                if (ballMatSlow) {
                    ballMatSlow.emissiveColor = new BABYLON.Color3(0.95, 0.6, 0.2); // Original orange
                }
                break;
        }
    }

    private delargePaddle(): void {
        //Clear enlarged paddle state
        this.enlargedPaddle = null;
        this.enlargedPaddleSize = 1.0;
        
        // Recreate both paddles at normal size
        [this.leftPaddle, this.rightPaddle].forEach(paddle => {
            const pos = paddle.mesh.position.clone();
            const name = paddle.mesh.name;
            paddle.mesh.dispose();
            
            const normalDepth = gameConfigManager.current.paddle.depth;  //Get normal depth
            
            paddle.mesh = BABYLON.MeshBuilder.CreateBox(
                name,
                {
                    width: gameConfigManager.current.paddle.width,
                    height: gameConfigManager.current.paddle.height,
                    depth: normalDepth  // Use normal depth
                },
                this.scene
            );
            paddle.mesh.position = pos;
            
            //Restore the paddle's tracked depth
            paddle.updateMeshDepth(normalDepth);
            
            const paddleMat = new BABYLON.StandardMaterial(name + "Mat", this.scene);
            paddleMat.diffuseColor = new BABYLON.Color3(0, 0, 0.4);
            paddleMat.emissiveColor = new BABYLON.Color3(0, 0, 0);
            paddle.mesh.material = paddleMat;
        });
    }

    // ========================
    // AI GAME STATE STREAMING
    // ========================
    private streamGameStateToAI(): void {
        const gameState: GameState = {
            ball: {
                x: this.ball.mesh.position.x,
                z: this.ball.mesh.position.z,
                vx: this.ball.speed.x,
                vz: this.ball.speed.z
            },
            arena: {
                zMin: gameConfigManager.current.tableBounds.zMin,
                zMax: gameConfigManager.current.tableBounds.zMax
            },
            aiPaddle: {
                x: this.leftPaddle.mesh.position.x,
                z: this.leftPaddle.mesh.position.z
            },
            oppPaddle: {
                x: this.rightPaddle.mesh.position.x,
                z: this.rightPaddle.mesh.position.z,
                vz: this.rightPaddle.velocity
            },
            constants: {
                paddleDepth: gameConfigManager.current.paddle.depth,
                ballRadius: gameConfigManager.current.ball.radius,
                maxBounceAngle: gameConfigManager.current.ball.maxBounceAngle,
                paddleInfluence: gameConfigManager.current.paddle.velocityInfluence,
                speedIncrement: gameConfigManager.current.ball.speedIncrement,
                maxSpeed: gameConfigManager.current.ball.maxSpeed
            }
        };

        aiWebSocketService.sendGameState(gameState);
    }

    // ==================
    // PUBLIC CONTROL API
    // ==================
    public sendGameConstants(): void {
        if (!this.isAIGame) return;

        const constants = {
            table: {
                width: gameConfigManager.current.table.width,
                depth: gameConfigManager.current.table.depth
            },
            paddle: {
                width: gameConfigManager.current.paddle.width,
                depth: gameConfigManager.current.paddle.depth,
                speed: gameConfigManager.current.paddle.speed
            },
            ball: {
                radius: gameConfigManager.current.ball.radius,
                speed: gameConfigManager.current.ball.speed,
                maxSpeed: gameConfigManager.current.ball.maxSpeed
            },
            tableBounds: gameConfigManager.current.tableBounds
        };

        aiWebSocketService.sendGameStart(constants);
    }

    public applyAIDirection(direction: "UP" | "DOWN" | "NONE") {

        if (!this.input) return;

        this.input.applyAIDirection(direction);
    }

    // ===========================
    // RESOURCE CLEANUP (CRITICAL)
    // ===========================
    public dispose(): void {
        if (this.isAIGame) {
            aiWebSocketService.disconnect();
        }

        if(this.powerUpManager){
            this.powerUpManager.cleanPowerUp();
            this.powerUpManager = null;
        }

        this.activePowerUps.forEach((_, type) => {
            this.deactivatePowerUp(type);
        });
        this.activePowerUps.clear();
        this.engine.stopRenderLoop();
        if(this.scene){
            this.scene.mesh.forEach((mesh: BABYLON.AbstractMesh) => {
                if(mesh.geometry)
                    mesh.geometry.dispose();
                mesh.dispose();
            });

            this.scene.materials.forEach((material: BABYLON.Material) => {
                material.dispose();
            });

            this.scene.texture.forEach((texture: BABYLON.BaseTexture) => {
                texture.dispose();
            });

            this.scene.dispose();
        }
        if(this.engine)
            this.engine.dispose();

        this.scene = null as any;
        this.engine = null as any;
        this.leftPaddle = null as any;
        this.rightPaddle = null as any;
        this.ball = null as any;
        this.input = null as any;
    }

    public pause(): void {
        this.isPaused = true;
    }

    public resume(): void {
        this.isPaused = false;
    }

    // ====================
    // SCORING & BALL RESET
    // ====================
    private checkScoring(): void {
        const t = gameConfigManager.current.table;
        const ball = this.ball.mesh;
        const xMin = -t.width / 2;
        const xMax = t.width / 2;

        // Ball went past left paddle - RIGHT player scores
        if (ball.position.x < xMin) {
            if (this.onScoreCallback) {
                this.onScoreCallback('RIGHT');
            }
            this.resetBall();
        }
        // Ball went past right paddle - LEFT player scores
        else if (ball.position.x > xMax) {
            if (this.onScoreCallback) {
                this.onScoreCallback('LEFT');
            }
            this.resetBall();
        }
    }

    private async resetBall(): Promise<void> {
        const t = gameConfigManager.current.table;
        const tableY = -1;
        const ballRadius = gameConfigManager.current.ball.radius;
        const ballY = tableY + t.height / 2 + ballRadius;
    
        this.ball.mesh.position.set(0, ballY, 0);
        this.ball.speed.x = 0; // stop the ball during pause
        this.ball.speed.z = 0;

         // Clear active power-up effects when ball resets
         this.activePowerUps.forEach((_, type) => {
            this.deactivatePowerUp(type);
        });
        this.activePowerUps.clear();

        // Wait for 1.5 seconds before launching
        await new Promise((resolve) => setTimeout(resolve, 500)); 

        // Launch the ball
        this.ball.speed.x = (Math.random() > 0.5 ? 1 : -1) * gameConfigManager.current.ball.speed.x;
        this.ball.speed.z = (Math.random() - 0.5) * 2;
        // Re-apply cap if needed
        const maxSpeed = gameConfigManager.current.ball.maxSpeed;
        const currentSpeed = this.ball.speed.length();
        if (currentSpeed > maxSpeed) {
            this.ball.speed.normalize().scaleInPlace(maxSpeed);
        }
    }

    // ==============================
    // SCENE CONSTRUCTION (BABYLONJS)
    // ==============================
    private createCamera(): void {
        const c = gameConfigManager.current.camera;
        const camera = new BABYLON.ArcRotateCamera( "Camera", c.alpha, c.beta, c.radius,
            new BABYLON.Vector3(c.target.x, c.target.y, c.target.z),
            this.scene
        );
        camera.attachControl(this.canvas, true);
        camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");
    }

    private createLight(): void {
        const light = new BABYLON.HemisphericLight(
            "light",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        light.intensity = gameConfigManager.current.light.intensity;
    }

    private createRoom(): void {
        const r = gameConfigManager.current.room;
        
        const wallMaterial = new BABYLON.StandardMaterial("roomWallMat", this.scene);
        wallMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.75, 0.8);
        wallMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    
        // Floor
        const floor = BABYLON.MeshBuilder.CreateGround(
            "floor",
            { width: r.width, height: r.depth + 14 }, 
            this.scene
        );
        floor.position.y = -5;
        const floorMat = new BABYLON.StandardMaterial("floorMat", this.scene);
        const floorTexture = new BABYLON.Texture("/walls/floor.jpg", this.scene);
        floorMat.diffuseTexture = floorTexture;
        floorTexture.level = 0.6;
        floorMat.diffuseColor = new BABYLON.Color3(0.6, 0.6, 0.6);

        floor.material = floorMat;
    
        // Ceiling/Roof
        const ceiling = BABYLON.MeshBuilder.CreateGround(
            "ceiling",
            { width: r.width, height: r.depth + 14 },
            this.scene
        );
        ceiling.position.y = r.height;
        ceiling.rotation.z = Math.PI;
        ceiling.material = wallMaterial;
    
        // Back wall (behind left paddle)
        const backWall = BABYLON.MeshBuilder.CreateBox(
            "backWall",
            { width: r.width, height: r.height, depth: 1 },
            this.scene
        );
        backWall.position.set(0, r.height / 2 - 5, -r.depth / 2 - 7);
        backWall.rotation.y = Math.PI;
        const backWallMat = new BABYLON.StandardMaterial("backWallMat", this.scene);
        const texture = new BABYLON.Texture("/walls/back.jpg", this.scene);
        backWallMat.diffuseTexture = texture;
        backWallMat.specularColor = new BABYLON.Color3(0, 0, 0);
        backWall.material = backWallMat;

        // Front wall (behind right paddle)
        const frontWall = BABYLON.MeshBuilder.CreateBox(
            "frontWall",
            { width: r.width, height: r.height, depth: 1 },
            this.scene
        );
        frontWall.position.set(0, r.height / 2 - 5, r.depth / 2 + 7);
        const frontWallMat = new BABYLON.StandardMaterial("frontWallMat", this.scene);
        const frontTexture = new BABYLON.Texture("/walls/front.jpg", this.scene);
        frontWallMat.diffuseTexture = frontTexture;
        frontWallMat.specularColor = new BABYLON.Color3(0, 0, 0);
        frontWall.material = frontWallMat;
    
        // Left side wall - EXTEND DEPTH
        const leftWall = BABYLON.MeshBuilder.CreateBox(
            "leftWall",
            { width: 1, height: r.height, depth: r.depth + 14 },
            this.scene
        );
        leftWall.position.set(-r.width / 2, r.height / 2 - 5, 0);
        
        const leftWallMat = new BABYLON.StandardMaterial("leftWallMat", this.scene);
        const leftTexture = new BABYLON.Texture("/walls/bricks.jpg", this.scene);
        leftTexture.wAng = Math.PI / 2;
        leftWallMat.diffuseTexture = leftTexture;
        leftWall.material = leftWallMat;
    
        // Right side wall
        const rightWall = BABYLON.MeshBuilder.CreateBox(
            "rightWall",
            { width: 1, height: r.height, depth: r.depth + 14 },
            this.scene
        );
        rightWall.position.set(r.width / 2, r.height / 2 - 5, 0);
        const rightWallMAt = new BABYLON.StandardMaterial("rightWallMAt", this.scene);
        const rightTexture = new BABYLON.Texture("/walls/bricks.jpg", this.scene);
        rightTexture.wAng = Math.PI / 2;
        rightWallMAt.diffuseTexture = rightTexture;
        rightWall.material = rightWallMAt;
    }

    private createTable():void {
        const t = gameConfigManager.current.table;

        const table = BABYLON.MeshBuilder.CreateBox("table",
             {width: t.width, height: t.height, depth: t.depth}, 
             this.scene);

        table.position.y = -1;

        const tableMaterial = new BABYLON.StandardMaterial("tableMat", this.scene);
        tableMaterial.diffuseColor = new BABYLON.Color3(0, 0.4, 0);
        table.material = tableMaterial;

        const lineMaterial = new BABYLON.StandardMaterial("lineMat", this.scene);
        lineMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1); // white

        this.createSideWalls(table);

        this.createCenterLine(table, lineMaterial);
    }

    private createCenterLine(table: BABYLON.Mesh, lineMaterial: BABYLON.StandardMaterial): void {
        const dashLength = 0.35;
        const dashGap = 0.075;
        const totalDepth = 8.8;
        let currentZ = -totalDepth / 2;

        while (currentZ < totalDepth / 2) {
            const dash = BABYLON.MeshBuilder.CreateBox(
                "dash",
                { width: 0.1, height: 0.08, depth: dashLength },
                this.scene
            );
            dash.position.x = 0; // Center on X-axis
            dash.position.y = 0.25; // Match table surface
            dash.position.z = currentZ + dashLength / 2;
            dash.material = lineMaterial;
            dash.parent = table;

            currentZ += dashLength + dashGap;
        }
    }

    private createSideWalls(table: BABYLON.Mesh): void {
        const t = gameConfigManager.current.table;
        const w = gameConfigManager.current.wall;
    
        const wallMaterial = new BABYLON.StandardMaterial("wallMat", this.scene);
        wallMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
    
        // Position walls EXACTLY at table edges (±depth/2)
        const zOffset = t.depth / 2;
        
        // Make walls FULL WIDTH (no gaps on sides)
        const wallWidth = t.width;
    
        // Top wall (at -Z boundary)
        const topWall = BABYLON.MeshBuilder.CreateBox(
            "topWall",
            {
                width: wallWidth,
                height: w.height,
                depth: w.thickness
            },
            this.scene
        );
        topWall.position.set(0, t.height / 2, -zOffset);
        topWall.material = wallMaterial;
        topWall.parent = table;
    
        // Bottom wall (at +Z boundary)
        const bottomWall = BABYLON.MeshBuilder.CreateBox(
            "bottomWall",
            {
                width: wallWidth,
                height: w.height,
                depth: w.thickness
            },
            this.scene
        );
        bottomWall.position.set(0, t.height / 2, zOffset);
        bottomWall.material = wallMaterial;
        bottomWall.parent = table;
    }

    private createBall(): void {
        const t = gameConfigManager.current.table;

        const tableY = -1; // same value used for table.position.y
        const ballRadius = gameConfigManager.current.ball.radius; // diameter = 0.6 → radius = 0.3

        // Put ball on table surface
        const ballY = tableY + t.height / 2 + ballRadius;

        this.ball = new Ball(this.scene, new BABYLON.Vector3(0, ballY, 0), gameConfigManager.current.ball.diameter);
    }

    private createPaddles(): void {
        const t = gameConfigManager.current.table;
        const p = gameConfigManager.current.paddle;

        const offset = gameConfigManager.current.paddle.offset; // how much inside the table
        const leftX = -t.width / 2 + p.width / 2 + offset;
        const rightX = t.width / 2 - p.width / 2 - offset;


        const tableY = -1; // your table.position.y
        const y = tableY + t.height / 2 + p.height / 2;

        this.leftPaddle = new Paddle(this.scene, new BABYLON.Vector3(leftX, y, 0), "leftPaddle");
        this.rightPaddle = new Paddle(this.scene, new BABYLON.Vector3(rightX, y, 0), "rightPaddle");
    }

    // =============================
    // PHYSICS & COLLISION DETECTION
    // =============================
    private checkCollisions(): void {
        this.checkWallBounce();
        this.checkPaddleBounce();
    }

    private checkWallBounce(): void {
        const t = gameConfigManager.current.table;
        const ball = this.ball.mesh;
        const r = gameConfigManager.current.ball.radius;
        const wallThickness = gameConfigManager.current.wall.thickness;
        const wallInnerZ = (t.depth / 2) - (wallThickness / 2);
        const minZ = -wallInnerZ;
        const maxZ = wallInnerZ;
    
        // Check collision with ball radius
        if (ball.position.z - r <= minZ) {
            // Hit top wall
            ball.position.z = minZ + r;  // Clamp position
            this.ball.bounceZ();
        } 
        else if (ball.position.z + r >= maxZ) {
            // Hit bottom wall
            ball.position.z = maxZ - r;  // Clamp position
            this.ball.bounceZ();
        }
    }

    private checkPaddleBounce(): void {
        const ball = this.ball.mesh;
        const left = this.leftPaddle.mesh;
        const right = this.rightPaddle.mesh;
    
        const r = gameConfigManager.current.ball.radius;
        const halfW = gameConfigManager.current.paddle.width / 2;
        
        // Get the actual depth for each paddle (accounting for power-ups)
        const baseDepth = gameConfigManager.current.paddle.depth;
        const leftHalfD = this.enlargedPaddle === 'LEFT' 
            ? (baseDepth * this.enlargedPaddleSize) / 2 
            : baseDepth / 2;
        const rightHalfD = this.enlargedPaddle === 'RIGHT' 
            ? (baseDepth * this.enlargedPaddleSize) / 2 
            : baseDepth / 2;
    
        const maxBounceAngle = gameConfigManager.current.ball.maxBounceAngle;
        const paddleInfluence = gameConfigManager.current.paddle.velocityInfluence;
    
        // Left paddle collision - uses leftHalfD (may be enlarged)
        if (
            ball.position.x - r <= left.position.x + halfW &&
            ball.position.x >= left.position.x - halfW &&
            Math.abs(ball.position.z - left.position.z) <= leftHalfD
        ) {
            const hitFactor = (ball.position.z - left.position.z) / leftHalfD;
            this.ball.bounceX();
            this.ball.applySpeedIncrement();
            this.ball.speed.z = hitFactor * maxBounceAngle * Math.abs(this.ball.speed.x) + (this.leftPaddle.velocity * paddleInfluence);
        }
    
        // Right paddle collision - uses rightHalfD (may be enlarged)
        if (
            ball.position.x + r >= right.position.x - halfW &&
            ball.position.x <= right.position.x + halfW &&
            Math.abs(ball.position.z - right.position.z) <= rightHalfD
        ) {
            const hitFactor = (ball.position.z - right.position.z) / rightHalfD;
            this.ball.bounceX();
            this.ball.applySpeedIncrement();
            this.ball.speed.z = hitFactor * maxBounceAngle * Math.abs(this.ball.speed.x) + (this.rightPaddle.velocity * paddleInfluence);
        }
    }
}
