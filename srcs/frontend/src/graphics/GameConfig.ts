

export const GameConfig =  {
    table: {
        width: 20,
        height: 0.5,
        depth: 10
    },
    wall: {
        height: 0.5,
        thickness: 0.1
    },
    paddle: {
        width: 0.2,
        height: 0.5,
        depth: 3,
        offset: 0.5 // how much inside the table
    },
    camera: {
        alpha: 3 * Math.PI / 2,
        beta: Math.PI / 3,
        radius: 18,
        target: { x: 0, y: 0, z: 0}
    },
    tableBounds: {
        zMin: -4.4, // adjust if your table depth changes
        zMax: 4.4
    }, 
    ball: {
        diameter: 0.6,
        radius: 0.3,
        speed: {
            x: 0.1,
            z: 0.07
        }
    }

}
