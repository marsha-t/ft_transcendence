import * as BABYLON from "babylonjs"

export class Paddle {
    public mesh: BABYLON.Mesh;
    private scene: BABYLON.Scene;

    constructor( scene: BABYLON.Scene, position: BABYLON.Vector3, name: string){
        this.scene = scene;

        this.mesh = BABYLON.MeshBuilder.CreateBox(name, {width: 0.2, height: 0.5, depth: 3}, this.scene);
        this.mesh.position = position;

        const mat = new BABYLON.StandardMaterial( name + "Mat", this.scene);
        mat.diffuseColor = new BABYLON.Color3(0.8, 0.1, 0.1);
        this.mesh.material = mat;
    }

    public move(deltaY: number){
        const newY = this.mesh.position.y + deltaY;
        if (newY > 4) return;  // top boundary
        if (newY < -4) return; // bottom boundary
        this.mesh.position.y = newY;
    }
    
}