import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
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

export const favoritesRouter = router({
  /**
   * Add a course to favorites
   */
  add: protectedProcedure
    .input(
      z.object({
        courseId: z.number().optional(),
        externalCourseId: z.number().optional(),
        courseType: z.enum(["internal", "external"]),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const success = await addFavorite(
        ctx.user.id,
        input.courseId || null,
        input.externalCourseId || null,
        input.courseType
      );
      return { success };
    }),

  /**
   * Remove a course from favorites
   */
  remove: protectedProcedure
    .input(
      z.object({
        courseId: z.number().optional(),
        externalCourseId: z.number().optional(),
        courseType: z.enum(["internal", "external"]),
      })
    )
    .mutation(async ({ ctx, input }: any) => {
      const success = await removeFavorite(
        ctx.user.id,
        input.courseId || null,
        input.externalCourseId || null,
        input.courseType
      );
      return { success };
    }),

  /**
   * Check if a course is favorited
   */
  isFavorited: protectedProcedure
    .input(
      z.object({
        courseId: z.number().optional(),
        externalCourseId: z.number().optional(),
        courseType: z.enum(["internal", "external"]),
      })
    )
    .query(async ({ ctx, input }: any) => {
      const favorited = await isFavorited(
        ctx.user.id,
        input.courseId || null,
        input.externalCourseId || null,
        input.courseType
      );
      return { favorited };
    }),

  /**
   * Get all user's favorites
   */
  list: protectedProcedure.query(async ({ ctx }: any) => {
    const favorites = await getUserFavorites(ctx.user.id);
    return { favorites };
  }),

  /**
   * Get user's favorite internal courses
   */
  listCourses: protectedProcedure.query(async ({ ctx }: any) => {
    const courses = await getUserFavoriteCourses(ctx.user.id);
    return { courses };
  }),

  /**
   * Get user's favorite external courses
   */
  listExternalCourses: protectedProcedure.query(async ({ ctx }: any) => {
    const courses = await getUserFavoriteExternalCourses(ctx.user.id);
    return { courses };
  }),

  /**
   * Get count of user's favorites
   */
  count: protectedProcedure.query(async ({ ctx }: any) => {
    const count = await getFavoritesCount(ctx.user.id);
    return { count };
  }),

  /**
   * Clear all user's favorites
   */
  clear: protectedProcedure.mutation(async ({ ctx }: any) => {
    const success = await clearUserFavorites(ctx.user.id);
    return { success };
  }),
});
