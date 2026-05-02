import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
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

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Accès réservé aux administrateurs" });
  return next({ ctx });
});

export const externalCoursesRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          categoryId: z.number().optional(),
          level: z.string().optional(),
          source: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      return getExternalCourses(input || undefined);
    }),

  getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    return getExternalCourseBySlug(input.slug);
  }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        thumbnailUrl: z.string().optional(),
        externalUrl: z.string().url(),
        source: z.enum(["udemy", "coursera", "youtube", "other"]),
        categoryId: z.number().optional(),
        level: z.enum(["debutant", "intermediaire", "avance"]).optional(),
        duration: z.number().optional(),
        instructor: z.string().optional(),
        rating: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await createExternalCourse(input);
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        level: z.enum(["debutant", "intermediaire", "avance"]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateExternalCourse(id, data);
      return { success: true };
    }),

  delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await deleteExternalCourse(input.id);
    return { success: true };
  }),
});

export const subscriptionsRouter = router({
  getUserSubscription: protectedProcedure.query(async ({ ctx }) => {
    return getUserSubscription(ctx.user.id);
  }),

  isSubscribed: protectedProcedure.query(async ({ ctx }) => {
    return isUserSubscribed(ctx.user.id);
  }),

  create: protectedProcedure
    .input(
      z.object({
        planType: z.enum(["monthly", "yearly", "lifetime"]),
        price: z.string(),
        currency: z.string().optional(),
        paymentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createSubscription({
        userId: ctx.user.id,
        ...input,
      });
      return { success: true };
    }),

  cancel: protectedProcedure
    .input(z.object({ subscriptionId: z.number() }))
    .mutation(async ({ input }) => {
      await cancelSubscription(input.subscriptionId);
      return { success: true };
    }),
});
