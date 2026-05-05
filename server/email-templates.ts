/**
 * Email templates for subscription notifications
 */

export interface EmailTemplateContext {
  userName: string;
  userEmail: string;
  daysRemaining: number;
  endDate: string;
  renewalUrl: string;
  supportEmail: string;
}

export function getExpirationReminderTemplate(context: EmailTemplateContext): {
  subject: string;
  html: string;
  text: string;
} {
  const { userName, daysRemaining, endDate, renewalUrl, supportEmail } = context;

  const subject = `Rappel : Votre abonnement DigiLearn expire dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .alert-title { font-weight: bold; color: #856404; margin-bottom: 5px; }
    .button { display: inline-block; background: #1e3c72; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; }
    .button:hover { background: #2a5298; }
    .details { background: white; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px solid #ddd; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: bold; color: #666; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #ddd; margin-top: 20px; }
    .footer a { color: #1e3c72; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 Rappel d'Expiration d'Abonnement</h1>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${userName}</strong>,</p>
      
      <p>Nous vous contactons pour vous informer que votre abonnement premium DigiLearn expire bientôt.</p>
      
      <div class="alert">
        <div class="alert-title">⚠️ Votre abonnement expire dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}</div>
        <p style="margin: 10px 0 0 0;">Date d'expiration : <strong>${endDate}</strong></p>
      </div>
      
      <p>Votre abonnement premium vous donne accès à :</p>
      <ul>
        <li>✅ Tous les cours certifiants (Data Science, Finance, Web Development, IA)</li>
        <li>✅ Certificats reconnus professionnellement</li>
        <li>✅ Support prioritaire et mentorat</li>
        <li>✅ Accès à vie aux ressources premium</li>
        <li>✅ Communauté exclusive d'apprenants</li>
      </ul>
      
      <p><strong>Pour continuer à accéder à ces avantages, veuillez renouveler votre abonnement :</strong></p>
      
      <center>
        <a href="${renewalUrl}" class="button">Renouveler mon Abonnement</a>
      </center>
      
      <div class="details">
        <div class="detail-row">
          <span class="detail-label">Plan :</span>
          <span>Premium - 10 000 XOF/mois</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date d'expiration :</span>
          <span>${endDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Jours restants :</span>
          <span><strong>${daysRemaining}</strong></span>
        </div>
      </div>
      
      <p><strong>Avez-vous des questions ?</strong></p>
      <p>Notre équipe de support est disponible pour vous aider. Contactez-nous à <a href="mailto:${supportEmail}">${supportEmail}</a></p>
      
      <p style="margin-top: 30px; color: #999; font-size: 14px;">
        Cordialement,<br>
        L'équipe DigiLearn
      </p>
    </div>
    
    <div class="footer">
      <p>© 2026 DigiLearn. Tous droits réservés.</p>
      <p>
        <a href="https://digilearn.manus.space">Visiter DigiLearn</a> | 
        <a href="https://digilearn.manus.space/premium">Gérer mon abonnement</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Bonjour ${userName},

Rappel : Votre abonnement DigiLearn expire dans ${daysRemaining} jour${daysRemaining > 1 ? "s" : ""}

Votre abonnement premium expire le : ${endDate}

Votre abonnement premium vous donne accès à :
- Tous les cours certifiants (Data Science, Finance, Web Development, IA)
- Certificats reconnus professionnellement
- Support prioritaire et mentorat
- Accès à vie aux ressources premium
- Communauté exclusive d'apprenants

Pour renouveler votre abonnement, veuillez visiter :
${renewalUrl}

Plan : Premium - 10 000 XOF/mois
Jours restants : ${daysRemaining}

Si vous avez des questions, contactez-nous à : ${supportEmail}

Cordialement,
L'équipe DigiLearn

---
© 2026 DigiLearn. Tous droits réservés.
  `;

  return { subject, html, text };
}

export function getExpiredSubscriptionTemplate(context: Omit<EmailTemplateContext, "daysRemaining">): {
  subject: string;
  html: string;
  text: string;
} {
  const { userName, endDate, renewalUrl, supportEmail } = context;

  const subject = "Votre abonnement DigiLearn a expiré - Renouvellement disponible";

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #d32f2f 0%, #f57c00 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .alert { background: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .alert-title { font-weight: bold; color: #c62828; margin-bottom: 5px; }
    .button { display: inline-block; background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; }
    .button:hover { background: #f57c00; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; border-top: 1px solid #ddd; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>❌ Votre Abonnement a Expiré</h1>
    </div>
    
    <div class="content">
      <p>Bonjour <strong>${userName}</strong>,</p>
      
      <p>Nous vous informons que votre abonnement premium DigiLearn a expiré.</p>
      
      <div class="alert">
        <div class="alert-title">Abonnement expiré le ${endDate}</div>
        <p style="margin: 10px 0 0 0;">Vous n'avez plus accès aux ressources premium.</p>
      </div>
      
      <p>Vous pouvez toujours accéder aux ressources libres, mais pour bénéficier de tous nos cours certifiants et services premium, veuillez renouveler votre abonnement.</p>
      
      <p><strong>Renouveler maintenant :</strong></p>
      
      <center>
        <a href="${renewalUrl}" class="button">Renouveler mon Abonnement</a>
      </center>
      
      <p>Vous avez des questions ? Contactez notre équipe de support à <a href="mailto:${supportEmail}">${supportEmail}</a></p>
      
      <p style="margin-top: 30px; color: #999; font-size: 14px;">
        Cordialement,<br>
        L'équipe DigiLearn
      </p>
    </div>
    
    <div class="footer">
      <p>© 2026 DigiLearn. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Bonjour ${userName},

Votre abonnement DigiLearn a expiré

Date d'expiration : ${endDate}

Vous n'avez plus accès aux ressources premium. Pour continuer à bénéficier de tous nos cours certifiants et services, veuillez renouveler votre abonnement.

Renouveler : ${renewalUrl}

Si vous avez des questions, contactez-nous à : ${supportEmail}

Cordialement,
L'équipe DigiLearn

---
© 2026 DigiLearn. Tous droits réservés.
  `;

  return { subject, html, text };
}
