import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../users/enums/user-role.enum';
import { RegisterService } from './services/register.service';
import { LoginService } from './services/login.service';
import { VerificationService } from './services/verification.service';
import { ResetPasswordService } from './services/reset-password.service';
import { GoogleAuthService } from './services/google-auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let registerService: RegisterService;
  let loginService: LoginService;

  const mockRegisterService = {
    register: jest.fn(),
    assignRole: jest.fn(),
  };

  const mockLoginService = {
    login: jest.fn(),
  };

  const mockVerificationService = {
    verify: jest.fn(),
    resendVerification: jest.fn(),
  };

  const mockResetPasswordService = {
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  const mockGoogleAuthService = {
    handleGoogleLogin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: RegisterService, useValue: mockRegisterService },
        { provide: LoginService, useValue: mockLoginService },
        { provide: VerificationService, useValue: mockVerificationService },
        { provide: ResetPasswordService, useValue: mockResetPasswordService },
        { provide: GoogleAuthService, useValue: mockGoogleAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    registerService = module.get<RegisterService>(RegisterService);
    loginService = module.get<LoginService>(LoginService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should call registerService.register with the dto', async () => {
      const dto: RegisterDto = {
        email: 'test@example.com',
        password: 'password',
        role: UserRole.TEACHER,
      };
      mockRegisterService.register.mockResolvedValue({ message: 'Success' });

      const result = await controller.register(dto);

      expect(registerService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: 'Success' });
    });
  });

  describe('login', () => {
    it('should call loginService.login with the dto', async () => {
      const dto: LoginDto = { email: 'test@example.com', password: 'password' };
      mockLoginService.login.mockResolvedValue({ access_token: 'token' });

      const result = await controller.login(dto);

      expect(loginService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ access_token: 'token' });
    });
  });

  describe('assignRole', () => {
    it('should call registerService.assignRole', async () => {
      const body = { userId: 1, role: UserRole.ADMIN };
      mockRegisterService.assignRole.mockResolvedValue({ id: 1, role: UserRole.ADMIN });

      const result = await controller.assignRole(body);

      expect(registerService.assignRole).toHaveBeenCalledWith(body.userId, body.role);
      expect(result.role).toBe(UserRole.ADMIN);
    });
  });
});
