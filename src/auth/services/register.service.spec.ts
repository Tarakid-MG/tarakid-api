import { Test, TestingModule } from '@nestjs/testing';
import { RegisterService } from './register.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../users/user.entity';
import { MailerService } from './mailer.service';
import { KidService } from '../../kids/kid.service';
import { UserRole } from '../../users/enums/user-role.enum';
import { ClientAccountType } from '../../users/enums/client-account-type.enum';
import { RegisterDto } from '../dto/register.dto';
import { Gender, EnglishLevel, MotherTongueLevel } from '../../kids/kid.entity';

describe('RegisterService', () => {
  let service: RegisterService;

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockMailerService = {
    sendVerificationEmail: jest.fn(),
  };

  const mockKidService = {
    create: jest.fn(),
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
        {
          provide: KidService,
          useValue: mockKidService,
        },
      ],
    }).compile();

    service = module.get<RegisterService>(RegisterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a user and create kid profile', async () => {
    const dto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.CLIENT,
      accountType: ClientAccountType.PARENT,
      kidInfo: {
        childName: 'Kiddo',
        age: 7,
        gender: Gender.BOY,
        motherTongueSpeakingLevel: MotherTongueLevel.FLUENT,
        motherTongueReadingLevel: MotherTongueLevel.FLUENT,
        englishReadingLevel: EnglishLevel.NONE,
        englishSpeakingLevel: EnglishLevel.NONE,
        learningDuration: 'new',
        hobbies: ['play'],
      },
    };

    const savedUser = { id: 1, ...dto };
    mockUserRepo.findOne.mockResolvedValue(null);
    mockUserRepo.create.mockReturnValue(savedUser);
    mockUserRepo.save.mockResolvedValue(savedUser);

    await service.register(dto);

    expect(mockUserRepo.save).toHaveBeenCalled();
    expect(mockKidService.create).toHaveBeenCalledWith(savedUser, dto.kidInfo);
    expect(mockMailerService.sendVerificationEmail).toHaveBeenCalled();
  });

  it('should register a user WITHOUT kid profile if not provided', async () => {
    const dto: RegisterDto = {
      email: 'test2@example.com',
      password: 'password123',
      role: UserRole.CLIENT,
      accountType: ClientAccountType.PARENT,
    };

    const savedUser = { id: 2, ...dto };
    mockUserRepo.findOne.mockResolvedValue(null);
    mockUserRepo.create.mockReturnValue(savedUser);
    mockUserRepo.save.mockResolvedValue(savedUser);
    mockKidService.create.mockClear();

    await service.register(dto);

    expect(mockUserRepo.save).toHaveBeenCalled();
    expect(mockKidService.create).not.toHaveBeenCalled();
    expect(mockMailerService.sendVerificationEmail).toHaveBeenCalled();
  });
});
