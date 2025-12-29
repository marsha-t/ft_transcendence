

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
        speed: 10,
        velocityInfluence: 0.3
    },
    camera: {
        alpha: 3 * Math.PI / 2,
        beta: Math.PI / 3,
        radius: 18,
        target: { x: 0, y: 0, z: 3}
    },
    tableBounds: {
        zMin: -4.85,  // depth/2 - wall.thickness/2 - paddle.depth/2 - margin
        zMax: 4.85 // Keeps paddle away from walls
    }, 
    ball: {
        diameter: 0.4,
        radius: 0.2,
        speed: {
            x: 12,
            z: 0
        },
        speedIncrement: 1.6,    // 5% faster each hit
        maxSpeed: 15,           // Speed cap
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
    },
    powerUps: {
        enabled: false,
        spawnInterval: 5000, // 5 seconds between spawns
        duration: 3000, // Effect lasts 3 seconds
        types: [] as string[] // Empty array by default
    },
    // theme: {
    //     name: 'CLASSIC' as 'CLASSIC' | 'NEON' | 'SPACE' | 'RETRO',
    //     tableColor: { r: 0, g: 0.4, b: 0 },
    //     ballColor: { r: 0.95, g: 0.6, b: 0.2 }
    // }


}
