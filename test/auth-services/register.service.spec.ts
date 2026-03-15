import { Test, TestingModule } from '@nestjs/testing';
import { RegisterService } from 'src/auth/services/register.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { MailerService } from 'src/auth/services/mailer.service';
import { BadRequestException } from '@nestjs/common';
import { UserRole } from 'src/users/enums/user-role.enum';
import { RegisterDto } from 'src/auth/dto/register.dto';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('RegisterService', () => {
  let service: RegisterService;
  let userRepo: any;

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockMailerService = {
    sendVerificationEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterService,
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

    service = module.get<RegisterService>(RegisterService);
    userRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password',
      role: UserRole.TEACHER,
    };

    it('should successfully register a user', async () => {
      userRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      userRepo.create.mockReturnValue({ ...registerDto, id: '1' });
      userRepo.save.mockResolvedValue({ ...registerDto, id: '1' });
      mockMailerService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(userRepo.create).toHaveBeenCalled();
      expect(userRepo.save).toHaveBeenCalled();
      expect(mockMailerService.sendVerificationEmail).toHaveBeenCalled();
      expect(result).toEqual({
        message:
          'Registration successful. Please check your email to verify your account.',
      });
    });

    it('should throw BadRequestException if email already exists', async () => {
      userRepo.findOne.mockResolvedValue({ id: '1', email: registerDto.email });

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if accountType is required for client but missing', async () => {
      const dto = { ...registerDto, role: UserRole.CLIENT };
      await expect(service.register(dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('assignRole', () => {
    it('should successfully assign a role', async () => {
      const user = { id: 1, email: 'test@example.com', role: UserRole.TEACHER };
      userRepo.findOne.mockResolvedValue(user);
      userRepo.save.mockResolvedValue({ ...user, role: UserRole.ADMIN });

      const result = await service.assignRole(1, UserRole.ADMIN);

      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(userRepo.save).toHaveBeenCalled();
      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should throw BadRequestException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.assignRole(1, UserRole.ADMIN)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
