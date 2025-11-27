import prisma from "../prisma/prismaClient.js";
import { createGameSession } from "../services/gameSessionService.js";


 // Require user to be logged in
// Get the logged-in user's ID
// Get the user's display name (optional, can come from request body)
// Fetch user info from database
// Determine which side the player wants (default to LEFT)
// Create the game session with 2 players: human + AI
// Return the created game session

async function aiRoutes(app, options){
    app.post(
        '/ai/create-game',
        {
            preHandler: [app.authenticate]
        },
        async (request, reply) => {
        
            const userId = request.user.id;
            
            try {
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { username: true }
                });
                
                if (!user) {
                    return reply.code(404).send({ error: "User not found" });
                }
                
                const session = await createGameSession(prisma, {
                    players: [
                        {
                            userId: userId,
                            guestName: null,
                            side: 'RIGHT'
                        },
                        {
                            userId: null,
                            guestName: 'AI Opponent',
                            side: 'LEFT'
                        }
                    ],
                        tournamentId: null,
                        matchIndex: null,
                        isAi: true 
                });
                
                return reply.code(201).send({
                    success: true,
                    gameSession: session
                });
                
            } catch (err) {
                    request.log.error(err);
                    return reply.code(err.code || 500).send({
                        error: err.message || "Failed to create AI game session"
                    });
                }
        }
    );
}

export default aiRoutes;