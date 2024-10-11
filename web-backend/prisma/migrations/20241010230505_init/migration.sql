-- CreateEnum
CREATE TYPE "PermissionLevel" AS ENUM ('ADMIN', 'USER');

-- CreateTable
CREATE TABLE "UserDao" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "permissionLevel" "PermissionLevel" NOT NULL DEFAULT 'USER',
    "teamId" INTEGER,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserDao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamDao" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "activeBotId" INTEGER NOT NULL,
    "elo" INTEGER NOT NULL DEFAULT 1000,

    CONSTRAINT "TeamDao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMatchDao" (
    "id" SERIAL NOT NULL,
    "matchId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "bankroll" INTEGER NOT NULL,
    "botId" INTEGER NOT NULL,

    CONSTRAINT "TeamMatchDao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchDao" (
    "matchId" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "matchRequestId" INTEGER,

    CONSTRAINT "MatchDao_pkey" PRIMARY KEY ("matchId")
);

-- CreateTable
CREATE TABLE "TeamInviteDao" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "sendAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "TeamInviteDao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchRequestDao" (
    "id" SERIAL NOT NULL,
    "requestingTeamId" INTEGER NOT NULL,
    "requestedTeamId" INTEGER NOT NULL,
    "sendAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAccepted" BOOLEAN NOT NULL,

    CONSTRAINT "MatchRequestDao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotDao" (
    "id" SERIAL NOT NULL,
    "version" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storageLocation" TEXT NOT NULL,
    "activeTeamId" INTEGER,

    CONSTRAINT "BotDao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDao_id_key" ON "UserDao"("id");

-- CreateIndex
CREATE UNIQUE INDEX "UserDao_email_key" ON "UserDao"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TeamDao_id_key" ON "TeamDao"("id");

-- CreateIndex
CREATE UNIQUE INDEX "TeamDao_activeBotId_key" ON "TeamDao"("activeBotId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMatchDao_id_key" ON "TeamMatchDao"("id");

-- CreateIndex
CREATE UNIQUE INDEX "MatchDao_matchId_key" ON "MatchDao"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchDao_matchRequestId_key" ON "MatchDao"("matchRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamInviteDao_id_key" ON "TeamInviteDao"("id");

-- CreateIndex
CREATE UNIQUE INDEX "MatchRequestDao_id_key" ON "MatchRequestDao"("id");

-- CreateIndex
CREATE UNIQUE INDEX "BotDao_id_key" ON "BotDao"("id");

-- CreateIndex
CREATE UNIQUE INDEX "BotDao_activeTeamId_key" ON "BotDao"("activeTeamId");

-- AddForeignKey
ALTER TABLE "UserDao" ADD CONSTRAINT "UserDao_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TeamDao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamDao" ADD CONSTRAINT "TeamDao_activeBotId_fkey" FOREIGN KEY ("activeBotId") REFERENCES "BotDao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMatchDao" ADD CONSTRAINT "TeamMatchDao_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "MatchDao"("matchId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMatchDao" ADD CONSTRAINT "TeamMatchDao_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TeamDao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMatchDao" ADD CONSTRAINT "TeamMatchDao_botId_fkey" FOREIGN KEY ("botId") REFERENCES "BotDao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchDao" ADD CONSTRAINT "MatchDao_matchRequestId_fkey" FOREIGN KEY ("matchRequestId") REFERENCES "MatchRequestDao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInviteDao" ADD CONSTRAINT "TeamInviteDao_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TeamDao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamInviteDao" ADD CONSTRAINT "TeamInviteDao_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserDao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRequestDao" ADD CONSTRAINT "MatchRequestDao_requestingTeamId_fkey" FOREIGN KEY ("requestingTeamId") REFERENCES "TeamDao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRequestDao" ADD CONSTRAINT "MatchRequestDao_requestedTeamId_fkey" FOREIGN KEY ("requestedTeamId") REFERENCES "TeamDao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotDao" ADD CONSTRAINT "BotDao_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TeamDao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
