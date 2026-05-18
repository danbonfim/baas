import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import Stripe from 'stripe'

type StripeInstance = InstanceType<typeof Stripe>

@Injectable()
export class PaymentsService {
  private stripe: StripeInstance

  constructor(private prisma: PrismaService) {
    this.stripe = new (Stripe as any)(
      process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
      { apiVersion: '2026-04-22.dahlia' }
    )
  }

  async createPaymentIntent(bookingId: string, clientId: string) {
    const booking = await this.prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { professional: true },
    })

    if (booking.clientId !== clientId) throw new BadRequestException('Acesso negado')

    const amountCents = Math.round(booking.totalAmount * 100)
    const platformFeeCents = Math.round(booking.platformFeeAmount * 100)

    const paymentIntentData: any = {
      amount: amountCents,
      currency: 'brl',
      automatic_payment_methods: { enabled: true },
      metadata: { bookingId, clientId, professionalId: booking.professionalId },
    }

    if (booking.professional.stripeAccountId) {
      paymentIntentData.transfer_data = { destination: booking.professional.stripeAccountId }
      paymentIntentData.application_fee_amount = platformFeeCents
    }

    const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData)

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { stripePaymentIntentId: paymentIntent.id },
    })

    return { clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id }
  }

  async createConnectAccount(professionalId: string, email: string) {
    const account = await this.stripe.accounts.create({
      type: 'express',
      country: 'BR',
      email,
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
    } as any)

    await this.prisma.professional.update({
      where: { id: professionalId },
      data: { stripeAccountId: account.id },
    })

    const accountLink = await this.stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/professional?stripe=refresh`,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/professional?stripe=success`,
      type: 'account_onboarding',
    })

    return { url: accountLink.url }
  }

  async createOrRetrieveCustomer(clientId: string, email: string) {
    const client = await this.prisma.client.findUniqueOrThrow({ where: { id: clientId } })

    if (client.stripeCustomerId) return { customerId: client.stripeCustomerId }

    const customer = await this.stripe.customers.create({ email, metadata: { clientId } })

    await this.prisma.client.update({ where: { id: clientId }, data: { stripeCustomerId: customer.id } })

    return { customerId: customer.id }
  }

  async handleWebhook(signature: string, body: Buffer) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
    let event: any

    try {
      event = this.stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch {
      throw new BadRequestException('Invalid webhook signature')
    }

    const existing = await this.prisma.webhookEvent.findUnique({ where: { eventId: event.id } })
    if (existing?.processed) return { received: true }

    await this.prisma.webhookEvent.upsert({
      where: { eventId: event.id },
      create: { provider: 'stripe', eventId: event.id, eventType: event.type, payload: event },
      update: {},
    })

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object)
        break
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object)
        break
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object)
        break
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object)
        break
    }

    await this.prisma.webhookEvent.update({
      where: { eventId: event.id },
      data: { processed: true, processedAt: new Date() },
    })

    return { received: true }
  }

  private async handlePaymentSucceeded(intent: any) {
    const { bookingId } = intent.metadata || {}
    if (!bookingId) return

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: 'PAID', stripeChargeId: intent.latest_charge, status: 'CONFIRMED' },
    })
  }

  private async handlePaymentFailed(intent: any) {
    const { bookingId } = intent.metadata || {}
    if (!bookingId) return

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: 'FAILED', status: 'CANCELLED' },
    })
  }

  private async handleSubscriptionUpdated(sub: any) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: sub.id },
      data: {
        status: (sub.status as string).toUpperCase() as any,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    })
  }

  private async handleSubscriptionDeleted(sub: any) {
    await this.prisma.subscription.updateMany({
      where: { stripeSubscriptionId: sub.id },
      data: { status: 'CANCELLED' },
    })
  }
}
