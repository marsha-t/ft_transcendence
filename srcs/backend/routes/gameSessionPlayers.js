import prisma from '../prisma/prismaClient.js';
import { createGameSession } from '../services/gameSessionService.js';
import { checkSession, checkPlayer } from '../services/gameSessionPlayersService.js';
import { joinSessionSchema, listPlayersSessionSchema, updateScoreSchema, deletePlayerSchema } from '../schemas/gameSessionPlayers.js';
import { getParentMatchIndex } from '../services/tournamentService.js';

async function gameSessionPlayersRoutes(app, options) {

	// Player joins a session
	/*
		Route allows for user (via userId) as well as guest to be added to session
		- Checks session exists and is of 'CREATED' status
		- Checks that side is not already taken and session isn't already full
		- Check that player in session doesn't already use the same displayname
		- Add player to GameSessionPlayer table
	*/
	app.post('/api/game-sessions/players', { schema: joinSessionSchema }, async (request, reply) => {
		const sessionIdHeader = request.headers['x-current-session-id'];
		const sessionId = sessionIdHeader ? Number(sessionIdHeader) : null;

		const { userId, guestName, side } = request.body ?? {};

		if (!sessionId) {
			return reply.code(400).send({ error: "X-Current-Session-Id header is required" });
		}

		if (!userId && !guestName) {
			return reply.code(400).send({ error: "Either X-Current-User-Id header or guestName is required" });
		}
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
      		return reply.code(err.code || 500).send({ error: err.message || "Player failed to join session" });
		}
	});

	// List players in session
	/*
		- Check session exists
		- If no players found, rturns empty array 
		- Otherwise, returns array of player objects
	*/
	app.get('/api/game-sessions/players', { schema: listPlayersSessionSchema }, async (request, reply) => {
		const sessionIdHeader = request.headers['x-current-session-id'];
		const sessionId = sessionIdHeader ? Number(sessionIdHeader) : null;

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
      		return reply.code(err.code || 500).send({ error: err.message || "Failed to fetch players in session" });
		}
	});

	// Update player score
	/* 
		- Checks session exists
		- Updates player's score
		- If score reaches win condition (score = 5)
			- Mark session as FINISHED and records winner in GameSession table (id = GameSessionPlayer.id)
				- If session is from a tournament, 
					- update winner in TournamentMatch table (id = TournamentPlayer.id)
					- If session is last match in tournament, mark tournament as FINISHED
					- Else
						- place winner in next round's match (parent match)
						- if parent match has two players, create new game session
		- returns updated session 
	*/
	app.patch('/api/game-sessions/players/score', { schema: updateScoreSchema }, async (request, reply) => {
		const sessionIdHeader = request.headers['x-current-session-id'];
		const sessionId = sessionIdHeader ? Number(sessionIdHeader) : null;
		const side = request.headers['x-player-side'];

		try {
			const session = await checkSession(prisma, sessionId);
			const player = await prisma.gameSessionPlayer.update({
				where: { sessionId_side: { sessionId: Number(sessionId), side } },
				data: { score: { increment: 1 }, },
				include: { tournamentPlayer: { select: { id: true } } },
			});

			let finishedGame = null;
			
			if (player.score >= 5) {
				finishedGame = await prisma.gameSession.update({
					where: { id: session.id },
					data: {
						status: 'FINISHED',
						endedAt: new Date(),
						winnerUserId: player.userId ?? null,
						winnerPlayerId: player.id,
					},
					include: { players: true },
				});
			}

			if (finishedGame) {
				const match = await prisma.tournamentMatch.findFirst({
					where: { gameSessionId: finishedGame.id },
					include: { tournament: true },
				});
			

				if (match) {
					await prisma.tournamentMatch.update({
						where: { id: match.id },
						data: {
							winnerUserId: player.userId ?? null, 
							winnerPlayerId: player.tournamentPlayerId,
						},
					});
					
					if (match.matchIndex === match.tournament.bracketSize - 1) {
						await prisma.tournament.update({
							where: { id: match.tournamentId },
							data: { status: 'FINISHED', endedAt: new Date() },
						});
					} else {
						const parentIndex = getParentMatchIndex(match.matchIndex, match.tournament.bracketSize);
						
						const parentMatch = await prisma.tournamentMatch.findUnique({
							where: { tournamentId_matchIndex: { tournamentId: match.tournamentId, matchIndex: parentIndex, } }
						});
		
						if (parentMatch) {
							let updateData = {};
							if (!parentMatch.player1Id) {
								updateData.player1Id = player.tournamentPlayerId;
							} else if (!parentMatch.player2Id) {
								updateData.player2Id = player.tournamentPlayerId;
							}
		
							const updatedParent = await prisma.tournamentMatch.update({
								where: { id: parentMatch.id },
								data: updateData,
							});
		
							if (updatedParent.player1Id && updatedParent.player2Id && !updatedParent.gameSessionId) {
								const parentPlayers = await prisma.tournamentPlayer.findMany({
									where: { id: { in: [updatedParent.player1Id, updatedParent.player2Id ] } },
								});
		
								await createGameSession(prisma, {
									tournamentId: match.tournamentId,
									matchIndex: updatedParent.matchIndex,
									players: [
										{ userId: parentPlayers[0].userId, guestName: parentPlayers[0].isGuest ? parentPlayers[0].displayName : null, side: 'LEFT' },
										{ userId: parentPlayers[1].userId, guestName: parentPlayers[1].isGuest ? parentPlayers[1].displayName : null, side: 'RIGHT' },
									]
								});
							}
						}
					}
				}
			}

			const updatedSession = await prisma.gameSession.findUnique({
				where: { id: Number(sessionId) },
				include: {players: true},
			});

			if (!updatedSession) {
				return reply.code(404).send({ error: "Game session not found" });
			 }
			  
			 const response = {
					sessionId: String(updatedSession.id),
					status: updatedSession.status,
					createdAt: updatedSession.createdAt,
					startedAt: updatedSession.startedAt,
					endedAt: updatedSession.endedAt,
					players: updatedSession.players.map(p => ({
						userId: p.userId ? String(p.userId) : undefined,
						guestName: p.isGuest ? p.displayName : undefined,
						displayName: p.displayName,
						side: p.side,
						score: p.score,
					})),
					winner: updatedSession.winnerPlayerId
						? updatedSession.players.find(p => p.id === updatedSession.winnerPlayerId)?.side
						: undefined,
					winnerName: updatedSession.winnerPlayerId
						? updatedSession.players.find(p => p.id === updatedSession.winnerPlayerId)?.displayName
						: undefined,
			  };
			  
			  
			  return reply.send(response);
		} catch (err) {
			request.log.error(err);
      		return reply.code(err.code || 500).send({ error: err.message || "Failed to update player score" });
		}
	});

	// Delete player
	/*
		- Checks session and player exists
		- Delete from GameSessionPlayer
	*/
	app.delete('/api/game-sessions/players', { schema: deletePlayerSchema }, async (request, reply) => {
		const sessionIdHeader = request.headers['x-current-session-id'];
		const sessionId = sessionIdHeader ? Number(sessionIdHeader) : null;
		const side = request.headers['x-player-side'];
	
		try {
			await checkSession(prisma, sessionId);
			await checkPlayer(prisma, sessionId, side);
			await prisma.gameSessionPlayer.delete({
				where: { sessionId_side: { sessionId: Number(id), side }, },
			});
      return reply.code(200).send({ message: 'Game session deleted' });
		} catch (err) {
			request.log.error(err);
      		return reply.code(err.code || 500).send({ error: err.message || "Failed to delete player from game session" });
		}
	});
}

export default gameSessionPlayersRoutes;


