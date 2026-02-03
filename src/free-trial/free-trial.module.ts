import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FreeTrialSession } from './entities/free-trial-session.entity';
import { FreeTrialBooking } from './entities/free-trial-booking.entity';
import { FreeTrialService } from './free-trial.service';
import { FreeTrialController } from './free-trial.controller';
import { MailerService } from '../auth/services/mailer.service';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FreeTrialSession, FreeTrialBooking, User]),
  ],
  controllers: [FreeTrialController],
  providers: [FreeTrialService, MailerService],
  exports: [FreeTrialService],
})
export class FreeTrialModule {}
