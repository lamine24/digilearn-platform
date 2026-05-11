CREATE TABLE `badge_definitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`icon_url` text,
	`category` varchar(50) NOT NULL,
	`required_points` int NOT NULL DEFAULT 0,
	`rarity` enum('common','uncommon','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `badge_definitions_id` PRIMARY KEY(`id`),
	CONSTRAINT `badge_definitions_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `notification_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`expiration_reminder_enabled` boolean NOT NULL DEFAULT true,
	`expiration_reminder_days` int NOT NULL DEFAULT 7,
	`expired_notification_enabled` boolean NOT NULL DEFAULT true,
	`email_from` varchar(255) NOT NULL DEFAULT 'noreply@digilearn.manus.space',
	`support_email` varchar(255) NOT NULL DEFAULT 'support@digilearn.manus.space',
	`max_retries_on_failure` int NOT NULL DEFAULT 3,
	`retry_delay_minutes` int NOT NULL DEFAULT 60,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` varchar(255),
	CONSTRAINT `notification_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`subscription_id` int,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'XOF',
	`status` enum('pending','success','failed','cancelled') NOT NULL DEFAULT 'pending',
	`payment_method` varchar(50) NOT NULL,
	`transaction_id` varchar(255),
	`reference_command` varchar(255),
	`errorMessage` text,
	`retry_count` int NOT NULL DEFAULT 0,
	`last_retry_at` timestamp,
	`completed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_history_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_history_transaction_id_unique` UNIQUE(`transaction_id`)
);
--> statement-breakpoint
CREATE TABLE `premium_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`price` decimal(10,2) NOT NULL DEFAULT '10000.00',
	`currency` varchar(10) NOT NULL DEFAULT 'XOF',
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`endDate` timestamp,
	`status` enum('active','cancelled','expired') NOT NULL DEFAULT 'active',
	`paymentId` varchar(255),
	`autoRenew` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `premium_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `premium_subscriptions_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `resource_downloads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceId` int NOT NULL,
	`originalUrl` text NOT NULL,
	`downloadedUrl` text NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`status` enum('pending','success','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`downloadedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resource_downloads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studio_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`filename` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`extractedContent` text,
	`errorMessage` text,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studio_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studio_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`slug` varchar(500) NOT NULL,
	`pedagogicalModel` enum('addie','qddie','bloom','sac','professional') NOT NULL DEFAULT 'addie',
	`status` enum('draft','in_progress','completed','archived') NOT NULL DEFAULT 'draft',
	`targetAudience` varchar(255),
	`estimatedDuration` int,
	`language` varchar(10) NOT NULL DEFAULT 'fr',
	`author` varchar(255),
	`institution` varchar(255),
	`credits` int,
	`prerequisites` text,
	`generalObjective` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studio_projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `studio_projects_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `studio_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`pedagogicalModel` enum('addie','qddie','bloom','sac','professional') NOT NULL DEFAULT 'addie',
	`status` enum('draft','generated','approved','published') NOT NULL DEFAULT 'draft',
	`generatedAt` timestamp,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `studio_scenarios_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriptionId` int NOT NULL,
	`userId` int NOT NULL,
	`notificationType` enum('expiring_soon','expired','renewal_reminder') NOT NULL,
	`daysBeforeExpiry` int,
	`sentAt` timestamp,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscription_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`badge_id` int NOT NULL,
	`unlocked_at` timestamp NOT NULL DEFAULT (now()),
	`progress` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_badges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_dashboard_stats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`total_courses_completed` int NOT NULL DEFAULT 0,
	`total_certificates_earned` int NOT NULL DEFAULT 0,
	`total_badges_unlocked` int NOT NULL DEFAULT 0,
	`total_points_earned` int NOT NULL DEFAULT 0,
	`current_streak` int NOT NULL DEFAULT 0,
	`last_activity_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_dashboard_stats_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_dashboard_stats_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `user_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`total_points` int NOT NULL DEFAULT 0,
	`current_level` varchar(50) NOT NULL DEFAULT 'bronze',
	`points_this_month` int NOT NULL DEFAULT 0,
	`last_points_update` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_points_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `external_courses`;--> statement-breakpoint
DROP TABLE `favorites`;--> statement-breakpoint
DROP TABLE `subscriptions`;--> statement-breakpoint
ALTER TABLE `courses` ADD `previewContent` text;--> statement-breakpoint
ALTER TABLE `courses` ADD `previewVideoUrl` text;--> statement-breakpoint
ALTER TABLE `free_resources` ADD `previewContent` text;--> statement-breakpoint
ALTER TABLE `free_resources` ADD `previewVideoUrl` text;--> statement-breakpoint
ALTER TABLE `payment_history` ADD CONSTRAINT `payment_history_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payment_history` ADD CONSTRAINT `payment_history_subscription_id_premium_subscriptions_id_fk` FOREIGN KEY (`subscription_id`) REFERENCES `premium_subscriptions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studio_documents` ADD CONSTRAINT `studio_documents_projectId_studio_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `studio_projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studio_projects` ADD CONSTRAINT `studio_projects_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studio_scenarios` ADD CONSTRAINT `studio_scenarios_projectId_studio_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `studio_projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_badges` ADD CONSTRAINT `user_badges_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_badges` ADD CONSTRAINT `user_badges_badge_id_badge_definitions_id_fk` FOREIGN KEY (`badge_id`) REFERENCES `badge_definitions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_dashboard_stats` ADD CONSTRAINT `user_dashboard_stats_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_points` ADD CONSTRAINT `user_points_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;