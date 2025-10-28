import prisma from '../prisma/prismaClient.js';
import { matchHistorySchema } from '../schemas/dashboard.js';

async function dashboardRoutes(app, options) {

	// Fetch match history 
	/*
		- 
	*/
	app.get('/api/stats/users/match-history', { schema: matchHistorySchema }, async(request, reply) => {
		const userIdHeader = request.headers['x-current-user-id'];
  		const id = userIdHeader ? Number(userIdHeader) : null;

		try {
			const user = await prisma.user.findUnique({ where: { id: Number(id) } });
			if (!user) {
				return reply.code(404).send({ error: "User not found" });
			}
			const matches = await prisma.gameSessionPlayer.findMany({
				where: { 
					userId: Number(id), 
					session: { status: 'FINISHED' },
				},
				include: {
					session: {
						include: { 
							players: true,
							tournamentMatch: true,
						 },
					},
				},
				orderBy: {
					session: { createdAt: 'desc' },
				}
			});

			const matchHistory = matches
				.filter(m=> m.session.winnerPlayerId !== null)
				.map(m => {
					const opponent = m.session.players.find(p => p.id !== m.id );
					return {
						date: m.session.createdAt,
						opponent: opponent?.displayName ?? "Unknown",
						userScore: m.score,
						opponentScore: opponent?.score ?? 0,
						result: m.session.winnerPlayerId === m.id ? "WIN" : "LOSS",
						isTournament: m.session.tournamentMatch !== null
					};
			});
			return reply.send(matchHistory);
		} catch (err) {
			request.log.error(err);
      		return reply.code(500).send({ error: err.message || "Failed to fetch match history" });
		}
	});

	// Fetch game session results 
	/*
		- Fetches summary: winner avatar, final score, duration
		- Fetches timeline of score progression (removing paused time)
		- Fetches player info: avatar, score, time to first point, average time per point, total matches, total wins, win rate
	*/
	app.get('/api/stats/game', { schema: gameDashboardSchema} , async (request, reply) => {
		const sessionIdHeader = request.headers['x-current-session-id'];
		try {
			const session = await prisma.gameSession.findUnique({ 
				where: { id: Number(sessionIdHeader) },
				include: {
					players: {
						include: { user: { select: { avatar: true, totalMatches: true, totalWins: true, winRate: true }}},
					},
					events: {
						orderBy: { timestamp: 'asc' },
						include: { player: { select: { side: true }}},
					},
					winnerPlayer: {
						include: {
							user: { select: { avatar: true } },
						}
					},
				}
			});

			if (!session) return reply.code(404).send({ error: "Session not found" });
			if (session.status !== "FINISHED") return reply.code(400).send({ error: "Session has not ended" });
			
			// Summary 
			const winnerPlayer = session.players.find(p => p.id === session.winnerPlayerId);
			const winner = winnerPlayer 
				? {
					displayName: winnerPlayer.displayName,
					avatar: winnerPlayer.user?.avatar ?? '/uploads/avatars/default.png',
					side: winnerPlayer.side,
				}
				: null;
			
			const leftPlayer = session.players.find(p => p.side === 'LEFT');
			const rightPlayer = session.players.find(p => p.side === 'RIGHT');
			
			const finalScore = {
				left: leftPlayer?.score ?? 0,
				right: rightPlayer?.score ?? 0,
			};

			// Compute duration (minus paused time)
			const startedAt = session.startedAt || session.createdAt;
			const endedAt = session.endedAt || new Date();

			let pausedMs = 0;
			for (let i = 0; i < session.events.length; i++) {
				if (session.events[i].type === "PAUSE") {
					const resume = session.events.slice(i + 1).find(e => e.type === "RESUME");
					pausedMs += resume.timestamp.getTime() - session.events[i].timestamp.getTime();
				}
			}

			const totalDuration = endedAt.getTime() - startedAt.getTime();
			const activeDuration = totalDuration - pausedMs;

			// Build timeline
			const timeline = [];
			let paused = false;
			let pauseStart = null;
			let lastTimestamp = startedAt;
			let elapsedActiveMs = 0;

			for (const e of session.events) {
				if (e.type === "POINT") {
					elapsedActiveMs += e.timestamp - lastTimestamp;
					lastTimestamp = e.timestamp;
					timeline.push({
						elapsedSec: elapsedActiveMs / 1000,
						scoreLeft: e.scoreLeft,
						scoreRight: e.scoreRight,
						scorerSide: e.player?.side ?? null,
					})
				} else if (e.type === "PAUSE") {
					paused = true;
					pauseStart = e.timestamp;
				} else if (e.type === "RESUME" && paused) {
					paused = false;
					pauseStart = null;
					lastTimestamp = e.timestamp;
				}
			}

			// Player stats
			const playerStats = session.players.map(p => {
				const playerEvents = session.events.filter(
					e => e.type === 'POINT' && e.playerId === p.id 
				);
				const timeToFirstPointSec = playerEvents.length > 0 
					? (playerEvents[0].timestamp.getTime() - startedAt.getTime()) / 1000
					: null;
				
				const avgTimePerPointSec = playerEvents.length > 1 
					? (playerEvents[playerEvents.length - 1].timestamp.getTime() - startedAt.getTime()) / 1000 / (playerEvents.length - 1)
					: null ;

				return {
					displayName: p.displayName,
					side: p.side, 
					avatar: p.user?.avatar ?? '/uploads/avatars/default.png',
					score: p.score,
					timeToFirstPointSec,
					avgTimePerPointSec,
					totalMatches: p.user?.totalMatches ?? 0,
					totalWins: p.user?.totalWins ?? 0,
					winRate: p.user?.winRate ?? 0,
				};
			})

			return reply.send({
				summary: {
					sessionId: session.id,
					status: session.status,
					startedAt,
					endedAt,
					totalDurationSec: totalDuration / 1000,
					activeDurationSec: activeDuration / 1000,
					finalScore,
					winner,
				},
				timeline,
				player, playerStats,
			});
		} catch (err) {
			request.log.error(err);
			return reply.code(500).send({ error: err.message || "Failed to fetch game dashbaord" });
		}
	});
}

export default dashboardRoutes;