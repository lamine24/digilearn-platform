import * as fs from "fs";
import * as path from "path";
import * as pdfParse from "pdf-parse";

/**
 * Extract text content from a document based on its file type
 */
export async function extractDocumentContent(
  filePath: string,
  mimeType: string
): Promise<string> {
  try {
    // Ensure file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Extract based on MIME type
    if (mimeType === "application/pdf") {
      return await extractPdfContent(fileBuffer);
    } else if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return await extractDocxContent(fileBuffer);
    } else if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ) {
      return await extractPptxContent(fileBuffer);
    } else if (mimeType === "text/plain") {
      return fileBuffer.toString("utf-8");
    } else {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error(`Error extracting content from ${filePath}:`, error);
    throw error;
  }
}

/**
 * Extract text from PDF files
 */
async function extractPdfContent(buffer: Buffer): Promise<string> {
  try {
    const data = await (pdfParse as any).default(buffer);
    return data.text;
  } catch (error) {
    console.error("Error extracting PDF content:", error);
    throw new Error("Failed to extract PDF content");
  }
}

/**
 * Extract text from DOCX files
 */
async function extractDocxContent(buffer: Buffer): Promise<string> {
  try {
    // For DOCX, we need to use a different approach
    // DOCX files are ZIP archives containing XML files
    // We'll use a simple approach to extract text from the document.xml
    const JSZip = require("jszip");
    const zip = new JSZip();
    await zip.loadAsync(buffer);

    // Get the document.xml file
    const docXml = await zip.file("word/document.xml")?.async("string");
    if (!docXml) {
      throw new Error("document.xml not found in DOCX file");
    }

    // Extract text from XML (simple regex approach)
    // Remove XML tags and extract text content
    const text = docXml
      .replace(/<[^>]*>/g, " ") // Remove XML tags
      .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
      .replace(/&lt;/g, "<") // Decode HTML entities
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ") // Collapse multiple spaces
      .trim();

    return text;
  } catch (error) {
    console.error("Error extracting DOCX content:", error);
    throw new Error("Failed to extract DOCX content");
  }
}

/**
 * Extract text from PPTX files
 */
async function extractPptxContent(buffer: Buffer): Promise<string> {
  try {
    // PPTX files are also ZIP archives
    const JSZip = require("jszip");
    const zip = new JSZip();
    await zip.loadAsync(buffer);

    let allText = "";

    // Iterate through all slide XML files
    for (const [fileName, file] of Object.entries(zip.files)) {
      if (
        fileName.startsWith("ppt/slides/slide") &&
        fileName.endsWith(".xml")
      ) {
        const slideXml = await (file as any).async("string");

        // Extract text from slide XML
        const text = slideXml
          .replace(/<[^>]*>/g, " ") // Remove XML tags
          .replace(/&nbsp;/g, " ")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/\s+/g, " ")
          .trim();

        if (text) {
          allText += text + "\n";
        }
      }
    }

    return allText.trim();
  } catch (error) {
    console.error("Error extracting PPTX content:", error);
    throw new Error("Failed to extract PPTX content");
  }
}

/**
 * Sanitize extracted text for storage
 */
export function sanitizeExtractedText(text: string): string {
  return text
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .trim()
    .substring(0, 10000); // Limit to 10000 characters
}
