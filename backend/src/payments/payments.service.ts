import { Injectable, BadRequestException, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { TipsService } from '../tips/tips.service'
import { ContentService } from '../content/content.service'
import { BoostService } from '../boost/boost.service'
import { ProSubscriptionService } from '../pro-subscription/pro-subscription.service'
import Stripe from 'stripe'

type StripeInstance = InstanceType<typeof Stripe>

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name)
  private stripe: StripeInstance

  constructor(
    private prisma: PrismaService,
    private tips: TipsService,
    private content: ContentService,
    private boost: BoostService,
    private proSubs: ProSubscriptionService,
  ) {
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
    const metadata = intent.metadata || {}
    const type = metadata.type

    try {
      // Route by payment type
      switch (type) {
        case 'TIP':
          await this.tips.finalizeTip(intent.id)
          this.logger.log(`Tip finalized for intent ${intent.id}`)
          break

        case 'CONTENT_UNLOCK':
          if (metadata.contentId && metadata.clientId) {
            await this.content.finalizeUnlock(metadata.contentId, metadata.clientId, intent.id)
            this.logger.log(`Content unlock finalized for intent ${intent.id}`)
          }
          break

        case 'BOOST':
          if (metadata.professionalId && metadata.boostType) {
            await this.boost.activateBoost(metadata.professionalId, metadata.boostType, intent.id)
            this.logger.log(`Boost activated for intent ${intent.id}`)
          }
          break

        case 'PRO_SUBSCRIPTION':
          if (metadata.clientId && metadata.professionalId) {
            await this.proSubs.finalizeSubscription(metadata.clientId, metadata.professionalId, intent.id)
            this.logger.log(`Pro subscription finalized for intent ${intent.id}`)
          }
          break

        default:
          // Default: booking payment (legacy — bookingId in metadata, no type)
          if (metadata.bookingId) {
            await this.prisma.booking.update({
              where: { id: metadata.bookingId },
              data: { paymentStatus: 'PAID', stripeChargeId: intent.latest_charge, status: 'CONFIRMED' },
            })
            this.logger.log(`Booking ${metadata.bookingId} marked as paid`)
          }
      }
    } catch (err: any) {
      this.logger.error(`Failed to handle payment_intent.succeeded ${intent.id}: ${err.message}`)
      throw err
    }
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
