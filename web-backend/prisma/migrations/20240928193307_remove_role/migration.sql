/*
  Warnings:

  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `permissionLevelId` on the `UserDao` table. All the data in the column will be lost.
  - Added the required column `permissionLevel` to the `UserDao` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Role_value_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Role";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserDao" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "permissionLevel" TEXT NOT NULL,
    "teamId" INTEGER,
    CONSTRAINT "UserDao_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TeamDao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_UserDao" ("email", "id", "teamId") SELECT "email", "id", "teamId" FROM "UserDao";
DROP TABLE "UserDao";
ALTER TABLE "new_UserDao" RENAME TO "UserDao";
CREATE UNIQUE INDEX "UserDao_id_key" ON "UserDao"("id");
CREATE UNIQUE INDEX "UserDao_email_key" ON "UserDao"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
