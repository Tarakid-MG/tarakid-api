import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST'),
      port: this.configService.get('EMAIL_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const url = `${this.configService.get('WEB_URL')}/verify?token=${token}`;
    await this.transporter.sendMail({
      from: `"TaraKid" <${this.configService.get('EMAIL_USER')}>`,
      to: email,
      subject: '🎒 Bienvenue chez TaraKid ! Vérifiez votre compte',
      html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #FFD400; font-size: 32px; font-weight: 900; margin: 0;">Tara<span style="color: #219EBC;">Kid</span></h1>
                </div>
                <div style="background-color: #ffffff; border-radius: 24px; padding: 40px; border: 2px solid #F3F4F6; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                    <h2 style="font-size: 24px; font-weight: 900; margin-bottom: 20px;">🎒 Prêt pour l'aventure ?</h2>
                    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                        Félicitations pour votre inscription chez TaraKid ! Pour commencer à explorer nos cours d'anglais magiques, veuillez vérifier votre adresse email en cliquant sur le bouton ci-dessous :
                    </p>
                    <div style="text-align: center; margin-bottom: 30px;">
                        <a href="${url}" style="background-color: #F77F00; color: #ffffff; padding: 16px 32px; border-radius: 16px; text-decoration: none; font-weight: 900; display: inline-block;">
                            Vérifier mon compte
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #6B7280; text-align: center;">
                        Si le bouton ne fonctionne pas, copiez et collez ce lien :<br>
                        <a href="${url}" style="color: #219EBC;">${url}</a>
                    </p>
                </div>
                <div style="text-align: center; margin-top: 30px; color: #9CA3AF; font-size: 12px;">
                    <p>© 2026 TaraKid. Toutes les leçons durent 25 minutes de pur bonheur !</p>
                </div>
            </div>
            `,
    });
  }

  async sendResetPasswordEmail(email: string, token: string) {
    const url = `${this.configService.get('WEB_URL')}/reset-password?token=${token}`;
    await this.transporter.sendMail({
      from: `"TaraKid" <${this.configService.get('EMAIL_USER')}>`,
      to: email,
      subject: '🔑 Réinitialisation de votre mot de passe',
      html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #4F46E5; font-size: 32px; font-weight: 900; margin: 0;">Tara<span style="color: #F59E0B;">Kid</span></h1>
                </div>
                <div style="background-color: #ffffff; border-radius: 24px; padding: 40px; border: 2px solid #F3F4F6;">
                    <h2 style="font-size: 24px; font-weight: 900; margin-bottom: 20px;">🔑 Mot de passe oublié ?</h2>
                    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                        Pas de panique ! Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe TaraKid :
                    </p>
                    <div style="text-align: center; margin-bottom: 30px;">
                        <a href="${url}" style="background-color: #4F46E5; color: #ffffff; padding: 16px 32px; border-radius: 16px; text-decoration: none; font-weight: 900; display: inline-block;">
                            Réinitialiser le mot de passe
                        </a>
                    </div>
                </div>
            </div>
            `,
    });
  }

  async sendBookingConfirmation(
    email: string,
    userName: string,
    sessionDetails: { date: string; startTime: string; endTime: string },
  ) {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    };

    const formattedDate = formatDate(sessionDetails.date);
    const startTime = sessionDetails.startTime.substring(0, 5);
    const endTime = sessionDetails.endTime.substring(0, 5);

    await this.transporter.sendMail({
      from: `"TaraKid" <${this.configService.get('EMAIL_USER')}>`,
      to: email,
      subject: "🎉 Votre cours d'essai est confirmé !",
      html: `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #FFD400; font-size: 32px; font-weight: 900; margin: 0;">Tara<span style="color: #219EBC;">Kid</span></h1>
                </div>
                <div style="background-color: #ffffff; border-radius: 24px; padding: 40px; border: 2px solid #F3F4F6; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                    <h2 style="font-size: 24px; font-weight: 900; margin-bottom: 20px;">🎉 C'est confirmé, ${userName} !</h2>
                    <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                        Génial ! Votre cours d'essai gratuit est réservé. Préparez-vous pour une aventure d'apprentissage magique !
                    </p>
                    
                    <div style="background: linear-gradient(135deg, #219EBC 0%, #8ECAE6 100%); border-radius: 20px; padding: 24px; margin-bottom: 30px; color: white;">
                        <h3 style="font-size: 18px; font-weight: 900; margin: 0 0 16px 0;">📅 Détails de votre cours</h3>
                        <div style="display: flex; align-items: center; margin-bottom: 12px;">
                            <span style="font-size: 20px; margin-right: 12px;">📆</span>
                            <span style="font-weight: 700;">${formattedDate}</span>
                        </div>
                        <div style="display: flex; align-items: center;">
                            <span style="font-size: 20px; margin-right: 12px;">⏰</span>
                            <span style="font-weight: 700;">${startTime} - ${endTime}</span>
                        </div>
                    </div>

                    <div style="background-color: #FFF3CD; border-left: 4px solid #F77F00; padding: 16px; border-radius: 12px; margin-bottom: 30px;">
                        <h4 style="font-size: 14px; font-weight: 900; margin: 0 0 8px 0; color: #1a1a1a;">💡 Avant le cours :</h4>
                        <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #1a1a1a;">
                            <li>Testez votre caméra et microphone</li>
                            <li>Trouvez un endroit calme et bien éclairé</li>
                            <li>Préparez du papier et des crayons de couleur</li>
                            <li>Connectez-vous 5 minutes avant le début</li>
                        </ul>
                    </div>

                    <div style="text-align: center; margin-bottom: 20px;">
                        <a href="${this.configService.get('WEB_URL')}/dashboard" style="background-color: #F77F00; color: #ffffff; padding: 16px 32px; border-radius: 16px; text-decoration: none; font-weight: 900; display: inline-block;">
                            Accéder à mon tableau de bord
                        </a>
                    </div>

                    <p style="font-size: 14px; color: #6B7280; text-align: center; margin: 0;">
                        Vous recevrez un rappel 24 heures avant votre cours.
                    </p>
                </div>
                <div style="text-align: center; margin-top: 30px; color: #9CA3AF; font-size: 12px;">
                    <p>© 2026 TaraKid. Toutes les leçons durent 25 minutes de pur bonheur !</p>
                </div>
            </div>
            `,
    });
  }
}
