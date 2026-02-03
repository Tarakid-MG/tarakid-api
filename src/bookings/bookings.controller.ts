import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  Req,
  Param,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create booking(s)' })
  async create(@Req() req: any, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(req.user.id, createBookingDto);
  }

  @Get('kid/:kidId')
  @ApiOperation({ summary: 'Get all bookings for a kid' })
  async getKidBookings(@Param('kidId') kidId: string, @Req() req: any) {
    return this.bookingsService.findByKid(kidId, req.user.id);
  }

  @Get('upcoming/:kidId')
  @ApiOperation({ summary: 'Get upcoming bookings for a kid' })
  async getUpcomingBookings(@Param('kidId') kidId: string, @Req() req: any) {
    return this.bookingsService.findUpcoming(kidId, req.user.id);
  }

  @Get('subscription/:subscriptionId')
  @ApiOperation({ summary: 'Get bookings for a subscription' })
  async getSubscriptionBookings(
    @Param('subscriptionId') subscriptionId: string,
    @Req() req: any,
  ) {
    return this.bookingsService.findBySubscription(subscriptionId, req.user.id);
  }

  @Get('suggested-schedule')
  @ApiOperation({ summary: 'Get suggested schedules for a subscription' })
  async getSuggestedSchedules(@Query('subscriptionId') subscriptionId: string) {
    return this.bookingsService.getSuggestedSchedules(subscriptionId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a booking' })
  async cancelBooking(@Param('id') id: string, @Req() req: any) {
    return this.bookingsService.cancelBooking(id, req.user.id);
  }
}
