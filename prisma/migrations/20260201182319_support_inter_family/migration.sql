-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NULL,
    `profile_picture_url` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `families` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `family_name` VARCHAR(191) NOT NULL,
    `logo_url` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `family_id` INTEGER NOT NULL,
    `role` ENUM('ADMIN', 'EDITOR', 'VIEWER') NOT NULL DEFAULT 'VIEWER',
    `status` ENUM('PENDING', 'ACTIVE', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `application_data` LONGTEXT NULL,

    INDEX `members_family_id_fkey`(`family_id`),
    INDEX `members_user_id_fkey`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `membership_validations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `target_member_id` INTEGER NOT NULL,
    `validator_id` INTEGER NOT NULL,
    `vote_type` ENUM('APPROVE', 'REJECT') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `membership_validations_validator_id_fkey`(`validator_id`),
    UNIQUE INDEX `membership_validations_target_member_id_validator_id_key`(`target_member_id`, `validator_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `persons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `family_id` INTEGER NOT NULL,
    `first_name` VARCHAR(191) NULL,
    `last_name` VARCHAR(191) NULL,
    `birth_date` DATETIME(3) NULL,
    `death_date` DATETIME(3) NULL,
    `gender` ENUM('M', 'F', 'O') NULL,
    `bio` VARCHAR(191) NULL,
    `profile_picture_url` VARCHAR(191) NULL,
    `linked_user_id` INTEGER NULL,

    INDEX `persons_family_id_fkey`(`family_id`),
    INDEX `persons_linked_user_id_fkey`(`linked_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `relationships` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `person_a_id` INTEGER NOT NULL,
    `person_b_id` INTEGER NOT NULL,
    `type` ENUM('PARENTAL', 'UNION', 'SIBLING') NOT NULL,
    `is_biological` BOOLEAN NOT NULL DEFAULT true,

    INDEX `relationships_person_a_id_fkey`(`person_a_id`),
    INDEX `relationships_person_b_id_fkey`(`person_b_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `family_merge_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `source_family_id` INTEGER NOT NULL,
    `target_family_id` INTEGER NOT NULL,
    `requester_id` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `family_connections` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `family_a_id` INTEGER NOT NULL,
    `family_b_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `family_connections_family_a_id_family_b_id_key`(`family_a_id`, `family_b_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_rooms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `family_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `avatar_url` VARCHAR(191) NULL,
    `channel_type` ENUM('PUBLIC', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creator_id` INTEGER NULL,

    INDEX `chat_rooms_creator_id_fkey`(`creator_id`),
    INDEX `chat_rooms_family_id_fkey`(`family_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chat_room_participants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chat_room_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `role` ENUM('ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER',
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `chat_room_participants_user_id_fkey`(`user_id`),
    UNIQUE INDEX `chat_room_participants_chat_room_id_user_id_key`(`chat_room_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chat_room_id` INTEGER NOT NULL,
    `sender_id` INTEGER NOT NULL,
    `content` VARCHAR(191) NULL,
    `sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `messages_chat_room_id_fkey`(`chat_room_id`),
    INDEX `messages_sender_id_fkey`(`sender_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `family_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NULL,
    `event_date` DATETIME(3) NULL,
    `location` VARCHAR(191) NULL,
    `creator_id` INTEGER NULL,
    `visibility` ENUM('PUBLIC', 'PRIVATE', 'RESTRICTED', 'BRANCH') NOT NULL DEFAULT 'PUBLIC',
    `target_person_id` INTEGER NULL,

    INDEX `family_events_creator_id_fkey`(`creator_id`),
    INDEX `family_events_target_person_id_fkey`(`target_person_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `family_event_families` (
    `event_id` INTEGER NOT NULL,
    `family_id` INTEGER NOT NULL,

    PRIMARY KEY (`event_id`, `family_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_guests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_id` INTEGER NOT NULL,
    `person_id` INTEGER NOT NULL,

    INDEX `event_guests_person_id_fkey`(`person_id`),
    UNIQUE INDEX `event_guests_event_id_person_id_key`(`event_id`, `person_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `family_id` INTEGER NOT NULL,
    `uploader_id` INTEGER NOT NULL,
    `person_id` INTEGER NULL,
    `event_id` INTEGER NULL,
    `message_id` INTEGER NULL,
    `url_path` VARCHAR(191) NOT NULL,
    `media_type` ENUM('IMAGE', 'VIDEO', 'FILE') NOT NULL,

    INDEX `media_event_id_fkey`(`event_id`),
    INDEX `media_family_id_fkey`(`family_id`),
    INDEX `media_message_id_fkey`(`message_id`),
    INDEX `media_person_id_fkey`(`person_id`),
    INDEX `media_uploader_id_fkey`(`uploader_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `members` ADD CONSTRAINT `members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `membership_validations` ADD CONSTRAINT `membership_validations_target_member_id_fkey` FOREIGN KEY (`target_member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `membership_validations` ADD CONSTRAINT `membership_validations_validator_id_fkey` FOREIGN KEY (`validator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `persons` ADD CONSTRAINT `persons_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `persons` ADD CONSTRAINT `persons_linked_user_id_fkey` FOREIGN KEY (`linked_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `relationships` ADD CONSTRAINT `relationships_person_a_id_fkey` FOREIGN KEY (`person_a_id`) REFERENCES `persons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `relationships` ADD CONSTRAINT `relationships_person_b_id_fkey` FOREIGN KEY (`person_b_id`) REFERENCES `persons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_merge_requests` ADD CONSTRAINT `family_merge_requests_source_family_id_fkey` FOREIGN KEY (`source_family_id`) REFERENCES `families`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_merge_requests` ADD CONSTRAINT `family_merge_requests_target_family_id_fkey` FOREIGN KEY (`target_family_id`) REFERENCES `families`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_merge_requests` ADD CONSTRAINT `family_merge_requests_requester_id_fkey` FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_connections` ADD CONSTRAINT `family_connections_family_a_id_fkey` FOREIGN KEY (`family_a_id`) REFERENCES `families`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_connections` ADD CONSTRAINT `family_connections_family_b_id_fkey` FOREIGN KEY (`family_b_id`) REFERENCES `families`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_rooms` ADD CONSTRAINT `chat_rooms_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_rooms` ADD CONSTRAINT `chat_rooms_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_room_participants` ADD CONSTRAINT `chat_room_participants_chat_room_id_fkey` FOREIGN KEY (`chat_room_id`) REFERENCES `chat_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_room_participants` ADD CONSTRAINT `chat_room_participants_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_chat_room_id_fkey` FOREIGN KEY (`chat_room_id`) REFERENCES `chat_rooms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_events` ADD CONSTRAINT `family_events_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_events` ADD CONSTRAINT `family_events_target_person_id_fkey` FOREIGN KEY (`target_person_id`) REFERENCES `persons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_event_families` ADD CONSTRAINT `family_event_families_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `family_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_event_families` ADD CONSTRAINT `family_event_families_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_guests` ADD CONSTRAINT `event_guests_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `family_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_guests` ADD CONSTRAINT `event_guests_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media` ADD CONSTRAINT `media_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `family_events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media` ADD CONSTRAINT `media_family_id_fkey` FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media` ADD CONSTRAINT `media_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media` ADD CONSTRAINT `media_person_id_fkey` FOREIGN KEY (`person_id`) REFERENCES `persons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media` ADD CONSTRAINT `media_uploader_id_fkey` FOREIGN KEY (`uploader_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
