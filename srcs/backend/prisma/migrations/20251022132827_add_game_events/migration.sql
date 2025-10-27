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
