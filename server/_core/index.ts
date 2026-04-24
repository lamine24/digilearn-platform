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

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
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

  // PayTech IPN (Instant Payment Notification) endpoint
  app.post("/api/paytech/ipn", async (req, res) => {
    try {
      const { ref_command, type_event } = req.body;
      if (!ref_command) {
        return res.status(400).json({ error: "Missing ref_command" });
      }
      const { getPaymentByRef, updatePaymentStatus, getEnrollment, createEnrollment, updateEnrollment, getCourseById, createNotification } = await import("../db");
      const payment = await getPaymentByRef(ref_command);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      if (type_event === "sale_complete") {
        await updatePaymentStatus(payment.id, "reussi", new Date());
        const existing = await getEnrollment(payment.userId, payment.courseId);
        if (!existing) {
          await createEnrollment({ userId: payment.userId, courseId: payment.courseId, status: "actif" });
        } else {
          await updateEnrollment(existing.id, { status: "actif" } as any);
        }
        const course = await getCourseById(payment.courseId);
        await createNotification({
          userId: payment.userId,
          type: "inscription",
          title: "Inscription confirmée",
          message: `Votre inscription à "${course?.title}" a été confirmée.`,
        });
      } else if (type_event === "sale_canceled") {
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

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Start background jobs
    startInactivityJob();
  });
}

startServer().catch(console.error);
