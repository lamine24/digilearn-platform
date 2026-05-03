import { getDb } from "./db";

export interface FavoriteItem {
  id: number;
  userId: number;
  courseId: number | null;
  externalCourseId: number | null;
  courseType: "internal" | "external";
  createdAt: Date;
}

/**
 * Add a course to user's favorites
 */
export async function addFavorite(
  userId: number,
  courseId: number | null,
  externalCourseId: number | null,
  courseType: "internal" | "external"
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const query = `
      INSERT INTO favorites (userId, courseId, externalCourseId, courseType)
      VALUES (${userId}, ${courseId}, ${externalCourseId}, '${courseType}')
      ON DUPLICATE KEY UPDATE createdAt = NOW()
    `;
    await db.execute(query);
    return true;
  } catch (error) {
    console.error("Error adding favorite:", error);
    return false;
  }
}

/**
 * Remove a course from user's favorites
 */
export async function removeFavorite(
  userId: number,
  courseId: number | null,
  externalCourseId: number | null,
  courseType: "internal" | "external"
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const query = `
      DELETE FROM favorites
      WHERE userId = ${userId} AND courseId = ${courseId} AND externalCourseId = ${externalCourseId} AND courseType = '${courseType}'
    `;
    await db.execute(query);
    return true;
  } catch (error) {
    console.error("Error removing favorite:", error);
    return false;
  }
}

/**
 * Check if a course is in user's favorites
 */
export async function isFavorited(
  userId: number,
  courseId: number | null,
  externalCourseId: number | null,
  courseType: "internal" | "external"
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const query = `
      SELECT id FROM favorites
      WHERE userId = ${userId} AND courseId = ${courseId} AND externalCourseId = ${externalCourseId} AND courseType = '${courseType}'
      LIMIT 1
    `;
    const result = await db.execute(query);
    return Array.isArray(result) && result.length > 0;
  } catch (error) {
    console.error("Error checking favorite:", error);
    return false;
  }
}

/**
 * Get all user's favorite courses (internal)
 */
export async function getUserFavoriteCourses(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const query = `
      SELECT 
        f.id, f.userId, f.courseId, f.externalCourseId, f.courseType, f.createdAt,
        c.id as course_id, c.title, c.slug, c.thumbnailUrl, c.price, c.level,
        u.name as formateurName
      FROM favorites f
      LEFT JOIN courses c ON f.courseId = c.id
      LEFT JOIN users u ON c.formateurId = u.id
      WHERE f.userId = ${userId} AND f.courseType = 'internal'
      ORDER BY f.createdAt DESC
    `;
    const result = await db.execute(query);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error getting favorite courses:", error);
    return [];
  }
}

/**
 * Get all user's favorite external courses
 */
export async function getUserFavoriteExternalCourses(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const query = `
      SELECT 
        f.id, f.userId, f.courseId, f.externalCourseId, f.courseType, f.createdAt,
        ec.id as external_course_id, ec.title, ec.slug, ec.thumbnailUrl, ec.source, 
        ec.level, ec.instructor, ec.rating
      FROM favorites f
      LEFT JOIN external_courses ec ON f.externalCourseId = ec.id
      WHERE f.userId = ${userId} AND f.courseType = 'external'
      ORDER BY f.createdAt DESC
    `;
    const result = await db.execute(query);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error getting favorite external courses:", error);
    return [];
  }
}

/**
 * Get all user's favorites (both internal and external)
 */
export async function getUserFavorites(userId: number): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const query = `
      SELECT 
        f.id, f.userId, f.courseId, f.externalCourseId, f.courseType, f.createdAt,
        c.id as course_id, c.title as course_title, c.slug as course_slug, 
        c.thumbnailUrl as course_thumbnail, c.price, c.level as course_level,
        ec.id as external_course_id, ec.title as external_title, ec.slug as external_slug,
        ec.thumbnailUrl as external_thumbnail, ec.source, ec.level as external_level,
        ec.instructor, ec.rating
      FROM favorites f
      LEFT JOIN courses c ON f.courseId = c.id AND f.courseType = 'internal'
      LEFT JOIN external_courses ec ON f.externalCourseId = ec.id AND f.courseType = 'external'
      WHERE f.userId = ${userId}
      ORDER BY f.createdAt DESC
    `;
    const result = await db.execute(query);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Error getting user favorites:", error);
    return [];
  }
}

/**
 * Get count of user's favorites
 */
export async function getFavoritesCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const query = `SELECT COUNT(*) as count FROM favorites WHERE userId = ${userId}`;
    const result = await db.execute(query);
    if (Array.isArray(result) && result.length > 0) {
      return (result[0] as any).count || 0;
    }
    return 0;
  } catch (error) {
    console.error("Error getting favorites count:", error);
    return 0;
  }
}

/**
 * Clear all user's favorites
 */
export async function clearUserFavorites(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const query = `DELETE FROM favorites WHERE userId = ${userId}`;
    await db.execute(query);
    return true;
  } catch (error) {
    console.error("Error clearing favorites:", error);
    return false;
  }
}
