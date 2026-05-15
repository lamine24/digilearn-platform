import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { setupStudioRoutes } from "../studio-routes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number, host: string): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, host, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000, host: string): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port, host)) {
      return port;
    }
  }
  throw new Error(`No available port found on ${host} starting from ${startPort}`);
}

async function listenWithRetry(
  server: ReturnType<typeof createServer>,
  host: string,
  startPort: number,
  maxAttempts: number = 20
): Promise<number> {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const onError = (error: NodeJS.ErrnoException) => {
          server.off("listening", onListening);
          reject(error);
        };
        const onListening = () => {
          server.off("error", onError);
          resolve();
        };
        server.once("error", onError);
        server.once("listening", onListening);
        server.listen(port, host);
      });
      return port;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EADDRINUSE") {
        throw error;
      }
    }
  }
  throw new Error(`Unable to listen on ${host} between ports ${startPort} and ${startPort + maxAttempts - 1}`);
}

import { startInactivityJob } from "../inactivity-job";
import { initializeDatabaseTables } from "../db-init";
import { startDocumentExtractionJob } from "../document-extraction-job";

async function startServer() {
  // Initialize database tables on startup
  await initializeDatabaseTables();
  
  // Start background jobs
  startDocumentExtractionJob();
  startInactivityJob();
  
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  setupStudioRoutes(app);

  // Lightweight health endpoint for infrastructure checks
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "digilearn-platform",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    });
  });

  // File upload endpoint
  app.post("/api/upload", async (req, res) => {
    try {
      const { storagePut } = await import("../storage");
      const { createContext } = await import("./context");
      
      // Get file from request
      let fileBuffer: Buffer | null = null;
      let fileName = "file";
      let mimeType = "application/octet-stream";
      
      // Handle multipart/form-data (if using FormData from frontend)
      if (req.headers["content-type"]?.includes("application/json")) {
        const { file, filename, mimetype } = req.body;
        if (typeof file === "string") {
          fileBuffer = Buffer.from(file, "base64");
        }
        fileName = filename || "file";
        mimeType = mimetype || "application/octet-stream";
      } else {
        // Fallback: treat entire body as file
        fileBuffer = req.body;
      }
      
      if (!fileBuffer || fileBuffer.length === 0) {
        return res.status(400).json({ error: "No file provided" });
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileKey = `modules/${timestamp}-${fileName}`;
      
      // Upload to S3
      const { url, key } = await storagePut(fileKey, fileBuffer, mimeType);
      
      res.json({ url, key, success: true });
    } catch (error) {
      console.error("[Upload] Error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Download with watermark endpoint
  app.get("/api/download-watermarked", async (req, res) => {
    try {
      const { url, user } = req.query;
      if (!url || !user) {
        return res.status(400).json({ error: "Missing url or user parameter" });
      }
      const { addWatermarkToPDF } = await import("../watermark");
      const watermarkedPdf = await addWatermarkToPDF(url as string, user as string);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="document-${Date.now()}.pdf"`);
      res.send(watermarkedPdf);
    } catch (error) {
      console.error("[Download Watermark] Error:", error);
      res.status(500).json({ error: "Failed to generate watermarked PDF" });
    }
  });

  // PayTech IPN (Instant Payment Notification) endpoint
  app.post("/api/paytech/ipn", async (req, res) => {
    try {
      const { verifyPaytechIPN } = await import("../paytech");
      const { getPaymentByRef, updatePaymentStatus, getEnrollment, createEnrollment, updateEnrollment, getCourseById, createNotification, createPremiumSubscription, recordPaymentError } = await import("../db");
      const { validateIPNPayload, storeWebhookRequest, isWebhookProcessed, recordWebhookError, checkRateLimit } = await import("../webhook-security");
      
      // Rate limiting check
      const clientIp = req.ip || "unknown";
      if (!checkRateLimit(clientIp, 100, 60000)) {
        console.warn(`[PayTech IPN] Rate limit exceeded for IP: ${clientIp}`);
        return res.status(429).json({ error: "Too many requests" });
      }

      // Validate payload
      const validation = validateIPNPayload(req.body);
      if (!validation.valid) {
        console.warn("[PayTech IPN] Invalid payload:", validation.errors);
        return res.status(400).json({ error: "Invalid payload", errors: validation.errors });
      }
      
      // Verify IPN signature
      if (!verifyPaytechIPN(req.body)) {
        console.warn("[PayTech IPN] Invalid signature or missing fields");
        return res.status(400).json({ error: "Invalid signature" });
      }
      
      const { ref_command, type_event } = req.body;
      
      // Check for duplicate webhooks (idempotency)
      if (isWebhookProcessed(ref_command)) {
        console.log(`[PayTech IPN] Webhook already processed for ref: ${ref_command}`);
        return res.json({ success: true, message: "Webhook already processed" });
      }
      
      // Store webhook request for tracking
      const webhook = storeWebhookRequest(req.body, req.body.sen_hash);
      
      const payment = await getPaymentByRef(ref_command);
      if (!payment) {
        const errorMsg = `Payment not found for ref: ${ref_command}`;
        console.warn(`[PayTech IPN] ${errorMsg}`);
        recordWebhookError(ref_command, errorMsg);
        return res.status(404).json({ error: "Payment not found" });
      }
      
      // Handle payment success
      if (type_event === "sale_complete") {
        console.log(`[PayTech IPN] Payment successful for ref: ${ref_command}`);
        await updatePaymentStatus(payment.id, "reussi", new Date());
        
        // Check if this is a premium subscription payment
        if (ref_command.startsWith("premium-")) {
          // Extract userId from ref_command format: premium-{userId}-{timestamp}
          const parts = ref_command.split("-");
          if (parts.length >= 2) {
            const userId = parseInt(parts[1], 10);
            if (!isNaN(userId)) {
              try {
                await createPremiumSubscription(userId, payment.id.toString());
                console.log(`[PayTech IPN] Premium subscription activated for user: ${userId}`);
                
                // Send notification for premium subscription
                await createNotification({
                  userId,
                  type: "certification",
                  title: "Abonnement Premium activé",
                  message: "Votre abonnement premium a été activé. Accédez à tous les contenus premium.",
                });
              } catch (error) {
                const errorMsg = `Error activating premium subscription for user ${userId}: ${error}`;
                console.error(`[PayTech IPN] ${errorMsg}`);
                recordPaymentError(payment.id, errorMsg, 1);
                recordWebhookError(ref_command, errorMsg);
              }
            }
          }
        } else if (payment.courseId) {
          // Handle regular course enrollment
          const existing = await getEnrollment(payment.userId, payment.courseId);
          if (!existing) {
            await createEnrollment({ userId: payment.userId, courseId: payment.courseId, status: "actif" });
          } else {
            await updateEnrollment(existing.id, { status: "actif" } as any);
          }
          
          // Send notification for course enrollment
          const course = await getCourseById(payment.courseId);
          await createNotification({
            userId: payment.userId,
            type: "inscription",
            title: "Inscription confirmée",
            message: `Votre inscription à "${course?.title}" a été confirmée.`,
          });
        }
      } 
      // Handle payment cancellation
      else if (type_event === "sale_canceled") {
        console.log(`[PayTech IPN] Payment canceled for ref: ${ref_command}`);
        await updatePaymentStatus(payment.id, "echoue");
      }
      // Handle payment failure
      else if (type_event === "sale_failed") {
        console.log(`[PayTech IPN] Payment failed for ref: ${ref_command}`);
        await updatePaymentStatus(payment.id, "echoue");
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("[PayTech IPN] Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });



  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const host = process.env.HOST || "0.0.0.0";
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort, host);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  const listeningPort = await listenWithRetry(server, host, port);
  console.log(`Server running on:`);
  console.log(`- http://localhost:${listeningPort}/`);
  console.log(`- http://127.0.0.1:${listeningPort}/`);
}

startServer().catch(console.error);
