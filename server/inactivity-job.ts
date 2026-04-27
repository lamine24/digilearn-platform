/**
 * Inactivity reminder job
 * Runs every hour, checks for users inactive for 3+ days,
 * creates in-app notifications, sends emails, and notifies the owner.
 */
import * as db from "./db";
import { notifyOwner } from "./_core/notification";
import { sendInactivityReminderEmail } from "./email-service";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

// Track which users have already been notified to avoid duplicates
const notifiedUsers = new Set<number>();

async function checkInactiveUsers() {
  try {
    const inactiveUsers = await db.getInactiveUsers(3);
    const newInactive = inactiveUsers.filter(u => !notifiedUsers.has(u.id));

    for (const user of newInactive) {
      // Create in-app notification for the user
      await db.createNotification({
        userId: user.id,
        type: "inactivite",
        title: "Vous nous manquez !",
        message: `Cela fait plus de 3 jours que vous n'avez pas visité DigiLearn. Reprenez votre parcours d'apprentissage dès maintenant !`,
      });

      // Send email reminder if user has email
      if (user.email) {
        const daysSinceActive = Math.floor(
          (Date.now() - new Date(user.lastActiveAt).getTime()) / (24 * 60 * 60 * 1000)
        );
        await sendInactivityReminderEmail(user.name || "Apprenant", user.email, daysSinceActive);
      }

      notifiedUsers.add(user.id);
    }

    // Notify owner about inactive users summary
    if (newInactive.length > 0) {
      const names = newInactive.map(u => u.name || u.email || `User #${u.id}`).join(", ");
      await notifyOwner({
        title: `${newInactive.length} apprenant(s) inactif(s) depuis 3 jours`,
        content: `Les apprenants suivants sont inactifs depuis plus de 3 jours : ${names}. Des notifications de relance leur ont été envoyées automatiquement.`,
      });
    }

    // Clean up old entries (users who became active again)
    const activeAgain = Array.from(notifiedUsers).filter(
      id => !inactiveUsers.find(u => u.id === id)
    );
    activeAgain.forEach(id => notifiedUsers.delete(id));

    console.log(`[Inactivity Job] Checked: ${inactiveUsers.length} inactive, ${newInactive.length} newly notified`);
  } catch (error) {
    console.error("[Inactivity Job] Error:", error);
  }
}

export function startInactivityJob() {
  // Run first check after 30 seconds (let server fully start)
  setTimeout(() => {
    checkInactiveUsers();
    // Then run every hour
    setInterval(checkInactiveUsers, CHECK_INTERVAL_MS);
  }, 30000);
  console.log("[Inactivity Job] Scheduled: checking every hour for 3-day inactive users");
}
