import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VerificationService } from 'src/auth/services/verification.service';
import { MailerService } from 'src/auth/services/mailer.service';
import { User } from 'src/users/user.entity';
import { BadRequestException } from '@nestjs/common';

describe('VerificationService', () => {
    let service: VerificationService;
    let userRepo: any;
    let mailerService: any;

    const mockUserRepo = {
        findOne: jest.fn(),
        save: jest.fn(),
    };

    const mockMailerService = {
        sendVerificationEmail: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                VerificationService,
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

        service = module.get<VerificationService>(VerificationService);
        userRepo = module.get(getRepositoryToken(User));
        mailerService = module.get(MailerService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('verify', () => {
        it('should successfully verify a user', async () => {
            const token = 'valid-token';
            const user = { email: 'test@example.com', isVerified: false };
            userRepo.findOne.mockResolvedValue(user);
            userRepo.save.mockResolvedValue({ ...user, isVerified: true });

            const result = await service.verify(token);

            expect(userRepo.findOne).toHaveBeenCalledWith({ where: { verificationToken: token } });
            expect(userRepo.save).toHaveBeenCalled();
            expect(result).toEqual({ message: 'Account verified successfully' });
        });

        it('should throw BadRequestException if token is invalid', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(service.verify('invalid-token')).rejects.toThrow(BadRequestException);
        });
    });

    describe('resendVerification', () => {
        it('should resend verification email', async () => {
            const email = 'test@example.com';
            const user = { email, isVerified: false };
            userRepo.findOne.mockResolvedValue(user);
            userRepo.save.mockResolvedValue(user);
            mockMailerService.sendVerificationEmail.mockResolvedValue(undefined);

            const result = await service.resendVerification(email);

            expect(userRepo.findOne).toHaveBeenCalledWith({ where: { email } });
            expect(userRepo.save).toHaveBeenCalled();
            expect(mockMailerService.sendVerificationEmail).toHaveBeenCalled();
            expect(result).toEqual({ message: 'Verification email resent' });
        });

        it('should throw BadRequestException if user not found', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(service.resendVerification('nonexistent@example.com')).rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if account already verified', async () => {
            userRepo.findOne.mockResolvedValue({ email: 'test@example.com', isVerified: true });

            await expect(service.resendVerification('test@example.com')).rejects.toThrow(BadRequestException);
        });
    });
});
