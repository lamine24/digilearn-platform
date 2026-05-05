import { getDb } from "./db";
import { premiumSubscriptions, users } from "../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";

/**
 * Check if a user has an active premium subscription
 */
export async function hasActivePremiumSubscription(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const subscription = await db
      .select()
      .from(premiumSubscriptions)
      .where(
        and(
          eq(premiumSubscriptions.userId, userId),
          eq(premiumSubscriptions.status, "active")
        )
      )
      .limit(1);

    if (subscription.length === 0) return false;

    // Check if subscription has not expired
    const sub = subscription[0];
    if (sub.endDate && new Date(sub.endDate) < new Date()) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Premium Access] Error checking subscription:", error);
    return false;
  }
}

/**
 * Get active premium subscription details for a user
 */
export async function getActivePremiumSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const subscription = await db
      .select()
      .from(premiumSubscriptions)
      .where(
        and(
          eq(premiumSubscriptions.userId, userId),
          eq(premiumSubscriptions.status, "active")
        )
      )
      .limit(1);

    if (subscription.length === 0) return null;

    const sub = subscription[0];
    // Check if subscription has not expired
    if (sub.endDate && new Date(sub.endDate) < new Date()) {
      return null;
    }

    return sub;
  } catch (error) {
    console.error("[Premium Access] Error fetching subscription:", error);
    return null;
  }
}

/**
 * Get days remaining for premium subscription
 */
export async function getDaysRemainingForPremium(userId: number): Promise<number | null> {
  const subscription = await getActivePremiumSubscription(userId);
  if (!subscription || !subscription.endDate) return null;

  const now = new Date();
  const endDate = new Date(subscription.endDate);
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return Math.max(0, daysRemaining);
}

/**
 * Check if user is premium or admin
 */
export async function isPremiumOrAdmin(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Check if user is admin
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length > 0 && user[0].role === "admin") {
      return true;
    }

    // Check if user has active premium subscription
    return await hasActivePremiumSubscription(userId);
  } catch (error) {
    console.error("[Premium Access] Error checking premium or admin status:", error);
    return false;
  }
}

/**
 * Get premium subscription status for user
 */
export interface PremiumStatus {
  isActive: boolean;
  daysRemaining: number | null;
  expiresAt: Date | null;
  renewalUrl?: string;
}

export async function getPremiumStatus(userId: number): Promise<PremiumStatus> {
  const subscription = await getActivePremiumSubscription(userId);
  const daysRemaining = await getDaysRemainingForPremium(userId);

  return {
    isActive: subscription !== null,
    daysRemaining,
    expiresAt: subscription?.endDate ?? null,
    renewalUrl: "/premium-subscription",
  };
}

/**
 * Validate premium access for a specific resource
 */
export async function validatePremiumAccess(
  userId: number,
  resourceType: "course" | "resource" | "module"
): Promise<{ allowed: boolean; reason?: string }> {
  // Admin users always have access
  const db = await getDb();
  if (!db) {
    return { allowed: false, reason: "Database unavailable" };
  }

  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length > 0 && user[0].role === "admin") {
      return { allowed: true };
    }

    // Check premium subscription
    const hasPremium = await hasActivePremiumSubscription(userId);
    if (!hasPremium) {
      return {
        allowed: false,
        reason: `Premium subscription required to access ${resourceType}`,
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("[Premium Access] Error validating access:", error);
    return { allowed: false, reason: "Error validating access" };
  }
}

/**
 * Log premium content access attempt
 */
export async function logPremiumAccessAttempt(
  userId: number,
  resourceId: number,
  resourceType: string,
  allowed: boolean
): Promise<void> {
  try {
    console.log(
      `[Premium Access] User ${userId} attempted to access ${resourceType} ${resourceId}: ${
        allowed ? "ALLOWED" : "DENIED"
      }`
    );
    // In production, store this in an audit log table
  } catch (error) {
    console.error("[Premium Access] Error logging access attempt:", error);
  }
}
