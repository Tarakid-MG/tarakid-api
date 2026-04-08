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

  @Get('stats')
  @ApiOperation({ summary: 'Get performance and earnings stats for teacher' })
  async getTeacherStats(@Req() req: AuthRequest): Promise<any> {
    return await this.teacherBookingsService.getTeacherStats(req.user.id);
  }
}
