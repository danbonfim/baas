import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class ProToolsService {
  constructor(private prisma: PrismaService) {}

  // ─── Analytics dashboard ───────────────────────

  async getDashboard(userId: string, days: number = 30) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) throw new ForbiddenException('Apenas profissionais')

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [
      bookingsByStatus,
      earnings,
      reviewsStats,
      tipsStats,
      contentStats,
      subscriberCount,
      viewsTimeseries,
      bookingsTimeseries,
    ] = await Promise.all([
      // Bookings by status
      this.prisma.booking.groupBy({
        by: ['status'],
        where: { professionalId: pro.id, createdAt: { gte: since } },
        _count: true,
        _sum: { totalAmount: true, professionalAmount: true },
      }),

      // Total earnings
      this.prisma.earning.aggregate({
        where: { professionalId: pro.id },
        _sum: { amount: true },
        _count: true,
      }),

      // Reviews
      this.prisma.review.aggregate({
        where: { professionalId: pro.id },
        _avg: { rating: true },
        _count: true,
      }),

      // Tips
      this.prisma.tip.aggregate({
        where: { professionalId: pro.id, createdAt: { gte: since } },
        _sum: { amount: true, professionalAmount: true },
        _count: true,
      }),

      // Premium content stats
      this.prisma.premiumContent.aggregate({
        where: { professionalId: pro.id },
        _sum: { totalRevenue: true, unlockCount: true },
        _count: true,
      }),

      // Subscriber count (active)
      this.prisma.proSubscription.count({
        where: { professionalId: pro.id, status: 'ACTIVE' },
      }),

      // Profile views (last N days, daily groups — simplified: total)
      this.prisma.professional.findUniqueOrThrow({
        where: { id: pro.id },
        select: { viewCount: true },
      }),

      // Bookings per day for the last N days
      this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT DATE_TRUNC('day', "createdAt") as day, COUNT(*)::bigint as count
        FROM "Booking"
        WHERE "professionalId" = ${pro.id}
          AND "createdAt" >= ${since}
        GROUP BY day
        ORDER BY day ASC
      `,
    ])

    const bookingStatusSummary = bookingsByStatus.reduce((acc: any, row) => {
      acc[row.status] = {
        count: row._count,
        totalRevenue: row._sum.totalAmount ?? 0,
        netRevenue: row._sum.professionalAmount ?? 0,
      }
      return acc
    }, {})

    // Conversion: viewed → booked
    const totalBookings = bookingsByStatus.reduce((sum, r) => sum + r._count, 0)
    const conversionRate = viewsTimeseries.viewCount > 0
      ? Number(((totalBookings / viewsTimeseries.viewCount) * 100).toFixed(2))
      : 0

    return {
      periodDays: days,
      profile: {
        kycLevel: pro.kycLevel,
        verified: pro.verified,
        viewCount: viewsTimeseries.viewCount,
        rating: reviewsStats._avg.rating ?? 0,
        reviewCount: reviewsStats._count,
        conversionRate,
        subscriberCount,
        totalEarnings: pro.totalEarnings,
      },
      bookings: {
        byStatus: bookingStatusSummary,
        total: totalBookings,
      },
      earnings: {
        lifetime: earnings._sum.amount ?? 0,
        count: earnings._count,
      },
      tips: {
        totalReceived: tipsStats._sum.amount ?? 0,
        netReceived: tipsStats._sum.professionalAmount ?? 0,
        count: tipsStats._count,
      },
      premiumContent: {
        items: contentStats._count,
        totalRevenue: contentStats._sum.totalRevenue ?? 0,
        totalUnlocks: contentStats._sum.unlockCount ?? 0,
      },
      timeseries: {
        bookingsPerDay: bookingsTimeseries.map((r) => ({
          day: r.day,
          count: Number(r.count),
        })),
      },
    }
  }

  // ─── Vacation mode ─────────────────────────────

  async setVacationMode(userId: string, active: boolean, until?: string) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) throw new ForbiddenException('Apenas profissionais')

    // Vacation = pause profile but preserve ranking & rating
    return this.prisma.professional.update({
      where: { id: pro.id },
      data: {
        active: !active,
        online: active ? false : pro.online,
        kycDocuments: {
          ...((pro.kycDocuments as any) ?? {}),
          vacationUntil: until ? new Date(until) : null,
        } as any,
      },
      select: { active: true, online: true },
    })
  }

  // ─── Quick-reply templates ─────────────────────

  /**
   * Stored as JSON in Professional.kycDocuments (we re-use the field as a generic JSON for now;
   * a dedicated table can be added later if it grows).
   */
  async getTemplates(userId: string): Promise<{ id: string; title: string; content: string }[]> {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) throw new ForbiddenException('Apenas profissionais')
    const docs = (pro.kycDocuments as any) ?? {}
    return docs.quickReplies ?? []
  }

  async upsertTemplate(userId: string, template: { id?: string; title: string; content: string }) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) throw new ForbiddenException('Apenas profissionais')
    if (!template.title || !template.content) throw new BadRequestException('Title e content obrigatórios')

    const docs = ((pro.kycDocuments as any) ?? {}) as Record<string, any>
    const replies = (docs.quickReplies ?? []) as { id: string; title: string; content: string }[]

    if (template.id) {
      const idx = replies.findIndex((r) => r.id === template.id)
      if (idx < 0) throw new NotFoundException('Template não encontrado')
      replies[idx] = { id: template.id, title: template.title, content: template.content }
    } else {
      if (replies.length >= 20) throw new BadRequestException('Máximo de 20 templates')
      replies.push({
        id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title: template.title,
        content: template.content,
      })
    }

    await this.prisma.professional.update({
      where: { id: pro.id },
      data: { kycDocuments: { ...docs, quickReplies: replies } as any },
    })

    return replies
  }

  async deleteTemplate(userId: string, templateId: string) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) throw new ForbiddenException('Apenas profissionais')

    const docs = ((pro.kycDocuments as any) ?? {}) as Record<string, any>
    const replies = (docs.quickReplies ?? []) as { id: string; title: string; content: string }[]
    const filtered = replies.filter((r) => r.id !== templateId)

    await this.prisma.professional.update({
      where: { id: pro.id },
      data: { kycDocuments: { ...docs, quickReplies: filtered } as any },
    })

    return filtered
  }

  // ─── Fiscal report (CSV export-ready data) ─────

  /**
   * Returns structured data for fiscal export. Frontend can render CSV/PDF.
   */
  async getFiscalReport(userId: string, year: number) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) throw new ForbiddenException('Apenas profissionais')

    const start = new Date(year, 0, 1)
    const end = new Date(year + 1, 0, 1)

    const [bookings, tips, content, subscriptions] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          professionalId: pro.id,
          status: 'COMPLETED',
          createdAt: { gte: start, lt: end },
        },
        select: {
          id: true,
          date: true,
          totalAmount: true,
          platformFeeAmount: true,
          professionalAmount: true,
        },
      }),
      this.prisma.tip.findMany({
        where: { professionalId: pro.id, createdAt: { gte: start, lt: end } },
        select: { id: true, createdAt: true, amount: true, platformFeeAmount: true, professionalAmount: true },
      }),
      this.prisma.contentUnlock.findMany({
        where: { content: { professionalId: pro.id }, createdAt: { gte: start, lt: end } },
        select: { id: true, createdAt: true, amount: true, platformFeeAmount: true, professionalAmount: true },
      }),
      this.prisma.proSubscription.findMany({
        where: { professionalId: pro.id, createdAt: { gte: start, lt: end } },
        select: { id: true, startedAt: true, monthlyPrice: true },
      }),
    ])

    const totalGross =
      bookings.reduce((s, b) => s + b.totalAmount, 0) +
      tips.reduce((s, t) => s + t.amount, 0) +
      content.reduce((s, c) => s + c.amount, 0)

    const totalFees =
      bookings.reduce((s, b) => s + b.platformFeeAmount, 0) +
      tips.reduce((s, t) => s + t.platformFeeAmount, 0) +
      content.reduce((s, c) => s + c.platformFeeAmount, 0)

    const totalNet =
      bookings.reduce((s, b) => s + b.professionalAmount, 0) +
      tips.reduce((s, t) => s + t.professionalAmount, 0) +
      content.reduce((s, c) => s + c.professionalAmount, 0)

    return {
      year,
      summary: {
        totalGross: Number(totalGross.toFixed(2)),
        totalPlatformFees: Number(totalFees.toFixed(2)),
        totalNet: Number(totalNet.toFixed(2)),
        bookingsCount: bookings.length,
        tipsCount: tips.length,
        contentUnlocksCount: content.length,
        subscriptionsCount: subscriptions.length,
      },
      breakdown: { bookings, tips, contentUnlocks: content, subscriptions },
    }
  }

  // ─── Earnings withdraw status ──────────────────

  async getEarningsBalance(userId: string) {
    const pro = await this.prisma.professional.findUnique({ where: { userId } })
    if (!pro) throw new ForbiddenException('Apenas profissionais')

    const [pending, available, paid] = await Promise.all([
      this.prisma.earning.aggregate({
        where: { professionalId: pro.id, status: 'pending' },
        _sum: { amount: true },
      }),
      this.prisma.earning.aggregate({
        where: { professionalId: pro.id, status: 'available' },
        _sum: { amount: true },
      }),
      this.prisma.earning.aggregate({
        where: { professionalId: pro.id, status: 'paid' },
        _sum: { amount: true },
      }),
    ])

    return {
      pending: pending._sum.amount ?? 0,
      available: available._sum.amount ?? 0,
      paid: paid._sum.amount ?? 0,
      stripeAccountConnected: !!pro.stripeAccountId,
    }
  }
}
