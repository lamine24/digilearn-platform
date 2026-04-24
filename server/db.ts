import { eq, desc, asc, and, sql, like, or, count, sum, lt, ne } from "drizzle-orm";
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
