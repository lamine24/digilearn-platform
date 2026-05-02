CREATE TABLE `external_courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`slug` varchar(500) NOT NULL,
	`description` text,
	`shortDescription` text,
	`thumbnailUrl` text,
	`externalUrl` text NOT NULL,
	`source` enum('udemy','coursera','youtube','other') NOT NULL,
	`categoryId` int,
	`level` enum('debutant','intermediaire','avance') NOT NULL DEFAULT 'debutant',
	`duration` int DEFAULT 0,
	`instructor` varchar(255),
	`rating` decimal(3,1) DEFAULT '0.0',
	`enrollmentCount` int DEFAULT 0,
	`requiresSubscription` boolean NOT NULL DEFAULT true,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `external_courses_id` PRIMARY KEY(`id`),
	CONSTRAINT `external_courses_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planType` enum('monthly','yearly','lifetime') NOT NULL DEFAULT 'monthly',
	`price` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'XOF',
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`endDate` timestamp,
	`status` enum('active','cancelled','expired') NOT NULL DEFAULT 'active',
	`paymentId` varchar(255),
	`autoRenew` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
