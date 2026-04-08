import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminBookingsService } from '../services/admin-bookings.service';
import { AvailabilityService } from '../services/availability.service';
import { User } from '../../users/user.entity';
import { AssignTeacherDto } from '../dto/assign-teacher.dto';
import { ReassignKidBookingsDto } from '../dto/reassign-kid-bookings.dto';
import { ReassignBatchBookingsDto } from '../dto/reassign-batch-bookings.dto';

@ApiTags('Admin Bookings')
@Controller('bookings/admin')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsAdminController {
  constructor(
    private readonly adminBookingsService: AdminBookingsService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  @Get('find-teacher')
  @ApiOperation({
    summary: 'Find first available teacher for a specific slot',
  })
  @ApiQuery({ name: 'date', example: '2026-03-20', description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'time', example: '14:00', description: 'HH:mm' })
  async findAvailableTeacher(
    @Query('date') date: string,
    @Query('time') time: string,
  ): Promise<number | null> {
    return await this.availabilityService.findAvailableTeacher(date, time);
  }

  @Get('booked-slots')
  @ApiOperation({
    summary: 'List all currently booked slots requiring a teacher',
  })
  async getAllBookedSlots(): Promise<
    { date: string; time: string; type: string; id: string | number }[]
  > {
    return await this.adminBookingsService.getAllBookedSlots();
  }

  @Get('assigned')
  @ApiOperation({
    summary: 'List all bookings that already have a teacher assigned',
  })
  async getAssignedBookings(): Promise<any[]> {
    return await this.adminBookingsService.getAssignedBookings();
  }

  @Get('history')
  @ApiOperation({
    summary: 'List all past, cancelled, absent, or missed bookings',
  })
  async getBookingHistory(): Promise<any[]> {
    return await this.adminBookingsService.getBookingHistory();
  }

  @Get(':id/details')
  @ApiOperation({ summary: 'Get booking details including kid and parent' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async getBookingDetails(@Param('id') id: string): Promise<any> {
    return await this.adminBookingsService.getBookingDetails(id);
  }

  @Get('available-teachers')
  @ApiOperation({
    summary:
      'List available teachers for a specific slot, ordered by performance',
  })
  @ApiQuery({ name: 'date', example: '2026-03-20', description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'time', example: '14:00', description: 'HH:mm' })
  async getAvailableTeachersForSlot(
    @Query('date') date: string,
    @Query('time') time: string,
  ): Promise<User[]> {
    return await this.adminBookingsService.getAvailableTeachersForSlot(
      date,
      time,
    );
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign a teacher to a booking' })
  @ApiParam({
    name: 'id',
    example: 'uuid-or-number',
    description: 'Booking ID',
  })
  async assignTeacherToBooking(
    @Param('id') id: string,
    @Body() dto: AssignTeacherDto,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    await this.adminBookingsService.assignTeacherToBooking(
      id,
      dto.type,
      dto.teacherId,
      req.user,
    );
    return { message: 'Professeur assigné avec succès' };
  }

  @Patch(':id/unassign')
  @ApiOperation({ summary: 'Unassign a teacher from a booking' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  async unassignTeacherFromBooking(
    @Param('id') id: string,
    @Body() dto: { type: 'REGULAR' | 'FREE_TRIAL' },
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    await this.adminBookingsService.unassignTeacherFromBooking(
      id,
      dto.type,
      req.user,
    );
    return { message: 'Assignation annulée' };
  }

  @Get('assignment-history')
  @ApiOperation({ summary: 'Get history of assignments' })
  async getAssignmentHistory(): Promise<any[]> {
    return await this.adminBookingsService.getAssignmentHistory();
  }

  @Patch('kid/:kidId/assign-all')
  @ApiOperation({
    summary: "Assign/Reassign all of a kid's bookings to a teacher",
  })
  @ApiParam({ name: 'kidId', example: 'kid-uuid', description: 'Kid ID' })
  async reassignKidBookings(
    @Param('kidId') kidId: string,
    @Body() dto: ReassignKidBookingsDto,
  ): Promise<{ message: string }> {
    await this.adminBookingsService.reassignKidBookings(
      kidId,
      dto.teacherId,
      dto.includeHistory,
    );
    return { message: 'Toutes les réservations ont été réassignées' };
  }

  @Patch('batch-assign')
  @ApiOperation({ summary: 'Reassign a specific batch of bookings' })
  async reassignBatchBookings(
    @Body() dto: ReassignBatchBookingsDto,
  ): Promise<{ message: string }> {
    await this.adminBookingsService.reassignBatchBookings(
      dto.bookingIds,
      dto.type,
      dto.teacherId,
    );
    return { message: 'Le lot de réservations a été réassigné' };
  }

  @Get('teacher/:id/availability')
  @ApiOperation({
    summary: "Get a specific teacher's availability (Admin only)",
  })
  async getTeacherAvailability(@Param('id') id: string) {
    return this.availabilityService.getTeacherAvailability(+id);
  }

  @Get('teacher/:id/upcoming')
  @ApiOperation({
    summary: "Get a specific teacher's upcoming sessions (Admin only)",
  })
  async getTeacherUpcoming(@Param('id') id: string) {
    return this.adminBookingsService.getTeacherUpcoming(+id);
  }
}
