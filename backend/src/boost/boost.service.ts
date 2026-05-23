import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import Stripe from 'stripe'

type StripeInstance = InstanceType<typeof Stripe>

export interface BoostPlan {
  type: 'STANDARD' | 'PREMIUM' | 'ULTRA'
  durationDays: number
  price: number
  multiplier: number
  label: string
}

const BOOST_PLANS: Record<string, BoostPlan> = {
  STANDARD: { type: 'STANDARD', durationDays: 1, price: 50, multiplier: 2.0, label: 'Impulso 24h' },
  PREMIUM:  { type: 'PREMIUM',  durationDays: 7, price: 200, multiplier: 3.0, label: 'Impulso 7 dias' },
  ULTRA:    { type: 'ULTRA',    durationDays: 30, price: 700, multiplier: 5.0, label: 'Impulso 30 dias' },
}

@Injectable()
export class BoostService {
  private stripe: StripeInstance

  constructor(private prisma: PrismaService) {
    this.stripe = new (Stripe as any)(
      process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
      { apiVersion: '2026-04-22.dahlia' },
    )
  }

  listPlans() {
    return Object.values(BOOST_PLANS)
  }

  /**
   * Step 1: client/professional creates a payment intent for a boost purchase.
   * The boost record is created in PENDING-like state (status ACTIVE but no startsAt-until-paid pattern).
   * In production, we wait for the Stripe webhook to confirm payment before activating.
   */
  async createBoostIntent(userId: string, type: 'STANDARD' | 'PREMIUM' | 'ULTRA') {
    const plan = BOOST_PLANS[type]
    if (!plan) throw new BadRequestException('Plano inválido')

    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) throw new NotFoundException('Apenas profissionais podem comprar impulso')

    // Check if there's already an active boost
    const active = await this.prisma.boost.findFirst({
      where: { professionalId: pro.id, status: 'ACTIVE', endsAt: { gt: new Date() } },
    })
    if (active) {
      throw new BadRequestException(
        `Você já possui um impulso ativo até ${active.endsAt.toLocaleString('pt-BR')}`,
      )
    }

    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(plan.price * 100),
      currency: 'brl',
      automatic_payment_methods: { enabled: true },
      metadata: { type: 'BOOST', professionalId: pro.id, boostType: type },
    })

    return {
      plan,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    }
  }

  /**
   * Webhook handler: called when a boost payment succeeds.
   * Activates the boost for the given duration.
   */
  async activateBoost(professionalId: string, type: 'STANDARD' | 'PREMIUM' | 'ULTRA', paymentIntentId: string) {
    const plan = BOOST_PLANS[type]
    const endsAt = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000)

    return this.prisma.boost.create({
      data: {
        professionalId,
        type,
        endsAt,
        paidAmount: plan.price,
        multiplier: plan.multiplier,
        stripePaymentId: paymentIntentId,
      },
    })
  }

  async myActiveBoost(userId: string) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) return null

    return this.prisma.boost.findFirst({
      where: { professionalId: pro.id, status: 'ACTIVE', endsAt: { gt: new Date() } },
      orderBy: { endsAt: 'desc' },
    })
  }

  async myBoostHistory(userId: string) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) return []

    return this.prisma.boost.findMany({
      where: { professionalId: pro.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
  }

  /**
   * Cron: expire boosts whose endsAt has passed.
   */
  async expireOldBoosts() {
    const result = await this.prisma.boost.updateMany({
      where: { status: 'ACTIVE', endsAt: { lt: new Date() } },
      data: { status: 'EXPIRED' },
    })
    return { expired: result.count }
  }
}
