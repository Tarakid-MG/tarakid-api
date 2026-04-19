import { Controller } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Client - Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /*
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
  */
}
