-- DigiLearn Studio - SQL Migration
-- Tables pour le module d'authoring pédagogique IA-augmenté

-- Table des projets Studio
CREATE TABLE IF NOT EXISTS `studio_projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `slug` VARCHAR(255) UNIQUE NOT NULL,
  `status` ENUM('draft', 'in_progress', 'completed', 'published') DEFAULT 'draft',
  `pedagogicalModel` ENUM('bloom', 'addie', 'gagne') DEFAULT 'addie',
  `targetAudience` VARCHAR(255),
  `estimatedDuration` INT, -- en minutes
  `language` VARCHAR(10) DEFAULT 'fr',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX (`userId`),
  INDEX (`status`),
  INDEX (`slug`)
);

-- Table des documents uploadés
CREATE TABLE IF NOT EXISTS `studio_documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `projectId` INT NOT NULL,
  `fileName` VARCHAR(255) NOT NULL,
  `fileKey` VARCHAR(255) NOT NULL, -- S3 key
  `fileUrl` VARCHAR(255) NOT NULL, -- S3 URL
  `fileType` ENUM('pdf', 'docx', 'pptx', 'txt') NOT NULL,
  `fileSize` INT, -- en bytes
  `extractedContent` LONGTEXT, -- Contenu extrait du document
  `extractionStatus` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`projectId`) REFERENCES `studio_projects`(`id`) ON DELETE CASCADE,
  INDEX (`projectId`),
  INDEX (`extractionStatus`)
);

-- Table des scénarios pédagogiques générés
CREATE TABLE IF NOT EXISTS `studio_scenarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `projectId` INT NOT NULL,
  `documentId` INT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `learningObjectives` JSON, -- Array of learning objectives
  `contentStructure` JSON, -- Structure du contenu (modules, leçons, etc.)
  `interactiveElements` JSON, -- Éléments interactifs (quiz, simulations, etc.)
  `generatedBy` ENUM('mistral', 'claude', 'manual') DEFAULT 'mistral',
  `generationStatus` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  `generatedAt` TIMESTAMP,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`projectId`) REFERENCES `studio_projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`documentId`) REFERENCES `studio_documents`(`id`) ON DELETE SET NULL,
  INDEX (`projectId`),
  INDEX (`generationStatus`)
);

-- Table des capsules vidéo produites
CREATE TABLE IF NOT EXISTS `studio_capsules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `projectId` INT NOT NULL,
  `scenarioId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `videoKey` VARCHAR(255), -- S3 key
  `videoUrl` VARCHAR(255), -- S3 URL
  `videoStatus` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  `duration` INT, -- en secondes
  `narrationText` LONGTEXT, -- Texte de narration
  `narrationUrl` VARCHAR(255), -- URL du fichier audio
  `generatedBy` ENUM('reemotion', 'motion_canvas', 'manual') DEFAULT 'reemotion',
  `generatedAt` TIMESTAMP,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`projectId`) REFERENCES `studio_projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`scenarioId`) REFERENCES `studio_scenarios`(`id`) ON DELETE CASCADE,
  INDEX (`projectId`),
  INDEX (`scenarioId`),
  INDEX (`videoStatus`)
);

-- Table des éléments interactifs H5P
CREATE TABLE IF NOT EXISTS `studio_h5p_elements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `projectId` INT NOT NULL,
  `capsuleId` INT,
  `type` ENUM('quiz', 'simulation', 'interactive_video', 'branching_scenario', 'drag_drop', 'multiple_choice', 'true_false') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `h5pContent` JSON, -- Contenu H5P structuré
  `h5pId` VARCHAR(255), -- ID H5P externe
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`projectId`) REFERENCES `studio_projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`capsuleId`) REFERENCES `studio_capsules`(`id`) ON DELETE SET NULL,
  INDEX (`projectId`),
  INDEX (`type`)
);

-- Table des exports SCORM/LTI
CREATE TABLE IF NOT EXISTS `studio_exports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `projectId` INT NOT NULL,
  `exportType` ENUM('scorm_1_2', 'scorm_2004', 'xapi_cmi5', 'lti_1_3') NOT NULL,
  `exportKey` VARCHAR(255) NOT NULL, -- S3 key
  `exportUrl` VARCHAR(255) NOT NULL, -- S3 URL
  `exportStatus` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  `metadata` JSON, -- Métadonnées SCORM/LTI
  `exportedAt` TIMESTAMP,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`projectId`) REFERENCES `studio_projects`(`id`) ON DELETE CASCADE,
  INDEX (`projectId`),
  INDEX (`exportStatus`),
  INDEX (`exportType`)
);

-- Table des listings sur la Marketplace DigiLearn
CREATE TABLE IF NOT EXISTS `studio_marketplace_listings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `projectId` INT NOT NULL,
  `userId` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `thumbnailUrl` VARCHAR(255),
  `price` DECIMAL(10, 2), -- Prix en FCFA
  `revenueShare` DECIMAL(5, 2) DEFAULT 70, -- Pourcentage pour le créateur (70%)
  `status` ENUM('draft', 'published', 'unpublished', 'suspended') DEFAULT 'draft',
  `views` INT DEFAULT 0,
  `downloads` INT DEFAULT 0,
  `rating` DECIMAL(3, 2), -- Note moyenne
  `publishedAt` TIMESTAMP,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`projectId`) REFERENCES `studio_projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX (`userId`),
  INDEX (`status`),
  INDEX (`publishedAt`)
);

-- Table des transactions de revenus
CREATE TABLE IF NOT EXISTS `studio_revenue_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `listingId` INT NOT NULL,
  `buyerId` INT NOT NULL,
  `sellerId` INT NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `sellerEarnings` DECIMAL(10, 2) NOT NULL, -- 70% du montant
  `platformEarnings` DECIMAL(10, 2) NOT NULL, -- 30% du montant
  `status` ENUM('pending', 'completed', 'refunded') DEFAULT 'pending',
  `transactionDate` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`listingId`) REFERENCES `studio_marketplace_listings`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`buyerId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sellerId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX (`sellerId`),
  INDEX (`status`),
  INDEX (`transactionDate`)
);

-- Table des accès aux projets Studio
CREATE TABLE IF NOT EXISTS `studio_project_access` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `projectId` INT NOT NULL,
  `userId` INT NOT NULL,
  `accessLevel` ENUM('view', 'edit', 'admin') DEFAULT 'view',
  `grantedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`projectId`) REFERENCES `studio_projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX (`projectId`),
  INDEX (`userId`),
  UNIQUE KEY (`projectId`, `userId`)
);

-- Index supplémentaires pour performance
CREATE INDEX idx_studio_projects_userId_status ON `studio_projects`(`userId`, `status`);
CREATE INDEX idx_studio_documents_projectId_status ON `studio_documents`(`projectId`, `extractionStatus`);
CREATE INDEX idx_studio_scenarios_projectId_status ON `studio_scenarios`(`projectId`, `generationStatus`);
CREATE INDEX idx_studio_capsules_projectId_status ON `studio_capsules`(`projectId`, `videoStatus`);
CREATE INDEX idx_studio_exports_projectId_type ON `studio_exports`(`projectId`, `exportType`);
