CREATE TABLE IF NOT EXISTS `subscription_notifications` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `subscriptionId` int NOT NULL,
  `userId` int NOT NULL,
  `notificationType` enum('expiring_soon', 'expired', 'renewal_reminder') NOT NULL,
  `daysBeforeExpiry` int,
  `sentAt` timestamp NULL,
  `status` enum('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
  `errorMessage` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `subscriptionId` (`subscriptionId`),
  KEY `userId` (`userId`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
