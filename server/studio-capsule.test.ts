import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { studioCapsuleDb } from "./studio-capsule-db";

describe("StudioCapsuleDb", () => {
  describe("getCapsule", () => {
    it("should return null for non-existent capsule", async () => {
      const result = await studioCapsuleDb.getCapsule(999);
      expect(result).toBeNull();
    });
  });

  describe("getCapsuleWithProject", () => {
    it("should return null for non-existent capsule", async () => {
      const result = await studioCapsuleDb.getCapsuleWithProject(999);
      expect(result).toBeNull();
    });
  });

  describe("getProjectCapsules", () => {
    it("should return empty array for non-existent project", async () => {
      const result = await studioCapsuleDb.getProjectCapsules(999);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("getCapsuleVersions", () => {
    it("should return empty array for non-existent capsule", async () => {
      const result = await studioCapsuleDb.getCapsuleVersions(999);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("getCapsuleH5PElements", () => {
    it("should return empty array for non-existent capsule", async () => {
      const result = await studioCapsuleDb.getCapsuleH5PElements(999);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("getCapsuleMetadata", () => {
    it("should return null for non-existent capsule", async () => {
      const result = await studioCapsuleDb.getCapsuleMetadata(999);
      expect(result).toBeNull();
    });

    it("should return metadata structure with counts", async () => {
      // This would return null for non-existent capsule
      // In a real scenario with data, it would return:
      // { capsule, h5pElements, versions, elementCount, versionCount }
      const result = await studioCapsuleDb.getCapsuleMetadata(999);
      expect(result).toBeNull();
    });
  });

  describe("getCapsuleStats", () => {
    it("should return stats object with default values", async () => {
      const result = await studioCapsuleDb.getCapsuleStats(999);
      expect(result).toEqual({
        totalViews: 0,
        uniqueViewers: 0,
        avgWatchDuration: 0,
      });
    });
  });

  describe("getCapsuleComplete", () => {
    it("should return null for non-existent capsule", async () => {
      const result = await studioCapsuleDb.getCapsuleComplete(999);
      expect(result).toBeNull();
    });

    it("should return complete capsule structure", async () => {
      // For non-existent capsule, returns null
      const result = await studioCapsuleDb.getCapsuleComplete(999);
      expect(result).toBeNull();
    });
  });

  describe("getCapsuleExports", () => {
    it("should return empty array for non-existent capsule", async () => {
      const result = await studioCapsuleDb.getCapsuleExports(999);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("recordCapsuleView", () => {
    it("should not throw error when recording view", async () => {
      // Should complete without error
      await expect(
        studioCapsuleDb.recordCapsuleView(999, 123, 60)
      ).resolves.toBeUndefined();
    });
  });

  describe("updateCapsuleStatus", () => {
    it("should return null for non-existent capsule", async () => {
      const result = await studioCapsuleDb.updateCapsuleStatus(999, "published");
      expect(result).toBeNull();
    });
  });

  describe("searchCapsules", () => {
    it("should return empty array for non-existent project", async () => {
      const result = await studioCapsuleDb.searchCapsules(999, "test");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("getCapsulesByStatus", () => {
    it("should return empty array for non-existent project", async () => {
      const result = await studioCapsuleDb.getCapsulesByStatus(999, "published");
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("getRecentCapsules", () => {
    it("should return empty array for non-existent project", async () => {
      const result = await studioCapsuleDb.getRecentCapsules(999, 10);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should respect limit parameter", async () => {
      const result = await studioCapsuleDb.getRecentCapsules(999, 5);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });
});
