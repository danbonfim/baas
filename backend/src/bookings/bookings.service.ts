import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { EmailService } from '../email/email.service'
import { CreateBookingDto } from './dto/create-booking.dto'

const PLATFORM_FEE = 0.15

/**
 * Refund policy tiers based on hours-until-booking.
 *  > 48h  → 100% refund
 *  24-48h → 75% refund
 *  12-24h → 50% refund
 *  <  12h → 0% (no-show)
 */
function refundPercent(hoursUntil: number): number {
  if (hoursUntil >= 48) return 100
  if (hoursUntil >= 24) return 75
  if (hoursUntil >= 12) return 50
  return 0
}

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  // ─── Core CRUD ─────────────────────────────────

  async create(clientId: string, dto: CreateBookingDto) {
    const professional = await this.prisma.professional.findUniqueOrThrow({
      where: { id: dto.professionalId },
    })
    if (!professional.pricePerHour) {
      throw new BadRequestException('Profissional sem preço configurado')
    }

    // Check if client is blocked by this pro
    const blocked = await this.prisma.blockedClient.findUnique({
      where: { professionalId_clientId: { professionalId: dto.professionalId, clientId } },
    })
    if (blocked) throw new ForbiddenException('Não é possível agendar com esta profissional')

    const totalAmount = professional.pricePerHour * dto.durationHours
    const platformFeeAmount = Number((totalAmount * PLATFORM_FEE).toFixed(2))
    const professionalAmount = Number((totalAmount - platformFeeAmount).toFixed(2))

    return this.prisma.booking.create({
      data: {
        clientId,
        professionalId: dto.professionalId,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        durationHours: dto.durationHours,
        location: dto.location,
        notes: dto.notes,
        totalAmount,
        platformFeePercent: PLATFORM_FEE * 100,
        platformFeeAmount,
        professionalAmount,
      },
      include: {
        professional: { include: { user: { select: { name: true } } } },
        client: { include: { user: { select: { name: true } } } },
      },
    })
  }

  async findByClient(clientId: string, status?: string) {
    return this.prisma.booking.findMany({
      where: { clientId, ...(status ? { status: status as any } : {}) },
      include: {
        professional: {
          include: {
            user: { select: { name: true } },
            photos: { take: 1, orderBy: { order: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findByProfessional(professionalId: string, status?: string) {
    return this.prisma.booking.findMany({
      where: { professionalId, ...(status ? { status: status as any } : {}) },
      include: {
        client: { include: { user: { select: { name: true, avatar: true } } } },
      },
      orderBy: { date: 'asc' },
    })
  }

  async confirm(bookingId: string, professionalId: string) {
    const booking = await this.prisma.booking.findUniqueOrThrow({ where: { id: bookingId } })
    if (booking.professionalId !== professionalId) throw new ForbiddenException()
    if (booking.status !== 'PENDING') throw new BadRequestException('Booking já processado')

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CONFIRMED' },
    })
  }

  async cancel(bookingId: string, userId: string, _reason?: string) {
    const booking = await this.prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { client: true, professional: true },
    })

    const isClient = booking.clientId === userId
    const isPro = booking.professional.userId === userId

    if (!isClient && !isPro) throw new ForbiddenException()
    if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      throw new BadRequestException('Booking não pode ser cancelado')
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: userId,
      },
    })
  }

  async complete(bookingId: string, professionalId: string) {
    const booking = await this.prisma.booking.findUniqueOrThrow({ where: { id: bookingId } })
    if (booking.professionalId !== professionalId) throw new ForbiddenException()
    if (booking.status !== 'CONFIRMED') throw new BadRequestException()

    return this.prisma.$transaction([
      this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'COMPLETED' },
      }),
      this.prisma.earning.create({
        data: {
          professionalId,
          bookingId,
          amount: booking.professionalAmount,
          status: 'available',
        },
      }),
      // Update client stats
      this.prisma.client.update({
        where: { id: booking.clientId },
        data: { completedBookings: { increment: 1 } },
      }),
    ])
  }

  // ─── Reschedule ────────────────────────────────

  async reschedule(
    bookingId: string,
    userId: string,
    data: { date: string; startTime: string; endTime: string; durationHours: number },
  ) {
    const booking = await this.prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { professional: true },
    })

    const isClient = booking.clientId === userId
    const isPro = booking.professional.userId === userId
    if (!isClient && !isPro) throw new ForbiddenException()
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new BadRequestException('Apenas bookings pendentes/confirmados podem ser reagendados')
    }

    const newDate = new Date(data.date)
    const now = new Date()
    const oldHoursUntil = (booking.date.getTime() - now.getTime()) / (1000 * 60 * 60)

    // Client must reschedule with ≥12h notice
    if (isClient && oldHoursUntil < 12) {
      throw new BadRequestException('Reagendamento exige no mínimo 12h de antecedência')
    }

    if (newDate < now) throw new BadRequestException('Nova data no passado')

    // Recompute totals based on new duration
    const pricePerHour = booking.professional.pricePerHour || 0
    const totalAmount = pricePerHour * data.durationHours
    const platformFeeAmount = Number((totalAmount * PLATFORM_FEE).toFixed(2))
    const professionalAmount = Number((totalAmount - platformFeeAmount).toFixed(2))

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        date: newDate,
        startTime: data.startTime,
        endTime: data.endTime,
        durationHours: data.durationHours,
        totalAmount,
        platformFeeAmount,
        professionalAmount,
        status: 'PENDING', // requires re-confirmation
      },
    })
  }

  // ─── Refund ────────────────────────────────────

  async requestRefund(bookingId: string, userId: string, reason?: string) {
    const booking = await this.prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { professional: true },
    })

    if (booking.clientId !== userId && booking.professional.userId !== userId) {
      throw new ForbiddenException()
    }
    if (booking.paymentStatus !== 'PAID') {
      throw new BadRequestException('Apenas bookings pagos podem ser reembolsados')
    }
    if (booking.status === 'COMPLETED') {
      throw new BadRequestException('Bookings concluídos não podem ser reembolsados')
    }

    const now = new Date()
    const hoursUntil = (booking.date.getTime() - now.getTime()) / (1000 * 60 * 60)

    // If pro cancels → always 100% refund
    const isProCancellation = booking.professional.userId === userId
    const refundPct = isProCancellation ? 100 : refundPercent(hoursUntil)

    const refundAmount = Number(((booking.totalAmount * refundPct) / 100).toFixed(2))

    return this.prisma.$transaction(async (tx) => {
      // Update booking
      const updated = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          paymentStatus: refundPct === 100 ? 'REFUNDED' : booking.paymentStatus,
          cancelledAt: now,
          cancelledBy: userId,
        },
      })

      // Update client stats (count toward cancellation rate)
      if (!isProCancellation) {
        await tx.client.update({
          where: { id: booking.clientId },
          data: { cancelledBookings: { increment: 1 } },
        })
      }

      // Create refund transaction
      await tx.transaction.create({
        data: {
          clientId: booking.clientId,
          amount: refundAmount,
          type: 'refund',
          description: `Reembolso booking ${bookingId} (${refundPct}%)${reason ? ` — ${reason}` : ''}`,
          metadata: { bookingId, refundPct, isProCancellation } as any,
        },
      })

      return {
        booking: updated,
        refundAmount,
        refundPct,
        message:
          refundPct === 100
            ? 'Reembolso integral autorizado'
            : `Reembolso parcial de ${refundPct}% (R$ ${refundAmount.toFixed(2)})`,
      }
    })
  }

  // ─── Recurring bookings ────────────────────────

  /**
   * Create multiple bookings in one call (e.g. "every Thursday at 8pm for 4 weeks").
   */
  async createRecurring(
    clientId: string,
    data: {
      professionalId: string
      startDate: string
      startTime: string
      endTime: string
      durationHours: number
      location?: string
      notes?: string
      recurrence: 'weekly' | 'biweekly' | 'monthly'
      occurrences: number
    },
  ) {
    if (data.occurrences < 2 || data.occurrences > 12) {
      throw new BadRequestException('Recorrência aceita entre 2 e 12 ocorrências')
    }

    const professional = await this.prisma.professional.findUniqueOrThrow({
      where: { id: data.professionalId },
    })
    if (!professional.pricePerHour) {
      throw new BadRequestException('Profissional sem preço configurado')
    }

    const blocked = await this.prisma.blockedClient.findUnique({
      where: { professionalId_clientId: { professionalId: data.professionalId, clientId } },
    })
    if (blocked) throw new ForbiddenException('Não é possível agendar com esta profissional')

    const totalAmount = professional.pricePerHour * data.durationHours
    const platformFeeAmount = Number((totalAmount * PLATFORM_FEE).toFixed(2))
    const professionalAmount = Number((totalAmount - platformFeeAmount).toFixed(2))

    const intervalDays = data.recurrence === 'weekly' ? 7 : data.recurrence === 'biweekly' ? 14 : 30
    const base = new Date(data.startDate)

    const bookings: any[] = []
    for (let i = 0; i < data.occurrences; i++) {
      const date = new Date(base.getTime() + i * intervalDays * 24 * 60 * 60 * 1000)
      bookings.push({
        clientId,
        professionalId: data.professionalId,
        date,
        startTime: data.startTime,
        endTime: data.endTime,
        durationHours: data.durationHours,
        location: data.location,
        notes: data.notes ? `${data.notes} (recorrente ${i + 1}/${data.occurrences})` : `Recorrente ${i + 1}/${data.occurrences}`,
        totalAmount,
        platformFeePercent: PLATFORM_FEE * 100,
        platformFeeAmount,
        professionalAmount,
      })
    }

    const result = await this.prisma.booking.createManyAndReturn({ data: bookings })

    return {
      total: result.length,
      totalPrice: totalAmount * result.length,
      bookings: result,
    }
  }

  // ─── Upcoming reminders (cron-callable) ────────

  /**
   * Find bookings happening in the next 24h that haven't been reminded yet.
   * Returns the list — caller is responsible for sending notifications/emails.
   */
  async findUpcomingForReminder(hoursAhead: number = 24) {
    const now = new Date()
    const target = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000)
    const windowStart = new Date(target.getTime() - 30 * 60 * 1000)
    const windowEnd = new Date(target.getTime() + 30 * 60 * 1000)

    return this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        date: { gte: windowStart, lte: windowEnd },
      },
      include: {
        client: { include: { user: { select: { name: true, email: true, phone: true } } } },
        professional: { include: { user: { select: { name: true, email: true, phone: true } } } },
      },
    })
  }

  /**
   * Cron task: send reminders for upcoming bookings.
   * Audit log records that reminders were sent to avoid duplicates.
   */
  async sendUpcomingReminders() {
    const upcoming24h = await this.findUpcomingForReminder(24)
    let sent = 0

    for (const b of upcoming24h) {
      // De-duplicate via audit log
      const alreadySent = await this.prisma.auditLog.findFirst({
        where: { action: 'REMINDER_24H', resourceId: b.id },
      })
      if (alreadySent) continue

      // In-app notification for both parties
      await this.prisma.notification.createMany({
        data: [
          {
            userId: b.client.userId,
            title: '⏰ Lembrete: encontro amanhã',
            body: `Você tem um agendamento com ${b.professional.user.name} amanhã às ${b.startTime}`,
            type: 'BOOKING_REMINDER',
            data: { bookingId: b.id } as any,
          },
          {
            userId: b.professional.userId,
            title: '⏰ Lembrete: encontro amanhã',
            body: `Você tem um agendamento com ${b.client.user.name} amanhã às ${b.startTime}`,
            type: 'BOOKING_REMINDER',
            data: { bookingId: b.id } as any,
          },
        ],
      }).catch(() => {})

      // Record audit so we don't send again
      await this.prisma.auditLog.create({
        data: { action: 'REMINDER_24H', resource: 'Booking', resourceId: b.id },
      }).catch(() => {})

      sent++
    }

    return { reminded: sent }
  }
}
