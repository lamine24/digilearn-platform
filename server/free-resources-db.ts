import { getDb } from "./db";
import { freeResources } from "../drizzle/schema";
import { eq, like, and, desc, asc } from "drizzle-orm";

/**
 * Get all active free resources with optional filtering
 */
export async function getFreeResources(filters?: {
  platform?: string;
  category?: string;
  level?: string;
  language?: string;
  search?: string;
  sortBy?: "rating" | "recent" | "popular";
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(freeResources.isActive, true)];

  // Apply filters
  if (filters?.platform) {
    conditions.push(eq(freeResources.platform, filters.platform as any));
  }
  if (filters?.category) {
    conditions.push(eq(freeResources.category, filters.category));
  }
  if (filters?.level) {
    conditions.push(eq(freeResources.level, filters.level as any));
  }
  if (filters?.language) {
    conditions.push(eq(freeResources.language, filters.language));
  }
  if (filters?.search) {
    conditions.push(like(freeResources.title, `%${filters.search}%`));
  }

  const sortField =
    filters?.sortBy === "rating"
      ? desc(freeResources.rating)
      : filters?.sortBy === "popular"
        ? desc(freeResources.enrollmentCount)
        : desc(freeResources.createdAt);

  const limit = filters?.limit || 100;
  const offset = filters?.offset || 0;

  const result = await db
    .select()
    .from(freeResources)
    .where(and(...conditions))
    .orderBy(sortField)
    .limit(limit)
    .offset(offset);

  return result;
}

/**
 * Get a single free resource by slug
 */
export async function getFreeResourceBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(freeResources)
    .where(and(eq(freeResources.slug, slug), eq(freeResources.isActive, true)))
    .limit(1);

  return result[0] || null;
}

/**
 * Get free resources by platform
 */
export async function getFreeResourcesByPlatform(platform: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(freeResources)
    .where(and(eq(freeResources.platform, platform as any), eq(freeResources.isActive, true)))
    .orderBy(desc(freeResources.rating))
    .limit(limit);
}

/**
 * Get free resources by category
 */
export async function getFreeResourcesByCategory(category: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(freeResources)
    .where(and(eq(freeResources.category, category), eq(freeResources.isActive, true)))
    .orderBy(desc(freeResources.rating))
    .limit(limit);
}

/**
 * Get free resources by level
 */
export async function getFreeResourcesByLevel(level: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(freeResources)
    .where(and(eq(freeResources.level, level as any), eq(freeResources.isActive, true)))
    .orderBy(desc(freeResources.rating))
    .limit(limit);
}

/**
 * Get recommended free resources (top rated and recent)
 */
export async function getRecommendedFreeResources(limit = 6) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(freeResources)
    .where(eq(freeResources.isActive, true))
    .orderBy(desc(freeResources.rating), desc(freeResources.createdAt))
    .limit(limit);
}

/**
 * Get trending free resources (most enrollments)
 */
export async function getTrendingFreeResources(limit = 6) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(freeResources)
    .where(eq(freeResources.isActive, true))
    .orderBy(desc(freeResources.enrollmentCount))
    .limit(limit);
}

/**
 * Search free resources
 */
export async function searchFreeResources(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(freeResources)
    .where(
      and(
        eq(freeResources.isActive, true),
        like(freeResources.title, `%${query}%`)
      )
    )
    .orderBy(desc(freeResources.rating))
    .limit(limit);
}

/**
 * Get unique platforms
 */
export async function getUniquePlatforms() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .selectDistinct({ platform: freeResources.platform })
    .from(freeResources)
    .where(eq(freeResources.isActive, true));

  return result.map((r) => r.platform);
}

/**
 * Get unique categories
 */
export async function getUniqueCategories() {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .selectDistinct({ category: freeResources.category })
    .from(freeResources)
    .where(eq(freeResources.isActive, true));

  return result
    .map((r) => r.category)
    .filter((c) => c !== null && c !== undefined);
}

/**
 * Get free resources count
 */
export async function getFreeResourcesCount() {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select()
    .from(freeResources)
    .where(eq(freeResources.isActive, true));

  return result.length;
}

/**
 * Create a new free resource (admin only)
 */
export async function createFreeResource(data: {
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  externalUrl: string;
  platform: "khan_academy" | "mit_ocw" | "statlearning" | "open_learning_campus" | "canal_u" | "other";
  category?: string;
  level?: "debutant" | "intermediaire" | "avance";
  duration?: number;
  language?: string;
  tags?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(freeResources).values({
      title: data.title,
      slug: data.slug,
      description: data.description,
      shortDescription: data.shortDescription,
      thumbnailUrl: data.thumbnailUrl,
      externalUrl: data.externalUrl,
      platform: data.platform as any,
      category: data.category,
      level: (data.level || "debutant") as any,
      duration: data.duration,
      language: data.language || "fr",
      tags: data.tags,
      isActive: true,
    });

    return result;
  } catch (error) {
    console.error("Error creating free resource:", error);
    return null;
  }
}

/**
 * Update a free resource (admin only)
 */
export async function updateFreeResource(
  id: number,
  data: Partial<{
    title: string;
    description: string;
    shortDescription: string;
    thumbnailUrl: string;
    externalUrl: string;
    platform: "khan_academy" | "mit_ocw" | "statlearning" | "open_learning_campus" | "canal_u" | "other";
    category: string;
    level: "debutant" | "intermediaire" | "avance";
    duration: number;
    language: string;
    tags: string;
    rating: number;
    enrollmentCount: number;
    isActive: boolean;
  }>
) {
  const db = await getDb();
  if (!db) return false;

  try {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;
    if (data.externalUrl !== undefined) updateData.externalUrl = data.externalUrl;
    if (data.platform !== undefined) updateData.platform = data.platform;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.enrollmentCount !== undefined) updateData.enrollmentCount = data.enrollmentCount;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await db
      .update(freeResources)
      .set(updateData)
      .where(eq(freeResources.id, id));

    return true;
  } catch (error) {
    console.error("Error updating free resource:", error);
    return false;
  }
}

/**
 * Delete a free resource (admin only)
 */
export async function deleteFreeResource(id: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.delete(freeResources).where(eq(freeResources.id, id));
    return true;
  } catch (error) {
    console.error("Error deleting free resource:", error);
    return false;
  }
}
