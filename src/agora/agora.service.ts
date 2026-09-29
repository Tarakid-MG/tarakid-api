import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RtcTokenBuilder,
  RtcRole,
  RtmTokenBuilder,
  RtmRole,
} from 'agora-access-token';
import { Booking } from '../bookings/entities/booking.entity';
import { FreeTrialBooking } from '../free-trial/entities/free-trial-booking.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class AgoraService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(FreeTrialBooking)
    private readonly freeTrialBookingRepository: Repository<FreeTrialBooking>,
  ) {}

  async verifyChannelAccess(channel: string, user: User): Promise<void> {
    const bookingId = channel.startsWith('class-')
      ? channel.slice('class-'.length)
      : channel;

    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });
    const freeTrialBooking = booking
      ? null
      : await this.freeTrialBookingRepository.findOne({
          where: { id: Number(bookingId) },
        });

    const match = booking || freeTrialBooking;
    if (!match) {
      throw new NotFoundException('Réservation introuvable pour ce cours');
    }

    const isParticipant =
      match.userId === user.id ||
      match.teacherId === user.id ||
      user.role === UserRole.ADMIN;

    if (!isParticipant) {
      throw new ForbiddenException("Vous n'avez pas accès à ce cours");
    }
  }

  generateToken(channelName: string, uid: number) {
    const appId = process.env.AGORA_APP_ID!;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE!;

    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600;

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
    );

    return {
      token,
      appId,
      channel: channelName,
      uid,
    };
  }

  generateRtmToken(uid: string) {
    const appId = process.env.AGORA_APP_ID!;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE!;
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    const token = RtmTokenBuilder.buildToken(
      appId,
      appCertificate,
      uid,
      RtmRole.Rtm_User,
      privilegeExpiredTs,
    );

    return {
      token,
      appId,
      uid,
    };
  }
}
