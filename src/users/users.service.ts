import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UserRole } from './enums/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['kids'],
    });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    return user;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, dto);
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
}
