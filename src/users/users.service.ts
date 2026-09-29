import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UserRole } from './enums/user-role.enum';
import * as bcrypt from 'bcrypt';
import { MinioService } from '../minio/minio.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly minioService: MinioService,
  ) {}

  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['kids', 'bookings'],
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    if (user.kids?.length) {
      user.kids = await Promise.all(
        user.kids.map(async (kid) => {
          if (!kid.avatarUrl) {
            return kid;
          }

          try {
            return {
              ...kid,
              avatarUrl: await this.minioService.refreshPresignedUrl(
                kid.avatarUrl,
              ),
            };
          } catch {
            return kid;
          }
        }),
      );
    }

    return user;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async updateStatus(id: number, isOnline: boolean): Promise<User> {
    const user = await this.findById(id);
    user.isOnline = isOnline;
    if (isOnline) {
      user.lastActivity = new Date();
    }
    return this.userRepo.save(user);
  }

  async createTeacher(dto: CreateTeacherDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const teacher = this.userRepo.create({
      ...dto,
      password: hashedPassword,
      role: UserRole.TEACHER,
      isVerified: true,
    });
    return this.userRepo.save(teacher);
  }

  async findAllTeachers(): Promise<User[]> {
    return this.userRepo.find({
      where: { role: UserRole.TEACHER },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllClients(): Promise<User[]> {
    return this.userRepo.find({
      where: { role: UserRole.CLIENT },
      relations: ['kids'],
      order: { createdAt: 'DESC' },
    });
  }

  async deactivateUser(id: number): Promise<User> {
    const user = await this.findById(id);
    user.isActive = false;
    return this.userRepo.save(user);
  }

  async reactivateUser(id: number): Promise<User> {
    const user = await this.findById(id);
    user.isActive = true;
    return this.userRepo.save(user);
  }
}
