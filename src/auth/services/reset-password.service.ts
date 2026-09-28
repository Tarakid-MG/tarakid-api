import {
  Injectable,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../../users/user.entity';
import { MailerService } from './mailer.service';

@Injectable()
export class ResetPasswordService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private mailerService: MailerService,
  ) {}

  async forgotPassword(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Utilisateur non trouvé');

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.userRepo.save(user);

    try {
      await this.mailerService.sendResetPasswordEmail(user.email, resetToken);
    } catch (error) {
      console.error(
        `Failed to send reset password email to ${user.email}:`,
        error,
      );
      throw new ServiceUnavailableException(
        "Impossible d'envoyer l'email pour le moment, réessayez plus tard",
      );
    }

    return {
      message: 'Lien de réinitialisation du mot de passe envoyé à votre email',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepo.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: MoreThan(new Date()),
      },
    });

    if (!user)
      throw new BadRequestException(
        'Jeton de réinitialisation invalide ou expiré',
      );

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await this.userRepo.save(user);

    return { message: 'Réinitialisation du mot de passe réussie' };
  }
}
