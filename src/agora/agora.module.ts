import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgoraService } from './agora.service';
import { AgoraController } from './agora.controller';
import { Booking } from '../bookings/entities/booking.entity';
import { FreeTrialBooking } from '../free-trial/entities/free-trial-booking.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, FreeTrialBooking])],
  providers: [AgoraService],
  controllers: [AgoraController],
})
export class AgoraModule {}
