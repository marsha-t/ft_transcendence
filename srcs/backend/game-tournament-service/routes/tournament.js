import prisma from "../prisma/prismaClient.js";
import bcrypt from "bcrypt";
import { createGameSession } from "../services/gameSessionService.js";
import {
  updateTournamentStatusSchema,
  getNextMatchSchema,
  validatePlayerSchema,
  finalizeTournamentSchema,
} from "../schemas/tournament.js";
import { getParentMatchIndex } from "../services/tournamentService.js";
import { getUserInfo } from "../services/authServiceClient.js";

async function tournamentRoutes(app, options) {
  // Validate player
  /* 
		- Checks that registered user credentials are correct
	*/
  app.post('/tournaments/validate-player', {schema: validatePlayerSchema, preHandler: [app.authenticate] }, async (request, reply) => {
		const { username, password } = request.body;
    try {
      if (username && password) {
        // ✅ FIX: Call Auth Service to validate credentials
        try {
          const response = await fetch(
            `${process.env.AUTH_SERVICE_URL || 'http://auth:5001'}/api/auth/validate`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password })
            }
          );

          if (!response.ok) {
            return reply.code(401).send({ 
              valid: false, 
              error: "Invalid username or password" 
            });
          }

          const userData = await response.json();
          
          return reply.send({
            valid: true,
            displayName: userData.username,
            userId: userData.id,
          });
        } catch (err) {
          console.error('Failed to validate user:', err);
          return reply.code(500).send({ 
            valid: false, 
            error: "Failed to validate credentials" 
          });
        }
      }
      } catch (err) {
        request.log.error(err);
        return reply
          .code(err.code || 500)
          .send({
            error: err.message || "Failed to validate tournament player",
          });
      }
    }
  );

  // Finalise tournament details
  /*
		- Compute bracket size and number of matches from number of players
		- Insert new tournament in Tournament table
		- Generate rows in tournamentMatch and tournamentPlayers table
		- Player can join by:
			- 1) Registered user: provide username & password
				- Validate username exists
				- Check password
				- Add tournamentPlayer linked to userId
			- 2) Guest: provide guestName
				- Add tournamentPlayer with guest info
		- Enforce unique constraint - if same displayName already in tournament 
	*/
  app.post('/tournaments/finalize', { schema: finalizeTournamentSchema, preHandler: [ app.authenticate ], }, async(request, reply) => {
    const creatorId = request.user?.id;
    const { numberOfPlayers, players } = request.body;
      if (players.length != numberOfPlayers - 1) {
        return reply
      .code(400)
      .send({ error: "Wrong number of players credentials given" });
      }
      
      try {
        // ✅ FIX: Fetch creator username from Auth Service
        let creatorUsername;
        try {
          const creatorInfo = await getUserInfo(creatorId);
          creatorUsername = creatorInfo.username;
        } catch (err) {
          console.error('Failed to fetch creator info:', err);
          return reply.code(404).send({ error: "Creator user not found" });
        }
  
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
      } catch (err) {
        request.log.error(err);
        return reply
          .code(err.code || 500)
          .send({ error: err.message || "Failed to create tournament" });
      }
    }
  );
  // Get next match
  /*
		- Check that request user is in the tournament
    - Look for next match in tournament
		- If exists, return match with player info
		- Else, fetch full tournament and its matches and build results object 
	*/
  app.get(
    "/tournaments/next-match",
    { schema: getNextMatchSchema, preHandler: [ app.authenticate ] },
    async (request, reply) => {
      const userId = request.user.id;
      const tournamentId = Number(request.headers["x-current-tournament-id"]);
      try {
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
          return reply.code(404).send({ error: "Tournament not found" });
        }
        const isParticipant = tournament.players.some(p => p.userId === userId);
        if (!isParticipant) {
          return reply.code(403).send({ error: "You are not a participant in this tournament" });
        }
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
      } catch (err) {
        request.log.error(err);
        return reply
          .code(err.code || 500)
          .send({
            error: err.message || "Failed to get next match in tournament",
          });
      }
    }
  );

  // Update tournament status
  /*
		- Check that request user is in the tournament
		- Check tournament exists
		- Check that status transition is allowed
    	- Update timestamps where appropriate
		- If updating to 'STARTED', 
			- Ensure tournament has at least 2 players
			- Seed players into brackets
			- For each round 1 match: 
				- If both players exist, create game session
				- If only one player exists, auto-advance them as winner 
		- If updating to 'ABORTED', abort tournament and its linked game sessions
    - Return updated tournament object 
	*/
  app.patch('/tournaments/status', { schema: updateTournamentStatusSchema, preHandler: [app.authenticate] }, async (request, reply) => {
 		const userId = request.user.id;
    const tournamentId = Number(request.headers['x-current-tournament-id']);
		const { status } = request.body;

      try {
        const tournament = await prisma.tournament.findUnique({
          where: { id: Number(tournamentId) },
	        include: { 
            players: true, 
            matches: { include: { gameSession: true } } }, 
          
        });
        if (!tournament) {
          return reply.code(404).send({ error: "Tournament not found" });
        }
        
        const isParticipant = tournament.players.some(p => p.userId === userId);
        if (!isParticipant) {
          return reply.code(403).send({ error: "You are not a participant in this tournament" });
        }
        const current = tournament.status;
        const validTransitions = {
          CREATED: new Set(["STARTED", "ABORTED"]),
          STARTED: new Set(["FINISHED", "ABORTED"]),
          FINISHED: new Set([]),
          ABORTED: new Set([]),
        };
        if (!validTransitions[current].has(status)) {
          return reply
            .code(400)
            .send({ error: `Invalid transition: ${current} to ${status}` });
        }

        const updateData = { status };

        if (status === "STARTED") {
          updateData.startedAt = new Date();

          const players = await prisma.tournamentPlayer.findMany({
            where: { tournamentId: Number(tournamentId) },
          });

          if (players.length < 2) {
            return reply
              .code(400)
              .send({ error: "Not enough players to start tournament" });
          }

          const bracketSize = tournament.bracketSize;
          const seeds = [
            ...players,
            ...Array(bracketSize - players.length).fill(null),
          ];

          const round1Matches = bracketSize / 2;
          for (let i = 0; i < round1Matches; i++) {
            const p1 = seeds[i * 2];
            const p2 = seeds[i * 2 + 1];

            if (p1 && p2) {
              await prisma.tournamentMatch.updateMany({
                where: {
                  tournamentId: Number(tournamentId),
                  matchIndex: i + 1,
                },
                data: {
                  player1Id: p1.id,
                  player2Id: p2.id,
                },
              });
              await createGameSession(prisma, {
                tournamentId,
                matchIndex: i + 1,
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
            } else {
              // Auto advance for odd number of players
              const winner = p1 && !p2 ? p1 : p2 && !p1 ? p2 : null;

              await prisma.tournamentMatch.updateMany({
                where: {
                  tournamentId: Number(tournamentId),
                  matchIndex: i + 1,
                },
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
                  where: {
                    tournamentId_matchIndex: {
                      tournamentId,
                      matchIndex: parentIndex,
                    },
                  },
                });

                if (parentMatch) {
                  const updateData = {};
                  if (!parentMatch.player1Id) updateData.player1Id = winner.id;
                  else if (!parentMatch.player2Id)
                    updateData.player2Id = winner.id;

                  const updatedParent = await prisma.tournamentMatch.update({
                    where: { id: parentMatch.id },
                    data: updateData,
                  });

                  // If both players now exist, pre-create their game session
                  if (
                    updatedParent.player1Id &&
                    updatedParent.player2Id &&
                    !updatedParent.gameSessionId
                  ) {
                    const parentPlayers =
                      await prisma.tournamentPlayer.findMany({
                        where: {
                          id: {
                            in: [
                              updatedParent.player1Id,
                              updatedParent.player2Id,
                            ],
                          },
                        },
                      });

                    await createGameSession(prisma, {
                      tournamentId,
                      matchIndex: updatedParent.matchIndex,
                      players: [
                        {
                          userId: parentPlayers[0].userId,
                          guestName: parentPlayers[0].isGuest
                            ? parentPlayers[0].displayName
                            : null,
                          side: "LEFT",
                        },
                        {
                          userId: parentPlayers[1].userId,
                          guestName: parentPlayers[1].isGuest
                            ? parentPlayers[1].displayName
                            : null,
                          side: "RIGHT",
                        },
                      ],
                    });
                  }
                }
              }
            }
          }
        } else if (status === "FINISHED") {
          updateData.endedAt = new Date();
        } else if (status === "ABORTED") {
          const now = new Date();

          const updatedTournament = await prisma.tournament.update({
              where: { id: Number(tournamentId) },
              data: { status: "ABORTED", endedAt: now }, 
              include: { matches: true }
            });

          const sessionIds = updatedTournament.matches.map((m) => m.gameSessionId).filter(Boolean);
          if (sessionIds.length > 0) {
            await prisma.gameSession.updateMany({
              where: { id: { in: sessionIds } },
              data: { status: "ABORTED", endedAt: now },
            });
          }
                    
          return reply.send({
            id: updatedTournament.tournamentId,
            status: updatedTournament.status,
            startedAt: updatedTournament.startedAt,
            endedAt: updatedTournament.endedAt,
          });
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
        return reply
          .code(err.code || 500)
          .send({ error: err.message || "Failed to update tournament status" });
      }
    }
  );
}

export default tournamentRoutes;