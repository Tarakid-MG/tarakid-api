import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GoogleAuthService } from 'src/auth/services/google-auth.service';
import { LoginService } from 'src/auth/services/login.service';
import { User } from 'src/users/user.entity';
import { UserRole } from 'src/users/enums/user-role.enum';

describe('GoogleAuthService', () => {
    let service: GoogleAuthService;
    let userRepo: any;
    let loginService: any;

    const mockUserRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const mockLoginService = {
        generateToken: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GoogleAuthService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepo,
                },
                {
                    provide: LoginService,
                    useValue: mockLoginService,
                },
            ],
        }).compile();

        service = module.get<GoogleAuthService>(GoogleAuthService);
        userRepo = module.get(getRepositoryToken(User));
        loginService = module.get(LoginService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validateGoogleUser', () => {
        const details = {
            googleId: 'google-id',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
        };

        it('should return existing user if found by googleId', async () => {
            const user = { id: 1, googleId: 'google-id' };
            userRepo.findOne.mockResolvedValue(user);

            const result = await service.validateGoogleUser(details);

            expect(userRepo.findOne).toHaveBeenCalledWith({ where: { googleId: details.googleId } });
            expect(result).toEqual(user);
        });

        it('should update and return existing user if found by email', async () => {
            const user = { id: 1, email: 'test@example.com' };
            userRepo.findOne.mockResolvedValueOnce(null); // by googleId
            userRepo.findOne.mockResolvedValueOnce(user); // by email
            userRepo.save.mockResolvedValue({ ...user, googleId: details.googleId, isVerified: true });

            const result = await service.validateGoogleUser(details);

            expect(userRepo.findOne).toHaveBeenCalledTimes(2);
            expect(userRepo.save).toHaveBeenCalled();
            expect(result.googleId).toBe(details.googleId);
            expect(result.isVerified).toBe(true);
        });

        it('should create and return new user if not found', async () => {
            userRepo.findOne.mockResolvedValue(null);
            const newUser = { ...details, role: UserRole.CLIENT, isVerified: true };
            userRepo.create.mockReturnValue(newUser);
            userRepo.save.mockResolvedValue(newUser);

            const result = await service.validateGoogleUser(details);

            expect(userRepo.create).toHaveBeenCalledWith({
                email: details.email,
                googleId: details.googleId,
                role: UserRole.CLIENT,
                isVerified: true,
            });
            expect(userRepo.save).toHaveBeenCalled();
            expect(result).toEqual(newUser);
        });
    });

    describe('handleGoogleLogin', () => {
        it('should call loginService.generateToken', async () => {
            const user = { id: 1 } as User;
            mockLoginService.generateToken.mockReturnValue({ access_token: 'token' });

            const result = await service.handleGoogleLogin(user);

            expect(mockLoginService.generateToken).toHaveBeenCalledWith(user);
            expect(result).toEqual({ access_token: 'token' });
        });
    });
});
