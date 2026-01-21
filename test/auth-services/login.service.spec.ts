import { Test, TestingModule } from '@nestjs/testing';
import { LoginService } from 'src/auth/services/login.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { LoginDto } from 'src/auth/dto/login.dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('LoginService', () => {
    let service: LoginService;
    let userRepo: any;
    let jwtService: any;

    const mockUserRepo = {
        findOne: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LoginService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepo,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();

        service = module.get<LoginService>(LoginService);
        userRepo = module.get(getRepositoryToken(User));
        jwtService = module.get(JwtService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('login', () => {
        const loginDto: LoginDto = { email: 'test@example.com', password: 'password' };
        const user = {
            id: 1,
            email: 'test@example.com',
            password: 'hashedPassword',
            isVerified: true,
            role: 'TEACHER'
        };

        it('should successfully login', async () => {
            userRepo.findOne.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockJwtService.sign.mockReturnValue('token');

            const result = await service.login(loginDto);

            expect(userRepo.findOne).toHaveBeenCalledWith({ where: { email: loginDto.email } });
            expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, user.password);
            expect(result).toEqual({ access_token: 'token' });
        });

        it('should throw UnauthorizedException if user not found', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if user not verified', async () => {
            userRepo.findOne.mockResolvedValue({ ...user, isVerified: false });

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
            expect(userRepo.findOne).toHaveBeenCalled();
        });

        it('should throw UnauthorizedException if password invalid', async () => {
            userRepo.findOne.mockResolvedValue(user);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if user has no password (e.g. Google login only)', async () => {
            userRepo.findOne.mockResolvedValue({ ...user, password: null, googleId: 'google-id' });

            await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('generateToken', () => {
        it('should generate a token for a user', () => {
            const user = { id: 1, role: 'TEACHER', accountType: null } as any;
            mockJwtService.sign.mockReturnValue('token');

            const result = service.generateToken(user);

            expect(mockJwtService.sign).toHaveBeenCalled();
            expect(result).toEqual({ access_token: 'token' });
        });
    });
});
