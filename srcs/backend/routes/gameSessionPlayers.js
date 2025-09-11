import prisma from '../prisma/prismaClient.js';
import { checkSession, checkPlayer } from '../services/gameSessionPlayersService.js';
import { joinSessionSchema, listPlayersSessionSchema, updateScoreSchema, deletePlayerSchema } from '../schemas/gameSessionPlayers.js';

async function gameSessionPlayersRoutes(app, options) {

	// Player joins a session
	app.post('/api/game-sessions/:sessionId/players', { schema: joinSessionSchema }, async (request, reply) => {
		const { sessionId } = request.params;
		const { userId, guestName, side } = request.body;

		try {
			const session = await prisma.gameSession.findUnique({
				where: { id: Number(sessionId) },
				include: { players: true },
			});
			if (!session) {
				throw { code: 404, message: 'Game session not found' };
			}
		    if (session.status !== 'CREATED') {
				throw { code: 400, message: 'Session cannot accept new players' };
			}
			if (session.players.some(p => p.side === side)) {
				throw { code: 409, message: 'Side already taken' };
			}
			if (session.players.length >= 2) {
				throw { code: 409, message: 'Session already full' };
			}
			
			let displayName;
			if (userId) {
				const user = await prisma.user.findUnique({
					where: { id: Number(userId) },
					select: { username: true },
				});
				if (!user) {
					throw { code: 404, message: 'User not found' };
				}
				displayName = user.username;
			} else if (guestName) {
				displayName = guestName;
			} else {
				throw { code: 400, message: 'Guest must provide a guestName' };
			}
			
			if (session.players.some(p => p.displayName === displayName)) {
				throw { code: 409, message: 'Display name is already taken in this session' };
			}

			const newPlayer = await prisma.gameSessionPlayer.create({
				data: {
					sessionId: Number(sessionId),
					userId: userId ? Number(userId) : null,
					isGuest: !userId,
					displayName,
					side,
				},
				include: { user: { select: { id: true, username: true } }, },
			});

			return reply.code(201).send(newPlayer);
		} catch (err) {
			request.log.error(err);

			if (err.code && err.message) {
				return reply.code(err.code).send({ error: err.message });
			}

			return reply.code(500).send({ error: 'Player failed to join session' });
		}
	});

	// List players in session
	app.get('/api/game-sessions/:sessionId/players', { schema: listPlayersSessionSchema }, async (request, reply) => {
		const { sessionId } = request.params;
		
		try {
			await checkSession(prisma, sessionId);
			const players = await prisma.gameSessionPlayer.findMany({
				where: { sessionId: Number(sessionId) }, 
				orderBy: { side: 'asc' },
			});
			if (players.length === 0) {
				return reply.send([]);
			}
			const formatted = players.map((p) => ({
				playerId: p.id,
				displayName: p.displayName,
				side: p.side,
				isGuest: p.isGuest,
				score: p.score,
			}));

			return reply.send(formatted);
		} catch (err) {
			request.log.error(err);
		    return reply.code(err.code ?? 500).send({ error: err.message ?? 'Failed to fetch players in session' });
		}
	});

	// Update player score
	app.patch('/api/game-sessions/:sessionId/players/:side/score', { schema: updateScoreSchema }, async (request, reply) => {
		const { sessionId, side } = request.params;
		try {
			const session = await checkSession(prisma, sessionId);
			const player = await prisma.gameSessionPlayer.update({
				where: { sessionId_side: { sessionId: Number(sessionId), side } },
				data: { score: { increment: 1 }, },
			});

			if (player.score >= 5) {
				await prisma.gameSession.update({
					where: { id: session.id },
					data: {
						status: 'FINISHED',
						endedAt: new Date(),
						winnerUserId: player.userId ?? null,
						winnerPlayerId: player.id,
					},
				});
			}

			const updatedSession = await prisma.gameSession.findUnique({
				where: { id: Number(sessionId) },
				include: {players: true},
			});
			return reply.send(updatedSession);
		} catch (err) {
			request.log.error(err);
		    return reply.code(err.code ?? 500).send({ error: err.message ?? 'Failed to update player score' });
		}
	});

	// Delete player
	app.delete('/api/game-sessions/:sessionId/players/:side', { schema: deletePlayerSchema }, async (request, reply) => {
		const { sessionId, side } = request.params;
		try {
			await checkSession(prisma, sessionId);
			await checkPlayer(prisma, sessionId, side);
			await prisma.gameSessionPlayer.delete({
				where: { sessionId_side: { sessionId: Number(id), side }, },
			});
      return reply.code(200).send({ message: 'Game session deleted' });
		} catch (err) {
			request.log.error(err);
		    return reply.code(err.code ?? 500).send({ error: err.message ?? 'Failed to delete player from game session' });
		}
	});
}

export default gameSessionPlayersRoutes;


