import prisma from '../prisma/prismaClient.js';
import bcrypt from 'bcrypt';
import { createGameSession } from '../services/gameSessionService.js';
// import { createTournamentSchema, joinTournamentSchema, updateTournamentStatusSchema , getNextMatchSchema, validatePlayerSchema, finalizeTournamentSchema } from '../schemas/tournament.js';
import { updateTournamentStatusSchema , getNextMatchSchema, validatePlayerSchema, finalizeTournamentSchema } from '../schemas/tournament.js';
import { getParentMatchIndex } from '../services/tournamentService.js';

async function tournamentRoutes(app, options) {

	// Create new tournament
	/*
		- Compute bracket size and number of matches from number of players
		- Insert new tournament in Tournament table
		- Pre-generate rows in tournamentMatch table
		- Checks that current user exists and then adds user into tournament
	*/
	// app.post('/api/tournaments', { schema: createTournamentSchema }, async (request, reply) => {
	// 	const userId = Number(request.headers['x-current-user-id']);
	// 	const { numberOfPlayers } = request.body;
		
	// 	try {
	// 		const bracketSize = 2 ** Math.ceil(Math.log2(numberOfPlayers));
	// 		const numMatches = bracketSize - 1;

	// 		const tournament = await prisma.tournament.create({
	// 			data: { 
	// 				status: "CREATED", 
	// 				numberOfPlayers,
	// 				bracketSize,
	// 			 },
	// 		});
			
	// 		const matches = Array.from({ length: numMatches }, (_, i) => ({
	// 			tournamentId: tournament.id,
	// 			matchIndex: i + 1,
	// 		}));

	// 		await prisma.tournamentMatch.createMany({ data: matches });

	// 		const user = await prisma.user.findUnique({ where: { id: userId } });
	// 		if (!user) {
	// 			return reply.code(404).send({ error: "User not found" });
	// 		}
	// 		await prisma.tournamentPlayer.create({
	// 			data: {
	// 				tournamentId: tournament.id,
	// 				userId: userId,
	// 				displayName: user.username,
	// 			},
	// 		});

	// 		return reply.code(201).send({ 
	// 			id: tournament.id, 
	// 			displayName: user.username,
	// 		});
	// 	} catch (err) {
	// 		request.log.error(err);
    //   		return reply.code(err.code || 500).send({ error: err.message || "Failed to create tournament" });
	// 	}
	// });

	// Add a player
	/*
		- Check tournament exists
		- Check tournament isn't already full
		- Player can join by:
			- 1) Registered user: provide username & password
				- Validate username exists
				- Check password
				- Add tournamentPlayer linked to userId
			- 2) Guest: provide guestName
				- Add tournamentPlayer with guest info
		- Enforce unique constraint - if same displayName already in tournament 
	*/
	// app.post('/api/tournaments/players', { schema: joinTournamentSchema }, async (request, reply) => {
	// 	const tournamentId = Number(request.headers['x-current-tournament-id']);
	// 	const { username, password, guestName } = request.body;

	// 	try {
	// 		const tournament = await prisma.tournament.findUnique({
	// 			where: { id: Number(tournamentId)},
	// 		});
	// 		if (!tournament) {
	// 			return reply.code(404).send({ error: 'Tournament not found'});
	// 		}
			
	// 		const count = await prisma.tournamentPlayer.count({ where: { tournamentId: Number(tournamentId) }});
	// 		if (count >= tournament.numberOfPlayers) {
	// 			return reply.code(400).send({ error: 'Tournament is already full' });
	// 		}

	// 		let playerData;
	// 		let displayName;

	// 		if (username && password) {
	// 			const user = await prisma.user.findUnique({ where: { username }});
	// 			if (!user) {
	// 				return reply.code(401).send({ error: 'Invalid username or password '});
	// 			}
	// 			const isPasswordValid = await bcrypt.compare(password, user.password);
	// 			if (!isPasswordValid) {
	// 				return reply.code(401).send({ error: 'Invalid username or password' });
	// 			}
	// 			displayName = user.username;
	// 			playerData = await prisma.tournamentPlayer.create({ 
	// 				data: {
	// 					tournamentId: Number(tournamentId),
	// 					userId: user.id,
	// 					displayName,
	// 				}
	// 			});
	// 		} else if (guestName) {
	// 			displayName = guestName;
	// 			playerData = await prisma.tournamentPlayer.create({
	// 				data: {
	// 					tournamentId: Number(tournamentId),
	// 					isGuest: true,
	// 					displayName,
	// 				}
	// 			})
	// 		}
	// 		else {
	// 			return reply.code(400).send({ error: 'Must provide either username/password or guestName'});
	// 		}
	// 		return reply.code(201).send({
	// 			id: playerData.id,
	// 			displayName: playerData.displayName,
	// 		});
	// 	} catch (err) {
	// 		if (err.code === 'P2002') {
	// 			return reply.code(409).send({ error: 'User/Display name already in tournament' });
	// 		}
	// 		request.log.error(err);
    //   		return reply.code(err.code || 500).send({ error: err.message || "Player failed to join tournament" });
	// 	}
	// });

	// Update tournament status
	/*
		- Check tournament exists
		- Check that status transition is allowed
    	- Update timestamps where appropriate
		- If updating to 'STARTED', 
			- Ensure tournament has at least 2 players
			- Seed players into brackets
			- For each round 1 match: 
				- If both players exist, create game session
				- If only one player exists, auto-advance them as winner 
    - Return updated tournament object 
	*/
	app.patch('/api/tournaments/status', { schema: updateTournamentStatusSchema, preHandler: [app.authenticate] }, async (request, reply) => {
 		const tournamentId = Number(request.headers['x-current-tournament-id']);
		const { status } = request.body;
	
	  	try {
			const tournament = await prisma.tournament.findUnique({
			where: { id: Number(tournamentId) },
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
		};
		if (!validTransitions[current].has(status)) {
		  return reply.code(400).send({ error: `Invalid transition: ${current} to ${status}` });
		}
	
		const updateData = { status };
	
		if (status === 'STARTED') {
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
	
			if (p1 && p2) {
				await prisma.tournamentMatch.updateMany({
					where: { tournamentId: Number(tournamentId), matchIndex: i + 1 },
					data: {
						player1Id: p1.id,
						player2Id: p2.id,
					},
				});
				await createGameSession(prisma, {
					tournamentId,
					matchIndex: i + 1,
					players: [
						{ userId: p1.userId, guestName: p1.isGuest ? p1.displayName : null, side: 'LEFT' },
						{ userId: p2.userId, guestName: p2.isGuest ? p2.displayName : null, side: 'RIGHT' },
					],
				});
			} else { // Auto advance for odd number of players
			  const winner = p1 && !p2 ? p1 : p2 && !p1 ? p2 : null;

			  await prisma.tournamentMatch.updateMany({
				where: { tournamentId: Number(tournamentId), matchIndex: i + 1 },
				data: {
				player1Id: p1?.id ?? null,
				player2Id: p2?.id ?? null,
				...(winner
					? {
						winnerUserId: winner.userId ?? null,
						winnerPlayerId: winner.id,
					}
					: {}),
					},
				});
				if (winner) {
					const parentIndex = getParentMatchIndex(i + 1, bracketSize);
					const parentMatch = await prisma.tournamentMatch.findUnique({
						where: { tournamentId_matchIndex: { tournamentId, matchIndex: parentIndex } },
					});

					if (parentMatch) {
						const updateData = {};
						if (!parentMatch.player1Id) updateData.player1Id = winner.id;
						else if (!parentMatch.player2Id) updateData.player2Id = winner.id;

						const updatedParent = await prisma.tournamentMatch.update({
							where: { id: parentMatch.id },
							data: updateData,
						});

						// If both players now exist, pre-create their game session
						if (updatedParent.player1Id && updatedParent.player2Id && !updatedParent.gameSessionId) {
							const parentPlayers = await prisma.tournamentPlayer.findMany({
								where: { id: { in: [updatedParent.player1Id, updatedParent.player2Id] } },
							});

							await createGameSession(prisma, {
								tournamentId,
								matchIndex: updatedParent.matchIndex,
								players: [
									{ userId: parentPlayers[0].userId, guestName: parentPlayers[0].isGuest ? parentPlayers[0].displayName : null, side: 'LEFT' },
									{ userId: parentPlayers[1].userId, guestName: parentPlayers[1].isGuest ? parentPlayers[1].displayName : null, side: 'RIGHT' },
								],
							});
						}
					}
				}
			}
		  }
		} else if (status === 'FINISHED' || status === 'ABORTED') {
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
      	return reply.code(err.code || 500).send({ error: err.message || "Failed to update tournament status" });
	  }
	});
	
	// Validate player
	/*
	*/
	app.post('/api/tournaments/validate-player', {schema: validatePlayerSchema, preHandler: [app.authenticate] }, async (request, reply) => {
		const { username, password } = request.body;

		try {
			if (username && password) {
				const user = await prisma.user.findUnique({ where: { username }});
				if (!user) {
					return reply.code(401).send({ valid: false, error: 'Invalid username or password '});
				}
				const isPasswordValid = await bcrypt.compare(password, user.password);
				if (!isPasswordValid) {
					return reply.code(401).send({ valid: false, error: 'Invalid username or password' });
				}
				return reply.send({ valid: true, displayName: user.username, userId: user.id});
			}
		} catch (err) {
			request.log.error(err);
      		return reply.code(err.code || 500).send({ error: err.message || "Failed to validate tournament player" });
		}
	});

	// Finalise tournament details
	/*
	*/
	app.post('/api/tournaments/finalize', { schema: finalizeTournamentSchema }, async(request, reply) => {
		const { numberOfPlayers, players } = request.body;
		if (players.length != numberOfPlayers )
			return reply.code(400).send({ error: 'Wrong number of players credentials given'})
		try {
			const bracketSize = 2 ** Math.ceil(Math.log2(numberOfPlayers));
			const numMatches = bracketSize - 1;

			const tournament = await prisma.tournament.create({
				data: { 
					status: "CREATED", 
					numberOfPlayers,
					bracketSize
				 },
			});
			
			const tournamentPlayers = players.map(p => ({
				tournamentId: tournament.id,
				displayName: p.displayName,
				userId: p.userId ?? null, 
				isGuest: !p.userId,
			}));
			await prisma.tournamentPlayer.createMany({ data: tournamentPlayers});

			const matches = Array.from({ length: numMatches }, (_, i) => ({
			tournamentId: tournament.id,
			matchIndex: i + 1,
			}));
			await prisma.tournamentMatch.createMany({ data: matches });
			
			return reply.code(201).send({ 
				id: tournament.id,
				status: tournament.status,
			});
		} catch (err) {
			request.log.error(err);
      		return reply.code(err.code || 500).send({ error: err.message || "Failed to create tournament" });
		}
	});
	// Get next match
	/*
		- Look for next match in tournament
		- If exists, return match with player info
		- Else, fetch full tournament and its matches and build results object 
	*/
	app.get('/api/tournaments/next-match', { schema: getNextMatchSchema, preHandler: [app.authenticate] }, async (request, reply) => {
 		const tournamentId = Number(request.headers['x-current-tournament-id']);
		try {
			const nextMatch = await prisma.tournamentMatch.findFirst({
				where: {
					tournamentId: Number(tournamentId),
					gameSession: {
						status: { not: 'FINISHED' },
					},
				},
				include: {
					gameSession: { include: { players: true } },
					player1: true, 
					player2: true,
				},
				orderBy: { matchIndex: 'asc' },

			});

			if (nextMatch) {
				return reply.send({
					tournamentId: Number(tournamentId),
					nextMatch: {
						matchId: nextMatch.id,
						matchIndex: nextMatch.matchIndex,
						tournamentId: Number(tournamentId),
						player1: nextMatch.player1 
							? { id: nextMatch.player1.id, displayName: nextMatch.player1.displayName }
							: null,
						player2: nextMatch.player2
							? { id: nextMatch.player2.id, displayName: nextMatch.player2.displayName}
							: null,
						gameSessionId: nextMatch.gameSessionId,
						gameStatus: nextMatch.gameSession?.status,
					},
				});
			}

			const tournament = await prisma.tournament.findUnique({
				where: { id: Number(tournamentId) },
				include: {
					matches: {
						include: { gameSession: true, player1: true, player2: true },
						orderBy: { matchIndex: 'asc' },
					},
				},
			});
			if (!tournament) {
				return reply.code(404).send({ error: 'Tournament not found' });
			}
			const finalMatch = tournament.matches[tournament.matches.length - 1];
			return reply.send({
				tournamentId: tournament.id,
				status: 'FINISHED',
				nextMatch: null,
				results: {
					champion: finalMatch?.winnerPlayerId 
					? (finalMatch.player1?.id === finalMatch.winnerPlayerId 
						? finalMatch.player1?.displayName ?? "-"
						: finalMatch.player2?.displayName ?? "-")
					: null,
					bracket: tournament.matches.map(m => ({
						matchIndex: m.matchIndex,
						player1: m.player1?.displayName ?? "-",
						player2: m.player2?.displayName ?? "-",
						winner: m.winnerPlayerId
						? (m.player1?.id === m.winnerPlayerId
							? m.player1?.displayName ?? "—"
							: m.player2?.displayName ?? "—")
						: "—",
					})),
				stats: {
					totalMatches: tournament.matches.length,
					playedMatches: tournament.matches.filter(m => m.gameSession?.status === 'FINISHED').length,
					},
				},
			});
		} catch (err) {
			request.log.error(err);
      		return reply.code(err.code || 500).send({ error: err.message || "Failed to get next match in tournament" });
		}
	});

}
export default tournamentRoutes;
