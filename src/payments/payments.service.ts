import { Injectable, BadRequestException } from '@nestjs/common';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class PaymentsService {
  constructor(private subscriptionsService: SubscriptionsService) {}

  createCheckoutSession() {
    throw new BadRequestException('Paiement Stripe désactivé');
  }

  handleWebhook() {
    return { received: true };
  }
}
