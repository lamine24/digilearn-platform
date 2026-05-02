import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
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

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);

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
      const { getPaymentByRef, updatePaymentStatus, getEnrollment, createEnrollment, updateEnrollment, getCourseById, createNotification } = await import("../db");
      
      // Verify IPN signature
      if (!verifyPaytechIPN(req.body)) {
        console.warn("[PayTech IPN] Invalid signature or missing fields");
        return res.status(400).json({ error: "Invalid signature" });
      }
      
      const { ref_command, type_event } = req.body;
      if (!ref_command) {
        return res.status(400).json({ error: "Missing ref_command" });
      }
      
      const payment = await getPaymentByRef(ref_command);
      if (!payment) {
        console.warn(`[PayTech IPN] Payment not found for ref: ${ref_command}`);
        return res.status(404).json({ error: "Payment not found" });
      }
      
      // Handle payment success
      if (type_event === "sale_complete") {
        console.log(`[PayTech IPN] Payment successful for ref: ${ref_command}`);
        await updatePaymentStatus(payment.id, "reussi", new Date());
        
        // Create or update enrollment
        const existing = await getEnrollment(payment.userId, payment.courseId);
        if (!existing) {
          await createEnrollment({ userId: payment.userId, courseId: payment.courseId, status: "actif" });
        } else {
          await updateEnrollment(existing.id, { status: "actif" } as any);
        }
        
        // Send notification
        const course = await getCourseById(payment.courseId);
        await createNotification({
          userId: payment.userId,
          type: "inscription",
          title: "Inscription confirmée",
          message: `Votre inscription a \"${course?.title}\" a ete confirmee.`,
        });
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

  // Subscription Payment endpoint
  app.post("/api/paytech/subscription/init", async (req, res) => {
    try {
      const { initiateSubscriptionPayment } = await import("../paytech-subscription");
      const { amount, currency, description, planType, userId } = req.body;

      if (!amount || !currency || !planType || !userId) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const result = await initiateSubscriptionPayment({
        amount,
        currency,
        description,
        planType,
        userId,
      });

      if (result.success) {
        return res.json(result);
      } else {
        return res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("[Subscription Payment] Error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Internal server error",
      });
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
  // Start background jobs
  startInactivityJob();
}

startServer().catch(console.error);
