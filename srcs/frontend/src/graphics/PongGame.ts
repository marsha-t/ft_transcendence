import * as BABYLON from "babylonjs";
import { Paddle } from "../graphics/Paddle";

export class PongGame {
    private canvas: HTMLCanvasElement;
    private engine!: BABYLON.Engine;
    private scene!: BABYLON.Scene;

    private rightPaddle!: Paddle;
    private leftPaddle!: Paddle;

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

        // Render loop
        this.engine.runRenderLoop(() => {
            this.scene.render();
        });
    }

    private createCamera(): void {
        const camera = new BABYLON.ArcRotateCamera(
                "Camera",
                Math.PI / 2,
                Math.PI / 4,
                18,
                new BABYLON.Vector3(0, 1, 1),
                this.scene
            );
            camera.attachControl(this.canvas, true);
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

        //center line
        const dashLength = 1;
        const dashGap = 0.5;
        const totalDepth = 10;
        let currentZ = -totalDepth / 2;

        while (currentZ < totalDepth / 2) {
            const dash = BABYLON.MeshBuilder.CreateBox(
                "dash",
                { width: 0.2, height: 0.08, depth: dashLength },
                this.scene
            );
            dash.position.y = 0.4;
            dash.position.z = currentZ + dashLength / 2; // center the dash
            dash.material = lineMaterial;

            dash.parent = table; // optional: attach to table

            currentZ += dashLength + dashGap;
        }
        // centerLine.material = lineMaterial;
    }

    private createPaddles(): void {
        this.leftPaddle = new Paddle(this.scene, new BABYLON.Vector3(-9, -0.75, 0), "leftPaddle");
        this.rightPaddle = new Paddle(this.scene, new BABYLON.Vector3(9, -0.75, 0), "rightPaddle");

    }

    private createSideWalls(table: BABYLON.Mesh): void {
        const wallMaterial = new BABYLON.StandardMaterial("wallMat", this.scene);
        wallMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1); // white
    
        // Top wall
        const topWall = BABYLON.MeshBuilder.CreateBox(
            "topWall",
            { width: 20, height: 0.3, depth: 0.1 },
            this.scene
        );
        topWall.position.set(0, 0.5, -5); // along Z-axis
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
    
    
}
