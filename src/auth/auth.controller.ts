import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { UserRole } from '../users/enums/user-role.enum';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterService } from './services/register.service';
import { LoginService } from './services/login.service';
import { VerificationService } from './services/verification.service';
import { ResetPasswordService } from './services/reset-password.service';
import { GoogleAuthService } from './services/google-auth.service';
import { User } from 'src/users/user.entity';

interface RequestUser extends Request {
  user: User;
}

@ApiTags('Auth')
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

  @Post('assign-role')
  @ApiOperation({ summary: 'Assign role to user' })
  assignRole(@Body() body: { userId: number; role: UserRole }) {
    // This was in AuthService, but not explicitly moved to any of the new services yet.
    // Given the "each functionality in one service" rule, maybe a UserService or update RegisterService.
    // For now, I'll keep it here but it needs a home. I'll put it in RegisterService as it's user management.
    // Actually, I'll just keep it here and use userRepo directly if needed, or better, move it to a service.
    // Since I'm refactoring, let's just use the repo here or move it.
    // For simplicity and following the rule, I'll add it to RegisterService for now or leave it for later.
    // Actually, I'll move it to RegisterService.
    return this.registerService.assignRole(body.userId, body.role);
  }
}
