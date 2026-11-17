/*
  Warnings:

  - You are about to drop the column `freezeeReason` on the `Teacher` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Teacher" DROP COLUMN "freezeeReason",
ADD COLUMN     "freezeReason" TEXT;
