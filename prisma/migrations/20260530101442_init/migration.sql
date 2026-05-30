-- CreateTable
CREATE TABLE `Restaurant` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `photo` TEXT NULL,
    `status` VARCHAR(20) NOT NULL,
    `rating` INTEGER NOT NULL,
    `visitDate` VARCHAR(10) NULL,
    `memo` TEXT NOT NULL,
    `floor` VARCHAR(10) NOT NULL,
    `elevator` VARCHAR(20) NOT NULL,
    `category` VARCHAR(255) NOT NULL,
    `address` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
