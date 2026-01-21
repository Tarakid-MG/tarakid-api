import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/user.entity';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class LoginService {
    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async login(dto: LoginDto) {
        const user = await this.userRepo.findOne({ where: { email: dto.email } });
        if (!user) throw new UnauthorizedException('Invalid credentials');

        if (!user.isVerified) {
            throw new UnauthorizedException('Please verify your account first.');
        }

        if (!user.password) {
            if (user.googleId) {
                throw new UnauthorizedException('Please login with Google');
            }
            throw new UnauthorizedException('Invalid credentials');
        }

        const isValid = await bcrypt.compare(dto.password, user.password);
        if (!isValid) throw new UnauthorizedException('Invalid credentials');

        return this.generateToken(user);
    }

    generateToken(user: User) {
        const payload = { sub: user.id, role: user.role, accountType: user.accountType };
        return { access_token: this.jwtService.sign(payload) };
    }
}
