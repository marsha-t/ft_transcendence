import * as BABYLON from '@babylonjs/core';

export class BabylonScene {
  private canvas: HTMLCanvasElement;
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  private camera: BABYLON.ArcRotateCamera;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    
    // Create engine
    this.engine = new BABYLON.Engine(this.canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true
    });

    // Create scene
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.15, 1);

    // Create camera
    this.camera = new BABYLON.ArcRotateCamera(
      "camera",
      Math.PI / 2,        // Alpha (horizontal rotation)
      Math.PI / 3,        // Beta (vertical rotation)
      30,                 // Radius (distance from target)
      new BABYLON.Vector3(0, 0, 0), // Target position
      this.scene
    );
    
    // Camera controls
    this.camera.attachControl(this.canvas, true);
    this.camera.lowerRadiusLimit = 15;
    this.camera.upperRadiusLimit = 50;

    // Create lights
    this.createLights();

    // Test: Create a simple sphere to verify scene is working
    const testSphere = BABYLON.MeshBuilder.CreateSphere(
      "testSphere",
      { diameter: 2 },
      this.scene
    );
    testSphere.position.y = 1;

    // Start render loop
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  private createLights(): void {
    // Hemisphere light (ambient)
    const hemiLight = new BABYLON.HemisphericLight(
      "hemiLight",
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );
    hemiLight.intensity = 0.6;

    // Directional light (main light with shadows)
    const dirLight = new BABYLON.DirectionalLight(
      "dirLight",
      new BABYLON.Vector3(-1, -2, -1),
      this.scene
    );
    dirLight.position = new BABYLON.Vector3(20, 40, 20);
    dirLight.intensity = 0.8;
  }

  public getScene(): BABYLON.Scene {
    return this.scene;
  }

  public getCamera(): BABYLON.ArcRotateCamera {
    return this.camera;
  }

  public dispose(): void {
    this.scene.dispose();
    this.engine.dispose();
  }
}