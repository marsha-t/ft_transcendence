import prisma from "../prisma/prismaClient.js";
import { createGameSession } from "../services/gameSessionService.js";
import { createAiGameSchema } from "../schemas/ai.js";

async function aiRoutes(app){
	// Create game session with requester and AI opponent 
	/*
		- Create game session with requester and AI opponent
			- requester set automatically to right and AI opponent to left 
		- AI opponent treated like a guest player but game session is marked with isAI = true
	*/
	app.post('/game', { schema: createAiGameSchema, preHandler: [app.authenticate] }, async (request, reply) => {
		const userId = request.user.id;
		
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
				sessionId: session.id,
				isAi: true,
				players: session.players.map(p => ({
						side: p.side,
						displayName: p.displayName,
						score: p.score,
						isGuest: p.isGuest
				}))
		});
	});
}

export default aiRoutes;