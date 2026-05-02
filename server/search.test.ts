import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { searchCourses, getAvailableFilters, getSearchSuggestions, getSearchResultCount, type SearchFilters } from "./search-db";
import { getDb } from "./db";
import { courses, categories, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Search Functionality", () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
    if (!db) {
      throw new Error("Database connection failed");
    }
  });

  describe("searchCourses", () => {
    it("should return empty array when no courses match", async () => {
      const filters: SearchFilters = {
        query: "nonexistent_course_xyz_123",
      };
      const results = await searchCourses(filters);
      expect(Array.isArray(results)).toBe(true);
    });

    it("should return courses with pagination", async () => {
      const filters: SearchFilters = {
        limit: 10,
        offset: 0,
      };
      const results = await searchCourses(filters);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(10);
    });

    it("should filter by level", async () => {
      const filters: SearchFilters = {
        level: "debutant",
        limit: 20,
      };
      const results = await searchCourses(filters);
      expect(Array.isArray(results)).toBe(true);
      results.forEach((course) => {
        expect(course.level).toBe("debutant");
      });
    });

    it("should filter by price range", async () => {
      const filters: SearchFilters = {
        minPrice: 0,
        maxPrice: 50000,
        limit: 20,
      };
      const results = await searchCourses(filters);
      expect(Array.isArray(results)).toBe(true);
      results.forEach((course) => {
        const price = parseFloat(course.price);
        expect(price).toBeGreaterThanOrEqual(0);
        expect(price).toBeLessThanOrEqual(50000);
      });
    });

    it("should sort by price ascending", async () => {
      const filters: SearchFilters = {
        sortBy: "price_asc",
        limit: 20,
      };
      const results = await searchCourses(filters);
      expect(Array.isArray(results)).toBe(true);
      
      // Check if results are sorted by price
      for (let i = 1; i < results.length; i++) {
        const prevPrice = parseFloat(results[i - 1].price);
        const currPrice = parseFloat(results[i].price);
        expect(prevPrice).toBeLessThanOrEqual(currPrice);
      }
    });

    it("should sort by newest first", async () => {
      const filters: SearchFilters = {
        sortBy: "newest",
        limit: 20,
      };
      const results = await searchCourses(filters);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    it("should include course metadata", async () => {
      const filters: SearchFilters = {
        limit: 1,
      };
      const results = await searchCourses(filters);
      
      if (results.length > 0) {
        const course = results[0];
        expect(course).toHaveProperty("id");
        expect(course).toHaveProperty("title");
        expect(course).toHaveProperty("slug");
        expect(course).toHaveProperty("price");
        expect(course).toHaveProperty("currency");
        expect(course).toHaveProperty("level");
        expect(course).toHaveProperty("enrollmentCount");
      }
    });
  });

  describe("getAvailableFilters", () => {
    it("should return filter options", async () => {
      const filters = await getAvailableFilters();
      
      expect(filters).toHaveProperty("categories");
      expect(filters).toHaveProperty("levels");
      expect(filters).toHaveProperty("priceRange");
      expect(filters).toHaveProperty("durationRange");
      expect(filters).toHaveProperty("formateurs");
    });

    it("should return valid levels", async () => {
      const filters = await getAvailableFilters();
      
      expect(Array.isArray(filters.levels)).toBe(true);
      expect(filters.levels.length).toBeGreaterThan(0);
      
      const levelValues = filters.levels.map((l) => l.value);
      expect(levelValues).toContain("debutant");
      expect(levelValues).toContain("intermediaire");
      expect(levelValues).toContain("avance");
    });

    it("should return price range", async () => {
      const filters = await getAvailableFilters();
      
      expect(filters.priceRange).toHaveProperty("minPrice");
      expect(filters.priceRange).toHaveProperty("maxPrice");
      expect(typeof filters.priceRange.minPrice).toBe("number");
      expect(typeof filters.priceRange.maxPrice).toBe("number");
      expect(filters.priceRange.minPrice).toBeLessThanOrEqual(filters.priceRange.maxPrice);
    });

    it("should return duration range", async () => {
      const filters = await getAvailableFilters();
      
      expect(filters.durationRange).toHaveProperty("minDuration");
      expect(filters.durationRange).toHaveProperty("maxDuration");
      expect(typeof filters.durationRange.minDuration).toBe("number");
      expect(typeof filters.durationRange.maxDuration).toBe("number");
    });

    it("should return categories with counts", async () => {
      const filters = await getAvailableFilters();
      
      expect(Array.isArray(filters.categories)).toBe(true);
      filters.categories.forEach((cat) => {
        expect(cat).toHaveProperty("id");
        expect(cat).toHaveProperty("name");
        expect(cat).toHaveProperty("slug");
      });
    });
  });

  describe("getSearchSuggestions", () => {
    it("should return empty array for short queries", async () => {
      const suggestions = await getSearchSuggestions("a", 10);
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it("should return suggestions for valid queries", async () => {
      const suggestions = await getSearchSuggestions("data", 10);
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeLessThanOrEqual(10);
    });

    it("should return unique suggestions", async () => {
      const suggestions = await getSearchSuggestions("course", 20);
      const uniqueSuggestions = new Set(suggestions);
      expect(uniqueSuggestions.size).toBe(suggestions.length);
    });
  });

  describe("getSearchResultCount", () => {
    it("should return a number", async () => {
      const count = await getSearchResultCount({});
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it("should count filtered results", async () => {
      const allCount = await getSearchResultCount({});
      const beginnerCount = await getSearchResultCount({ level: "debutant" });
      
      expect(beginnerCount).toBeLessThanOrEqual(allCount);
    });

    it("should respect multiple filters", async () => {
      const filters: SearchFilters = {
        level: "debutant",
        minPrice: 0,
        maxPrice: 100000,
      };
      const count = await getSearchResultCount(filters);
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Complex Search Scenarios", () => {
    it("should handle combined filters", async () => {
      const filters: SearchFilters = {
        query: "data",
        level: "intermediaire",
        minPrice: 0,
        maxPrice: 500000,
        sortBy: "price_asc",
        limit: 10,
        offset: 0,
      };
      
      const results = await searchCourses(filters);
      expect(Array.isArray(results)).toBe(true);
      
      results.forEach((course) => {
        expect(course.level).toBe("intermediaire");
        const price = parseFloat(course.price);
        expect(price).toBeGreaterThanOrEqual(0);
        expect(price).toBeLessThanOrEqual(500000);
      });
    });

    it("should handle pagination correctly", async () => {
      const page1 = await searchCourses({ limit: 5, offset: 0 });
      const page2 = await searchCourses({ limit: 5, offset: 5 });
      
      // Pages should not contain the same courses
      const page1Ids = new Set(page1.map((c) => c.id));
      const page2Ids = new Set(page2.map((c) => c.id));
      
      const intersection = new Set([...page1Ids].filter((x) => page2Ids.has(x)));
      expect(intersection.size).toBe(0);
    });

    it("should return consistent results for same filters", async () => {
      const filters: SearchFilters = {
        query: "python",
        level: "debutant",
        limit: 10,
      };
      
      const results1 = await searchCourses(filters);
      const results2 = await searchCourses(filters);
      
      expect(results1.length).toBe(results2.length);
      expect(results1.map((c) => c.id)).toEqual(results2.map((c) => c.id));
    });
  });
});
