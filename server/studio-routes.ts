import { Express, Request, Response } from "express";
import multer from "multer";
import { storagePut } from "./storage";
import { sdk } from "./_core/sdk";
import { invokeLLM } from "./_core/llm";
import * as studioDb from "./studio-db";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
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
  // Upload document endpoint
  app.post("/api/studio/upload-document", upload.single("file"), async (req: Request, res: Response) => {
    try {
      const user = await getAuthenticatedUser(req);
      if (!user || (user.role !== "formateur" && user.role !== "admin")) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const projectId = parseInt(req.body.projectId);
      if (!projectId) {
        return res.status(400).json({ error: "Project ID required" });
      }

      // Upload file to S3
      const fileKey = `studio-documents/${projectId}/${Date.now()}-${req.file.originalname}`;
      const { url, key } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);

      // Save document metadata to database
      const fileType = req.file.mimetype.includes('pdf') ? 'pdf' : 
                       req.file.mimetype.includes('word') ? 'docx' :
                       req.file.mimetype.includes('presentation') ? 'pptx' : 'txt';
      
      await studioDb.uploadDocument({
        projectId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType: fileType as 'pdf' | 'docx' | 'pptx' | 'txt',
        fileUrl: url,
        fileKey: key,
      });

      res.json({
        success: true,
        url,
        key,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        fileType,
      });
    } catch (error) {
      console.error("Document upload failed:", error);
      res.status(500).json({ error: "Upload failed", details: (error as Error).message });
    }
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

      // Prepare document context
      const documentContext = docArray
        .map((d: any) => `${d.fileName || ""}: ${d.description || ""}`)
        .join("\n");

      // Call LLM to generate scenario
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Tu es un expert en conception pédagogique. Génère un scénario pédagogique détaillé basé sur le modèle ${pedagogicalModel?.toUpperCase() || "ADDIE"} pour les apprenants: ${targetAudience || "tous les niveaux"}. Durée estimée: ${estimatedDuration || 60} minutes.`,
          },
          {
            role: "user",
            content: `Basé sur ces documents:\n${documentContext}\n\nGénère un scénario pédagogique structuré avec objectifs, modules, activités et évaluations.`,
          },
        ],
      });

      const scenarioContent = typeof response.choices[0]?.message?.content === "string" ? response.choices[0].message.content : "";

      // Save scenario to database
      await studioDb.createScenario({
        projectId,
        title: `Scénario ${pedagogicalModel?.toUpperCase() || "ADDIE"}`,
        description: scenarioContent.substring(0, 500),
        generatedBy: "manual",
      });

      res.json({
        success: true,
        scenario: scenarioContent,
        message: "Scénario généré avec succès",
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

      const { projectId, title, description } = req.body;
      if (!projectId || !title) {
        return res.status(400).json({ error: "Project ID and title required" });
      }

      // Create capsule in database
      const capsule = await studioDb.createCapsule({
        projectId,
        scenarioId: 0, // TODO: Get from selected scenario
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
