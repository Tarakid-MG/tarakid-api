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
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BookingsService } from '../services/bookings.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { Booking } from '../entities/booking.entity';
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface';

@ApiTags('Client - Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsClientController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create one or more bookings' })
  async create(
    @Req() req: RequestWithUser,
    @Body() createBookingDto: CreateBookingDto,
  ): Promise<Booking[]> {
    const userId = req.user.id; // id du parent
    return await this.bookingsService.create(userId, createBookingDto);
  }

  @Get('kid/:kidId')
  @ApiOperation({ summary: 'Get all bookings for a specific kid' })
  @ApiParam({ name: 'kidId', example: 'kid-uuid', description: 'Kid ID' })
  async getKidBookings(
    @Param('kidId') kidId: string,
    @Req() req: RequestWithUser,
  ): Promise<Booking[]> {
    const userId = req.user.id; // id du parent
    return await this.bookingsService.findByKid(kidId, userId);
  }

  @Get('upcoming/:kidId')
  @ApiOperation({ summary: 'Get upcoming bookings for a specific kid' })
  @ApiParam({ name: 'kidId', example: 'kid-uuid', description: 'Kid ID' })
  async getUpcomingBookings(
    @Param('kidId') kidId: string,
    @Req() req: RequestWithUser,
  ): Promise<Booking[]> {
    return await this.bookingsService.findUpcoming(kidId, req.user.id);
  }

  @Get('subscription/:subscriptionId')
  @ApiOperation({ summary: 'Get bookings associated with a subscription' })
  @ApiParam({
    name: 'subscriptionId',
    example: 'sub-uuid',
    description: 'Subscription ID',
  })
  async getSubscriptionBookings(
    @Param('subscriptionId') subscriptionId: string,
    @Req() req: RequestWithUser,
  ): Promise<Booking[]> {
    return await this.bookingsService.findBySubscription(
      subscriptionId,
      req.user.id,
    );
  }

  @Get('suggested-schedule')
  @ApiOperation({ summary: 'Get suggested schedules for a subscription' })
  @ApiQuery({
    name: 'subscriptionId',
    example: 'sub-uuid',
    description: 'Subscription ID',
  })
  async getSuggestedSchedules(
    @Query('subscriptionId') subscriptionId: string,
  ): Promise<any[]> {
    return await this.bookingsService.getSuggestedSchedules(subscriptionId);
  }

  // ────────────────────────────────────────────────────────────────────────

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a booking (5-hour rule applies)' })
  @ApiParam({ name: 'id', example: 'booking-uuid', description: 'Booking ID' })
  async cancelBooking(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Booking> {
    return await this.bookingsService.cancelBooking(id, req.user.id);
  }

  @Patch(':id/report')
  @ApiOperation({ summary: 'Report a booking (5-hour rule applies)' })
  @ApiParam({ name: 'id', example: 'booking-uuid', description: 'Booking ID' })
  async reportBooking(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<Booking> {
    return await this.bookingsService.reportBooking(id, req.user.id);
  }
}
