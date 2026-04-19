import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FreeTrialService } from './free-trial.service';

@ApiTags('Client - Free Trial')
@Controller('free-trial')
export class FreeTrialController {
  constructor(private readonly freeTrialService: FreeTrialService) {}

  @Post('book/:sessionId')
  @ApiOperation({ summary: 'Book a free trial session' })
  bookSession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() body: { userId: number; kidId?: string },
  ) {
    if (!body.userId) {
      throw new BadRequestException('userId est requis pour la réservation');
    }
    return this.freeTrialService.bookSession(
      body.userId,
      sessionId,
      body.kidId,
    );
  }

  @Post('book-by-datetime')
  @ApiOperation({ summary: 'Book a free trial session by date and time' })
  bookByDateTime(
    @Body()
    body: {
      userId: number;
      date: string;
      startTime: string;
      kidId?: string;
    },
  ) {
    if (!body.userId || !body.date || !body.startTime) {
      throw new BadRequestException(
        'userId, date et startTime sont requis pour la réservation',
      );
    }
    return this.freeTrialService.bookByDateTime(
      body.userId,
      body.date,
      body.startTime,
      body.kidId,
    );
  }
  @Get('bookings/user/:userId')
  @ApiOperation({ summary: 'Get user bookings with session details' })
  getUserBookings(@Param('userId', ParseIntPipe) userId: number) {
    return this.freeTrialService.getUserBookings(userId);
  }

  @Patch('bookings/:bookingId/cancel')
  @ApiOperation({ summary: 'Cancel a free trial booking' })
  cancelBooking(
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @Body('userId') userId: number,
  ) {
    if (!userId) {
      throw new BadRequestException(
        'userId est requis pour annuler la réservation',
      );
    }
    return this.freeTrialService.cancelBooking(bookingId, userId);
  }

  @Patch('bookings/:bookingId/report')
  @ApiOperation({ summary: 'Report a free trial booking' })
  reportBooking(
    @Param('bookingId', ParseIntPipe) bookingId: number,
    @Body('userId') userId: number,
  ) {
    if (!userId) {
      throw new BadRequestException(
        'userId est requis pour reporter la réservation',
      );
    }
    return this.freeTrialService.reportBooking(bookingId, userId);
  }

  @Get(':id/classroom-status')
  @ApiOperation({ summary: 'Get classroom status for a trial booking' })
  async getClassroomStatus(@Param('id') id: string) {
    return this.freeTrialService.getClassroomStatus(id);
  }

  @Patch(':id/waiting-status')
  @ApiOperation({ summary: 'Update waiting status for a kid' })
  async updateWaitingStatus(
    @Param('id') id: string,
    @Body('isKidWaiting') isKidWaiting: boolean,
  ) {
    return this.freeTrialService.updateClassroomStatus(id, { isKidWaiting });
  }

  @Patch(':id/acceptance-status')
  @ApiOperation({ summary: 'Update acceptance status for a kid' })
  async updateAcceptanceStatus(
    @Param('id') id: string,
    @Body('isKidAccepted') isKidAccepted: boolean,
  ) {
    return this.freeTrialService.updateClassroomStatus(id, { isKidAccepted });
  }

  @Patch(':id/interaction')
  @ApiOperation({ summary: 'Update interaction data for a session' })
  async updateInteraction(
    @Param('id') id: string,
    @Body('interactionData') interactionData: string,
  ) {
    return this.freeTrialService.updateInteractionData(id, interactionData);
  }

  @Patch(':id/presence')
  @ApiOperation({ summary: 'Update teacher presence in class' })
  async updatePresence(
    @Param('id') id: string,
    @Body('isTeacherInClass') isTeacherInClass: boolean,
  ) {
    return this.freeTrialService.updateClassroomStatus(id, {
      isTeacherInClass,
    });
  }
}
