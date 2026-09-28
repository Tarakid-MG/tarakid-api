import {
  Injectable,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { User } from '../../users/user.entity';
import { MailerService } from './mailer.service';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private mailerService: MailerService,
  ) {}

  async verify(token: string) {
    const user = await this.userRepo.findOne({
      where: { verificationToken: token },
    });
    if (!user)
      throw new BadRequestException('Jeton de vérification invalide ou expiré');

    user.isVerified = true;
    user.verificationToken = undefined;
    await this.userRepo.save(user);

    return { message: 'Compte vérifié avec succès' };
  }

  async resendVerification(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Utilisateur non trouvé');
    if (user.isVerified) throw new BadRequestException('Compte déjà vérifié');

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await this.userRepo.save(user);

    try {
      await this.mailerService.sendVerificationEmail(
        user.email,
        verificationToken,
      );
    } catch (error) {
      console.error(
        `Failed to resend verification email to ${user.email}:`,
        error,
      );
      throw new ServiceUnavailableException(
        "Impossible d'envoyer l'email pour le moment, réessayez plus tard",
      );
    }

    return { message: 'Email de vérification renvoyé' };
  }
}
