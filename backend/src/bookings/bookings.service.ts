import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { CreateBookingDto } from './dto/create-booking.dto'

const PLATFORM_FEE = 0.15

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(clientId: string, dto: CreateBookingDto) {
    const professional = await this.prisma.professional.findUniqueOrThrow({
      where: { id: dto.professionalId },
    })

    if (!professional.pricePerHour) {
      throw new BadRequestException('Profissional sem preço configurado')
    }

    const totalAmount = professional.pricePerHour * dto.durationHours
    const platformFeeAmount = totalAmount * PLATFORM_FEE
    const professionalAmount = totalAmount - platformFeeAmount

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

  async cancel(bookingId: string, userId: string, reason?: string) {
    const booking = await this.prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { client: true, professional: true },
    })

    const canCancel =
      booking.clientId === userId ||
      booking.professional.userId === userId

    if (!canCancel) throw new ForbiddenException()
    if (['COMPLETED', 'CANCELLED'].includes(booking.status)) {
      throw new BadRequestException('Booking não pode ser cancelado')
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: userId,
        // cancellationReason: reason,
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
    ])
  }
}
