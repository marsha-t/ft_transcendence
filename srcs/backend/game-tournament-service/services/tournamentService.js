// services/tournamentService.js
import { createGameSession } from "./gameSessionService.js";

// Organize matches into rounds given bracketSize
/* 
  - Info:
    - no. of rounds
    - no. of matches per round
    - matchIndexes in each round (starting index)
*/
export function getRoundsMeta(bracketSize) {
  const totalRounds = Math.log2(bracketSize);
  const rounds = [];

  let currentStart = 1;

  for (let r = 1; r <= totalRounds; r++) {
    const count = bracketSize / Math.pow(2, r);
    rounds.push({
      round: r,
      startIndex: currentStart,
      count,
    });
    currentStart += count;
  }

  return rounds;
}

// Get info on round based on matchIndex and bracketSize
/*
- info: 
  - match's round
  - match's order in its round (0-based)
  - total no. of rounds in tournament
  - full round info
*/
export function getRoundInfo(matchIndex, bracketSize) {
  const roundsMeta = getRoundsMeta(bracketSize);

  for (const meta of roundsMeta) {
    const { round, startIndex, count } = meta;
    if (matchIndex >= startIndex && matchIndex < startIndex + count) {
      return {
        round,
        indexInRound: matchIndex - startIndex, // 0-based index within that round
        totalRounds: roundsMeta.length,
        roundsMeta,
      };
    }
  }

  throw new Error(
    `Invalid matchIndex=${matchIndex} for bracketSize=${bracketSize}`
  );
}

// Seed players randomly into bracket slots
/*
  - Shuffle players using Fisher-Yates shuffle
    - Apparently, this is less biased than using e.g., .sort(() => Math.random() - 0.5)
    - Fisher-Yates gives each permutation equal probability
  - Place shuffled players into first N slots
  - Remaining slots are null
*/
export function seedPlayersRandom(players, bracketSize) {
  // Shallow copy (spread) of players array
  const shuffled = [...players];

  // Shuffle backwards: randomly swap element from back with elements ahead of it 
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const slots = new Array(bracketSize).fill(null);
  for (let i = 0; i < shuffled.length; i++) {
    slots[i] = shuffled[i];
  }
  return slots;
}

// Propagate winner up in tournament
/*
- Check that winner is provided
- If final match, winner is tournament champion and tournament is FINISHED
- Otherwise, determine parent match
   - Insert winner into correct slot in parent 
   - Reload parent match to check players
       - If both players exist and no game session yet, create game session
       - If parent has 1 player, check whether sibling match is empty
          - If sibling is empty (null vs null), auto advance player recursively
*/
export async function propagateWinner(
  prisma,
  { tournamentId, bracketSize, fromMatchIndex, winnerPlayerId }
) {
  if (!winnerPlayerId) {
    return;
  }

  // Info about the current match
  const info = getRoundInfo(fromMatchIndex, bracketSize);

  // If final match, winner = champion.
  if (info.round === info.totalRounds) {
    const winnerTP = await prisma.tournamentPlayer.findUnique({
      where: { id: winnerPlayerId },
    });

    // Ensure final match has correct winner recorded
    await prisma.tournamentMatch.update({
      where: {
        tournamentId_matchIndex: {
          tournamentId,
          matchIndex: fromMatchIndex,
        },
      },
      data: {
        winnerPlayerId,
        winnerUserId: winnerTP?.userId ?? null,
      },
    });

    // Mark tournament as finished
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        status: "FINISHED",
        endedAt: new Date(),
      },
    });

    return;
  }

  // Compute parent info + which slot in parent we fill.
  const parentRound = info.round + 1;
  const parentMeta = info.roundsMeta[parentRound - 1];
  const parentIndexInRound = Math.floor(info.indexInRound / 2);
  const parentMatchIndex = parentMeta.startIndex + parentIndexInRound;

  const isLeftChild = info.indexInRound % 2 === 0;
  const slotField = isLeftChild ? "player1Id" : "player2Id";

  let parent = await prisma.tournamentMatch.findUnique({
    where: {
      tournamentId_matchIndex: {
        tournamentId,
        matchIndex: parentMatchIndex,
      },
    },
  });

  if (!parent) {
    // Should never happen if matches were created for the whole bracket.
    return;
  }

  // 1) Place winner into correct slot in parent match
  if (parent[slotField] !== winnerPlayerId) {
    parent = await prisma.tournamentMatch.update({
      where: { id: parent.id },
      data: {
        [slotField]: winnerPlayerId,
      },
    });
  }

  // 2) Reload parent match to inspect slots.
  parent = await prisma.tournamentMatch.findUnique({
    where: { id: parent.id },
  });

  const hasP1 = !!parent.player1Id;
  const hasP2 = !!parent.player2Id;

  // 2A) If parent has 2 players and no game session yet → create it.
  if (hasP1 && hasP2) {
    if (!parent.gameSessionId) {
      const tpIds = [parent.player1Id, parent.player2Id];

      const tPlayers = await prisma.tournamentPlayer.findMany({
        where: { id: { in: tpIds } },
      });

      const p1 = tPlayers.find((tp) => tp.id === parent.player1Id);
      const p2 = tPlayers.find((tp) => tp.id === parent.player2Id);

      if (p1 && p2) {
        await createGameSession(prisma, {
          tournamentId,
          matchIndex: parentMatchIndex,
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
      }
    }

    // Either way, once there are 2 players, we stop here.
    return;
  }

  // 2B) If parent has only one player, we may have a BYE case.
  if (hasP1 !== hasP2 && !parent.winnerPlayerId) {
    const onlyPlayerId = parent.player1Id || parent.player2Id;

    // Check sibling match of "fromMatchIndex" in the child round.
    const childRoundMeta = info.roundsMeta[info.round - 1]; // current round meta
    const siblingIndexInRound =
      info.indexInRound % 2 === 0
        ? info.indexInRound + 1
        : info.indexInRound - 1;

    let siblingMatch = null;
    if (
      siblingIndexInRound >= 0 &&
      siblingIndexInRound < childRoundMeta.count
    ) {
      const siblingMatchIndex =
        childRoundMeta.startIndex + siblingIndexInRound;

      siblingMatch = await prisma.tournamentMatch.findUnique({
        where: {
          tournamentId_matchIndex: {
            tournamentId,
            matchIndex: siblingMatchIndex,
          },
        },
      });
    }

    const siblingEmpty =
      !siblingMatch ||
      (!siblingMatch.player1Id &&
        !siblingMatch.player2Id &&
        !siblingMatch.winnerPlayerId &&
        !siblingMatch.gameSessionId);

    if (siblingEmpty) {
      // This is a true bye: auto-win for onlyPlayerId in the parent match.
      const onlyTP = await prisma.tournamentPlayer.findUnique({
        where: { id: onlyPlayerId },
      });

      await prisma.tournamentMatch.update({
        where: { id: parent.id },
        data: {
          winnerPlayerId: onlyPlayerId,
          winnerUserId: onlyTP?.userId ?? null,
        },
      });

      // Recursively propagate from the parent match.
      await propagateWinner(prisma, {
        tournamentId,
        bracketSize,
        fromMatchIndex: parentMatchIndex,
        winnerPlayerId: onlyPlayerId,
      });
    }
  }
}
