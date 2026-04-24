CREATE TABLE `module_resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moduleId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`resourceType` enum('video','pdf','document','image','audio','lien','autre') NOT NULL,
	`fileUrl` text,
	`fileSize` int,
	`mimeType` varchar(100),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `module_resources_id` PRIMARY KEY(`id`)
);
