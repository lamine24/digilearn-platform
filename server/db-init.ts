import { getDb } from "./db";
import { seedExternalCourses } from "./seed-external-courses";

/**
 * Initialize database tables if they don't exist
 */
export async function initializeDatabaseTables() {
  const db = await getDb();
  if (!db) return false;

  try {
    // Create external_courses table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS external_courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        slug VARCHAR(500) NOT NULL UNIQUE,
        description TEXT,
        shortDescription TEXT,
        thumbnailUrl TEXT,
        externalUrl TEXT NOT NULL,
        source ENUM('udemy','coursera','youtube','other') NOT NULL,
        categoryId INT,
        level ENUM('debutant','intermediaire','avance') NOT NULL DEFAULT 'debutant',
        duration INT DEFAULT 0,
        instructor VARCHAR(255),
        rating DECIMAL(3,1) DEFAULT 0.0,
        enrollmentCount INT DEFAULT 0,
        requiresSubscription BOOLEAN NOT NULL DEFAULT true,
        isActive BOOLEAN NOT NULL DEFAULT true,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create subscriptions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        planType ENUM('monthly','yearly','lifetime') NOT NULL DEFAULT 'monthly',
        price DECIMAL(10,2) NOT NULL,
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
    
    // Seed sample data
    await seedExternalCourses();
    
    return true;
  } catch (error) {
    console.error("[DB Init] Error initializing tables:", error);
    return false;
  }
}
