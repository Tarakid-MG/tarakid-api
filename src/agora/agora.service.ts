import { Injectable } from '@nestjs/common';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

@Injectable()
export class AgoraService {
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
}
