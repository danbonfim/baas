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

  async getRecentBookings() {
    return this.prisma.booking.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { include: { user: { select: { name: true } } } },
        professional: { include: { user: { select: { name: true } } } },
      },
    })
  }

  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, role: true,
          createdAt: true, banned: true,
          client: { select: { id: true } },
          professional: { select: { id: true, verified: true, kycStatus: true } },
        },
      }),
      this.prisma.user.count(),
    ])
    return { users, total, page, totalPages: Math.ceil(total / limit) }
  }
}
