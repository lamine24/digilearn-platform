import { eq, desc, asc, and, sql, like, or, count, sum, lt, ne, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, courses, categories, modules, enrollments,
  moduleProgress, payments, certificates, chatMessages, notifications,
  alumniProfiles, quizQuestions, moduleResources, InsertModuleResource, ModuleResource
} from "../drizzle/schema";
import { ENV } from './_core/env';

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
  const rows = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getAllCourses() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ course: courses, category: categories })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .orderBy(desc(courses.createdAt));
}

export async function createCourse(data: typeof courses.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(courses).values(data);
  return result[0].insertId;
}

export async function updateCourse(id: number, data: Partial<typeof courses.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(courses).set(data).where(eq(courses.id, id));
}

export async function deleteCourse(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(courses).where(eq(courses.id, id));
}

// ─── Modules ────────────────────────────────────────────────────
export async function getModulesByCourse(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(modules).where(eq(modules.courseId, courseId)).orderBy(asc(modules.sortOrder));
}

export async function createModule(data: typeof modules.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(modules).values(data);
  return result[0].insertId;
}

export async function updateModule(id: number, data: Partial<typeof modules.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(modules).set(data).where(eq(modules.id, id));
}

export async function deleteModule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(modules).where(eq(modules.id, id));
}

// ─── Enrollments ────────────────────────────────────────────────
export async function getUserEnrollments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ enrollment: enrollments, course: courses, category: categories })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .where(eq(enrollments.userId, userId))
    .orderBy(desc(enrollments.enrolledAt));
}

export async function getEnrollment(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createEnrollment(data: typeof enrollments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(enrollments).values(data);
  return result[0].insertId;
}

export async function updateEnrollment(id: number, data: Partial<typeof enrollments.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(enrollments).set(data).where(eq(enrollments.id, id));
}

// ─── Module Progress ────────────────────────────────────────────
export async function getUserModuleProgress(userId: number, courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(moduleProgress)
    .where(and(eq(moduleProgress.userId, userId), eq(moduleProgress.courseId, courseId)));
}

export async function upsertModuleProgress(data: typeof moduleProgress.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(moduleProgress)
    .where(and(eq(moduleProgress.userId, data.userId), eq(moduleProgress.moduleId, data.moduleId)))
    .limit(1);
  if (existing.length > 0) {
    await db.update(moduleProgress).set({
      completed: data.completed,
      score: data.score,
      timeSpent: data.timeSpent,
      completedAt: data.completedAt,
    }).where(eq(moduleProgress.id, existing[0].id));
    return existing[0].id;
  }
  const result = await db.insert(moduleProgress).values(data);
  return result[0].insertId;
}

// ─── Payments ───────────────────────────────────────────────────
export async function createPayment(data: typeof payments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(payments).values(data);
  return result[0].insertId;
}

export async function getPaymentByRef(ref: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(payments).where(eq(payments.transactionRef, ref)).limit(1);
  return rows[0] ?? null;
}

export async function updatePaymentStatus(id: number, status: "en_attente" | "reussi" | "echoue" | "rembourse", paidAt?: Date) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const data: Record<string, unknown> = { status };
  if (paidAt) data.paidAt = paidAt;
  await db.update(payments).set(data).where(eq(payments.id, id));
}

export async function getUserPayments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ payment: payments, course: courses })
    .from(payments)
    .innerJoin(courses, eq(payments.courseId, courses.id))
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt));
}

// ─── Certificates ───────────────────────────────────────────────
export async function createCertificate(data: typeof certificates.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(certificates).values(data);
  return result[0].insertId;
}

export async function getCertificateByCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ cert: certificates, user: users, course: courses })
    .from(certificates)
    .innerJoin(users, eq(certificates.userId, users.id))
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .where(eq(certificates.certificateCode, code))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUserCertificates(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ cert: certificates, course: courses })
    .from(certificates)
    .innerJoin(courses, eq(certificates.courseId, courses.id))
    .where(eq(certificates.userId, userId))
    .orderBy(desc(certificates.issuedAt));
}

export async function incrementCertificateVerification(code: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(certificates)
    .set({ verifiedCount: sql`${certificates.verifiedCount} + 1` })
    .where(eq(certificates.certificateCode, code));
}

// ─── Chat Messages ──────────────────────────────────────────────
export async function getChatHistory(sessionId: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(asc(chatMessages.createdAt))
    .limit(limit);
}

export async function saveChatMessage(data: typeof chatMessages.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(chatMessages).values(data);
  return result[0].insertId;
}

// ─── Notifications ──────────────────────────────────────────────
export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function createNotification(data: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(notifications).values(data);
  return result[0].insertId;
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(notifications).set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

// ─── Alumni ─────────────────────────────────────────────────────
export async function getAlumniDirectory() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ profile: alumniProfiles, user: users })
    .from(alumniProfiles)
    .innerJoin(users, eq(alumniProfiles.userId, users.id))
    .where(eq(alumniProfiles.isVisible, true))
    .orderBy(desc(alumniProfiles.createdAt));
}

export async function upsertAlumniProfile(userId: number, data: Partial<typeof alumniProfiles.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(alumniProfiles).where(eq(alumniProfiles.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(alumniProfiles).set(data).where(eq(alumniProfiles.userId, userId));
    return existing[0].id;
  }
  const result = await db.insert(alumniProfiles).values({ userId, ...data });
  return result[0].insertId;
}

// ─── Admin KPIs ─────────────────────────────────────────────────
export async function getAdminStats() {
  const db = await getDb();
  if (!db) return { totalUsers: 0, totalEnrollments: 0, totalRevenue: "0", completionRate: 0, totalCourses: 0 };

  const [userCount] = await db.select({ count: count() }).from(users);
  const [enrollmentCount] = await db.select({ count: count() }).from(enrollments);
  const [courseCount] = await db.select({ count: count() }).from(courses);
  const [revenue] = await db.select({ total: sum(payments.amount) }).from(payments).where(eq(payments.status, "reussi"));
  const [completedCount] = await db.select({ count: count() }).from(enrollments).where(eq(enrollments.status, "complete"));

  const totalEnrollments = enrollmentCount.count || 0;
  const completed = completedCount.count || 0;
  const completionRate = totalEnrollments > 0 ? Math.round((completed / totalEnrollments) * 100) : 0;

  return {
    totalUsers: userCount.count || 0,
    totalEnrollments: totalEnrollments,
    totalRevenue: revenue.total || "0",
    completionRate,
    totalCourses: courseCount.count || 0,
  };
}

export async function getRecentEnrollments(limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ enrollment: enrollments, user: users, course: courses })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.userId, users.id))
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .orderBy(desc(enrollments.enrolledAt))
    .limit(limit);
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "admin" | "formateur" | "apprenant" | "alumni" | "prospect") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ─── Formateur ──────────────────────────────────────────────────
export async function getFormateurCourses(formateurId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ course: courses, category: categories })
    .from(courses)
    .leftJoin(categories, eq(courses.categoryId, categories.id))
    .where(eq(courses.formateurId, formateurId))
    .orderBy(desc(courses.createdAt));
}

export async function getCourseEnrollments(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ enrollment: enrollments, user: users })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.userId, users.id))
    .where(eq(enrollments.courseId, courseId))
    .orderBy(desc(enrollments.enrolledAt));
}

// ─── Inactivity check ──────────────────────────────────────────
export async function getInactiveUsers(daysSinceActive: number) {
  const db = await getDb();
  if (!db) return [];
  const cutoff = new Date(Date.now() - daysSinceActive * 24 * 60 * 60 * 1000);
  return db.select().from(users)
    .where(and(
      lt(users.lastActiveAt, cutoff),
      ne(users.role, "admin"),
      ne(users.role, "prospect")
    ));
}

// ─── Quiz Questions ─────────────────────────────────────────────
export async function getQuizQuestions(moduleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizQuestions)
    .where(eq(quizQuestions.moduleId, moduleId))
    .orderBy(asc(quizQuestions.sortOrder));
}

export async function createQuizQuestion(data: typeof quizQuestions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(quizQuestions).values(data);
  return result[0].insertId;
}

export async function updateUserActivity(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastActiveAt: new Date() }).where(eq(users.id, userId));
}

export async function getAllPayments() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ payment: payments, user: users, course: courses })
    .from(payments)
    .innerJoin(users, eq(payments.userId, users.id))
    .innerJoin(courses, eq(payments.courseId, courses.id))
    .orderBy(desc(payments.createdAt));
}

export async function createCategory(data: typeof categories.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(categories).values(data);
  return result[0].insertId;
}


// ─── Module Resources ───────────────────────────────────────────
export async function createModuleResource(data: InsertModuleResource) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(moduleResources).values(data);
  return result[0].insertId;
}

export async function getModuleResources(moduleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(moduleResources)
    .where(eq(moduleResources.moduleId, moduleId))
    .orderBy(asc(moduleResources.sortOrder));
}

export async function updateModuleResource(id: number, data: Partial<ModuleResource>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(moduleResources).set(data).where(eq(moduleResources.id, id));
}

export async function deleteModuleResource(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(moduleResources).where(eq(moduleResources.id, id));
}

export async function reorderModuleResources(moduleId: number, resourceIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  for (let i = 0; i < resourceIds.length; i++) {
    await db.update(moduleResources).set({ sortOrder: i }).where(eq(moduleResources.id, resourceIds[i]));
  }
}


// ─── Formateur Stats ─────────────────────────────────────────────
export async function getFormateurStats(formateurId: number) {
  const db = await getDb();
  if (!db) return { totalCourses: 0, publishedCourses: 0, totalEnrollments: 0, avgCompletion: 0 };
  
  try {
    // Get all courses for this formateur
    const userCourses = await db.select({ id: courses.id }).from(courses)
      .where(eq(courses.formateurId, formateurId));
    
    const courseIds = userCourses.map(c => c.id);
    if (courseIds.length === 0) {
      return { totalCourses: 0, publishedCourses: 0, totalEnrollments: 0, avgCompletion: 0 };
    }
    
    // Count published courses
    const publishedCount = await db.select({ count: count() }).from(courses)
      .where(and(eq(courses.formateurId, formateurId), eq(courses.status, "publie")));
    
    // Count total enrollments
    const enrollmentCount = await db.select({ count: count() }).from(enrollments)
      .where(inArray(enrollments.courseId, courseIds));
    
    // Calculate average completion
    const completionData = await db.select({ progress: enrollments.progress }).from(enrollments)
      .where(inArray(enrollments.courseId, courseIds));
    
    const avgCompletion = completionData.length > 0
      ? Math.round(completionData.reduce((sum, e) => sum + e.progress, 0) / completionData.length)
      : 0;
    
    return {
      totalCourses: userCourses.length,
      publishedCourses: publishedCount[0]?.count || 0,
      totalEnrollments: enrollmentCount[0]?.count || 0,
      avgCompletion,
    };
  } catch (error) {
    console.error("[Database] Failed to get formateur stats:", error);
    return { totalCourses: 0, publishedCourses: 0, totalEnrollments: 0, avgCompletion: 0 };
  }
}


// ─── Premium Subscriptions ──────────────────────────────────────
export async function getPremiumSubscriptionStatus(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const { premiumSubscriptions } = await import("../drizzle/schema");
    const subscription = await db.select().from(premiumSubscriptions)
      .where(eq(premiumSubscriptions.userId, userId))
      .limit(1);
    
    if (subscription.length === 0) return null;
    
    const sub = subscription[0];
    const now = new Date();
    const isExpired = sub.endDate && new Date(sub.endDate) < now;
    
    return {
      ...sub,
      isActive: sub.status === "active" && !isExpired,
      isExpired,
      daysRemaining: sub.endDate ? Math.ceil((new Date(sub.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null,
    };
  } catch (error) {
    console.error("[Database] Failed to get premium subscription status:", error);
    return null;
  }
}

export async function createPremiumSubscription(userId: number, paymentId: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  
  try {
    const { premiumSubscriptions } = await import("../drizzle/schema");
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    await db.insert(premiumSubscriptions).values({
      userId,
      price: "10000.00",
      currency: "XOF",
      startDate,
      endDate,
      status: "active",
      paymentId,
      autoRenew: true,
    }).onDuplicateKeyUpdate({
      set: {
        startDate,
        endDate,
        status: "active",
        paymentId,
        autoRenew: true,
      },
    });
    
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to create premium subscription:", error);
    throw error;
  }
}

export async function cancelPremiumSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  
  try {
    const { premiumSubscriptions } = await import("../drizzle/schema");
    await db.update(premiumSubscriptions)
      .set({ status: "cancelled", autoRenew: false })
      .where(eq(premiumSubscriptions.userId, userId));
    
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to cancel premium subscription:", error);
    throw error;
  }
}


// ─── Payment Retry & Error Handling ─────────────────────────────
export async function recordPaymentError(paymentId: number, error: string, retryCount: number = 0) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  
  try {
    // Store error in a structured way by updating payment metadata
    const payment = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (payment.length > 0) {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error,
        retryCount,
      };
      
      // Update payment with error metadata
      await db.update(payments).set({
        status: "echoue",
      }).where(eq(payments.id, paymentId));
      
      console.error(`[Payment Error] Payment ${paymentId}: ${error} (Retry count: ${retryCount})`);
    }
  } catch (err) {
    console.error("[Database] Failed to record payment error:", err);
  }
}

export async function getFailedPayments(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const failedPayments = await db.select().from(payments)
      .where(eq(payments.status, "echoue"))
      .orderBy(desc(payments.createdAt))
      .limit(limit);
    
    return failedPayments;
  } catch (error) {
    console.error("[Database] Failed to get failed payments:", error);
    return [];
  }
}

export async function retryFailedPayment(paymentId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  
  try {
    // Reset payment status to pending for retry
    await db.update(payments).set({
      status: "en_attente",
    }).where(eq(payments.id, paymentId));
    
    console.log(`[Payment Retry] Payment ${paymentId} marked for retry`);
    return true;
  } catch (error) {
    console.error("[Database] Failed to retry payment:", error);
    return false;
  }
}

export async function getAllPaymentsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    return await db.select().from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get user payments:", error);
    return [];
  }
}


// ─── Admin Subscription Management ──────────────────────────────

export async function getAllPremiumSubscriptions(limit = 100, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const { premiumSubscriptions, users } = await import("../drizzle/schema");
    const { desc } = await import("drizzle-orm");
    
    const subscriptions = await db
      .select({
        id: premiumSubscriptions.id,
        userId: premiumSubscriptions.userId,
        userName: users.name,
        userEmail: users.email,
        price: premiumSubscriptions.price,
        currency: premiumSubscriptions.currency,
        startDate: premiumSubscriptions.startDate,
        endDate: premiumSubscriptions.endDate,
        status: premiumSubscriptions.status,
        paymentId: premiumSubscriptions.paymentId,
        autoRenew: premiumSubscriptions.autoRenew,
        createdAt: premiumSubscriptions.createdAt,
        updatedAt: premiumSubscriptions.updatedAt,
      })
      .from(premiumSubscriptions)
      .leftJoin(users, eq(premiumSubscriptions.userId, users.id))
      .orderBy(desc(premiumSubscriptions.createdAt))
      .limit(limit)
      .offset(offset);
    
    return subscriptions;
  } catch (error) {
    console.error("[Database] Failed to get all premium subscriptions:", error);
    return [];
  }
}

export async function getPremiumSubscriptionsCount() {
  const db = await getDb();
  if (!db) return 0;
  
  try {
    const { premiumSubscriptions } = await import("../drizzle/schema");
    const { count } = await import("drizzle-orm");
    
    const result = await db
      .select({ count: count() })
      .from(premiumSubscriptions);
    
    return result[0]?.count || 0;
  } catch (error) {
    console.error("[Database] Failed to count premium subscriptions:", error);
    return 0;
  }
}

export async function getPremiumSubscriptionStats() {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const { premiumSubscriptions } = await import("../drizzle/schema");
    const { count, sql } = await import("drizzle-orm");
    
    const now = new Date();
    
    // Get counts by status
    const stats = await db
      .select({
        status: premiumSubscriptions.status,
        count: count(),
      })
      .from(premiumSubscriptions)
      .groupBy(premiumSubscriptions.status);
    
    // Get active subscriptions count
    const activeCount = await db
      .select({ count: count() })
      .from(premiumSubscriptions)
      .where(eq(premiumSubscriptions.status, "active"));
    
    // Get expiring soon (within 7 days)
    const expiringCount = await db
      .select({ count: count() })
      .from(premiumSubscriptions)
      .where(
        and(
          eq(premiumSubscriptions.status, "active"),
          sql`${premiumSubscriptions.endDate} > ${now} AND ${premiumSubscriptions.endDate} < DATE_ADD(${now}, INTERVAL 7 DAY)`
        )
      );
    
    // Get total revenue
    const revenue = await db
      .select({
        total: sql<string>`SUM(CAST(${premiumSubscriptions.price} AS DECIMAL(10,2)))`,
      })
      .from(premiumSubscriptions)
      .where(eq(premiumSubscriptions.status, "active"));
    
    return {
      byStatus: stats,
      activeCount: activeCount[0]?.count || 0,
      expiringCount: expiringCount[0]?.count || 0,
      totalRevenue: revenue[0]?.total || "0",
    };
  } catch (error) {
    console.error("[Database] Failed to get premium subscription stats:", error);
    return null;
  }
}

export async function renewPremiumSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  
  try {
    const { premiumSubscriptions } = await import("../drizzle/schema");
    const now = new Date();
    const newEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    await db.update(premiumSubscriptions)
      .set({
        startDate: now,
        endDate: newEndDate,
        status: "active",
        autoRenew: true,
        updatedAt: now,
      })
      .where(eq(premiumSubscriptions.userId, userId));
    
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to renew premium subscription:", error);
    throw error;
  }
}

export async function searchPremiumSubscriptions(query: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const { premiumSubscriptions, users } = await import("../drizzle/schema");
    const { desc, or, like } = await import("drizzle-orm");
    
    const subscriptions = await db
      .select({
        id: premiumSubscriptions.id,
        userId: premiumSubscriptions.userId,
        userName: users.name,
        userEmail: users.email,
        price: premiumSubscriptions.price,
        currency: premiumSubscriptions.currency,
        startDate: premiumSubscriptions.startDate,
        endDate: premiumSubscriptions.endDate,
        status: premiumSubscriptions.status,
        paymentId: premiumSubscriptions.paymentId,
        autoRenew: premiumSubscriptions.autoRenew,
        createdAt: premiumSubscriptions.createdAt,
        updatedAt: premiumSubscriptions.updatedAt,
      })
      .from(premiumSubscriptions)
      .leftJoin(users, eq(premiumSubscriptions.userId, users.id))
      .where(
        or(
          like(users.name, `%${query}%`),
          like(users.email, `%${query}%`),
          like(premiumSubscriptions.paymentId, `%${query}%`)
        )
      )
      .orderBy(desc(premiumSubscriptions.createdAt))
      .limit(limit);
    
    return subscriptions;
  } catch (error) {
    console.error("[Database] Failed to search premium subscriptions:", error);
    return [];
  }
}


// ─── Subscription Notification Tracking ────────────────────────────

export async function getExpiringSubscriptions(daysThreshold = 7) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const { premiumSubscriptions, users } = await import("../drizzle/schema");
    const { sql, and, eq } = await import("drizzle-orm");
    
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);
    
    const expiringSubscriptions = await db
      .select({
        id: premiumSubscriptions.id,
        userId: premiumSubscriptions.userId,
        userName: users.name,
        userEmail: users.email,
        endDate: premiumSubscriptions.endDate,
        daysRemaining: sql<number>`CEIL((UNIX_TIMESTAMP(${premiumSubscriptions.endDate}) - UNIX_TIMESTAMP(${now})) / 86400)`,
      })
      .from(premiumSubscriptions)
      .leftJoin(users, eq(premiumSubscriptions.userId, users.id))
      .where(
        and(
          eq(premiumSubscriptions.status, "active"),
          sql`${premiumSubscriptions.endDate} > ${now}`,
          sql`${premiumSubscriptions.endDate} <= ${thresholdDate}`
        )
      );
    
    return expiringSubscriptions;
  } catch (error) {
    console.error("[Database] Failed to get expiring subscriptions:", error);
    return [];
  }
}

export async function createNotificationRecord(
  subscriptionId: number,
  userId: number,
  notificationType: "expiring_soon" | "expired" | "renewal_reminder",
  daysBeforeExpiry: number | null = null
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  
  try {
    const { subscriptionNotifications } = await import("../drizzle/schema");
    
    await db.insert(subscriptionNotifications).values({
      subscriptionId,
      userId,
      notificationType,
      daysBeforeExpiry,
      status: "pending",
    });
    
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to create notification record:", error);
    throw error;
  }
}

export async function updateNotificationStatus(
  notificationId: number,
  status: "pending" | "sent" | "failed",
  errorMessage: string | null = null
) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  
  try {
    const { subscriptionNotifications } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    await db.update(subscriptionNotifications)
      .set({
        status,
        errorMessage,
        sentAt: status === "sent" ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionNotifications.id, notificationId));
    
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to update notification status:", error);
    throw error;
  }
}

export async function getPendingNotifications() {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const { subscriptionNotifications, premiumSubscriptions, users } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    
    const pending = await db
      .select({
        id: subscriptionNotifications.id,
        subscriptionId: subscriptionNotifications.subscriptionId,
        userId: subscriptionNotifications.userId,
        notificationType: subscriptionNotifications.notificationType,
        daysBeforeExpiry: subscriptionNotifications.daysBeforeExpiry,
        userName: users.name,
        userEmail: users.email,
        endDate: premiumSubscriptions.endDate,
      })
      .from(subscriptionNotifications)
      .leftJoin(users, eq(subscriptionNotifications.userId, users.id))
      .leftJoin(premiumSubscriptions, eq(subscriptionNotifications.subscriptionId, premiumSubscriptions.id))
      .where(eq(subscriptionNotifications.status, "pending"))
      .limit(100);
    
    return pending;
  } catch (error) {
    console.error("[Database] Failed to get pending notifications:", error);
    return [];
  }
}

export async function hasNotificationBeenSent(
  subscriptionId: number,
  notificationType: "expiring_soon" | "expired" | "renewal_reminder",
  daysBeforeExpiry: number | null = null
) {
  const db = await getDb();
  if (!db) return false;
  
  try {
    const { subscriptionNotifications } = await import("../drizzle/schema");
    const { and, eq } = await import("drizzle-orm");
    
    const existing = await db
      .select({ id: subscriptionNotifications.id })
      .from(subscriptionNotifications)
      .where(
        and(
          eq(subscriptionNotifications.subscriptionId, subscriptionId),
          eq(subscriptionNotifications.notificationType, notificationType),
          eq(subscriptionNotifications.status, "sent")
        )
      )
      .limit(1);
    
    return existing.length > 0;
  } catch (error) {
    console.error("[Database] Failed to check notification sent status:", error);
    return false;
  }
}


export async function getExpiredSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const { premiumSubscriptions, users } = await import("../drizzle/schema");
    const { and, eq, sql } = await import("drizzle-orm");
    
    const now = new Date();
    
    const expiredSubscriptions = await db
      .select({
        id: premiumSubscriptions.id,
        userId: premiumSubscriptions.userId,
        userName: users.name,
        userEmail: users.email,
        endDate: premiumSubscriptions.endDate,
      })
      .from(premiumSubscriptions)
      .leftJoin(users, eq(premiumSubscriptions.userId, users.id))
      .where(
        and(
          eq(premiumSubscriptions.status, "active"),
          sql`${premiumSubscriptions.endDate} <= ${now}`
        )
      );
    
    return expiredSubscriptions;
  } catch (error) {
    console.error("[Database] Failed to get expired subscriptions:", error);
    return [];
  }
}
