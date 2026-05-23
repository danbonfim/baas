import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import Stripe from 'stripe'

type StripeInstance = InstanceType<typeof Stripe>

const PLATFORM_FEE_PCT = 15
const MIN_PRICE = 3
const MAX_PRICE = 1000

@Injectable()
export class ContentService {
  private stripe: StripeInstance

  constructor(private prisma: PrismaService) {
    this.stripe = new (Stripe as any)(
      process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
      { apiVersion: '2026-04-22.dahlia' },
    )
  }

  /**
   * Professional uploads premium content (already-uploaded URLs).
   */
  async createContent(
    userId: string,
    data: {
      type: 'PHOTO' | 'VIDEO' | 'AUDIO'
      url: string
      thumbnailUrl?: string
      blurUrl?: string
      title?: string
      description?: string
      price: number
      durationSeconds?: number
    },
  ) {
    if (data.price < MIN_PRICE || data.price > MAX_PRICE) {
      throw new BadRequestException(`Preço deve ser entre R$ ${MIN_PRICE} e R$ ${MAX_PRICE}`)
    }

    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) throw new ForbiddenException('Apenas profissionais podem criar conteúdo')

    return this.prisma.premiumContent.create({
      data: { ...data, professionalId: pro.id },
    })
  }

  async listProfessionalContent(professionalId: string, viewerUserId?: string) {
    const items = await this.prisma.premiumContent.findMany({
      where: { professionalId, visible: true },
      orderBy: { createdAt: 'desc' },
    })

    // If a logged-in user is viewing, check unlocks
    let unlockedIds = new Set<string>()
    if (viewerUserId) {
      const client = await this.prisma.client.findUnique({ where: { userId: viewerUserId } })
      if (client) {
        const unlocks = await this.prisma.contentUnlock.findMany({
          where: { clientId: client.id, contentId: { in: items.map((i) => i.id) } },
          select: { contentId: true },
        })
        unlockedIds = new Set(unlocks.map((u) => u.contentId))
      }
    }

    return items.map((item) => {
      const unlocked = unlockedIds.has(item.id)
      return {
        ...item,
        // Hide the real URL if not unlocked — show blurred preview instead
        url: unlocked ? item.url : null,
        blurUrl: item.blurUrl ?? item.thumbnailUrl ?? null,
        unlocked,
      }
    })
  }

  /**
   * Client purchases unlock for premium content.
   * Returns Stripe payment intent.
   */
  async createUnlockIntent(userId: string, contentId: string) {
    const client = await this.prisma.client.findUnique({ where: { userId } })
    if (!client) throw new ForbiddenException('Apenas clientes podem desbloquear conteúdo')

    // Already unlocked?
    const existing = await this.prisma.contentUnlock.findUnique({
      where: { contentId_clientId: { contentId, clientId: client.id } },
    })
    if (existing) {
      const content = await this.prisma.premiumContent.findUniqueOrThrow({ where: { id: contentId } })
      return { alreadyUnlocked: true, url: content.url }
    }

    const content = await this.prisma.premiumContent.findUnique({
      where: { id: contentId },
      include: { professional: { select: { stripeAccountId: true, id: true } } },
    })
    if (!content || !content.visible) throw new NotFoundException('Conteúdo não disponível')

    const platformFee = Number(((content.price * PLATFORM_FEE_PCT) / 100).toFixed(2))
    const professionalAmount = Number((content.price - platformFee).toFixed(2))

    const intentData: any = {
      amount: Math.round(content.price * 100),
      currency: 'brl',
      automatic_payment_methods: { enabled: true },
      metadata: { type: 'CONTENT_UNLOCK', contentId, clientId: client.id },
    }

    if (content.professional.stripeAccountId) {
      intentData.transfer_data = { destination: content.professional.stripeAccountId }
      intentData.application_fee_amount = Math.round(platformFee * 100)
    }

    const intent = await this.stripe.paymentIntents.create(intentData)

    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      price: content.price,
      platformFee,
      professionalReceives: professionalAmount,
    }
  }

  /**
   * Webhook: payment succeeded → create unlock record and credit professional.
   */
  async finalizeUnlock(contentId: string, clientId: string, paymentIntentId: string) {
    const content = await this.prisma.premiumContent.findUnique({ where: { id: contentId } })
    if (!content) return

    const platformFee = Number(((content.price * PLATFORM_FEE_PCT) / 100).toFixed(2))
    const professionalAmount = Number((content.price - platformFee).toFixed(2))

    return this.prisma.$transaction(async (tx) => {
      const unlock = await tx.contentUnlock.upsert({
        where: { contentId_clientId: { contentId, clientId } },
        create: {
          contentId,
          clientId,
          amount: content.price,
          platformFeeAmount: platformFee,
          professionalAmount,
          stripePaymentIntentId: paymentIntentId,
        },
        update: {},
      })

      await tx.premiumContent.update({
        where: { id: contentId },
        data: {
          unlockCount: { increment: 1 },
          totalRevenue: { increment: content.price },
        },
      })

      await tx.professional.update({
        where: { id: content.professionalId },
        data: { totalEarnings: { increment: professionalAmount } },
      })

      await tx.earning.create({
        data: { professionalId: content.professionalId, amount: professionalAmount, status: 'pending' },
      })

      return unlock
    })
  }

  async updateContent(userId: string, contentId: string, data: { title?: string; description?: string; price?: number; visible?: boolean }) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) throw new ForbiddenException('Acesso negado')

    const content = await this.prisma.premiumContent.findUnique({ where: { id: contentId } })
    if (!content || content.professionalId !== pro.id) throw new NotFoundException('Conteúdo não encontrado')

    if (data.price !== undefined && (data.price < MIN_PRICE || data.price > MAX_PRICE)) {
      throw new BadRequestException(`Preço inválido (R$ ${MIN_PRICE} - R$ ${MAX_PRICE})`)
    }

    return this.prisma.premiumContent.update({ where: { id: contentId }, data })
  }

  async deleteContent(userId: string, contentId: string) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) throw new ForbiddenException('Acesso negado')

    const content = await this.prisma.premiumContent.findUnique({ where: { id: contentId } })
    if (!content || content.professionalId !== pro.id) throw new NotFoundException('Conteúdo não encontrado')

    // Soft delete to preserve unlocks
    await this.prisma.premiumContent.update({ where: { id: contentId }, data: { visible: false } })
    return { deleted: true }
  }

  async listMyContent(userId: string) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) return []
    return this.prisma.premiumContent.findMany({
      where: { professionalId: pro.id },
      orderBy: { createdAt: 'desc' },
    })
  }
}
