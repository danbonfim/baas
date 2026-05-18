import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getPlatformStats() {
    const [users, professionals, bookings, revenue] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.professional.count(),
      this.prisma.booking.count({ where: { status: 'COMPLETED' } }),
      this.prisma.booking.aggregate({
        where: { paymentStatus: 'PAID' },
        _sum: { platformFeeAmount: true },
      }),
    ])

    return {
      totalUsers: users,
      totalProfessionals: professionals,
      completedBookings: bookings,
      platformRevenue: revenue._sum.platformFeeAmount ?? 0,
    }
  }

  async getPendingKyc() {
    return this.prisma.professional.findMany({
      where: { kycStatus: 'PENDING' },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    })
  }

  async approveKyc(professionalId: string) {
    return this.prisma.professional.update({
      where: { id: professionalId },
      data: { kycStatus: 'APPROVED', verified: true, kycReviewedAt: new Date() } as any,
    })
  }

  async banUser(userId: string, reason: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { banned: true, bannedReason: reason },
    })
  }
}
