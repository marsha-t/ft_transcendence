-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "googleId" TEXT,
    "avatar" TEXT NOT NULL DEFAULT '/uploads/avatars/default.png',
    "status" TEXT NOT NULL DEFAULT 'OFFLINE',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorCode" TEXT,
    "twoFactorExpiry" DATETIME,
    "totalMatches" INTEGER NOT NULL DEFAULT 0,
    "totalWins" INTEGER NOT NULL DEFAULT 0,
    "winRate" REAL NOT NULL DEFAULT 0,
    "avgScore" REAL NOT NULL DEFAULT 0,
    "longestWinStreak" INTEGER NOT NULL DEFAULT 0,
    "currentWinStreak" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" DATETIME
);
INSERT INTO "new_User" ("avatar", "avgScore", "currentWinStreak", "email", "googleId", "id", "lastPlayedAt", "longestWinStreak", "password", "status", "totalMatches", "totalWins", "username", "winRate") SELECT "avatar", "avgScore", "currentWinStreak", "email", "googleId", "id", "lastPlayedAt", "longestWinStreak", "password", "status", "totalMatches", "totalWins", "username", "winRate" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
