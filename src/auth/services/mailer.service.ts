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
        const url = `${this.configService.get('APP_URL')}/auth/verify?token=${token}`;
        await this.transporter.sendMail({
            from: `"TaraKid" <${this.configService.get('EMAIL_USER')}>`,
            to: email,
            subject: 'Verify your account',
            html: `<p>Please click <a href="${url}">here</a> to verify your account.</p>`,
        });
    }

    async sendResetPasswordEmail(email: string, token: string) {
        const url = `${this.configService.get('APP_URL')}/auth/reset-password?token=${token}`;
        await this.transporter.sendMail({
            from: `"TaraKid" <${this.configService.get('EMAIL_USER')}>`,
            to: email,
            subject: 'Reset your password',
            html: `<p>Please click <a href="${url}">here</a> to reset your password.</p>`,
        });
    }
}
