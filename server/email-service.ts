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
