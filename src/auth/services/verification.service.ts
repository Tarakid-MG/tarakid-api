import { Injectable, BadRequestException } from '@nestjs/common';
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
    ) { }

    async verify(token: string) {
        const user = await this.userRepo.findOne({ where: { verificationToken: token } });
        if (!user) throw new BadRequestException('Invalid or expired verification token');

        user.isVerified = true;
        user.verificationToken = undefined;
        await this.userRepo.save(user);

        return { message: 'Account verified successfully' };
    }

    async resendVerification(email: string) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) throw new BadRequestException('User not found');
        if (user.isVerified) throw new BadRequestException('Account already verified');

        const verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationToken = verificationToken;
        await this.userRepo.save(user);

        await this.mailerService.sendVerificationEmail(user.email, verificationToken);

        return { message: 'Verification email resent' };
    }
}
