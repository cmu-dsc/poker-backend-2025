-- CreateTable
CREATE TABLE "UserDao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "permissionLevelId" INTEGER NOT NULL DEFAULT 1,
    "teamId" INTEGER,
    CONSTRAINT "UserDao_permissionLevelId_fkey" FOREIGN KEY ("permissionLevelId") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserDao_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TeamDao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamDao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "TeamMatchDao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "bankroll" INTEGER NOT NULL,
    CONSTRAINT "TeamMatchDao_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "MatchDao" ("matchId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamMatchDao_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TeamDao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchDao" (
    "matchId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TeamInviteDao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "sendAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "TeamInviteDao_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TeamDao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamInviteDao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserDao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchRequestDao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchId" INTEGER,
    "requestingTeamId" INTEGER NOT NULL,
    "requestedTeamId" INTEGER NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    CONSTRAINT "MatchRequestDao_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "MatchDao" ("matchId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MatchRequestDao_requestingTeamId_fkey" FOREIGN KEY ("requestingTeamId") REFERENCES "TeamDao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MatchRequestDao_requestedTeamId_fkey" FOREIGN KEY ("requestedTeamId") REFERENCES "TeamDao" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Role" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDao_id_key" ON "UserDao"("id");

-- CreateIndex
CREATE UNIQUE INDEX "UserDao_email_key" ON "UserDao"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TeamDao_id_key" ON "TeamDao"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMatchDao_id_key" ON "TeamMatchDao"("id");

-- CreateIndex
CREATE UNIQUE INDEX "MatchDao_matchId_key" ON "MatchDao"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInviteDao_id_key" ON "TeamInviteDao"("id");

-- CreateIndex
CREATE UNIQUE INDEX "MatchRequestDao_id_key" ON "MatchRequestDao"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Role_value_key" ON "Role"("value");
