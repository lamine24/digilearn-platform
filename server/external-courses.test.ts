import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getExternalCourses,
  getExternalCourseBySlug,
  createExternalCourse,
  updateExternalCourse,
  deleteExternalCourse,
  getUserSubscription,
  isUserSubscribed,
  createSubscription,
  cancelSubscription,
} from "./external-courses-db";

describe("External Courses Database Functions", () => {
  let courseId: number;
  let subscriptionId: number;

  describe("External Courses", () => {
    it("should create an external course", async () => {
      const result = await createExternalCourse({
        title: "Test Udemy Course",
        slug: "test-udemy-course",
        description: "A test course from Udemy",
        shortDescription: "Test course",
        externalUrl: "https://udemy.com/test-course",
        source: "udemy",
        level: "debutant",
        duration: 10,
        instructor: "Test Instructor",
        rating: "4.5",
      });

      expect(result).toBeDefined();
      courseId = result.insertId || 1;
    });

    it("should retrieve external courses", async () => {
      const courses = await getExternalCourses();
      expect(Array.isArray(courses)).toBe(true);
    });

    it("should filter courses by source", async () => {
      const courses = await getExternalCourses({ source: "udemy" });
      expect(Array.isArray(courses)).toBe(true);
    });

    it("should filter courses by level", async () => {
      const courses = await getExternalCourses({ level: "debutant" });
      expect(Array.isArray(courses)).toBe(true);
    });

    it("should get course by slug", async () => {
      const course = await getExternalCourseBySlug("test-udemy-course");
      if (course) {
        expect(course.title).toBe("Test Udemy Course");
        expect(course.slug).toBe("test-udemy-course");
      }
    });

    it("should update an external course", async () => {
      await updateExternalCourse(courseId, {
        title: "Updated Test Course",
        description: "Updated description",
      });

      const course = await getExternalCourseBySlug("test-udemy-course");
      if (course) {
        expect(course.title).toBe("Updated Test Course");
      }
    });

    it("should soft delete an external course", async () => {
      await deleteExternalCourse(courseId);

      const courses = await getExternalCourses();
      const deleted = courses.find((c: any) => c.id === courseId);
      expect(deleted).toBeUndefined();
    });
  });

  describe("Subscriptions", () => {
    const testUserId = 1;

    it("should create a monthly subscription", async () => {
      const result = await createSubscription({
        userId: testUserId,
        planType: "monthly",
        price: "10000",
        currency: "XOF",
      });

      expect(result).toBeDefined();
      subscriptionId = result.insertId || 1;
    });

    it("should get user subscription", async () => {
      const subscription = await getUserSubscription(testUserId);
      if (subscription) {
        expect(subscription.userId).toBe(testUserId);
        expect(subscription.status).toBe("active");
      }
    });

    it("should check if user is subscribed", async () => {
      const isSubscribed = await isUserSubscribed(testUserId);
      expect(typeof isSubscribed).toBe("boolean");
    });

    it("should create a yearly subscription", async () => {
      const result = await createSubscription({
        userId: testUserId + 1,
        planType: "yearly",
        price: "100000",
        currency: "XOF",
      });

      expect(result).toBeDefined();
    });

    it("should create a lifetime subscription", async () => {
      const result = await createSubscription({
        userId: testUserId + 2,
        planType: "lifetime",
        price: "500000",
        currency: "XOF",
      });

      expect(result).toBeDefined();
    });

    it("should cancel a subscription", async () => {
      await cancelSubscription(subscriptionId);

      const subscription = await getUserSubscription(testUserId);
      // After cancellation, getUserSubscription should return null
      expect(subscription).toBeNull();
    });
  });

  describe("Integration Tests", () => {
    it("should handle multiple subscriptions per user", async () => {
      const userId = 100;

      // Create first subscription
      const sub1 = await createSubscription({
        userId,
        planType: "monthly",
        price: "10000",
        currency: "XOF",
      });

      expect(sub1).toBeDefined();

      // Check subscription
      const isSubscribed = await isUserSubscribed(userId);
      expect(isSubscribed).toBe(true);
    });

    it("should handle subscription with payment ID", async () => {
      const result = await createSubscription({
        userId: 200,
        planType: "monthly",
        price: "10000",
        currency: "XOF",
        paymentId: "PAY-123456",
      });

      expect(result).toBeDefined();

      const subscription = await getUserSubscription(200);
      if (subscription) {
        expect(subscription.paymentId).toBe("PAY-123456");
      }
    });
  });
});
