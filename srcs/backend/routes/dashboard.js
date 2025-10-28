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
		- 
	*/
	app.get('/api/stats/game',/* { schema: gameDashboardSchema} ,*/ async (request, reply) => {
		const sessionIdHeader = request.headers['x-current-session-id'];
		try {
			const session = await prisma.gameSession.findUnique({ 
				where: { id: Number(sessionIdHeader) },
				include: {
					players: {
						include: { user: { select: { avatar: true }}},
					},
					events: {
						orderBy: { timestamp: 'asc' },
						include: { player: { select: { side: true }}},
					}
				}
			});

			if (!session) return reply.code(404).send({ error: "Session not found" });
			if (session.status !== "FINISHED") return reply.code(400).send({ error: "Session has not ended" });
			
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

			// Player statistics
			
			return reply.send({
				timeline,
			});

		} catch (err) {
			request.log.error(err);
			return reply.code(500).send({ error: err.message || "Failed to fetch game dashbaord" });
		}
	});
}

export default dashboardRoutes;