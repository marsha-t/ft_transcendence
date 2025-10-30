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
							players: {
								include: {
									user: { select: { avatar: true } },
								}
							},
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
						opponentAvatar: opponent?.user?.avatar ?? "/uploads/avatars/default.png",
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
}

export default dashboardRoutes;