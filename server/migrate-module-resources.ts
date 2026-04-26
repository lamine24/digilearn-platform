import { getDb } from "./db";

export async function migrateModuleResources() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  try {
    // Drop and recreate the table with correct schema
    await db.execute(`DROP TABLE IF EXISTS \`module_resources\``);
    
    await db.execute(`
      CREATE TABLE \`module_resources\` (
        \`id\` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
        \`moduleId\` int NOT NULL,
        \`title\` varchar(255) NOT NULL,
        \`description\` text,
        \`resourceType\` enum('video','pdf','document','image','audio','lien','autre') NOT NULL,
        \`fileUrl\` text,
        \`fileSize\` int DEFAULT NULL,
        \`mimeType\` varchar(100) DEFAULT NULL,
        \`sortOrder\` int NOT NULL DEFAULT 0,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (\`moduleId\`) REFERENCES \`modules\`(\`id\`) ON DELETE CASCADE
      )
    `);

    await db.execute(`CREATE INDEX \`idx_moduleId\` ON \`module_resources\`(\`moduleId\`)`);

    console.log("✅ module_resources table migrated successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateModuleResources().then(() => process.exit(0)).catch(() => process.exit(1));
}
