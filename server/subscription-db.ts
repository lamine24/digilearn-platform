import { getDb } from "./db";

/**
 * Check if user has active premium subscription
 */
export async function checkUserPremiumStatus(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const result = await db.execute(
      `SELECT COUNT(*) as count FROM subscriptions 
       WHERE userId = ${userId} AND status = 'active' AND endDate > NOW()`
    );
    return (result as any[])[0]?.count > 0;
  } catch (error) {
    console.error("[Database] Error checking premium status:", error);
    return false;
  }
}

/**
 * Get user's active subscription
 */
export async function getUserActiveSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.execute(
      `SELECT * FROM subscriptions 
       WHERE userId = ${userId} AND status = 'active' AND endDate > NOW()
       ORDER BY endDate DESC LIMIT 1`
    );
    return (result as any[])[0] || null;
  } catch (error) {
    console.error("[Database] Error getting user subscription:", error);
    return null;
  }
}

/**
 * Get all subscription plans
 */
export async function getSubscriptionPlans() {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.execute(
      `SELECT * FROM subscription_plans WHERE isActive = TRUE ORDER BY price ASC`
    );
    return result as any[];
  } catch (error) {
    console.error("[Database] Error getting subscription plans:", error);
    return [];
  }
}

/**
 * Get subscription plan by type
 */
export async function getSubscriptionPlanByType(type: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.execute(
      `SELECT * FROM subscription_plans WHERE type = '${type}' AND isActive = TRUE LIMIT 1`
    );
    return (result as any[])[0] || null;
  } catch (error) {
    console.error("[Database] Error getting subscription plan:", error);
    return null;
  }
}

/**
 * Create new subscription
 */
export async function createSubscription(data: {
  userId: number;
  subscriptionType: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  try {
    const plan = await getSubscriptionPlanByType(data.subscriptionType);
    if (!plan) throw new Error("Subscription plan not found");

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    const result = await db.execute(
      `INSERT INTO subscriptions 
       (userId, subscriptionType, status, startDate, endDate, amount, currency, paymentMethod, paymentStatus)
       VALUES (${data.userId}, '${data.subscriptionType}', 'pending', '${startDate.toISOString()}', '${endDate.toISOString()}', ${data.amount}, '${data.currency || 'XOF'}', '${data.paymentMethod || 'paytech'}', 'pending')`
    );

    return { id: (result as any).insertId, ...data };
  } catch (error) {
    console.error("[Database] Error creating subscription:", error);
    return null;
  }
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  subscriptionId: number,
  status: string,
  paymentStatus: string,
  paytechTransactionId?: string
) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.execute(
      `UPDATE subscriptions 
       SET status = '${status}', paymentStatus = '${paymentStatus}', paytechTransactionId = ${paytechTransactionId ? `'${paytechTransactionId}'` : 'NULL'}
       WHERE id = ${subscriptionId}`
    );

    // If subscription is activated, update user's isPremium flag
    if (status === 'active' && paymentStatus === 'completed') {
      const subscription = await db.execute(
        `SELECT userId FROM subscriptions WHERE id = ${subscriptionId} LIMIT 1`
      );
      const userId = (subscription as any[])[0]?.userId;
      if (userId) {
        await db.execute(`UPDATE users SET isPremium = TRUE WHERE id = ${userId}`);
      }
    }

    return true;
  } catch (error) {
    console.error("[Database] Error updating subscription:", error);
    return false;
  }
}

/**
 * Check if user has access to resource
 */
export async function checkResourceAccess(userId: number, resourceId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Check if user has active premium subscription
    const isPremium = await checkUserPremiumStatus(userId);
    if (!isPremium) return false;

    // Check if user has accessed this resource before
    const result = await db.execute(
      `SELECT COUNT(*) as count FROM resource_access 
       WHERE userId = ${userId} AND resourceId = ${resourceId}`
    );
    return (result as any[])[0]?.count > 0;
  } catch (error) {
    console.error("[Database] Error checking resource access:", error);
    return false;
  }
}

/**
 * Grant user access to resource
 */
export async function grantResourceAccess(userId: number, resourceId: number) {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.execute(
      `INSERT INTO resource_access (userId, resourceId) VALUES (${userId}, ${resourceId})
       ON DUPLICATE KEY UPDATE accessedAt = NOW()`
    );
    return true;
  } catch (error) {
    console.error("[Database] Error granting resource access:", error);
    return false;
  }
}

/**
 * Get user's accessed resources
 */
export async function getUserAccessedResources(userId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db.execute(
      `SELECT ra.*, fr.title, fr.slug, fr.platform 
       FROM resource_access ra
       JOIN free_resources fr ON ra.resourceId = fr.id
       WHERE ra.userId = ${userId}
       ORDER BY ra.accessedAt DESC`
    );
    return result as any[];
  } catch (error) {
    console.error("[Database] Error getting accessed resources:", error);
    return [];
  }
}
