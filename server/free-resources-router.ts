import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
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
  createFreeResource,
  updateFreeResource,
  deleteFreeResource,
} from "./free-resources-db";

export const freeResourcesRouter = router({
  // Get all free resources with filtering
  list: publicProcedure
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

  // Get a single free resource by slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }: any) => {
      return await getFreeResourceBySlug(input.slug);
    }),

  // Get free resources by platform
  getByPlatform: publicProcedure
    .input(z.object({ platform: z.string(), limit: z.number().optional() }))
    .query(async ({ input }: any) => {
      return await getFreeResourcesByPlatform(input.platform, input.limit);
    }),

  // Get free resources by category
  getByCategory: publicProcedure
    .input(z.object({ category: z.string(), limit: z.number().optional() }))
    .query(async ({ input }: any) => {
      return await getFreeResourcesByCategory(input.category, input.limit);
    }),

  // Get free resources by level
  getByLevel: publicProcedure
    .input(z.object({ level: z.string(), limit: z.number().optional() }))
    .query(async ({ input }: any) => {
      return await getFreeResourcesByLevel(input.level, input.limit);
    }),

  // Get recommended free resources
  getRecommended: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }: any) => {
      return await getRecommendedFreeResources(input.limit);
    }),

  // Get trending free resources
  getTrending: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }: any) => {
      return await getTrendingFreeResources(input.limit);
    }),

  // Search free resources
  search: publicProcedure
    .input(z.object({ query: z.string(), limit: z.number().optional() }))
    .query(async ({ input }: any) => {
      return await searchFreeResources(input.query, input.limit);
    }),

  // Get unique platforms
  getPlatforms: publicProcedure.query(async () => {
    return await getUniquePlatforms();
  }),

  // Get unique categories
  getCategories: publicProcedure.query(async () => {
    return await getUniqueCategories();
  }),

  // Get total count of free resources
  getCount: publicProcedure.query(async () => {
    return await getFreeResourcesCount();
  }),

  // Create a new free resource (admin only)
  create: publicProcedure
    .input(
      z.object({
        title: z.string(),
        slug: z.string(),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        externalUrl: z.string(),
        platform: z.enum([
          "khan_academy",
          "mit_ocw",
          "statlearning",
          "open_learning_campus",
          "canal_u",
          "other",
        ]),
        category: z.string().optional(),
        level: z.enum(["debutant", "intermediaire", "avance"]).optional(),
        duration: z.number().optional(),
        language: z.string().optional(),
        tags: z.string().optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      return await createFreeResource(input);
    }),

  // Update a free resource (admin only)
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        externalUrl: z.string().optional(),
        platform: z
          .enum([
            "khan_academy",
            "mit_ocw",
            "statlearning",
            "open_learning_campus",
            "canal_u",
            "other",
          ])
          .optional(),
        category: z.string().optional(),
        level: z.enum(["debutant", "intermediaire", "avance"]).optional(),
        duration: z.number().optional(),
        language: z.string().optional(),
        tags: z.string().optional(),
        rating: z.number().optional(),
        enrollmentCount: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }: any) => {
      const { id, ...data } = input;
      return await updateFreeResource(id, data);
    }),

  // Delete a free resource (admin only)
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }: any) => {
      return await deleteFreeResource(input.id);
    }),
});
