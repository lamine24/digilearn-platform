import { describe, it, expect, beforeAll } from "vitest";
import { getFreeResources, getFreeResourceBySlug, getFreeResourcesByPlatform, getFreeResourcesByCategory, getFreeResourcesByLevel, getRecommendedFreeResources, getTrendingFreeResources, searchFreeResources, getUniquePlatforms, getUniqueCategories, getFreeResourcesCount } from "./free-resources-db";

describe("Free Resources Database", () => {
  describe("getFreeResources", () => {
    it("should return free resources with pagination", async () => {
      const result = await getFreeResources({ limit: 5, offset: 0 });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it("should filter by platform", async () => {
      const result = await getFreeResources({ platform: "khan_academy", limit: 10 });
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0].platform).toBe("khan_academy");
      }
    });

    it("should filter by level", async () => {
      const result = await getFreeResources({ level: "debutant", limit: 10 });
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0].level).toBe("debutant");
      }
    });

    it("should sort by rating", async () => {
      const result = await getFreeResources({ sortBy: "rating", limit: 10 });
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 1) {
        expect(result[0].rating).toBeGreaterThanOrEqual(result[1].rating || 0);
      }
    });
  });

  describe("getFreeResourceBySlug", () => {
    it("should return a resource by slug", async () => {
      const result = await getFreeResourceBySlug("khan-academy-math-intro");
      if (result) {
        expect(result.slug).toBe("khan-academy-math-intro");
        expect(result.title).toBeDefined();
      }
    });

    it("should return null for non-existent slug", async () => {
      const result = await getFreeResourceBySlug("non-existent-slug");
      expect(result).toBeNull();
    });
  });

  describe("getFreeResourcesByPlatform", () => {
    it("should return resources by platform", async () => {
      const result = await getFreeResourcesByPlatform("khan_academy", 10);
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0].platform).toBe("khan_academy");
      }
    });

    it("should respect limit", async () => {
      const result = await getFreeResourcesByPlatform("khan_academy", 2);
      expect(result.length).toBeLessThanOrEqual(2);
    });
  });

  describe("getFreeResourcesByCategory", () => {
    it("should return resources by category", async () => {
      const result = await getFreeResourcesByCategory("Mathématiques", 10);
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0].category).toBe("Mathématiques");
      }
    });
  });

  describe("getFreeResourcesByLevel", () => {
    it("should return resources by level", async () => {
      const result = await getFreeResourcesByLevel("debutant", 10);
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0].level).toBe("debutant");
      }
    });
  });

  describe("getRecommendedFreeResources", () => {
    it("should return recommended resources", async () => {
      const result = await getRecommendedFreeResources(5);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe("getTrendingFreeResources", () => {
    it("should return trending resources", async () => {
      const result = await getTrendingFreeResources(5);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe("searchFreeResources", () => {
    it("should search resources by title", async () => {
      const result = await searchFreeResources("mathématiques", 10);
      expect(Array.isArray(result)).toBe(true);
      if (result.length > 0) {
        expect(result[0].title.toLowerCase()).toContain("mathématiques".toLowerCase());
      }
    });

    it("should return empty array for non-matching query", async () => {
      const result = await searchFreeResources("xyz123nonexistent", 10);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe("getUniquePlatforms", () => {
    it("should return unique platforms", async () => {
      const result = await getUniquePlatforms();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      // Result is an array of platform names
      expect(typeof result[0]).toBe("string");
    });
  });

  describe("getUniqueCategories", () => {
    it("should return unique categories", async () => {
      const result = await getUniqueCategories();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      // Result is an array of category names
      expect(typeof result[0]).toBe("string");
    });
  });

  describe("getFreeResourcesCount", () => {
    it("should return total count of resources", async () => {
      const result = await getFreeResourcesCount();
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });
  });
});
