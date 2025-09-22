/*
  Warnings:

  - You are about to drop the column `maxScore` on the `GameSession` table. All the data in the column will be lost.
  - You are about to drop the column `isReady` on the `GameSessionPlayer` table. All the data in the column will be lost.
  - Added the required column `displayName` to the `GameSessionPlayer` table without a default value. This is not possible if the table is not empty.

*/
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
    CONSTRAINT "TournamentPlayer_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TournamentPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    CONSTRAINT "TournamentMatch_winnerUserId_fkey" FOREIGN KEY ("winnerUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_winnerPlayerId_fkey" FOREIGN KEY ("winnerPlayerId") REFERENCES "TournamentPlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "TournamentPlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TournamentMatch_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "TournamentPlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "winnerUserId" INTEGER,
    "winnerPlayerId" INTEGER,
    CONSTRAINT "GameSession_winnerUserId_fkey" FOREIGN KEY ("winnerUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GameSession_winnerPlayerId_fkey" FOREIGN KEY ("winnerPlayerId") REFERENCES "GameSessionPlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GameSession" ("createdAt", "endedAt", "id", "startedAt", "status", "winnerUserId") SELECT "createdAt", "endedAt", "id", "startedAt", "status", "winnerUserId" FROM "GameSession";
DROP TABLE "GameSession";
ALTER TABLE "new_GameSession" RENAME TO "GameSession";
CREATE UNIQUE INDEX "GameSession_winnerPlayerId_key" ON "GameSession"("winnerPlayerId");
CREATE TABLE "new_GameSessionPlayer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "userId" INTEGER,
    "tournamentPlayerId" INTEGER,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "displayName" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "GameSessionPlayer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GameSessionPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GameSessionPlayer_tournamentPlayerId_fkey" FOREIGN KEY ("tournamentPlayerId") REFERENCES "TournamentPlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GameSessionPlayer" ("id", "score", "sessionId", "side", "userId") SELECT "id", "score", "sessionId", "side", "userId" FROM "GameSessionPlayer";
DROP TABLE "GameSessionPlayer";
ALTER TABLE "new_GameSessionPlayer" RENAME TO "GameSessionPlayer";
CREATE UNIQUE INDEX "GameSessionPlayer_sessionId_side_key" ON "GameSessionPlayer"("sessionId", "side");
CREATE UNIQUE INDEX "GameSessionPlayer_sessionId_displayName_key" ON "GameSessionPlayer"("sessionId", "displayName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "TournamentPlayer_tournamentId_displayName_key" ON "TournamentPlayer"("tournamentId", "displayName");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMatch_gameSessionId_key" ON "TournamentMatch"("gameSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMatch_tournamentId_matchIndex_key" ON "TournamentMatch"("tournamentId", "matchIndex");
