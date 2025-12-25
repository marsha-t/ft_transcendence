import {prismaUserData, prismaGameData} from "../prisma/prismaClient.js";
import { playCountsSchema, matchHistorySchema, gameDashboardSchema, userDashboardSchema } from "../schemas/dashboard.js";

async function dashboardRoutes(app, options) {
  // Generate play counts for heatmap
  /*
    - Check that start date is before end date
    - Fetch all finished game sessions played by request user within date range
    - Aggregate games played by day
    - Return continuous date series, including days with zero games.
  */
  app.get('/stats/play-counts', { schema: playCountsSchema, 
    preHandler: [app.authenticate]
  }, async (request, reply) => {
    const userId = request.user.id;
    const { start, end } = request.query;

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate > endDate) {
      const err = new Error('Start date must be before end date'); 
      err.statusCode = 400; 
      err.code = 'START_AFTER_END'; 
      throw err;
    }

    const sessions = await prismaGameData.gameSessionPlayer.findMany({
      where: {
        userId: userId,
        session: { 
          status: 'FINISHED',
          createdAt: {
            gte: startDate, // greater than or equal to
            lte: endDate // less than or equal to 
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
      const d = created.toISOString().split('T')[0]; // from "2024-12-01T14:37:22.123Z" to "2024-12-01"
      countsByDate[d] = (countsByDate[d] || 0) + 1; // increment count
    });

    const result = [];
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const key = cur.toISOString().split('T')[0];
      result.push({ date: key, count: countsByDate[key] || 0 });// default to 0 if no games that day
      cur.setDate(cur.getDate() + 1);
    }
    return reply.send(result);
  });

  // Fetch match history
  /*
    - Fetch all finished matches involving user
    - Gather all userIds used in matches 
    - Fetch avatars for all users and organise into (id:avatar url) map
    - Remove (filter) matches without winner
    - Transform matches into object for match-history table
  */
  app.get("/stats/users/match-history",
    { schema: matchHistorySchema, preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user.id;

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

      // Collect all userIds in the matches (to fetch avatars)
      const userIds = new Set();
      matches.forEach(m => {
        m.session.players.forEach(p => {
          if (p.userId) userIds.add(p.userId);
        });
      });

      // Fetch user avatars and put into Map (id: avatar url)
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
    }
  );

  // Fetch game session results
  /*
		- Checks: session exists, session is FINISHED, request user is in the game
		- Fetches summary: winner avatar, final score, duration (total and active i.e., without paused time)
		- Fetches timeline of score progression and ignoring any paused time
		- Fetches player info: avatar, score, time to first point, average time per point, total matches, total wins, win rate
      - Most fields are taken from data but time to first point and average time per point are derived here 
	*/
  app.get("/stats/game",
    { schema: gameDashboardSchema, preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user.id;
      const sessionIdHeader = request.headers["x-current-session-id"];

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

      if (!session) {
        const err = new Error("Session not found");
        err.statusCode = 404;
        err.code = "SESSION_NOT_FOUND";
        throw err;
      }
      if (session.status !== "FINISHED") {
        const err = new Error("Session has not ended");
        err.statusCode = 400;
        err.code = "SESSION_NOT_FINISHED";
        throw err;
      }
      
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
        const err = new Error("You are not authorized to view this game session");
        err.statusCode = 403;
        err.code = "UNAUTHORIZED_GAME_ACCESS";
        throw err;
      }

      // 1. Summary
      const userIds = session.players
        .filter(p => p.userId)
        .map(p => p.userId); // Get user IDs for avatar/stats lookup

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

      // Compute total duration and active duration (minus paused time)
      const startedAt = session.startedAt || session.createdAt;
      const endedAt = session.endedAt || new Date();

      let pausedMs = 0;
      for (let i = 0; i < session.events.length; i++) { // for each PAUSE event, find RESUME event and add interval to pausedMs
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

      // 2. Build timeline
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
          });
        } else if (e.type === "PAUSE") {
          paused = true;
        } else if (e.type === "RESUME" && paused) {
          paused = false;
          lastTimestamp = e.timestamp;
        }
      }

      // 3. Player stats for both players
      const playerStats = session.players.map((p) => {
        const userData = p.userId ? userDataMap.get(p.userId) : null; // fetch user data if player is a user

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
    }
  );

  // Fetch data for user dashboard
  /*
  - Fetch overview stats from user database
  - Fetch data for win rate over time line chart: fetch finished sessions for user and 
    organize into map (Date: { wins, total })
  - Fetch data for score histogram: array of scores
  - Fetch data for wins per opponent bar chart: 
    - Gather all opponents and calculate their win rate and extract top 5 opponents by win rate
  - Fetch data for leaderboard
    - Formula: Score = 0.5 x WinRate + 0.3 x (Total Matches / MaxMatches) + 0.2 x (AvgScore/MaxAvgScore)
    - Fetch 5 rows centered around user
  */
  app.get("/stats/user",
    { schema: userDashboardSchema, preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user.id;

      // 1. Overview stats
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

      // 1. Line chart: win rate over time
      const sessions = await prismaGameData.gameSession.findMany({
        where: {
          status: "FINISHED",
          players: { some: { userId: Number(userId) } },
        },
        include: {
          players: true,
        },
      });
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

      // 2. Score histogram
      const scores = await prismaGameData.gameSessionPlayer.findMany({
        where: { userId: Number(userId) },
        select: { score: true },
      });
      const scoreDistribution = scores.map((s) => Math.round(s.score));

      // 3. Wins per opponent
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

      const opponentUsers = await prismaUserData.user.findMany({
        where: { id: { in: Array.from(opponentUserIds) } },
        select: { id: true, username: true }
      }); // Fetch opponent usernames 
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
    }
  );
}

export default dashboardRoutes;
