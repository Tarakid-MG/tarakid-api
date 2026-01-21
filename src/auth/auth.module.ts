import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from '../users/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './strategies/google.strategy';
import { AuthController } from './auth.controller';
import { MailerService } from './services/mailer.service';
import { RegisterService } from './services/register.service';
import { LoginService } from './services/login.service';
import { VerificationService } from './services/verification.service';
import { ResetPasswordService } from './services/reset-password.service';
import { GoogleAuthService } from './services/google-auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: (configService.get<string>('JWT_EXPIRES_IN') || '30d') as any },
      }),
    }),
  ],
  providers: [
    GoogleStrategy,
    MailerService,
    RegisterService,
    LoginService,
    VerificationService,
    ResetPasswordService,
    GoogleAuthService,
  ],
  controllers: [AuthController],
})
export class AuthModule { }
