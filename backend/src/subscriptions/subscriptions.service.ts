import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const StripeLib = require('stripe')

const PLANS = {
  BASIC:   { credits: 3,  price: 49.90,  stripePriceId: 'price_basic' },
  PREMIUM: { credits: 8,  price: 99.90,  stripePriceId: 'price_premium' },
  VIP:     { credits: 20, price: 199.90, stripePriceId: 'price_vip' },
}

@Injectable()
export class SubscriptionsService {
  private stripe: any

  constructor(private prisma: PrismaService) {
    this.stripe = new StripeLib(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
      apiVersion: '2026-04-22.dahlia',
    })
  }

  async subscribe(clientId: string, plan: 'BASIC' | 'PREMIUM' | 'VIP') {
    const client = await this.prisma.client.findUniqueOrThrow({
      where: { id: clientId },
      include: { user: true, subscription: true },
    })

    if (client.subscription?.status === 'ACTIVE') {
      throw new BadRequestException('Já possui uma assinatura ativa')
    }

    if (!client.stripeCustomerId) {
      const customer = await this.stripe.customers.create({ email: client.user.email })
      await this.prisma.client.update({ where: { id: clientId }, data: { stripeCustomerId: customer.id } })
    }

    const planData = PLANS[plan]
    const now = new Date()
    const periodEnd = new Date(now)
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    const subscription = await this.prisma.subscription.upsert({
      where: { clientId },
      create: {
        clientId,
        plan,
        status: 'ACTIVE',
        creditsPerCycle: planData.credits,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        stripePriceId: planData.stripePriceId,
      },
      update: {
        plan,
        status: 'ACTIVE',
        creditsPerCycle: planData.credits,
        creditsUsed: 0,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        stripePriceId: planData.stripePriceId,
      },
    })

    await this.prisma.client.update({
      where: { id: clientId },
      data: { credits: { increment: planData.credits } },
    })

    return subscription
  }

  async cancel(clientId: string) {
    const sub = await this.prisma.subscription.findUniqueOrThrow({ where: { clientId } })

    if (sub.stripeSubscriptionId) {
      await this.stripe.subscriptions.update(sub.stripeSubscriptionId, { cancel_at_period_end: true })
    }

    return this.prisma.subscription.update({
      where: { clientId },
      data: { cancelAtPeriodEnd: true },
    })
  }

  async getMy(clientId: string) {
    return this.prisma.subscription.findUnique({ where: { clientId } })
  }

  async getPlans() {
    return Object.entries(PLANS).map(([id, plan]) => ({
      id,
      credits: plan.credits,
      price: plan.price,
    }))
  }
}
