import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "./_core/trpc";
import { hasActivePremiumSubscription, isPremiumOrAdmin } from "./premium-access";

/**
 * Premium procedure - requires active premium subscription or admin role
 * Automatically checks subscription status and denies access if not premium
 */
export const premiumProcedure = protectedProcedure.use(async ({ ctx, next }: any) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not authenticated",
    });
  }

  // Check if user is admin or has active premium subscription
  const hasPremiumAccess = await isPremiumOrAdmin(ctx.user.id);

  if (!hasPremiumAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Premium subscription required to access this content",
    });
  }

  // Log access
  console.log(`[Premium Access] User ${ctx.user.id} granted access to premium content`);

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Premium query procedure - for read-only premium content
 */
export const premiumQuery = premiumProcedure;

/**
 * Premium mutation procedure - for modifying premium content
 */
export const premiumMutation = premiumProcedure;

/**
 * Middleware to check premium access for a specific resource
 * Can be used to validate access to individual resources
 */
export async function checkPremiumAccess(userId: number): Promise<{ allowed: boolean; reason?: string }> {
  const hasPremium = await hasActivePremiumSubscription(userId);

  if (!hasPremium) {
    return {
      allowed: false,
      reason: "Premium subscription required",
    };
  }

  return { allowed: true };
}

/**
 * Throw error if user doesn't have premium access
 */
export async function requirePremiumAccess(userId: number, resourceName: string = "content"): Promise<void> {
  const hasPremium = await hasActivePremiumSubscription(userId);

  if (!hasPremium) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Premium subscription required to access ${resourceName}`,
    });
  }
}
