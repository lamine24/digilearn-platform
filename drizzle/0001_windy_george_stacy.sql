CREATE TABLE `alumni_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`linkedinUrl` varchar(500),
	`company` varchar(255),
	`jobTitle` varchar(255),
	`graduationYear` int,
	`isVisible` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alumni_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `alumni_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`iconName` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `certificates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`enrollmentId` int NOT NULL,
	`certificateCode` varchar(64) NOT NULL,
	`pdfUrl` text,
	`pdfKey` text,
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`verifiedCount` int DEFAULT 0,
	CONSTRAINT `certificates_id` PRIMARY KEY(`id`),
	CONSTRAINT `certificates_certificateCode_unique` UNIQUE(`certificateCode`)
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(128) NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`content` text NOT NULL,
	`needsHuman` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`slug` varchar(500) NOT NULL,
	`description` text,
	`shortDescription` text,
	`thumbnailUrl` text,
	`categoryId` int,
	`formateurId` int,
	`price` decimal(10,2) NOT NULL DEFAULT '0.00',
	`currency` varchar(10) NOT NULL DEFAULT 'XOF',
	`level` enum('debutant','intermediaire','avance') NOT NULL DEFAULT 'debutant',
	`duration` int DEFAULT 0,
	`status` enum('brouillon','publie','archive') NOT NULL DEFAULT 'brouillon',
	`maxStudents` int,
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courses_id` PRIMARY KEY(`id`),
	CONSTRAINT `courses_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`status` enum('en_attente','actif','complete','abandonne') NOT NULL DEFAULT 'en_attente',
	`progress` int NOT NULL DEFAULT 0,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`lastAccessedAt` timestamp,
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `module_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`moduleId` int NOT NULL,
	`courseId` int NOT NULL,
	`completed` boolean NOT NULL DEFAULT false,
	`score` int,
	`timeSpent` int DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `module_progress_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `modules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courseId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`contentType` enum('video','texte','quiz','exercice','pdf') NOT NULL DEFAULT 'video',
	`contentUrl` text,
	`contentBody` text,
	`duration` int DEFAULT 5,
	`sortOrder` int NOT NULL DEFAULT 0,
	`isPreview` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `modules_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('inactivite','inscription','rappel_session','certification','general') NOT NULL,
	`title` varchar(500) NOT NULL,
	`message` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`courseId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'XOF',
	`paymentMethod` varchar(64) DEFAULT 'paytech',
	`transactionRef` varchar(255),
	`paytechToken` varchar(500),
	`status` enum('en_attente','reussi','echoue','rembourse') NOT NULL DEFAULT 'en_attente',
	`paidAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quiz_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`moduleId` int NOT NULL,
	`question` text NOT NULL,
	`options` text NOT NULL,
	`correctAnswer` int NOT NULL,
	`explanation` text,
	`sortOrder` int NOT NULL DEFAULT 0,
	CONSTRAINT `quiz_questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','formateur','apprenant','alumni','prospect') NOT NULL DEFAULT 'prospect';--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(32);--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `lastActiveAt` timestamp DEFAULT (now()) NOT NULL;