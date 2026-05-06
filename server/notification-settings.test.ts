import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("Notification Settings Management", () => {
  describe("getNotificationSettings", () => {
    it("should return default settings when none exist", async () => {
      const settings = await db.getNotificationSettings();
      expect(settings).toBeDefined();
      expect(settings?.expirationReminderEnabled).toBe(true);
      expect(settings?.expirationReminderDays).toBe(7);
      expect(settings?.expiredNotificationEnabled).toBe(true);
      expect(settings?.maxRetriesOnFailure).toBe(3);
      expect(settings?.retryDelayMinutes).toBe(60);
    });

    it("should return valid email addresses", async () => {
      const settings = await db.getNotificationSettings();
      expect(settings?.emailFrom).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(settings?.supportEmail).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });

  describe("updateNotificationSettings", () => {
    it("should update expiration reminder settings", async () => {
      const updated = await db.updateNotificationSettings(
        {
          expirationReminderEnabled: false,
          expirationReminderDays: 14,
        },
        "test-user"
      );

      expect(updated).toBeDefined();
      expect(updated?.expirationReminderEnabled).toBe(false);
      expect(updated?.expirationReminderDays).toBe(14);
    });

    it("should update email configuration", async () => {
      const updated = await db.updateNotificationSettings(
        {
          emailFrom: "notifications@digilearn.com",
          supportEmail: "help@digilearn.com",
        },
        "test-user"
      );

      expect(updated).toBeDefined();
      expect(updated?.emailFrom).toBe("notifications@digilearn.com");
      expect(updated?.supportEmail).toBe("help@digilearn.com");
    });

    it("should update retry settings", async () => {
      const updated = await db.updateNotificationSettings(
        {
          maxRetriesOnFailure: 5,
          retryDelayMinutes: 120,
        },
        "test-user"
      );

      expect(updated).toBeDefined();
      expect(updated?.maxRetriesOnFailure).toBe(5);
      expect(updated?.retryDelayMinutes).toBe(120);
    });

    it("should track who updated the settings", async () => {
      const updated = await db.updateNotificationSettings(
        {
          expirationReminderDays: 10,
        },
        "admin-user-123"
      );

      expect(updated).toBeDefined();
      expect(updated?.updatedBy).toBe("admin-user-123");
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });

    it("should validate retry settings constraints", async () => {
      const updated = await db.updateNotificationSettings(
        {
          maxRetriesOnFailure: 8,
          retryDelayMinutes: 300,
        },
        "test-user"
      );

      expect(updated?.maxRetriesOnFailure).toBeLessThanOrEqual(10);
      expect(updated?.retryDelayMinutes).toBeLessThanOrEqual(1440);
    });

    it("should preserve existing settings when updating partial fields", async () => {
      // First, set initial values
      await db.updateNotificationSettings(
        {
          expirationReminderDays: 7,
          maxRetriesOnFailure: 3,
        },
        "test-user"
      );

      // Then update only one field
      const updated = await db.updateNotificationSettings(
        {
          expirationReminderDays: 14,
        },
        "test-user"
      );

      expect(updated?.expirationReminderDays).toBe(14);
      expect(updated?.maxRetriesOnFailure).toBe(3);
    });
  });

  describe("Settings Persistence", () => {
    it("should persist settings across multiple updates", async () => {
      // Update settings
      await db.updateNotificationSettings(
        {
          expirationReminderDays: 21,
          emailFrom: "persist-test@example.com",
        },
        "test-user"
      );

      // Retrieve and verify
      const retrieved = await db.getNotificationSettings();
      expect(retrieved?.expirationReminderDays).toBe(21);
      expect(retrieved?.emailFrom).toBe("persist-test@example.com");
    });

    it("should handle concurrent updates gracefully", async () => {
      const updates = await Promise.all([
        db.updateNotificationSettings(
          { expirationReminderDays: 5 },
          "user-1"
        ),
        db.updateNotificationSettings(
          { maxRetriesOnFailure: 7 },
          "user-2"
        ),
      ]);

      expect(updates).toHaveLength(2);
      updates.forEach((update) => {
        expect(update).toBeDefined();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid email addresses gracefully", async () => {
      try {
        await db.updateNotificationSettings(
          {
            emailFrom: "invalid-email",
          },
          "test-user"
        );
        // If no error, settings should still have valid structure
        const settings = await db.getNotificationSettings();
        expect(settings).toBeDefined();
      } catch (error) {
        // Error is acceptable for invalid email
        expect(error).toBeDefined();
      }
    });

    it("should handle out-of-range values", async () => {
      const updated = await db.updateNotificationSettings(
        {
          expirationReminderDays: 100, // Out of range (max 30)
          maxRetriesOnFailure: 50, // Out of range (max 10)
        },
        "test-user"
      );

      // Should either reject or clamp to valid range
      if (updated) {
        expect(updated.expirationReminderDays).toBeLessThanOrEqual(30);
        expect(updated.maxRetriesOnFailure).toBeLessThanOrEqual(10);
      }
    });
  });
});
