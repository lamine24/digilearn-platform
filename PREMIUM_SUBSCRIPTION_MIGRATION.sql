-- Add isPremium field to users table
ALTER TABLE users ADD COLUMN isPremium BOOLEAN DEFAULT FALSE AFTER role;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  subscriptionType ENUM('monthly', 'quarterly', 'annual') NOT NULL DEFAULT 'monthly',
  status ENUM('active', 'cancelled', 'expired', 'pending') NOT NULL DEFAULT 'pending',
  startDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  endDate TIMESTAMP NULL,
  paymentId VARCHAR(255) UNIQUE,
  paymentStatus ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'XOF',
  paymentMethod VARCHAR(50),
  paytechTransactionId VARCHAR(255) UNIQUE,
  paytechReference VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_userId (userId),
  INDEX idx_status (status),
  INDEX idx_paytechTransactionId (paytechTransactionId)
);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('monthly', 'quarterly', 'annual') NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'XOF',
  durationDays INT NOT NULL,
  description TEXT,
  features JSON,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed subscription plans
INSERT INTO subscription_plans (name, type, price, currency, durationDays, description, features, isActive) VALUES
('Plan Mensuel', 'monthly', 9999, 'XOF', 30, 'Accès illimité aux ressources libres pour 1 mois', '["Accès complet aux ressources", "Support prioritaire", "Certificats"]', TRUE),
('Plan Trimestriel', 'quarterly', 24999, 'XOF', 90, 'Accès illimité aux ressources libres pour 3 mois', '["Accès complet aux ressources", "Support prioritaire", "Certificats", "Réductions spéciales"]', TRUE),
('Plan Annuel', 'annual', 79999, 'XOF', 365, 'Accès illimité aux ressources libres pour 1 an', '["Accès complet aux ressources", "Support VIP", "Certificats", "Réductions spéciales", "Accès anticipé aux nouveaux cours"]', TRUE);

-- Create resource_access table to track user access to premium resources
CREATE TABLE IF NOT EXISTS resource_access (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  resourceId INT NOT NULL,
  accessedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resourceId) REFERENCES free_resources(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_resource (userId, resourceId),
  INDEX idx_userId (userId),
  INDEX idx_resourceId (resourceId)
);
