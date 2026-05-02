-- Create external_courses table
CREATE TABLE IF NOT EXISTS `external_courses` (
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `external_courses_id` PRIMARY KEY(`id`),
	CONSTRAINT `external_courses_slug_unique` UNIQUE(`slug`)
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planType` enum('monthly','yearly','lifetime') NOT NULL DEFAULT 'monthly',
	`price` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'XOF',
	`startDate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`endDate` timestamp,
	`status` enum('active','cancelled','expired') NOT NULL DEFAULT 'active',
	`paymentId` varchar(255),
	`autoRenew` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_userId_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- Insert sample external courses for testing
INSERT INTO `external_courses` (`title`, `slug`, `description`, `shortDescription`, `externalUrl`, `source`, `level`, `duration`, `instructor`, `rating`, `requiresSubscription`, `isActive`)
VALUES 
('Python for Data Science', 'python-data-science', 'Learn Python programming for data science applications', 'Master Python for data analysis', 'https://www.udemy.com/course/python-for-data-science', 'udemy', 'intermediaire', 40, 'John Doe', 4.5, true, true),
('Web Development with React', 'web-dev-react', 'Complete guide to building web applications with React', 'Build modern web apps with React', 'https://www.coursera.org/learn/react', 'coursera', 'intermediaire', 30, 'Jane Smith', 4.7, true, true),
('Machine Learning Basics', 'ml-basics', 'Introduction to machine learning concepts and algorithms', 'Get started with ML', 'https://www.youtube.com/playlist?list=PLkDaJ6LfdBvq', 'youtube', 'debutant', 25, 'AI Expert', 4.3, true, true);
