import * as BABYLON from "babylonjs"

export class Paddle {
    public mesh: BABYLON.Mesh;
    private scene: BABYLON.Scene;

    constructor(scene: BABYLON.Scene, position: BABYLON.Vector3, name: string) {
        this.scene = scene;

        this.mesh = BABYLON.MeshBuilder.CreateBox(
            name,
            { width: 0.2, height: 0.5, depth: 3 }, // depth (Z) is paddle length
            this.scene
        );
        this.mesh.position = position;

        const mat = new BABYLON.StandardMaterial(name + "Mat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.8, 0.1, 0.1);
        this.mesh.material = mat;
    }

    // ✅ Move along Z axis (forward/back on table)
    public move(deltaZ: number) {
        const newZ = this.mesh.position.z + deltaZ;

        // ✅ Table boundaries (adjust if your table changes size)
        if (newZ > 4) return;   // bottom side
        if (newZ < -4) return;  // top side

        this.mesh.position.z = newZ;
    }
}
