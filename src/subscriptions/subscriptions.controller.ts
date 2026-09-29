import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('Client - Subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new subscription' })
  async create(
    @Req() req: RequestWithUser,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(req.user.id, createSubscriptionDto);
  }

  @Get('my-subscriptions')
  @ApiOperation({ summary: 'Get all subscriptions for current user' })
  async getMySubscriptions(@Req() req: RequestWithUser) {
    return this.subscriptionsService.findByUser(req.user.id);
  }

  @Get('kid/:kidId')
  @ApiOperation({ summary: 'Get subscriptions for a specific kid' })
  async getKidSubscriptions(@Param('kidId') kidId: string) {
    return this.subscriptionsService.findByKid(kidId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription details' })
  async getSubscription(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.subscriptionsService.findOne(id, req.user.id);
  }
}
