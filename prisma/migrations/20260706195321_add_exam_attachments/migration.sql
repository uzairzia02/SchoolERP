-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[];
