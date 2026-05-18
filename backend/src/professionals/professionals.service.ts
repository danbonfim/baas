import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class ProfessionalsService {
  constructor(private prisma: PrismaService) {}

  async search(params: {
    city?: string
    category?: string
    minPrice?: number
    maxPrice?: number
    verified?: boolean
    online?: boolean
    sortBy?: string
    page?: number
    limit?: number
  }) {
    const { city, category, minPrice, maxPrice, verified, online, sortBy = 'rating', page = 1, limit = 20 } = params
    const skip = (page - 1) * limit

    const where: any = { active: true }
    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (verified !== undefined) where.verified = verified
    if (online !== undefined) where.online = online
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.pricePerHour = {}
      if (minPrice) where.pricePerHour.gte = minPrice
      if (maxPrice) where.pricePerHour.lte = maxPrice
    }
    if (category) {
      where.categories = { some: { name: { contains: category, mode: 'insensitive' } } }
    }

    const orderBy: any =
      sortBy === 'price-asc' ? { pricePerHour: 'asc' }
      : sortBy === 'price-desc' ? { pricePerHour: 'desc' }
      : sortBy === 'newest' ? { createdAt: 'desc' }
      : { rating: 'desc' }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.professional.count({ where }),
      this.prisma.professional.findMany({
        where,
        include: {
          user: { select: { name: true, avatar: true } },
          photos: { where: { approved: true }, orderBy: { order: 'asc' }, take: 3 },
          categories: true,
          languages: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
    ])

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async findBySlug(slug: string) {
    const professional = await this.prisma.professional.findUnique({
      where: { slug },
      include: {
        user: { select: { name: true, avatar: true } },
        photos: { where: { approved: true }, orderBy: { order: 'asc' } },
        categories: true,
        languages: true,
        services: true,
        availability: true,
        reviews: {
          include: { client: { include: { user: { select: { name: true } } } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!professional) throw new NotFoundException('Profissional não encontrada')

    await this.prisma.professional.update({
      where: { id: professional.id },
      data: { viewCount: { increment: 1 } },
    })

    return professional
  }

  async updateProfile(professionalId: string, data: any) {
    return this.prisma.professional.update({
      where: { id: professionalId },
      data,
    })
  }

  async toggleFavorite(clientUserId: string, professionalId: string) {
    const client = await this.prisma.client.findUnique({ where: { userId: clientUserId } })
    if (!client) throw new ForbiddenException('Client profile not found')

    const existing = await this.prisma.favorite.findUnique({
      where: { clientId_professionalId: { clientId: client.id, professionalId } },
    })

    if (existing) {
      await this.prisma.favorite.delete({
        where: { clientId_professionalId: { clientId: client.id, professionalId } },
      })
      return { favorited: false }
    } else {
      await this.prisma.favorite.create({ data: { clientId: client.id, professionalId } })
      return { favorited: true }
    }
  }

  async getFavorites(clientUserId: string) {
    const client = await this.prisma.client.findUnique({ where: { userId: clientUserId } })
    if (!client) return []
    const favs = await this.prisma.favorite.findMany({
      where: { clientId: client.id },
    })
    if (favs.length === 0) return []
    const professionalIds = favs.map(f => f.professionalId)
    const professionals = await this.prisma.professional.findMany({
      where: { id: { in: professionalIds } },
      include: {
        user: { select: { name: true, avatar: true } },
        categories: true,
      },
    })
    return favs.map(fav => ({
      id: fav.id,
      professional: professionals.find(p => p.id === fav.professionalId) ?? null,
    }))
  }

  async isFavorited(clientUserId: string, professionalId: string) {
    const client = await this.prisma.client.findUnique({ where: { userId: clientUserId } })
    if (!client) return { favorited: false }
    const fav = await this.prisma.favorite.findUnique({
      where: { clientId_professionalId: { clientId: client.id, professionalId } },
    })
    return { favorited: !!fav }
  }

  async getDashboardStats(professionalId: string) {
    const [bookings, earnings, reviews] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where: { professionalId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { client: { include: { user: { select: { name: true } } } } },
      }),
      this.prisma.earning.aggregate({
        where: { professionalId },
        _sum: { amount: true },
      }),
      this.prisma.review.aggregate({
        where: { professionalId },
        _avg: { rating: true },
        _count: true,
      }),
    ])

    return {
      recentBookings: bookings,
      totalEarnings: earnings._sum.amount ?? 0,
      averageRating: reviews._avg.rating ?? 0,
      totalReviews: reviews._count,
    }
  }
}
