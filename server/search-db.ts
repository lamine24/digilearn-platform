import { getDb } from "./db";
import { courses, categories, users } from "../drizzle/schema";
import { sql, eq, and, or, like, gte, lte } from "drizzle-orm";

export interface SearchFilters {
  query?: string;
  categoryId?: number;
  level?: "debutant" | "intermediaire" | "avance";
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
  formateurId?: number;
  sortBy?: "relevance" | "popularity" | "price_asc" | "price_desc" | "newest" | "rating";
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  price: string;
  currency: string;
  level: string;
  duration: number | null;
  category: { id: number; name: string; slug: string } | null;
  formateur: { id: number; name: string | null; avatarUrl: string | null } | null;
  enrollmentCount: number;
}

/**
 * Search courses with advanced filtering and sorting
 */
export async function searchCourses(filters: SearchFilters): Promise<SearchResult[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    // Build conditions
    const conditions: any[] = [eq(courses.status, "publie")];

    if (filters.query) {
      const searchTerm = `%${filters.query}%`;
      conditions.push(
        or(
          like(courses.title, searchTerm),
          like(courses.description, searchTerm),
          like(courses.shortDescription, searchTerm),
          like(courses.tags, searchTerm)
        )
      );
    }

    if (filters.categoryId) {
      conditions.push(eq(courses.categoryId, filters.categoryId));
    }

    if (filters.level) {
      conditions.push(eq(courses.level, filters.level));
    }

    if (filters.minPrice !== undefined) {
      conditions.push(gte(courses.price, filters.minPrice.toString()));
    }

    if (filters.maxPrice !== undefined) {
      conditions.push(lte(courses.price, filters.maxPrice.toString()));
    }

    if (filters.minDuration !== undefined) {
      conditions.push(gte(courses.duration, filters.minDuration));
    }

    if (filters.maxDuration !== undefined) {
      conditions.push(lte(courses.duration, filters.maxDuration));
    }

    if (filters.formateurId) {
      conditions.push(eq(courses.formateurId, filters.formateurId));
    }

    // Execute query
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    let query: any = db
      .select({
        id: courses.id,
        title: courses.title,
        slug: courses.slug,
        description: courses.description,
        shortDescription: courses.shortDescription,
        thumbnailUrl: courses.thumbnailUrl,
        price: courses.price,
        currency: courses.currency,
        level: courses.level,
        duration: courses.duration,
        categoryId: categories.id,
        categoryName: categories.name,
        categorySlug: categories.slug,
        formateurId: users.id,
        formateurName: users.name,
        formateurAvatar: users.avatarUrl,
      })
      .from(courses)
      .leftJoin(categories, eq(courses.categoryId, categories.id))
      .leftJoin(users, eq(courses.formateurId, users.id))
      .where(and(...conditions));

    // Apply sorting
    switch (filters.sortBy) {
      case "price_asc":
        query = query.orderBy(courses.price);
        break;
      case "price_desc":
        query = query.orderBy(sql`${courses.price} DESC`);
        break;
      case "newest":
        query = query.orderBy(sql`${courses.createdAt} DESC`);
        break;
      case "popularity":
      case "relevance":
      default:
        query = query.orderBy(sql`${courses.createdAt} DESC`);
        break;
    }

    // Apply pagination
    query = query.limit(limit).offset(offset);
    const results = await query.execute();

    // Transform results
    return results.map((row: any) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description,
      shortDescription: row.shortDescription,
      thumbnailUrl: row.thumbnailUrl,
      price: row.price,
      currency: row.currency,
      level: row.level,
      duration: row.duration,
      category: row.categoryId
        ? {
            id: row.categoryId,
            name: row.categoryName,
            slug: row.categorySlug,
          }
        : null,
      formateur: row.formateurId
        ? {
            id: row.formateurId,
            name: row.formateurName,
            avatarUrl: row.formateurAvatar,
          }
        : null,
      enrollmentCount: 0,
    }));
  } catch (error) {
    console.error("[Search] Error searching courses:", error);
    return [];
  }
}

/**
 * Get available filter options
 */
export async function getAvailableFilters() {
  const db = await getDb();
  if (!db) return { categories: [], levels: [], priceRange: { minPrice: 0, maxPrice: 0 }, durationRange: { minDuration: 0, maxDuration: 0 }, formateurs: [] };

  try {
    // Get categories
    const allCategories = await db
      .selectDistinct({ id: categories.id, name: categories.name, slug: categories.slug })
      .from(categories)
      .execute();

    return {
      categories: allCategories || [],
      levels: [
        { value: "debutant", label: "Débutant" },
        { value: "intermediaire", label: "Intermédiaire" },
        { value: "avance", label: "Avancé" },
      ],
      priceRange: { minPrice: 0, maxPrice: 1000000 },
      durationRange: { minDuration: 0, maxDuration: 1000 },
      formateurs: [],
    };
  } catch (error) {
    console.error("[Search] Error getting available filters:", error);
    return { categories: [], levels: [], priceRange: { minPrice: 0, maxPrice: 0 }, durationRange: { minDuration: 0, maxDuration: 0 }, formateurs: [] };
  }
}

/**
 * Get search suggestions
 */
export async function getSearchSuggestions(query: string, limit: number = 10): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const searchTerm = `${query}%`;
    const suggestions = await db
      .selectDistinct({ title: courses.title })
      .from(courses)
      .where(
        and(
          eq(courses.status, "publie"),
          or(like(courses.title, searchTerm), like(courses.tags, `%${query}%`))
        )
      )
      .limit(limit)
      .execute();

    return suggestions.map((s: any) => s.title);
  } catch (error) {
    console.error("[Search] Error getting suggestions:", error);
    return [];
  }
}

/**
 * Get total count of courses matching filters
 */
export async function getSearchResultCount(filters: SearchFilters): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const conditions: any[] = [eq(courses.status, "publie")];

    if (filters.query) {
      const searchTerm = `%${filters.query}%`;
      conditions.push(
        or(
          like(courses.title, searchTerm),
          like(courses.description, searchTerm),
          like(courses.shortDescription, searchTerm),
          like(courses.tags, searchTerm)
        )
      );
    }

    if (filters.categoryId) {
      conditions.push(eq(courses.categoryId, filters.categoryId));
    }

    if (filters.level) {
      conditions.push(eq(courses.level, filters.level));
    }

    if (filters.minPrice !== undefined) {
      conditions.push(gte(courses.price, filters.minPrice.toString()));
    }

    if (filters.maxPrice !== undefined) {
      conditions.push(lte(courses.price, filters.maxPrice.toString()));
    }

    if (filters.minDuration !== undefined) {
      conditions.push(gte(courses.duration, filters.minDuration));
    }

    if (filters.maxDuration !== undefined) {
      conditions.push(lte(courses.duration, filters.maxDuration));
    }

    if (filters.formateurId) {
      conditions.push(eq(courses.formateurId, filters.formateurId));
    }

    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(courses)
      .where(and(...conditions))
      .execute();

    return result[0]?.count || 0;
  } catch (error) {
    console.error("[Search] Error getting result count:", error);
    return 0;
  }
}
