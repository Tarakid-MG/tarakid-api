import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { AgoraService } from './agora.service';

@ApiTags('Common - agora')
@Controller('agora')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AgoraController {
  constructor(private readonly agoraService: AgoraService) {}

  @Get('token')
  async getToken(
    @Req() req: RequestWithUser,
    @Query('channel') channel: string,
    @Query('uid') uid: string,
  ) {
    const numericUid = Number(uid);
    if (!channel || !Number.isFinite(numericUid)) {
      throw new BadRequestException('Paramètres channel/uid invalides');
    }
    if (numericUid !== req.user.id) {
      throw new ForbiddenException('uid ne correspond pas à votre compte');
    }

    await this.agoraService.verifyChannelAccess(channel, req.user);

    const rtc = this.agoraService.generateToken(channel, numericUid);
    const rtm = this.agoraService.generateRtmToken(uid);

    return {
      rtc,
      rtm,
    };
  }
}
