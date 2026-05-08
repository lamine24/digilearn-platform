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
  previewContent: text("previewContent"),
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


// ─── Premium Subscription (10,000 FCFA/month for all resources) ───
export const premiumSubscriptions = mysqlTable("premium_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  price: decimal("price", { precision: 10, scale: 2 }).default("10000.00").notNull(),
  currency: varchar("currency", { length: 10 }).default("XOF").notNull(),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"),
  status: mysqlEnum("status", ["active", "cancelled", "expired"]).default("active").notNull(),
  paymentId: varchar("paymentId", { length: 255 }),
  autoRenew: boolean("autoRenew").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PremiumSubscription = typeof premiumSubscriptions.$inferSelect;
export type InsertPremiumSubscription = typeof premiumSubscriptions.$inferInsert;


// ─── Free Resources ─────────────────────────────────────────────
export const freeResources = mysqlTable("free_resources", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  description: text("description"),
  shortDescription: text("shortDescription"),
  thumbnailUrl: text("thumbnailUrl"),
  externalUrl: text("externalUrl").notNull(),
  platform: mysqlEnum("platform", ["khan_academy", "mit_ocw", "statlearning", "open_learning_campus", "canal_u", "other"]).notNull(),
  category: varchar("category", { length: 255 }),
  level: mysqlEnum("level", ["debutant", "intermediaire", "avance"]).default("debutant").notNull(),
  duration: int("duration"),
  language: varchar("language", { length: 10 }).default("fr").notNull(),
  tags: text("tags"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  enrollmentCount: int("enrollmentCount").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FreeResource = typeof freeResources.$inferSelect;
export type InsertFreeResource = typeof freeResources.$inferInsert;

// ─── Resource Downloads ─────────────────────────────────────────
export const resourceDownloads = mysqlTable("resource_downloads", {
  id: int("id").autoincrement().primaryKey(),
  resourceId: int("resourceId").notNull(),
  originalUrl: text("originalUrl").notNull(),
  downloadedUrl: text("downloadedUrl").notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  status: mysqlEnum("status", ["pending", "success", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  downloadedAt: timestamp("downloadedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResourceDownload = typeof resourceDownloads.$inferSelect;
export type InsertResourceDownload = typeof resourceDownloads.$inferInsert;


// ─── Subscription Notification Tracking ──────────────────────────
export const subscriptionNotifications = mysqlTable("subscription_notifications", {
  id: int("id").autoincrement().primaryKey(),
  subscriptionId: int("subscriptionId").notNull(),
  userId: int("userId").notNull(),
  notificationType: mysqlEnum("notificationType", ["expiring_soon", "expired", "renewal_reminder"]).notNull(),
  daysBeforeExpiry: int("daysBeforeExpiry"),
  sentAt: timestamp("sentAt"),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SubscriptionNotification = typeof subscriptionNotifications.$inferSelect;
export type InsertSubscriptionNotification = typeof subscriptionNotifications.$inferInsert;


// ─── Notification Settings (Admin Configuration) ────────────────────
export const notificationSettings = mysqlTable("notification_settings", {
  id: int("id").autoincrement().primaryKey(),
  expirationReminderEnabled: boolean("expiration_reminder_enabled").default(true).notNull(),
  expirationReminderDays: int("expiration_reminder_days").default(7).notNull(),
  expiredNotificationEnabled: boolean("expired_notification_enabled").default(true).notNull(),
  emailFrom: varchar("email_from", { length: 255 }).default("noreply@digilearn.manus.space").notNull(),
  supportEmail: varchar("support_email", { length: 255 }).default("support@digilearn.manus.space").notNull(),
  maxRetriesOnFailure: int("max_retries_on_failure").default(3).notNull(),
  retryDelayMinutes: int("retry_delay_minutes").default(60).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: varchar("updatedBy", { length: 255 }),
});

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type InsertNotificationSettings = typeof notificationSettings.$inferInsert;

// ─── Payment History ────────────────────────────────────────────
export const paymentHistory = mysqlTable("payment_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  subscriptionId: int("subscription_id").references(() => premiumSubscriptions.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("XOF").notNull(),
  status: mysqlEnum("status", ["pending", "success", "failed", "cancelled"]).default("pending").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(), // paytech, stripe, etc
  transactionId: varchar("transaction_id", { length: 255 }).unique(),
  referenceCommand: varchar("reference_command", { length: 255 }),
  errorMessage: text("errorMessage"),
  retryCount: int("retry_count").default(0).notNull(),
  lastRetryAt: timestamp("last_retry_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type InsertPaymentHistory = typeof paymentHistory.$inferInsert;


// ─── User Points (Gamification) ─────────────────────────────────
export const userPoints = mysqlTable("user_points", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  totalPoints: int("total_points").default(0).notNull(),
  currentLevel: varchar("current_level", { length: 50 }).default("bronze").notNull(), // bronze, silver, gold, platinum
  pointsThisMonth: int("points_this_month").default(0).notNull(),
  lastPointsUpdate: timestamp("last_points_update").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UserPoints = typeof userPoints.$inferSelect;
export type InsertUserPoints = typeof userPoints.$inferInsert;

// ─── Badge Definitions ──────────────────────────────────────────
export const badgeDefinitions = mysqlTable("badge_definitions", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  iconUrl: text("icon_url"),
  category: varchar("category", { length: 50 }).notNull(), // achievement, milestone, social, learning
  requiredPoints: int("required_points").default(0).notNull(),
  rarity: mysqlEnum("rarity", ["common", "uncommon", "rare", "epic", "legendary"]).default("common").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BadgeDefinition = typeof badgeDefinitions.$inferSelect;
export type InsertBadgeDefinition = typeof badgeDefinitions.$inferInsert;

// ─── User Badges ────────────────────────────────────────────────
export const userBadges = mysqlTable("user_badges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  badgeId: int("badge_id").notNull().references(() => badgeDefinitions.id),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  progress: int("progress").default(0), // 0-100 for badges in progress
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

// ─── User Dashboard Stats ───────────────────────────────────────
export const userDashboardStats = mysqlTable("user_dashboard_stats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id).unique(),
  totalCoursesCompleted: int("total_courses_completed").default(0).notNull(),
  totalCertificatesEarned: int("total_certificates_earned").default(0).notNull(),
  totalBadgesUnlocked: int("total_badges_unlocked").default(0).notNull(),
  totalPointsEarned: int("total_points_earned").default(0).notNull(),
  currentStreak: int("current_streak").default(0).notNull(), // days of consecutive activity
  lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type UserDashboardStats = typeof userDashboardStats.$inferSelect;
export type InsertUserDashboardStats = typeof userDashboardStats.$inferInsert;
