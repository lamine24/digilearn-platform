CREATE TABLE IF NOT EXISTS `studio_capsules` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `projectId` int NOT NULL,
  `scenarioId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `narrationText` text,
  `videoUrl` text,
  `videoKey` varchar(255),
  `thumbnailUrl` text,
  `duration` int,
  `generatedBy` enum('reemotion', 'motion_canvas', 'manual') DEFAULT 'manual',
  `videoStatus` enum('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`projectId`) REFERENCES `studio_projects`(`id`),
  FOREIGN KEY (`scenarioId`) REFERENCES `studio_scenarios`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
