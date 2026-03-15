import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResetPasswordService } from 'src/auth/services/reset-password.service';
import { MailerService } from 'src/auth/services/mailer.service';
import { User } from 'src/users/user.entity';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('ResetPasswordService', () => {
  let service: ResetPasswordService;
  let userRepo: any;

  const mockUserRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockMailerService = {
    sendResetPasswordEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResetPasswordService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
      ],
    }).compile();

    service = module.get<ResetPasswordService>(ResetPasswordService);
    userRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('forgotPassword', () => {
    it('should generate a token and send an email', async () => {
      const email = 'test@example.com';
      const user = { email };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue(user);
      mockMailerService.sendResetPasswordEmail.mockResolvedValue(undefined);

      const result = await service.forgotPassword(email);

      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(userRepo.save).toHaveBeenCalled();
      expect(mockMailerService.sendResetPasswordEmail).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Password reset link sent to your email',
      });
    });

    it('should throw BadRequestException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.forgotPassword('nonexistent@example.com'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password', async () => {
      const token = 'valid-token';
      const newPassword = 'new-password';
      const user = { email: 'test@example.com' };
      userRepo.findOne.mockResolvedValue(user);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');
      userRepo.save.mockResolvedValue({
        ...user,
        password: 'hashed-new-password',
      });

      const result = await service.resetPassword(token, newPassword);

      expect(userRepo.findOne).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(newPassword, 10);
      expect(userRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Password reset successful' });
    });

    it('should throw BadRequestException if token is invalid or expired', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword('invalid-token', 'password'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
