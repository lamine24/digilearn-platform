/**
 * Scheduled task to check and send subscription expiration notifications
 * This runs daily to check for subscriptions expiring soon and send reminders
 */

import * as db from "./db";
import { sendSubscriptionExpirationReminderEmail, sendSubscriptionExpiredEmail } from "./email-service";

/**
 * Check for expiring subscriptions and send notifications
 * Should be called once per day
 */
export async function checkAndSendExpirationNotifications() {
  console.log("[SubscriptionNotifications] Starting expiration check...");

  try {
    // Get subscriptions expiring in 7 days
    const expiringSubscriptions = await db.getExpiringSubscriptions(7);
    console.log(`[SubscriptionNotifications] Found ${expiringSubscriptions.length} subscriptions expiring soon`);

    for (const sub of expiringSubscriptions) {
      try {
        // Check if we've already sent a notification for this subscription
        const alreadySent = await db.hasSubscriptionNotificationBeenSent(
          sub.id,
          "expiring_soon"
        );

        if (alreadySent) {
          console.log(`[SubscriptionNotifications] Notification already sent for subscription ${sub.id}`);
          continue;
        }

        // Create subscription notification record
        const notificationId = await db.createSubscriptionNotification({
          subscriptionId: sub.id,
          userId: sub.userId,
          notificationType: "expiring_soon",
          daysBeforeExpiry: sub.daysRemaining,
        });

        if (!notificationId) {
          console.error(`[SubscriptionNotifications] Failed to create notification record for subscription ${sub.id}`);
          continue;
        }

        // Send email
        const renewalUrl = `${process.env.VITE_FRONTEND_URL || "https://localhost:5173"}/premium`;
        const endDate = sub.endDate ? new Date(sub.endDate).toLocaleDateString("fr-FR") : "N/A";

        const emailSent = await sendSubscriptionExpirationReminderEmail(
          sub.userName || "Utilisateur",
          sub.userEmail || "",
          sub.daysRemaining || 7,
          endDate,
          renewalUrl
        );

        if (emailSent) {
          console.log(`[SubscriptionNotifications] Email sent successfully to ${sub.userEmail}`);
          // Update notification status to sent
          await db.updateSubscriptionNotificationStatus(notificationId, "sent");
        } else {
          console.error(`[SubscriptionNotifications] Failed to send email to ${sub.userEmail}`);
          // Update notification status to failed
          await db.updateSubscriptionNotificationStatus(notificationId, "failed", "Email send failed");
        }
      } catch (error) {
        console.error(`[SubscriptionNotifications] Error processing subscription ${sub.id}:`, error);
      }
    }

    console.log("[SubscriptionNotifications] Expiration check completed");
  } catch (error) {
    console.error("[SubscriptionNotifications] Error during expiration check:", error);
  }
}

/**
 * Check for expired subscriptions and send notifications
 */
export async function checkAndSendExpiredNotifications() {
  console.log("[SubscriptionNotifications] Starting expired subscription check...");

  try {
    // Get expired subscriptions
    const expiredSubscriptions = await db.getExpiredSubscriptions();
    console.log(`[SubscriptionNotifications] Found ${expiredSubscriptions.length} expired subscriptions`);

    for (const sub of expiredSubscriptions) {
      try {
        // Check if we've already sent a notification
        const alreadySent = await db.hasSubscriptionNotificationBeenSent(sub.id, "expired");

        if (alreadySent) {
          console.log(`[SubscriptionNotifications] Expired notification already sent for subscription ${sub.id}`);
          continue;
        }

        // Create subscription notification record
        const notificationId = await db.createSubscriptionNotification({
          subscriptionId: sub.id,
          userId: sub.userId,
          notificationType: "expired",
        });

        if (!notificationId) {
          console.error(`[SubscriptionNotifications] Failed to create notification record for subscription ${sub.id}`);
          continue;
        }

        // Send email
        const renewalUrl = `${process.env.VITE_FRONTEND_URL || "https://localhost:5173"}/premium`;
        const endDate = sub.endDate ? new Date(sub.endDate).toLocaleDateString("fr-FR") : "N/A";

        const emailSent = await sendSubscriptionExpiredEmail(
          sub.userName || "Utilisateur",
          sub.userEmail || "",
          endDate,
          renewalUrl
        );

        if (emailSent) {
          console.log(`[SubscriptionNotifications] Expired email sent to ${sub.userEmail}`);
          await db.updateSubscriptionNotificationStatus(notificationId, "sent");
        } else {
          console.error(`[SubscriptionNotifications] Failed to send expired email to ${sub.userEmail}`);
          await db.updateSubscriptionNotificationStatus(notificationId, "failed", "Email send failed");
        }
      } catch (error) {
        console.error(`[SubscriptionNotifications] Error processing expired subscription ${sub.id}:`, error);
      }
    }

    console.log("[SubscriptionNotifications] Expired subscription check completed");
  } catch (error) {
    console.error("[SubscriptionNotifications] Error during expired check:", error);
  }
}

/**
 * Main function to run all notification checks
 */
export async function runSubscriptionNotificationChecks() {
  console.log("[SubscriptionNotifications] Running all notification checks...");

  try {
    await checkAndSendExpirationNotifications();
    await checkAndSendExpiredNotifications();
    console.log("[SubscriptionNotifications] All checks completed successfully");
  } catch (error) {
    console.error("[SubscriptionNotifications] Error running notification checks:", error);
  }
}
