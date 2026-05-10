import { getDb } from "./db";
import { extractDocumentContent, sanitizeExtractedText } from "./document-extraction";
import { storageGetSignedUrl } from "./storage";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { sql } from "drizzle-orm";

const TEMP_DIR = path.join(os.tmpdir(), "digilearn-extraction");
const EXTRACTION_INTERVAL = 30000; // Run every 30 seconds
let isRunning = false;

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

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
      console.error("Database not available");
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
        try {
          const db = await getDb();
          if (db) {
            await db.execute(
              sql`UPDATE studio_documents SET extractionStatus = 'failed' WHERE id = ${doc.id}`
            );
          }
        } catch (updateError) {
          console.error(`Error marking document as failed:`, updateError);
        }
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
  if (!doc.id || !doc.fileUrl || !doc.fileName) {
    console.warn(`Invalid document: missing required fields`, doc);
    return;
  }

  console.log(`Processing document: ${doc.fileName}`);

  let filePath: string | null = null;

  try {
    // Download file from Manus storage URL
    console.log(`Downloading file from storage: ${doc.fileUrl}`);
    let downloadUrl: string;
    
    // If fileUrl is relative, make it absolute using the public domain
    if (doc.fileUrl.startsWith('/')) {
      // Use the public domain to download
      const publicDomain = process.env.PUBLIC_DOMAIN || 'https://3000-ipcgfpgxsajtw7hxkpldt-b2e5a23c.us2.manus.computer';
      downloadUrl = `${publicDomain}${doc.fileUrl}`;
    } else {
      downloadUrl = doc.fileUrl;
    }
    
    console.log(`Resolved download URL: ${downloadUrl}`);
    
    let response: Response;
    try {
      response = await fetch(downloadUrl);
    } catch (fetchError) {
      console.error(`Error fetching from storage URL:`, fetchError);
      throw new Error(`Failed to fetch from storage: ${(fetchError as Error).message}`);
    }

    if (!response.ok) {
      const responseText = await response.text().catch(() => "<no response body>");
      console.error(`Storage response error: status=${response.status}, statusText=${response.statusText}, body=${responseText}`);
      throw new Error(`Failed to download file from storage: ${response.status} ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    filePath = path.join(TEMP_DIR, `${doc.id}-${Date.now()}-${doc.fileName}`);
    fs.writeFileSync(filePath, buffer);
    console.log(`Downloaded file from S3: ${doc.fileKey} -> ${filePath}`);

    // Extract content
    // Map fileType to MIME type
    const mimeTypeMap: Record<string, string> = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      txt: "text/plain",
    };
    const mimeType = mimeTypeMap[doc.fileType?.toLowerCase() || ""] || "application/octet-stream";

    let content: string;
    try {
      content = await extractDocumentContent(filePath, mimeType);
    } catch (error) {
      console.error(`Error extracting content from ${filePath}:`, error);
      throw error;
    }

    const sanitized = sanitizeExtractedText(content);

    // Update document with extracted content
    try {
      await db.execute(
        sql`UPDATE studio_documents SET extractionStatus = 'extracted', extractedContent = ${sanitized} WHERE id = ${doc.id}`
      );
      console.log(`Successfully updated document ${doc.id} with extracted content (${sanitized.length} chars)`);
    } catch (error) {
      console.error(`Error updating document ${doc.id}:`, error);
      throw error;
    }
  } catch (error) {
    console.error(`Error processing document ${doc.id}:`, error);
    // Mark as failed
    try {
      await db.execute(
        sql`UPDATE studio_documents SET extractionStatus = 'failed' WHERE id = ${doc.id}`
      );
    } catch (updateError) {
      console.error(`Error marking document as failed:`, updateError);
    }
  } finally {
    // Clean up temp file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up temp file: ${filePath}`);
      } catch (error) {
        console.warn(`Failed to clean up temp file: ${filePath}`, error);
      }
    }
  }
}
