-- ═══════════════════════════════════════════════════════════════════════════════
-- DigiLearn Platform: Priority Features Migration
-- Features: Certificates, Points/Badges, User Dashboard
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. USER POINTS TABLE (Gamification)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `user_points` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `total_points` INT DEFAULT 0 NOT NULL,
  `current_level` VARCHAR(50) DEFAULT 'bronze' NOT NULL,
  `points_this_month` INT DEFAULT 0 NOT NULL,
  `last_points_update` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_points` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. BADGE DEFINITIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `badge_definitions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `icon_url` TEXT,
  `category` VARCHAR(50) NOT NULL,
  `required_points` INT DEFAULT 0 NOT NULL,
  `rarity` ENUM('common', 'uncommon', 'rare', 'epic', 'legendary') DEFAULT 'common' NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `idx_category` (`category`),
  INDEX `idx_rarity` (`rarity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. USER BADGES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `user_badges` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `badge_id` INT NOT NULL,
  `unlocked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `progress` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`badge_id`) REFERENCES `badge_definitions`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_badge` (`user_id`, `badge_id`),
  INDEX `idx_user_badges` (`user_id`),
  INDEX `idx_badge_id` (`badge_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. USER DASHBOARD STATS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `user_dashboard_stats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `total_courses_completed` INT DEFAULT 0 NOT NULL,
  `total_certificates_earned` INT DEFAULT 0 NOT NULL,
  `total_badges_unlocked` INT DEFAULT 0 NOT NULL,
  `total_points_earned` INT DEFAULT 0 NOT NULL,
  `current_streak` INT DEFAULT 0 NOT NULL,
  `last_activity_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_stats` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. SEED BADGE DEFINITIONS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO `badge_definitions` (`name`, `description`, `icon_url`, `category`, `required_points`, `rarity`) VALUES
('Débutant', 'Complétez votre première formation', '/badges/beginner.svg', 'achievement', 0, 'common'),
('Apprenant Actif', 'Gagnez 100 points', '/badges/active-learner.svg', 'milestone', 100, 'uncommon'),
('Maître Étudiant', 'Gagnez 500 points', '/badges/master-student.svg', 'milestone', 500, 'rare'),
('Expert', 'Gagnez 1000 points', '/badges/expert.svg', 'milestone', 1000, 'epic'),
('Légende', 'Gagnez 5000 points', '/badges/legend.svg', 'milestone', 5000, 'legendary'),
('Certificat Gagné', 'Obtenez votre premier certificat', '/badges/certificate.svg', 'achievement', 0, 'uncommon'),
('Partageant', 'Partagez une ressource 5 fois', '/badges/sharer.svg', 'social', 50, 'common'),
('Collaborateur', 'Participez aux forums 10 fois', '/badges/collaborator.svg', 'social', 100, 'uncommon');

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. INDEXES FOR PERFORMANCE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS `idx_user_points_level` ON `user_points`(`current_level`);
CREATE INDEX IF NOT EXISTS `idx_user_badges_unlocked` ON `user_badges`(`unlocked_at`);
CREATE INDEX IF NOT EXISTS `idx_dashboard_stats_activity` ON `user_dashboard_stats`(`last_activity_at`);
