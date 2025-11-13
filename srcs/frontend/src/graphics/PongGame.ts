import * as BABYLON from "babylonjs";
import { Paddle } from "../graphics/Paddle";
import { Ball } from "../graphics/Ball";
import { InputHandler } from "../graphics/InputHandler";
import { GameConfig } from "./GameConfig";

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

    constructor(canvas: HTMLCanvasElement, onScore?: (side: 'LEFT' | 'RIGHT') => void) {
        this.canvas = canvas;
        this.onScoreCallback = onScore; // Store callback

        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = new BABYLON.Scene(this.engine);

        this.createCamera();
        this.createLight();
        this.createRoom();
        this.createTable();
        this.createPaddles();
        this.createBall();
        this.input = new InputHandler(this.leftPaddle, this.rightPaddle);

        // Render loop
        this.engine.runRenderLoop(() => {
            if (!this.isPaused){
                this.ball.update();
                this.checkCollisions();
                this.checkScoring();
                this.scene.render();
            }
            this.scene.render();
        });
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
        const t = GameConfig.table;
        const ball = this.ball.mesh;
        const xMin = -t.width / 2;
        const xMax = t.width / 2;

        // Ball went past left paddle - RIGHT player scores
        if (ball.position.x < xMin) {
            console.log("Ball went left! RIGHT scores");
            if (this.onScoreCallback) {
                this.onScoreCallback('RIGHT');
            }
            this.resetBall();
        }
        // Ball went past right paddle - LEFT player scores
        else if (ball.position.x > xMax) {
            console.log("Ball went right! LEFT scores");
            if (this.onScoreCallback) {
                this.onScoreCallback('LEFT');
            }
            this.resetBall();
        }
    }

    private resetBall(): void {
        const t = GameConfig.table;
        const tableY = -1;
        const ballRadius = 0.3;
        const ballY = tableY + t.height / 2 + ballRadius;

        this.ball.mesh.position.set(0, ballY, 0);
        // Optionally reverse ball direction
        this.ball.speed.x *= -1;
    }

    private createCamera(): void {
        const c = GameConfig.camera;
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
        light.intensity = 1;
    }

    private createRoom(): void {
        const r = GameConfig.room;
        
        const wallMaterial = new BABYLON.StandardMaterial("roomWallMat", this.scene);
        wallMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.75, 0.8);
        wallMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    
        // Floor
        const floor = BABYLON.MeshBuilder.CreateGround(
            "floor",
            { width: r.width, height: r.depth + 14 }, // ADD 14 (7 + 7) to match wall extension
            this.scene
        );
        floor.position.y = -5;
        const floorMaterial = new BABYLON.StandardMaterial("floorMat", this.scene);
        floorMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.55, 0.6);
        floor.material = floorMaterial;
    
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

        // Create a material for the back wall
        const backWallMat = new BABYLON.StandardMaterial("backWallMat", this.scene);
        const texture = new BABYLON.Texture("/walls/back.jpg", this.scene);

        // Check if texture loads
        texture.onLoadObservable.add(() => {
            console.log("Back wall texture loaded successfully");
        });

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
        leftWall.material = wallMaterial;
    
        // Right side wall - EXTEND DEPTH
        const rightWall = BABYLON.MeshBuilder.CreateBox(
            "rightWall",
            { width: 1, height: r.height, depth: r.depth + 14 }, // ADD 14 to depth
            this.scene
        );
        rightWall.position.set(r.width / 2, r.height / 2 - 5, 0);
        rightWall.material = wallMaterial;
    }


    private createTable():void {
        const t = GameConfig.table;

        const table = BABYLON.MeshBuilder.CreateBox("table",
             {width: t.width, height: t.height, depth: t.depth}, 
             this.scene);

        table.position.y = -1;

        const tableMaterial = new BABYLON.StandardMaterial("tableMat", this.scene);
        tableMaterial.diffuseColor = new BABYLON.Color3(0, 0.6, 0);
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
        const t = GameConfig.table;
        const w = GameConfig.wall;

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
        const t = GameConfig.table;

        const tableY = -1; // same value used for table.position.y
        const ballRadius = 0.3; // diameter = 0.6 → radius = 0.3

        // Put ball on table surface
        const ballY = tableY + t.height / 2 + ballRadius;

        this.ball = new Ball(
            this.scene,
            new BABYLON.Vector3(0, ballY, 0),
            0.6
        );
    }


    private createPaddles(): void {
        const t = GameConfig.table;
        const p = GameConfig.paddle;

        const offset = GameConfig.paddle.offset; // how much inside the table
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
    const bounds = GameConfig.tableBounds;
    const ball = this.ball.mesh;
    const r = 0.3; // ball radius

    if (ball.position.z - r <= bounds.zMin || ball.position.z + r >= bounds.zMax) {
            this.ball.bounceZ();
        }
    }


    private checkPaddleBounce(): void {
    const ball = this.ball.mesh;
    const left = this.leftPaddle.mesh;
    const right = this.rightPaddle.mesh;

    const r = 0.3; // ball radius
    const halfW = GameConfig.paddle.width / 2;  // 0.1
    const halfD = GameConfig.paddle.depth / 2;  // 1.5

    // Left paddle collision
    if (
        ball.position.x - r <= left.position.x + halfW &&
        ball.position.x >= left.position.x - halfW &&
        Math.abs(ball.position.z - left.position.z) <= halfD
    ) {
        this.ball.bounceX();
    }

    // Right paddle collision
    if (
        ball.position.x + r >= right.position.x - halfW &&
        ball.position.x <= right.position.x + halfW &&
        Math.abs(ball.position.z - right.position.z) <= halfD
        ) {
            this.ball.bounceX();
        }
    }
}
