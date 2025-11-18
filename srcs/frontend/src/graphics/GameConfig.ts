

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
        offset: 0.5, // how much inside the table
        speed: 6,
        velocityInfluence: 0.3
    },
    camera: {
        alpha: 3 * Math.PI / 2,
        beta: Math.PI / 3,
        radius: 18,
        target: { x: 0, y: 0, z: 3}
    },
    tableBounds: {
        zMin: -4.4,
        zMax: 4.4
    }, 
    ball: {
        diameter: 0.4,
        radius: 0.2,
        speed: {
            x: 12,
            z: 0
        },
        speedIncrement: 1.1,    // 5% faster each hit
        maxSpeed: 10,           // Speed cap
        maxBounceAngle: 0.7    // Max Z velocity from paddle hit
    },
    room: {
        width: 40,
        height: 20,
        depth: 25,
        floorY: -5  // Position of floor
    },
    light: {
        intensity: 1
    }

}
