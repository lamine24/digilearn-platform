import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(user?: Partial<AuthenticatedUser>): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];
  const fullUser: AuthenticatedUser | null = user ? {
    id: user.id ?? 1,
    openId: user.openId ?? "test-user",
    email: user.email ?? "test@example.com",
    name: user.name ?? "Test User",
    loginMethod: user.loginMethod ?? "manus",
    role: user.role ?? "apprenant",
    createdAt: user.createdAt ?? new Date(),
    updatedAt: user.updatedAt ?? new Date(),
    lastSignedIn: user.lastSignedIn ?? new Date(),
  } as AuthenticatedUser : null;

  const ctx: TrpcContext = {
    user: fullUser,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

describe("DigiLearn Router Tests", () => {
  // ─── Auth ──────────────────────────────────────────────────────
  describe("auth.me", () => {
    it("returns null for unauthenticated user", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      expect(result).toBeNull();
    });

    it("returns user data for authenticated user", async () => {
      const { ctx } = createMockContext({ id: 1, name: "Mamadou", email: "mamadou@test.com", role: "apprenant" });
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      expect(result).toBeDefined();
      expect(result?.name).toBe("Mamadou");
      expect(result?.role).toBe("apprenant");
    });
  });

  describe("auth.logout", () => {
    it("clears the session cookie and reports success", async () => {
      const { ctx, clearedCookies } = createMockContext({ id: 1 });
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.logout();
      expect(result).toEqual({ success: true });
      expect(clearedCookies).toHaveLength(1);
      expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    });
  });

  // ─── Categories ────────────────────────────────────────────────
  describe("categories.list", () => {
    it("returns an array", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.categories.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ─── Courses ───────────────────────────────────────────────────
  describe("courses.published", () => {
    it("returns an array of published courses", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.courses.published({});
      expect(Array.isArray(result)).toBe(true);
    });

    it("returns courses with expected structure", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.courses.published({});
      if (result.length > 0) {
        expect(result[0]).toHaveProperty("course");
        expect(result[0]).toHaveProperty("category");
        expect(result[0].course).toHaveProperty("title");
        expect(result[0].course).toHaveProperty("slug");
        expect(result[0].course).toHaveProperty("price");
      }
    });
  });

  describe("courses.bySlug", () => {
    it("throws NOT_FOUND for non-existent slug", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.courses.bySlug({ slug: "non-existent-slug-xyz" }))
        .rejects.toThrow();
    });
  });

  // ─── Admin ─────────────────────────────────────────────────────
  describe("admin procedures", () => {
    it("rejects non-admin user for admin.stats", async () => {
      const { ctx } = createMockContext({ id: 1, role: "apprenant" });
      const caller = appRouter.createCaller(ctx);
      await expect(caller.admin.stats()).rejects.toThrow();
    });

    it("allows admin user for admin.stats", async () => {
      const { ctx } = createMockContext({ id: 1, role: "admin" });
      const caller = appRouter.createCaller(ctx);
      const result = await caller.admin.stats();
      expect(result).toHaveProperty("totalUsers");
      expect(result).toHaveProperty("totalEnrollments");
      expect(result).toHaveProperty("totalRevenue");
      expect(result).toHaveProperty("completionRate");
      expect(result).toHaveProperty("totalCourses");
      expect(typeof result.totalUsers).toBe("number");
      expect(typeof result.completionRate).toBe("number");
    });
  });

  // ─── Formateur ─────────────────────────────────────────────────
  describe("formateur procedures", () => {
    it("rejects non-formateur user for courses.create", async () => {
      const { ctx } = createMockContext({ id: 1, role: "apprenant" });
      const caller = appRouter.createCaller(ctx);
      await expect(caller.courses.create({
        title: "Test", slug: "test", description: "Test course",
      })).rejects.toThrow();
    });

    it("allows formateur to list their courses", async () => {
      const { ctx } = createMockContext({ id: 1, role: "formateur" });
      const caller = appRouter.createCaller(ctx);
      const result = await caller.courses.formateurCourses();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ─── Certificates ──────────────────────────────────────────────
  describe("certificates.verify", () => {
    it("throws NOT_FOUND for invalid certificate code", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.certificates.verify({ code: "INVALID-CODE-XYZ" }))
        .rejects.toThrow();
    });
  });

  // ─── Chat ──────────────────────────────────────────────────────
  describe("chat.send", () => {
    it("returns a reply for a simple message", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.chat.send({
        sessionId: "test-session-456",
        message: "Bonjour, quelles formations proposez-vous ?",
      });
      expect(result).toHaveProperty("reply");
      expect(typeof result.reply).toBe("string");
      expect(result.reply.length).toBeGreaterThan(0);
      expect(result).toHaveProperty("needsHuman");
      expect(typeof result.needsHuman).toBe("boolean");
    });
  });

  describe("chat.history", () => {
    it("returns chat history for a session", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.chat.history({ sessionId: "test-session-456" });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ─── Notifications ─────────────────────────────────────────────
  describe("notifications", () => {
    it("requires authentication for notifications.list", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.notifications.list()).rejects.toThrow();
    });

    it("returns notifications for authenticated user", async () => {
      const { ctx } = createMockContext({ id: 1, role: "apprenant" });
      const caller = appRouter.createCaller(ctx);
      const result = await caller.notifications.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("returns unread count", async () => {
      const { ctx } = createMockContext({ id: 1, role: "apprenant" });
      const caller = appRouter.createCaller(ctx);
      const result = await caller.notifications.unreadCount();
      expect(result).toHaveProperty("count");
      expect(typeof result.count).toBe("number");
    });
  });

  // ─── Alumni ────────────────────────────────────────────────────
  describe("alumni.directory", () => {
    it("returns an array", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.alumni.directory();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ─── Enrollments ───────────────────────────────────────────────
  describe("enrollments", () => {
    it("requires authentication for myEnrollments", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.enrollments.myEnrollments()).rejects.toThrow();
    });

    it("returns enrollments for authenticated user", async () => {
      const { ctx } = createMockContext({ id: 1, role: "apprenant" });
      const caller = appRouter.createCaller(ctx);
      const result = await caller.enrollments.myEnrollments();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ─── Payments ──────────────────────────────────────────────────
  describe("payments", () => {
    it("requires authentication for myPayments", async () => {
      const { ctx } = createMockContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.payments.myPayments()).rejects.toThrow();
    });

    it("returns payments for authenticated user", async () => {
      const { ctx } = createMockContext({ id: 1, role: "apprenant" });
      const caller = appRouter.createCaller(ctx);
      const result = await caller.payments.myPayments();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ─── Quiz ──────────────────────────────────────────────────────
  describe("quiz.questions", () => {
    it("returns questions for a module", async () => {
      const { ctx } = createMockContext({ id: 1, role: "apprenant" });
      const caller = appRouter.createCaller(ctx);
      const result = await caller.quiz.questions({ moduleId: 1 });
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

// ─── Certificate Generator Unit Tests ────────────────────────────
describe("Certificate Generator", () => {
  it("generates SVG with QR code", async () => {
    const { generateCertificateSVG } = await import("./certificate-generator");
    const svg = await generateCertificateSVG({
      userName: "Mamadou Lamine Kane",
      courseName: "Data Science Avancé",
      certificateCode: "DL-CERT-TEST123",
      issuedAt: new Date("2026-01-15"),
      verifyBaseUrl: "https://example.com",
    });
    expect(svg).toContain("DigiLearn");
    expect(svg).toContain("Mamadou Lamine Kane");
    expect(svg).toContain("Data Science");
    expect(svg).toContain("DL-CERT-TEST123");
    expect(svg).toContain("data:image/png;base64"); // QR code
    expect(svg).toContain("CERTIFICAT DE FORMATION");
  });
});
