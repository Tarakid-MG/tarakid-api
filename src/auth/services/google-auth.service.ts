import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';
import { UserRole } from '../../users/enums/user-role.enum';
import { LoginService } from './login.service';

interface GoogleUser {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class GoogleAuthService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private loginService: LoginService,
  ) {}

  async validateGoogleUser(details: GoogleUser) {
    let user = await this.userRepo.findOne({
      where: { googleId: details.googleId },
    });
    if (user) return user;

    user = await this.userRepo.findOne({ where: { email: details.email } });
    if (user) {
      user.googleId = details.googleId;
      user.isVerified = true; // Google account is considered verified
      return this.userRepo.save(user);
    }

    const newUser = this.userRepo.create({
      email: details.email,
      googleId: details.googleId,
      role: UserRole.CLIENT,
      isVerified: true,
    });
    return this.userRepo.save(newUser);
  }

  handleGoogleLogin(user: User) {
    return this.loginService.generateToken(user);
  }
}
