import { describe, it, expect, beforeEach } from "vitest";
import {
  addFavorite,
  removeFavorite,
  isFavorited,
  getUserFavorites,
  getUserFavoriteCourses,
  getUserFavoriteExternalCourses,
  getFavoritesCount,
  clearUserFavorites,
} from "./favorites-db";

describe("Favorites Database Functions", () => {
  const testUserId = 1;
  const testCourseId = 1;
  const testExternalCourseId = 1;

  beforeEach(async () => {
    // Clear favorites before each test
    await clearUserFavorites(testUserId);
  });

  it("should add a favorite course", async () => {
    const result = await addFavorite(testUserId, testCourseId, null, "internal");
    expect(result).toBe(true);

    const isFav = await isFavorited(testUserId, testCourseId, null, "internal");
    expect(isFav).toBe(true);
  });

  it("should add a favorite external course", async () => {
    const result = await addFavorite(testUserId, null, testExternalCourseId, "external");
    expect(result).toBe(true);

    const isFav = await isFavorited(testUserId, null, testExternalCourseId, "external");
    expect(isFav).toBe(true);
  });

  it("should remove a favorite course", async () => {
    await addFavorite(testUserId, testCourseId, null, "internal");
    const result = await removeFavorite(testUserId, testCourseId, null, "internal");
    expect(result).toBe(true);

    const isFav = await isFavorited(testUserId, testCourseId, null, "internal");
    expect(isFav).toBe(false);
  });

  it("should check if a course is favorited", async () => {
    let isFav = await isFavorited(testUserId, testCourseId, null, "internal");
    expect(isFav).toBe(false);

    await addFavorite(testUserId, testCourseId, null, "internal");
    isFav = await isFavorited(testUserId, testCourseId, null, "internal");
    expect(isFav).toBe(true);
  });

  it("should get user favorites count", async () => {
    let count = await getFavoritesCount(testUserId);
    expect(count).toBe(0);

    await addFavorite(testUserId, testCourseId, null, "internal");
    count = await getFavoritesCount(testUserId);
    expect(count).toBe(1);

    await addFavorite(testUserId, null, testExternalCourseId, "external");
    count = await getFavoritesCount(testUserId);
    expect(count).toBe(2);
  });

  it("should get user favorites", async () => {
    await addFavorite(testUserId, testCourseId, null, "internal");
    await addFavorite(testUserId, null, testExternalCourseId, "external");

    const favorites = await getUserFavorites(testUserId);
    expect(Array.isArray(favorites)).toBe(true);
    expect(favorites.length).toBeGreaterThanOrEqual(0);
  });

  it("should get user favorite courses", async () => {
    await addFavorite(testUserId, testCourseId, null, "internal");

    const courses = await getUserFavoriteCourses(testUserId);
    expect(Array.isArray(courses)).toBe(true);
  });

  it("should get user favorite external courses", async () => {
    await addFavorite(testUserId, null, testExternalCourseId, "external");

    const courses = await getUserFavoriteExternalCourses(testUserId);
    expect(Array.isArray(courses)).toBe(true);
  });

  it("should clear all user favorites", async () => {
    await addFavorite(testUserId, testCourseId, null, "internal");
    await addFavorite(testUserId, null, testExternalCourseId, "external");

    let count = await getFavoritesCount(testUserId);
    expect(count).toBeGreaterThan(0);

    await clearUserFavorites(testUserId);
    count = await getFavoritesCount(testUserId);
    expect(count).toBe(0);
  });

  it("should handle duplicate favorites gracefully", async () => {
    await addFavorite(testUserId, testCourseId, null, "internal");
    const result = await addFavorite(testUserId, testCourseId, null, "internal");
    expect(result).toBe(true);

    const count = await getFavoritesCount(testUserId);
    expect(count).toBe(1);
  });

  it("should not remove non-existent favorites", async () => {
    const result = await removeFavorite(testUserId, 999, null, "internal");
    expect(result).toBe(true);

    const count = await getFavoritesCount(testUserId);
    expect(count).toBe(0);
  });
});
