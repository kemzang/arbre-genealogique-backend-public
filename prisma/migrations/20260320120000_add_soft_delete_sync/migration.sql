-- AlterTable: Add deletedAt to persons
ALTER TABLE "persons" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AlterTable: Add deletedAt to chat_rooms
ALTER TABLE "chat_rooms" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AlterTable: Add updatedAt to chat_room_participants (handle existing rows)
ALTER TABLE "chat_room_participants" ADD COLUMN "updated_at" TIMESTAMP(3);
UPDATE "chat_room_participants" SET "updated_at" = "joined_at" WHERE "updated_at" IS NULL;
ALTER TABLE "chat_room_participants" ALTER COLUMN "updated_at" SET NOT NULL;
ALTER TABLE "chat_room_participants" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: Add deletedAt to messages
ALTER TABLE "messages" ADD COLUMN "deleted_at" TIMESTAMP(3);
