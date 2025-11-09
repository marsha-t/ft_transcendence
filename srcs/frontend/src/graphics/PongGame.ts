import * as BABYLON from "babylonjs";
import { Paddle } from "../graphics/Paddle";
import { Ball } from "../graphics/Ball";
import { InputHandler } from "../graphics/InputHandler";

export class PongGame {
    private canvas: HTMLCanvasElement;
    private engine!: BABYLON.Engine;
    private scene!: BABYLON.Scene;

    private rightPaddle!: Paddle;
    private leftPaddle!: Paddle;
    private ball!: Ball;
    private input!: InputHandler;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        // Corrected Engine
        this.engine = new BABYLON.Engine(this.canvas, true);

        // Scene
        this.scene = new BABYLON.Scene(this.engine);


        this.createCamera();
        this.createLight();
        this.createTable();
        this.createPaddles();
        this.createBall();
        this.input = new InputHandler(this.leftPaddle, this.rightPaddle);

        // Render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    private createCamera(): void {
        const camera = new BABYLON.ArcRotateCamera(
            "Camera",
            3 * Math.PI / 2,  // alpha: rotate 180° to flip the view
            Math.PI / 3,      // beta: angled view
            18,               // radius: distance
            new BABYLON.Vector3(0, 0, 0), // target: table center
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
        light.intensity = 0.6;
    }

    private createTable():void {
        const table = BABYLON.MeshBuilder.CreateBox("table", {width: 20, height: 0.5, depth: 10}, this.scene);

        table.position.y = -1;

        const tableMaterial = new BABYLON.StandardMaterial("tableMat", this.scene);
        tableMaterial.diffuseColor = new BABYLON.Color3(0, 0.6, 0);
        table.material = tableMaterial;

        // Optional: Add border lines (as thin boxes)
        const lineMaterial = new BABYLON.StandardMaterial("lineMat", this.scene);
        lineMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1); // white

        this.createSideWalls(table);

        this.createCenterLine(table, lineMaterial);
    }

    private createPaddles(): void {
        this.leftPaddle = new Paddle(this.scene, new BABYLON.Vector3(-9, -0.75, 0), "leftPaddle");
        this.rightPaddle = new Paddle(this.scene, new BABYLON.Vector3(9, -0.75, 0), "rightPaddle");

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
        const wallMaterial = new BABYLON.StandardMaterial("wallMat", this.scene);
        wallMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1); // white
    
        // Top wall
        const topWall = BABYLON.MeshBuilder.CreateBox(
            "topWall",
            { width: 18, height: 0.3, depth: 0.1 },
            this.scene
        );
        topWall.position.set(0, 0.5, -4.8); // along Z-axis
        topWall.material = wallMaterial;
        topWall.parent = table;
    
        // Bottom wall
        const bottomWall = BABYLON.MeshBuilder.CreateBox(
            "bottomWall",
            { width: 18, height: 0.3, depth: 0.1 },
            this.scene
        );
        bottomWall.position.set(0, 0.5, 4.8); // here chnage the wall's size and location
        bottomWall.material = wallMaterial;
        bottomWall.parent = table;
    }
    
    private createBall(): void {
        // Place the ball at the center above the table surface.
        // Your table y is -1 and paddles y ~ -0.75, so set ball y slightly above paddles.
        const startPos = new BABYLON.Vector3(0, -0.5, 0);
        this.ball = new Ball(this.scene, startPos, 0.5); // diameter 0.5 world units
      }
      
}
