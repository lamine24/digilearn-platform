import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import {
  getSimilarCourses,
  getRelatedCourses,
  getCourseStats,
  getExternalCourseBySlug,
} from "./external-courses-db";

describe("External Course Detail", () => {
  let courseId: number;
  let testSlug = "test-course-detail";

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test course
    try {
      await db.execute(`
        INSERT INTO external_courses (
          title, slug, description, externalUrl, source, level, duration, 
          instructor, rating, enrollmentCount, requiresSubscription, isActive
        ) VALUES (
          'Test Course Detail',
          '${testSlug}',
          'Test description for course detail',
          'https://example.com/test',
          'udemy',
          'intermediaire',
          30,
          'Test Instructor',
          4.5,
          1000,
          true,
          true
        )
      `);

      // Get the course ID
      const result = await db.execute(`
        SELECT id FROM external_courses WHERE slug = '${testSlug}' LIMIT 1
      `);
      courseId = (result[0] as any).id;
    } catch (error) {
      console.error("Setup error:", error);
    }
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    try {
      await db.execute(`DELETE FROM external_courses WHERE slug = '${testSlug}'`);
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  });

  it("should fetch course by slug", async () => {
    const course = await getExternalCourseBySlug(testSlug);
    expect(course).toBeDefined();
    expect(course?.title).toBe("Test Course Detail");
    expect(course?.slug).toBe(testSlug);
  });

  it("should get course stats", async () => {
    const stats = await getCourseStats(courseId);
    expect(stats).toBeDefined();
    expect(stats?.enrollmentCount).toBe(1000);
    expect(stats?.rating).toBe(4.5);
    expect(stats?.duration).toBe(30);
  });

  it("should get similar courses by level", async () => {
    const similar = await getSimilarCourses(courseId, 3);
    expect(Array.isArray(similar)).toBe(true);
    // Similar courses should have the same level
    similar.forEach((course: any) => {
      expect(course.level).toBe("intermediaire");
      expect(course.id).not.toBe(courseId);
    });
  });

  it("should get related courses by source", async () => {
    const related = await getRelatedCourses(courseId, 3);
    expect(Array.isArray(related)).toBe(true);
    // Related courses should have the same source
    related.forEach((course: any) => {
      expect(course.source).toBe("udemy");
      expect(course.id).not.toBe(courseId);
    });
  });

  it("should not include current course in similar courses", async () => {
    const similar = await getSimilarCourses(courseId, 10);
    const ids = similar.map((c: any) => c.id);
    expect(ids).not.toContain(courseId);
  });

  it("should not include current course in related courses", async () => {
    const related = await getRelatedCourses(courseId, 10);
    const ids = related.map((c: any) => c.id);
    expect(ids).not.toContain(courseId);
  });

  it("should respect limit parameter for similar courses", async () => {
    const similar = await getSimilarCourses(courseId, 2);
    expect(similar.length).toBeLessThanOrEqual(2);
  });

  it("should respect limit parameter for related courses", async () => {
    const related = await getRelatedCourses(courseId, 2);
    expect(related.length).toBeLessThanOrEqual(2);
  });

  it("should handle non-existent course gracefully", async () => {
    const stats = await getCourseStats(99999);
    expect(stats).toBeNull();
  });

  it("should return empty array for similar courses of non-existent course", async () => {
    const similar = await getSimilarCourses(99999);
    expect(similar).toEqual([]);
  });
});
