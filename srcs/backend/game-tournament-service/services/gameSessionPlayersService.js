export async function checkSessionRequester(client, userId, sessionId) {
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
    const err = new Error('Session not found');
    err.statusCode = 404;
    err.code = 'SESSION_NOT_FOUND';
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
    const err = new Error('User is not authorized to modify game session');
    err.statusCode = 403;
    err.code = 'FORBIDDEN_SESSION_ACCESS';
    throw err;
  }

  return session;
}
