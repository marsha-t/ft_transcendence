// src/graphics/Ball.ts
import * as BABYLON from "babylonjs";

/**
 * Simple Ball wrapper for Babylon meshes.
 * - Creates a sphere mesh with a basic material
 * - Exposes setPosition() and setColor() for later
 */
export class Ball {
  public mesh: BABYLON.Mesh;
  private scene: BABYLON.Scene;

  // /**
  //  * @param scene Babylon Scene
  //  * @param position initial position in world units (Vector3)
  //  * @param diameter sphere diameter in world units (default 0.6)
  //  */
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

    // Optional: make it cast and receive shadows later (needs ShadowGenerator)
    // this.mesh.receiveShadows = true; // available when shadows are set up
  }

  // Helper to move ball later
  public setPosition(x: number, y: number, z: number) {
    this.mesh.position.set(x, y, z);
  }

  // Helper to change color later
  public setColor(c: BABYLON.Color3) {
    const mat = this.mesh.material as BABYLON.StandardMaterial;
    if (mat) mat.diffuseColor = c;
  }

  // Clean up
  public dispose() {
    try {
      this.mesh.dispose();
    } catch {}
  }
}
