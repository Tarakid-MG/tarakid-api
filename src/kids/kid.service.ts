import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kid } from './kid.entity';
import { CreateKidDto } from './dto/create-kid.dto';
import { User } from '../users/user.entity';

@Injectable()
export class KidService {
  constructor(
    @InjectRepository(Kid)
    private kidRepo: Repository<Kid>,
  ) {}

  async create(user: User, dto: CreateKidDto): Promise<Kid> {
    const kid = this.kidRepo.create({
      ...dto,
      name: dto.childName,
      user,
    });
    return this.kidRepo.save(kid);
  }
}
