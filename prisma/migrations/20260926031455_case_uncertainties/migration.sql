-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "uncertainties" TEXT[] DEFAULT ARRAY[]::TEXT[];
