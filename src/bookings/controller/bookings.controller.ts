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
  async getGlobalAvailability(): Promise<any> {
    return await this.availabilityService.getGlobalAvailability();
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
  ): Promise<{ available: string[]; full: string[] }> {
    return await this.availabilityService.getAvailableDates(
      months ? Number(months) : 2,
    );
  }
}
