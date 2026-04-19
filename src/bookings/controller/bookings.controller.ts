import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AvailabilityService } from '../services/availability.service';

@ApiTags('Common - Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('availability')
  @ApiOperation({ summary: 'Get global teacher availability matrix' })
  @ApiQuery({ name: 'teacherId', required: false, type: Number })
  async getGlobalAvailability(
    @Query('teacherId') teacherId?: number,
  ): Promise<any> {
    return await this.availabilityService.getGlobalAvailability(
      teacherId ? Number(teacherId) : undefined,
    );
  }

  @Get('available-dates')
  @ApiOperation({
    summary: 'Get list of available and full dates for the coming months',
  })
  @ApiQuery({
    name: 'months',
    required: false,
    type: Number,
    example: 2,
    description: 'Number of months to look ahead (default 2)',
  })
  async getAvailableDates(
    @Query('months') months?: number,
    @Query('teacherId') teacherId?: number,
  ): Promise<{ available: string[]; full: string[] }> {
    return await this.availabilityService.getAvailableDates(
      months ? Number(months) : 2,
      teacherId ? Number(teacherId) : undefined,
    );
  }
}
