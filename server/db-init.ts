import { getDb } from "./db";
import { seedFreeResources } from "./seed-free-resources";

/**
 * Initialize database tables if they don't exist
 */
export async function initializeDatabaseTables() {
  const db = await getDb();
  if (!db) return false;

  try {
    // Create premium_subscriptions table (10,000 FCFA/month)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS premium_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL UNIQUE,
        price DECIMAL(10,2) NOT NULL DEFAULT 10000.00,
        currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
        startDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        endDate TIMESTAMP,
        status ENUM('active','cancelled','expired') NOT NULL DEFAULT 'active',
        paymentId VARCHAR(255),
        autoRenew BOOLEAN NOT NULL DEFAULT true,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("[DB Init] Tables initialized successfully");
    
    // Initialize free resources table
    await initializeFreeResourcesTable();
    
    // Seed sample data
    await seedFreeResources();
    
    return true;
  } catch (error) {
    console.error("[DB Init] Error initializing tables:", error);
    return false;
  }
}


// Create free_resources table if not exists
async function initializeFreeResourcesTable() {
  const db = await getDb();
  if (!db) return;

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS free_resources (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        slug VARCHAR(500) NOT NULL UNIQUE,
        description TEXT,
        shortDescription TEXT,
        thumbnailUrl TEXT,
        externalUrl TEXT NOT NULL,
        platform ENUM('khan_academy','mit_ocw','statlearning','open_learning_campus','canal_u','other') NOT NULL,
        category VARCHAR(255),
        level ENUM('debutant','intermediaire','avance') NOT NULL DEFAULT 'debutant',
        duration INT,
        language VARCHAR(10) NOT NULL DEFAULT 'fr',
        tags TEXT,
        rating DECIMAL(3,2) DEFAULT 0,
        enrollmentCount INT DEFAULT 0,
        isActive BOOLEAN NOT NULL DEFAULT true,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("[DB Init] Free resources table initialized successfully");
  } catch (error: any) {
    if (error.code !== "ER_TABLE_EXISTS_ERROR") {
      console.error("[DB Init] Error creating free_resources table:", error.message);
    }
  }
}
