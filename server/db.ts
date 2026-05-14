import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, courses, categories, modules, enrollments,
  moduleProgress, payments, certificates, chatMessages, notifications,
  alumniProfiles, quizQuestions, moduleResources, InsertModuleResource, ModuleResource,
  studioProjects, studioDocuments, studioScenarios, InsertStudioProject, InsertStudioDocument, InsertStudioScenario
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { eq, and, desc, asc, or, like, sql } from 'drizzle-orm';


let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Categories ─────────────────────────────────────────────────
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(asc(categories.name));
}

// ─── Courses ────────────────────────────────────────────────────
export async function getPublishedCourses(categorySlug?: string, search?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(courses.status, "publie")];
  if (search) {
    conditions.push(or(like(courses.title, `%${search}%`), like(courses.tags, `%${search}%`))!);
  }
  const rows = await db.select({
    course: courses,
    category: categories,
  }).from(courses)
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(courses.createdAt));

  if (categorySlug) {
    return rows.filter(r => r.category?.slug === categorySlug);
  }
  return rows;
}

export async function getCourseBySlug(slug: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({
    course: courses,
    category: categories,
  }).from(courses)
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .where(eq(courses.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getCourseById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({
    course: courses,
    category: categories,
  }).from(courses)
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .where(eq(courses.id, id))
    .limit(1);
  return rows[0] ?? null;
}

// ─── Studio Projects ────────────────────────────────────────────
export async function createStudioProject(userId: number, data: Omit<InsertStudioProject, 'userId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.insert(studioProjects).values({
    ...data,
    userId,
  });
  
  return result[0].insertId;
}

export async function getStudioProject(projectId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(studioProjects)
    .where(and(eq(studioProjects.id, projectId), eq(studioProjects.userId, userId)))
    .limit(1);
  
  return result[0] ?? null;
}

export async function listStudioProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(studioProjects)
    .where(eq(studioProjects.userId, userId))
    .orderBy(desc(studioProjects.createdAt));
}

export async function updateStudioProject(projectId: number, userId: number, data: Partial<InsertStudioProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  await db.update(studioProjects)
    .set(data)
    .where(and(eq(studioProjects.id, projectId), eq(studioProjects.userId, userId)));
}

// ─── Studio Documents ───────────────────────────────────────────
export async function createStudioDocument(projectId: number, data: Omit<InsertStudioDocument, 'projectId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.insert(studioDocuments).values({
    ...data,
    projectId,
  });
  
  return (result as any).insertId || result[0]?.insertId;
}

export async function getStudioDocuments(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(studioDocuments)
    .where(eq(studioDocuments.projectId, projectId))
    .orderBy(desc(studioDocuments.uploadedAt));
}

// ─── Studio Scenarios ───────────────────────────────────────────
export async function createStudioScenario(projectId: number, data: Omit<InsertStudioScenario, 'projectId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  const result = await db.insert(studioScenarios).values({
    ...data,
    projectId,
  });
  
  return result[0].insertId;
}

export async function getStudioScenario(scenarioId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(studioScenarios)
    .where(eq(studioScenarios.id, scenarioId))
    .limit(1);
  
  return result[0] ?? null;
}

export async function listStudioScenarios(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(studioScenarios)
    .where(eq(studioScenarios.projectId, projectId))
    .orderBy(desc(studioScenarios.generatedAt));
}


// ─── Premium Subscription ────────────────────────────────────────
export async function getPremiumSubscriptionStatus(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.execute(
      sql`SELECT * FROM premium_subscriptions WHERE userId = ${userId} AND status = 'active' ORDER BY endDate DESC LIMIT 1`
    );
    
    // Handle different result formats from MySQL/TiDB
    let rows: any[] = [];
    if (Array.isArray(result) && result.length === 2 && Array.isArray(result[0])) {
      rows = result[0];
    } else if (Array.isArray(result)) {
      rows = result;
    } else if (result && typeof result === 'object' && Array.isArray(result.rows)) {
      rows = result.rows;
    }
    
    if (rows.length === 0) return null;
    
    const subscription = rows[0];
    const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
    const isActive = endDate ? endDate > new Date() : false;
    const daysRemaining = endDate ? Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    return {
      id: subscription.id,
      userId: subscription.userId,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      isActive,
      daysRemaining: Math.max(0, daysRemaining),
    };
  } catch (error) {
    console.error("[Database] Failed to get premium subscription status:", error);
    return null;
  }
}


// Missing functions for courses and modules
export async function getModulesByCourse(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(modules).where(eq(modules.courseId, courseId));
  } catch (error) {
    console.error("[Database] Failed to get modules by course:", error);
    return [];
  }
}

export async function getModuleById(id: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(modules).where(eq(modules.id, id));
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get module:", error);
    return null;
  }
}

export async function updateUserActivity(userId: number) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, userId));
  } catch (error) {
    console.error("[Database] Failed to update user activity:", error);
  }
}

export async function createCategory(data: { name: string; slug: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  try {
    const result = await db.insert(categories).values(data);
    return result.insertId;
  } catch (error) {
    console.error("[Database] Failed to create category:", error);
    throw error;
  }
}

export async function getPaymentHistory(userId: number, limit = 10, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(payments).where(eq(payments.userId, userId)).limit(limit).offset(offset);
  } catch (error) {
    console.error("[Database] Failed to get payment history:", error);
    return [];
  }
}

export async function getPaymentHistoryCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  try {
    const result = await db.select({ count: sql<number>`COUNT(*)` }).from(payments).where(eq(payments.userId, userId));
    return result[0]?.count || 0;
  } catch (error) {
    console.error("[Database] Failed to get payment history count:", error);
    return 0;
  }
}

export async function getAllPremiumSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  try {
    // Assuming there's a subscriptions table or similar
    // This is a placeholder - adjust based on your actual schema
    return [];
  } catch (error) {
    console.error("[Database] Failed to get premium subscriptions:", error);
    return [];
  }
}


export async function getPendingNotifications() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(notifications).where(eq(notifications.status, 'pending'));
  } catch (error) {
    console.error("[Database] Failed to get pending notifications:", error);
    return [];
  }
}

export async function updateNotificationStatus(notificationId: number, status: string) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(notifications).set({ status }).where(eq(notifications.id, notificationId));
  } catch (error) {
    console.error("[Database] Failed to update notification status:", error);
  }
}


export async function getInactiveUsers(days: number = 3) {
  const db = await getDb();
  if (!db) return [];
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return await db.select().from(users).where(
      or(
        eq(users.lastActiveAt, null),
        sql`${users.lastActiveAt} < ${cutoffDate}`
      )
    );
  } catch (error) {
    console.error("[Database] Failed to get inactive users:", error);
    return [];
  }
}


export async function hasNotificationBeenSent(userId: number, subscriptionId: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    const result = await db.select().from(notifications).where(
      and(
        eq(notifications.userId, userId),
        sql`JSON_EXTRACT(${notifications.metadata}, '$.subscriptionId') = ${subscriptionId}`
      )
    );
    return result.length > 0;
  } catch (error) {
    console.error("[Database] Failed to check notification:", error);
    return false;
  }
}

export async function createNotificationRecord(data: {
  userId: number;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(notifications).values({
      userId: data.userId,
      title: data.title,
      message: data.message,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      status: 'pending',
      createdAt: new Date(),
    });
    return result.insertId;
  } catch (error) {
    console.error("[Database] Failed to create notification:", error);
    return null;
  }
}


// ─── Payment Functions ──────────────────────────────────────────

export async function getPaymentByRef(ref: string) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(payments).where(eq(payments.reference, ref)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get payment by ref:", error);
    return null;
  }
}

export async function updatePaymentStatus(paymentId: number, status: string, paidAt?: Date) {
  const db = await getDb();
  if (!db) return;
  try {
    const updateData: any = { status };
    if (paidAt) updateData.paidAt = paidAt;
    await db.update(payments).set(updateData).where(eq(payments.id, paymentId));
  } catch (error) {
    console.error("[Database] Failed to update payment status:", error);
  }
}

export async function recordPaymentError(paymentId: number, errorMessage: string, retryCount: number) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(payments).set({
      status: 'echoue',
    }).where(eq(payments.id, paymentId));
  } catch (error) {
    console.error("[Database] Failed to record payment error:", error);
  }
}

export async function getUserPayments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get user payments:", error);
    return [];
  }
}

export async function getAllPayments() {
  const db = await getDb();
  if (!db) return [];
  try {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get all payments:", error);
    return [];
  }
}

// ─── Enrollment Functions ───────────────────────────────────────

export async function getEnrollment(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
      .limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get enrollment:", error);
    return null;
  }
}

export async function createEnrollment(data: { userId: number; courseId: number; status: string }) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(enrollments).values({
      userId: data.userId,
      courseId: data.courseId,
      status: data.status as any,
      enrolledAt: new Date(),
    });
    return result.insertId;
  } catch (error) {
    console.error("[Database] Failed to create enrollment:", error);
    return null;
  }
}

export async function updateEnrollment(enrollmentId: number, data: any) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(enrollments).set(data).where(eq(enrollments.id, enrollmentId));
  } catch (error) {
    console.error("[Database] Failed to update enrollment:", error);
  }
}

// ─── Certificate Functions ──────────────────────────────────────

export async function createCertificate(data: {
  userId: number;
  courseId: number;
  enrollmentId: number;
  certificateCode: string;
  pdfUrl: string;
  pdfKey: string;
}) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(certificates).values({
      userId: data.userId,
      courseId: data.courseId,
      enrollmentId: data.enrollmentId,
      certificateCode: data.certificateCode,
      pdfUrl: data.pdfUrl,
      pdfKey: data.pdfKey,
      issuedAt: new Date(),
      createdAt: new Date(),
    });
    return result.insertId;
  } catch (error) {
    console.error("[Database] Failed to create certificate:", error);
    return null;
  }
}

// ─── Premium Subscription Functions ──────────────────────────────

export async function createPremiumSubscription(userId: number, paymentId: string) {
  const db = await getDb();
  if (!db) return null;
  try {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    
    const result = await db.insert(premiumSubscriptions).values({
      userId,
      paymentId,
      startDate: new Date(),
      endDate,
      status: 'active',
      autoRenew: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result.insertId;
  } catch (error) {
    console.error("[Database] Failed to create premium subscription:", error);
    return null;
  }
}


// ─── Subscription Notification Functions ────────────────────────

export async function getExpiringSubscriptions(daysUntilExpiry: number = 7) {
  const db = await getDb();
  if (!db) return [];
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysUntilExpiry);
    
    const result = await db.select({
      id: premiumSubscriptions.id,
      userId: premiumSubscriptions.userId,
      endDate: premiumSubscriptions.endDate,
      status: premiumSubscriptions.status,
      userName: users.name,
      userEmail: users.email,
      daysRemaining: sql<number>`DATEDIFF(${premiumSubscriptions.endDate}, NOW())`,
    })
    .from(premiumSubscriptions)
    .innerJoin(users, eq(premiumSubscriptions.userId, users.id))
    .where(
      and(
        eq(premiumSubscriptions.status, 'active'),
        sql`${premiumSubscriptions.endDate} IS NOT NULL`,
        sql`${premiumSubscriptions.endDate} > NOW()`,
        sql`${premiumSubscriptions.endDate} <= ${cutoffDate}`
      )
    );
    
    return result;
  } catch (error) {
    console.error("[Database] Failed to get expiring subscriptions:", error);
    return [];
  }
}

export async function getExpiredSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  try {
    const result = await db.select({
      id: premiumSubscriptions.id,
      userId: premiumSubscriptions.userId,
      endDate: premiumSubscriptions.endDate,
      status: premiumSubscriptions.status,
      userName: users.name,
      userEmail: users.email,
    })
    .from(premiumSubscriptions)
    .innerJoin(users, eq(premiumSubscriptions.userId, users.id))
    .where(
      and(
        eq(premiumSubscriptions.status, 'active'),
        sql`${premiumSubscriptions.endDate} IS NOT NULL`,
        sql`${premiumSubscriptions.endDate} <= NOW()`
      )
    );
    
    return result;
  } catch (error) {
    console.error("[Database] Failed to get expired subscriptions:", error);
    return [];
  }
}

export async function createSubscriptionNotification(data: {
  subscriptionId: number;
  userId: number;
  notificationType: 'expiring_soon' | 'expired' | 'renewal_reminder';
  daysBeforeExpiry?: number;
}) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(subscriptionNotifications).values({
      subscriptionId: data.subscriptionId,
      userId: data.userId,
      notificationType: data.notificationType,
      daysBeforeExpiry: data.daysBeforeExpiry || null,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return result.insertId;
  } catch (error) {
    console.error("[Database] Failed to create subscription notification:", error);
    return null;
  }
}

export async function hasSubscriptionNotificationBeenSent(
  subscriptionId: number,
  notificationType: 'expiring_soon' | 'expired' | 'renewal_reminder'
) {
  const db = await getDb();
  if (!db) return false;
  try {
    const result = await db.select()
      .from(subscriptionNotifications)
      .where(
        and(
          eq(subscriptionNotifications.subscriptionId, subscriptionId),
          eq(subscriptionNotifications.notificationType, notificationType),
          eq(subscriptionNotifications.status, 'sent')
        )
      )
      .limit(1);
    
    return result.length > 0;
  } catch (error) {
    console.error("[Database] Failed to check subscription notification:", error);
    return false;
  }
}

export async function updateSubscriptionNotificationStatus(
  subscriptionNotificationId: number,
  status: 'pending' | 'sent' | 'failed',
  errorMessage?: string
) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.update(subscriptionNotifications)
      .set({
        status,
        errorMessage: errorMessage || null,
        sentAt: status === 'sent' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionNotifications.id, subscriptionNotificationId));
  } catch (error) {
    console.error("[Database] Failed to update subscription notification status:", error);
  }
}


export async function createNotification(data: {
  userId: number;
  type?: string;
  title: string;
  message: string;
}) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(notifications).values({
      userId: data.userId,
      type: (data.type as any) || 'general',
      title: data.title,
      message: data.message,
      isRead: false,
      sentAt: new Date(),
      createdAt: new Date(),
    });
    return result.insertId;
  } catch (error) {
    console.error("[Database] Failed to create notification:", error);
    return null;
  }
}
