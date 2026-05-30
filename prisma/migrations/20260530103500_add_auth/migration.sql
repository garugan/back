-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Preserve existing local rows by assigning them to a default development user.
INSERT INTO `User` (`id`, `email`, `passwordHash`, `name`, `createdAt`, `updatedAt`)
VALUES (
    'local_user',
    'local@example.com',
    '$2b$12$0CIkIDbTXBM2ZbMxIrc7gOp2ErAWadb6FlT/TZU5mh5mA0NGLAmk6',
    'Local User',
    CURRENT_TIMESTAMP(3),
    CURRENT_TIMESTAMP(3)
);

-- Existing Restaurant.id contains the Google Place ID. Move it to placeId and add an internal ID.
ALTER TABLE `Restaurant` DROP PRIMARY KEY;
ALTER TABLE `Restaurant` CHANGE COLUMN `id` `placeId` VARCHAR(191) NOT NULL;
ALTER TABLE `Restaurant` ADD COLUMN `id` VARCHAR(191) NULL FIRST;
ALTER TABLE `Restaurant` ADD COLUMN `userId` VARCHAR(191) NULL AFTER `id`;

UPDATE `Restaurant`
SET
    `id` = CONCAT('restaurant_', LEFT(SHA2(`placeId`, 256), 32)),
    `userId` = 'local_user';

ALTER TABLE `Restaurant` MODIFY `id` VARCHAR(191) NOT NULL;
ALTER TABLE `Restaurant` MODIFY `userId` VARCHAR(191) NOT NULL;
ALTER TABLE `Restaurant` ADD PRIMARY KEY (`id`);

CREATE UNIQUE INDEX `Restaurant_userId_placeId_key` ON `Restaurant`(`userId`, `placeId`);
CREATE INDEX `Restaurant_userId_idx` ON `Restaurant`(`userId`);

ALTER TABLE `Restaurant`
ADD CONSTRAINT `Restaurant_userId_fkey`
FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
ON DELETE CASCADE ON UPDATE CASCADE;
