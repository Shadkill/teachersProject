-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "freeze" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "freezeeReason" TEXT;
