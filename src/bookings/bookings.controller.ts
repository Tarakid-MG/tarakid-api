import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  UseGuards,
  Req,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { User } from '../users/user.entity';
import { Booking } from './entities/booking.entity';
import { TeacherAvailability } from './entities/teacher-availability.entity';

type AuthRequest = Request & { user: User };

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('availability')
  @ApiOperation({ summary: 'Get global teacher availability' })
  async getGlobalAvailability(): Promise<any> {
    return await this.bookingsService.getGlobalAvailability();
  }

  @Get('available-dates')
  @ApiOperation({
    summary: 'Get available dates for the specified number of months',
  })
  async getAvailableDates(
    @Query('months') months?: number,
  ): Promise<{ available: string[]; full: string[] }> {
    return await this.bookingsService.getAvailableDates(
      months ? Number(months) : 2,
    );
  }

  @Get('teacher/availability')
  @ApiOperation({ summary: 'Get availability slots for teacher' })
  async getTeacherAvailability(
    @Req() req: AuthRequest,
  ): Promise<TeacherAvailability[]> {
    return await this.bookingsService.getTeacherAvailability(req.user.id);
  }

  @Post('teacher/availability')
  @ApiOperation({ summary: 'Set availability slots for teacher' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async setTeacherAvailability(
    @Req() req: AuthRequest,
    @Body() dto: SetAvailabilityDto,
  ): Promise<TeacherAvailability[]> {
    return await this.bookingsService.setTeacherAvailability(req.user.id, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create booking(s)' })
  async create(
    @Req() req: AuthRequest,
    @Body() createBookingDto: CreateBookingDto,
  ): Promise<Booking[]> {
    return await this.bookingsService.create(req.user.id, createBookingDto);
  }

  @Get('kid/:kidId')
  @ApiOperation({ summary: 'Get all bookings for a kid' })
  async getKidBookings(
    @Param('kidId') kidId: string,
    @Req() req: AuthRequest,
  ): Promise<Booking[]> {
    return await this.bookingsService.findByKid(kidId, req.user.id);
  }

  @Get('upcoming/:kidId')
  @ApiOperation({ summary: 'Get upcoming bookings for a kid' })
  async getUpcomingBookings(
    @Param('kidId') kidId: string,
    @Req() req: AuthRequest,
  ): Promise<Booking[]> {
    return await this.bookingsService.findUpcoming(kidId, req.user.id);
  }

  @Get('subscription/:subscriptionId')
  @ApiOperation({ summary: 'Get bookings for a subscription' })
  async getSubscriptionBookings(
    @Param('subscriptionId') subscriptionId: string,
    @Req() req: AuthRequest,
  ): Promise<Booking[]> {
    return await this.bookingsService.findBySubscription(
      subscriptionId,
      req.user.id,
    );
  }

  @Get('suggested-schedule')
  @ApiOperation({ summary: 'Get suggested schedules for a subscription' })
  async getSuggestedSchedules(
    @Query('subscriptionId') subscriptionId: string,
  ): Promise<any[]> {
    return await this.bookingsService.getSuggestedSchedules(subscriptionId);
  }

  // ── Admin Teacher Assignment Endpoints ─────────────────────────────────────

  @Get('admin/booked-slots')
  @ApiOperation({
    summary: 'List all currently booked slots requiring a teacher',
  })
  async getAllBookedSlots(): Promise<
    { date: string; time: string; type: string; id: string | number }[]
  > {
    return await this.bookingsService.getAllBookedSlots();
  }

  @Get('admin/available-teachers')
  @ApiOperation({
    summary:
      'List available teachers for a specific slot, ordered by performance',
  })
  async getAvailableTeachersForSlot(
    @Query('date') date: string,
    @Query('time') time: string,
  ): Promise<User[]> {
    return await this.bookingsService.getAvailableTeachersForSlot(date, time);
  }

  @Patch('admin/:id/assign')
  @ApiOperation({ summary: 'Assign a teacher to a booking' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['REGULAR', 'FREE_TRIAL'],
          description: 'The type of booking',
        },
        teacherId: {
          type: 'number',
          description: 'The ID of the teacher to assign',
        },
      },
      required: ['type', 'teacherId'],
    },
  })
  async assignTeacherToBooking(
    @Param('id') id: string,
    @Body('type') type: 'REGULAR' | 'FREE_TRIAL',
    @Body('teacherId') teacherId: number,
  ): Promise<{ message: string }> {
    await this.bookingsService.assignTeacherToBooking(id, type, teacherId);
    return { message: 'Professeur assigné avec succès' };
  }

  // ────────────────────────────────────────────────────────────────────────

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a booking (5-hour rule applies)' })
  async cancelBooking(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<Booking> {
    return await this.bookingsService.cancelBooking(id, req.user.id);
  }

  @Patch(':id/report')
  @ApiOperation({ summary: 'Report a booking (5-hour rule applies)' })
  async reportBooking(
    @Param('id') id: string,
    @Req() req: AuthRequest,
  ): Promise<Booking> {
    return await this.bookingsService.reportBooking(id, req.user.id);
  }

  @Patch(':id/absent')
  @ApiOperation({ summary: 'Mark a booking as absent' })
  async markAbsent(@Param('id') id: string): Promise<Booking> {
    return await this.bookingsService.markAbsent(id);
  }

  @Get('teacher/upcoming')
  @ApiOperation({ summary: 'Get upcoming courses for teacher (next 2 days)' })
  async getTeacherUpcoming(@Req() req: AuthRequest): Promise<Booking[]> {
    return await this.bookingsService.findTeacherUpcoming(req.user.id);
  }

  @Get('teacher/stats')
  @ApiOperation({ summary: 'Get performance and earnings stats for teacher' })
  async getTeacherStats(@Req() req: AuthRequest): Promise<any> {
    return await this.bookingsService.getTeacherStats(req.user.id);
  }
}
