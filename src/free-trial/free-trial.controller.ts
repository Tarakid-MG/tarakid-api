import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseIntPipe,
  BadRequestException,
  Delete,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FreeTrialService } from './free-trial.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateBulkSessionsDto } from './dto/create-bulk-sessions.dto';

@ApiTags('Free Trial')
@Controller('free-trial')
export class FreeTrialController {
  constructor(private readonly freeTrialService: FreeTrialService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new free trial session (Admin)' })
  createSession(@Body() createSessionDto: CreateSessionDto) {
    return this.freeTrialService.createSession(createSessionDto);
  }

  @Get('available-sessions')
  @ApiOperation({ summary: 'Get all available free trial sessions' })
  findAllAvailableSessions() {
    return this.freeTrialService.findAllAvailableSessions();
  }

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
  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete a free trial session (Admin)' })
  deleteSession(@Param('id', ParseIntPipe) id: number) {
    return this.freeTrialService.deleteSession(id);
  }

  @Post('bulk-sessions')
  @ApiOperation({ summary: 'Create multiple free trial sessions (Admin)' })
  createBulkSessions(@Body() createBulkSessionsDto: CreateBulkSessionsDto) {
    return this.freeTrialService.createBulkSessions(createBulkSessionsDto);
  }

  @Patch('sessions/:id')
  @ApiOperation({ summary: 'Update a free trial session (Admin)' })
  updateSession(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: any,
  ) {
    return this.freeTrialService.updateSession(id, updateData);
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
}
