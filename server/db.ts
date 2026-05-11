import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, courses, categories, modules, enrollments,
  moduleProgress, payments, certificates, chatMessages, notifications,
  alumniProfiles, quizQuestions, moduleResources, InsertModuleResource, ModuleResource,
  studioProjects, studioDocuments, studioScenarios, InsertStudioProject, InsertStudioDocument, InsertStudioScenario
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { eq, and, desc, asc, or, like, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/mysql2';


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
  
  return result[0].insertId;
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
