import { getDb } from "./db";
import { externalCourses, subscriptions } from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";

// ─── External Courses ───────────────────────────────────────────
export async function getExternalCourses(filters?: {
  categoryId?: number;
  level?: string;
  source?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  let conditions = [eq(externalCourses.isActive, true)];

  if (filters?.categoryId) {
    conditions.push(eq(externalCourses.categoryId, filters.categoryId));
  }
  if (filters?.level) {
    conditions.push(eq(externalCourses.level, filters.level as any));
  }
  if (filters?.source) {
    conditions.push(eq(externalCourses.source, filters.source as any));
  }

  return db.select().from(externalCourses).where(and(...conditions));
}

export async function getExternalCourseBySlug(slug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db
    .select()
    .from(externalCourses)
    .where(and(eq(externalCourses.slug, slug), eq(externalCourses.isActive, true)))
    .limit(1);
  return result[0] || null;
}

export async function createExternalCourse(data: {
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  externalUrl: string;
  source: "udemy" | "coursera" | "youtube" | "other";
  categoryId?: number;
  level?: "debutant" | "intermediaire" | "avance";
  duration?: number;
  instructor?: string;
  rating?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(externalCourses).values([data]);
  return result;
}

export async function updateExternalCourse(
  id: number,
  data: Partial<typeof externalCourses.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(externalCourses).set(data).where(eq(externalCourses.id, id));
}

export async function deleteExternalCourse(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(externalCourses).set({ isActive: false }).where(eq(externalCourses.id, id));
}

// ─── Subscriptions ──────────────────────────────────────────────
export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const now = new Date();
  const result = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active" as any)
      )
    )
    .limit(1);
  return result[0] || null;
}

export async function createSubscription(data: {
  userId: number;
  planType: "monthly" | "yearly" | "lifetime";
  price: string;
  currency?: string;
  paymentId?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const endDate = new Date();
  if (data.planType === "monthly") {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (data.planType === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 100); // Lifetime
  }

  const result = await db.insert(subscriptions).values({
    userId: data.userId,
    planType: data.planType,
    price: data.price,
    currency: data.currency || "XOF",
    endDate,
    status: "active",
    paymentId: data.paymentId,
  });
  return result;
}

export async function cancelSubscription(subscriptionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(subscriptions)
    .set({ status: "cancelled" })
    .where(eq(subscriptions.id, subscriptionId));
}

export async function isUserSubscribed(userId: number): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return !!subscription;
}
