import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { EmailService } from '../email/email.service'

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name)

  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  // ─── Emergency Contacts ────────────────────────

  async listContacts(userId: string) {
    return this.prisma.emergencyContact.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    })
  }

  async createContact(
    userId: string,
    data: { name: string; phone: string; email?: string; relationship?: string; isPrimary?: boolean },
  ) {
    const existing = await this.prisma.emergencyContact.count({ where: { userId } })
    if (existing >= 3) throw new BadRequestException('Máximo de 3 contatos de emergência')

    if (data.isPrimary) {
      await this.prisma.emergencyContact.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      })
    }

    return this.prisma.emergencyContact.create({
      data: { ...data, userId, isPrimary: data.isPrimary ?? existing === 0 },
    })
  }

  async deleteContact(userId: string, contactId: string) {
    const contact = await this.prisma.emergencyContact.findUnique({ where: { id: contactId } })
    if (!contact) throw new NotFoundException('Contato não encontrado')
    if (contact.userId !== userId) throw new ForbiddenException('Acesso negado')
    await this.prisma.emergencyContact.delete({ where: { id: contactId } })
    return { deleted: true }
  }

  // ─── Safety Check-ins ──────────────────────────

  /**
   * Create a check-in cycle for an active booking.
   * The professional must confirm within `intervalMinutes` minutes; otherwise
   * the cron escalates.
   */
  async createCheckin(
    professionalId: string,
    bookingId: string | null,
    intervalMinutes: number = 60,
    location?: { lat: number; lng: number },
  ) {
    if (bookingId) {
      const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } })
      if (!booking) throw new NotFoundException('Booking não encontrado')
      if (booking.professionalId !== professionalId) throw new ForbiddenException('Acesso negado')
    }

    const expectedAt = new Date(Date.now() + intervalMinutes * 60 * 1000)
    return this.prisma.safetyCheckin.create({
      data: {
        professionalId,
        bookingId,
        expectedAt,
        lat: location?.lat,
        lng: location?.lng,
      },
    })
  }

  async confirmCheckin(professionalId: string, checkinId: string, location?: { lat: number; lng: number }) {
    const checkin = await this.prisma.safetyCheckin.findUnique({ where: { id: checkinId } })
    if (!checkin) throw new NotFoundException('Check-in não encontrado')
    if (checkin.professionalId !== professionalId) throw new ForbiddenException('Acesso negado')
    if (checkin.status === 'CONFIRMED') throw new BadRequestException('Já confirmado')

    return this.prisma.safetyCheckin.update({
      where: { id: checkinId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        lat: location?.lat ?? checkin.lat,
        lng: location?.lng ?? checkin.lng,
      },
    })
  }

  async listActiveCheckins(professionalId: string) {
    return this.prisma.safetyCheckin.findMany({
      where: { professionalId, status: { in: ['PENDING', 'MISSED'] } },
      orderBy: { expectedAt: 'asc' },
    })
  }

  /**
   * Cron-callable: find all checkins that should have been confirmed but weren't,
   * and escalate them. Returns an array of escalated checkins for downstream
   * notification handlers.
   */
  async processOverdueCheckins() {
    const now = new Date()
    const overdueGrace = new Date(now.getTime() - 15 * 60 * 1000) // 15 min grace

    const overdue = await this.prisma.safetyCheckin.findMany({
      where: {
        status: 'PENDING',
        expectedAt: { lt: overdueGrace },
      },
      include: {
        professional: {
          include: { user: { include: { emergencyContacts: true } } },
        },
      },
    })

    const escalated: any[] = []
    for (const c of overdue) {
      const newLevel = c.escalationLevel + 1
      const updated = await this.prisma.safetyCheckin.update({
        where: { id: c.id },
        data: {
          status: newLevel >= 3 ? 'ESCALATED' : 'MISSED',
          escalatedAt: new Date(),
          escalationLevel: newLevel,
        },
      })

      const user = c.professional.user

      await this.prisma.notification.create({
        data: {
          userId: user.id,
          title: '⚠️ Check-in de segurança não confirmado',
          body: `Você não confirmou seu check-in. Por favor, confirme agora.`,
          type: 'SAFETY_CHECKIN_MISSED',
          data: { checkinId: c.id, level: newLevel },
        },
      })

      // Email cascade:
      // Level 1-2: notify the professional themselves
      // Level 3+: notify all emergency contacts with email
      if (newLevel < 3) {
        this.email
          .sendCheckinEscalation(
            { email: user.email, name: user.name },
            { professionalName: user.name, expectedAt: c.expectedAt, level: newLevel, lat: c.lat, lng: c.lng },
          )
          .catch((err) => this.logger.error(`Self checkin email failed: ${err.message}`))
      } else {
        for (const contact of user.emergencyContacts) {
          if (!contact.email) continue
          this.email
            .sendCheckinEscalation(
              { email: contact.email, name: contact.name },
              { professionalName: user.name, expectedAt: c.expectedAt, level: newLevel, lat: c.lat, lng: c.lng },
            )
            .catch((err) => this.logger.error(`Contact checkin email failed: ${err.message}`))
        }
      }

      escalated.push({ checkin: updated, contacts: user.emergencyContacts })
    }

    return { escalatedCount: escalated.length, escalated }
  }

  // ─── Panic Alerts ──────────────────────────────

  /**
   * Trigger a panic alert. Records location, audio URL (optional), and notifies
   * all emergency contacts.
   */
  async triggerPanic(
    userId: string,
    data: {
      lat?: number
      lng?: number
      accuracy?: number
      message?: string
      audioUrl?: string
      bookingId?: string
    },
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { emergencyContacts: true },
    })

    // Check for active alert (debounce — don't allow spamming)
    const activeAlert = await this.prisma.panicAlert.findFirst({
      where: { userId, status: 'ACTIVE' },
    })
    if (activeAlert) {
      // Update the existing alert with new location
      return this.prisma.panicAlert.update({
        where: { id: activeAlert.id },
        data: {
          lat: data.lat ?? activeAlert.lat,
          lng: data.lng ?? activeAlert.lng,
          accuracy: data.accuracy ?? activeAlert.accuracy,
          message: data.message ?? activeAlert.message,
          audioUrl: data.audioUrl ?? activeAlert.audioUrl,
        },
      })
    }

    const contactsSnapshot = user.emergencyContacts.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      isPrimary: c.isPrimary,
    }))

    const alert = await this.prisma.panicAlert.create({
      data: {
        userId,
        bookingId: data.bookingId,
        lat: data.lat,
        lng: data.lng,
        accuracy: data.accuracy,
        message: data.message,
        audioUrl: data.audioUrl,
        contactsNotified: contactsSnapshot,
      },
    })

    // Create high-priority notification
    await this.prisma.notification.create({
      data: {
        userId,
        title: '🆘 Alerta de pânico ativado',
        body: 'Seus contatos de emergência foram avisados. Estamos com você.',
        type: 'PANIC_TRIGGERED',
        data: { alertId: alert.id, contactsCount: contactsSnapshot.length },
      },
    })

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'PANIC_TRIGGERED',
        resource: 'PanicAlert',
        resourceId: alert.id,
        details: { lat: data.lat, lng: data.lng, contactsCount: contactsSnapshot.length } as any,
      },
    })

    // Fire-and-forget email notifications to all emergency contacts (with email)
    this.email
      .sendPanicAlerts(
        user.emergencyContacts.map((c) => ({ name: c.name, phone: c.phone, email: c.email ?? undefined })),
        {
          userName: user.name,
          userPhone: user.phone,
          lat: data.lat,
          lng: data.lng,
          message: data.message,
          triggeredAt: alert.triggeredAt,
        },
      )
      .then((results) => {
        this.logger.log(`Panic alert ${alert.id}: emails sent → ${JSON.stringify(results)}`)
        // Update the alert with email delivery status
        return this.prisma.panicAlert
          .update({
            where: { id: alert.id },
            data: { contactsNotified: { contacts: contactsSnapshot, emailResults: results } as any },
          })
          .catch(() => {})
      })
      .catch((err) => this.logger.error('Email panic notification failed', err))

    return alert
  }

  async resolveAlert(userId: string, alertId: string, resolution: 'RESOLVED' | 'FALSE_ALARM', note?: string) {
    const alert = await this.prisma.panicAlert.findUnique({ where: { id: alertId } })
    if (!alert) throw new NotFoundException('Alerta não encontrado')
    if (alert.userId !== userId) throw new ForbiddenException('Acesso negado')
    if (alert.status !== 'ACTIVE') throw new BadRequestException('Alerta já resolvido')

    return this.prisma.panicAlert.update({
      where: { id: alertId },
      data: {
        status: resolution,
        resolvedAt: new Date(),
        resolution: note,
      },
    })
  }

  async listAlerts(userId: string) {
    return this.prisma.panicAlert.findMany({
      where: { userId },
      orderBy: { triggeredAt: 'desc' },
      take: 20,
    })
  }

  // ─── Client Verification (reverse review) ───────

  async getClientPublicProfile(clientId: string, requesterProfessionalId: string) {
    const isBlocked = await this.prisma.blockedClient.findUnique({
      where: { professionalId_clientId: { professionalId: requesterProfessionalId, clientId } },
    })

    const client = await this.prisma.client.findUniqueOrThrow({
      where: { id: clientId },
      include: {
        user: { select: { name: true, createdAt: true } },
        clientReviews: {
          select: { rating: true, punctuality: true, respectful: true, paidOnTime: true, comment: true, createdAt: true },
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return {
      memberSince: client.user.createdAt,
      completedBookings: client.completedBookings,
      cancelledBookings: client.cancelledBookings,
      noShowCount: client.noShowCount,
      reputationScore: client.reputationScore,
      averageRatingFromPros: client.averageRatingFromPros,
      recentReviews: client.clientReviews,
      blockedByYou: !!isBlocked,
    }
  }

  // ─── Blocking ──────────────────────────────────

  async blockClient(professionalId: string, clientId: string, reason?: string) {
    return this.prisma.blockedClient.upsert({
      where: { professionalId_clientId: { professionalId, clientId } },
      create: { professionalId, clientId, reason },
      update: { reason },
    })
  }

  async unblockClient(professionalId: string, clientId: string) {
    await this.prisma.blockedClient.delete({
      where: { professionalId_clientId: { professionalId, clientId } },
    }).catch(() => {})
    return { unblocked: true }
  }

  async listBlocked(professionalId: string) {
    return this.prisma.blockedClient.findMany({
      where: { professionalId },
      include: {
        client: { include: { user: { select: { name: true, email: true } } } },
      },
    })
  }

  // ─── Client Reviews (reverse) ──────────────────

  async createClientReview(
    professionalId: string,
    data: {
      bookingId: string
      rating: number
      punctuality?: number
      respectful?: boolean
      paidOnTime?: boolean
      comment?: string
    },
  ) {
    const booking = await this.prisma.booking.findUnique({ where: { id: data.bookingId } })
    if (!booking) throw new NotFoundException('Booking não encontrado')
    if (booking.professionalId !== professionalId) throw new ForbiddenException('Acesso negado')
    if (booking.status !== 'COMPLETED') throw new BadRequestException('Booking não concluído')

    const review = await this.prisma.clientReview.create({
      data: {
        bookingId: data.bookingId,
        clientId: booking.clientId,
        professionalId,
        rating: data.rating,
        punctuality: data.punctuality,
        respectful: data.respectful ?? true,
        paidOnTime: data.paidOnTime ?? true,
        comment: data.comment,
      },
    })

    // Recompute reputation score
    const stats = await this.prisma.clientReview.aggregate({
      where: { clientId: booking.clientId },
      _avg: { rating: true },
      _count: true,
    })

    await this.prisma.client.update({
      where: { id: booking.clientId },
      data: {
        averageRatingFromPros: stats._avg.rating ?? 0,
        reputationScore: this.calcReputation(stats._avg.rating ?? 0, stats._count, booking.clientId),
      },
    })

    return review
  }

  private calcReputation(avgRating: number, reviewCount: number, _clientId: string): number {
    // Simple Bayesian-ish formula: weight rating by count.
    // 5 stars * (count / (count + 5)) — newer clients carry less weight
    const weighted = avgRating * (reviewCount / (reviewCount + 5))
    return Math.round(weighted * 20) // 0-100 scale
  }
}
