import { router } from "./_core/trpc";
import { premiumProcedure } from "./premium-procedure";
import { z } from "zod";
import {
  getFreeResources,
  getFreeResourceBySlug,
  getFreeResourcesByPlatform,
  getFreeResourcesByCategory,
  getFreeResourcesByLevel,
  getRecommendedFreeResources,
  getTrendingFreeResources,
  searchFreeResources,
  getUniquePlatforms,
  getUniqueCategories,
  getFreeResourcesCount,
} from "./free-resources-db";

/**
 * Premium resources router - all endpoints require active premium subscription
 * Extends free resources with premium-only features
 */
export const premiumResourcesRouter = router({
  // Get all premium resources (free resources accessible to premium users)
  list: premiumProcedure
    .input(
      z.object({
        platform: z.string().optional(),
        category: z.string().optional(),
        level: z.string().optional(),
        language: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum(["rating", "recent", "popular"]).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      })
    )
    .query(async ({ input }: any) => {
      return await getFreeResources(input);
    }),

  // Get a single premium resource by slug
  getBySlug: premiumProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }: any) => {
      return await getFreeResourceBySlug(input.slug);
    }),

  // Get premium resources by platform
  getByPlatform: premiumProcedure
    .input(z.object({ platform: z.string(), limit: z.number().optional() }))
    .query(async ({ input }: any) => {
      return await getFreeResourcesByPlatform(input.platform, input.limit);
    }),

  // Get premium resources by category
  getByCategory: premiumProcedure
    .input(z.object({ category: z.string(), limit: z.number().optional() }))
    .query(async ({ input }: any) => {
      return await getFreeResourcesByCategory(input.category, input.limit);
    }),

  // Get premium resources by level
  getByLevel: premiumProcedure
    .input(z.object({ level: z.string(), limit: z.number().optional() }))
    .query(async ({ input }: any) => {
      return await getFreeResourcesByLevel(input.level, input.limit);
    }),

  // Get recommended premium resources
  getRecommended: premiumProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }: any) => {
      return await getRecommendedFreeResources(input.limit);
    }),

  // Get trending premium resources
  getTrending: premiumProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }: any) => {
      return await getTrendingFreeResources(input.limit);
    }),

  // Search premium resources
  search: premiumProcedure
    .input(z.object({ query: z.string(), limit: z.number().optional() }))
    .query(async ({ input }: any) => {
      return await searchFreeResources(input.query, input.limit);
    }),

  // Get unique platforms for premium resources
  getPlatforms: premiumProcedure.query(async () => {
    return await getUniquePlatforms();
  }),

  // Get unique categories for premium resources
  getCategories: premiumProcedure.query(async () => {
    return await getUniqueCategories();
  }),

  // Get count of premium resources
  getCount: premiumProcedure.query(async () => {
    return await getFreeResourcesCount();
  }),
});
