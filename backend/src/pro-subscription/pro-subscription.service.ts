import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import Stripe from 'stripe'

type StripeInstance = InstanceType<typeof Stripe>

const PLATFORM_FEE_PCT = 20 // 20% — higher than tips because we handle recurring billing
const MIN_PRICE = 15
const MAX_PRICE = 500

@Injectable()
export class ProSubscriptionService {
  private stripe: StripeInstance

  constructor(private prisma: PrismaService) {
    this.stripe = new (Stripe as any)(
      process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
      { apiVersion: '2026-04-22.dahlia' },
    )
  }

  /**
   * Professional enables/configures their individual subscription tier.
   */
  async enableSubscription(userId: string, monthlyPrice: number) {
    if (monthlyPrice < MIN_PRICE || monthlyPrice > MAX_PRICE) {
      throw new BadRequestException(`Preço mensal deve ser entre R$ ${MIN_PRICE} e R$ ${MAX_PRICE}`)
    }

    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) throw new ForbiddenException('Apenas profissionais')

    return this.prisma.professional.update({
      where: { id: pro.id },
      data: { subscriptionEnabled: true, monthlySubscriptionPrice: monthlyPrice },
      select: { subscriptionEnabled: true, monthlySubscriptionPrice: true, subscriberCount: true },
    })
  }

  async disableSubscription(userId: string) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) throw new ForbiddenException('Apenas profissionais')

    return this.prisma.professional.update({
      where: { id: pro.id },
      data: { subscriptionEnabled: false },
    })
  }

  /**
   * Client subscribes to a professional. Creates Stripe payment intent for the first month.
   * After the first successful charge, recurring billing is handled by webhooks (we'll model this here as fixed-period for simplicity).
   */
  async createSubscriptionIntent(userId: string, professionalId: string) {
    const client = await this.prisma.client.findUnique({ where: { userId } })
    if (!client) throw new ForbiddenException('Apenas clientes')

    const pro = await this.prisma.professional.findUnique({ where: { id: professionalId } })
    if (!pro) throw new NotFoundException('Profissional não encontrada')
    if (!pro.subscriptionEnabled || !pro.monthlySubscriptionPrice) {
      throw new BadRequestException('Esta profissional não oferece assinatura individual')
    }

    // Check if already subscribed
    const existing = await this.prisma.proSubscription.findUnique({
      where: { clientId_professionalId: { clientId: client.id, professionalId } },
    })
    if (existing && existing.status === 'ACTIVE') {
      throw new BadRequestException('Você já é assinante desta profissional')
    }

    const platformFee = Number(((pro.monthlySubscriptionPrice * PLATFORM_FEE_PCT) / 100).toFixed(2))
    const _professionalAmount = Number((pro.monthlySubscriptionPrice - platformFee).toFixed(2))

    const intentData: any = {
      amount: Math.round(pro.monthlySubscriptionPrice * 100),
      currency: 'brl',
      automatic_payment_methods: { enabled: true },
      metadata: { type: 'PRO_SUBSCRIPTION', clientId: client.id, professionalId },
    }

    if (pro.stripeAccountId) {
      intentData.transfer_data = { destination: pro.stripeAccountId }
      intentData.application_fee_amount = Math.round(platformFee * 100)
    }

    const intent = await this.stripe.paymentIntents.create(intentData)

    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      monthlyPrice: pro.monthlySubscriptionPrice,
      platformFee,
      professionalReceives: _professionalAmount,
    }
  }

  /**
   * Webhook: payment succeeded → create or extend subscription.
   */
  async finalizeSubscription(clientId: string, professionalId: string, paymentIntentId: string) {
    const pro = await this.prisma.professional.findUniqueOrThrow({ where: { id: professionalId } })
    const price = pro.monthlySubscriptionPrice!
    const platformFee = Number(((price * PLATFORM_FEE_PCT) / 100).toFixed(2))
    const professionalAmount = Number((price - platformFee).toFixed(2))

    const now = new Date()
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const result = await this.prisma.$transaction(async (tx) => {
      const sub = await tx.proSubscription.upsert({
        where: { clientId_professionalId: { clientId, professionalId } },
        create: {
          clientId,
          professionalId,
          monthlyPrice: price,
          status: 'ACTIVE',
          startedAt: now,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          stripeSubscriptionId: paymentIntentId,
        },
        update: {
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          cancelledAt: null,
        },
      })

      await tx.professional.update({
        where: { id: professionalId },
        data: {
          totalEarnings: { increment: professionalAmount },
          subscriberCount: { increment: 1 },
        },
      })

      await tx.earning.create({
        data: { professionalId, amount: professionalAmount, status: 'pending' },
      })

      await tx.notification.create({
        data: {
          userId: pro.userId,
          title: '🎉 Novo assinante!',
          body: `Você ganhou um novo assinante mensal. Receberá R$ ${professionalAmount.toFixed(2)} agora.`,
          type: 'NEW_SUBSCRIBER',
          data: { subscriptionId: sub.id } as any,
        },
      })

      return sub
    })

    return result
  }

  async cancelSubscription(userId: string, professionalId: string) {
    const client = await this.prisma.client.findUnique({ where: { userId } })
    if (!client) throw new ForbiddenException('Apenas clientes')

    const sub = await this.prisma.proSubscription.findUnique({
      where: { clientId_professionalId: { clientId: client.id, professionalId } },
    })
    if (!sub || sub.status !== 'ACTIVE') throw new NotFoundException('Assinatura não encontrada')

    return this.prisma.proSubscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: true, cancelledAt: new Date() },
    })
  }

  async mySubscriptions(userId: string) {
    const client = await this.prisma.client.findUnique({ where: { userId } })
    if (!client) return []
    return this.prisma.proSubscription.findMany({
      where: { clientId: client.id, status: 'ACTIVE' },
      include: {
        professional: { include: { user: { select: { name: true, avatar: true } } } },
      },
      orderBy: { startedAt: 'desc' },
    })
  }

  async mySubscribers(userId: string) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) return []
    return this.prisma.proSubscription.findMany({
      where: { professionalId: pro.id, status: 'ACTIVE' },
      include: {
        client: { include: { user: { select: { name: true, avatar: true } } } },
      },
      orderBy: { startedAt: 'desc' },
    })
  }

  /**
   * Helper: check if a client is an active subscriber of a professional.
   * Used by Stories/PremiumContent to gate access.
   */
  async isSubscriber(clientId: string, professionalId: string): Promise<boolean> {
    const sub = await this.prisma.proSubscription.findUnique({
      where: { clientId_professionalId: { clientId, professionalId } },
    })
    return !!sub && sub.status === 'ACTIVE' && sub.currentPeriodEnd > new Date()
  }

  /**
   * Cron: expire subscriptions past their period end (when cancelAtPeriodEnd is true).
   */
  async processExpiredSubscriptions() {
    const expired = await this.prisma.proSubscription.findMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: { lt: new Date() },
        cancelAtPeriodEnd: true,
      },
    })

    for (const sub of expired) {
      await this.prisma.proSubscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
      })
      await this.prisma.professional.update({
        where: { id: sub.professionalId },
        data: { subscriberCount: { decrement: 1 } },
      })
    }

    return { expired: expired.length }
  }
}
