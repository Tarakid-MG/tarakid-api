import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  RawBodyRequest,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@ApiTags('Client - Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('create-checkout-session')
  @ApiOperation({ summary: 'Create a Stripe checkout session' })
  async createCheckoutSession(
    @Req() req: RequestWithUser,
    @Body('subscriptionId') subscriptionId: string,
  ) {
    const userId = req.user.id;
    return this.paymentsService.createCheckoutSession(subscriptionId, userId);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook receiver' })
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    return this.paymentsService.handleWebhook(req);
  }
}
