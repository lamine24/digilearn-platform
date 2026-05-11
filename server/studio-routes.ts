import { Express, Request, Response } from "express";
import multer from "multer";
import { storagePut } from "./storage";
import { sdk } from "./_core/sdk";
import { invokeLLM } from "./_core/llm";
import * as studioDb from "./studio-db";
import { generateScenarioWithPedagogicalModel } from "./scenario-generation";

// File size limits in bytes
const FILE_SIZE_LIMITS = {
  PDF: 100 * 1024 * 1024, // 100MB
  DOCX: 50 * 1024 * 1024, // 50MB
  PPTX: 200 * 1024 * 1024, // 200MB
  TXT: 10 * 1024 * 1024, // 10MB
};

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB absolute limit

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowedMimes: Record<string, string> = {
      "application/pdf": "PDF",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
      "text/plain": "TXT",
    };
    
    if (!allowedMimes[file.mimetype]) {
      return cb(new Error(`Type de fichier non autorisé: ${file.mimetype}. Formats acceptés: PDF, DOCX, PPTX, TXT`));
    }
    
    cb(null, true);
  },
});

async function getAuthenticatedUser(req: Request) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

export function setupStudioRoutes(app: Express) {
  // Error handler for multer
  const handleMulterError = (err: any, res: Response) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          error: "Fichier trop volumineux",
          message: `La taille du fichier dépasse la limite maximale de ${MAX_FILE_SIZE / (1024 * 1024)}MB. Veuillez télécharger un fichier plus petit.`,
          maxSize: `${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        });
      }
      if (err.code === "LIMIT_FILE_COUNT") {
        return res.status(400).json({
          error: "Trop de fichiers",
          message: "Un seul fichier peut être téléchargé à la fois.",
        });
      }
    }
    if (err instanceof Error) {
      return res.status(400).json({
        error: "Erreur de téléchargement",
        message: err.message,
      });
    }
    return res.status(500).json({
      error: "Erreur interne",
      message: "Une erreur est survenue lors du téléchargement.",
    });
  };

  // Upload document endpoint
  app.post("/api/studio/upload-document", upload.single("file"), async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user || (user.role !== "formateur" && user.role !== "admin")) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({
          error: "Aucun fichier fourni",
          message: "Veuillez sélectionner un fichier à télécharger.",
        });
      }

      // Validate file size based on type
      const fileType = req.file.mimetype.includes("pdf")
        ? "PDF"
        : req.file.mimetype.includes("word")
          ? "DOCX"
          : req.file.mimetype.includes("presentation")
            ? "PPTX"
            : "TXT";

      const sizeLimit = FILE_SIZE_LIMITS[fileType as keyof typeof FILE_SIZE_LIMITS] || MAX_FILE_SIZE;
      if (req.file.size > sizeLimit) {
        return res.status(413).json({
          error: "Fichier trop volumineux",
          message: `La taille du fichier ${req.file.originalname} (${(req.file.size / (1024 * 1024)).toFixed(2)}MB) dépasse la limite de ${sizeLimit / (1024 * 1024)}MB pour les fichiers ${fileType}.`,
          fileSize: `${(req.file.size / (1024 * 1024)).toFixed(2)}MB`,
          maxSize: `${sizeLimit / (1024 * 1024)}MB`,
          fileType,
        });
      }

      const projectId = parseInt(req.body.projectId);
      if (!projectId) {
        return res.status(400).json({
          error: "ID de projet manquant",
          message: "L'ID du projet est requis pour télécharger un fichier.",
        });
      }

      // Upload file to S3
      // Normalize filename to remove non-ASCII characters (CloudFront requirement)
      const normalizedFilename = req.file.originalname
        .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9._-]/g, ''); // Keep only safe characters
      
      const fileKey = `studio-documents/${projectId}/${Date.now()}-${normalizedFilename}`;
      const { url, key } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);

      // Save document metadata to database
      const dbFileType = fileType.toLowerCase() as 'pdf' | 'docx' | 'pptx' | 'txt';
      
      await studioDb.uploadDocument({
        projectId,
        fileName: normalizedFilename, // Store normalized filename
        fileSize: req.file.size,
        fileType: dbFileType,
        fileUrl: url,
        fileKey: key,
      });

      res.json({
        success: true,
        url,
        key,
        fileName: normalizedFilename, // Return normalized filename
        fileSize: req.file.size,
        fileType: dbFileType,
      });
    } catch (error) {
      console.error("Document upload failed:", error);
      return handleMulterError(error, res);
    }
  });

  // Error handler middleware for multer errors
  app.use((err: any, _req: Request, res: Response, next: any) => {
    if (err instanceof multer.MulterError || err.message?.includes("File type")) {
      return handleMulterError(err, res);
    }
    next(err);
  });

  // Generate scenario endpoint
  app.post("/api/studio/generate-scenario", async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user || (user.role !== "formateur" && user.role !== "admin")) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { projectId, pedagogicalModel, targetAudience, estimatedDuration } = req.body;
      if (!projectId) {
        return res.status(400).json({ error: "Project ID required" });
      }

      // Get project documents
      const documents = await studioDb.getProjectDocuments(projectId);
      const docArray = Array.isArray(documents) ? documents : [];
      if (docArray.length === 0) {
        return res.status(400).json({ error: "No documents found for this project" });
      }

      // Get project details
      const project = await studioDb.getStudioProjectById(projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Prepare documents with extracted content
      const documentsWithContent = docArray.map((d: any) => ({
        id: d.id,
        fileName: d.fileName || "Document",
        extractedContent: d.extractedContent || d.description || "",
      }));

      // Generate scenario using pedagogical model
      const result = await generateScenarioWithPedagogicalModel({
        projectId,
        projectTitle: project.title,
        pedagogicalModel: pedagogicalModel || "addie",
        targetAudience: targetAudience || project.targetAudience || "Tous les niveaux",
        estimatedDuration: estimatedDuration || project.estimatedDuration || 60,
        documents: documentsWithContent,
        language: project.language || "fr",
      });

      res.json({
        success: result.success,
        scenario: result.scenario,
        title: result.title,
        model: result.model,
        message: result.message,
      });
    } catch (error) {
      console.error("Scenario generation failed:", error);
      res.status(500).json({ error: "Scenario generation failed", details: (error as Error).message });
    }
  });

  // Create capsule endpoint
  app.post("/api/studio/create-capsule", async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user || (user.role !== "formateur" && user.role !== "admin")) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const { projectId, title, description, scenarioId } = req.body;
      if (!projectId || !title) {
        return res.status(400).json({ error: "Project ID and title required" });
      }

      // If no scenarioId provided, get the first scenario for this project
      let finalScenarioId = scenarioId;
      if (!finalScenarioId) {
        const scenarios = await studioDb.getProjectScenarios(projectId);
        const scenarioArray = Array.isArray(scenarios) ? scenarios : [];
        if (scenarioArray.length === 0) {
          return res.status(400).json({ error: "No scenario found. Please generate a scenario first." });
        }
        finalScenarioId = scenarioArray[0].id;
      }

      // Create capsule in database
      const capsule = await studioDb.createCapsule({
        projectId,
        scenarioId: finalScenarioId,
        title,
        description,
        generatedBy: "manual",
      });

      res.json({
        success: true,
        message: "Capsule créée avec succès. Vous pouvez maintenant ajouter du contenu.",
        capsule,
      });
    } catch (error) {
      console.error("Capsule creation failed:", error);
      res.status(500).json({ error: "Capsule creation failed", details: (error as Error).message });
    }
  });
}
