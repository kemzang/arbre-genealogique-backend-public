/*
  Warnings:

  - Added the required column `relationship_type` to the `family_merge_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source_person_id` to the `family_merge_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `target_person_id` to the `family_merge_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `family_merge_requests` ADD COLUMN `justification` VARCHAR(191) NULL,
    ADD COLUMN `relationship_type` ENUM('PARENTAL', 'UNION', 'SIBLING') NOT NULL,
    ADD COLUMN `source_person_id` INTEGER NOT NULL,
    ADD COLUMN `target_person_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `family_merge_requests` ADD CONSTRAINT `family_merge_requests_source_person_id_fkey` FOREIGN KEY (`source_person_id`) REFERENCES `persons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `family_merge_requests` ADD CONSTRAINT `family_merge_requests_target_person_id_fkey` FOREIGN KEY (`target_person_id`) REFERENCES `persons`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
