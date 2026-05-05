CREATE TABLE IF NOT EXISTS `notification_settings` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `expiration_reminder_enabled` boolean NOT NULL DEFAULT true,
  `expiration_reminder_days` int NOT NULL DEFAULT 7,
  `expired_notification_enabled` boolean NOT NULL DEFAULT true,
  `email_from` varchar(255) NOT NULL DEFAULT 'noreply@digilearn.manus.space',
  `support_email` varchar(255) NOT NULL DEFAULT 'support@digilearn.manus.space',
  `max_retries_on_failure` int NOT NULL DEFAULT 3,
  `retry_delay_minutes` int NOT NULL DEFAULT 60,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updatedBy` varchar(255)
);

-- Insert default settings if not exists
INSERT INTO `notification_settings` (
  `expiration_reminder_enabled`,
  `expiration_reminder_days`,
  `expired_notification_enabled`,
  `email_from`,
  `support_email`,
  `max_retries_on_failure`,
  `retry_delay_minutes`
) SELECT 
  true,
  7,
  true,
  'noreply@digilearn.manus.space',
  'support@digilearn.manus.space',
  3,
  60
WHERE NOT EXISTS (SELECT 1 FROM `notification_settings` LIMIT 1);
