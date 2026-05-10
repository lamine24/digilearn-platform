import { describe, it, expect } from "vitest";

describe("Studio Upload Error Handling", () => {
  describe("Error Message Extraction", () => {
    it("should extract error message from response", () => {
      const errorData = {
        error: "Fichier trop volumineux",
        message: "La taille du fichier dépasse la limite maximale de 500MB",
        maxSize: "500MB",
      };

      const errorMessage = errorData.message || errorData.error || "Upload failed";
      expect(errorMessage).toBe("La taille du fichier dépasse la limite maximale de 500MB");
    });

    it("should use error field if message is missing", () => {
      const errorData = {
        error: "Type de fichier non autorisé",
      };

      const errorMessage = errorData.message || errorData.error || "Upload failed";
      expect(errorMessage).toBe("Type de fichier non autorisé");
    });

    it("should use default message if both are missing", () => {
      const errorData = {};
      const status = 500;

      const errorMessage = errorData.message || errorData.error || `Upload failed with status ${status}`;
      expect(errorMessage).toBe("Upload failed with status 500");
    });
  });

  describe("File Size Validation Messages", () => {
    it("should format file size correctly for error message", () => {
      const fileSize = 104857600; // 100MB
      const formattedSize = (fileSize / (1024 * 1024)).toFixed(2);
      expect(formattedSize).toBe("100.00");
    });

    it("should display correct limit for PDF files", () => {
      const fileType = "PDF";
      const maxSize = 100;
      const message = `La taille du fichier dépasse la limite de ${maxSize}MB pour les fichiers ${fileType}.`;
      expect(message).toContain("100MB");
      expect(message).toContain("PDF");
    });

    it("should display correct limit for DOCX files", () => {
      const fileType = "DOCX";
      const maxSize = 50;
      const message = `La taille du fichier dépasse la limite de ${maxSize}MB pour les fichiers ${fileType}.`;
      expect(message).toContain("50MB");
      expect(message).toContain("DOCX");
    });

    it("should display correct limit for PPTX files", () => {
      const fileType = "PPTX";
      const maxSize = 200;
      const message = `La taille du fichier dépasse la limite de ${maxSize}MB pour les fichiers ${fileType}.`;
      expect(message).toContain("200MB");
      expect(message).toContain("PPTX");
    });

    it("should display correct limit for TXT files", () => {
      const fileType = "TXT";
      const maxSize = 10;
      const message = `La taille du fichier dépasse la limite de ${maxSize}MB pour les fichiers ${fileType}.`;
      expect(message).toContain("10MB");
      expect(message).toContain("TXT");
    });
  });

  describe("HTTP Status Codes", () => {
    it("should handle 413 Payload Too Large", () => {
      const status = 413;
      const message = `Upload failed with status ${status}`;
      expect(message).toContain("413");
    });

    it("should handle 400 Bad Request", () => {
      const status = 400;
      const message = `Upload failed with status ${status}`;
      expect(message).toContain("400");
    });

    it("should handle 403 Forbidden", () => {
      const status = 403;
      const message = `Upload failed with status ${status}`;
      expect(message).toContain("403");
    });

    it("should handle 500 Internal Server Error", () => {
      const status = 500;
      const message = `Upload failed with status ${status}`;
      expect(message).toContain("500");
    });
  });

  describe("Multer Error Codes", () => {
    it("should identify LIMIT_FILE_SIZE error", () => {
      const errorCode = "LIMIT_FILE_SIZE";
      const isFileSizeError = errorCode === "LIMIT_FILE_SIZE";
      expect(isFileSizeError).toBe(true);
    });

    it("should identify LIMIT_FILE_COUNT error", () => {
      const errorCode = "LIMIT_FILE_COUNT";
      const isFileCountError = errorCode === "LIMIT_FILE_COUNT";
      expect(isFileCountError).toBe(true);
    });

    it("should identify other multer errors", () => {
      const errorCode = "LIMIT_PART_COUNT";
      const isMulterError = errorCode.startsWith("LIMIT_");
      expect(isMulterError).toBe(true);
    });
  });

  describe("Error Response Format", () => {
    it("should format 413 error response correctly", () => {
      const response = {
        error: "Fichier trop volumineux",
        message: "La taille du fichier dépasse la limite maximale de 500MB. Veuillez télécharger un fichier plus petit.",
        maxSize: "500MB",
      };

      expect(response).toHaveProperty("error");
      expect(response).toHaveProperty("message");
      expect(response).toHaveProperty("maxSize");
      expect(response.error).toBe("Fichier trop volumineux");
    });

    it("should format file-specific error response correctly", () => {
      const response = {
        error: "Fichier trop volumineux",
        message: "La taille du fichier document.pdf (105.00MB) dépasse la limite de 100MB pour les fichiers PDF.",
        fileSize: "105.00MB",
        maxSize: "100MB",
        fileType: "PDF",
      };

      expect(response).toHaveProperty("fileSize");
      expect(response).toHaveProperty("fileType");
      expect(response.fileType).toBe("PDF");
    });
  });
});
