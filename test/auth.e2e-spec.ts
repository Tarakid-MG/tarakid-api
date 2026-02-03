import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../src/users/user.entity';
import { UserRole } from '../src/users/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userRepo: any;

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_EXPIRES_IN = '1h';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepo)
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => {
          if (key === 'JWT_SECRET') return 'test_secret';
          if (key === 'JWT_EXPIRES_IN') return '1h';
          return null;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    userRepo = moduleFixture.get(getRepositoryToken(User));
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.TEACHER,
      };

      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue({ ...registerDto, id: '1' });
      userRepo.save.mockResolvedValue({ ...registerDto, id: '1' });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
        });
    });

    it('should fail if email exists', () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.TEACHER,
      };

      userRepo.findOne.mockResolvedValue({ id: '1', ...registerDto });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400); // BadRequest
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login a user', async () => {
      const loginDto = { email: 'test@example.com', password: 'password' };
      const hashedPassword = await bcrypt.hash('password', 10);

      userRepo.findOne.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: hashedPassword,
        role: UserRole.TEACHER,
      });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
        });
    });

    it('should fail with invalid credentials', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrongpassword' };
      const hashedPassword = await bcrypt.hash('password', 10);

      userRepo.findOne.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: hashedPassword,
        role: UserRole.TEACHER,
      });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401); // Unauthorized
    });
  });
});
