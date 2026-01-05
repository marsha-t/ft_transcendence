-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "FriendRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "senderId" INTEGER NOT NULL,
    "receiverId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FriendRequest_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FriendRequest_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_senderId_receiverId_key" ON "FriendRequest"("senderId", "receiverId");
