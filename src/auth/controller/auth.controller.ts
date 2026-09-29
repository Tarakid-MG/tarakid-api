import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { GoogleAuthGuard } from '../guards/google-auth.guard';

import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RegisterService } from '../services/register.service';
import { LoginService } from '../services/login.service';
import { VerificationService } from '../services/verification.service';
import { ResetPasswordService } from '../services/reset-password.service';
import { GoogleAuthService } from '../services/google-auth.service';
import { User } from 'src/users/user.entity';

interface RequestUser extends Request {
  user: User;
}

@ApiTags('Common - Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private registerService: RegisterService,
    private loginService: LoginService,
    private verificationService: VerificationService,
    private resetPasswordService: ResetPasswordService,
    private googleAuthService: GoogleAuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  register(@Body() dto: RegisterDto) {
    return this.registerService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  login(@Body() dto: LoginDto) {
    return this.loginService.login(dto);
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verify account' })
  verify(@Query('token') token: string) {
    return this.verificationService.verify(token);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification email' })
  resendVerification(@Body('email') email: string) {
    return this.verificationService.resendVerification(email);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Forgot password' })
  forgotPassword(@Body('email') email: string) {
    return this.resetPasswordService.forgotPassword(email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password' })
  resetPassword(
    @Query('token') token: string,
    @Body('password') password: string,
  ) {
    return this.resetPasswordService.resetPassword(token, password);
  }

  @Post('verify-password')
  @ApiOperation({ summary: 'Verify user password (for Kid Mode exit)' })
  verifyPassword(@Body() body: { userId: number; password: string }) {
    return this.loginService
      .verifyPassword(body.userId, body.password)
      .then((valid) => ({ valid }));
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Login with Google' })
  async googleAuth() {
    // Guards handle redirect
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google auth callback' })
  googleAuthRedirect(@Req() req: RequestUser) {
    return this.googleAuthService.handleGoogleLogin(req.user);
  }
}
