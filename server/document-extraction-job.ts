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

// Track retry attempts per document
const retryAttempts = new Map<number, { count: number; lastAttempt: number }>();
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 5000; // 5 seconds
const MAX_RETRY_DELAY = 300000; // 5 minutes

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
 * Calculate exponential backoff delay
 */
function getRetryDelay(attemptCount: number): number {
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, attemptCount - 1);
  return Math.min(delay, MAX_RETRY_DELAY);
}

/**
 * Check if document should be retried
 */
function shouldRetryDocument(docId: number): boolean {
  const retry = retryAttempts.get(docId);
  if (!retry) return true; // First attempt

  if (retry.count >= MAX_RETRIES) {
    console.log(
      `Document ${docId} has reached max retries (${MAX_RETRIES})`
    );
    return false;
  }

  const delay = getRetryDelay(retry.count);
  const timeSinceLastAttempt = Date.now() - retry.lastAttempt;

  if (timeSinceLastAttempt < delay) {
    console.log(
      `Document ${docId} retry backoff: ${Math.ceil(
        (delay - timeSinceLastAttempt) / 1000
      )}s remaining`
    );
    return false;
  }

  return true;
}

/**
 * Update retry attempt for document
 */
function updateRetryAttempt(docId: number, success: boolean): void {
  if (success) {
    retryAttempts.delete(docId);
  } else {
    const retry = retryAttempts.get(docId) || { count: 0, lastAttempt: 0 };
    retry.count += 1;
    retry.lastAttempt = Date.now();
    retryAttempts.set(docId, retry);
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

  // Check if document should be retried
  if (!shouldRetryDocument(doc.id)) {
    return; // Skip this document for now, will retry later
  }

  console.log(`Processing document: ${doc.fileName}`);

  let filePath: string | null = null;

  try {
    // Try primary method: download from signed URL
    console.log(`[Primary Method] Attempting to download file via signed URL`);
    try {
      filePath = await downloadFileViaPrimaryMethod(doc);
      if (filePath) {
        console.log(
          `[Primary Method] Success: Downloaded file to ${filePath}`
        );
      }
    } catch (primaryError) {
      console.warn(
        `[Primary Method] Failed: ${(primaryError as Error).message}`
      );
      console.log(`[Fallback Method] Attempting to extract via manus-storage proxy`);

      // Try fallback method: use manus-storage proxy
      try {
        filePath = await downloadFileViaManusAPI(doc);
        if (filePath) {
          console.log(
            `[Fallback Method] Success: Downloaded file to ${filePath}`
          );
        }
      } catch (fallbackError) {
        console.error(
          `[Fallback Method] Failed: ${(fallbackError as Error).message}`
        );
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
    console.log(
      `Extracted ${extractedContent.length} characters from ${doc.fileName}`
    );

    // Update document with extracted content
    await updateDocumentExtraction(doc.id, extractedContent, "completed");
    console.log(
      `Successfully updated document ${doc.id} with extracted content`
    );

    // Mark as successful for retry tracking
    updateRetryAttempt(doc.id, true);
  } catch (error) {
    console.error(`Error processing document ${doc.id}:`, error);

    // Check if we should retry or mark as failed
    const retry = retryAttempts.get(doc.id) || {
      count: 0,
      lastAttempt: 0,
    };
    const nextRetryCount = retry.count + 1;

    if (nextRetryCount <= MAX_RETRIES) {
      console.log(
        `Marking document ${doc.id} for retry (attempt ${nextRetryCount}/${MAX_RETRIES})`
      );
      updateRetryAttempt(doc.id, false);
      // Keep status as 'pending' so it will be retried
    } else {
      console.log(
        `Document ${doc.id} exceeded max retries, marking as failed`
      );
      await updateDocumentExtraction(doc.id, "", "failed");
      retryAttempts.delete(doc.id);
    }
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
    throw new Error(
      `Failed to get signed URL: ${(signError as Error).message}`
    );
  }

  console.log(`Resolved download URL (truncated): ${downloadUrl.substring(0, 100)}...`);

  // Download file from signed URL
  let response: Response;
  try {
    response = await fetch(downloadUrl, {
      timeout: 30000, // 30 second timeout
    } as any);
  } catch (fetchError) {
    throw new Error(
      `Failed to fetch from storage: ${(fetchError as Error).message}`
    );
  }

  if (!response.ok) {
    const responseText = await response.text().catch(() => "<no response body>");
    throw new Error(
      `Failed to download file from storage: ${response.status} ${response.statusText}`
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const filePath = path.join(
    TEMP_DIR,
    `${doc.id}-${Date.now()}-${doc.fileName}`
  );
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
  console.log(
    `Using manus-storage proxy endpoint to retrieve file: ${doc.fileKey}`
  );

  const publicDomain =
    process.env.PUBLIC_DOMAIN ||
    "https://3000-ipcgfpgxsajtw7hxkpldt-b2e5a23c.us2.manus.computer";
  const downloadUrl = `${publicDomain}/manus-storage/${doc.fileKey}`;

  console.log(`Fallback download URL: ${downloadUrl}`);

  let response: Response;
  try {
    response = await fetch(downloadUrl, {
      timeout: 30000, // 30 second timeout
      // Follow redirects automatically
      redirect: "follow",
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

  const filePath = path.join(
    TEMP_DIR,
    `${doc.id}-${Date.now()}-${doc.fileName}`
  );
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
