import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { initiatePaytechPayment } from "./paytech";
import { invokeLLM } from "./_core/llm";
import { nanoid } from "nanoid";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
  return next({ ctx });
});

const formateurProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "formateur" && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux formateurs" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    updateProfile: protectedProcedure.input(z.object({
      name: z.string().optional(),
      bio: z.string().optional(),
      phone: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await dbInstance.update(users).set(input).where(eq(users.id, ctx.user.id));
      await db.updateUserActivity(ctx.user.id);
      return { success: true };
    }),
  }),

  categories: router({
    list: publicProcedure.query(() => db.getAllCategories()),
    create: adminProcedure.input(z.object({
      name: z.string().min(1), slug: z.string().min(1),
      description: z.string().optional(), iconName: z.string().optional(),
    })).mutation(async ({ input }) => ({ id: await db.createCategory(input) })),
  }),

  courses: router({
    published: publicProcedure.input(z.object({
      categorySlug: z.string().optional(), search: z.string().optional(),
    }).optional()).query(({ input }) => db.getPublishedCourses(input?.categorySlug, input?.search)),
    bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const result = await db.getCourseBySlug(input.slug);
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Formation introuvable" });
      const mods = await db.getModulesByCourse(result.course.id);
      return { ...result, modules: mods };
    }),
    all: adminProcedure.query(() => db.getAllCourses()),
    create: formateurProcedure.input(z.object({
      title: z.string().min(1), slug: z.string().min(1),
      description: z.string().optional(), shortDescription: z.string().optional(),
      categoryId: z.number().optional(), price: z.string().default("0.00"),
      currency: z.string().default("XOF"),
      level: z.enum(["debutant", "intermediaire", "avance"]).default("debutant"),
      status: z.enum(["brouillon", "publie", "archive"]).default("brouillon"),
      tags: z.string().optional(),
    })).mutation(async ({ ctx, input }) => ({ id: await db.createCourse({ ...input, formateurId: ctx.user.id }) })),
    update: formateurProcedure.input(z.object({
      id: z.number(), title: z.string().optional(), description: z.string().optional(),
      shortDescription: z.string().optional(), categoryId: z.number().optional(),
      price: z.string().optional(),
      level: z.enum(["debutant", "intermediaire", "avance"]).optional(),
      status: z.enum(["brouillon", "publie", "archive"]).optional(),
      tags: z.string().optional(),
    })).mutation(async ({ input }) => { const { id, ...data } = input; await db.updateCourse(id, data); return { success: true }; }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteCourse(input.id); return { success: true }; }),
    formateurCourses: formateurProcedure.query(({ ctx }) => db.getFormateurCourses(ctx.user.id)),
    enrollments: formateurProcedure.input(z.object({ courseId: z.number() })).query(({ input }) => db.getCourseEnrollments(input.courseId)),
  }),

  modules: router({
    byCourse: publicProcedure.input(z.object({ courseId: z.number() })).query(({ input }) => db.getModulesByCourse(input.courseId)),
    create: formateurProcedure.input(z.object({
      courseId: z.number(), title: z.string().min(1), description: z.string().optional(),
      contentType: z.enum(["video", "texte", "quiz", "exercice", "pdf"]).default("video"),
      contentUrl: z.string().optional(), contentBody: z.string().optional(),
      duration: z.number().default(5), sortOrder: z.number().default(0), isPreview: z.boolean().default(false),
    })).mutation(async ({ input }) => ({ id: await db.createModule(input) })),
    update: formateurProcedure.input(z.object({
      id: z.number(), title: z.string().optional(), description: z.string().optional(),
      contentType: z.enum(["video", "texte", "quiz", "exercice", "pdf"]).optional(),
      contentUrl: z.string().optional(), contentBody: z.string().optional(),
      duration: z.number().optional(), sortOrder: z.number().optional(), isPreview: z.boolean().optional(),
    })).mutation(async ({ input }) => { const { id, ...data } = input; await db.updateModule(id, data); return { success: true }; }),
    delete: formateurProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteModule(input.id); return { success: true }; }),
  }),

  moduleResources: router({
    byModule: publicProcedure.input(z.object({ moduleId: z.number() })).query(({ input }) => db.getModuleResources(input.moduleId)),
    create: formateurProcedure.input(z.object({
      moduleId: z.number(),
      title: z.string().min(1),
      description: z.string().optional(),
      resourceType: z.enum(["video", "pdf", "document", "image", "audio", "lien", "autre"]),
      fileUrl: z.string().optional(),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
      sortOrder: z.number().default(0),
    })).mutation(async ({ input }) => {
      const cleanInput = {
        moduleId: input.moduleId,
        title: input.title,
        description: input.description || null,
        resourceType: input.resourceType,
        fileUrl: input.fileUrl || null,
        fileSize: input.fileSize ?? null,
        mimeType: input.mimeType || null,
        sortOrder: input.sortOrder,
      };
      return { id: await db.createModuleResource(cleanInput as any) };
    }),
    update: formateurProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      resourceType: z.enum(["video", "pdf", "document", "image", "audio", "lien", "autre"]).optional(),
      fileUrl: z.string().optional(),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
      sortOrder: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      const cleanData = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined));
      await db.updateModuleResource(id, cleanData as any);
      return { success: true };
    }),
    delete: formateurProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => { await db.deleteModuleResource(input.id); return { success: true }; }),
    reorder: formateurProcedure.input(z.object({ moduleId: z.number(), resourceIds: z.array(z.number()) })).mutation(async ({ input }) => { await db.reorderModuleResources(input.moduleId, input.resourceIds); return { success: true }; }),
  }),

  enrollments: router({
    myEnrollments: protectedProcedure.query(async ({ ctx }) => {
      await db.updateUserActivity(ctx.user.id);
      return db.getUserEnrollments(ctx.user.id);
    }),
    check: protectedProcedure.input(z.object({ courseId: z.number() })).query(({ ctx, input }) => db.getEnrollment(ctx.user.id, input.courseId)),
    enroll: protectedProcedure.input(z.object({ courseId: z.number() })).mutation(async ({ ctx, input }) => {
      const existing = await db.getEnrollment(ctx.user.id, input.courseId);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Déjà inscrit" });
      const course = await db.getCourseById(input.courseId);
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });
      if (Number(course.price) === 0) {
        const id = await db.createEnrollment({ userId: ctx.user.id, courseId: input.courseId, status: "actif" });
        return { id, paymentRequired: false };
      }
      return { paymentRequired: true, courseId: input.courseId, price: course.price, currency: course.currency };
    }),
    progress: protectedProcedure.input(z.object({ courseId: z.number() })).query(async ({ ctx, input }) => {
      await db.updateUserActivity(ctx.user.id);
      const mods = await db.getModulesByCourse(input.courseId);
      const progress = await db.getUserModuleProgress(ctx.user.id, input.courseId);
      return { modules: mods, progress };
    }),
    completeModule: protectedProcedure.input(z.object({
      moduleId: z.number(), courseId: z.number(), score: z.number().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.upsertModuleProgress({ userId: ctx.user.id, moduleId: input.moduleId, courseId: input.courseId, completed: true, score: input.score, completedAt: new Date() });
      const mods = await db.getModulesByCourse(input.courseId);
      const prog = await db.getUserModuleProgress(ctx.user.id, input.courseId);
      const percentage = mods.length > 0 ? Math.round((prog.filter(p => p.completed).length / mods.length) * 100) : 0;
      const enrollment = await db.getEnrollment(ctx.user.id, input.courseId);
      if (enrollment) {
        const updateData: any = { progress: percentage, lastAccessedAt: new Date() };
        if (percentage === 100) { updateData.status = "complete"; updateData.completedAt = new Date(); }
        await db.updateEnrollment(enrollment.id, updateData);
      }
      await db.updateUserActivity(ctx.user.id);
      return { progress: percentage, completed: percentage === 100 };
    }),
  }),

  payments: router({
    initiate: protectedProcedure.input(z.object({ courseId: z.number(), origin: z.string() })).mutation(async ({ ctx, input }) => {
      const course = await db.getCourseById(input.courseId);
      if (!course) throw new TRPCError({ code: "NOT_FOUND" });
      const refCommand = `DL-${Date.now()}-${nanoid(6)}`;
      const paymentId = await db.createPayment({ userId: ctx.user.id, courseId: input.courseId, amount: course.price, currency: course.currency || "XOF", transactionRef: refCommand, status: "en_attente" });
      try {
        const result = await initiatePaytechPayment({
          itemName: course.title, amount: Number(course.price), currency: course.currency || "XOF",
          refCommand, commandName: `Inscription - ${course.title}`,
          successUrl: `${input.origin}/payment/success?ref=${refCommand}`,
          cancelUrl: `${input.origin}/payment/cancel?ref=${refCommand}`,
          ipnUrl: `${input.origin}/api/paytech/ipn`,
        });
        const dbInstance = await db.getDb();
        if (dbInstance) {
          const { payments } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          await dbInstance.update(payments).set({ paytechToken: result.token }).where(eq(payments.id, paymentId));
        }
        return { redirectUrl: result.redirectUrl, refCommand };
      } catch (error: any) {
        await db.updatePaymentStatus(paymentId, "echoue");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message || "Erreur de paiement" });
      }
    }),
    verify: protectedProcedure.input(z.object({ ref: z.string() })).query(({ input }) => db.getPaymentByRef(input.ref)),
    confirmPayment: protectedProcedure.input(z.object({ ref: z.string() })).mutation(async ({ input }) => {
      const payment = await db.getPaymentByRef(input.ref);
      if (!payment) throw new TRPCError({ code: "NOT_FOUND" });
      await db.updatePaymentStatus(payment.id, "reussi", new Date());
      const existing = await db.getEnrollment(payment.userId, payment.courseId);
      if (!existing) await db.createEnrollment({ userId: payment.userId, courseId: payment.courseId, status: "actif" });
      else await db.updateEnrollment(existing.id, { status: "actif" } as any);
      const course = await db.getCourseById(payment.courseId);
      await db.createNotification({ userId: payment.userId, type: "inscription", title: "Inscription confirmée", message: `Votre inscription à "${course?.title}" a été confirmée.` });
      return { success: true };
    }),
    myPayments: protectedProcedure.query(({ ctx }) => db.getUserPayments(ctx.user.id)),
    all: adminProcedure.query(() => db.getAllPayments()),
  }),

  certificates: router({
    myCertificates: protectedProcedure.query(({ ctx }) => db.getUserCertificates(ctx.user.id)),
    verify: publicProcedure.input(z.object({ code: z.string() })).query(async ({ input }) => {
      const result = await db.getCertificateByCode(input.code);
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Certificat introuvable" });
      await db.incrementCertificateVerification(input.code);
      return { userName: result.user.name, courseName: result.course.title, issuedAt: result.cert.issuedAt, code: result.cert.certificateCode, verifiedCount: (result.cert.verifiedCount || 0) + 1 };
    }),
    generate: protectedProcedure.input(z.object({ courseId: z.number(), origin: z.string() })).mutation(async ({ ctx, input }) => {
      const enrollment = await db.getEnrollment(ctx.user.id, input.courseId);
      if (!enrollment || enrollment.status !== "complete") throw new TRPCError({ code: "BAD_REQUEST", message: "Complétez la formation d'abord" });
      const existing = await db.getUserCertificates(ctx.user.id);
      const alreadyHas = existing.find(c => c.course.id === input.courseId);
      if (alreadyHas) return { certificateCode: alreadyHas.cert.certificateCode, pdfUrl: alreadyHas.cert.pdfUrl };
      const code = `DL-CERT-${nanoid(12).toUpperCase()}`;
      const course = await db.getCourseById(input.courseId);
      // Generate certificate SVG with QR code
      const { generateCertificateSVG } = await import("./certificate-generator");
      const { storagePut } = await import("./storage");
      const svgContent = await generateCertificateSVG({
        userName: ctx.user.name || "Apprenant",
        courseName: course?.title || "Formation",
        certificateCode: code,
        issuedAt: new Date(),
        verifyBaseUrl: input.origin,
      });
      // Store SVG as certificate file
      const fileKey = `certificates/${code}.svg`;
      const { url: pdfUrl } = await storagePut(fileKey, Buffer.from(svgContent, "utf-8"), "image/svg+xml");
      await db.createCertificate({ userId: ctx.user.id, courseId: input.courseId, enrollmentId: enrollment.id, certificateCode: code, pdfUrl, pdfKey: fileKey });
      await db.createNotification({ userId: ctx.user.id, type: "certification", title: "Certificat disponible", message: `Votre certificat pour "${course?.title}" est prêt. Code: ${code}` });
      return { certificateCode: code, pdfUrl };
    }),
  }),

  chat: router({
    send: publicProcedure.input(z.object({ sessionId: z.string(), message: z.string().min(1), userId: z.number().optional() })).mutation(async ({ input }) => {
      await db.saveChatMessage({ userId: input.userId, sessionId: input.sessionId, role: "user", content: input.message });
      const history = await db.getChatHistory(input.sessionId, 10);
      const systemPrompt = `Tu es l'assistant virtuel de DigiLearn, une plateforme de formation certifiante en Afrique de l'Ouest. Tu réponds en français, de manière professionnelle et concise. Tu guides les prospects, expliques les formations et les paiements. Si la question est trop complexe, ajoute [BESOIN_HUMAIN].`;
      const messages = [{ role: "system" as const, content: systemPrompt }, ...history.slice(-8).map(m => ({ role: m.role as "user" | "assistant", content: m.content })), { role: "user" as const, content: input.message }];
      try {
        const response = await invokeLLM({ messages });
        const rawContent = response.choices?.[0]?.message?.content;
        const content = (typeof rawContent === "string" ? rawContent : "") || "Désolé, je ne peux pas répondre pour le moment.";
        const needsHuman = content.includes("[BESOIN_HUMAIN]");
        const cleanContent = content.replace(/\[BESOIN_HUMAIN\]/g, "").trim();
        await db.saveChatMessage({ userId: input.userId, sessionId: input.sessionId, role: "assistant", content: cleanContent, needsHuman });
        // Notify owner when human intervention is needed
        if (needsHuman) {
          try {
            const { notifyOwner } = await import("./_core/notification");
            await notifyOwner({ title: "Chatbot - Escalade humaine requise", content: `Session: ${input.sessionId}\nMessage utilisateur: ${input.message}` });
          } catch { /* notification failure should not block response */ }
        }
        return { reply: cleanContent, needsHuman };
      } catch {
        const fallback = "Je suis temporairement indisponible. Veuillez réessayer.";
        await db.saveChatMessage({ userId: input.userId, sessionId: input.sessionId, role: "assistant", content: fallback });
        return { reply: fallback, needsHuman: false };
      }
    }),
    history: publicProcedure.input(z.object({ sessionId: z.string() })).query(({ input }) => db.getChatHistory(input.sessionId)),
  }),

  notifications: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserNotifications(ctx.user.id)),
    markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => { await db.markNotificationRead(input.id, ctx.user.id); return { success: true }; }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => { const all = await db.getUserNotifications(ctx.user.id); return { count: all.filter(n => !n.isRead).length }; }),
  }),

  alumni: router({
    directory: publicProcedure.query(() => db.getAlumniDirectory()),
    updateProfile: protectedProcedure.input(z.object({
      linkedinUrl: z.string().optional(), company: z.string().optional(),
      jobTitle: z.string().optional(), graduationYear: z.number().optional(), isVisible: z.boolean().optional(),
    })).mutation(async ({ ctx, input }) => ({ id: await db.upsertAlumniProfile(ctx.user.id, input) })),
  }),

  formateur: router({
    stats: formateurProcedure.query(({ ctx }) => db.getFormateurStats(ctx.user.id)),
  }),

  admin: router({
    stats: adminProcedure.query(() => db.getAdminStats()),
    recentEnrollments: adminProcedure.query(() => db.getRecentEnrollments(20)),
    users: adminProcedure.query(() => db.getAllUsers()),
    updateUserRole: adminProcedure.input(z.object({
      userId: z.number(), role: z.enum(["admin", "formateur", "apprenant", "alumni", "prospect"]),
    })).mutation(async ({ input }) => { await db.updateUserRole(input.userId, input.role); return { success: true }; }),
    allPayments: adminProcedure.query(() => db.getAllPayments()),
  }),

  quiz: router({
    questions: protectedProcedure.input(z.object({ moduleId: z.number() })).query(({ input }) => db.getQuizQuestions(input.moduleId)),
    create: formateurProcedure.input(z.object({
      moduleId: z.number(), question: z.string(), options: z.string(),
      correctAnswer: z.number(), explanation: z.string().optional(), sortOrder: z.number().default(0),
    })).mutation(async ({ input }) => ({ id: await db.createQuizQuestion(input) })),
  }),
});

export type AppRouter = typeof appRouter;
