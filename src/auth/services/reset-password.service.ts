import { Injectable, BadRequestException } from '@nestjs/common';
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
    ) { }

    async forgotPassword(email: string) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) throw new BadRequestException('User not found');

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

        await this.userRepo.save(user);
        await this.mailerService.sendResetPasswordEmail(user.email, resetToken);

        return { message: 'Password reset link sent to your email' };
    }

    async resetPassword(token: string, newPassword: string) {
        const user = await this.userRepo.findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: MoreThan(new Date()),
            },
        });

        if (!user) throw new BadRequestException('Invalid or expired reset token');

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await this.userRepo.save(user);

        return { message: 'Password reset successful' };
    }
}
