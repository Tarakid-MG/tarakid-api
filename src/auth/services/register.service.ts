import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../../users/user.entity';
import { RegisterDto } from '../dto/register.dto';
import { UserRole } from '../../users/enums/user-role.enum';
import { MailerService } from './mailer.service';
import { KidService } from '../../kids/kid.service';

@Injectable()
export class RegisterService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private mailerService: MailerService,
    private kidService: KidService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.role === UserRole.CLIENT && !dto.accountType)
      throw new BadRequestException('accountType requis pour le client');
    if (dto.role !== UserRole.CLIENT && dto.accountType)
      throw new BadRequestException('accountType uniquement pour le client');

    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new BadRequestException('Email déjà utilisé');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = this.userRepo.create({
      ...dto,
      password: hashedPassword,
      verificationToken,
    });

    const savedUser = await this.userRepo.save(user);

    if (dto.kidInfo) {
      await this.kidService.create(savedUser, dto.kidInfo);
    }

    await this.mailerService.sendVerificationEmail(
      user.email,
      verificationToken,
    );

    return {
      message:
        'Inscription réussie. Veuillez vérifier vos emails pour confirmer votre compte.',
      userId: savedUser.id,
    };
  }

  async assignRole(userId: number, role: UserRole) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('Utilisateur non trouvé');
    user.role = role;
    return this.userRepo.save(user);
  }
}
