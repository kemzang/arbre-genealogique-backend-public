ALTER TABLE "chat_room_participants" ADD COLUMN "muted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "chat_room_participants" ADD COLUMN "cleared_at" TIMESTAMP(3);
