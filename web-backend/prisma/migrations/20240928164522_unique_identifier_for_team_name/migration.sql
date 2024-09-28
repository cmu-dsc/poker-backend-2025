/*
  Warnings:

  - A unique constraint covering the columns `[teamName]` on the table `TeamDao` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TeamDao_teamName_key" ON "TeamDao"("teamName");
