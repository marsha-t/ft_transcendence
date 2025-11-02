export async function checkSession(client, userId, sessionId) {
  const session = await client.gameSession.findUnique({
    where: { id: Number(sessionId) },
    include: {
      players: true,
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
    const tournamentPlayers = await prisma.tournamentPlayer.findMany({
      where: { tournamentId: session.tournamentMatch.tournamentId },
      select: { userId: true },
    });
    isAuthorized = tournamentPlayers.some((p) => p.userId === userId);
  }

  if (!isAuthorized) {
    return reply
      .code(403)
      .send({ error: "You are not authorized to modify this game session" });
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
