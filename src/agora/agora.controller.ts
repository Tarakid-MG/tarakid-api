import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AgoraService } from './agora.service';

@ApiTags('Common - agora')
@Controller('agora')
export class AgoraController {
  constructor(private readonly agoraService: AgoraService) {}

  @Get('token')
  getToken(@Query('channel') channel: string, @Query('uid') uid: string) {
    const rtc = this.agoraService.generateToken(channel, Number(uid));
    const rtm = this.agoraService.generateRtmToken(uid);

    return {
      rtc,
      rtm,
    };
  }
}
