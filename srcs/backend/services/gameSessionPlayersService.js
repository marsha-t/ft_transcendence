export async function checkSession(client, sessionId) {
  const session = await client.gameSession.findUnique({
    where: { id: Number(sessionId) },
  });

  if (!session) {
    const err = new Error('Game session cannot be found');
    err.code = 404;
    throw err;
  }

  return session;
}

export async function checkPlayer(client, sessionId, userId) {
  const player = await client.gameSessionPlayer.findUnique({
    where: { sessionId_userId: { sessiodId: Number(sessionId), userId: Number(userId) }, }
  });

  if (!player) {
    const err = new Error('Player cannot be found');
    err.code = 404;
    throw err;
  }

  return player;
}
