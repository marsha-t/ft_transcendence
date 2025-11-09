export async function checkSession(client, userId, sessionId) {
  const session = await client.gameSession.findUnique({
    where: { id: Number(sessionId) },
    include: {
      players: true,
      tournamentMatch: {
        include: { tournament: true }
      }
    },
  });

  if (!session) {
    const err = new Error("Game session cannot be found");
    err.code = 404;
    throw err;
  }
  let isAuthorized = false;

  if (!session.tournamentMatch) {
    isAuthorized = session.players.some((p) => p.userId === userId);
  } else {
    const tournamentPlayers = await client.tournamentPlayer.findMany({
      where: { tournamentId: session.tournamentMatch.tournamentId },
      select: { userId: true },
    });
    isAuthorized = tournamentPlayers.some((p) => p.userId === userId);
  }

  if (!isAuthorized) {
    const err = new Error("User is not authorized to modify game session");
    err.code = 403;
    throw err;
  }

  return session;
}

export async function checkPlayer(client, sessionId, side) {
  const player = await client.gameSessionPlayer.findUnique({
    where: { sessionId_side: { sessionId: Number(sessionId), side } },
  });

  if (!player) {
    const err = new Error("Player cannot be found");
    err.code = 404;
    throw err;
  }

  return player;
}
