-- CreateTable
CREATE TABLE "GameSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "winnerUserId" INTEGER,
    "winnerPlayerId" INTEGER,
    CONSTRAINT "GameSession_winnerPlayerId_fkey" FOREIGN KEY ("winnerPlayerId") REFERENCES "GameSessionPlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "playerId" INTEGER,
    "type" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scoreLeft" INTEGER,
    "scoreRight" INTEGER,
    CONSTRAINT "GameEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GameEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "GameSessionPlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameSessionPlayer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "userId" INTEGER,
    "tournamentPlayerId" INTEGER,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "displayName" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "GameSessionPlayer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GameSessionPlayer_tournamentPlayerId_fkey" FOREIGN KEY ("tournamentPlayerId") REFERENCES "TournamentPlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "numberOfPlayers" INTEGER NOT NULL,
    "bracketSize" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "TournamentPlayer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER NOT NULL,
    "userId" INTEGER,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "displayName" TEXT NOT NULL,
    CONSTRAINT "TournamentPlayer_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TournamentMatch" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tournamentId" INTEGER NOT NULL,
    "matchIndex" INTEGER NOT NULL,
    "gameSessionId" INTEGER,
    "winnerUserId" INTEGER,
    "winnerPlayerId" INTEGER,
    "player1Id" INTEGER,
    "player2Id" INTEGER,
    CONSTRAINT "TournamentMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_winnerPlayerId_fkey" FOREIGN KEY ("winnerPlayerId") REFERENCES "TournamentPlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "TournamentPlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "TournamentPlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_winnerPlayerId_key" ON "GameSession"("winnerPlayerId");

-- CreateIndex
CREATE UNIQUE INDEX "GameSessionPlayer_sessionId_side_key" ON "GameSessionPlayer"("sessionId", "side");

-- CreateIndex
CREATE UNIQUE INDEX "GameSessionPlayer_sessionId_displayName_key" ON "GameSessionPlayer"("sessionId", "displayName");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentPlayer_tournamentId_displayName_key" ON "TournamentPlayer"("tournamentId", "displayName");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMatch_gameSessionId_key" ON "TournamentMatch"("gameSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMatch_tournamentId_matchIndex_key" ON "TournamentMatch"("tournamentId", "matchIndex");
