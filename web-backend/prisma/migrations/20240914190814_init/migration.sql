-- CreateTable
CREATE TABLE "UserDao" (
    "andrewId" TEXT NOT NULL PRIMARY KEY,
    "teamDaoGithubUsername" TEXT,
    CONSTRAINT "UserDao_teamDaoGithubUsername_fkey" FOREIGN KEY ("teamDaoGithubUsername") REFERENCES "TeamDao" ("githubUsername") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TeamDao" (
    "githubUsername" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "TeamMatchDao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "bankroll" INTEGER NOT NULL,
    CONSTRAINT "TeamMatchDao_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "MatchDao" ("matchId") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TeamMatchDao_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TeamDao" ("githubUsername") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchDao" (
    "matchId" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDao_andrewId_key" ON "UserDao"("andrewId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamDao_githubUsername_key" ON "TeamDao"("githubUsername");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMatchDao_id_key" ON "TeamMatchDao"("id");

-- CreateIndex
CREATE UNIQUE INDEX "MatchDao_matchId_key" ON "MatchDao"("matchId");
