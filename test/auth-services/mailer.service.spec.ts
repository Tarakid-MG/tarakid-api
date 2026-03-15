import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailerService } from 'src/auth/services/mailer.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailerService', () => {
  let service: MailerService;
  let mockTransporter: any;

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({}),
    };
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          EMAIL_HOST: 'smtp.example.com',
          EMAIL_PORT: 587,
          EMAIL_USER: 'test@example.com',
          EMAIL_PASS: 'password',
          APP_URL: 'http://localhost:3000',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MailerService>(MailerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should send a verification email with the correct URL', async () => {
      const email = 'user@example.com';
      const token = 'verify-token';
      const expectedUrl =
        'http://localhost:3000/auth/verify?token=verify-token';

      await service.sendVerificationEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"TaraKid" <test@example.com>',
        to: email,
        subject: 'Verify your account',
        html: expect.stringContaining(expectedUrl),
      });
    });
  });

  describe('sendResetPasswordEmail', () => {
    it('should send a reset password email with the correct URL', async () => {
      const email = 'user@example.com';
      const token = 'reset-token';
      const expectedUrl =
        'http://localhost:3000/auth/reset-password?token=reset-token';

      await service.sendResetPasswordEmail(email, token);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '"TaraKid" <test@example.com>',
        to: email,
        subject: 'Reset your password',
        html: expect.stringContaining(expectedUrl),
      });
    });
  });
});
