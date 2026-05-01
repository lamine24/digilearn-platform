import { Express, Request, Response } from "express";
import multer, { Multer } from "multer";
import path from "path";
import { storagePut } from "./storage";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
  fileFilter: (req, file, cb) => {
    // Validate file types
    const allowedMimes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "application/pdf",
      "text/plain",
      "image/jpeg",
      "image/png",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

export function setupUploadRoutes(app: Express) {
  // Upload endpoint for course resources
  app.post("/api/upload/resource", upload.single("file"), async (req: MulterRequest, res: Response) => {
    try {

      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Generate unique filename
      const ext = path.extname(req.file.originalname);
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      const fileKey = `resources/${filename}`;

      // Upload to S3
      const { url, key } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);

      // Return the URL and key
      res.json({
        success: true,
        url,
        key,
        filename: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Upload endpoint for course images
  app.post("/api/upload/image", upload.single("file"), async (req: MulterRequest, res: Response) => {
    try {

      if (!req.file) {
        return res.status(400).json({ error: "No file provided" });
      }

      // Validate image type
      if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({ error: "File must be an image" });
      }

      // Generate unique filename
      const ext = path.extname(req.file.originalname);
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      const fileKey = `images/${filename}`;

      // Upload to S3
      const { url, key } = await storagePut(fileKey, req.file.buffer, req.file.mimetype);

      // Return the URL and key
      res.json({
        success: true,
        url,
        key,
        filename: req.file.originalname,
        size: req.file.size,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });
}
