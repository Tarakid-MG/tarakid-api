import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Patch,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TeacherBookingsService } from '../services/teacher-bookings.service';
import { SetAvailabilityDto } from '../dto/set-availability.dto';
import { User } from '../../users/user.entity';
import { Booking } from '../entities/booking.entity';
import { TeacherAvailability } from '../entities/teacher-availability.entity';

type AuthRequest = Request & { user: User };

@ApiTags('Teacher Bookings')
@Controller('bookings/teacher')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsTeacherController {
  constructor(
    private readonly teacherBookingsService: TeacherBookingsService,
  ) {}

  @Get('availability')
  @ApiOperation({ summary: 'Get availability slots for teacher' })
  async getTeacherAvailability(
    @Req() req: AuthRequest,
  ): Promise<TeacherAvailability[]> {
    return await this.teacherBookingsService.getTeacherAvailability(
      req.user.id,
    );
  }

  @Post('availability')
  @ApiOperation({ summary: 'Set availability slots for teacher' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async setTeacherAvailability(
    @Req() req: AuthRequest,
    @Body() dto: SetAvailabilityDto,
  ): Promise<TeacherAvailability[]> {
    return await this.teacherBookingsService.setTeacherAvailability(
      req.user.id,
      dto,
    );
  }

  @Patch(':id/absent')
  @ApiOperation({ summary: 'Mark a booking as absent' })
  @ApiParam({ name: 'id', example: 'uuid-string', description: 'Booking ID' })
  async markAbsent(@Param('id') id: string): Promise<Booking> {
    return await this.teacherBookingsService.markAbsent(id);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming courses for teacher (next 2 days)' })
  async getTeacherUpcoming(@Req() req: AuthRequest): Promise<any[]> {
    return await this.teacherBookingsService.findTeacherUpcoming(req.user.id);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get teacher calendar sessions including past classes' })
  async getTeacherCalendar(@Req() req: AuthRequest): Promise<any[]> {
    return await this.teacherBookingsService.findTeacherCalendarSessions(
      req.user.id,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get performance and earnings stats for teacher' })
  async getTeacherStats(@Req() req: AuthRequest): Promise<any> {
    return await this.teacherBookingsService.getTeacherStats(req.user.id);
  }

  @Patch(':id/lesson')
  @ApiOperation({ summary: 'Assign a lesson to a session' })
  @ApiParam({ name: 'id', example: 'uuid-string', description: 'Booking ID' })
  async assignLesson(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body('lessonId') lessonId: string,
  ): Promise<any> {
    return await this.teacherBookingsService.assignLessonToBooking(
      req.user.id,
      id,
      lessonId,
    );
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a session as a teacher' })
  @ApiParam({ name: 'id', example: 'uuid-string', description: 'Booking ID' })
  async cancelSession(
    @Req() req: AuthRequest,
    @Param('id') id: string,
  ): Promise<any> {
    return await this.teacherBookingsService.cancelBooking(req.user.id, id);
  }

  @Get(':id/classroom-status')
  @ApiOperation({ summary: 'Get classroom status for a booking' })
  @ApiParam({ name: 'id', example: 'uuid', description: 'Booking ID' })
  async getClassroomStatus(
    @Req() req: AuthRequest,
    @Param('id') id: string,
  ): Promise<Booking> {
    // Both teacher and service can access this
    return await this.teacherBookingsService.getClassroomStatus(id);
  }

  @Patch(':id/acceptance-status')
  @ApiOperation({ summary: 'Accept kid into classroom' })
  @ApiParam({ name: 'id', example: 'uuid', description: 'Booking ID' })
  async updateAcceptanceStatus(
    @Param('id') id: string,
    @Body('isKidAccepted') isKidAccepted: boolean,
  ): Promise<Booking> {
    return await this.teacherBookingsService.updateClassroomStatus(id, {
      isKidAccepted,
    });
  }

  @Patch(':id/presence')
  @ApiOperation({ summary: 'Update teacher presence in class' })
  @ApiParam({ name: 'id', example: 'uuid', description: 'Booking ID' })
  async updatePresence(
    @Param('id') id: string,
    @Body('isTeacherInClass') isTeacherInClass: boolean,
  ): Promise<Booking> {
    return await this.teacherBookingsService.updateClassroomStatus(id, {
      isTeacherInClass,
    });
  }

  @Patch(':id/interaction')
  @ApiOperation({ summary: 'Update interaction data for a session' })
  @ApiParam({ name: 'id', example: 'uuid', description: 'Booking ID' })
  async updateInteraction(
    @Param('id') id: string,
    @Body('interactionData') interactionData: string,
  ): Promise<Booking> {
    return await this.teacherBookingsService.updateInteractionData(
      id,
      interactionData,
    );
  }
}
