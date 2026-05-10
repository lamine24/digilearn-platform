import fs from "fs";
import path from "path";
import { getDb } from "./db";
import { extractDocumentContent } from "./document-extraction";
import { updateDocumentExtraction } from "./studio-db";
import { storageGetSignedUrl } from "./storage";
import os from "os";

const TEMP_DIR = path.join(os.tmpdir(), "digilearn-extraction");

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

let isRunning = false;

/**
 * Start the document extraction job
 */
export function startDocumentExtractionJob() {
  console.log("Starting document extraction job...");

  // Run immediately on startup
  processDocuments().catch((err) => {
    console.error("Error in initial document processing:", err);
  });

  // Then run every 30 seconds
  setInterval(() => {
    if (isRunning) {
      console.log("Extraction job already running, skipping this cycle");
      return;
    }
    processDocuments().catch((err) => {
      console.error("Error in document processing:", err);
    });
  }, 30000);
}

/**
 * Process all pending documents
 */
async function processDocuments() {
  if (isRunning) {
    return;
  }

  isRunning = true;

  try {
    const db = await getDb();
    if (!db) {
      console.error("Database not available");
      return;
    }

    // Get pending documents
    const result = await db.execute(
      "SELECT * FROM studio_documents WHERE extractionStatus = 'pending' LIMIT 10"
    );

    const rows = (result as any)[0] as any[];
    if (!rows || rows.length === 0) {
      console.log("No pending documents to process");
      return;
    }

    console.log(`Processing ${rows.length} pending documents...`);

    for (const doc of rows) {
      await processDocument(doc);
    }
  } catch (error) {
    console.error("Error processing documents:", error);
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
  if (!doc.id || !doc.fileName) {
    console.warn(`Invalid document: missing required fields`, doc);
    return;
  }

  // Check if document has either fileUrl or fileKey
  if (!doc.fileUrl && !doc.fileKey) {
    console.warn(`Invalid document: missing both fileUrl and fileKey`, doc);
    return;
  }

  console.log(`Processing document: ${doc.fileName}`);

  let filePath: string | null = null;

  try {
    // Determine download URL based on available fields
    let downloadUrl: string;

    if (doc.fileKey) {
      // Use fileKey to get signed URL from Forge
      console.log(`Getting signed URL for fileKey: ${doc.fileKey}`);
      try {
        downloadUrl = await storageGetSignedUrl(doc.fileKey);
        console.log(`Got signed URL for file`);
      } catch (signError) {
        console.error(`Error getting signed URL for ${doc.fileKey}:`, signError);
        throw new Error(`Failed to get signed URL: ${(signError as Error).message}`);
      }
    } else {
      throw new Error('Document has no fileKey');
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
    console.log(`Downloaded file: ${doc.fileName} -> ${filePath}`);

    // Determine MIME type from fileType
    const mimeType = getMimeType(doc.fileType);
    
    // Extract content from file
    console.log(`Extracting content from: ${doc.fileName}`);
    const extractedContent = await extractDocumentContent(filePath, mimeType);
    console.log(`Extracted ${extractedContent.length} characters from ${doc.fileName}`);

    // Update document with extracted content
    await updateDocumentExtraction(doc.id, extractedContent, "completed");
    console.log(`Successfully updated document ${doc.id} with extracted content`);
  } catch (error) {
    console.error(`Error processing document ${doc.id}:`, error);
    await updateDocumentExtraction(doc.id, "", "failed");
  } finally {
    // Clean up temp file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up temp file: ${filePath}`);
      } catch (err) {
        console.error(`Error cleaning up temp file ${filePath}:`, err);
      }
    }
  }
}

/**
 * Get MIME type from file extension
 */
function getMimeType(fileType: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
  };
  return mimeTypes[fileType.toLowerCase()] || "application/octet-stream";
}
