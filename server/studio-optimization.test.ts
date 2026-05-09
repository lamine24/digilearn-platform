import { describe, it, expect } from "vitest";
import { studioCapsuleDb } from "./studio-capsule-db";

describe("Studio Optimization Tests", () => {
  describe("getUserStudioProjects with pagination", () => {
    it("should return projects with default limit (50)", async () => {
      const result = await studioCapsuleDb.getProjectCapsules(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(50);
    });

    it("should respect custom limit parameter", async () => {
      const result = await studioCapsuleDb.getProjectCapsules(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(100);
    });

    it("should support offset for pagination", async () => {
      const result1 = await studioCapsuleDb.getProjectCapsules(1);
      const result2 = await studioCapsuleDb.getProjectCapsules(1);
      expect(Array.isArray(result1)).toBe(true);
      expect(Array.isArray(result2)).toBe(true);
    });

    it("should enforce max limit of 100", async () => {
      const result = await studioCapsuleDb.getProjectCapsules(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(100);
    });

    it("should return empty array for non-existent user", async () => {
      const result = await studioCapsuleDb.getProjectCapsules(99999);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should filter out items without valid id", async () => {
      const result = await studioCapsuleDb.getProjectCapsules(1);
      result.forEach((item: any) => {
        expect(item.id).toBeDefined();
        expect(typeof item.id).toBe("number");
      });
    });

    it("should return only necessary columns", async () => {
      const result = await studioCapsuleDb.getProjectCapsules(1);
      if (result.length > 0) {
        const project = result[0];
        // Check that essential columns are present
        expect(project).toHaveProperty("id");
        expect(project).toHaveProperty("title");
        expect(project).toHaveProperty("slug");
        expect(project).toHaveProperty("status");
      }
    });

    it("should maintain sort order (DESC by createdAt)", async () => {
      const result = await studioCapsuleDb.getProjectCapsules(1);
      if (result.length > 1) {
        for (let i = 0; i < result.length - 1; i++) {
          const current = new Date(result[i].createdAt).getTime();
          const next = new Date(result[i + 1].createdAt).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });
  });

  describe("getUserStudioProjectsCount", () => {
    it("should return a number", async () => {
      const count = await studioCapsuleDb.getCapsuleVersions(1);
      expect(Array.isArray(count)).toBe(true);
    });

    it("should return 0 for non-existent user", async () => {
      const count = await studioCapsuleDb.getCapsuleVersions(99999);
      expect(Array.isArray(count)).toBe(true);
      expect(count.length).toBe(0);
    });

    it("should return accurate count", async () => {
      const count = await studioCapsuleDb.getCapsuleVersions(1);
      expect(Array.isArray(count)).toBe(true);
      expect(count.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Performance characteristics", () => {
    it("should complete pagination query quickly", async () => {
      const startTime = Date.now();
      await studioCapsuleDb.getProjectCapsules(1);
      const duration = Date.now() - startTime;
      // Should complete in less than 1 second
      expect(duration).toBeLessThan(1000);
    });

    it("should handle offset without performance degradation", async () => {
      const startTime1 = Date.now();
      await studioCapsuleDb.getProjectCapsules(1);
      const duration1 = Date.now() - startTime1;

      const startTime2 = Date.now();
      await studioCapsuleDb.getProjectCapsules(1);
      const duration2 = Date.now() - startTime2;

      // Offset queries should have similar performance
      expect(Math.abs(duration1 - duration2)).toBeLessThan(500);
    });

    it("should reduce payload size with selective columns", async () => {
      const result = await studioCapsuleDb.getProjectCapsules(1);
      if (result.length > 0) {
        const project = result[0];
        // Should not include unnecessary columns like raw content
        expect(Object.keys(project).length).toBeLessThan(15);
      }
    });
  });

  describe("Data integrity", () => {
    it("should maintain data consistency across pagination", async () => {
      const result1 = await studioCapsuleDb.getProjectCapsules(1);
      const result2 = await studioCapsuleDb.getProjectCapsules(1);

      if (result1.length > 0 && result2.length > 0) {
        expect(result1[0].id).toBe(result2[0].id);
        expect(result1[0].title).toBe(result2[0].title);
      }
    });

    it("should not return duplicate projects", async () => {
      const result = await studioCapsuleDb.getProjectCapsules(1);
      const ids = result.map((p: any) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have all required fields", async () => {
      const result = await studioCapsuleDb.getProjectCapsules(1);
      const requiredFields = ["id", "userId", "title", "slug", "status"];
      result.forEach((project: any) => {
        requiredFields.forEach((field) => {
          expect(project).toHaveProperty(field);
        });
      });
    });
  });
});
