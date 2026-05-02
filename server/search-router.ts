import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  searchCourses,
  getAvailableFilters,
  getSearchSuggestions,
  getSearchResultCount,
  type SearchFilters,
} from "./search-db";

export const searchRouter = router({
  /**
   * Search courses with advanced filtering and sorting
   */
  courses: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        categoryId: z.number().optional(),
        level: z.enum(["debutant", "intermediaire", "avance"]).optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        minDuration: z.number().optional(),
        maxDuration: z.number().optional(),
        formateurId: z.number().optional(),
        sortBy: z.enum(["relevance", "popularity", "price_asc", "price_desc", "newest", "rating"]).default("relevance"),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const filters: SearchFilters = {
        query: input.query,
        categoryId: input.categoryId,
        level: input.level,
        minPrice: input.minPrice,
        maxPrice: input.maxPrice,
        minDuration: input.minDuration,
        maxDuration: input.maxDuration,
        formateurId: input.formateurId,
        sortBy: input.sortBy,
        limit: input.limit,
        offset: input.offset,
      };

      const results = await searchCourses(filters);
      const total = await getSearchResultCount(filters);

      return {
        results,
        total,
        limit: input.limit,
        offset: input.offset,
        hasMore: input.offset + input.limit < total,
      };
    }),

  /**
   * Get available filter options (categories, levels, price range, etc.)
   */
  filters: publicProcedure.query(async () => {
    return await getAvailableFilters();
  }),

  /**
   * Get search suggestions based on partial query
   */
  suggestions: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().default(10),
      })
    )
    .query(async ({ input }) => {
      return await getSearchSuggestions(input.query, input.limit);
    }),

  /**
   * Get total count of courses matching filters (for pagination)
   */
  count: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        categoryId: z.number().optional(),
        level: z.enum(["debutant", "intermediaire", "avance"]).optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        minDuration: z.number().optional(),
        maxDuration: z.number().optional(),
        formateurId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const filters: SearchFilters = {
        query: input.query,
        categoryId: input.categoryId,
        level: input.level,
        minPrice: input.minPrice,
        maxPrice: input.maxPrice,
        minDuration: input.minDuration,
        maxDuration: input.maxDuration,
        formateurId: input.formateurId,
      };

      return await getSearchResultCount(filters);
    }),
});
