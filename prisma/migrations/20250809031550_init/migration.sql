-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `kakao_id` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `nickname` VARCHAR(191) NULL,
    `profile_image_url` VARCHAR(191) NULL,
    `thumbnail_image_url` VARCHAR(191) NULL,
    `connected_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_kakao_id_key`(`kakao_id`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
