import prisma from '../prisma/prismaClient.js';
import { matchHistorySchema, gameDashboardSchema, userDashboardSchema } from '../schemas/dashboard.js';

async function dashboardRoutes(app, options) {

	// Fetch match history 
	/*
		- 
	*/
	app.get('/api/stats/users/match-history', { schema: matchHistorySchema, preHandler: [app.authenticate] }, async(request, reply) => {
		const userId = request.user.id;

		try {
			const user = await prisma.user.findUnique({ where: { id: userId } });
			if (!user) {
				return reply.code(404).send({ error: "User not found" });
			}
			const matches = await prisma.gameSessionPlayer.findMany({
				where: { 
					userId: userId, 
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
				players: playerStats,
			});
		} catch (err) {
			request.log.error(err);
			return reply.code(500).send({ error: err.message || "Failed to fetch game dashbaord" });
		}
	});

	// Fetch data for user dashboard
	app.get('/api/stats/user', { schema: userDashboardSchema }, async (request, reply) => {
		const userId = request.headers['x-current-user-id'];
		try {
			// Overview stats
			const overviewData = await prisma.user.findUnique({ 
				where: { id: Number(userId) },
				select: {
					totalMatches: true, 
					totalWins: true, 
					winRate: true,
					avgScore: true,
					currentWinStreak: true, 
					longestWinStreak: true, 
					lastPlayedAt: true,
				}
			});

			const overview = overviewData && {
				totalMatches: overviewData.totalMatches, 
				totalWins: overviewData.totalWins, 
				winRate: Math.round(overviewData.winRate),
				avgScore: Math.round(overviewData.avgScore),
				currentWinStreak: overviewData.currentWinStreak, 
				longestWinStreak: overviewData.longestWinStreak, 
				lastPlayedAt: overviewData.lastPlayedAt,
			};

			// Line chart: win rate over time
			const sessions = await prisma.gameSession.findMany({
				where: { status: 'FINISHED', players: { some: { userId: Number(userId) } } },
				include: {
					players: {
						include : { user: { select: { id: true, username: true } } }
					},
					winnerUser: { select: { id: true, username: true }},
				},
			});
			const dailyStatsMap = new Map();
			for (const s of sessions) {
				if (!s.endedAt) continue;
				const date = s.endedAt.toISOString().split('T')[0];
				const record = dailyStatsMap.get(date) || { wins: 0, total: 0 };
				record.total += 1;
				if (s.winnerUserId === userId) record.wins += 1;
				dailyStatsMap.set(date, record);
			}
			const dailyStats = Array.from(dailyStatsMap.entries()).map(([date, { wins, total}]) => ({
				date,
				winRate: total > 0 ? Math.round((wins / total) * 100) / 100 : 0,
			}));

			// Score histogram
			const scores = await prisma.gameSessionPlayer.findMany({ 
				where: { userId: Number(userId) },
				select: { score: true },
			});
			const scoreDistribution = scores.map((s) => Math.round(s.score));

			// Wins per opponent
			const opponents = new Map();

			for (const s of sessions) {
				const opponent = s.players.find((p) => p.userId && p.userId !== userId);
				if (!opponent) continue;

				const existing = opponents.get(opponents.userId) || {
					name: opponent.user?.username || opponent.displayName, 
					wins: 0, 
					total: 0,
				};

				existing.total += 1;
				if (s.winnerUserId === userId) existing.wins += 1;
				opponent.set(opponent.userId, existing);
			}
			
			const winsPerOpponent = Array.from(opponents.values()).map((o) => ({
				opponent: o.name, 
				winRate: Math.round((o.wins / o.total) * 100),
				total: o.total,
			})).sort((a, b) => b.total - a.total)
				.slice(0, 5);

			// Leaderboard
			const users = await prisma.user.findMany({
				select: { username: true, totalMatches: true, winRate: true, avgScore: true }
			});
			const maxMatches = Math.max(...users.map(u => u.totalMatches || 1));
			const maxAvgScore = Math.max(...users.map(u => u.avgScore || 1));
			const ranked = users.map(u => {
				const leaderboardScore = 0.5 * u.winRate + 0.3 * (u.totalMatches / maxMatches) + 0.2 * (u.avgScore / maxAvgScore);
				return {...u, 
					winRate: Math.round(u.winRate),
					avgScore: Math.round(u.avgScore),
					leaderboardScore: Math.round(leaderboardScore)};

			});
			const leaderboard = ranked.sort((a, b) => b.leaderboardScore - a.leaderboardScore).slice(0, 10);
			return reply.send({
				overview,
				dailyStats,
				scoreDistribution,
				winsPerOpponent,
				leaderboard,
			});
		} catch (err) {
			request.log.error(err);
			return reply.code(500).send({ error: err.message || "Failed to fetch user dashboard" });
		}
	});
}

export default dashboardRoutes;