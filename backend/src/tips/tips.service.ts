import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import Stripe from 'stripe'

type StripeInstance = InstanceType<typeof Stripe>

const PLATFORM_FEE_PCT = 15 // 15% platform fee on tips
const MIN_TIP = 5
const MAX_TIP = 5000

@Injectable()
export class TipsService {
  private stripe: StripeInstance

  constructor(private prisma: PrismaService) {
    this.stripe = new (Stripe as any)(
      process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
      { apiVersion: '2026-04-22.dahlia' },
    )
  }

  /**
   * Client sends a tip — creates Stripe PaymentIntent.
   * On payment success (webhook), the Tip record is finalized + earnings credited.
   */
  async createTipIntent(
    userId: string,
    data: { professionalId: string; amount: number; message?: string; isPublic?: boolean },
  ) {
    if (data.amount < MIN_TIP) throw new BadRequestException(`Gorjeta mínima é R$ ${MIN_TIP}`)
    if (data.amount > MAX_TIP) throw new BadRequestException(`Gorjeta máxima é R$ ${MAX_TIP}`)

    const client = await this.prisma.client.findUnique({ where: { userId } })
    if (!client) throw new ForbiddenException('Apenas clientes podem enviar gorjetas')

    const pro = await this.prisma.professional.findUnique({
      where: { id: data.professionalId },
      select: { id: true, stripeAccountId: true, active: true, userId: true },
    })
    if (!pro || !pro.active) throw new NotFoundException('Profissional não encontrada')

    const platformFee = Number(((data.amount * PLATFORM_FEE_PCT) / 100).toFixed(2))
    const professionalAmount = Number((data.amount - platformFee).toFixed(2))

    const intentData: any = {
      amount: Math.round(data.amount * 100),
      currency: 'brl',
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: 'TIP',
        clientId: client.id,
        professionalId: pro.id,
        message: data.message?.slice(0, 200) ?? '',
      },
    }

    if (pro.stripeAccountId) {
      intentData.transfer_data = { destination: pro.stripeAccountId }
      intentData.application_fee_amount = Math.round(platformFee * 100)
    }

    const intent = await this.stripe.paymentIntents.create(intentData)

    // Create draft tip record (paid status via webhook later)
    const tip = await this.prisma.tip.create({
      data: {
        clientId: client.id,
        professionalId: pro.id,
        amount: data.amount,
        platformFeeAmount: platformFee,
        professionalAmount,
        message: data.message,
        isPublic: data.isPublic ?? true,
        stripePaymentIntentId: intent.id,
      },
    })

    return {
      tipId: tip.id,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: data.amount,
      platformFee,
      professionalReceives: professionalAmount,
    }
  }

  /**
   * Webhook handler: payment succeeded → update earnings counters.
   */
  async finalizeTip(paymentIntentId: string) {
    const tip = await this.prisma.tip.findUnique({ where: { stripePaymentIntentId: paymentIntentId } })
    if (!tip) return

    await this.prisma.$transaction([
      this.prisma.professional.update({
        where: { id: tip.professionalId },
        data: {
          totalEarnings: { increment: tip.professionalAmount },
          totalTipsReceived: { increment: tip.amount },
        },
      }),
      this.prisma.earning.create({
        data: {
          professionalId: tip.professionalId,
          amount: tip.professionalAmount,
          status: 'pending',
        },
      }),
      this.prisma.notification.create({
        data: {
          userId: (await this.prisma.professional.findUniqueOrThrow({ where: { id: tip.professionalId } })).userId,
          title: '💸 Você recebeu uma gorjeta!',
          body: `Você recebeu R$ ${tip.professionalAmount.toFixed(2)} ${tip.message ? `com a mensagem: "${tip.message}"` : ''}`,
          type: 'TIP_RECEIVED',
          data: { tipId: tip.id, amount: tip.professionalAmount } as any,
        },
      }),
    ])

    return tip
  }

  async listMyTipsSent(userId: string) {
    const client = await this.prisma.client.findUnique({ where: { userId } })
    if (!client) return []
    return this.prisma.tip.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        professional: { select: { id: true, slug: true, user: { select: { name: true, avatar: true } } } },
      },
    })
  }

  async listMyTipsReceived(userId: string) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) return []
    return this.prisma.tip.findMany({
      where: { professionalId: pro.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        client: { select: { id: true, user: { select: { name: true, avatar: true } } } },
      },
    })
  }

  /**
   * Public-facing: list recent public tips a professional received (for social proof).
   */
  async publicProfessionalTips(professionalId: string) {
    return this.prisma.tip.findMany({
      where: { professionalId, isPublic: true, stripePaymentIntentId: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        amount: true,
        message: true,
        createdAt: true,
        client: { select: { user: { select: { name: true, avatar: true } } } },
      },
    })
  }
}
