// src/graphics/Ball.ts
import * as BABYLON from "babylonjs";

export class Ball {
  public mesh: BABYLON.Mesh;
  private scene: BABYLON.Scene;

  // Movement vector
  private speed: BABYLON.Vector3;

  constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, diameter = 0.6) {
    this.scene = scene;

    // Create the sphere mesh (the visual ball)
    this.mesh = BABYLON.MeshBuilder.CreateSphere(
        "pongBall",
        { diameter },
        this.scene
      );

    // Place it slightly above the table surface by default
    this.mesh.position.copyFrom(position);

    // Create a simple emissive material so the ball is visible
    const mat = new BABYLON.StandardMaterial("ballMat", this.scene);
    mat.diffuseColor = new BABYLON.Color3(0.95, 0.6, 0.2); // warm orange
    mat.emissiveColor = new BABYLON.Color3(0.35, 0.15, 0); // subtle glow
    this.mesh.material = mat;

    this.speed = new BABYLON.Vector3(0.1, 0, 0.07); // initial speed
    }

    public update(){
      this.mesh.position.addInPlace(this.speed);
    }

  // Bounce functions
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
