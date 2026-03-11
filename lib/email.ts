import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const APP_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Envoyer un email de bienvenue après inscription
 */
export async function sendWelcomeEmail(to: string, displayName: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Bienvenue sur Arbre Généalogique! 🌳',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">Bienvenue ${displayName}!</h1>
          <p>Nous sommes ravis de vous accueillir sur notre plateforme d'arbre généalogique.</p>
          <p>Vous pouvez maintenant :</p>
          <ul>
            <li>Créer votre arbre généalogique familial</li>
            <li>Ajouter des membres de votre famille</li>
            <li>Partager des photos et des souvenirs</li>
            <li>Collaborer avec d'autres membres de la famille</li>
          </ul>
          <a href="${APP_URL}/dashboard" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Accéder à mon compte
          </a>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Si vous avez des questions, n'hésitez pas à nous contacter.
          </p>
        </div>
      `,
    });
    console.log('✅ Email de bienvenue envoyé à:', to);
  } catch (error) {
    console.error('❌ Erreur envoi email de bienvenue:', error);
    // Ne pas bloquer l'inscription si l'email échoue
  }
}

/**
 * Envoyer un email de réinitialisation de mot de passe
 */
export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">Réinitialisation de mot de passe</h1>
          <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
          <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Réinitialiser mon mot de passe
          </a>
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Ce lien est valide pendant 1 heure.
          </p>
          <p style="color: #666; font-size: 14px;">
            Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.
          </p>
          <p style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 6px; font-size: 12px; color: #666;">
            Ou copiez ce lien dans votre navigateur :<br/>
            <span style="word-break: break-all;">${resetUrl}</span>
          </p>
        </div>
      `,
    });
    console.log('✅ Email de réinitialisation envoyé à:', to);
  } catch (error) {
    console.error('❌ Erreur envoi email de réinitialisation:', error);
    throw new Error('Failed to send password reset email');
  }
}

/**
 * Envoyer un email de notification générique
 */
export async function sendNotificationEmail(
  to: string,
  subject: string,
  message: string
) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">${subject}</h1>
          <p>${message}</p>
          <a href="${APP_URL}/dashboard" style="display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            Voir sur la plateforme
          </a>
        </div>
      `,
    });
    console.log('✅ Email de notification envoyé à:', to);
  } catch (error) {
    console.error('❌ Erreur envoi email de notification:', error);
  }
}
