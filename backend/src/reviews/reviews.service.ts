import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(clientUserId: string, dto: { bookingId: string; rating: number; comment?: string }) {
    // Find client profile
    const client = await this.prisma.client.findUnique({ where: { userId: clientUserId } })
    if (!client) throw new ForbiddenException('Client profile not found')

    // Verify booking is COMPLETED and belongs to this client
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { review: true },
    })
    if (!booking) throw new BadRequestException('Booking not found')
    if (booking.clientId !== client.id) throw new ForbiddenException('Not your booking')
    if (booking.status !== 'COMPLETED') throw new BadRequestException('Booking must be completed to review')
    if (booking.review) throw new BadRequestException('Review already submitted')

    const review = await this.prisma.review.create({
      data: {
        bookingId: dto.bookingId,
        clientId: client.id,
        professionalId: booking.professionalId,
        rating: dto.rating,
        comment: dto.comment,
      },
    })

    // Update professional's average rating
    const agg = await this.prisma.review.aggregate({
      where: { professionalId: booking.professionalId },
      _avg: { rating: true },
      _count: true,
    })
    await this.prisma.professional.update({
      where: { id: booking.professionalId },
      data: {
        rating: agg._avg.rating ?? 0,
        reviewCount: agg._count,
      },
    })

    return review
  }

  async getProfessionalReviews(professionalId: string) {
    return this.prisma.review.findMany({
      where: { professionalId },
      include: {
        client: { include: { user: { select: { name: true, avatar: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  async getReviewableBookings(clientUserId: string) {
    const client = await this.prisma.client.findUnique({ where: { userId: clientUserId } })
    if (!client) return []

    return this.prisma.booking.findMany({
      where: { clientId: client.id, status: 'COMPLETED', review: null },
      include: {
        professional: { include: { user: { select: { name: true, avatar: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
