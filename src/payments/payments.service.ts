import {
  Injectable,
  InternalServerErrorException,
  RawBodyRequest,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { Request } from 'express';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private subscriptionsService: SubscriptionsService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') || '',
      {},
    );
  }

  async createCheckoutSession(subscriptionId: string, userId: number) {
    const subscription = await this.subscriptionsService.findOne(
      subscriptionId,
      userId,
    );

    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'mga',
              product_data: {
                name: subscription.planName,
                description: `Abonnement Tarakid - ${subscription.frequency} cours/semaine`,
              },
              unit_amount: subscription.pricePerMonth,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${this.configService.get<string>('WEB_URL')}/payment-success?subscriptionId=${subscription.id}`,
        cancel_url: `${this.configService.get<string>('WEB_URL')}/subscription`,
        metadata: {
          subscriptionId: subscription.id,
          userId: userId.toString(),
        },
      });

      await this.subscriptionsService.updateSessionId(
        subscription.id,
        session.id,
      );

      return { url: session.url };
    } catch (error) {
      console.error('Stripe session creation error:', error);
      throw new InternalServerErrorException(
        'Erreur lors de la création de la session de paiement',
      );
    }
  }

  async handleWebhook(req: RawBodyRequest<Request>) {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = this.configService.get<string>(
      'STRIPE_WEBHOOK_SECRET',
    );

    if (!sig || !endpointSecret || !req.rawBody) {
      throw new BadRequestException('Missing signature or secret');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        endpointSecret,
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', errorMessage);
      throw new BadRequestException(`Webhook Error: ${errorMessage}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const subscriptionId = session.metadata?.subscriptionId;

      console.log(
        `[Stripe Webhook] CHECKOUT_SESSION_COMPLETED received for subscription: ${subscriptionId}`,
      );
      console.log(
        `[Stripe Webhook] Session details:`,
        JSON.stringify(session, null, 2),
      );

      if (subscriptionId) {
        await this.subscriptionsService.activateSubscription(subscriptionId);
      }
    }

    return { received: true };
  }
}
