import * as BABYLON from "babylonjs";
import { Paddle } from "../graphics/Paddle";
import { Ball } from "../graphics/Ball";
import { InputHandler } from "../graphics/InputHandler";
// import { GameConfig } from "./GameConfig";
import { aiWebSocketService } from "../services/websocket/WebsocketServices";
import { GameState } from "../services/websocket/types";
import { gameConfigManager } from "./GameConfigManager";

interface AIConfig {
    aiEnabled: boolean;
    aiSide: 'LEFT' | 'RIGHT';
}

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

        // Render loop
        this.engine.runRenderLoop(() => {
            const dt = this.engine.getDeltaTime() / 1000;
            if (!this.isPaused){
                this.input.update(dt);
                this.ball.update(dt);
                this.checkCollisions();
                this.checkScoring();

                if(this.isAIGame)
                    this.streamGameStateToAI();
                this.scene.render();
            }
            this.scene.render();
        });
    }

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

    public dispose(): void {
        if (this.isAIGame) {
            aiWebSocketService.disconnect();
        }
        this.engine.dispose();
    }


    public pause(): void {
        this.isPaused = true;
    }

    public resume(): void {
        this.isPaused = false;
    }

    public isRunning(): boolean {
        return !this.isPaused;
    }

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
            { width: r.width, height: r.depth + 14 }, // ADD 14 to match floor
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
            { width: 1, height: r.height, depth: r.depth + 14 }, // ADD 14 to depth
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
            { width: 1, height: r.height, depth: r.depth + 14 }, // ADD 14 to depth
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

        // Z position offset (half depth minus a small gap)
        const zOffset = (t.depth / 2) - w.thickness;

        // Top wall
        const topWall = BABYLON.MeshBuilder.CreateBox(
            "topWall",
            {
                width: t.width - 2,      // slightly shorter than table width
                height: w.height,
                depth: w.thickness
            },
            this.scene
        );
        topWall.position.set(0, t.height / 2, -zOffset);
        topWall.material = wallMaterial;
        topWall.parent = table;

        const bottomWall = BABYLON.MeshBuilder.CreateBox(
            "bottomWall",
            {
                width: t.width - 2,
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


    //ball movements

    private checkCollisions(): void {
        this.checkWallBounce();
        this.checkPaddleBounce();
    }

    private checkWallBounce(): void {
        const bounds = gameConfigManager.current.tableBounds;
        const ball = this.ball.mesh;
        const r = gameConfigManager.current.ball.radius;

        if (ball.position.z - r <= bounds.zMin || ball.position.z + r >= bounds.zMax) {
                this.ball.bounceZ();
            }
    }

    private checkPaddleBounce(): void {
        const ball = this.ball.mesh;
        const left = this.leftPaddle.mesh;
        const right = this.rightPaddle.mesh;
    
        const r = gameConfigManager.current.ball.radius;
        const halfW = gameConfigManager.current.paddle.width / 2;
        const halfD = gameConfigManager.current.paddle.depth / 2;
    
        const maxBounceAngle = gameConfigManager.current.ball.maxBounceAngle;
        const paddleInfluence = gameConfigManager.current.paddle.velocityInfluence;
    
        // Left paddle collision (unchanged logic, but now uses full velocity)
        if (
            ball.position.x - r <= left.position.x + halfW &&
            ball.position.x >= left.position.x - halfW &&
            Math.abs(ball.position.z - left.position.z) <= halfD
        ) {
            const hitFactor = (ball.position.z - left.position.z) / halfD;
            this.ball.bounceX();
    
            // Increment speed post-bounce (elasticity + escalation)
            this.ball.applySpeedIncrement();
    
            // Set Z with wider angle + momentum transfer
            this.ball.speed.z = hitFactor * maxBounceAngle * Math.abs(this.ball.speed.x) + (this.leftPaddle.velocity * paddleInfluence);
        }
    
        // Right paddle (symmetric, unchanged)
        if (
            ball.position.x + r >= right.position.x - halfW &&
            ball.position.x <= right.position.x + halfW &&
            Math.abs(ball.position.z - right.position.z) <= halfD
        ) {
            const hitFactor = (ball.position.z - right.position.z) / halfD;
            this.ball.bounceX();
            this.ball.applySpeedIncrement();
            this.ball.speed.z = hitFactor * maxBounceAngle * Math.abs(this.ball.speed.x) + (this.rightPaddle.velocity * paddleInfluence);
        }
    }
}
