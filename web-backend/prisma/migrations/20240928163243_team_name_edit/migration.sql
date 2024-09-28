/*
  Warnings:

  - You are about to drop the column `name` on the `TeamDao` table. All the data in the column will be lost.
  - Added the required column `teamName` to the `TeamDao` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TeamDao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamName" TEXT NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_TeamDao" ("deleted", "id") SELECT "deleted", "id" FROM "TeamDao";
DROP TABLE "TeamDao";
ALTER TABLE "new_TeamDao" RENAME TO "TeamDao";
CREATE UNIQUE INDEX "TeamDao_id_key" ON "TeamDao"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
