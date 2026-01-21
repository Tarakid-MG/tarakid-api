import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../../users/user.entity';
import { RegisterDto } from '../dto/register.dto';
import { UserRole } from '../../users/enums/user-role.enum';
import { MailerService } from './mailer.service';

@Injectable()
export class RegisterService {
    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private mailerService: MailerService,
    ) { }

    async register(dto: RegisterDto) {
        if (dto.role === UserRole.CLIENT && !dto.accountType)
            throw new BadRequestException('accountType required for client');
        if (dto.role !== UserRole.CLIENT && dto.accountType)
            throw new BadRequestException('accountType only for client');

        const exists = await this.userRepo.findOne({ where: { email: dto.email } });
        if (exists) throw new BadRequestException('Email already used');

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const verificationToken = crypto.randomBytes(32).toString('hex');

        const user = this.userRepo.create({
            ...dto,
            password: hashedPassword,
            verificationToken,
        });

        await this.userRepo.save(user);
        await this.mailerService.sendVerificationEmail(user.email, verificationToken);

        return { message: 'Registration successful. Please check your email to verify your account.' };
    }

    async assignRole(userId: number, role: UserRole) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');
        user.role = role;
        return this.userRepo.save(user);
    }
}
