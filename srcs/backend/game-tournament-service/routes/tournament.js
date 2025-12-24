import prisma from "../prisma/prismaClient.js";
import { updateTournamentStatusSchema, getNextMatchSchema, validatePlayerSchema,  finalizeTournamentSchema, } from "../schemas/tournament.js";
import { createGameSession } from "../services/gameSessionService.js";
import { seedPlayersRandom, propagateWinner, } from "../services/tournamentService.js";
import { getUserInfo, validateUserCredentials } from "../services/authServiceClient.js";

async function tournamentRoutes(app, options) {

  // Validate player
  /* 
		- Check that guestName follows correct format (using schema)
    - Check that registered user credentials are correct via Auth service
      - Credentials aren't stored and not used to create a login session
    - Check that registered user is not the creator
	*/
  app.post('/tournaments/validate-player', { schema: validatePlayerSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const { username, password, guestName } = request.body ?? {};

    // Guest name validation
    if (guestName) {
      return reply.send({
        valid: true, 
        displayName: guestName.trim(),
        userId: null,
      });
    }
    
    // Registered user validation
    if (username && password) {
      const userData = await validateUserCredentials(username, password);

      // Check that creator is not the player to be added
      const creatorId = request.user?.id;
      if (userData && userData.id && creatorId && userData.id === creatorId) {
        const err = new Error('Player is the creator');
        err.statusCode = 400;
        err.code = 'PLAYER_IS_CREATOR';
        throw err;
      }

      return reply.send({
        valid: true,
        displayName: userData.username,
        userId: userData.id,
      });
    }
    
    // Defensive fallback
    const err = new Error('Invalid player payload');
    err.statusCode = 400;
    err.code = 'INVALID_PLAYER_PAYLOAD';
    throw err;
  });

  // Finalise tournament details
  /*
		- Check correct number of player credentiasl given 
    - Fetch username of creator
    - Compute bracket size and number of matches from number of players
      - Bracket Size = round up to nearest power of 2
		- Insert new tournament in Tournament table
		- Generate rows in tournamentMatch and tournamentPlayers table
		- Uniqueness constraint enforced by Prisma 
	*/
  app.post("/tournaments/finalize", { schema: finalizeTournamentSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const creatorId = request.user?.id;
    const { numberOfPlayers, players } = request.body;
    if (players.length != numberOfPlayers - 1) {
      const err = new Error('Wrong number of players credentials given');
      err.statusCode = 400;
      err.code = 'INVALID_PLAYER_COUNT';
      throw err;
    }

    // Fetch creator username from Auth Service
    const creatorInfo = await getUserInfo(creatorId);
    const creatorUsername = creatorInfo.username;

    // Prepare tournament structure in Tournament, TournamentPlayers and TournamentMatch tables
    const bracketSize = 2 ** Math.ceil(Math.log2(numberOfPlayers));
    const numMatches = bracketSize - 1;

    const tournament = await prisma.tournament.create({
      data: {
        status: "CREATED",
        numberOfPlayers,
        bracketSize,
      },
    });

    const tournamentPlayers = [
      {
        tournamentId: tournament.id,
        displayName: creatorUsername,
        userId: creatorId,
        isGuest: false,
      },
      ...players.map((p) => ({
        tournamentId: tournament.id,
        displayName: p.displayName,
        userId: p.userId ?? null,
        isGuest: !p.userId,
      })),
    ];

    await prisma.tournamentPlayer.createMany({ data: tournamentPlayers });

    const matches = Array.from({ length: numMatches }, (_, i) => ({
      tournamentId: tournament.id,
      matchIndex: i + 1,
    }));
    await prisma.tournamentMatch.createMany({ data: matches });

    return reply.code(201).send({
      id: tournament.id,
      status: tournament.status,
    });
  });

  // Get next match
  /*
		- Check that tournament exists and request user is in the tournament
    - Look for next match in tournament
		- If exists, return match with player info
		- Else, fetch full tournament and its matches and build results object 
	*/
  app.get("/tournaments/next-match", { schema: getNextMatchSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const tournamentId = Number(request.headers["x-current-tournament-id"]);
    
    const tournament = await prisma.tournament.findUnique({
      where: { id: Number(tournamentId) },
      include: {
        players: true,
        matches: {
          include: { gameSession: true, player1: true, player2: true },
          orderBy: { matchIndex: "asc" },
        },
      },
    });
    if (!tournament) {
      const err = new Error("Tournament not found");
      err.statusCode = 404;
      err.code = "TOURNAMENT_NOT_FOUND";
      throw err;
    }

    const isParticipant = tournament.players.some(
      (p) => p.userId === userId
    );
    if (!isParticipant) {
      const err = new Error("You are not a participant in this tournament");
      err.statusCode = 403;
      err.code = "FORBIDDEN_TOURNAMENT_ACCESS";
      throw err;
    }
    
    // Look for next unfinished match in tournament
    const nextMatch = await prisma.tournamentMatch.findFirst({
      where: {
        tournamentId: Number(tournamentId),
        gameSession: {
          status: { not: "FINISHED" },
        },
      },
      include: {
        gameSession: { include: { players: true } },
        player1: true,
        player2: true,
      },
      orderBy: { matchIndex: "asc" },
    });

    if (nextMatch) {
      return reply.send({
        tournamentId: Number(tournamentId),
        nextMatch: {
          matchId: nextMatch.id,
          matchIndex: nextMatch.matchIndex,
          tournamentId: Number(tournamentId),
          player1: nextMatch.player1
            ? {
                id: nextMatch.player1.id,
                displayName: nextMatch.player1.displayName,
              }
            : null,
          player2: nextMatch.player2
            ? {
                id: nextMatch.player2.id,
                displayName: nextMatch.player2.displayName,
              }
            : null,
          gameSessionId: nextMatch.gameSessionId,
          gameStatus: nextMatch.gameSession?.status,
        },
      });
    }

    // If there isn't a next match, tournament has finished - return tournament results
    const finalMatch = tournament.matches[tournament.matches.length - 1];
    return reply.send({
      tournamentId: tournament.id,
      status: "FINISHED",
      nextMatch: null,
      results: {
        champion: finalMatch?.winnerPlayerId
          ? finalMatch.player1?.id === finalMatch.winnerPlayerId
            ? finalMatch.player1?.displayName ?? "-"
            : finalMatch.player2?.displayName ?? "-"
          : null,
        bracket: tournament.matches.map((m) => ({
          matchIndex: m.matchIndex,
          player1: m.player1?.displayName ?? "-",
          player2: m.player2?.displayName ?? "-",
          winner: m.winnerPlayerId
            ? m.player1?.id === m.winnerPlayerId
              ? m.player1?.displayName ?? "—"
              : m.player2?.displayName ?? "—"
            : "—",
        })),
        stats: {
          totalMatches: tournament.matches.length,
          playedMatches: tournament.matches.filter(
            (m) => m.gameSession?.status === "FINISHED"
          ).length,
        },
      },
    });
  });

  // Update tournament status
  /*
    - Check tournament exists and request user is in the tournament
		- Check that status transition is allowed
		- If updating to 'STARTED', 
			- Ensure tournament has at least 2 players
			- Seed players randomly into brackets; Any empty slots become null
			- Assign Round 1 matches: for each match: 
				- If both players exist, create game session
				- If only one player exists, auto-advance them as winner 
        - There is a third scenario where both are null - this is ignored 
		- If updating to FINISHED: disallowed (only allowed via scoring and winning matches)
    - If updating to 'ABORTED', abort tournament and its game sessions
    - Return updated tournament object 
	*/
  app.patch("/tournaments/status", { schema: updateTournamentStatusSchema, preHandler: [app.authenticate] }, async (request, reply) => {
    const userId = request.user.id;
    const tournamentId = Number(request.headers["x-current-tournament-id"]);
    const { status } = request.body;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        players: true,
        matches: { include: { gameSession: true } },
      },
    });

    if (!tournament) {
      const err = new Error("Tournament not found");
      err.statusCode = 404;
      err.code = "TOURNAMENT_NOT_FOUND";
      throw err;
    }

    const isParticipant = tournament.players.some(
      (p) => p.userId === userId
    );
    if (!isParticipant) {
      const err = new Error("You are not a participant in this tournament");
      err.statusCode = 403;
      err.code = "FORBIDDEN_TOURNAMENT_ACCESS";
      throw err;
    }

    const current = tournament.status;
    const validTransitions = {
      CREATED: new Set(["STARTED", "ABORTED"]),
      STARTED: new Set(["FINISHED", "ABORTED"]),
      FINISHED: new Set([]),
      ABORTED: new Set([]),
    };
    if (!validTransitions[current].has(status)) {
      const err = new Error(`Invalid transition: ${current} → ${status}`);
      err.statusCode = 400;
      err.code = "INVALID_TOURNAMENT_TRANSITION";
      throw err;
    }

    const updateData = { status };

    if (status === "STARTED") {
      updateData.startedAt = new Date();

      // 1) Ensure at least 2 players in tournament
      const players = await prisma.tournamentPlayer.findMany({
        where: { tournamentId },
      });

      if (players.length < 2) {
        const err = new Error("Not enough players to start tournament");
        err.statusCode = 400;
        err.code = "INSUFFICIENT_PLAYERS";
        throw err;
      }

      const bracketSize = tournament.bracketSize;
      const round1MatchesCount = bracketSize / 2;

      // 2) Seed players randomly into bracket slots (with byes)
      const seeds = seedPlayersRandom(players, bracketSize);

      // 3) Assign Round 1 matches and handle byes
      for (let i = 0; i < round1MatchesCount; i++) {
        const p1 = seeds[i * 2];
        const p2 = seeds[i * 2 + 1];
        const matchIndex = i + 1;

        await prisma.tournamentMatch.update({
          where: {
            tournamentId_matchIndex: { tournamentId, matchIndex },
          },
          data: {
            player1Id: p1 ? p1.id : null,
            player2Id: p2 ? p2.id : null,
          },
        });

        // Scenario 1: Both players available so create game session
        if (p1 && p2) {
          await createGameSession(prisma, {
            tournamentId,
            matchIndex,
            players: [
              {
                userId: p1.userId,
                guestName: p1.isGuest ? p1.displayName : null,
                side: "LEFT",
              },
              {
                userId: p2.userId,
                guestName: p2.isGuest ? p2.displayName : null,
                side: "RIGHT",
              },
            ],
          });
        } else if (p1 || p2) {
          // Scenario 2: Only one player so auto-advance player as winner
          const winner = p1 || p2;

          await prisma.tournamentMatch.update({
            where: {
              tournamentId_matchIndex: { tournamentId, matchIndex },
            },
            data: {
              winnerPlayerId: winner.id,
              winnerUserId: winner.userId ?? null,
            },
          });
          // recursively advance winner of match up the tournament 
          await propagateWinner(prisma, {
            tournamentId,
            bracketSize,
            fromMatchIndex: matchIndex,
            winnerPlayerId: winner.id,
          });
        }
      }
    } else if (status === "FINISHED") {
      const err = new Error("FINISHED status must be set via match progression, not manually");
      err.statusCode = 400;
      err.code = "INVALID_MANUAL_FINISH";
      throw err;
    } else if (status === "ABORTED") {
      // Abort tournament and all game sessions associated with it
      const now = new Date();

      const updatedTournament = await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: "ABORTED", endedAt: now },
        include: { matches: true },
      });

      const sessionIds = updatedTournament.matches
        .map((m) => m.gameSessionId)
        .filter(Boolean);

      if (sessionIds.length > 0) {
        await prisma.gameSession.updateMany({
          where: { id: { in: sessionIds } },
          data: { status: "ABORTED", endedAt: now },
        });
      }

      return reply.send({
        id: updatedTournament.id,
        status: updatedTournament.status,
        startedAt: updatedTournament.startedAt,
        endedAt: updatedTournament.endedAt,
      });
    }

    const updated = await prisma.tournament.update({
      where: { id: tournamentId },
      data: updateData,
    });

    return reply.send({
      id: updated.id,
      status: updated.status,
      startedAt: updated.startedAt,
      endedAt: updated.endedAt,
    });
  });
}

export default tournamentRoutes;
