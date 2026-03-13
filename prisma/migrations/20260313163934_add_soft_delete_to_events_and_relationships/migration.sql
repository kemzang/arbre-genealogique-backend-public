-- AlterTable
ALTER TABLE "family_events" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "relationships" ADD COLUMN     "deleted_at" TIMESTAMP(3);
