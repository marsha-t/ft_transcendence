import * as BABYLON from "babylonjs";
import { GameConfig } from "./GameConfig";

export class Ball {
  public mesh: BABYLON.Mesh;
  private scene: BABYLON.Scene;

  // Movement vector - make it public so PongGame can access it
  public speed: BABYLON.Vector3;

  constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, diameter?: number) {
    this.scene = scene;

    // Use config diameter if not provided
    const ballDiameter = diameter ?? GameConfig.ball.diameter;

    // Create the sphere mesh
    this.mesh = BABYLON.MeshBuilder.CreateSphere(
        "pongBall",
        { diameter: ballDiameter },
        this.scene
    );

    this.mesh.position.copyFrom(position);

    // Create material
    const mat = new BABYLON.StandardMaterial("ballMat", this.scene);
    mat.diffuseColor = new BABYLON.Color3(0.95, 0.6, 0.2);
    mat.emissiveColor = new BABYLON.Color3(0.35, 0.15, 0);
    this.mesh.material = mat;

    // Use speed from config
    this.speed = new BABYLON.Vector3(
        GameConfig.ball.speed.x, 
        0, 
        GameConfig.ball.speed.z
    );
  }

  public update() {
      this.mesh.position.addInPlace(this.speed);
  }

  public bounceX() {
    this.speed.x *= -1;
  }

  public bounceZ() {
    this.speed.z *= -1;
  }

  public dispose() {
    try {
      this.mesh.dispose();
    } catch {}
  }
}




// // src/graphics/Ball.ts
// import * as BABYLON from "babylonjs";

// export class Ball {
//   public mesh: BABYLON.Mesh;
//   private scene: BABYLON.Scene;

//   // Movement vector
//   private speed: BABYLON.Vector3;

//   constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, diameter = 0.6) {
//     this.scene = scene;

//     // Create the sphere mesh (the visual ball)
//     this.mesh = BABYLON.MeshBuilder.CreateSphere(
//         "pongBall",
//         { diameter },
//         this.scene
//       );

//     // Place it slightly above the table surface by default
//     this.mesh.position.copyFrom(position);

//     // Create a simple emissive material so the ball is visible
//     const mat = new BABYLON.StandardMaterial("ballMat", this.scene);
//     mat.diffuseColor = new BABYLON.Color3(0.95, 0.6, 0.2); // warm orange
//     mat.emissiveColor = new BABYLON.Color3(0.35, 0.15, 0); // subtle glow
//     this.mesh.material = mat;

//     this.speed = new BABYLON.Vector3(0.1, 0, 0.07); // initial speed
//     }

//     public update(){
//       this.mesh.position.addInPlace(this.speed);
//     }

//   // Bounce functions
//   public bounceX() {
//     this.speed.x *= -1;
//   }

//   public bounceZ() {
//     this.speed.z *= -1;
//   }

//   public dispose() {
//     try {
//       this.mesh.dispose();
//     } catch {}
//   }
// }
