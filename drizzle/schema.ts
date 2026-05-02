import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

// ─── Users ──────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "formateur", "apprenant", "alumni", "prospect"]).default("prospect").notNull(),
  bio: text("bio"),
  phone: varchar("phone", { length: 32 }),
  avatarUrl: text("avatarUrl"),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Categories ─────────────────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  iconName: varchar("iconName", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Courses ────────────────────────────────────────────────────
export const courses = mysqlTable("courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  description: text("description"),
  shortDescription: text("shortDescription"),
  thumbnailUrl: text("thumbnailUrl"),
  categoryId: int("categoryId"),
  formateurId: int("formateurId"),
  price: decimal("price", { precision: 10, scale: 2 }).default("0.00").notNull(),
  currency: varchar("currency", { length: 10 }).default("XOF").notNull(),
  level: mysqlEnum("level", ["debutant", "intermediaire", "avance"]).default("debutant").notNull(),
  duration: int("duration").default(0),
  status: mysqlEnum("status", ["brouillon", "publie", "archive"]).default("brouillon").notNull(),
  maxStudents: int("maxStudents"),
  tags: text("tags"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Modules (micro-learning units 5-10 min) ───────────────────
export const modules = mysqlTable("modules", {
  id: int("id").autoincrement().primaryKey(),
  courseId: int("courseId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  contentType: mysqlEnum("contentType", ["video", "texte", "quiz", "exercice", "pdf"]).default("video").notNull(),
  contentUrl: text("contentUrl"),
  contentBody: text("contentBody"),
  duration: int("duration").default(5),
  sortOrder: int("sortOrder").default(0).notNull(),
  isPreview: boolean("isPreview").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Module Resources ───────────────────────────────────────────
export const moduleResources = mysqlTable("module_resources", {
  id: int("id").autoincrement().primaryKey(),
  moduleId: int("moduleId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  resourceType: mysqlEnum("resourceType", ["video", "pdf", "document", "image", "audio", "lien", "autre"]).notNull(),
  fileUrl: text("fileUrl"),
  fileSize: int("fileSize"), // en bytes
  mimeType: varchar("mimeType", { length: 100 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ModuleResource = typeof moduleResources.$inferSelect;
export type InsertModuleResource = typeof moduleResources.$inferInsert;

// ─── Enrollments ────────────────────────────────────────────────
export const enrollments = mysqlTable("enrollments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  status: mysqlEnum("status", ["en_attente", "actif", "complete", "abandonne"]).default("en_attente").notNull(),
  progress: int("progress").default(0).notNull(),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  lastAccessedAt: timestamp("lastAccessedAt"),
});

// ─── Module Progress ────────────────────────────────────────────
export const moduleProgress = mysqlTable("module_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  moduleId: int("moduleId").notNull(),
  courseId: int("courseId").notNull(),
  completed: boolean("completed").default(false).notNull(),
  score: int("score"),
  timeSpent: int("timeSpent").default(0),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Payments ───────────────────────────────────────────────────
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("XOF").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 64 }).default("paytech"),
  transactionRef: varchar("transactionRef", { length: 255 }),
  paytechToken: varchar("paytechToken", { length: 500 }),
  status: mysqlEnum("status", ["en_attente", "reussi", "echoue", "rembourse"]).default("en_attente").notNull(),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Certificates ───────────────────────────────────────────────
export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  courseId: int("courseId").notNull(),
  enrollmentId: int("enrollmentId").notNull(),
  certificateCode: varchar("certificateCode", { length: 64 }).notNull().unique(),
  pdfUrl: text("pdfUrl"),
  pdfKey: text("pdfKey"),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  verifiedCount: int("verifiedCount").default(0),
});

// ─── Chat Messages (chatbot) ────────────────────────────────────
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  needsHuman: boolean("needsHuman").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Notifications ──────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["inactivite", "inscription", "rappel_session", "certification", "general"]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  message: text("message"),
  isRead: boolean("isRead").default(false).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Alumni Profiles ────────────────────────────────────────────
export const alumniProfiles = mysqlTable("alumni_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  linkedinUrl: varchar("linkedinUrl", { length: 500 }),
  company: varchar("company", { length: 255 }),
  jobTitle: varchar("jobTitle", { length: 255 }),
  graduationYear: int("graduationYear"),
  isVisible: boolean("isVisible").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Quiz Questions ─────────────────────────────────────────────
export const quizQuestions = mysqlTable("quiz_questions", {
  id: int("id").autoincrement().primaryKey(),
  moduleId: int("moduleId").notNull(),
  question: text("question").notNull(),
  options: text("options").notNull(),
  correctAnswer: int("correctAnswer").notNull(),
  explanation: text("explanation"),
  sortOrder: int("sortOrder").default(0).notNull(),
});


// ─── External Courses ───────────────────────────────────────────
export const externalCourses = mysqlTable("external_courses", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  description: text("description"),
  shortDescription: text("shortDescription"),
  thumbnailUrl: text("thumbnailUrl"),
  externalUrl: text("externalUrl").notNull(),
  source: mysqlEnum("source", ["udemy", "coursera", "youtube", "other"]).notNull(),
  categoryId: int("categoryId"),
  level: mysqlEnum("level", ["debutant", "intermediaire", "avance"]).default("debutant").notNull(),
  duration: int("duration").default(0),
  instructor: varchar("instructor", { length: 255 }),
  rating: decimal("rating", { precision: 3, scale: 1 }).default("0.0"),
  enrollmentCount: int("enrollmentCount").default(0),
  requiresSubscription: boolean("requiresSubscription").default(true).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExternalCourse = typeof externalCourses.$inferSelect;
export type InsertExternalCourse = typeof externalCourses.$inferInsert;

// ─── Subscriptions ──────────────────────────────────────────────
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planType: mysqlEnum("planType", ["monthly", "yearly", "lifetime"]).default("monthly").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("XOF").notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"),
  status: mysqlEnum("status", ["active", "cancelled", "expired"]).default("active").notNull(),
  paymentId: varchar("paymentId", { length: 255 }),
  autoRenew: boolean("autoRenew").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
