import prisma from '../prisma/prismaClient.js';

async function gameSessionPlayersRoutes(app, options) {

	// Player joins a session
	app.post('/api/game-sessions/:id/players', { schema: joinSessionSchema }, async (request, reply) => {
		const { id } = request.params;
		const { userId, side } = request.body;

		try {
			const result = await prisma.$transaction(async (tx) => {
				const session = await tx.gameSession.findUnique({
					where: { id: Number(id) },
					include: { players: true },
				});
				if (!session) {
					throw { code: 404, message: 'Game session not found' };
				}
				if (![ 'CREATED', 'READY' ].includes(session.status)) {
					throw { code: 400, message: 'Session cannot accept new players' };
				}
				if (session.players.some(p => p.side === side)) {
					throw { code: 409, message: 'Side already taken' };
				}
				if (session.players.some(p => p.userId === Number(userId))) {
					throw { code: 409, message: 'Player is already in session' };
				}
				if (session.players.length >= 2) {
					throw { code: 409, message: 'Session already full' };
				}

				const newPlayer = await tx.gameSessionPlayer.create({
					data: {
						sessionId: Number(id),
						userId: Number(userId),
						side: side,
					},
					include: { user: { select: { id: true, username: true } }, },
				});

				if (session.players.length === 1 && session.status === 'CREATED') {
					await tx.gameSession.update({
					where: { id: Number(id) },
					data: { status: 'READY' },
					});
				}

				return newPlayer;
			});

			return reply.code(201).send(result);
		} catch (err) {
			request.log.error(err);

			if (err.code && err.message) {
				return reply.code(err.code).send({ error: err.message });
			}

			// in case of race conditions, Prisma will throw database error 
			if (err.code === 'P2002') {
				return reply.code(409).send({ error: 'That side or user is already taken' });
			}

			return reply.code(500).send({ error: 'Player failed to join session' });
		}
	});

	// List players in session
	app.get('/api/game-sessions/:id/players', { schema: listPlayersSessionSchema }, async (request, reply) => {
		const { id } = request.params;
		
		try {
			const session = await prisma.gameSession.findUnique({
				where: { id: Number(id) },
			});
			if (!session) {
				return reply.code(404).send({ error: 'Game session not found '});
			}
			const players = await prisma.gameSessionPlayer.findMany({
				where: { sessionId: Number(id) }, 
				include: { 
					user: {
						select : {
							id: true, 
							username: true,
						},
					}, 
				},
				orderBy: { side: 'asc' },
			});
			if (players.length === 0) {
				return reply.send([]);
			}
			const formatted = players.map((p) => ({
				playerId: p.id,
				userId: p.user.id,
				username: p.user.username,
				side: p.side,
				isReady: p.isReady,
				score: p.score,
			}));

			return reply.send(formatted);
		} catch (err) {
			request.log.error(err);
			return reply.code(500).send({ error: 'Failed to fetch players in session'});
		}
	});

	// Update player as ready
	app.patch('/api/game-sessions/:id/players/:playerId/ready', async (request, reply) => {
		const { id, playerId } = request.params;

		try {
			const session = await prisma.gameSession.findUnique({
				where: { id: Number(id) },
			});
			if (!session) {
				return reply.code(404).send({ error: 'Game session not found '});
			}
			const player = await prisma.gameSessionPlayer.findUnique({
				where: { sessionId_userId: { sessionId: Number(id), userId: Number(playerId) } }, 
			});
			if (!player) {
				return reply.code(404).send({ error: 'Player cannot be found' });
			}
			const updatedPlayer = await prisma.gameSessionPlayer.update({ 
				where: { id: Number(playerId) }, 
				data: { isReady: true },
			});
			if (session.status !== 'READY') {
				await prisma.gameSession.update({
					where: { id: Number(id)},
					data: { status: 'READY' },
				});
			}
			return reply.send(updatedPlayer);
		} catch (err) {
			request.log.error(err);
			return reply.code(500).send({ error: 'Failed to update player as ready'});
		}
	});

	// Update player score
	app.patch('/api/game-sessions/:id/players/:playerId/score', { schema: updateScoreSchema }, async (request, reply) => {
		const { id, playerId } = request.params;
		try {
			const session = await prisma.gameSession.findUnique({
				where: { id: Number(id) },
			});
			if (!session) {
				return reply.code(404).send({ error: 'Game session not found '});
			}
			const player = await prisma.gameSessionPlayer.findUnique({
				where: { sessionId_userId: { sessionId: Number(id), userId: Number(playerId) } }, 
			});
			if (!player) {
				return reply.code(404).send({ error: 'Player cannot be found' });
			}
			const updatedPlayer = await prisma.gameSessionPlayer.update({
				where: { sessionId_userId: { sessionId: Number(id), userId: Number(playerId)}, },
				data: { score: { increment: 1 }, },
			});

			if (updatedPlayer.score >= session.maxScore) {
				await prisma.gameSession.update({
					where: { id: session.id },
					data: {
						status: 'FINISHED',
						endedAt: new Date(),
						winnerUserId: updatedPlayer.userId,
					},
				});
			}
			return reply.send(updatedPlayer);
		} catch (err) {
			request.log.error(err);
			return reply.code(500).send({ error: 'Failed to update player score'});
		}
	});

	// Delete player
	app.delete('/api/game-sessions/:id/players/:playerId', async (request, reply) => {
		const { id, playerId } = request.params;
		try {
			const session = await prisma.gameSession.findUnique({
				where: { id: Number(id) },
			});
			if (!session) {
				return reply.code(404).send({ error: 'Game session not found '});
			}
			const player = await prisma.gameSessionPlayer.findUnique({
				where: { sessionId_userId: { sessionId: Number(id), userId: Number(playerId) } }, 
			});
			if (!player) {
				return reply.code(404).send({ error: 'Player cannot be found' });
			}
			await prisma.gameSessionPlayer.delete({
				where: { sessionId_userId: { sessionId: Number(id), userId: Number(playerId) }, },
			});
      return reply.code(200).send({ message: 'Game session deleted' });
		} catch (err) {
			request.log.error(err);
      		return reply.code(500).send({ error: 'Failed to delete player from game session' });
		}
	});
}

export default gameSessionPlayersRoutes;


