import {prismaUserData, prismaGameData} from "../prisma/prismaClient.js";
import { matchHistorySchema, gameDashboardSchema, userDashboardSchema } from "../schemas/dashboard.js";

async function dashboardRoutes(app, options) {
  // Play counts for heatmap (moved from Profile Service)
  app.get('/stats/play-counts', {
    preHandler: [app.authenticate]
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const { start, end } = request.query;

      if (!start || !end) {
        return reply.code(400).send({ 
          error: 'start and end query parameters are required' 
        });
      }

      const startDate = new Date(start);
      const endDate = new Date(end);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return reply.code(400).send({ error: 'Invalid date format' });
      }

      if (startDate > endDate) {
        return reply.code(400).send({ 
          error: 'start date must be before end date' 
        });
      }

      // ✅ Query game database (prismaGame)
      const sessions = await prismaGameData.gameSessionPlayer.findMany({
        where: {
          userId: userId,
          session: { 
            status: 'FINISHED',
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        select: { 
          session: { 
            select: { createdAt: true } 
          } 
        }
      });

      // Group by date (YYYY-MM-DD)
      const countsByDate = {};
      sessions.forEach(s => {
        const created = s.session && s.session.createdAt;
        if (!created) return;
        const d = created.toISOString().split('T')[0];
        countsByDate[d] = (countsByDate[d] || 0) + 1;
      });

      // Build result array for the range (include zero days)
      const result = [];
      const cur = new Date(startDate);
      while (cur <= endDate) {
        const key = cur.toISOString().split('T')[0];
        result.push({ date: key, count: countsByDate[key] || 0 });
        cur.setDate(cur.getDate() + 1);
      }

      return reply.code(200).send(result);
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ 
        error: 'Failed to fetch play counts' 
      });
    }
  });
  // Fetch match history
  app.get("/stats/users/match-history",
    { schema: matchHistorySchema, preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user.id;

      try {
        // Check user exists (from user-data.db)
        const user = await prismaUserData.user.findUnique({ where: { id: userId } });
        if (!user) {
          return reply.code(404).send({ error: "User not found" });
        }
        // Fetch matches (from game-tournament.db)
        const matches = await prismaGameData.gameSessionPlayer.findMany({
          where: {
            userId: userId,
            session: { status: "FINISHED" },
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
            session: { createdAt: "desc" },
          },
        });
         // Get all user IDs to fetch avatars
         const userIds = new Set();
         matches.forEach(m => {
           m.session.players.forEach(p => {
             if (p.userId) userIds.add(p.userId);
           });
         });
 
         // Fetch user avatars (from user-social.db)
         const users = await prismaUserData.user.findMany({
           where: { id: { in: Array.from(userIds) } },
           select: { id: true, avatar: true }
         });
        const userAvatarMap = new Map(users.map(u => [u.id, u.avatar]));
        const matchHistory = matches
          .filter((m) => m.session.winnerPlayerId !== null)
          .map((m) => {
            const opponent = m.session.players.find((p) => p.id !== m.id);
            return {
              date: m.session.createdAt,
              opponent: opponent?.displayName ?? "Unknown",
              opponentAvatar: opponent?.userId 
                ? userAvatarMap.get(opponent.userId) || "/uploads/avatars/default.png"
                : "/uploads/avatars/default.png",
              userScore: m.score,
              opponentScore: opponent?.score ?? 0,
              result: m.session.winnerPlayerId === m.id ? "WIN" : "LOSS",
              isTournament: m.session.tournamentMatch !== null,
            };
          });
        return reply.send(matchHistory);
      } catch (err) {
        request.log.error(err);
        return reply
          .code(500)
          .send({ error: err.message || "Failed to fetch match history" });
      }
    }
  );

  // Fetch game session results
  /*
		- Checks: session exists, session is finished, request user is in the game
		- Fetches summary: winner avatar, final score, duration
		- Fetches timeline of score progression (removing paused time)
		- Fetches player info: avatar, score, time to first point, average time per point, total matches, total wins, win rate
	*/
  app.get("/stats/game",
    { schema: gameDashboardSchema, preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user.id;
      const sessionIdHeader = request.headers["x-current-session-id"];
      try {
        const session = await prismaGameData.gameSession.findUnique({
          where: { id: Number(sessionIdHeader) },
          include: {
            players: true,
            events: {
              orderBy: { timestamp: "asc" },
              include: { player: { select: { side: true } } },
            },
            winnerPlayer: true,
            tournamentMatch: {
              include: { tournament: true },
            },
          },
        });

        if (!session)
          return reply.code(404).send({ error: "Session not found" });
        if (session.status !== "FINISHED")
          return reply.code(400).send({ error: "Session has not ended" });

        let isAuthorized = false;

        if (!session.tournamentMatch) {
          isAuthorized = session.players.some((p) => p.userId === userId);
        } else {
          const tournamentPlayers = await prismaGameData.tournamentPlayer.findMany({
            where: { tournamentId: session.tournamentMatch.tournamentId },
            select: { userId: true },
          });
          isAuthorized = tournamentPlayers.some((p) => p.userId === userId);
        }

        if (!isAuthorized) {
          return reply.code(403).send({
            error: "You are not authorized to view this game session",
          });
        }

        // Summary
        // Get user IDs for avatar/stats lookup
        const userIds = session.players
          .filter(p => p.userId)
          .map(p => p.userId);

        // Fetch user data (from user-social.db)
        const users = await prismaUserData.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            avatar: true,
            totalMatches: true,
            totalWins: true,
            winRate: true,
          }
        });
        const userDataMap = new Map(users.map(u => [u.id, u]));
         // Build summary
        const winnerPlayer = session.players.find(
          (p) => p.id === session.winnerPlayerId
        );
        const winnerUserData = winnerPlayer?.userId 
        ? userDataMap.get(winnerPlayer.userId)
        : null;
        const winner = winnerPlayer
          ? {
              displayName: winnerPlayer.displayName,
              avatar: winnerUserData?.avatar ?? "/uploads/avatars/default.png",
              side: winnerPlayer.side,
            }
          : null;

        const leftPlayer = session.players.find((p) => p.side === "LEFT");
        const rightPlayer = session.players.find((p) => p.side === "RIGHT");

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
            const resume = session.events
              .slice(i + 1)
              .find((e) => e.type === "RESUME");
            pausedMs +=
              resume.timestamp.getTime() -
              session.events[i].timestamp.getTime();
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
            });
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
        const playerStats = session.players.map((p) => {
          const userData = p.userId ? userDataMap.get(p.userId) : null;

          const playerEvents = session.events.filter(
            (e) => e.type === "POINT" && e.playerId === p.id
          );
          const timeToFirstPointSec =
            playerEvents.length > 0
              ? (playerEvents[0].timestamp.getTime() - startedAt.getTime()) /
                1000
              : null;

          const avgTimePerPointSec =
            playerEvents.length > 1
              ? (playerEvents[playerEvents.length - 1].timestamp.getTime() -
                  startedAt.getTime()) /
                1000 /
                (playerEvents.length - 1)
              : null;

              return {
                displayName: p.displayName,
                side: p.side,
                avatar: userData?.avatar ?? "/uploads/avatars/default.png",
                score: p.score,
                timeToFirstPointSec,
                avgTimePerPointSec,
                totalMatches: userData?.totalMatches ?? 0,
                totalWins: userData?.totalWins ?? 0,
                winRate: userData?.winRate ?? 0,
              };
        });

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
        return reply
          .code(500)
          .send({ error: err.message || "Failed to fetch game dashbaord" });
      }
    }
  );

  // Fetch data for user dashboard
  app.get("/stats/user",
    { schema: userDashboardSchema, preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user.id;

      try {
        // Overview stats
        const overviewData = await prismaUserData.user.findUnique({
          where: { id: Number(userId) },
          select: {
            totalMatches: true,
            totalWins: true,
            winRate: true,
            avgScore: true,
            currentWinStreak: true,
            longestWinStreak: true,
            lastPlayedAt: true,
          },
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
        // Fetch sessions (from game-tournament.db)
        const sessions = await prismaGameData.gameSession.findMany({
          where: {
            status: "FINISHED",
            players: { some: { userId: Number(userId) } },
          },
          include: {
            players: true,
          },
        });
        // Line chart: win rate over time
        const dailyStatsMap = new Map();
        for (const s of sessions) {
          if (!s.endedAt) continue;
          const date = s.endedAt.toISOString().split("T")[0];
          const record = dailyStatsMap.get(date) || { wins: 0, total: 0 };
          record.total += 1;
          if (s.winnerUserId === userId) record.wins += 1;
          dailyStatsMap.set(date, record);
        }
        const dailyStats = Array.from(dailyStatsMap.entries()).map(
          ([date, { wins, total }]) => ({
            date,
            winRate: total > 0 ? Math.round((wins / total) * 100) / 100 : 0,
          })
        );

        // Score histogram
        const scores = await prismaGameData.gameSessionPlayer.findMany({
          where: { userId: Number(userId) },
          select: { score: true },
        });
        const scoreDistribution = scores.map((s) => Math.round(s.score));

        // Wins per opponent
        const opponents = new Map();
        const opponentUserIds = new Set();

        for (const s of sessions) {
          const opponentPlayer = s.players.find(
            (p) => p.userId && p.userId !== userId
          );
          if (!opponentPlayer) continue;

          const opponentId = opponentPlayer.userId;
          opponentUserIds.add(opponentId);

          const existing = opponents.get(opponentId) || {
            name: opponentPlayer.displayName,
            wins: 0,
            total: 0,
          };

          existing.total += 1;
          if (s.winnerUserId === userId) existing.wins += 1;

          opponents.set(opponentId, existing);
        }

        // Fetch opponent usernames (from user-social.db)
        const opponentUsers = await prismaUserData.user.findMany({
          where: { id: { in: Array.from(opponentUserIds) } },
          select: { id: true, username: true }
        });
        const opponentUsernameMap = new Map(
          opponentUsers.map(u => [u.id, u.username])
        );
        const winsPerOpponent = Array.from(opponents.entries())
          .map(([opponentId, data]) => ({
            opponent: opponentUsernameMap.get(opponentId) || data.name,
            winRate: Math.round((data.wins / data.total) * 100),
            total: data.total,
          }))
          .sort((a, b) => b.winRate - a.winRate)
          .slice(0, 5);

        // Leaderboard
        const users = await prismaUserData.user.findMany({
          select: {
            id: true,
            username: true,
            totalMatches: true,
            winRate: true,
            avgScore: true,
          },
        });
        const maxMatches = Math.max(...users.map((u) => u.totalMatches || 1));
        const maxAvgScore = Math.max(...users.map((u) => u.avgScore || 1));
        const ranked = users.map((u) => {
          const leaderboardScore =
            0.5 * u.winRate +
            0.3 * (u.totalMatches / maxMatches) +
            0.2 * (u.avgScore / maxAvgScore);
          return {
            ...u,
            winRate: Math.round(u.winRate),
            avgScore: Math.round(u.avgScore),
            leaderboardScore: Math.round(leaderboardScore),
          };
        });
        ranked.sort((a, b) => b.leaderboardScore - a.leaderboardScore);
        const userIndex = ranked.findIndex((u) => u.id === Number(userId));
        let start = 0;
        let end = 5;

        if (userIndex !== -1) {
          if (userIndex <= 1) {
            start = 0;
            end = 5;
          } else if (userIndex >= ranked.length - 2) {
            start = Math.max(ranked.length - 5, 0);
            end = ranked.length;
          } else {
            start = userIndex - 2;
            end = userIndex + 3;
          }
        }

        const leaderboard = ranked.slice(start, end).map((u, i) => ({
          rank: start + i + 1,
          username: u.username,
          totalMatches: u.totalMatches,
          winRate: u.winRate,
          avgScore: u.avgScore,
          leaderboardScore: u.leaderboardScore,
          isCurrentUser: u.id === Number(userId),
        }));

        return reply.send({
          overview,
          dailyStats,
          scoreDistribution,
          winsPerOpponent,
          leaderboard,
        });
      } catch (err) {
        request.log.error(err);
        return reply
          .code(500)
          .send({ error: err.message || "Failed to fetch user dashboard" });
      }
    }
  );
}

export default dashboardRoutes;
