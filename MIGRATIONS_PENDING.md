# Migrations DB Pendantes - DigiLearn Platform

Ce document liste toutes les migrations DB qui doivent être appliquées pour finaliser la plateforme.

## 1. Table `notification_settings` (Paramètres de notifications)

```sql
CREATE TABLE IF NOT EXISTS `notification_settings` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `key` varchar(255) NOT NULL UNIQUE,
  `value` longtext NOT NULL,
  `type` enum('string', 'number', 'boolean', 'json') NOT NULL DEFAULT 'string',
  `description` text,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default notification settings
INSERT INTO `notification_settings` (`key`, `value`, `type`, `description`) VALUES
('email_enabled', 'true', 'boolean', 'Enable/disable email notifications'),
('reminder_days_before', '7', 'number', 'Days before expiration to send reminder'),
('max_retries', '3', 'number', 'Maximum retry attempts for failed notifications'),
('retry_interval_hours', '24', 'number', 'Hours between retry attempts')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
```

## 2. Table `payment_history` (Historique des paiements)

```sql
CREATE TABLE IF NOT EXISTS `payment_history` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `subscriptionId` int,
  `amount` decimal(10, 2) NOT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'XOF',
  `status` enum('pending', 'success', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  `paymentMethod` varchar(50),
  `transactionId` varchar(255) UNIQUE,
  `paytechReference` varchar(255) UNIQUE,
  `errorMessage` text,
  `metadata` json,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`subscriptionId`) REFERENCES `premium_subscriptions` (`id`) ON DELETE SET NULL,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_status` (`status`),
  INDEX `idx_createdAt` (`createdAt`),
  INDEX `idx_transactionId` (`transactionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 3. Modification de la table `free_resources` (Ajouter resourceType et downloadedUrl)

```sql
ALTER TABLE `free_resources` 
ADD COLUMN `resourceType` enum('external', 'proprietary') NOT NULL DEFAULT 'external' AFTER `externalUrl`,
ADD COLUMN `downloadedUrl` varchar(500) AFTER `resourceType`,
ADD INDEX `idx_resourceType` (`resourceType`);
```

## 4. Table `resource_downloads` (Suivi des téléchargements de ressources)

```sql
CREATE TABLE IF NOT EXISTS `resource_downloads` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `resourceId` int NOT NULL,
  `originalUrl` varchar(500) NOT NULL,
  `downloadedUrl` varchar(500),
  `fileSize` bigint,
  `status` enum('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
  `errorMessage` text,
  `retryCount` int NOT NULL DEFAULT 0,
  `lastRetryAt` datetime,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`resourceId`) REFERENCES `free_resources` (`id`) ON DELETE CASCADE,
  INDEX `idx_resourceId` (`resourceId`),
  INDEX `idx_status` (`status`),
  UNIQUE KEY `unique_resource_download` (`resourceId`, `originalUrl`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 5. Table `subscription_notifications` (Suivi des notifications d'abonnement)

```sql
CREATE TABLE IF NOT EXISTS `subscription_notifications` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `subscriptionId` int NOT NULL,
  `userId` int NOT NULL,
  `type` enum('expiration_reminder', 'expired', 'renewal_failed') NOT NULL,
  `sentAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('sent', 'failed', 'bounced') NOT NULL DEFAULT 'sent',
  `email` varchar(255),
  `errorMessage` text,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`subscriptionId`) REFERENCES `premium_subscriptions` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_subscriptionId` (`subscriptionId`),
  INDEX `idx_userId` (`userId`),
  INDEX `idx_type` (`type`),
  INDEX `idx_sentAt` (`sentAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Instructions d'Application

1. **Via Manus Management UI (Recommandé) :**
   - Allez au **Database Panel** dans la Management UI
   - Copiez-collez chaque migration SQL dans l'éditeur
   - Cliquez sur "Execute" pour appliquer

2. **Via MySQL CLI (Alternative) :**
   ```bash
   mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < migrations.sql
   ```

## Vérification

Après application, vérifiez que les tables existent :

```sql
SHOW TABLES LIKE '%notification%';
SHOW TABLES LIKE '%payment%';
SHOW TABLES LIKE '%subscription%';
SHOW TABLES LIKE '%resource%';

-- Vérifier les colonnes de free_resources
DESCRIBE free_resources;
```

## Dépendances

- ✅ `users` table (existante)
- ✅ `premium_subscriptions` table (existante)
- ✅ `free_resources` table (existante, à modifier)

Toutes les migrations peuvent être appliquées dans n'importe quel ordre car elles n'ont pas de dépendances circulaires.
