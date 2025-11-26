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
    "isAi" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "GameSession_winnerUserId_fkey" FOREIGN KEY ("winnerUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GameSession_winnerPlayerId_fkey" FOREIGN KEY ("winnerPlayerId") REFERENCES "GameSessionPlayer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_GameSession" ("createdAt", "endedAt", "id", "startedAt", "status", "winnerPlayerId", "winnerUserId") SELECT "createdAt", "endedAt", "id", "startedAt", "status", "winnerPlayerId", "winnerUserId" FROM "GameSession";
DROP TABLE "GameSession";
ALTER TABLE "new_GameSession" RENAME TO "GameSession";
CREATE UNIQUE INDEX "GameSession_winnerPlayerId_key" ON "GameSession"("winnerPlayerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
