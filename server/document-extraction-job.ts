import { getDb } from "./db";
import { extractDocumentContent, sanitizeExtractedText } from "./document-extraction";
import * as fs from "fs";
import * as path from "path";
import { sql } from "drizzle-orm";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const EXTRACTION_INTERVAL = 30000; // Run every 30 seconds
let isRunning = false;

/**
 * Start the document extraction job
 */
export function startDocumentExtractionJob() {
  console.log("Starting document extraction job...");

  // Run immediately on startup
  processDocuments().catch((error) => {
    console.error("Error in document extraction job:", error);
  });

  // Then run periodically
  setInterval(() => {
    if (!isRunning) {
      processDocuments().catch((error) => {
        console.error("Error in document extraction job:", error);
      });
    }
  }, EXTRACTION_INTERVAL);
}

/**
 * Process all pending documents
 */
async function processDocuments() {
  if (isRunning) {
    console.log("Document extraction job already running, skipping...");
    return;
  }

  isRunning = true;

  try {
    const db = await getDb();
    if (!db) {
      console.log("Database not available");
      isRunning = false;
      return;
    }

    // Get all documents with pending extraction status
    const pendingDocuments = await db.execute(
      sql`SELECT id, fileName, fileKey, extractionStatus, fileType FROM studio_documents WHERE extractionStatus = 'pending' LIMIT 10`
    );

    // Normalize result to handle different formats from MySQL/TiDB
    let docs: any[] = [];
    if (Array.isArray(pendingDocuments)) {
      // If it's an array with 2 elements and first is array (mysql2 format)
      if (pendingDocuments.length === 2 && Array.isArray(pendingDocuments[0])) {
        docs = pendingDocuments[0];
      } else {
        docs = pendingDocuments;
      }
    }

    if (!docs || docs.length === 0) {
      console.log("No pending documents to process");
      isRunning = false;
      return;
    }

    console.log(`Processing ${docs.length} pending documents...`);

    for (const doc of docs as any[]) {
      try {
        await processDocument(doc);
      } catch (error) {
        console.error(`Error processing document ${doc.id}:`, error);
        // Mark as failed
        await db.execute(
          sql`UPDATE studio_documents SET extractionStatus = 'failed' WHERE id = ${doc.id}`
        );
      }
    }
  } catch (error) {
    console.error("Error in document extraction job:", error);
  } finally {
    isRunning = false;
  }
}

/**
 * Process a single document
 */
async function processDocument(doc: any) {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  // Validate document has required fields
  if (!doc.id || !doc.fileKey || !doc.fileName) {
    console.warn(`Invalid document: missing required fields`, doc);
    return;
  }

  console.log(`Processing document: ${doc.fileName}`);

  // Construct file path
  const filePath = path.join(UPLOAD_DIR, doc.fileKey);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    await db.execute(
      sql`UPDATE studio_documents SET extractionStatus = 'failed' WHERE id = ${doc.id}`
    );
    return;
  }

  // Extract content
  // Map fileType to MIME type
  const mimeTypeMap: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
  };
  const mimeType = mimeTypeMap[doc.fileType] || "application/octet-stream";
  const content = await extractDocumentContent(filePath, mimeType);
  const sanitized = sanitizeExtractedText(content);

  // Update document with extracted content
  try {
    await db.execute(
      sql`UPDATE studio_documents SET extractionStatus = 'extracted', extractedContent = ${sanitized} WHERE id = ${doc.id}`
    );
  } catch (error) {
    console.error(`Error updating document ${doc.id}:`, error);
    throw error;
  }

  console.log(`Document ${doc.id} extraction completed (${sanitized.length} chars)`);
}

/**
 * Stop the document extraction job
 */
export function stopDocumentExtractionJob() {
  console.log("Stopping document extraction job...");
  // The interval will continue running, but we can add cleanup logic here if needed
}
