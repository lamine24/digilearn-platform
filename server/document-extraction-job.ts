import fs from "fs";
import path from "path";
import { getDb } from "./db";
import { extractDocumentContent } from "./document-extraction";
import { updateDocumentExtraction } from "./studio-db";
import { storageGetSignedUrl } from "./storage";
import { ENV } from "./_core/env";
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
 * Process a single document with primary and fallback methods
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
    // Try primary method: download from signed URL
    console.log(`[Primary Method] Attempting to download file via signed URL`);
    try {
      filePath = await downloadFileViaPrimaryMethod(doc);
      if (filePath) {
        console.log(`[Primary Method] Success: Downloaded file to ${filePath}`);
      }
    } catch (primaryError) {
      console.warn(`[Primary Method] Failed: ${(primaryError as Error).message}`);
      console.log(`[Fallback Method] Attempting to extract via Manus API`);
      
      // Try fallback method: use Manus API
      try {
        filePath = await downloadFileViaManusAPI(doc);
        if (filePath) {
          console.log(`[Fallback Method] Success: Downloaded file to ${filePath}`);
        }
      } catch (fallbackError) {
        console.error(`[Fallback Method] Failed: ${(fallbackError as Error).message}`);
        throw new Error(
          `Both extraction methods failed. Primary: ${(primaryError as Error).message}, Fallback: ${(fallbackError as Error).message}`
        );
      }
    }

    if (!filePath) {
      throw new Error("Failed to download file with both methods");
    }

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
 * Primary method: Download file via signed URL from Forge
 */
async function downloadFileViaPrimaryMethod(doc: any): Promise<string | null> {
  if (!doc.fileKey) {
    throw new Error("Document has no fileKey for primary method");
  }

  // Get signed URL from Forge
  console.log(`Getting signed URL for fileKey: ${doc.fileKey}`);
  let downloadUrl: string;
  try {
    downloadUrl = await storageGetSignedUrl(doc.fileKey);
    console.log(`Got signed URL for file`);
  } catch (signError) {
    throw new Error(`Failed to get signed URL: ${(signError as Error).message}`);
  }

  console.log(`Resolved download URL (truncated): ${downloadUrl.substring(0, 100)}...`);

  // Download file from signed URL
  let response: Response;
  try {
    response = await fetch(downloadUrl, {
      timeout: 30000, // 30 second timeout
    } as any);
  } catch (fetchError) {
    throw new Error(`Failed to fetch from storage: ${(fetchError as Error).message}`);
  }

  if (!response.ok) {
    const responseText = await response.text().catch(() => "<no response body>");
    throw new Error(
      `Failed to download file from storage: ${response.status} ${response.statusText}`
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const filePath = path.join(TEMP_DIR, `${doc.id}-${Date.now()}-${doc.fileName}`);
  fs.writeFileSync(filePath, buffer);
  console.log(`Downloaded file via primary method: ${filePath}`);

  return filePath;
}

/**
 * Fallback method: Download file via manus-storage proxy endpoint
 */
async function downloadFileViaManusAPI(doc: any): Promise<string | null> {
  if (!doc.fileKey) {
    throw new Error("Document has no fileKey for fallback method");
  }

  // Use the manus-storage proxy endpoint which handles S3 access internally
  console.log(`Using manus-storage proxy endpoint to retrieve file: ${doc.fileKey}`);

  const publicDomain = process.env.PUBLIC_DOMAIN || 'https://3000-ipcgfpgxsajtw7hxkpldt-b2e5a23c.us2.manus.computer';
  const downloadUrl = `${publicDomain}/manus-storage/${doc.fileKey}`;

  console.log(`Fallback download URL: ${downloadUrl}`);

  let response: Response;
  try {
    response = await fetch(downloadUrl, {
      timeout: 30000, // 30 second timeout
      // Follow redirects automatically
      redirect: 'follow',
    } as any);
  } catch (fetchError) {
    throw new Error(
      `Failed to fetch from manus-storage proxy: ${(fetchError as Error).message}`
    );
  }

  if (!response.ok) {
    const responseText = await response.text().catch(() => "<no response body>");
    throw new Error(
      `manus-storage proxy returned error: ${response.status} ${response.statusText}`
    );
  }

  // Get file content from response
  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length === 0) {
    throw new Error("manus-storage proxy returned empty file content");
  }

  const filePath = path.join(TEMP_DIR, `${doc.id}-${Date.now()}-${doc.fileName}`);
  fs.writeFileSync(filePath, buffer);
  console.log(`Downloaded file via manus-storage proxy fallback: ${filePath}`);

  return filePath;
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
