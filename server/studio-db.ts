import { getDb } from "./db";
import { sql } from "drizzle-orm";

// ==================== STUDIO PROJECTS ====================

export async function createStudioProject(data: {
  userId: number;
  title: string;
  description?: string;
  slug: string;
  pedagogicalModel?: "bloom" | "addie" | "gagne";
  targetAudience?: string;
  estimatedDuration?: number;
  language?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`INSERT INTO studio_projects (userId, title, description, slug, pedagogicalModel, targetAudience, estimatedDuration, language)
        VALUES (${data.userId}, ${data.title}, ${data.description || null}, ${data.slug}, ${data.pedagogicalModel || "addie"}, ${data.targetAudience || null}, ${data.estimatedDuration || null}, ${data.language || "fr"})`
  );
  return result;
}

export async function getUserStudioProjects(userId: number, options?: { limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const limit = Math.min(options?.limit || 50, 100);
  const offset = options?.offset || 0;
  
  const result = await db.execute(
    sql`SELECT id, userId, title, description, slug, pedagogicalModel, status, targetAudience, estimatedDuration, language, createdAt, updatedAt FROM studio_projects WHERE userId = ${userId} ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${offset}`
  );
  
  if (!result || !Array.isArray(result)) return [];
  return result.filter((item: any) => item && typeof item.id === "number");
}

export async function getUserStudioProjectsCount(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`SELECT COUNT(*) as count FROM studio_projects WHERE userId = ${userId}`
  );
  
  return (result as any)?.[0]?.count || 0;
}

export async function getStudioProjectBySlug(slug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`SELECT * FROM studio_projects WHERE slug = ${slug} LIMIT 1`
  );
  return result?.[0] || null;
}

export async function updateStudioProject(
  projectId: number,
  data: Partial<{
    title: string;
    description: string;
    status: "draft" | "in_progress" | "completed" | "published";
    pedagogicalModel: "bloom" | "addie" | "gagne";
    targetAudience: string;
    estimatedDuration: number;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const updates = Object.entries(data)
    .map(([key, value]) => `${key} = ${typeof value === "string" ? `'${value}'` : value}`)
    .join(", ");

  const result = await db.execute(
    sql.raw(`UPDATE studio_projects SET ${updates}, updatedAt = NOW() WHERE id = ${projectId}`)
  );
  return result;
}

export async function deleteStudioProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`DELETE FROM studio_projects WHERE id = ${projectId}`
  );
  return result;
}

// ==================== STUDIO DOCUMENTS ====================

export async function uploadDocument(data: {
  projectId: number;
  fileName: string;
  fileKey: string;
  fileUrl: string;
  fileType: "pdf" | "docx" | "pptx" | "txt";
  fileSize: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`INSERT INTO studio_documents (projectId, fileName, fileKey, fileUrl, fileType, fileSize, extractionStatus)
        VALUES (${data.projectId}, ${data.fileName}, ${data.fileKey}, ${data.fileUrl}, ${data.fileType}, ${data.fileSize}, 'pending')`
  );
  return result;
}

export async function getProjectDocuments(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`SELECT * FROM studio_documents WHERE projectId = ${projectId} ORDER BY createdAt DESC`
  );
  return result || [];
}

export async function updateDocumentExtraction(
  documentId: number,
  extractedContent: string,
  status: "pending" | "processing" | "completed" | "failed"
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`UPDATE studio_documents SET extractedContent = ${extractedContent}, extractionStatus = ${status}, updatedAt = NOW() WHERE id = ${documentId}`
  );
  return result;
}

// ==================== STUDIO SCENARIOS ====================

export async function createScenario(data: {
  projectId: number;
  documentId?: number;
  title: string;
  description?: string;
  learningObjectives?: any[];
  contentStructure?: any;
  interactiveElements?: any;
  generatedBy?: "mistral" | "claude" | "manual";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`INSERT INTO studio_scenarios (projectId, documentId, title, description, learningObjectives, contentStructure, interactiveElements, generatedBy, generationStatus)
        VALUES (${data.projectId}, ${data.documentId || null}, ${data.title}, ${data.description || null}, ${JSON.stringify(data.learningObjectives || [])}, ${JSON.stringify(data.contentStructure || {})}, ${JSON.stringify(data.interactiveElements || {})}, ${data.generatedBy || "manual"}, 'pending')`
  );
  return result;
}

export async function getProjectScenarios(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`SELECT * FROM studio_scenarios WHERE projectId = ${projectId} ORDER BY createdAt DESC`
  );
  return result || [];
}

export async function updateScenarioGeneration(
  scenarioId: number,
  data: {
    learningObjectives?: any[];
    contentStructure?: any;
    interactiveElements?: any;
    generationStatus: "pending" | "processing" | "completed" | "failed";
    generatedAt?: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql.raw(`UPDATE studio_scenarios SET 
      learningObjectives = '${JSON.stringify(data.learningObjectives || [])}',
      contentStructure = '${JSON.stringify(data.contentStructure || {})}',
      interactiveElements = '${JSON.stringify(data.interactiveElements || {})}',
      generationStatus = '${data.generationStatus}',
      generatedAt = ${data.generatedAt ? `'${data.generatedAt.toISOString()}'` : "NOW()"},
      updatedAt = NOW()
      WHERE id = ${scenarioId}`)
  );
  return result;
}

// ==================== STUDIO CAPSULES ====================

export async function createCapsule(data: {
  projectId: number;
  scenarioId: number;
  title: string;
  description?: string;
  narrationText?: string;
  generatedBy?: "reemotion" | "motion_canvas" | "manual";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`INSERT INTO studio_capsules (projectId, scenarioId, title, description, narrationText, generatedBy, videoStatus)
        VALUES (${data.projectId}, ${data.scenarioId}, ${data.title}, ${data.description || null}, ${data.narrationText || null}, ${data.generatedBy || "manual"}, 'pending')`
  );
  return result;
}

export async function getScenarioCapsules(scenarioId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`SELECT * FROM studio_capsules WHERE scenarioId = ${scenarioId} ORDER BY createdAt DESC`
  );
  return result || [];
}

export async function updateCapsuleVideo(
  capsuleId: number,
  data: {
    videoKey?: string;
    videoUrl?: string;
    videoStatus: "pending" | "processing" | "completed" | "failed";
    duration?: number;
    narrationUrl?: string;
    generatedAt?: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const updates = [];
  if (data.videoKey) updates.push(`videoKey = '${data.videoKey}'`);
  if (data.videoUrl) updates.push(`videoUrl = '${data.videoUrl}'`);
  if (data.duration) updates.push(`duration = ${data.duration}`);
  if (data.narrationUrl) updates.push(`narrationUrl = '${data.narrationUrl}'`);
  updates.push(`videoStatus = '${data.videoStatus}'`);
  updates.push(`generatedAt = ${data.generatedAt ? `'${data.generatedAt.toISOString()}'` : "NOW()"}`);
  updates.push(`updatedAt = NOW()`);

  const result = await db.execute(
    sql.raw(`UPDATE studio_capsules SET ${updates.join(", ")} WHERE id = ${capsuleId}`)
  );
  return result;
}

// ==================== STUDIO H5P ELEMENTS ====================

export async function createH5PElement(data: {
  projectId: number;
  capsuleId?: number;
  type: string;
  title: string;
  description?: string;
  h5pContent?: any;
  h5pId?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`INSERT INTO studio_h5p_elements (projectId, capsuleId, type, title, description, h5pContent, h5pId)
        VALUES (${data.projectId}, ${data.capsuleId || null}, ${data.type}, ${data.title}, ${data.description || null}, ${JSON.stringify(data.h5pContent || {})}, ${data.h5pId || null})`
  );
  return result;
}

export async function getProjectH5PElements(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`SELECT * FROM studio_h5p_elements WHERE projectId = ${projectId} ORDER BY createdAt DESC`
  );
  return result || [];
}

// ==================== STUDIO EXPORTS ====================

export async function createExport(data: {
  projectId: number;
  exportType: "scorm_1_2" | "scorm_2004" | "xapi_cmi5" | "lti_1_3";
  exportKey: string;
  exportUrl: string;
  metadata?: any;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`INSERT INTO studio_exports (projectId, exportType, exportKey, exportUrl, metadata, exportStatus)
        VALUES (${data.projectId}, ${data.exportType}, ${data.exportKey}, ${data.exportUrl}, ${JSON.stringify(data.metadata || {})}, 'pending')`
  );
  return result;
}

export async function getProjectExports(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`SELECT * FROM studio_exports WHERE projectId = ${projectId} ORDER BY createdAt DESC`
  );
  return result || [];
}

export async function updateExportStatus(
  exportId: number,
  status: "pending" | "processing" | "completed" | "failed",
  exportedAt?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`UPDATE studio_exports SET exportStatus = ${status}, exportedAt = ${exportedAt ? exportedAt.toISOString() : sql`NOW()`}, updatedAt = NOW() WHERE id = ${exportId}`
  );
  return result;
}

// ==================== STUDIO MARKETPLACE ====================

export async function createMarketplaceListing(data: {
  projectId: number;
  userId: number;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  price?: number;
  revenueShare?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`INSERT INTO studio_marketplace_listings (projectId, userId, title, description, thumbnailUrl, price, revenueShare, status)
        VALUES (${data.projectId}, ${data.userId}, ${data.title}, ${data.description || null}, ${data.thumbnailUrl || null}, ${data.price || 0}, ${data.revenueShare || 70}, 'draft')`
  );
  return result;
}

export async function getPublishedListings(limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`SELECT * FROM studio_marketplace_listings WHERE status = 'published' ORDER BY publishedAt DESC LIMIT ${limit} OFFSET ${offset}`
  );
  return result || [];
}

export async function getUserListings(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`SELECT * FROM studio_marketplace_listings WHERE userId = ${userId} ORDER BY createdAt DESC`
  );
  return result || [];
}

export async function publishListing(listingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  await db.execute(
    sql`UPDATE studio_marketplace_listings SET status = 'published', publishedAt = NOW(), updatedAt = NOW() WHERE id = ${listingId}`
  );
  return { success: true };
}

// ==================== STUDIO PROJECT ACCESS ====================

export async function grantProjectAccess(
  projectId: number,
  userId: number,
  accessLevel: "view" | "edit" | "admin" = "view"
) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`INSERT INTO studio_project_access (projectId, userId, accessLevel) VALUES (${projectId}, ${userId}, ${accessLevel}) 
        ON DUPLICATE KEY UPDATE accessLevel = ${accessLevel}, grantedAt = NOW()`
  );
  return result;
}

export async function getProjectAccess(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`SELECT * FROM studio_project_access WHERE projectId = ${projectId}`
  );
  return result || [];
}

export async function checkProjectAccess(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.execute(
    sql`SELECT * FROM studio_project_access WHERE projectId = ${projectId} AND userId = ${userId} LIMIT 1`
  );
  return result?.[0] || null;
}
