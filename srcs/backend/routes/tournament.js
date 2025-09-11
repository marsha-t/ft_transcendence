import prisma from '../prisma/prismaClient.js';
import bcrypt from 'bcrypt';
import { createTournamentSchema, joinTournamentSchema, updateTournamentStatusSchema  } from '../schemas/tournament.js';

async function tournamentRoutes(app, options) {

	// Create new tournament
	app.post('/api/tournaments', { schema: createTournamentSchema }, async (request, reply) => {
		const { numberOfPlayers } = request.body;
		try {
			const bracketSize = 2 ** Math.ceil(Math.log2(numberOfPlayers));
			const numMatches = bracketSize - 1;

			const tournament = await prisma.tournament.create({
				data: { 
					status: "CREATED", 
					numberOfPlayers,
					bracketSize,
				 },
			});
			
			const matches = Array.from({ length: numMatches }, (_, i) => ({
				tournamentId: tournament.id,
				matchIndex: i + 1,
			}));

			await prisma.tournamentMatch.createMany({ data: matches });
			return reply.code(201).send({ 
				id: tournament.id, 
				status: tournament.status,
				createdAt: tournament.createdAt,
			});
		} catch (err) {
			request.log.error(err);
			return reply.code(500).send({ error: 'Failed to create tournament'});
		}
	});

	// Add a player
	app.post('/api/tournaments/:tournamentId/players', { schema: joinTournamentSchema }, async (request, reply) => {
		const { tournamentId } = request.params;
		const { username, password, guestName } = request.body;
		try {
			const tournament = await prisma.tournament.findUnique({
				where: { id: Number(tournamentId)},
			});
			if (!tournament) {
				return reply.code(404).send({ error: 'Tournament not found'});
			}
			
			const count = await prisma.tournamentPlayer.count({ where: { tournamentId: Number(tournamentId) }});
			if (count >= tournament.numberOfPlayers) {
				return reply.code(400).send({ error: 'Tournament is already full' });
			}

			let playerData;
			let displayName;

			if (username && password) {
				const user = await prisma.user.findUnique({ where: { username }});
				if (!user) {
					return reply.code(401).send({ error: 'Invalid username or password '});
				}
				const isPasswordValid = await bcrypt.compare(password, user.password);
				if (!isPasswordValid) {
					return reply.code(401).send({ error: 'Invalid username or password' });
				}
				displayName = user.username;
				playerData = await prisma.tournamentPlayer.create({ 
					data: {
						tournamentId: Number(tournamentId),
						userId: user.id,
						displayName,
					}
				});
			} else if (guestName) {
				displayName = guestName;
				playerData = await prisma.tournamentPlayer.create({
					data: {
						tournamentId: Number(tournamentId),
						guestName,
						displayName,
					}
				})
			}
			else {
				return reply.code(400).send({ error: 'Must provide either username/password or guestName'});
			}
			return reply.code(200).send({
				id: playerData.id,
				displayName: playerData.displayName,
			});
		} catch (err) {
			if (err.code === 'P2002') {
				return reply.code(409).send({ error: 'Player already joined tournament' });
			}
			request.log.error(err);
			return reply.code(500).send({ error: 'Player failed to join tournament'});
		}
	});

	// Update tournament status
	app.patch('/api/tournaments/:tournamentId', { schema: updateTournamentStatusSchema}, async (request, reply) => {
		const { tournamentId } = request.params;
		const { status } = request.body;
		try {
			const tournament = await prisma.tournament.findUnique({
				where: { id: Number(tournamentId)},
			});
			if (!tournament) {
				return reply.code(404).send({ error: 'Tournament not found'});
			}
			const current = tournament.status;
			const validTransitions = {
				CREATED: new Set(['STARTED', 'ABORTED']),
				STARTED: new Set(['FINISHED', 'ABORTED']),
				FINISHED: new Set([]),
				ABORTED: new Set([]),
			}
			if (!validTransitions[current].has(status)) {
        		return reply.code(400).send({ error: `Invalid transition: ${current} to ${status}` });
			}
			const updateData = { status };
			if (status === 'STARTED' ) {
				updateData.startedAt = new Date();
				const players = await prisma.tournamentPlayer.findMany({
					where: { tournamentId: Number(tournamentId) },
				});

				if (players.length < 2) {
					return reply.code(400).send({ error: 'Not enough players to start tournament' });
				}
				const bracketSize = tournament.bracketSize;
				const seeds = [...players, ...Array(bracketSize - players.length).fill(null)];

				const round1Matches = bracketSize / 2;
				for (let i = 0; i < round1Matches; i++) {
					const p1 = seeds[i * 2];
					const p2 = seeds[i * 2 + 1];

					await prisma.tournamentMatch.updateMany({
					where: { tournamentId: Number(tournamentId), matchIndex: i + 1 },
					data: {
						player1Id: p1?.id ?? null,
						player2Id: p2?.id ?? null,
						...(p1 && !p2 ? { winnerUserId: p1.userId ?? null } : {}),
						...(p2 && !p1 ? { winnerUserId: p2.userId ?? null } : {}),
					},
					});
				}
			}
			else if (status == 'FINISHED') {
				updateData.endedAt = new Date();
			}

			const updated = await prisma.tournament.update({ 
				where: { id: Number(tournamentId) }, 
				data: updateData,
			});
			return reply.send({
				id: updated.id,
				status: updated.status,
				startedAt: updated.startedAt,
				endedAt: updated.endedAt,
			});
		} catch (err) {
			request.log.error(err);
			return reply.code(500).send({ error: 'Failed to update tournament status'});
		}
	});
}


export default tournamentRoutes;


// Tournament lifecycle

// GET /api/tournaments/:id → get tournament details (players, bracket, status)

// GET /api/tournaments/:id/results → get results (champion, bracket, stats)

// Match management

// POST /api/game-sessions { tournamentId, matchIndex }
// → creates a game session for a given match and links it in TournamentMatch.

// PATCH /api/tournaments/:id/matches/:matchIndex
// → update the winner ({ winnerUserId }) after a game finishes.