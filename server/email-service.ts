import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

/**
 * Email service using nodemailer
 * Supports both SMTP and console logging for development
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter
 */
function getTransporter() {
  if (transporter) return transporter;

  if (ENV.smtpHost && ENV.smtpPort && ENV.smtpUser && ENV.smtpPassword) {
    transporter = nodemailer.createTransport({
      host: ENV.smtpHost,
      port: parseInt(ENV.smtpPort),
      secure: ENV.smtpSecure === "true",
      auth: {
        user: ENV.smtpUser,
        pass: ENV.smtpPassword,
      },
    });
  } else {
    // Fallback to console logging in development
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });
  }

  return transporter;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = getTransporter();
    const from = ENV.smtpFrom || "noreply@digilearn.com";

    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`[Email] Sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    return false;
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(userName: string, userEmail: string): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #3b4f8a;">Bienvenue sur DigiLearn!</h1>
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Nous sommes heureux de vous accueillir sur <strong>DigiLearn</strong>, la plateforme de formation certifiante en Afrique de l'Ouest.</p>
      <p>Vous pouvez maintenant explorer nos formations en Data Science, Finance, Développement Web et Intelligence Artificielle.</p>
      <p style="margin-top: 30px;">
        <a href="https://digilearn.manus.space" style="background-color: #3b4f8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Accéder à DigiLearn
        </a>
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        © 2026 DigiLearn. Tous droits réservés.
      </p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: "Bienvenue sur DigiLearn!",
    html,
    text: `Bienvenue ${userName}! Accédez à DigiLearn: https://digilearn.manus.space`,
  });
}

/**
 * Send enrollment confirmation email
 */
export async function sendEnrollmentEmail(
  userName: string,
  userEmail: string,
  courseName: string,
  courseUrl: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #3b4f8a;">Inscription confirmée!</h1>
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Votre inscription à la formation <strong>${courseName}</strong> a été confirmée avec succès.</p>
      <p>Vous pouvez maintenant commencer votre apprentissage.</p>
      <p style="margin-top: 30px;">
        <a href="${courseUrl}" style="background-color: #3b4f8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Commencer la formation
        </a>
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        © 2026 DigiLearn. Tous droits réservés.
      </p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Inscription confirmée: ${courseName}`,
    html,
    text: `Vous êtes inscrit à ${courseName}. Commencez: ${courseUrl}`,
  });
}

/**
 * Send completion certificate email
 */
export async function sendCertificateEmail(
  userName: string,
  userEmail: string,
  courseName: string,
  certificateCode: string,
  verifyUrl: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #3b4f8a;">Certificat disponible!</h1>
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Félicitations! Vous avez complété la formation <strong>${courseName}</strong>.</p>
      <p>Votre certificat est maintenant disponible pour téléchargement.</p>
      <p><strong>Code du certificat:</strong> ${certificateCode}</p>
      <p style="margin-top: 30px;">
        <a href="${verifyUrl}" style="background-color: #3b4f8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Télécharger le certificat
        </a>
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        © 2026 DigiLearn. Tous droits réservés.
      </p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Certificat: ${courseName}`,
    html,
    text: `Certificat ${certificateCode} pour ${courseName}. Vérifier: ${verifyUrl}`,
  });
}

/**
 * Send inactivity reminder email
 */
export async function sendInactivityReminderEmail(
  userName: string,
  userEmail: string,
  daysInactive: number
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #3b4f8a;">Nous vous manquez!</h1>
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Vous n'avez pas visité DigiLearn depuis <strong>${daysInactive} jours</strong>.</p>
      <p>Continuez votre apprentissage et progressez dans vos formations!</p>
      <p style="margin-top: 30px;">
        <a href="https://digilearn.manus.space/dashboard" style="background-color: #3b4f8a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Retourner à DigiLearn
        </a>
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        © 2026 DigiLearn. Tous droits réservés.
      </p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: "Nous vous manquez sur DigiLearn!",
    html,
    text: `Vous êtes inactif depuis ${daysInactive} jours. Retournez à DigiLearn: https://digilearn.manus.space/dashboard`,
  });
}


/**
 * Send subscription expiration reminder email
 */
export async function sendSubscriptionExpirationReminderEmail(
  userName: string,
  userEmail: string,
  daysRemaining: number,
  endDate: string,
  renewalUrl: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #ff9800;">🔔 Rappel d'Expiration d'Abonnement</h1>
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Nous vous contactons pour vous informer que votre abonnement premium DigiLearn expire bientôt.</p>
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-weight: bold; color: #856404;">⚠️ Votre abonnement expire dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}</p>
        <p style="margin: 10px 0 0 0; color: #856404;">Date d'expiration : <strong>${endDate}</strong></p>
      </div>
      <p>Votre abonnement premium vous donne accès à :</p>
      <ul>
        <li>✅ Tous les cours certifiants (Data Science, Finance, Web Development, IA)</li>
        <li>✅ Certificats reconnus professionnellement</li>
        <li>✅ Support prioritaire et mentorat</li>
        <li>✅ Accès à vie aux ressources premium</li>
        <li>✅ Communauté exclusive d'apprenants</li>
      </ul>
      <p style="margin-top: 30px;">
        <a href="${renewalUrl}" style="background-color: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Renouveler mon Abonnement
        </a>
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        © 2026 DigiLearn. Tous droits réservés.
      </p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: `Rappel : Votre abonnement DigiLearn expire dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}`,
    html,
    text: `Bonjour ${userName},\n\nVotre abonnement premium DigiLearn expire dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""} (${endDate}).\n\nRenouveler : ${renewalUrl}\n\nCordialement,\nL'équipe DigiLearn`,
  });
}

/**
 * Send subscription expired email
 */
export async function sendSubscriptionExpiredEmail(
  userName: string,
  userEmail: string,
  endDate: string,
  renewalUrl: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #d32f2f;">❌ Votre Abonnement a Expiré</h1>
      <p>Bonjour <strong>${userName}</strong>,</p>
      <p>Nous vous informons que votre abonnement premium DigiLearn a expiré.</p>
      <div style="background: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; font-weight: bold; color: #c62828;">Abonnement expiré le ${endDate}</p>
        <p style="margin: 10px 0 0 0; color: #c62828;">Vous n'avez plus accès aux ressources premium.</p>
      </div>
      <p>Vous pouvez toujours accéder aux ressources libres, mais pour bénéficier de tous nos cours certifiants et services premium, veuillez renouveler votre abonnement.</p>
      <p style="margin-top: 30px;">
        <a href="${renewalUrl}" style="background-color: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
          Renouveler mon Abonnement
        </a>
      </p>
      <p style="color: #999; font-size: 12px; margin-top: 30px;">
        © 2026 DigiLearn. Tous droits réservés.
      </p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: "Votre abonnement DigiLearn a expiré - Renouvellement disponible",
    html,
    text: `Bonjour ${userName},\n\nVotre abonnement premium DigiLearn a expiré le ${endDate}.\n\nPour continuer à accéder aux ressources premium, veuillez renouveler :\n${renewalUrl}\n\nCordialement,\nL'équipe DigiLearn`,
  });
}
