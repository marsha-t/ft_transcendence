/*
  Warnings:

  - You are about to drop the `FriendRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GameSessionPlayer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Tournament` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TournamentMatch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TournamentPlayer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `avatar` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `avgScore` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `currentWinStreak` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `lastPlayedAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `longestWinStreak` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `totalMatches` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `totalWins` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `winRate` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "FriendRequest_senderId_receiverId_key";

-- DropIndex
DROP INDEX "GameSession_winnerPlayerId_key";

-- DropIndex
DROP INDEX "GameSessionPlayer_sessionId_displayName_key";

-- DropIndex
DROP INDEX "GameSessionPlayer_sessionId_side_key";

-- DropIndex
DROP INDEX "TournamentMatch_tournamentId_matchIndex_key";

-- DropIndex
DROP INDEX "TournamentMatch_gameSessionId_key";

-- DropIndex
DROP INDEX "TournamentPlayer_tournamentId_displayName_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "FriendRequest";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GameEvent";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GameSession";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GameSessionPlayer";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Tournament";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TournamentMatch";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TournamentPlayer";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "AIGameSession" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "aiDifficulty" TEXT NOT NULL,
    "aiSide" TEXT NOT NULL,
    "playerScore" INTEGER NOT NULL DEFAULT 0,
    "aiScore" INTEGER NOT NULL DEFAULT 0,
    "winner" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    CONSTRAINT "AIGameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIGameStats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "totalAIGames" INTEGER NOT NULL DEFAULT 0,
    "aiGamesWon" INTEGER NOT NULL DEFAULT 0,
    "aiGamesLost" INTEGER NOT NULL DEFAULT 0,
    "easyWins" INTEGER NOT NULL DEFAULT 0,
    "easyLosses" INTEGER NOT NULL DEFAULT 0,
    "mediumWins" INTEGER NOT NULL DEFAULT 0,
    "mediumLosses" INTEGER NOT NULL DEFAULT 0,
    "hardWins" INTEGER NOT NULL DEFAULT 0,
    "hardLosses" INTEGER NOT NULL DEFAULT 0,
    "longestWinStreak" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIGameStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL
);
INSERT INTO "new_User" ("email", "id", "password", "username") SELECT "email", "id", "password", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AIGameStats_userId_key" ON "AIGameStats"("userId");
