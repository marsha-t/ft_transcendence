import prisma from "../prisma/prismaClient.js";
import { createGameSession } from "../services/gameSessionService.js";
import {
  checkSession,
  checkPlayer,
} from "../services/gameSessionPlayersService.js";
import {
  joinSessionSchema,
  listPlayersSessionSchema,
  updateScoreSchema,
  deletePlayerSchema,
} from "../schemas/gameSessionPlayers.js";
import { propagateWinner } from "../services/tournamentService.js";

async function gameSessionPlayersRoutes(app, options) {
  // Player joins a session
  /*
		Route allows for user (via userId) as well as guest to be added to session
		- Checks session exists and is of 'CREATED' status
		- Checks that side is not already taken and session isn't already full
		- Check that player in session doesn't already use the same displayname
		- Check that request user is in the game
		- Add player to GameSessionPlayer table
	*/
  app.post(
    "/game-sessions/players",
    { schema: joinSessionSchema, preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user.id;
      const sessionIdHeader = request.headers["x-current-session-id"];
      const sessionId = sessionIdHeader ? Number(sessionIdHeader) : null;

      const { playerUserId, guestName, side } = request.body ?? {};

      if (!sessionId) {
        return reply
          .code(400)
          .send({ error: "X-Current-Session-Id header is required" });
      }

      if (!playerUserId && !guestName) {
        return reply
          .code(400)
          .send({ error: "Must provide playerUserId or guestName" });
      }
      try {
        const session = await prisma.gameSession.findUnique({
          where: { id: Number(sessionId) },
          include: { players: true },
        });
        if (!session) {
          throw { code: 404, message: "Game session not found" };
        }
        if (session.status !== "CREATED") {
          throw { code: 400, message: "Session cannot accept new players" };
        }
        if (session.players.some((p) => p.side === side)) {
          throw { code: 409, message: "Side already taken" };
        }
        if (session.players.length >= 2) {
          throw { code: 409, message: "Session already full" };
        }
        const isUserPlayer = session.players.some((p) => p.userId === userId);
        if (!isUserPlayer) {
          return reply
            .code(403)
            .send({ error: "You are not a player in this game session" });
        }
        let displayName;
        if (playerUserId) {
          const user = await prisma.user.findUnique({
            where: { id: Number(playerUserId) },
            select: { username: true },
          });
          if (!user) {
            throw { code: 404, message: "User not found" };
          }
          displayName = user.username;
        } else if (guestName) {
          displayName = guestName;
        } else {
          throw { code: 400, message: "Guest must provide a guestName" };
        }

        if (session.players.some((p) => p.displayName === displayName)) {
          throw {
            code: 409,
            message: "Display name is already taken in this session",
          };
        }

        const newPlayer = await prisma.gameSessionPlayer.create({
          data: {
            sessionId: Number(sessionId),
            userId: playerUserId ? Number(playerUserId) : null,
            isGuest: !playerUserId,
            displayName,
            side,
          },
          include: { user: { select: { id: true, username: true } } },
        });

        return reply.code(201).send(newPlayer);
      } catch (err) {
        request.log.error(err);
        return reply
          .code(err.code || 500)
          .send({ error: err.message || "Player failed to join session" });
      }
    }
  );

  // Update player score
  /* 
		- Checks session exists and that it is 'PLAYING'
		- Updates player's score
    - Fetch refreshed scores for logging
		- If score reaches win condition (score = 5)
			- Mark session as FINISHED and records winner in GameSession table (PlayerId = GameSessionPlayer.id)
      - Update GameEvent as well (playerId = GameSessionPlayer.id)
			- Update stats in User table 
				- If session is from a tournament, 
					- update winner in TournamentMatch table (PlayerId = TournamentPlayer.id)
					- propagateWinner() propagates winner and also marks tournament as FINISHED if last match
		- returns updated session 
	*/
  app.patch(
    "/game-sessions/players/score",
    { schema: updateScoreSchema, preHandler: [app.authenticate] },
    async (request, reply) => {
      const userId = request.user.id;
      const sessionIdHeader = request.headers["x-current-session-id"];
      const sessionId = sessionIdHeader ? Number(sessionIdHeader) : null;
      const side = request.headers["x-player-side"];

      try {
        const session = await checkSession(prisma, userId, sessionId);
        if (session.status !== "PLAYING") {
          return reply.code(400).send({
            error: `Cannot update score when game status is '${session.status}'.`,
          });
        }

        // Update score
        const player = await prisma.gameSessionPlayer.update({
          where: { sessionId_side: { sessionId: Number(sessionId), side } },
          data: { score: { increment: 1 } },
          include: { tournamentPlayer: { select: { id: true } } },
        });

        // Fetch refreshed scores for logging GameEvent
        const players = await prisma.gameSessionPlayer.findMany({
          where: { sessionId: Number(sessionId) },
          select: { id: true, side: true, score: true },
        });

        const leftScore = players.find((p) => p.side === "LEFT")?.score ?? 0;
        const rightScore = players.find((p) => p.side === "RIGHT")?.score ?? 0;

        await prisma.gameEvent.create({
          data: {
            sessionId: Number(sessionId),
            playerId: player.id,
            type: "POINT",
            scoreLeft: leftScore,
            scoreRight: rightScore,
          },
        });

        // If game reaches winning score
        let finishedGame = null;

        if (player.score >= 5) {
          finishedGame = await prisma.gameSession.update({
            where: { id: session.id },
            data: {
              status: "FINISHED",
              endedAt: new Date(),
              winnerUserId: player.userId ?? null,
              winnerPlayerId: player.id,
            },
            include: { players: true },
          });

          await prisma.gameEvent.create({
            data: {
              sessionId: session.id,
              playerId: player.id,
              type: "FINISH",
              scoreLeft: leftScore,
              scoreRight: rightScore,
            },
          });
        }

        // User stats update
        if (finishedGame) {
          const winnerUserId = player.userId;
          const losingPlayer = finishedGame.players.find(
            (p) => p.userId !== winnerUserId
          );

          // Update winner stats
          if (winnerUserId) {
            const winner = await prisma.user.findUnique({
              where: { id: winnerUserId },
            });

            const totalMatches = winner.totalMatches + 1;
            const totalWins = winner.totalWins + 1;
            const winRate =
              totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
            const avgScore =
              (winner.avgScore * (totalMatches - 1) + player.score) /
              totalMatches;

            await prisma.user.update({
              where: { id: winnerUserId },
              data: {
                totalMatches,
                totalWins,
                winRate,
                avgScore,
                currentWinStreak: winner.currentWinStreak + 1,
                longestWinStreak: Math.max(
                  winner.longestWinStreak,
                  winner.currentWinStreak + 1
                ),
                lastPlayedAt: new Date(),
              },
            });
          }

          // Update loser stats
          if (losingPlayer?.userId) {
            const loser = await prisma.user.update({
              where: { id: losingPlayer.userId },
              data: { totalMatches: { increment: 1 } },
            });

            const newWinRate =
              loser.totalMatches > 0
                ? (loser.totalWins / loser.totalMatches) * 100
                : 0;

            await prisma.user.update({
              where: { id: loser.id },
              data: { winRate: newWinRate },
            });
          }

          // Tournament progression
          const match = await prisma.tournamentMatch.findFirst({
            where: { gameSessionId: finishedGame.id },
            include: { tournament: true },
          });

          if (match) {
            // Mark winner on this match (tournamentMatch)
            await prisma.tournamentMatch.update({
              where: { id: match.id },
              data: {
                winnerUserId: player.userId ?? null,
                winnerPlayerId: player.tournamentPlayerId ?? null,
              },
            });

            await propagateWinner(prisma, {
              tournamentId: match.tournamentId,
              bracketSize: match.tournament.bracketSize,
              fromMatchIndex: match.matchIndex,
              winnerPlayerId: player.tournamentPlayerId ?? null,
            });
          }
        }

        // Always return update session
        const updatedSession = await prisma.gameSession.findUnique({
          where: { id: Number(sessionId) },
          include: { players: true },
        });

        if (!updatedSession) {
          return reply.code(404).send({ error: "Game session not found" });
        }

        return reply.send({
          sessionId: String(updatedSession.id),
          status: updatedSession.status,
          createdAt: updatedSession.createdAt,
          startedAt: updatedSession.startedAt,
          endedAt: updatedSession.endedAt,
          players: updatedSession.players.map((p) => ({
            userId: p.userId ? String(p.userId) : undefined,
            guestName: p.isGuest ? p.displayName : undefined,
            displayName: p.displayName,
            side: p.side,
            score: p.score,
          })),
          winner:
            updatedSession.winnerPlayerId &&
            updatedSession.players.find(
              (p) => p.id === updatedSession.winnerPlayerId
            )?.side,
          winnerName:
            updatedSession.winnerPlayerId &&
            updatedSession.players.find(
              (p) => p.id === updatedSession.winnerPlayerId
            )?.displayName,
        });
      } catch (err) {
        request.log.error(err);
        return reply
          .code(err.code || 500)
          .send({ error: err.message || "Failed to update player score" });
      }
    }
  );
}

export default gameSessionPlayersRoutes;
